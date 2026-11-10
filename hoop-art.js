// Original Canvas basketball hardware. The simulation's rim center is fixed;
// the two render passes only separate rear/front cords and rim occlusion.
const TAU = Math.PI * 2;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const project = (x, y) => ({x: 600 + (x - 500) * (.78 + y / 2000), y: 190 + y * .68});
const hardwareCache = new Map();
const netCache = new Map();
const DENSITY = 2;

function polygon(g, points, fill, stroke, width = 1) {
  g.beginPath();
  points.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y));
  g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.stroke(); }
}
function path(g, points, color, width = 1) {
  g.beginPath();
  points.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y));
  g.strokeStyle = color; g.lineWidth = width; g.stroke();
}
function ellipse(g, x, y, rx, ry, fill, stroke, width = 1, start = 0, end = TAU) {
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, start, end);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.stroke(); }
}
function roundRect(g, x, y, w, h, r, fill, stroke, width = 1) {
  g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y);
  g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.stroke(); }
}
function gradient(g, x0, y0, x1, y1, stops) {
  const result = g.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([at, color]) => result.addColorStop(at, color));
  return result;
}
function bolt(g, x, y, r = 1.35) {
  ellipse(g, x, y, r + .5, r + .5, '#07121ba6');
  ellipse(g, x, y, r, r, '#c4ced0');
  path(g, [{x: x - r * .5, y: y + .3}, {x: x + r * .5, y: y - .3}], '#5b6c76', .55);
}

/** Exposed for renderer/physics alignment checks. */
export function getHoopGeometry(side = 0, {point = project, heightScale = 1.35} = {}) {
  const right = side === 1, dir = right ? 1 : -1;
  const floor = point(right ? 905 : 95, 300);
  const rim = {x: floor.x, y: floor.y - 160 * heightScale};
  const board = {x: rim.x + dir * 12, y: rim.y - 60, width: 66, height: 52, slope: dir * .065};
  const boardPoint = (u, v) => ({x: board.x + u, y: board.y + v + u * board.slope});
  const foot = {x: floor.x + dir * 68, y: floor.y + 9};
  const mastTop = {x: foot.x + dir * 5, y: rim.y - 20};
  return {side: right ? 1 : 0, dir, floor, rim, board, boardPoint, foot, mastTop};
}

function drawSupport(g, geo, arena) {
  const {dir, foot, mastTop, floor, rim} = geo;
  const h = arena.hoop || {}, post = h.post || '#79929d';
  const darkPad = {casino: '#3d2431', stadium: '#153548', miami: '#315253', bugatti: '#1b2938', blacktop: '#233b34'}[arena.id] || '#233647';
  const baseX = foot.x + dir * 10;
  g.save();
  // The weight-bearing base and compressed shadow sit on the same floor plane.
  const shadow = g.createRadialGradient(baseX, foot.y + 3, 2, baseX, foot.y + 3, 47);
  shadow.addColorStop(0, '#03081180'); shadow.addColorStop(.5, '#03081138'); shadow.addColorStop(1, '#03081100');
  g.save(); g.translate(baseX, foot.y + 4); g.scale(1, .25); g.fillStyle = shadow;
  g.translate(-baseX, -foot.y - 3); g.fillRect(baseX - 49, foot.y - 47, 98, 94); g.restore();
  const base = [
    {x: foot.x - 22, y: foot.y - 6}, {x: foot.x + 22, y: foot.y - 6},
    {x: foot.x + 26 + dir * 5, y: foot.y + 5}, {x: foot.x - 25 + dir * 5, y: foot.y + 5}
  ];
  polygon(g, base, '#142330', '#08121c', 1.4);
  path(g, [base[0], base[1], base[2]], '#9aadb069', 1);
  for (const x of [foot.x - 17, foot.x + 17]) {
    ellipse(g, x, foot.y + 5, 3.9, 2.5, '#070f17');
    bolt(g, x, foot.y - 1, 1.3);
  }
  const steel = gradient(g, foot.x - 10, 0, foot.x + 12, 0,
    [[0, '#0e1d28'], [.28, post], [.46, '#b7c6c7'], [.58, post], [1, '#243b48']]);
  polygon(g, [
    {x: foot.x - 9, y: foot.y - 2}, {x: foot.x + 9, y: foot.y - 2},
    {x: mastTop.x + 7, y: mastTop.y}, {x: mastTop.x - 7, y: mastTop.y}
  ], steel, '#0b1923', 1.6);
  path(g, [{x: foot.x - dir * 5, y: foot.y - 4}, {x: mastTop.x - dir * 4, y: mastTop.y + 4}], '#d4e2df75', 1.2);
  const connection = {x: geo.board.x + dir * 9, y: rim.y - 33};
  const arm = [mastTop, {x: mastTop.x - dir * 8, y: mastTop.y - 7}, connection];
  g.lineJoin = 'round'; g.lineCap = 'round';
  path(g, arm, '#081722', 11);
  path(g, arm, post, 7);
  path(g, arm.map(p => ({x: p.x, y: p.y - 2})), '#d4dfdd85', 1.5);
  // A second brace completes a closed support triangle behind the glass.
  const brace = [{x: foot.x + dir * 1, y: rim.y + 49}, {x: geo.board.x + dir * 15, y: rim.y - 22}];
  path(g, brace, '#0a1823', 7);
  path(g, brace, '#526b77', 3.7);
  path(g, brace.map(p => ({x: p.x - dir * .8, y: p.y})), '#b6c7c455', .85);
  bolt(g, mastTop.x, mastTop.y - 1, 2);
  bolt(g, brace[0].x, brace[0].y, 1.8);
  // Rounded impact padding with a restrained seam, never a luminous pole.
  const padY = floor.y - 73;
  const pad = gradient(g, foot.x - 14, 0, foot.x + 14, 0,
    [[0, '#0c1622'], [.18, darkPad], [.72, darkPad], [1, '#0a1420']]);
  roundRect(g, foot.x - 14, padY, 28, 80, 3.8, pad, '#0a1421', 1);
  path(g, [{x: foot.x - 10.5, y: padY + 6}, {x: foot.x - 10.5, y: padY + 72}], '#c2cfca30', .9);
  path(g, [{x: foot.x + 10.5, y: padY + 6}, {x: foot.x + 10.5, y: padY + 72}], '#00071365', 1);
  path(g, [{x: foot.x - 9, y: padY + 8}, {x: foot.x + 9, y: padY + 8}], '#e5ece219', .8);
  roundRect(g, foot.x - 6, padY + 35, 12, 9, 1.3, '#0a142b38', '#c8d9d025', .65);
  g.restore();
}

function drawBoard(g, geo, arena) {
  const {boardPoint: p, dir, rim, board} = geo;
  const h = arena.hoop || {}, frame = h.frame || '#d4e1e5';
  const corners = [p(-33, 0), p(33, 0), p(33, 52), p(-33, 52)];
  const edge = corners.map(v => ({x: v.x + dir * 3.3, y: v.y + 1.3}));
  g.save();
  polygon(g, [corners[dir > 0 ? 1 : 0], edge[dir > 0 ? 1 : 0], edge[dir > 0 ? 2 : 3], corners[dir > 0 ? 2 : 3]], '#53747c', '#17323d', .6);
  polygon(g, [corners[2], edge[2], edge[3], corners[3]], '#36515c', '#142a38', .7);
  // Very light tinted acrylic: the venue remains visible through the board.
  polygon(g, corners, arena.id === 'miami' ? '#c9eee013' : '#b5deec13', '#10202a', 4.8);
  polygon(g, corners, null, frame, 2.5);
  const inset = [p(-30.5, 2.5), p(30.5, 2.5), p(30.5, 49.5), p(-30.5, 49.5)];
  polygon(g, inset, null, '#e4f9ff65', .65);
  g.save(); polygon(g, inset); g.clip();
  polygon(g, [p(-39, -8), p(-29, -8), p(27, 61), p(12, 61)], '#e8faff0c');
  polygon(g, [p(-24, -5), p(-21, -5), p(30, 54), p(25, 54)], '#ffffff0e');
  const reflection = gradient(g, 0, board.y, 0, board.y + 52, [[0, '#def5ff16'], [.5, '#def5ff00'], [1, '#0418230a']]);
  polygon(g, inset, reflection);
  g.restore();
  path(g, [p(-32, .5), p(32, .5)], '#f5fff5c9', 1);
  // Regulation-style target box is painted on the glass itself.
  const target = [p(-12.5, 25), p(12.5, 25), p(12.5, 47), p(-12.5, 47)];
  polygon(g, target, null, '#102b3538', 3.2);
  polygon(g, target, null, '#fff7debf', 1.7);
  for (const u of [-28.5, 28.5]) for (const v of [5, 47]) { const q = p(u, v); bolt(g, q.x, q.y, .95); }
  // The breakaway bracket joins the orange ring to a visible mounting plate.
  const mount = {x: board.x, y: rim.y - 8.5};
  roundRect(g, mount.x - 5, mount.y - 5, 10, 10, 1, '#4a3025', '#a0a69b', .7);
  for (const dy of [-2.5, 2.5]) { bolt(g, mount.x - 2.5, mount.y + dy, .6); bolt(g, mount.x + 2.5, mount.y + dy, .6); }
  path(g, [{x: mount.x, y: mount.y + 2}, {x: rim.x + dir * 17.5, y: rim.y - 1.8}], '#522519', 6.1);
  path(g, [{x: mount.x, y: mount.y + 1}, {x: rim.x + dir * 17.5, y: rim.y - 2.8}], '#e96d30', 3.4);
  g.restore();
}

function staticHardware(g, geo, arena) {
  const key = `${arena.id}:${JSON.stringify(arena.hoop || {})}:${geo.side}:${geo.floor.x}:${geo.floor.y}:${geo.rim.y}`;
  let entry = hardwareCache.get(key);
  if (!entry) {
    const left = Math.floor(Math.min(geo.foot.x - 60, geo.board.x - 41)), top = Math.floor(geo.board.y - 7);
    const right = Math.ceil(Math.max(geo.foot.x + 60, geo.board.x + 41)), bottom = Math.ceil(geo.floor.y + 28);
    const width = right - left, height = bottom - top;
    const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(width * DENSITY, height * DENSITY)
      : typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (!c) { drawSupport(g, geo, arena); drawBoard(g, geo, arena); return; }
    c.width = width * DENSITY; c.height = height * DENSITY;
    const cg = c.getContext('2d'); cg.scale(DENSITY, DENSITY); cg.translate(-left, -top);
    drawSupport(cg, geo, arena); drawBoard(cg, geo, arena);
    entry = {canvas: c, x: left, y: top, width, height}; hardwareCache.set(key, entry);
    if (hardwareCache.size > 12) hardwareCache.delete(hardwareCache.keys().next().value);
  }
  g.drawImage(entry.canvas, entry.x, entry.y, entry.width, entry.height);
}

function netMotion(geo, time, options) {
  if (options.reducedMotion) return {stretch: 0, sway: 0, flex: 0};
  const effects = options.state?.effects || [], worldX = geo.side ? 905 : 95;
  const scored = effects.some(e => e.type === 'text' && /^\+\d/.test(e.text || '') && Math.abs((e.x ?? 500) - worldX) < 36);
  const effect = effects.find(e => Math.abs((e.x ?? 500) - worldX) < 36 && Math.abs((e.y ?? 300) - 300) < 45 &&
    (e.type === 'score' || e.type === 'dunk' || e.type === 'burst' && scored));
  if (effect) {
    const age = Math.max(0, (effect.maxLife || 1) - (effect.life || 0));
    const force = /BOOMSHAKA|DUNK/.test(options.state?.announcement || '') ? 1.35 : 1;
    const impulse = Math.sin(Math.min(1, age / .16) * Math.PI / 2) * Math.exp(-age * 3.8) * force;
    return {stretch: impulse * 8, sway: Math.sin(age * 19) * Math.exp(-age * 3.2) * force * 2.8 * geo.dir, flex: impulse * .5};
  }
  const impact = options.rimImpact;
  if (impact?.side === geo.side) {
    const amount = clamp(impact.strength || 0, 0, 3) / 3;
    return {stretch: Math.abs(Math.sin(time * 18)) * amount * 4.5, sway: Math.sin(time * 22) * amount * 2 * geo.dir, flex: amount * .3};
  }
  return {stretch: 0, sway: 0, flex: 0};
}

function drawNet(g, geo, motion, front) {
  const {rim} = geo, cords = 12, levels = 4;
  const node = (j, level) => {
    const q = level / levels, angle = j / cords * TAU + level * Math.PI / cords;
    const radius = 22.3 * (1 - q) + 12.2 * q;
    return {x: rim.x + Math.cos(angle) * radius + motion.sway * q * q,
      y: rim.y + 1.8 + q * (28 + motion.stretch) + Math.sin(angle) * (5.3 - q * 2.3), angle};
  };
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  // Each diagonal joins an attachment on the upper ring to a lower knot.
  for (let level = 0; level < levels; level++) for (let j = 0; j < cords; j++) {
    for (const next of [j, j - 1]) {
      const a = node(j, level), b = node(next, level + 1);
      const near = Math.sin((a.angle + b.angle) / 2) >= 0;
      if (near !== front) continue;
      const sag = .55 + level * .22;
      g.beginPath(); g.moveTo(a.x, a.y);
      g.quadraticCurveTo((a.x + b.x) * .5, (a.y + b.y) * .5 + sag, b.x, b.y);
      g.strokeStyle = front ? '#14243163' : '#20354142'; g.lineWidth = front ? 1.75 : 1.35; g.stroke();
      g.strokeStyle = front ? '#f1eee0d9' : '#a9c2c4a6'; g.lineWidth = front ? .83 : .64; g.stroke();
    }
  }
  // The open lower hem is an ellipse, with no opaque cone covering the ball.
  ellipse(g, rim.x + motion.sway, rim.y + 29.8 + motion.stretch, 12.2, 3,
    null, front ? '#f0eee0c9' : '#a9c1c480', front ? .9 : .65, front ? 0 : Math.PI, front ? Math.PI : TAU);
  if (front) for (let j = 0; j < cords; j++) {
    const a = node(j, 0); if (Math.sin(a.angle) < 0) continue;
    ellipse(g, a.x, a.y - .2, .75, .9, '#f3edda');
  }
  g.restore();
}

function drawRim(g, geo, motion, front) {
  const {rim} = geo, start = front ? 0 : Math.PI, end = front ? Math.PI : TAU;
  const ry = 6.2 + motion.flex;
  g.save(); g.lineCap = 'round';
  ellipse(g, rim.x, rim.y + .7, 23, ry, null, '#4c241f', 4.8, start, end);
  ellipse(g, rim.x, rim.y, 23, ry, null, front ? '#f27b36' : '#d65c2b', 3.3, start, end);
  ellipse(g, rim.x, rim.y - .65, 22.8, ry - .25, null, front ? '#ffd291' : '#ffb46b', .85, start, end);
  g.restore();
}

function netLayer(g, geo, motion, front) {
  // Most frames use the resting net. Small cached deformation steps keep a
  // swish smooth without rebuilding hundreds of cord strokes every frame.
  const pose = {stretch: Math.round(motion.stretch * 3) / 3, sway: Math.round(motion.sway * 3) / 3, flex: Math.round(motion.flex * 5) / 5};
  const key = `${front}:${pose.stretch}:${pose.sway}:${pose.flex}`;
  let image = netCache.get(key);
  if (image) { netCache.delete(key); netCache.set(key, image); }
  else {
    image = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(64 * DENSITY, 64 * DENSITY)
      : typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (!image) { drawNet(g, geo, motion, front); drawRim(g, geo, motion, front); return; }
    image.width = image.height = 64 * DENSITY;
    const ng = image.getContext('2d'); ng.scale(DENSITY, DENSITY);
    const local = {...geo, rim: {x: 32, y: 11}};
    drawNet(ng, local, pose, front); drawRim(ng, local, pose, front);
    netCache.set(key, image);
    if (netCache.size > 160) netCache.delete(netCache.keys().next().value);
  }
  g.drawImage(image, geo.rim.x - 32, geo.rim.y - 11, 64, 64);
}

/**
 * Draw once before players/ball (foreground:false), once after (true).
 * Pass state for ordinary swishes; rimImpact remains a compatible dunk fallback.
 */
export function drawPremiumHoop(g, options = {}) {
  const {arena = {id: 'stadium'}, side = 0, time = 0, foreground = false} = options;
  const geo = getHoopGeometry(side, options), motion = netMotion(geo, time, options);
  g.save(); g.imageSmoothingEnabled = true;
  if (!foreground) staticHardware(g, geo, arena);
  netLayer(g, geo, motion, foreground);
  g.restore();
  return geo;
}
