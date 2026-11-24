class Sound8BitEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private getCtx(): AudioContext | null {
    if (this.muted || typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    delay = 0,
    vol = 0.08,
  ): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + delay + duration,
    );
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  }

  click(): void {
    this.playTone(660, 0.045, "square", 0, 0.05);
  }

  shutter(): void {
    this.playTone(1200, 0.035, "sawtooth", 0, 0.07);
    this.playTone(300, 0.07, "square", 0.04, 0.06);
  }

  syncViewpoint(): void {
    const notes = [330, 392, 494, 659, 784, 988];
    notes.forEach((n, i) => this.playTone(n, 0.14, "square", i * 0.085, 0.08));
    this.playTone(1318, 0.45, "triangle", notes.length * 0.085, 0.1);
  }

  easterEgg(): void {
    const notes = [523, 659, 784, 659, 1046];
    notes.forEach((n, i) => this.playTone(n, 0.1, "square", i * 0.075, 0.08));
  }

  victoryMedal(): void {
    const melody = [523, 523, 523, 659, 784, 659, 784, 1046];
    const times = [0, 0.12, 0.24, 0.38, 0.54, 0.7, 0.84, 1.02];
    melody.forEach((n, i) =>
      this.playTone(
        n,
        i === melody.length - 1 ? 0.6 : 0.11,
        "square",
        times[i],
        0.09,
      ),
    );
  }
}

export const sound8bit = new Sound8BitEngine();
