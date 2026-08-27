import { UltronStatus, UltronMood } from '../types/ultron';

class UltronSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private humMasterGain: GainNode | null = null;
  private chirpsMasterGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  // Sub-reactor hum audio graph nodes
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private humFilter: BiquadFilterNode | null = null;
  private humVolGain: GainNode | null = null;

  // State
  private currentStatus: UltronStatus = 'IDLE';
  private currentMood: UltronMood = 'CALM';
  private isInitialized: boolean = false;
  private chirpIntervalId: any = null;

  // Volume balance settings
  private humVolume: number = 0.6;
  private chirpsVolume: number = 0.5;

  constructor() {
    // Lazy initialized on first user gesture or state change
  }

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.ctx = new AudioCtxClass();

      // Master output gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.45, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Dedicated Hum Bus
      this.humMasterGain = this.ctx.createGain();
      this.humMasterGain.gain.setValueAtTime(this.humVolume, this.ctx.currentTime);
      this.humMasterGain.connect(this.masterGain);

      // Dedicated Chirps Bus
      this.chirpsMasterGain = this.ctx.createGain();
      this.chirpsMasterGain.gain.setValueAtTime(this.chirpsVolume, this.ctx.currentTime);
      this.chirpsMasterGain.connect(this.masterGain);

      this.setupHumGraph();
      this.startChirpScheduler();
      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio Soundscape init deferred:', e);
    }
  }

  public resumeContext() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private setupHumGraph() {
    if (!this.ctx || !this.humMasterGain) return;

    // Sub-reactor low-pass filter
    this.humFilter = this.ctx.createBiquadFilter();
    this.humFilter.type = 'lowpass';
    this.humFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
    this.humFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.humVolGain = this.ctx.createGain();
    this.humVolGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    this.humFilter.connect(this.humVolGain);
    this.humVolGain.connect(this.humMasterGain);

    // Oscillator 1: Primary deep sub bass (Sawtooth/Triangle blend)
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc1.frequency.setValueAtTime(55.0, this.ctx.currentTime); // A1

    // Oscillator 2: Detuned sub-harmonic
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'triangle';
    this.osc2.frequency.setValueAtTime(54.4, this.ctx.currentTime); // Slight detune for phasing

    // Deep sub-octave (27.5 Hz)
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'sine';
    this.subOsc.frequency.setValueAtTime(27.5, this.ctx.currentTime);

    // LFO for rhythmic reactor breathing pulse
    this.lfoOsc = this.ctx.createOscillator();
    this.lfoOsc.type = 'sine';
    this.lfoOsc.frequency.setValueAtTime(0.25, this.ctx.currentTime);

    this.lfoGain = this.ctx.createGain();
    this.lfoGain.gain.setValueAtTime(35, this.ctx.currentTime);

    this.lfoOsc.connect(this.lfoGain);
    this.lfoGain.connect(this.humFilter.frequency);

    const osc1Gain = this.ctx.createGain();
    osc1Gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    this.osc1.connect(osc1Gain);
    osc1Gain.connect(this.humFilter);

    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    this.osc2.connect(osc2Gain);
    osc2Gain.connect(this.humFilter);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.subOsc.connect(subGain);
    subGain.connect(this.humFilter);

    this.osc1.start();
    this.osc2.start();
    this.subOsc.start();
    this.lfoOsc.start();
  }

  public updateState(status: UltronStatus, mood: UltronMood) {
    this.currentStatus = status;
    this.currentMood = mood;

    if (!this.ctx || !this.isInitialized) return;
    const now = this.ctx.currentTime;

    // Mood-specific base frequency tuning
    let baseFreq = 55.0; // A1
    let filterCutoff = 140;
    let lfoRate = 0.25;
    let humGainVal = 0.3;

    switch (mood) {
      case 'CALM':
        baseFreq = 48.0;
        filterCutoff = 120;
        lfoRate = 0.18;
        humGainVal = 0.25;
        break;
      case 'FOCUSED':
        baseFreq = 62.0;
        filterCutoff = 180;
        lfoRate = 0.4;
        humGainVal = 0.32;
        break;
      case 'AMUSED':
        baseFreq = 58.27; // Bb1
        filterCutoff = 160;
        lfoRate = 0.5;
        humGainVal = 0.28;
        break;
      case 'CONFIDENT':
        baseFreq = 65.41; // C2
        filterCutoff = 220;
        lfoRate = 0.35;
        humGainVal = 0.38;
        break;
      case 'SUSPICIOUS':
        baseFreq = 43.65; // F1
        filterCutoff = 160;
        lfoRate = 0.8;
        humGainVal = 0.35;
        break;
      case 'WARNING':
        baseFreq = 73.42; // D2
        filterCutoff = 320;
        lfoRate = 1.6;
        humGainVal = 0.45;
        break;
      case 'CRITICAL':
        baseFreq = 82.41; // E2
        filterCutoff = 480;
        lfoRate = 2.8;
        humGainVal = 0.55;
        break;
    }

    // Adjust parameters if computing/executing
    if (status === 'THINKING') {
      filterCutoff *= 1.6;
      lfoRate *= 2.2;
      humGainVal *= 1.25;
      baseFreq += 4;
      this.playTelemetryBurst();
    } else if (status === 'EXECUTING') {
      filterCutoff *= 1.4;
      lfoRate *= 1.8;
      humGainVal *= 1.2;
      this.playHarmonicChirp(880, 1320);
    } else if (status === 'RESPONDING') {
      filterCutoff *= 1.2;
      lfoRate *= 1.2;
      this.playHarmonicChirp(659, 1046);
    }

    if (this.osc1 && this.osc2 && this.subOsc && this.humFilter && this.lfoOsc && this.humVolGain) {
      this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.4);
      this.osc2.frequency.setTargetAtTime(baseFreq * 0.99, now, 0.4);
      this.subOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.4);
      this.humFilter.frequency.setTargetAtTime(filterCutoff, now, 0.3);
      this.lfoOsc.frequency.setTargetAtTime(lfoRate, now, 0.3);
      this.humVolGain.gain.setTargetAtTime(humGainVal, now, 0.3);
    }
  }

  // Periodic procedural digital chirps & telemetry blips
  private startChirpScheduler() {
    if (this.chirpIntervalId) clearInterval(this.chirpIntervalId);

    this.chirpIntervalId = setInterval(() => {
      if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

      const shouldChirp =
        this.currentStatus === 'THINKING'
          ? Math.random() < 0.85
          : this.currentStatus === 'EXECUTING'
          ? Math.random() < 0.7
          : Math.random() < 0.3;

      if (shouldChirp) {
        this.playDataChirp();
      }
    }, 2400);
  }

  // Plays a procedural digital data blip
  public playDataChirp() {
    if (this.isMuted || !this.ctx || !this.chirpsMasterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const basePitches = [1760, 2093, 2349, 2637, 3135, 3520, 4186];
      const startPitch = basePitches[Math.floor(Math.random() * basePitches.length)];
      const endPitch = startPitch * (Math.random() > 0.5 ? 1.5 : 0.75);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(startPitch, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(100, endPitch), now + 0.06);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.chirpsMasterGain);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  // Plays a dual-tone harmonic pulse for status transitions
  public playHarmonicChirp(f1: number = 880, f2: number = 1320) {
    if (this.isMuted || !this.ctx || !this.chirpsMasterGain) return;
    try {
      const now = this.ctx.currentTime;
      [f1, f2].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.08, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.14);

        osc.connect(gain);
        gain.connect(this.chirpsMasterGain!);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.16);
      });
    } catch (e) {}
  }

  // Telemetry computation cascade
  public playTelemetryBurst() {
    if (this.isMuted || !this.ctx || !this.chirpsMasterGain) return;
    try {
      const now = this.ctx.currentTime;
      const pitches = [1318, 1760, 2093, 2637];
      pitches.forEach((pitch, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, now + i * 0.045);

        gain.gain.setValueAtTime(0.05, now + i * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.045 + 0.06);

        osc.connect(gain);
        gain.connect(this.chirpsMasterGain!);

        osc.start(now + i * 0.045);
        osc.stop(now + i * 0.045 + 0.08);
      });
    } catch (e) {}
  }

  public playHapticImpactThump() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Deep sub-bass punch
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, now);
      filter.Q.setValueAtTime(4.0, now);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.48);

      // Navigator haptics if supported
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([45, 30, 60]);
        } catch (e) {}
      }
    } catch (e) {}
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.45, now, 0.1);
    }
  }

  public setHumVolume(vol: number) {
    this.humVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.humMasterGain) {
      this.humMasterGain.gain.setTargetAtTime(this.humVolume, this.ctx.currentTime, 0.1);
    }
  }

  public setChirpsVolume(vol: number) {
    this.chirpsVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.chirpsMasterGain) {
      this.chirpsMasterGain.gain.setTargetAtTime(this.chirpsVolume, this.ctx.currentTime, 0.1);
    }
  }

  public getHumVolume(): number {
    return this.humVolume;
  }

  public getChirpsVolume(): number {
    return this.chirpsVolume;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const soundscape = new UltronSoundscapeEngine();
