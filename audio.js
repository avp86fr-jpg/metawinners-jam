// Original 16-bar arrangements: motif, answer, breakdown, and return.
// Bass and percussion carry the rests between melodic phrases.
const ARENA_MUSIC = Object.freeze({
  casino: {bpm:112,swing:.13,roots:[65.406,55,73.416,49,65.406,55,87.307,49],chords:['maj','min','min','dom','maj','min','maj','dom'],
    bassType:'triangle',bassVolume:.25,bass:[0,null,7,12,null,0,null,7,0,null,12,7,null,0,null,7],bassB:[0,null,12,null,7,null,4,7,0,null,7,12,null,7,2,7],
    kick:[0,5,8,11],kickB:[0,3,8,13],kickVolume:.4,snare:[2,6,10,14],snareVolume:.08,hatVolume:.04,
    notes:[12,null,16,19,null,23,null,19,16,null,14,null,12,null,null,7],answer:[19,null,23,null,26,23,19,null,16,null,14,12,null,11,null,null],
    leadType:'triangle',leadVolume:.063,leadLength:.18,chordVolume:.02,chordLength:.36},
  stadium: {bpm:140,swing:0,roots:[49,49,58.27,65.406,49,49,65.406,73.416],chords:['min','min','maj','min','min','min','min','dom'],
    bassType:'triangle',bassVolume:.3,bass:[0,null,0,12,null,0,null,7,0,null,12,0,null,7,0,null],bassB:[0,0,null,7,null,12,0,null,0,null,12,null,7,7,10,null],
    kick:[0,3,6,8,10,14],kickB:[0,3,7,8,11,14],kickVolume:.55,snare:[4,12],snareVolume:.19,hatVolume:.055,
    notes:[12,null,null,19,null,null,24,null,22,null,19,null,12,null,null,null],answer:[12,null,12,null,19,null,22,24,null,null,19,null,15,null,12,null],
    leadType:'triangle',leadVolume:.075,leadLength:.14,chordVolume:.022,chordLength:.16},
  miami: {bpm:100,swing:.07,roots:[65.406,55,87.307,49,65.406,55,73.416,49],chords:['maj','min','maj','dom','maj','min','min','dom'],
    bassType:'sine',bassVolume:.32,bass:[0,null,null,7,null,0,null,null,0,null,12,null,null,7,null,0],bassB:[0,null,7,null,null,12,null,7,0,null,null,4,7,null,2,null],
    kick:[0,7,8,14],kickB:[0,5,8,11,14],kickVolume:.36,snare:[4,12],snareVolume:.085,hatVolume:.03,
    notes:[12,null,19,null,null,16,24,null,21,null,null,19,null,16,null,14],answer:[19,null,null,24,null,21,null,19,16,null,14,null,12,null,null,null],
    leadType:'sine',leadVolume:.085,leadLength:.25,chordVolume:.022,chordLength:.8},
  bugatti: {bpm:126,swing:0,roots:[55,55,65.406,49,55,55,73.416,51.913],chords:['min','min','maj','maj','min','min','min','dim'],
    bassType:'sawtooth',bassVolume:.11,bass:[0,0,12,0,null,0,7,0,0,null,12,0,null,7,0,12],bassB:[0,null,12,0,7,null,0,12,0,null,7,12,null,0,10,7],
    kick:[0,2,4,6,8,10,12,14],kickB:[0,2,4,6,8,10,12,14],kickVolume:.4,snare:[2,6,10,14],snareVolume:.1,hatVolume:.04,
    notes:[null,24,null,19,null,null,26,null,null,24,null,22,null,null,19,null],answer:[24,null,19,null,22,null,26,null,24,null,null,19,null,15,null,null],
    leadType:'triangle',leadVolume:.075,leadLength:.12,chordVolume:.018,chordLength:.27},
  blacktop: {bpm:132,swing:.045,roots:[55,65.406,73.416,55,55,65.406,49,82.407],chords:['min','maj','min','min','min','maj','maj','dom'],
    bassType:'triangle',bassVolume:.29,bass:[0,null,0,0,null,7,null,0,0,null,12,null,7,null,0,null],bassB:[0,null,12,0,null,7,0,null,0,null,7,10,null,7,0,null],
    kick:[0,4,7,8,12,14],kickB:[0,3,6,8,11,14],kickVolume:.5,snare:[4,12],snareVolume:.17,hatVolume:.045,
    notes:[12,null,null,15,null,null,19,null,22,null,19,null,15,null,12,null],answer:[19,null,22,null,24,22,null,19,15,null,12,null,null,10,null,null],
    leadType:'triangle',leadVolume:.072,leadLength:.17,chordVolume:.019,chordLength:.24},
});

// A softer, smaller audience outdoors/VIP-side; a fuller enclosed stadium.
// These gains sit below both the soundtrack and the existing impact effects.
const ARENA_CROWD = Object.freeze({
  casino: {bed: 0.075, peak: 0.30, lowpass: 1450, voice: 215, spacing: 5.4},
  stadium: {bed: 0.13, peak: 0.48, lowpass: 1900, voice: 185, spacing: 3.8},
  miami: {bed: 0.055, peak: 0.27, lowpass: 1650, voice: 245, spacing: 6.0},
  bugatti: {bed: 0.060, peak: 0.28, lowpass: 1350, voice: 205, spacing: 5.8},
  blacktop: {bed: 0.085, peak: 0.35, lowpass: 1750, voice: 225, spacing: 4.6},
});

/** Small, original Web Audio soundtrack. Nothing plays before a user gesture. */
export class ArcadeAudio {
  constructor(options = false) {
    this._muted = typeof options === 'boolean' ? options : Boolean(options.muted);
    this.context = null;
    this.master = null;
    this.music = null;
    this.effects = null;
    this.noiseBuffer = null;
    this.crowd = null;
    this._crowdBuffer = null;
    this._applauseBuffer = null;
    this._crowdBed = null;
    this._applause = null;
    this._crowdSources = new Set();
    this._nextCrowdVoice = 0;
    this._lastCrowdReaction = -Infinity;
    this._crowdStrength = 0;
    this._crowdFinishing = false;
    this._presentationSources = new Set();
    this._normalSources = new Set();
    this._voiceCounts = {music: 0, effects: 0};
    this._stereoRoutes = new Map();
    this._musicLevel = 0.34;
    this._duckUntil = 0;
    this._duckFloor = this._musicLevel;
    this._lastPresentation = null;
    this._musicWanted = false;
    this._arena = 'casino';
    this._timer = null;
    this._step = 0;
    this._nextBeat = 0;
    this._last = new Map();
    this._supported = true;
    this._visibility = () => {
      if (typeof document !== 'undefined' && document.hidden) this._stopScheduler();
      else this._startScheduler();
    };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this._visibility);
  }

  get muted() { return this._muted; }
  get arena() { return this._arena; }

  setArena(id) {
    const next = typeof id === 'string' && Object.hasOwn(ARENA_MUSIC, id) ? id : 'casino';
    if (next === this._arena) return this._arena;
    this._arena = next;
    this._stopScheduler();
    this._step = 0;
    // This observes the same unlock, mute, visibility, and play-intent gates.
    this._startScheduler();
    return this._arena;
  }

  async unlock() {
    if (!this._supported) return false;
    try {
      if (!this.context) {
        const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Context) { this._supported = false; return false; }
        this.context = new Context();
        this.master = this.context.createGain();
        this.master.gain.value = this._muted ? 0 : 0.3;
        const limiter = this.context.createDynamicsCompressor();
        limiter.threshold.value = -10;
        limiter.knee.value = 12;
        limiter.ratio.value = 5;
        this.master.connect(limiter);
        limiter.connect(this.context.destination);
        this.music = this.context.createGain();
        this.music.gain.value = this._musicLevel;
        this.music.connect(this.master);
        this.effects = this.context.createGain();
        this.effects.gain.value = 0.8;
        this.effects.connect(this.master);
        this.crowd = this.context.createGain();
        this.crowd.gain.value = 0.25;
        this.crowd.connect(this.master);
        this.noiseBuffer = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this._createCrowdBuffers();
        // A one-sample source unlocks older mobile Web Audio implementations.
        const silent = this.context.createBufferSource();
        silent.buffer = this.context.createBuffer(1, 1, this.context.sampleRate);
        silent.connect(this.master);
        silent.start();
      }
      if (this.context.state === 'suspended') await this.context.resume();
      this._startScheduler();
      return this.context.state === 'running';
    } catch { return false; }
  }

  setMuted(value) {
    this._muted = Boolean(value);
    if (this.master && this.context) {
      const now = this.context.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(this._muted ? 0 : 0.3, now, 0.025);
    }
    if (this._muted) this._stopScheduler();
    else this._startScheduler();
    return this._muted;
  }

  toggle() { return this.setMuted(!this._muted); }

  startMusic() {
    this._musicWanted = true;
    this._startScheduler();
  }

  stopMusic() {
    this._musicWanted = false;
    this._stopScheduler();
  }

  // Results only: the final whistle/cheer can settle while the rhythm stops.
  // Pause, quit, mute, and hidden-tab handling still call stopMusic/_stopCrowd.
  finishMusic() {
    this._musicWanted = false;
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    this._stopNormalSources('music');
    if (!this.context || !this._crowdBed || this._crowdFinishing) return;
    this._crowdFinishing = true;
    const now = this.context.currentTime, gain = this._crowdBed.gain.gain;
    // Preserve the already scheduled initial cheer rise, then fade to silence.
    gain.cancelScheduledValues(now + 0.22);
    gain.exponentialRampToValueAtTime(0.0001, now + 2.15);
    this._crowdBed.source.stop(now + 2.2);
    if (this._applause) this._applause.source.stop(now + 2.18);
  }

  _startScheduler() {
    if (this._timer || !this._musicWanted || this._muted || !this.context || this.context.state !== 'running') return;
    if (typeof document !== 'undefined' && document.hidden) return;
    // A fast rematch replaces the results tail with a fresh venue bed.
    if (this._crowdFinishing) this._stopCrowd();
    this._startCrowd();
    this._nextBeat = this.context.currentTime + 0.04;
    const schedule = () => {
      if (!this.context || this.context.state !== 'running') return;
      this._updateCrowd(this.context.currentTime);
      // Keep scheduling bounded if a browser tab has been throttled.
      if (this._nextBeat < this.context.currentTime - 0.2) this._nextBeat = this.context.currentTime + 0.02;
      while (this._nextBeat < this.context.currentTime + 0.12) {
        const step = this._step++ % 128;
        const track = ARENA_MUSIC[this._arena];
        this._beat(step, this._nextBeat);
        this._nextBeat += 60 / track.bpm / 2 * (1 + (step % 2 ? -track.swing : track.swing));
      }
    };
    schedule();
    this._timer = setInterval(schedule, 50);
  }

  _stopScheduler() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    this._stopCrowd();
    this._stopPresentation();
    this._stopNormalSources();
    if (this.music && this.context) {
      this.music.gain.cancelScheduledValues(this.context.currentTime);
      this.music.gain.setValueAtTime(this._musicLevel, this.context.currentTime);
    }
    this._duckUntil = 0;
    this._duckFloor = this._musicLevel;
  }

  _route(bus, pan = 0) {
    if (!pan || typeof this.context.createStereoPanner !== 'function') return bus;
    const position = Math.max(-0.75, Math.min(0.75, Math.round(pan * 4) / 4));
    if (!position) return bus;
    let routes = this._stereoRoutes.get(bus);
    if (!routes) { routes = new Map(); this._stereoRoutes.set(bus, routes); }
    if (!routes.has(position)) {
      try {
        const route = this.context.createStereoPanner();
        route.pan.value = position;
        route.connect(bus);
        routes.set(position, route);
      } catch { routes.set(position, bus); }
    }
    return routes.get(position);
  }

  _canNormalVoice(bus) {
    const now = this.context.currentTime;
    for (const entry of this._normalSources) if (entry.endsAt <= now) this._dropNormalSource(entry);
    const kind = bus === this.music ? 'music' : 'effects';
    return this._normalSources.size < 32 && this._voiceCounts[kind] < 18;
  }

  _trackNormalSource(source, nodes, bus, endsAt) {
    const kind = bus === this.music ? 'music' : 'effects';
    const entry = {source, nodes, kind, endsAt};
    this._normalSources.add(entry);
    this._voiceCounts[kind]++;
    source.onended = () => this._dropNormalSource(entry);
  }

  _dropNormalSource(entry, stop = false) {
    if (!this._normalSources.delete(entry)) return;
    entry.source.onended = null;
    if (stop) { try { entry.source.stop(); } catch { /* Already ended. */ } }
    for (const node of entry.nodes) node.disconnect();
    this._voiceCounts[entry.kind]--;
  }

  _stopNormalSources(kind) {
    for (const entry of [...this._normalSources]) if (!kind || entry.kind === kind) this._dropNormalSource(entry, true);
  }

  _duckMusic(amount, duration, now = this.context.currentTime) {
    if (!this.music || !this._musicWanted) return;
    const floor = this._musicLevel * amount;
    if (now < this._duckUntil && floor >= this._duckFloor) return;
    const param = this.music.gain;
    if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(now);
    else { param.cancelScheduledValues(now); param.setValueAtTime(Math.max(0.001, param.value || this._musicLevel), now); }
    param.exponentialRampToValueAtTime(floor, now + 0.025);
    param.exponentialRampToValueAtTime(this._musicLevel, now + duration);
    this._duckFloor = floor;
    this._duckUntil = now + duration;
  }

  _tone(frequency, duration, {at, volume = 0.2, type = 'triangle', end = null, bus = this.effects, attack = 0.006, crowd = false, presentation = false, pan = 0, cutoff = null} = {}) {
    if (!this.context || !bus) return;
    if (crowd && this._crowdSources.size >= 7) return;
    if (presentation && this._presentationSources.size >= 18) return;
    if (!crowd && !presentation && !this._canNormalVoice(bus)) return;
    const t = at ?? this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t);
    if (end) osc.frequency.exponentialRampToValueAtTime(Math.max(12, end), t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), t + attack);
    // Pitched music has a short body before release. Percussive pitch sweeps
    // keep their fast decay; this avoids a soundtrack made only of tiny clicks.
    if (bus === this.music && !end) {
      const hold = Math.min(duration * 0.32, Math.max(0, duration - attack - 0.015));
      if (hold > 0) gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.78), t + attack + hold);
    }
    gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(attack + 0.01, duration));
    const nodes = [osc, gain];
    if (cutoff || type === 'square' || type === 'sawtooth') {
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = cutoff || 3200;
      if (filter.Q) filter.Q.value = 0.5;
      osc.connect(filter); filter.connect(gain); nodes.push(filter);
    } else osc.connect(gain);
    gain.connect(this._route(bus, pan));
    osc.start(t);
    osc.stop(t + duration + 0.03);
    if (crowd) this._trackCrowdSource(osc, nodes);
    else if (presentation) this._trackPresentationSource(osc, nodes);
    else this._trackNormalSource(osc, nodes, bus, t + duration + 0.03);
  }

  _trackPresentationSource(source, nodes) {
    const entry = {source, nodes};
    this._presentationSources.add(entry);
    source.onended = () => {
      for (const node of nodes) node.disconnect();
      this._presentationSources.delete(entry);
    };
  }

  _stopPresentation() {
    for (const entry of this._presentationSources) {
      entry.source.onended = null;
      try { entry.source.stop(); } catch { /* Already ended. */ }
      for (const node of entry.nodes) node.disconnect();
    }
    this._presentationSources.clear();
    this._lastPresentation = null;
  }

  _stinger(type, details, now) {
    const family = type === 'tipoff' || type === 'start' ? 'tipoff'
      : ['victory', 'defeat', 'end'].includes(type) ? 'result' : type;
    const priority = type === 'start' || type === 'end' ? 0 : 1;
    const previous = this._lastPresentation;
    // A dedicated presentation cue wins over a legacy engine start/end event.
    // It can replace the generic cue if both arrive during the same frame.
    if (previous && previous.family === family && now - previous.at < 0.8 && priority <= previous.priority) return false;
    if (type !== 'character-select') {
      this._stopPresentation();
      this._lastPresentation = {family, priority, at: now};
      this._duckMusic(type === 'fire' ? 0.38 : 0.48, type === 'victory' ? 1.2 : 0.8, now);
    }
    const tone = (frequency, duration, options = {}) => this._tone(frequency, duration, {at: now, presentation: true, ...options});
    const noise = (duration, options = {}) => this._noise(duration, {at: now, presentation: true, ...options});
    const brass = (frequency, offset, duration = 0.16, volume = 0.065) => {
      tone(frequency, duration, {at: now + offset, volume, type: 'sawtooth', attack: 0.018});
      tone(frequency * 2, duration * 0.8, {at: now + offset, volume: volume * 0.26, type: 'triangle', attack: 0.012});
    };
    const impact = (offset = 0, volume = 0.3) => {
      tone(140, 0.27, {at: now + offset, end: 36, volume, type: 'sine'});
      noise(0.12, {at: now + offset, volume: 0.095, frequency: 1600, type: 'lowpass'});
    };
    switch (type) {
      case 'matchup':
        tone(110, 0.36, {end: 880, volume: 0.055, type: 'triangle', attack: 0.035});
        noise(0.4, {volume: 0.07, frequency: 2100});
        impact(0.36, 0.29);
        [261.63, 329.63, 392].forEach(note => brass(note, 0.38, 0.19, 0.043));
        tone(1046.5, 0.25, {at: now + 0.63, volume: 0.045, type: 'sine'});
        break;
      case 'tipoff':
      case 'start':
        impact(0, 0.32);
        brass(261.63, 0.025, 0.1);
        brass(392, 0.14, 0.1);
        brass(523.25, 0.26, 0.25, 0.075);
        break;
      case 'character-select': {
        const pitch = details.slot === 1 ? 1.125 : 1;
        tone(660 * pitch, 0.07, {end: 880 * pitch, volume: 0.1, type: 'triangle'});
        tone(1320 * pitch, 0.11, {at: now + 0.045, volume: 0.045, type: 'square'});
        tone(105, 0.065, {end: 55, volume: 0.14, type: 'sine'});
        break;
      }
      case 'victory':
        impact(0, 0.28);
        [392, 523.25, 659.25, 783.99].forEach((note, i) => brass(note, i * 0.125, i === 3 ? 0.26 : 0.12, 0.07));
        [523.25, 659.25, 783.99].forEach(note => tone(note, 0.36, {at: now + 0.74, volume: 0.047, type: 'sawtooth', attack: 0.025}));
        break;
      case 'defeat':
        tone(90, 0.28, {end: 42, volume: 0.21, type: 'sine'});
        [392, 349.23, 293.66, 261.63].forEach((note, i) => brass(note, i * 0.15, i === 3 ? 0.28 : 0.13, 0.055));
        tone(523.25, 0.15, {at: now + 0.61, volume: 0.035, type: 'sine'});
        break;
      case 'end':
        [523.25, 392, 329.63, 261.63].forEach((note, i) => brass(note, i * 0.16, 0.18, 0.055));
        break;
      case 'fire':
        noise(0.55, {volume: 0.14, frequency: 850, type: 'lowpass'});
        tone(90, 0.31, {end: 720, volume: 0.075, type: 'triangle', attack: 0.025});
        [220, 329.63, 440, 659.25, 880].forEach((note, i) => brass(note, i * 0.065, 0.13, 0.055));
        [440, 659.25].forEach(note => tone(note, 0.25, {at: now + 0.43, volume: 0.07, type: 'triangle'}));
        break;
    }
    return true;
  }

  _createCrowdBuffers() {
    const rate = this.context.sampleRate;
    this._crowdBuffer = this.context.createBuffer(1, rate * 6, rate);
    const bed = this._crowdBuffer.getChannelData(0);
    let low = 0, body = 0;
    for (let i = 0; i < bed.length; i++) {
      const white = Math.random() * 2 - 1, t = i / rate;
      low = low * 0.97 + white * 0.03;
      body = body * 0.72 + white * 0.28;
      // Rounded, slowly shifting voice-band energy instead of white-noise hiss.
      const movement = 0.72 + Math.sin(t * Math.PI / 3) * 0.11 + Math.sin(t * Math.PI * 5 / 3) * 0.07;
      bed[i] = (low * 0.9 + body * 0.65) * movement;
    }
    // Zero both ends gently to prevent a click at the reusable loop seam.
    const seam = Math.floor(rate * 0.035);
    for (let i = 0; i < seam; i++) {
      const fade = i / (seam - 1);
      bed[i] *= fade;
      bed[bed.length - 1 - i] *= fade;
    }
    this._applauseBuffer = this.context.createBuffer(1, Math.ceil(rate * 2.4), rate);
    const claps = this._applauseBuffer.getChannelData(0);
    // An irregular group of short handclaps, precomputed and reused on scores.
    for (let clap = 0; clap < 42; clap++) {
      const start = Math.floor((clap / 20 + Math.random() * 0.035) * rate);
      const length = Math.floor(rate * (0.022 + Math.random() * 0.026));
      const strength = 0.2 + Math.random() * 0.26;
      let soft = 0;
      for (let i = 0; i < length && start + i < claps.length; i++) {
        soft = soft * 0.5 + (Math.random() * 2 - 1) * 0.5;
        claps[start + i] += soft * Math.exp(-i / (length * 0.17)) * strength;
      }
    }
  }

  _trackCrowdSource(source, nodes) {
    const entry = {source, nodes};
    this._crowdSources.add(entry);
    source.onended = () => {
      for (const node of nodes) node.disconnect();
      this._crowdSources.delete(entry);
      if (this._applause === entry) this._applause = null;
      if (this._crowdBed?.source === source) { this._crowdBed = null; this._crowdFinishing = false; }
    };
    return entry;
  }

  _stopCrowdSource(entry) {
    if (!entry) return;
    entry.source.onended = null;
    try { entry.source.stop(); } catch { /* Already ended. */ }
    for (const node of entry.nodes) node.disconnect();
    this._crowdSources.delete(entry);
  }

  _startCrowd() {
    if (this._crowdBed || !this.crowd || !this._crowdBuffer) return;
    const now = this.context.currentTime, profile = ARENA_CROWD[this._arena];
    const source = this.context.createBufferSource(), band = this.context.createBiquadFilter();
    const lowpass = this.context.createBiquadFilter(), gain = this.context.createGain();
    source.buffer = this._crowdBuffer; source.loop = true;
    band.type = 'bandpass'; band.frequency.value = 540;
    if (band.Q) band.Q.value = 0.55;
    lowpass.type = 'lowpass'; lowpass.frequency.value = profile.lowpass;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(profile.bed, now + 0.8);
    source.connect(band); band.connect(lowpass); lowpass.connect(gain); gain.connect(this.crowd);
    const entry = this._trackCrowdSource(source, [source, band, lowpass, gain]);
    this._crowdBed = {...entry, gain};
    source.start(now, Math.random() * 4);
    this._nextCrowdVoice = now + 2.2;
  }

  _stopCrowd() {
    for (const entry of [...this._crowdSources]) this._stopCrowdSource(entry);
    this._crowdBed = null;
    this._applause = null;
    this._lastCrowdReaction = -Infinity;
    this._crowdStrength = 0;
    this._crowdFinishing = false;
  }

  _updateCrowd(now) {
    if (!this._crowdBed || now < this._nextCrowdVoice) return;
    const profile = ARENA_CROWD[this._arena];
    this._nextCrowdVoice = now + profile.spacing + Math.random() * 1.4;
    if (now - this._lastCrowdReaction < 2.6) return;
    const pitch = profile.voice * (0.8 + Math.random() * 0.45);
    this._tone(pitch, 0.35, {at: now, end: pitch * 1.07, volume: 0.028, type: 'sine', bus: this.crowd, attack: 0.09, crowd: true, pan: -0.5});
    this._tone(pitch * 1.24, 0.28, {at: now + 0.13, end: pitch * 1.16, volume: 0.019, type: 'sine', bus: this.crowd, attack: 0.07, crowd: true, pan: 0.5});
  }

  _crowdReaction(type, details, now) {
    if (!this._musicWanted || !this._crowdBed) return;
    let strength = 0, duration = 0;
    if (type === 'score') { strength = details.dunk ? 1.5 : details.points === 3 ? 1.15 : 0.9; duration = details.dunk ? 2.3 : 1.65; }
    else if (type === 'block' && !details.attempt) { strength = 1.05; duration = 1.3; }
    else if (type === 'fire') { strength = 1.6; duration = 2.6; }
    else if (type === 'end' || type === 'victory') { strength = 1.4; duration = 2.3; }
    else if (type === 'defeat') { strength = 0.65; duration = 1.4; }
    if (!strength || (now - this._lastCrowdReaction < 0.5 && strength <= this._crowdStrength)) return;
    this._lastCrowdReaction = now; this._crowdStrength = strength;
    const profile = ARENA_CROWD[this._arena], param = this._crowdBed.gain.gain;
    const peak = Math.min(0.65, profile.peak * strength);
    const current = Math.max(profile.bed, Math.min(peak, param.value || profile.bed));
    if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(now);
    else { param.cancelScheduledValues(now); param.setValueAtTime(current, now); }
    param.exponentialRampToValueAtTime(peak, now + 0.18);
    param.exponentialRampToValueAtTime(profile.bed, now + duration);
    this._nextCrowdVoice = now + duration + profile.spacing;
    this._stopCrowdSource(this._applause); this._applause = null;
    if (this._crowdSources.size < 7) {
      const source = this.context.createBufferSource(), filter = this.context.createBiquadFilter(), gain = this.context.createGain();
      source.buffer = this._applauseBuffer;
      filter.type = 'bandpass'; filter.frequency.value = 1500;
      if (filter.Q) filter.Q.value = 0.7;
      const start = now + 0.035, end = now + Math.min(duration, 2.35);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.13 * strength, start + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      source.connect(filter); filter.connect(gain); gain.connect(this.crowd);
      this._applause = this._trackCrowdSource(source, [source, filter, gain]);
      source.start(start); source.stop(end + 0.02);
    }
    for (let i = 0; i < 3; i++) {
      const pitch = profile.voice * (1.28 + i * 0.23 + Math.random() * 0.09);
      this._tone(pitch, 0.43 + i * 0.08, {at: now + 0.08 + i * 0.11, end: pitch * (1.18 - i * 0.05), volume: 0.05 * strength / (1 + i * 0.25), type: 'sine', bus: this.crowd, attack: 0.11, crowd: true, pan: (i - 1) * 0.5});
    }
  }

  _noise(duration, {at, volume = 0.14, frequency = 1800, type = 'highpass', bus = this.effects, presentation = false, pan = 0} = {}) {
    if (!this.context || !this.noiseBuffer || !bus) return;
    if (presentation && this._presentationSources.size >= 18) return;
    if (!presentation && !this._canNormalVoice(bus)) return;
    const t = at ?? this.context.currentTime;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    source.buffer = this.noiseBuffer;
    filter.type = type;
    filter.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this._route(bus, pan));
    source.start(t, Math.random() * 0.5);
    source.stop(t + duration + 0.02);
    if (presentation) this._trackPresentationSource(source, [source, filter, gain]);
    else this._trackNormalSource(source, [source, filter, gain], bus, t + duration + 0.02);
  }

  _beat(step, at) {
    const track = ARENA_MUSIC[this._arena], bus = this.music;
    const position = step % 16, block = Math.floor(step / 16) % 8;
    const section = Math.floor(step / 32) % 4;
    const breakdown = step % 128 >= 64 && step % 128 < 80;
    const root = track.roots[block], quality = track.chords[block];
    const minor = quality === 'min' || quality === 'dim';
    const tune = semitone => {
      let note = semitone;
      if (minor && semitone % 12 === 4) note--;
      if (quality !== 'maj' && semitone % 12 === 11) note--;
      if (quality === 'dim' && semitone % 12 === 7) note--;
      return root * Math.pow(2, note / 12);
    };
    const varied = section === 1 || section === 3;
    const kick = varied ? track.kickB : track.kick;
    if (kick.includes(position) && (!breakdown || position % 8 === 0)) {
      this._tone(118, 0.18, {at, volume: track.kickVolume, type: 'sine', end: 37, bus});
      this._noise(0.018, {at, volume: track.kickVolume * 0.06, frequency: 900, type: 'lowpass', bus});
    }
    if (track.snare.includes(position) && (!breakdown || position === 12)) {
      this._noise(0.115, {at, volume: track.snareVolume, frequency: 1700, type: 'bandpass', bus, pan: -0.25});
      this._tone(175, 0.07, {at, volume: track.snareVolume * 0.42, type: 'triangle', end: 110, bus});
      if (this._arena === 'stadium' || this._arena === 'blacktop') {
        this._noise(0.055, {at: at + 0.012, volume: track.snareVolume * 0.22, frequency: 3000, bus, pan: 0.25});
      }
    }
    // The break drops most hats; two-bar accents keep the rhythm from ticking.
    if (!breakdown || position % 4 === 2) {
      const open = position === 15 && section !== 0;
      const accent = [1,0.45,0.7,0.55,0.85,0.4,0.7,0.5][position % 8];
      this._noise(open ? 0.12 : 0.026, {at, volume: track.hatVolume * accent, frequency: 6200, bus, pan: 0.5});
    }
    const bass = (varied ? track.bassB : track.bass)[position];
    if (bass !== null) {
      this._tone(tune(bass), this._arena === 'bugatti' ? 0.105 : 0.21, {
        at, volume: track.bassVolume * (position % 4 === 0 ? 1 : 0.88), type: track.bassType, bus, cutoff: this._arena === 'bugatti' ? 750 : null,
      });
    }
    // Warm chords arrive sparingly, instead of a continuous pad layer.
    if (position === 0 || (position === 10 && !breakdown && section !== 2)) {
      const chord = quality === 'maj' ? [0,4,11] : quality === 'dom' ? [0,4,10] : quality === 'dim' ? [0,3,6] : [0,3,10];
      chord.forEach((interval, i) => this._tone(root * 4 * Math.pow(2, interval / 12), track.chordLength, {
        at: at + i * 0.012, volume: track.chordVolume, type: 'triangle', bus, attack: 0.025, pan: (i - 1) * 0.5,
      }));
    }
    const semitones = (varied ? track.answer : track.notes)[position];
    if (semitones !== null && !breakdown) {
      const note = tune(semitones) * 2;
      const pan = section % 2 ? 0.25 : -0.25;
      this._tone(note, track.leadLength, {at, volume: track.leadVolume, type: track.leadType, bus, pan});
      if ((this._arena === 'miami' || this._arena === 'bugatti') && position % 8 >= 6) {
        this._tone(note, track.leadLength * 0.8, {at: at + 60 / track.bpm * 0.75, volume: track.leadVolume * 0.22, type: track.leadType, bus, pan: -pan});
      }
      if (this._arena === 'casino' && (position === 3 || position === 11)) {
        this._tone(note * 2, 0.22, {at, volume: 0.021, type: 'sine', bus, pan: 0.5});
      }
    }
    if (this._arena === 'miami' && (position === 3 || position === 11)) {
      this._tone(position === 3 ? 245 : 190, 0.12, {at, end: position === 3 ? 175 : 135, volume: 0.07, type: 'sine', bus, pan: -0.5});
    }
    if (this._arena === 'casino' && position === 7) {
      this._tone(720, 0.025, {at, end: 520, volume: 0.035, type: 'triangle', bus, pan: -0.5});
    }
    // A short fill marks each four-bar turn; no additional timer is needed.
    if (step % 32 >= 30) {
      this._tone(position === 14 ? 170 : 125, 0.14, {at, end: position === 14 ? 110 : 80, volume: 0.13, type: 'sine', bus, pan: position === 14 ? -0.25 : 0.25});
      this._noise(0.04, {at, volume: 0.025, frequency: 2200, bus});
    }
  }

  event(event) {
    if (this._muted || !this.context || this.context.state !== 'running') return;
    if (typeof document !== 'undefined' && document.hidden) return;
    let type = typeof event === 'string' ? event : event?.type;
    const details = typeof event === 'object' && event !== null ? event : {};
    const aliases = {shoe: 'squeak', sneakers: 'squeak', skid: 'squeak', shot: 'shoot', basket: 'score', made: 'score', buzzer: 'end', gameover: 'end', gameOver: 'end', 'on-fire': 'fire', onFire: 'fire', turnover: 'whistle', miss: 'rim', rebound: 'bounce', charge: 'click'};
    type = aliases[type] || type;
    const now = this.context.currentTime;
    const cooldown = type === 'fire' ? 1.1 : type === 'squeak' ? 0.28 : type === 'bounce' ? 0.17 : type === 'click' || type === 'select' || type === 'character-select' ? 0.05 : 0.08;
    // An attempt and a confirmed hit can arrive in the same frame. A quiet
    // wind-up must never consume the confirmed rejection's sound cooldown.
    const soundKey = details.attempt ? `${type}:attempt` : type;
    if (now - (this._last.get(soundKey) ?? -1) < cooldown) return;
    this._last.set(soundKey, now);
    const pan = Number.isFinite(details.x) ? Math.max(-0.65, Math.min(0.65, (details.x - 500) / 700)) : 0;
    const tone = (frequency, duration, options = {}) => this._tone(frequency, duration, {at: now, pan, ...options});
    const noise = (duration, options = {}) => this._noise(duration, {at: now, pan, ...options});
    if (type === 'score') this._duckMusic(details.dunk ? 0.45 : 0.65, details.dunk ? 0.55 : 0.28, now);
    else if ((type === 'block' && !details.attempt) || type === 'shove') this._duckMusic(0.72, 0.2, now);
    const melody = (notes, interval = 0.09, volume = 0.17) => notes.forEach((frequency, i) => tone(frequency, 0.19, {at: now + i * interval, volume, type: 'square'}));
    switch (type) {
      case 'bounce':
        tone(150 + (Number(details.player) % 3 || 0) * 6, 0.085, {end: 62, volume: details.rebound ? 0.25 : 0.18, type: 'sine'});
        tone(410, 0.038, {end: 280, volume: 0.022, type: 'triangle'});
        noise(0.022, {volume: 0.045, frequency: 1100, type: 'lowpass'});
        break;
      case 'shoot':
        tone(280, 0.1, {end: 540, volume: 0.052});
        noise(0.095, {volume: 0.065, frequency: 2200});
        break;
      case 'pass':
        tone(350, details.turbo ? 0.12 : 0.08, {end: details.turbo ? 860 : 590, volume: 0.055});
        noise(details.turbo ? 0.12 : 0.065, {volume: details.turbo ? 0.085 : 0.05, frequency: 2000});
        break;
      case 'score':
        noise(0.19, {volume: 0.11, frequency: 3400, type: 'bandpass'});
        if (details.dunk) {
          tone(132, 0.31, {end: 31, volume: 0.52, type: 'sine'});
          noise(0.14, {volume: 0.23, frequency: 1350, type: 'lowpass'});
          tone(840, 0.16, {end: 720, volume: 0.075, type: 'sine'});
          tone(1410, 0.18, {at: now + 0.035, volume: 0.026, type: 'sine'});
        }
        tone(523.25, 0.13, {at: now + 0.055, volume: 0.065, type: 'triangle'});
        tone(783.99, 0.17, {at: now + 0.15, volume: 0.06, type: 'triangle'});
        if (details.points === 3) tone(1046.5, 0.16, {at: now + 0.25, volume: 0.05, type: 'triangle'});
        break;
      case 'dunk':
        // Takeoff is a rising rush; the rim only slams on a confirmed basket.
        tone(160, 0.22, {end: 580, volume: 0.085, type: 'triangle'});
        noise(0.24, {volume: 0.105, frequency: 2100});
        break;
      case 'squeak':
        tone(1280, 0.075, {end: 1820, volume: 0.043, type: 'sine'});
        tone(1550, 0.065, {at: now + 0.055, end: 970, volume: 0.026, type: 'sine'});
        noise(0.03, {volume: 0.023, frequency: 2500, type: 'bandpass'});
        break;
      case 'steal':
        melody([880, 1174.66], 0.055, 0.13);
        break;
      case 'jump':
        tone(165, 0.14, {end: 390, volume: 0.055, type: 'triangle'});
        noise(0.09, {volume: 0.035, frequency: 2400});
        break;
      case 'shove':
        noise(0.1, {volume: 0.085, frequency: 2100});
        tone(165, 0.18, {at: now + 0.02, end: 48, volume: 0.38, type: 'sine'});
        noise(0.13, {at: now + 0.02, volume: 0.16, frequency: 950, type: 'lowpass'});
        tone(420, 0.065, {at: now + 0.02, end: 180, volume: 0.06, type: 'triangle'});
        break;
      case 'block':
        if (details.attempt) {
          noise(0.085, {volume: 0.035, frequency: 2800});
          break;
        }
        // A hand slap, low thump, and falling rubber chirp mark ball contact.
        noise(0.045, {volume: 0.26, frequency: 1900});
        tone(145, 0.2, {end: 40, volume: 0.43, type: 'sine'});
        tone(660, 0.13, {at: now + 0.025, end: 190, volume: 0.12, type: 'triangle'});
        noise(0.16, {at: now + 0.025, volume: 0.065, frequency: 2700});
        break;
      case 'rim':
        tone(710, 0.15, {end: 665, volume: 0.09, type: 'sine'});
        tone(1060, 0.105, {volume: 0.045, type: 'sine'});
        noise(0.028, {volume: 0.07, frequency: 1450, type: 'bandpass'});
        break;
      case 'whistle':
        tone(1900, 0.18, {end: 2100, volume: 0.08, type: 'sine'});
        break;
      case 'matchup':
      case 'tipoff':
      case 'character-select':
      case 'victory':
      case 'defeat':
      case 'fire':
      case 'start':
      case 'end':
        if (!this._stinger(type, details, now)) return;
        break;
      case 'select':
        melody([659.25, 880], 0.055, 0.09);
        break;
      case 'switch':
      case 'click':
        tone(740, 0.045, {end: 920, volume: 0.08, type: 'square'});
        break;
    }
    // 'dunk' is emitted at takeoff; only score.dunk confirms a made slam.
    this._crowdReaction(type, details, now);
  }

  dispose() {
    this.stopMusic();
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this._visibility);
    if (this.context) this.context.close().catch(() => {});
    this.context = null;
    this.crowd = null;
    this._crowdBuffer = null;
    this._applauseBuffer = null;
    for (const [bus, routes] of this._stereoRoutes) for (const route of routes.values()) if (route !== bus) route.disconnect();
    this._stereoRoutes.clear();
  }
}
