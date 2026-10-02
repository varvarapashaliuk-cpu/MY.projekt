/**
 * Procedural Music Engine: "5 malin" (Mata) Instrumental
 * Key: B minor (Bm - G - D - A)
 * BPM: 158 (Half-time 79 BPM trap groove)
 * Features:
 * - Melodic synth pluck / bell lead hook
 * - Deep 808 sub-bass slides
 * - Atmospheric pad chords
 * - Trap hi-hat rolls & snare backbeat
 */

class MalinMusicEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private musicGain: GainNode | null = null;
  private intervalId: number | null = null;
  private step = 0;
  private volume = 0.65;

  // BPM 158 -> 16th note duration = (60 / 158) / 4 ~ 0.0949 seconds
  private readonly bpm = 158;
  private readonly stepTime = 60 / 158 / 2; // 8th note resolution = ~0.1898s

  // B minor scale frequencies
  // B3=246.94, D4=293.66, F#4=369.99, A4=440, B4=493.88, C#5=554.37, D5=587.33, E5=659.25, F#5=739.99
  private readonly notes: Record<string, number> = {
    'B1': 61.74,
    'G1': 49.00,
    'D1': 36.71,
    'A1': 55.00,
    'B2': 123.47,
    'G2': 98.00,
    'D2': 73.42,
    'A2': 110.00,
    'F#3': 185.00,
    'B3': 246.94,
    'D4': 293.66,
    'E4': 329.63,
    'F#4': 369.99,
    'G4': 392.00,
    'A4': 440.00,
    'B4': 493.88,
    'C#5': 554.37,
    'D5': 587.33,
    'E5': 659.25,
    'F#5': 739.99,
  };

  // 32-step pattern loop for "5 malin" (Bm -> G -> D -> A)
  // Each chord lasts 8 steps (4 bars of 2 beats)
  private readonly leadPattern: (string | null)[] = [
    // Bar 1 (Bm): 8 steps
    'B4', 'D5', 'F#5', 'D5', 'B4', 'F#5', 'E5', 'D5',
    // Bar 2 (G): 8 steps
    'B4', 'D5', 'G4', 'B4', 'D5', 'E5', 'D5', 'B4',
    // Bar 3 (D): 8 steps
    'A4', 'D5', 'F#5', 'D5', 'A4', 'F#5', 'E5', 'D5',
    // Bar 4 (A / F#m): 8 steps
    'A4', 'C#5', 'E5', 'C#5', 'A4', 'F#4', 'A4', 'C#5',
  ];

  // 808 Bass root notes per 8-step bar
  private readonly bassPattern: (string | null)[] = [
    // Bar 1 (Bm)
    'B1', null, null, 'B1', null, null, 'B2', null,
    // Bar 2 (G)
    'G1', null, null, 'G1', null, null, 'G2', null,
    // Bar 3 (D)
    'D1', null, null, 'D1', null, null, 'D2', null,
    // Bar 4 (A)
    'A1', null, null, 'A1', null, null, 'A2', null,
  ];

  // Chords (frequencies for warm polyphonic pad)
  private readonly chordTiers: Record<number, number[]> = {
    0: [123.47, 246.94, 293.66, 369.99], // Bm (B2, B3, D4, F#4)
    1: [98.00, 196.00, 246.94, 293.66],  // G (G2, G3, B3, D4)
    2: [73.42, 146.83, 220.00, 293.66],  // D (D2, D3, A3, D4)
    3: [110.00, 220.00, 277.18, 329.63], // A (A2, A3, C#4, E4)
  };

  public init(externalCtx?: AudioContext) {
    if (this.ctx && this.ctx.state === 'running') return;

    if (externalCtx) {
      this.ctx = externalCtx;
    } else {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (!this.musicGain) {
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);
    }
  }

  public start() {
    this.init();
    if (this.isPlaying || !this.ctx || !this.musicGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
    this.step = 0;

    const intervalMs = this.stepTime * 1000;
    this.intervalId = window.setInterval(() => {
      this.playStep();
    }, intervalMs);
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.step = 0;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private playStep() {
    if (!this.ctx || !this.musicGain || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    const currentStep = this.step % 32;

    // 1. Play Lead Hook Note
    const leadNote = this.leadPattern[currentStep];
    if (leadNote && this.notes[leadNote]) {
      this.playPluckNote(this.notes[leadNote], now);
    }

    // 2. Play 808 Bass
    const bassNote = this.bassPattern[currentStep];
    if (bassNote && this.notes[bassNote]) {
      this.play808Bass(this.notes[bassNote], now);
    }

    // 3. Play Chord Pad on Bar Starts (steps 0, 8, 16, 24)
    if (currentStep % 8 === 0) {
      const barIdx = Math.floor(currentStep / 8);
      const chord = this.chordTiers[barIdx];
      if (chord) {
        this.playChordPad(chord, now);
      }
    }

    // 4. Trap Drums
    this.playTrapDrums(currentStep, now);

    this.step++;
  }

  // Melodic plucked lead synth (Mata "5 malin" characteristic guitar/bell pluck)
  private playPluckNote(freq: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3.5, time);
    filter.frequency.exponentialRampToValueAtTime(freq * 0.9, time + 0.3);

    gain.gain.setValueAtTime(0.24, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.36);
  }

  // Deep booming 808 sub-bass with gentle slide
  private play808Bass(freq: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Pitch envelope drop typical of 808
    osc.frequency.setValueAtTime(freq * 1.5, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.05);

    gain.gain.setValueAtTime(0.42, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.55);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.6);
  }

  // Atmospheric ambient pad chords
  private playChordPad(chordFreqs: number[], time: number) {
    if (!this.ctx || !this.musicGain) return;

    const duration = this.stepTime * 8; // 8 steps duration
    chordFreqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, time);
      filter.Q.setValueAtTime(1.5, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.05, time + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(time);
      osc.stop(time + duration + 0.1);
    });
  }

  // Trap beat drums (Hi-hats, Snare, Kick)
  private playTrapDrums(step: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    // Snare on half-time beat 2 (step 4, 12, 20, 28)
    if (step % 8 === 4) {
      this.playSnare(time);
    }

    // Hi-hats on almost every step with volume accents
    const isAccent = step % 4 === 0;
    this.playHiHat(time, isAccent ? 0.07 : 0.035);

    // Fast trap hi-hat roll on step 14 and 30
    if (step === 14 || step === 30) {
      this.playHiHat(time + this.stepTime * 0.5, 0.04);
    }
  }

  private playHiHat(time: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.008));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    source.start(time);
  }

  private playSnare(time: number) {
    if (!this.ctx || !this.musicGain) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.14);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.025));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, time);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    source.start(time);
  }
}

export const malinMusic = new MalinMusicEngine();
