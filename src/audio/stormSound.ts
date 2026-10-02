/**
 * Procedural Web Audio API sound synthesizer for storm ambiance, rain, wind,
 * explosive lightning strikes hitting trees, wood splintering, electrical plasma,
 * thunder claps, and game score chimes.
 */

class StormAudioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private masterGain: GainNode | null = null;

  // Ambient sound nodes
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private fireGain: GainNode | null = null;

  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    // Lazy initialize on first interaction
  }

  public init() {
    if (this.isInitialized && this.ctx && this.ctx.state === 'running') {
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.createNoiseBuffer();
      this.setupWind();
      this.setupRain();
      this.setupFireCrackle();

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio initialization error:', e);
    }
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < bufferSize; i++) {
      left[i] = Math.random() * 2 - 1;
      right[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  private setupWind() {
    if (!this.ctx || !this.noiseBuffer || !this.masterGain) return;

    const windSource = this.ctx.createBufferSource();
    windSource.buffer = this.noiseBuffer;
    windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(260, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(this.windFilter.frequency);
    lfo.start();

    windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    windSource.start();
  }

  private setupRain() {
    if (!this.ctx || !this.noiseBuffer || !this.masterGain) return;

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = this.noiseBuffer;
    rainSource.loop = true;

    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'lowpass';
    this.rainFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(400, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    rainSource.connect(highpass);
    highpass.connect(this.rainFilter);
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    rainSource.start();
  }

  private setupFireCrackle() {
    if (!this.ctx || !this.noiseBuffer || !this.masterGain) return;

    const fireSource = this.ctx.createBufferSource();
    fireSource.buffer = this.noiseBuffer;
    fireSource.loop = true;

    const fireFilter = this.ctx.createBiquadFilter();
    fireFilter.type = 'bandpass';
    fireFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    fireFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.fireGain = this.ctx.createGain();
    this.fireGain.gain.setValueAtTime(0, this.ctx.currentTime);

    fireSource.connect(fireFilter);
    fireFilter.connect(this.fireGain);
    this.fireGain.connect(this.masterGain);
    fireSource.start();
  }

  public setParameters(windStrength: number, rainIntensity: number, hasTreeFire: boolean, volume: number) {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), now, 0.05);

    if (this.windGain && this.windFilter) {
      const absWind = Math.min(1, Math.abs(windStrength) / 100);
      const targetGain = 0.04 + absWind * 0.28;
      this.windGain.gain.setTargetAtTime(targetGain, now, 0.1);
      this.windFilter.frequency.setTargetAtTime(200 + absWind * 550, now, 0.1);
    }

    if (this.rainGain && this.rainFilter) {
      const targetGain = rainIntensity * 0.35;
      this.rainGain.gain.setTargetAtTime(targetGain, now, 0.1);
      this.rainFilter.frequency.setTargetAtTime(1200 + rainIntensity * 2800, now, 0.1);
    }

    if (this.fireGain) {
      const targetFire = hasTreeFire ? 0.09 : 0.0;
      this.fireGain.gain.setTargetAtTime(targetFire, now, 0.3);
    }
  }

  /**
   * Powerful, explosive sound when lightning strikes a tree:
   * 1. Supersonic acoustic crack & shockwave
   * 2. Violent wood fracture & splintering snap
   * 3. Sizzling electric arc discharge
   * 4. Deep sub-bass thunder boom
   * 5. Rolling reverberant thunder rumble
   */
  public playLightningStrike(isTreeStrike: boolean = true, isDouble: boolean = false) {
    if (!this.ctx || !this.masterGain) {
      this.init();
      if (!this.ctx || !this.masterGain) return;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;

    // Trigger primary strike
    this.triggerStrikeInstance(now, isTreeStrike, isDouble ? 1.0 : 0.95);

    // If double strike, trigger a rapid second impact crack offset by 45ms!
    if (isDouble) {
      this.triggerStrikeInstance(now + 0.045, isTreeStrike, 0.9);
    }
  }

  private triggerStrikeInstance(time: number, isTreeStrike: boolean, volumeScale: number) {
    if (!this.ctx || !this.masterGain) return;

    // 1. Supersonic Shockwave Crack (harsh bandpass noise burst)
    const crackLen = 0.15;
    const crackBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * crackLen), this.ctx.sampleRate);
    const data = crackBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
    }
    const crackSource = this.ctx.createBufferSource();
    crackSource.buffer = crackBuffer;

    const crackFilter = this.ctx.createBiquadFilter();
    crackFilter.type = 'highpass';
    crackFilter.frequency.setValueAtTime(600, time);

    const crackGain = this.ctx.createGain();
    crackGain.gain.setValueAtTime(1.0 * volumeScale, time);
    crackGain.gain.exponentialRampToValueAtTime(0.01, time + crackLen);

    crackSource.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.masterGain);
    crackSource.start(time);

    // 2. Wood splintering explosion (distinct snapping timber crack)
    if (isTreeStrike) {
      this.playWoodSnap(time, volumeScale);
      this.playElectricZap(time, volumeScale);
    }

    // 3. Deep sub-bass boom (45Hz - 80Hz)
    const bassOsc = this.ctx.createOscillator();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(isTreeStrike ? 85 : 60, time);
    bassOsc.frequency.exponentialRampToValueAtTime(28, time + 1.2);

    const bassGain = this.ctx.createGain();
    bassGain.gain.setValueAtTime(0.95 * volumeScale, time);
    bassGain.gain.exponentialRampToValueAtTime(0.001, time + 1.8);

    bassOsc.connect(bassGain);
    bassGain.connect(this.masterGain);
    bassOsc.start(time);
    bassOsc.stop(time + 1.8);

    // 4. Rolling thunder rumble lasting 4 seconds
    const rumbleDuration = 4.2;
    const rumbleBuffer = this.ctx.createBuffer(2, Math.floor(this.ctx.sampleRate * rumbleDuration), this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const channelData = rumbleBuffer.getChannelData(ch);
      let lastVal = 0;
      for (let i = 0; i < channelData.length; i++) {
        const white = Math.random() * 2 - 1;
        lastVal = (lastVal + 0.02 * white) / 1.02;
        const progress = i / channelData.length;
        const envelope = Math.pow(1 - progress, 1.6) * Math.sin(progress * Math.PI * 7 + ch) * 0.4 + (1 - progress) * 0.6;
        channelData[i] = lastVal * envelope * 3.8;
      }
    }

    const rumbleSource = this.ctx.createBufferSource();
    rumbleSource.buffer = rumbleBuffer;

    const rumbleFilter = this.ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(160, time);
    rumbleFilter.frequency.linearRampToValueAtTime(70, time + rumbleDuration);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.3 * volumeScale, time);
    rumbleGain.gain.linearRampToValueAtTime(0.85 * volumeScale, time + 0.08);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, time + rumbleDuration);

    rumbleSource.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(this.masterGain);
    rumbleSource.start(time + 0.02);
  }

  /**
   * Sound of wood snapping and splintering when lightning tears the tree trunk
   */
  private playWoodSnap(time: number, volumeScale: number) {
    if (!this.ctx || !this.masterGain) return;

    const snapLen = 0.35;
    const snapBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * snapLen), this.ctx.sampleRate);
    const d = snapBuffer.getChannelData(0);

    for (let i = 0; i < d.length; i++) {
      const t = i / this.ctx.sampleRate;
      const click = Math.sin(t * 750 * 2 * Math.PI) * Math.exp(-t * 26) +
                    Math.sin(t * 1300 * 2 * Math.PI) * Math.exp(-t * 38) +
                    Math.sin(t * 2200 * 2 * Math.PI) * Math.exp(-t * 50) +
                    (Math.random() * 2 - 1) * Math.exp(-t * 18);
      d[i] = click * 0.6;
    }

    const snapSource = this.ctx.createBufferSource();
    snapSource.buffer = snapBuffer;

    const snapGain = this.ctx.createGain();
    snapGain.gain.setValueAtTime(0.85 * volumeScale, time);
    snapGain.gain.exponentialRampToValueAtTime(0.01, time + snapLen);

    snapSource.connect(snapGain);
    snapGain.connect(this.masterGain);
    snapSource.start(time + 0.01);
  }

  /**
   * Sizzling high-voltage plasma hum
   */
  private playElectricZap(time: number, volumeScale: number) {
    if (!this.ctx || !this.masterGain) return;

    const zapOsc = this.ctx.createOscillator();
    zapOsc.type = 'sawtooth';
    zapOsc.frequency.setValueAtTime(140, time);
    zapOsc.frequency.exponentialRampToValueAtTime(50, time + 0.3);

    const zapFilter = this.ctx.createBiquadFilter();
    zapFilter.type = 'bandpass';
    zapFilter.frequency.setValueAtTime(1100, time);
    zapFilter.Q.setValueAtTime(4.0, time);

    const zapGain = this.ctx.createGain();
    zapGain.gain.setValueAtTime(0.6 * volumeScale, time);
    zapGain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    zapOsc.connect(zapFilter);
    zapFilter.connect(zapGain);
    zapGain.connect(this.masterGain);
    zapOsc.start(time);
    zapOsc.stop(time + 0.3);
  }

  /**
   * Rewarding chime when player successfully saves a tree (+2 pts)
   */
  public playSuccessSingle() {
    if (!this.ctx || !this.masterGain) {
      this.init();
      if (!this.ctx || !this.masterGain) return;
    }
    const now = this.ctx.currentTime;

    const notes = [659.25, 783.99]; // E5 -> G5
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.4, now + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.45);
    });

    this.playWaterSplash(now);
  }

  /**
   * Epic triumphant chime when player saves both trees (+6 pts!)
   */
  public playSuccessDouble() {
    if (!this.ctx || !this.masterGain) {
      this.init();
      if (!this.ctx || !this.masterGain) return;
    }
    const now = this.ctx.currentTime;

    // Major fanfare (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0, now + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.5, now + idx * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.65);
    });

    this.playWaterSplash(now);
    this.playWaterSplash(now + 0.1);
  }

  private playWaterSplash(time: number) {
    if (!this.ctx || !this.noiseBuffer || !this.masterGain) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, time);
    filter.frequency.exponentialRampToValueAtTime(800, time + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(time);
    source.stop(time + 0.36);
  }

  /**
   * Failure sound when time runs out on a struck tree
   */
  public playMiss() {
    if (!this.ctx || !this.masterGain) {
      this.init();
      if (!this.ctx || !this.masterGain) return;
    }
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.4);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  public stopAll() {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const stormAudio = new StormAudioEngine();
