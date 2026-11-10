/** MetaWinners Jam: dependency-free arcade basketball simulation.
 * Coordinates are a 1000 × 600 court. Player and ball heights are pixels above
 * their ground position; the renderer is deliberately independent of gameplay.
 */
export const COURT = Object.freeze({ width: 1000, height: 600, left: 70, right: 930, top: 50, bottom: 550, rimHeight: 160 });
export const HOOPS = Object.freeze([{ x: 95, y: 300 }, { x: 905, y: 300 }]);
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const teammate = id => id ^ 1;
const attackHoop = team => HOOPS[1 - team];
const direction = team => team === 0 ? 1 : -1;
const smoothstep = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
const RATING_KEYS = Object.freeze({ speed: ['speed', 'spd', 'pace'], shot: ['shot', 'shooting', 'shoot', 'three'], power: ['power', 'dunk', 'strength'] });
const EMPTY_STATS = Object.freeze({});
const pausesShotClock = kind => kind === 'shot' || kind === 'dunk' || kind === 'rebound';
const TEAMMATE_CPU = Object.freeze({ speed: 168, guardGap: 65, stealChance: .27, blockChance: .22, shoveChance: .06, turboBlock: false, shotBonus: 0 });
const RIVAL_CPU = Object.freeze({
  arcade: Object.freeze({ ...TEAMMATE_CPU, speed: 155 }),
  pro: Object.freeze({ speed: 175, guardGap: 42, stealChance: .54, blockChance: .48, shoveChance: .18, turboBlock: true, shotBonus: .10 }),
});

export function createGame(options = {}) {
  const random = options.random || Math.random;
  const duration = clamp(Number(options.duration) || 120, 15, 600);
  const demo = !!options.demo;
  const difficulty = options.difficulty === 'pro' ? 'pro' : 'arcade';
  const rivalCPU = RIVAL_CPU[difficulty];
  const cpuProfile = player => player.team === 1 ? rivalCPU : TEAMMATE_CPU;
  const roster = [...(options.team || [{ name: 'Chief' }, { name: 'Bloodbath' }]), ...(options.opponents || [{ name: 'Chaos' }, { name: 'Poison' }])];
  const events = [];
  let lastShoot = false;
  let lastTurbo = false;
  let endedElapsed = 0;
  let possessionAge = 0;
  let aiDecision = [0, 0, 0, 0];
  // Commit to a side of the lane instead of changing direction every time a
  // dribbler crosses the court's center line by a few pixels.
  let aiDriveLane = [0, 0, 0, 0];
  let aiWing = [-1, 1, -1, 1];
  const state = {
    get difficulty() { return difficulty; },
    players: [], controlled: 0, scores: [0, 0], time: duration,
    shotClock: 24, phase: 'ready', elapsed: 0, overtime: false,
    ball: { x: 350, y: 300, z: 18, owner: 0, flight: null },
    effects: [], announcement: '', announcementTime: 0,
    combo: [0, 0], fire: [0, 0], charge: { active: false, amount: 0 },
    stats: { dunks: 0, threes: 0, steals: 0, blocks: 0, assists: 0, shots: 0, made: 0 },
    inbound: null, lastScorer: null, winner: null, possession: 0,
  };

  function emit(type, data = {}) {
    events.push({ type, ...data });
    // Leaving an attract mode running without consuming events must stay bounded.
    if (events.length > 80) events.shift();
  }
  function announce(text, seconds = 1.25) {
    state.announcement = text;
    state.announcementTime = seconds;
  }
  function effect(type, x, y, text, color, life = .8) {
    state.effects.push({ type, x, y, text, color, life, maxLife: life });
    if (state.effects.length > 60) state.effects.shift();
  }
  function rating(p, name) {
    const s = p.character?.stats || EMPTY_STATS;
    let n;
    for (const key of RATING_KEYS[name]) {
      const value = s[key] ?? p.character?.[key];
      if (typeof value === 'number') { n = value; break; }
    }
    if (n == null) return .7;
    if (n <= 1) return clamp(n, .35, 1);
    if (n > 10) n /= 10;
    return clamp(n / 10, .35, 1);
  }
  function cancelCharge() {
    const charged = state.players[state.charge.player];
    if (state.charge.active && charged?.shotSetup && !charged.shotSetup.released) {
      charged.shotSetup.cancelled = true;
      charged.shotSetup.released = true;
    }
    state.charge.active = false;
    state.charge.amount = 0;
    state.charge.player = null;
  }
  function syncFire() {
    state.fire = [0, 1].map(team => state.players.some(p => p.team === team && p.onFire) ? 1 : 0);
    state.combo = [0, 1].map(team => Math.max(...state.players.filter(p => p.team === team).map(p => p.streak)));
  }
  function giveBall(id, resetClock = false) {
    const p = state.players[id];
    if (!p) return;
    const airborneCatch = p.anim === 'block' && p.actionTime > 0 ?
      { x: state.ball.x - p.x, y: state.ball.y - p.y, z: state.ball.z - p.jump, phase: p.jumpPhase,
        startedAt: state.elapsed, elapsed: 0, duration: p.actionTime } : null;
    state.players.forEach(player => { player.hasBall = player.id === id; player.airborneCatch = null; });
    p.airborneCatch = airborneCatch;
    state.ball.owner = id;
    state.ball.flight = null;
    p.dribblePhase = 0; p.dribbleHandContact = 1;
    p.dribbleFrequency = 1.65; p.dribbleOffset = p.facing * 19;
    state.ball.x = p.x + p.dribbleOffset;
    state.ball.y = p.y;
    state.ball.z = p.jump > 20 ? p.jump + 55 : 52;
    if (airborneCatch) {
      state.ball.x = p.x + airborneCatch.x; state.ball.y = p.y + airborneCatch.y;
      state.ball.z = p.jump + airborneCatch.z;
    }
    state.possession = p.team;
    possessionAge = 0;
    aiDriveLane[id] = 0;
    if (resetClock) state.shotClock = 24;
    cancelCharge();
  }
  function takeBall() {
    state.players.forEach(p => { p.hasBall = false; p.airborneCatch = null; });
    state.ball.owner = null;
    state.ball.flight = null;
    cancelCharge();
  }
  function makePlayers() {
    state.players = Array.from({ length: 4 }, (_, id) => ({
      id, team: id < 2 ? 0 : 1, character: roster[id] || { name: `Winner ${id + 1}` },
      x: 0, y: 0, vx: 0, vy: 0, facing: id < 2 ? 1 : -1,
      anim: 'idle', animTime: 0, jump: 0, stamina: 100, hasBall: false,
      actionTime: 0, actionDuration: 0, stealCooldown: 0,
      stun: 0, leap: null, lastPassAt: -99, turboCarry: 0,
      shotSetup: null, jumpPhase: 0, onFire: false, streak: 0,
      knockback: null, recovery: 0, blockHeight: 75,
      airborneAction: null, airborneActionPhase: 0, airborneActionDuration: 0,
      airborneCatch: null,
      // Presentation signals follow actual simulation movement, never wall-clock
      // time, so footfalls and dribbles stay coherent when stopping or pausing.
      stridePhase: id % 2 * .5, groundDistance: 0, moveSpeed: 0,
      moveDirection: { x: 0, y: 0 }, defending: id >= 2, shuffling: false, actionPhase: 0,
      dribblePhase: 0, dribbleHandContact: 0, dribbleFrequency: 1.65,
      dribbleOffset: (id < 2 ? 1 : -1) * 19, passFacing: id < 2 ? 1 : -1,
      passReleasePhase: .06 / .22,
      gatherPhase: 1, gatherStartHeight: 52, gatherHandContact: 1, dunkStage: null, dunkReleasePhase: 0,
    }));
  }
  function positionForPossession(team) {
    const dir = direction(team);
    state.players.forEach(p => {
      const slot = p.id % 2;
      const offense = p.team === team;
      p.x = team === 0 ? (offense ? 260 + slot * 100 : 565 + slot * 100) : (offense ? 740 - slot * 100 : 435 - slot * 100);
      p.y = slot === 0 ? 295 : 445;
      p.vx = p.vy = p.jump = 0;
      p.anim = 'idle'; p.animTime = 0; p.actionTime = 0; p.stun = 0; p.leap = null;
      p.turboCarry = 0;
      p.shotSetup = null; p.jumpPhase = 0; p.knockback = null; p.recovery = 0;
      p.airborneAction = null; p.airborneActionPhase = 0; p.airborneActionDuration = 0;
      p.airborneCatch = null;
      p.facing = offense ? dir : -dir;
      p.stridePhase = slot * .5; p.groundDistance = 0; p.moveSpeed = 0;
      p.moveDirection = { x: 0, y: 0 }; p.defending = !offense; p.shuffling = false; p.actionPhase = 0;
      p.dribblePhase = 0; p.dribbleHandContact = 0; p.dribbleOffset = p.facing * 19;
      p.passFacing = p.facing;
      p.passReleasePhase = .06 / .22;
      p.gatherPhase = 1; p.gatherStartHeight = 52; p.gatherHandContact = 1; p.dunkStage = null; p.dunkReleasePhase = 0;
    });
    const id = team * 2;
    giveBall(id, true);
    if (team === 0) state.controlled = id;
    aiDecision = state.players.map(() => .5 + random() * .5);
    aiDriveLane = [0, 0, 0, 0];
    aiWing = state.players.map(p => p.y < 300 ? -1 : 1);
  }
  function reset() {
    Object.assign(state, {
      controlled: 0, scores: [0, 0], time: duration, shotClock: 24,
      phase: 'ready', elapsed: 0, overtime: false, effects: [], announcement: '', announcementTime: 0,
      combo: [0, 0], fire: [0, 0], inbound: null, lastScorer: null, winner: null, possession: 0,
      stats: { dunks: 0, threes: 0, steals: 0, blocks: 0, assists: 0, shots: 0, made: 0 },
    });
    state.ball = { x: 350, y: 300, z: 18, owner: null, flight: null };
    state.charge = { active: false, amount: 0 };
    makePlayers();
    positionForPossession(0);
    lastShoot = false; lastTurbo = false; endedElapsed = 0;
    events.length = 0;
    return state;
  }
  function start() {
    if (state.phase === 'ended') reset();
    if (state.phase === 'ready') {
      state.phase = 'playing';
      announce("LET’S BALL!", 1.4);
      emit('start');
    }
  }
  function pause() {
    if (state.phase !== 'playing') return;
    state.phase = 'paused'; cancelCharge(); lastShoot = false;
  }
  function resume() {
    if (state.phase === 'paused') {
      state.phase = 'playing'; lastShoot = false;
    }
  }
  function actionPose(p, anim, duration) {
    p.anim = anim; p.animTime = 0; p.actionTime = duration; p.actionDuration = duration; p.actionPhase = 0;
    p.airborneAction = null; p.airborneActionPhase = 0; p.airborneActionDuration = 0;
    p.airborneCatch = null;
  }
  function airborneRelease(p, action) {
    p.airborneAction = action; p.airborneActionPhase = 0; p.airborneActionDuration = p.actionTime;
  }
  function nearestDefender(p) {
    let best = null, nearest = Infinity;
    for (const q of state.players) {
      if (q.team === p.team) continue;
      const d = distance(p, q);
      if (d < nearest) { best = q; nearest = d; }
    }
    return best;
  }
  function closestPickup(airborne = false) {
    let best = null, nearest = Infinity;
    for (const p of state.players) {
      if (p.stun > 0 || (airborne ? p.jump <= 25 : p.jump >= 25)) continue;
      // Do not award a high catch before the overhead hands can reach it.
      const height = state.ball.z - p.jump;
      if (airborne && (height <= 55 || height > 125)) continue;
      const d = distance(p, state.ball);
      // High or low catches need the ball nearer the body. Independent height
      // and distance limits allowed impossible high, far-to-the-side catches.
      if (airborne && (d / 45) ** 2 + ((height - 90) / 35) ** 2 > 1) continue;
      if (d < nearest) { best = p; nearest = d; }
    }
    return best;
  }
  function canDunk(p, turbo, movement = {}) {
    const driving = (movement.x || 0) * direction(p.team) > .2 || p.vx * direction(p.team) > 30;
    return distance(p, attackHoop(p.team)) < 125 + rating(p, 'power') * 65 &&
      ((turbo && driving) || p.turboCarry > 0) && (p.stamina >= 8 || p.onFire);
  }
  function heldShotPosition(p) {
    const setup = p.shotSetup, gather = smoothstep(setup.elapsed / .22);
    const origin = setup.gatherFrom;
    let height = origin.z + (125 - origin.z) * gather;
    // A cancelled jumper comes down with the ball instead of dropping it from
    // overhead on the exact frame the player touches the floor.
    if (setup.cancelled && setup.elapsed > .47) height = 125 + (52 - 125) * smoothstep((setup.elapsed - .47) / .25);
    return {
      x: p.x + origin.x + (p.facing * 8 - origin.x) * gather,
      y: p.y + origin.y + (3 - origin.y) * gather,
      z: p.jump + height,
    };
  }
  function receivingPosition(p) {
    if (p.shotSetup) return heldShotPosition(p);
    return { x: p.x, y: p.y, z: p.jump + (p.anim === 'block' && p.actionTime > 0 ? 105 : 52) };
  }
  function updateGatherContact(p, elapsed) {
    // A low dribble rebounds into the gathering hands. Do not demand an
    // instantaneous floor pickup before the knees and arms can prepare.
    p.gatherHandContact = p.gatherStartHeight < 30 ? smoothstep((elapsed - .04) / .055) : 1;
  }
  function beginShot(p, turbo = false, automatic = false, movement = {}) {
    if (state.phase !== 'playing' || state.inbound || state.ball.owner !== p.id || p.stun > 0 || p.leap || p.shotSetup) return false;
    // A rebound caught during a block can be put back from its existing
    // airtime. Restarting a ground jump here teleported the player's feet.
    // This quick release does not earn the timed-release perfect bonus.
    if (p.anim === 'block' && p.actionTime > 0) {
      if (p.jump <= 1 || !shoot(p, .55)) return false;
      p.facing = direction(p.team);
      airborneRelease(p, 'shoot'); return true;
    }
    if (canDunk(p, turbo, movement)) return shoot(p, .75, true);
    p.shotSetup = { elapsed: 0, airtime: .72, released: false, cancelled: false, automatic,
      releaseAt: .32 + (automatic ? random() * .075 : .04),
      origin: { x: p.x, y: p.y }, vx: p.vx * .18, vy: p.vy * .18,
      gatherFrom: { x: state.ball.x - p.x, y: state.ball.y - p.y, z: Math.max(8, state.ball.z - p.jump) } };
    p.gatherPhase = 0; p.gatherStartHeight = p.shotSetup.gatherFrom.z;
    updateGatherContact(p, 0);
    actionPose(p, 'shoot', .72);
    p.facing = direction(p.team);
    if (!automatic) state.charge = { active: true, amount: 0, player: p.id };
    emit('jump', { team: p.team, player: p.id });
    return true;
  }
  function shoot(p, charge = .75, forceDunk = false) {
    if (state.phase !== 'playing' || state.inbound || state.ball.owner !== p.id || p.stun > 0 || p.leap) return false;
    const hoop = attackHoop(p.team);
    const setup = p.shotSetup;
    const dist = distance(setup?.origin || p, hoop);
    const defender = nearestDefender(p);
    const defenderDistance = distance(p, defender);
    const dunk = forceDunk;
    const perfect = charge >= .65 && charge <= .85;
    const three = dist > 285 && !dunk;
    const contest = clamp(1 - defenderDistance / 100, 0, 1);
    const shootingSkill = rating(p, 'shot');
    const fire = p.onFire;
    let chance = dunk ? .87 + rating(p, 'power') * .1 - contest * .08 : .60 + shootingSkill * .18 - Math.max(0, dist - 180) / 950 - contest * .27;
    if (perfect && !dunk) chance += .22;
    if (charge > .96 && !dunk) chance -= .2;
    if (fire) chance += .18;
    chance += cpuProfile(p).shotBonus;
    const made = random() < clamp(chance, .08, .98);
    const carried = { x: state.ball.x, y: state.ball.y, z: state.ball.z };
    const from = dunk ? { x: p.x, y: p.y, z: 125 + p.jump } : setup ? heldShotPosition(p) : carried;
    const to = { x: hoop.x, y: hoop.y, z: COURT.rimHeight };
    const flightDuration = dunk ? .95 : .86 + dist / 700;
    if (setup) setup.released = true;
    takeBall();
    state.ball.flight = {
      kind: dunk ? 'dunk' : 'shot', from, to, elapsed: 0, duration: flightDuration,
      shooter: p.id, team: p.team, points: three ? 3 : 2, made, perfect,
      arc: dunk ? 108 + rating(p, 'power') * 32 : 55 + dist * .09, blocked: false,
      gather: dunk ? { from: carried, duration: .22, joinAt: .24 } : null,
    };
    Object.assign(state.ball, dunk ? carried : from);
    if (dunk) actionPose(p, 'dunk', 1.17);
    if (dunk) {
      if (!p.onFire) p.stamina = Math.max(0, p.stamina - 12);
      p.leap = { from: { x: p.x, y: p.y }, to: { x: hoop.x - direction(p.team) * 25, y: hoop.y + 12 }, elapsed: 0, duration: .95, releaseDuration: .22, contactHeight: 50 };
      p.gatherPhase = 0; p.gatherStartHeight = Math.max(8, carried.z - p.jump);
      updateGatherContact(p, 0);
      p.dunkStage = 'flight'; p.dunkReleasePhase = 0;
      effect('spark', p.x, p.y, '', '#ff7040', .65);
      announce(fire ? 'FIRE FLIGHT!' : 'GET UP!', .65);
    } else if (perfect) {
      effect('text', p.x, p.y - 15, 'PERFECT', '#b9f16e', .8);
    }
    if (p.team === 0) state.stats.shots++;
    emit(dunk ? 'dunk' : 'shoot', { team: p.team, perfect, points: three ? 3 : 2 });
    return true;
  }
  function pass(p, turbo = false) {
    if (state.ball.owner !== p.id || state.inbound || p.stun > 0 || p.leap) return false;
    const receiver = state.players[teammate(p.id)];
    const powered = turbo || p.onFire;
    const airborneBlock = p.anim === 'block' && p.actionTime > 0;
    p.passFacing = Math.sign(receiver.x - p.x) || p.facing;
    const from = p.shotSetup ? heldShotPosition(p) : airborneBlock ? { x: state.ball.x, y: state.ball.y, z: state.ball.z } : { x: p.x + p.passFacing * 38, y: p.y + 3, z: 68 };
    const to = receivingPosition(receiver);
    const lowPickup = state.ball.z - p.jump < 30;
    const gather = p.shotSetup || airborneBlock ? null : { duration: lowPickup ? .12 : .06,
      from: { x: state.ball.x - p.x, y: state.ball.y - p.y, z: state.ball.z - p.jump } };
    const duration = Math.max(gather ? gather.duration + .04 : 0,
      clamp(distance(p, receiver) / (powered ? 1500 : 900), powered ? .10 : .16, powered ? .30 : .48));
    if (p.shotSetup) p.shotSetup.released = true;
    takeBall();
    state.ball.flight = { kind: 'pass', from, to, elapsed: 0, duration, shooter: p.id, receiver: receiver.id, team: p.team, arc: powered ? 6 : 12, turbo: powered,
      gather, heldBy: gather ? p.id : null };
    if (gather) { p.gatherPhase = 0; p.gatherStartHeight = gather.from.z; updateGatherContact(p, 0); }
    if (!p.shotSetup && !airborneBlock) {
      actionPose(p, 'pass', lowPickup ? .30 : .22);
      p.passReleasePhase = gather.duration / p.actionDuration;
    }
    if (airborneBlock) airborneRelease(p, 'pass');
    p.lastPassAt = state.elapsed;
    if (p.team === 0) state.controlled = receiver.id;
    emit('pass', { team: p.team, turbo: powered });
    return true;
  }
  function switchPlayer() {
    state.controlled = teammate(state.controlled);
    cancelCharge();
    emit('switch');
    return true;
  }
  function steal(p, automatic = false) {
    if (p.stealCooldown > 0 || p.stun > 0 || p.leap || p.shotSetup || (p.anim === 'block' && p.actionTime > 0) || state.inbound) return false;
    const victim = state.players[state.ball.owner];
    p.stealCooldown = automatic ? 1.8 : .7;
    actionPose(p, 'steal', .28);
    if (!victim || victim.team === p.team || victim.jump > 20 || possessionAge < .55 || distance(p, victim) > (automatic ? 43 : 78)) return false;
    const chance = automatic ? cpuProfile(p).stealChance : .91;
    if (random() > chance) return false;
    victim.stun = .38;
    actionPose(victim, 'stunned', .38);
    giveBall(p.id, true);
    if (p.team === 0) { state.controlled = p.id; state.stats.steals++; }
    announce('PICKPOCKET!', 1);
    effect('text', p.x, p.y - 10, 'STEAL', '#b9f16e');
    emit('steal', { team: p.team });
    return true;
  }
  function shove(p) {
    if (p.stealCooldown > 0 || p.stun > 0 || p.leap || p.shotSetup || (p.anim === 'block' && p.actionTime > 0) || state.inbound || (!p.onFire && p.stamina < 15)) return false;
    p.stealCooldown = .9;
    actionPose(p, 'shove', .3);
    if (!p.onFire) p.stamina = Math.max(0, p.stamina - 15);
    const victim = nearestDefender(p);
    if (!victim || victim.recovery > 0 || victim.jump > 30 || distance(p, victim) > 65 + rating(p, 'power') * 24) return false;
    let dx = victim.x - p.x, dy = victim.y - p.y;
    const norm = Math.hypot(dx, dy) || 1;
    if (!dx && !dy) dx = p.facing;
    const power = 280 + rating(p, 'power') * 160;
    victim.knockback = { vx: dx / norm * power, vy: dy / norm * power, time: .22 };
    victim.stun = .56 + rating(p, 'power') * .15;
    victim.recovery = victim.stun + .8;
    actionPose(victim, 'stunned', victim.stun);
    if (state.ball.owner === victim.id) {
      takeBall();
      victim.shotSetup = null;
      state.ball.flight = { kind: 'rebound', cause: 'shove', team: victim.team, shooter: victim.id,
        from: { x: victim.x, y: victim.y, z: 45 },
        to: { x: clamp(victim.x + dx / norm * 105, COURT.left, COURT.right), y: clamp(victim.y + dy / norm * 105, COURT.top, COURT.bottom), z: 7 },
        elapsed: 0, duration: .42, arc: 32 };
    }
    effect('burst', victim.x, victim.y, '', '#ffad67', .5);
    announce('MOVE OVER!', .8);
    emit('shove', { team: p.team, success: true });
    return true;
  }
  function block(p, turbo = false) {
    if (p.actionTime > 0 || p.stun > 0 || p.leap || state.inbound) return false;
    p.blockHeight = (turbo || p.onFire) && p.stamina >= 5 ? 112 : 78;
    if (turbo && !p.onFire) p.stamina = Math.max(0, p.stamina - 5);
    actionPose(p, 'block', .65);
    emit('block', { attempt: true, team: p.team });
    return true;
  }
  function action(type, context = {}) {
    if (state.phase !== 'playing' || state.inbound) return false;
    const p = state.players[state.controlled];
    const turbo = context.turbo ?? lastTurbo;
    if (type === 'switch') return switchPlayer();
    if (type === 'pass') {
      const owner = state.players[state.ball.owner];
      // After a manual switch, PASS calls for the ball from your AI teammate.
      if (owner?.team === p.team) return pass(owner, turbo);
      return turbo ? shove(p) : steal(p);
    }
    if (type === 'steal') return turbo ? shove(p) : steal(p);
    if (type === 'shove') return shove(p);
    if (type === 'block') return block(p, turbo);
    if (type === 'shoot') {
      const owner = state.players[state.ball.owner];
      return owner?.team === p.team ? beginShot(owner, turbo, true) : block(p, turbo);
    }
    return false;
  }
  function score(flight) {
    state.scores[flight.team] += flight.points;
    const scorer = state.players[flight.shooter];
    state.players.forEach(p => {
      if (p.team !== flight.team) { p.onFire = false; p.streak = 0; }
      else if (p.id !== scorer.id && !p.onFire) p.streak = 0;
    });
    scorer.streak++;
    state.lastScorer = flight.shooter;
    if (flight.team === 0) {
      state.stats.made++;
      if (flight.kind === 'dunk') state.stats.dunks++;
      if (flight.points === 3) state.stats.threes++;
      if (state.elapsed - state.players[teammate(flight.shooter)].lastPassAt < 4) state.stats.assists++;
    }
    const hoop = attackHoop(flight.team);
    effect('burst', hoop.x, hoop.y, '', flight.team === 0 ? '#ff7040' : '#b9a1ff', 1);
    effect('text', hoop.x, hoop.y, `+${flight.points}`, '#fff5dc', 1.2);
    announce(flight.kind === 'dunk' ? 'BOOMSHAKA!' : flight.points === 3 ? 'FROM DOWNTOWN!' : flight.perfect ? 'NOTHING BUT NET!' : 'BUCKETS!', 1.25);
    emit('score', { team: flight.team, points: flight.points, dunk: flight.kind === 'dunk' });
    if (scorer.streak >= 3 && !scorer.onFire) {
      scorer.onFire = true; scorer.stamina = 100;
      announce('ON FIRE!', 1.6);
      emit('fire', { team: flight.team, player: scorer.id });
    }
    syncFire();
    if (state.time <= 0) { finishOrOvertime(); return; }
    state.inbound = { timer: 1.1, team: 1 - flight.team };
    state.ball.flight = null;
    state.ball.owner = null;
    state.ball.z = COURT.rimHeight - 8;
  }
  function rebound(flight) {
    const hoop = attackHoop(flight.team);
    const x = clamp(hoop.x - direction(flight.team) * (70 + random() * 90), COURT.left, COURT.right);
    const y = clamp(hoop.y + (random() - .5) * 190, COURT.top, COURT.bottom);
    state.ball.flight = { kind: 'rebound', from: { x: state.ball.x, y: state.ball.y, z: state.ball.z }, to: { x, y, z: 8 }, elapsed: 0, duration: .7, arc: 35, shooter: flight.shooter, team: flight.team };
    if (!state.players[flight.shooter].onFire) state.players[flight.shooter].streak = 0;
    syncFire();
    effect('text', hoop.x, hoop.y, flight.blocked ? 'BLOCKED' : 'OFF THE RIM', '#ffbcb1', .9);
    emit(flight.blocked ? 'block' : 'miss', { team: flight.team });
    if (state.time <= 0) finishOrOvertime();
  }
  function updateFlight(dt) {
    const f = state.ball.flight;
    if (!f) return;
    f.elapsed += dt;
    let t = clamp(f.elapsed / f.duration, 0, 1);
    if (f.kind === 'pass') {
      const receiver = state.players[f.receiver];
      Object.assign(f.to, receivingPosition(receiver));
      if (f.gather) {
        // Control switches immediately, but the ball remains in the passer's
        // hands through the chest gather and leaves on the wrist-push beat.
        const passer = state.players[f.shooter], g = f.gather;
        if (f.heldBy != null) {
          f.from.x = passer.x + passer.passFacing * 38;
          f.from.y = passer.y + 3;
          f.from.z = passer.jump + 68;
          passer.gatherPhase = clamp(f.elapsed / g.duration, 0, 1);
          updateGatherContact(passer, f.elapsed);
          if (f.elapsed < g.duration) {
            const amount = smoothstep(passer.gatherPhase);
            state.ball.x = passer.x + g.from.x + (passer.passFacing * 38 - g.from.x) * amount;
            state.ball.y = passer.y + g.from.y + (3 - g.from.y) * amount;
            state.ball.z = passer.jump + g.from.z + (68 - g.from.z) * amount;
            return;
          }
          f.heldBy = null;
        }
        // Keep the original catch time except when a low pickup needs more
        // preparation than a very short turbo pass's entire old flight.
        t = clamp((f.elapsed - g.duration) / (f.duration - g.duration), 0, 1);
      }
    }
    state.ball.x = f.from.x + (f.to.x - f.from.x) * t;
    state.ball.y = f.from.y + (f.to.y - f.from.y) * t;
    state.ball.z = f.from.z + (f.to.z - f.from.z) * t + Math.sin(Math.PI * t) * f.arc;
    if (f.kind === 'dunk' && f.gather && f.elapsed < f.gather.joinAt) {
      const dunker = state.players[f.shooter], amount = smoothstep(dunker.gatherPhase);
      // Gathering follows the actual body rise. This keeps the low-ball pickup
      // reachable before takeoff, then joins the unchanged rim-bound flight.
      state.ball.x = dunker.x + (f.gather.from.x - dunker.leap.from.x) * (1 - amount) + (state.ball.x - dunker.x) * amount;
      state.ball.y = dunker.y + (f.gather.from.y - dunker.leap.from.y) * (1 - amount) + (state.ball.y - dunker.y) * amount;
      const handHeight = 125 + (COURT.rimHeight - 125 - dunker.leap.contactHeight) * t;
      state.ball.z = dunker.jump + dunker.gatherStartHeight + (handHeight - dunker.gatherStartHeight) * amount;
    }
    if ((f.kind === 'shot' || f.kind === 'dunk') && t < .45 && !f.blocked) {
      const blocker = state.players.find(p => p.team !== f.team && p.anim === 'block' && p.jump > 28 && distance(p, state.ball) < 85 && state.ball.z < p.jump + 135);
      if (blocker) {
        f.blocked = true; f.made = false;
        if (blocker.team === 0) state.stats.blocks++;
        announce('REJECTED!', 1.1);
        effect('spark', state.ball.x, state.ball.y, '', '#b9f16e', .7);
        const shooter = state.players[f.shooter];
        if (!shooter.onFire) shooter.streak = 0;
        syncFire();
        state.ball.flight = { kind: 'rebound', cause: 'block', from: { x: state.ball.x, y: state.ball.y, z: state.ball.z },
          to: { x: clamp(state.ball.x + direction(blocker.team) * 155, COURT.left, COURT.right), y: clamp(state.ball.y + (random() - .5) * 120, COURT.top, COURT.bottom), z: 7 },
          elapsed: 0, duration: .5, arc: 12, shooter: f.shooter, team: f.team };
        emit('block', { team: blocker.team, success: true });
        return;
      }
    }
    if (f.kind === 'rebound' && t > .2 && state.ball.z > 35) {
      const catcher = closestPickup(true);
      if (catcher) {
        giveBall(catcher.id, f.cause !== 'shove' || catcher.team !== f.team);
        if (catcher.team === 0) state.controlled = catcher.id;
        emit('bounce', { rebound: true });
        return;
      }
    }
    if (t < 1) return;
    if (f.kind === 'pass') {
      giveBall(f.receiver);
    } else if (f.kind === 'rebound') {
      state.ball.flight = null; state.ball.z = 8;
      const closest = closestPickup();
      // Resolve contested rebounds without a hidden dead-ball wait.
      if (closest && distance(closest, state.ball) < 50) {
        giveBall(closest.id, f.cause !== 'shove' || closest.team !== f.team);
        if (closest.team === 0) state.controlled = closest.id;
        emit('bounce');
      }
    } else if (f.made) score(f);
    else rebound(f);
  }
  function finishOrOvertime() {
    cancelCharge();
    if (state.scores[0] === state.scores[1]) {
      state.overtime = true; state.time = 30; state.shotClock = 24;
      announce('OVERTIME · 30 SECONDS', 2);
      state.inbound = { timer: 1.3, team: Math.floor(random() * 2) };
      state.ball.flight = null;
      emit('whistle', { overtime: true });
    } else {
      state.phase = 'ended'; state.time = 0;
      state.winner = state.scores[0] > state.scores[1] ? 0 : 1;
      state.inbound = null; cancelCharge();
      announce(state.winner === 0 ? 'COURT CONQUERED' : 'RUN IT BACK', 10);
      emit('end', { winner: state.winner, scores: [...state.scores] });
    }
  }
  function aiInput(p, dt) {
    const ballOwner = state.players[state.ball.owner];
    const hoop = attackHoop(p.team);
    const dir = direction(p.team);
    const profile = cpuProfile(p);
    let tx, ty, turbo = false;
    aiDecision[p.id] -= dt;
    if (!ballOwner) {
      const flight = state.ball.flight;
      if (flight && ['shot', 'dunk'].includes(flight.kind) && flight.team !== p.team && flight.elapsed < flight.duration * .3 && distance(p, state.ball) < 80 && aiDecision[p.id] <= 0) {
        aiDecision[p.id] = .8;
        if (random() < profile.blockChance) block(p, profile.turboBlock);
      }
      if (flight?.kind === 'pass') {
        tx = p.x; ty = p.y;
        if (p.team !== flight.team) {
          // Defenders rotate while the ball travels; freezing every AI player
          // for a pass made the entire court visibly stop between catches.
          const receiver = state.players[flight.receiver], mate = state.players[teammate(p.id)];
          const mark = distance(p, receiver) <= distance(mate, receiver) ? receiver : state.players[flight.shooter];
          const vx = HOOPS[p.team].x - mark.x, vy = HOOPS[p.team].y - mark.y;
          const length = Math.hypot(vx, vy) || 1, gap = profile.guardGap;
          tx = mark.x + vx / length * gap; ty = mark.y + vy / length * gap;
        }
      } else if (flight?.kind === 'shot' || flight?.kind === 'dunk') {
        const attackDirection = direction(flight.team);
        if (p.team === flight.team && p.id !== flight.shooter) {
          // Keep the weakside partner available instead of sending all four
          // bodies to the same spot under the rim before a rebound exists.
          tx = flight.to.x - attackDirection * 150;
          ty = flight.to.y + (flight.from.y <= 300 ? 145 : -145);
        } else {
          // Both rebound lanes remain on the playable side of this basket,
          // regardless of which team is attacking it.
          tx = flight.to.x - attackDirection * 55;
          ty = flight.to.y + (p.id % 2 ? 60 : -60);
        }
      } else if (!flight) {
        // Rebound anticipation offsets are outside the pickup radius. Once
        // the ball is loose, close on the ball itself instead of parking there.
        tx = state.ball.x; ty = state.ball.y;
      } else {
        tx = flight?.to.x ?? state.ball.x;
        ty = (flight?.to.y ?? state.ball.y) + (p.id % 2 ? 32 : -28);
        tx = clamp(tx - dir * 45, 90, 910);
      }
    } else if (ballOwner.id === p.id) {
      if (p.shotSetup) return { x: 0, y: 0, turbo: false };
      const d = distance(p, hoop);
      const defender = nearestDefender(p);
      const defenderDistance = distance(p, defender);
      const contested = defenderDistance < 86;
      const shootingSkill = rating(p, 'shot'), power = rating(p, 'power');
      const prefersThree = (shootingSkill >= .85 && shootingSkill >= power - .05) || (shootingSkill >= .7 && power < .85 && p.id % 2 === 1);
      const shootingRange = prefersThree ? 355 : power >= .85 ? 170 : 245;
      tx = hoop.x - dir * (prefersThree ? 310 : power >= .85 ? 95 : 200);
      ty = hoop.y + Math.sin(state.elapsed * .6 + p.id * 2) * (prefersThree ? 95 : 65);
      // Keep an escape lane until the defender is beaten. Testing p.y < 300
      // each tick made a pressured player reverse at 60 Hz on the center line.
      if (contested && d > 170 && !aiDriveLane[p.id])
        aiDriveLane[p.id] = p.y < defender.y || (p.y === defender.y && p.id % 2 === 0) ? 195 : 405;
      if (defenderDistance > 125 || d <= 170) aiDriveLane[p.id] = 0;
      if (aiDriveLane[p.id]) ty = aiDriveLane[p.id];
      turbo = (d > shootingRange || (!prefersThree && d < 220)) && (p.stamina > 20 || p.onFire);
      if (possessionAge > .7 && aiDecision[p.id] <= 0) {
        aiDecision[p.id] = .35 + random() * .4;
        const mate = state.players[teammate(p.id)];
        const mateDefender = nearestDefender(mate);
        const mateOpen = distance(mate, mateDefender) > 90;
        const passChance = contested ? .55 : .20;
        if (d < shootingRange && !contested) {
          // An open shot in this player's established range is already a
          // good possession. Do not pass it away just because a mate is open.
          beginShot(p, turbo, true, { x: dir });
        } else if (possessionAge > .7 && d > 185 && distance(p, mate) > 115 && state.shotClock > 5 && (mateOpen || random() < passChance)) {
          pass(p, turbo);
        } else if ((d < shootingRange && (!contested || d < 175 || random() < .55)) || state.shotClock < 3.5) {
          beginShot(p, turbo, true, { x: dir });
        }
      }
    } else if (ballOwner.team === p.team) {
      tx = hoop.x - dir * (rating(p, 'shot') >= .85 ? 305 : 155);
      if (ballOwner.y < 260) aiWing[p.id] = 1;
      else if (ballOwner.y > 340) aiWing[p.id] = -1;
      ty = aiWing[p.id] > 0 ? 450 : 150;
      if (distance(ballOwner, hoop) < 180) tx -= dir * 55;
    } else {
      const mate = state.players[teammate(p.id)];
      const ballDefender = distance(p, ballOwner) <= distance(mate, ballOwner) || (!demo && mate.id === state.controlled && distance(mate, ballOwner) > 150);
      const mark = ballDefender ? ballOwner : state.players[teammate(ballOwner.id)];
      const defensiveHoop = HOOPS[p.team];
      const guardGap = profile.guardGap;
      const vx = defensiveHoop.x - mark.x, vy = defensiveHoop.y - mark.y;
      const length = Math.hypot(vx, vy) || 1;
      tx = mark.x + vx / length * guardGap;
      ty = mark.y + vy / length * guardGap;
      if (ballDefender && distance(p, ballOwner) < 43 && possessionAge > 1.0) steal(p, true);
      if (ballDefender && ballOwner.shotSetup && !ballOwner.shotSetup.released && ballOwner.shotSetup.elapsed > .12 && distance(p, ballOwner) < 100 && aiDecision[p.id] <= 0) {
        aiDecision[p.id] = .8;
        if (random() < profile.blockChance) block(p, profile.turboBlock);
      } else if (ballDefender && distance(p, ballOwner) < 78 && possessionAge > 1 && aiDecision[p.id] <= 0) {
        aiDecision[p.id] = .7;
        if (random() < profile.shoveChance) shove(p);
      }
    }
    const dx = tx - p.x, dy = ty - p.y, mag = Math.hypot(dx, dy);
    return { x: mag > 10 ? dx / mag : 0, y: mag > 10 ? dy / mag : 0, turbo };
  }
  function movePlayer(p, input, dt) {
    const beforeX = p.x, beforeY = p.y;
    const grounded = p.jump < 1 && !p.leap && !p.shotSetup && p.stun <= 0;
    simulatePlayerMotion(p, input, dt);
    const onFeet = grounded && p.jump < 1 && !p.leap && !p.shotSetup && p.stun <= 0;
    const dx = onFeet ? p.x - beforeX : 0, dy = onFeet ? p.y - beforeY : 0;
    const travel = Math.hypot(dx, dy);
    p.moveSpeed = travel / dt;
    p.moveDirection = travel > .001 ? { x: dx / travel, y: dy / travel } : { x: 0, y: 0 };
    p.groundDistance += travel;
    p.defending = p.team !== state.possession;
    p.shuffling = p.defending && distance(p, state.ball) < 220 && p.moveSpeed < 250 && !input.turbo;
    if (p.shuffling) {
      const ballOwner = state.players[state.ball.owner];
      const faceBall = (ballOwner?.x ?? state.ball.x) - p.x;
      if (Math.abs(faceBall) > 8) p.facing = Math.sign(faceBall);
    }
    // 150 court units per complete two-step cycle matches the natural stance
    // stride of the sprite at the sideline camera's projection scale.
    p.stridePhase = (p.stridePhase + travel / (p.shuffling ? 55 : 150)) % 1;
    p.actionPhase = p.leap || p.shotSetup || p.anim === 'block' ? p.jumpPhase :
      p.actionTime > 0 && p.actionDuration > 0 ? clamp(1 - p.actionTime / p.actionDuration, 0, 1) : 0;
    if (!p.hasBall) p.dribbleHandContact = 0;
  }
  function simulatePlayerMotion(p, input, dt) {
    p.stealCooldown = Math.max(0, p.stealCooldown - dt);
    p.stun = Math.max(0, p.stun - dt);
    p.recovery = Math.max(0, p.recovery - dt);
    p.turboCarry = input.turbo && (input.x || 0) * direction(p.team) > .2 && p.stamina >= 8 ? 1.1 : Math.max(0, p.turboCarry - dt);
    if (p.onFire) p.stamina = 100;
    p.animTime += dt;
    if (p.knockback) {
      p.x = clamp(p.x + p.knockback.vx * dt, COURT.left, COURT.right);
      p.y = clamp(p.y + p.knockback.vy * dt, COURT.top, COURT.bottom);
      p.knockback.time -= dt;
      if (p.knockback.time <= 0) p.knockback = null;
    }
    if (p.leap) {
      const l = p.leap;
      l.elapsed += dt;
      const t = clamp(l.elapsed / l.duration, 0, 1);
      const travel = t;
      p.x = l.from.x + (l.to.x - l.from.x) * travel;
      p.y = l.from.y + (l.to.y - l.from.y) * travel;
      p.jumpPhase = t;
      p.gatherPhase = clamp(l.elapsed / .22, 0, 1);
      updateGatherContact(p, l.elapsed);
      if (l.elapsed < l.duration) {
        const airborneHeight = Math.sin(t * Math.PI) * (108 + rating(p, 'power') * 32) + l.contactHeight * t;
        // Unweight the feet while gathering, then drive from the loaded knees.
        // The body rejoins the ball's original flight by .24 seconds.
        p.jump = l.elapsed <= .08 ? .6 * smoothstep(l.elapsed / .08) :
          .6 + (airborneHeight - .6) * smoothstep((l.elapsed - .08) / .16);
        p.dunkStage = 'flight'; p.dunkReleasePhase = 0;
      } else {
        const release = clamp((l.elapsed - l.duration) / l.releaseDuration, 0, 1);
        p.dunkStage = 'release'; p.dunkReleasePhase = release;
        // The rim catch arrests the fall; after release gravity brings the
        // actual feet down once, even while the next inbound is pending.
        p.jump = l.contactHeight * (1 - release * release);
        if (release >= 1) {
          p.leap = null; p.jump = 0; p.jumpPhase = 0; p.dunkStage = null;
          actionPose(p, 'land', .18);
        }
      }
      if (p.leap) p.actionTime = Math.max(0, l.duration + l.releaseDuration - l.elapsed);
      return;
    }
    if (p.shotSetup) {
      const setup = p.shotSetup;
      setup.elapsed += dt;
      const t = clamp(setup.elapsed / setup.airtime, 0, 1);
      p.jumpPhase = t; p.gatherPhase = clamp(setup.elapsed / .22, 0, 1);
      updateGatherContact(p, setup.elapsed);
      // A real gather loads the knees before the push. The tiny immediate
      // unweighting preserves the input response, with the same .36s apex.
      const rise = clamp((setup.elapsed - .08) / .28, 0, 1);
      const fall = clamp((setup.elapsed - .36) / .36, 0, 1);
      p.jump = setup.elapsed <= .08 ? .6 * smoothstep(setup.elapsed / .08) :
        setup.elapsed <= .36 ? .6 + 71.4 * (1 - (1 - rise) ** 2) : 72 * (1 - fall * fall);
      p.vx = setup.vx; p.vy = setup.vy;
      p.x = clamp(p.x + p.vx * dt, COURT.left, COURT.right);
      p.y = clamp(p.y + p.vy * dt, COURT.top, COURT.bottom);
      p.actionTime = Math.max(0, setup.airtime - setup.elapsed);
      if (state.charge.active && state.charge.player === p.id) state.charge.amount = Math.min(1, setup.elapsed / .48);
      if (!setup.released && !setup.cancelled && state.ball.owner === p.id &&
          ((setup.automatic && setup.elapsed >= setup.releaseAt) || setup.elapsed >= .60)) {
        shoot(p, Math.min(1, setup.elapsed / .48));
      }
      if (t >= 1) { p.shotSetup = null; p.jump = 0; p.jumpPhase = 0; p.anim = p.hasBall ? 'dribble' : 'idle'; }
      return;
    }
    if (p.actionTime > 0) {
      p.actionTime = Math.max(0, p.actionTime - dt);
      const t = 1 - p.actionTime / p.actionDuration;
      p.jumpPhase = p.anim === 'block' ? t : 0;
      p.jump = p.anim === 'block' ? Math.sin(t * Math.PI) * p.blockHeight : 0;
    } else { p.jump = 0; p.jumpPhase = 0; }
    if (p.airborneAction) {
      if (p.anim === 'block' && p.actionTime > 0)
        p.airborneActionPhase = clamp(1 - p.actionTime / p.airborneActionDuration, 0, 1);
      else { p.airborneAction = null; p.airborneActionPhase = 0; p.airborneActionDuration = 0; }
    }
    if (p.stun > 0) { p.vx = p.vy = 0; return; }
    let ix = Number.isFinite(input.x) ? input.x : 0;
    let iy = Number.isFinite(input.y) ? input.y : 0;
    const magnitude = Math.hypot(ix, iy);
    if (magnitude > 1) { ix /= magnitude; iy /= magnitude; }
    const running = magnitude > .08;
    const turbo = !!input.turbo && p.stamina > 1 && running;
    const human = !demo && p.id === state.controlled;
    const baseSpeed = (human ? 190 : cpuProfile(p).speed) + rating(p, 'speed') * 32;
    const speed = baseSpeed * (turbo ? 1.48 : 1) * (p.actionTime > 0 ? .36 : 1);
    p.vx = ix * speed; p.vy = iy * speed;
    p.x = clamp(p.x + p.vx * dt, COURT.left, COURT.right);
    p.y = clamp(p.y + p.vy * dt, COURT.top, COURT.bottom);
    if (Math.abs(ix) > .1) p.facing = ix > 0 ? 1 : -1;
    p.stamina = p.onFire ? 100 : clamp(p.stamina + (turbo ? -28 : 19) * dt, 0, 100);
    if (p.actionTime <= 0) p.anim = p.hasBall ? 'dribble' : running ? 'run' : 'idle';
    if (turbo && random() < dt * 15) effect('spark', p.x - p.facing * 10, p.y + 5, '', p.onFire ? '#ff7040' : '#ffffff', .27);
  }
  function separatePlayers() {
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      const a = state.players[i], b = state.players[j];
      if (a.jump > 25 || b.jump > 25) continue;
      let dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy), min = 31;
      if (dist >= min) continue;
      if (dist < .01) { dx = 1; dy = 0; }
      const norm = Math.hypot(dx, dy);
      const push = (min - dist) * .5;
      a.x = clamp(a.x - dx / norm * push, COURT.left, COURT.right);
      a.y = clamp(a.y - dy / norm * push, COURT.top, COURT.bottom);
      b.x = clamp(b.x + dx / norm * push, COURT.left, COURT.right);
      b.y = clamp(b.y + dy / norm * push, COURT.top, COURT.bottom);
    }
  }
  function tick(dt, input) {
    state.elapsed += dt;
    state.announcementTime = Math.max(0, state.announcementTime - dt);
    let activeEffects = 0;
    for (const e of state.effects) {
      e.life -= dt;
      if (e.life > 0) state.effects[activeEffects++] = e;
    }
    state.effects.length = activeEffects;
    if (state.inbound) {
      state.inbound.timer -= dt;
      state.ball.z = Math.max(7, state.ball.z - dt * 180);
      state.players.forEach(p => { if (p.leap || p.shotSetup || p.actionTime > 0) movePlayer(p, {}, dt); });
      if (state.inbound.timer <= 0) {
        const team = state.inbound.team;
        state.inbound = null;
        positionForPossession(team);
        emit('whistle', { inbound: true });
      }
      lastShoot = !!input.shoot;
      return;
    }
    const human = state.players[state.controlled];
    lastTurbo = !!input.turbo;
    if (!demo) {
      if (input.shoot && !lastShoot) {
        const owner = state.players[state.ball.owner];
        if (owner?.id === human.id) beginShot(human, !!input.turbo, false, input);
        else if (owner?.team === human.team) beginShot(owner, !!input.turbo, true);
        else block(human, !!input.turbo);
      }
      if (!input.shoot && lastShoot && state.charge.active) {
        const shooter = state.players[state.charge.player];
        if (shooter) shoot(shooter, state.charge.amount);
        cancelCharge();
      }
    }
    lastShoot = !!input.shoot;
    const previousFlightKind = state.ball.flight?.kind;
    state.players.forEach(p => {
      const movement = !demo && p.id === state.controlled ? input : aiInput(p, dt);
      movePlayer(p, movement, dt);
    });
    separatePlayers();
    updateFlight(dt);
    if (state.phase !== 'playing' || state.inbound) return;
    if (state.ball.owner != null) {
      const owner = state.players[state.ball.owner];
      possessionAge += dt;
      state.ball.y = owner.y + 3;
      if (owner.airborneCatch) {
        const caught = owner.airborneCatch;
        caught.elapsed = state.elapsed - caught.startedAt;
        const remaining = clamp((owner.jumpPhase - caught.phase) / Math.max(.001, 1 - caught.phase), 0, 1);
        const lower = smoothstep((remaining - .25) / .75);
        state.ball.x = owner.x + caught.x + (owner.facing * 19 - caught.x) * lower;
        state.ball.y = owner.y + caught.y + (3 - caught.y) * lower;
        state.ball.z = owner.jump + caught.z + (52 - caught.z) * lower;
        owner.dribbleHandContact = 1;
        if (owner.anim !== 'block' || owner.actionTime <= 0) owner.airborneCatch = null;
      } else if (owner.shotSetup || owner.jump > 20) {
        if (owner.shotSetup) Object.assign(state.ball, heldShotPosition(owner));
        else { state.ball.x = owner.x + owner.facing * 19; state.ball.z = owner.jump + 55; }
        owner.dribbleHandContact = 1;
      } else {
        const pace = clamp(owner.moveSpeed / 325, 0, 1);
        owner.dribbleFrequency = 1.65 + pace * .65;
        const before = owner.dribblePhase, next = before + dt * owner.dribbleFrequency;
        owner.dribblePhase = next % 1;
        // The two parabolic halves meet in a sharp floor bounce. At the hand
        // the ball slows naturally, giving the fingers time to press it down.
        const phase = owner.dribblePhase, half = Math.min(phase, 1 - phase) * 2;
        const top = 52 - pace * 12;
        state.ball.z = 8 + (top - 8) * (1 - half * half);
        const contactDistance = Math.min(phase, 1 - phase);
        owner.dribbleHandContact = clamp(1 - contactDistance / .18, 0, 1);
        const targetOffset = owner.facing * (19 + pace * 3 + Math.sin(phase * Math.PI) * 2);
        // Turnovers reset the offset; a running change of direction carries it
        // across the body instead of teleporting the ball between the hands.
        owner.dribbleOffset += (targetOffset - owner.dribbleOffset) * (1 - Math.exp(-dt * 14));
        state.ball.x = owner.x + owner.dribbleOffset;
        if (before < .5 && next >= .5) emit('bounce', { team: owner.team, player: owner.id });
      }
    } else if (!state.ball.flight) {
      const closest = closestPickup();
      if (closest && distance(closest, state.ball) < 50) {
        giveBall(closest.id, closest.team !== state.possession);
        if (closest.team === 0) state.controlled = closest.id;
      }
    }
    state.time = Math.max(0, state.time - dt);
    // A shot released before zero remains live; a loose rebound does not.
    if (state.time <= 0 && !['shot', 'dunk'].includes(state.ball.flight?.kind)) {
      finishOrOvertime();
      return;
    }
    if (!pausesShotClock(state.ball.flight?.kind) && !pausesShotClock(previousFlightKind)) state.shotClock = Math.max(0, state.shotClock - dt);
    if (state.shotClock <= 0 && !pausesShotClock(state.ball.flight?.kind)) {
      const nextTeam = 1 - state.possession;
      state.inbound = { timer: 1, team: nextTeam };
      takeBall();
      announce('SHOT CLOCK · TURNOVER', 1.3);
      emit('whistle', { turnover: true });
    }
  }
  function step(dt, input = {}) {
    if (!Number.isFinite(dt) || dt <= 0) return state;
    if (state.phase === 'ended' && demo) {
      endedElapsed += Math.min(dt, .1);
      if (endedElapsed > 3) { reset(); start(); }
    }
    if (state.phase !== 'playing') return state;
    // Keep collision, AI and release timing consistent after a slow frame.
    let remaining = Math.min(dt, .2);
    while (remaining > .000001 && state.phase === 'playing') {
      const delta = Math.min(remaining, 1 / 60);
      tick(delta, input);
      remaining -= delta;
    }
    return state;
  }
  function drainEvents() { return events.splice(0); }
  reset();
  return { state, start, step, action, pause, resume, reset, drainEvents };
}
