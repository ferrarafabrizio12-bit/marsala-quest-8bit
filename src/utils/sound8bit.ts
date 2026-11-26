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
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume().catch(() => {
        // Ignora finché non arriva un tap utente
      });
    }
    return this.ctx;
  }

  /**
   * Da chiamare sincronamente dentro un click/tap prima di operazioni async (es. login, unlock)
   * così Safari iOS mantiene sbloccato l'AudioContext quando arriva la risposta del server.
   */
  prime(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.start(0);
    } catch {
      // Silenzioso
    }
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
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(Math.max(vol, 0.001), start);
    gain.gain.exponentialRampToValueAtTime(0.0008, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.01);
  }

  private playGlide(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    delay = 0,
    vol = 0.07,
  ): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, start);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(endFreq, 20),
      start + duration,
    );
    gain.gain.setValueAtTime(Math.max(vol, 0.001), start);
    gain.gain.exponentialRampToValueAtTime(0.0008, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.01);
  }

  // --- UI & NAVIGAZIONE ---

  click(): void {
    this.playTone(660, 0.045, "square", 0, 0.05);
  }

  back(): void {
    this.playTone(440, 0.045, "square", 0, 0.045);
    this.playTone(310, 0.06, "square", 0.04, 0.045);
  }

  error(): void {
    this.playTone(170, 0.11, "sawtooth", 0, 0.07);
    this.playTone(135, 0.16, "sawtooth", 0.12, 0.07);
  }

  navStart(): void {
    this.playTone(587, 0.06, "square", 0, 0.055);
    this.playTone(880, 0.06, "square", 0.06, 0.06);
    this.playTone(1175, 0.14, "triangle", 0.12, 0.08);
  }

  equipItem(): void {
    this.playTone(587, 0.05, "square", 0, 0.055);
    this.playTone(880, 0.09, "square", 0.05, 0.065);
  }

  // --- AUTH & ONBOARDING ---

  loginSuccess(): void {
    // Arcade coin + Player 1 Ready
    this.playTone(988, 0.07, "square", 0, 0.065);
    this.playTone(1318, 0.14, "square", 0.07, 0.075);
    this.playTone(523, 0.09, "triangle", 0.18, 0.07);
    this.playTone(659, 0.09, "square", 0.24, 0.065);
    this.playTone(784, 0.1, "square", 0.31, 0.07);
    this.playTone(1046, 0.28, "triangle", 0.39, 0.09);
  }

  newPlayer(): void {
    // Nuova avventura creata
    const lead = [392, 523, 659, 784, 988, 1046];
    const bass = [196, 261, 330, 392, 494, 523];
    lead.forEach((n, i) => {
      const t = i * 0.08;
      const dur = i === lead.length - 1 ? 0.36 : 0.09;
      this.playTone(n, dur, "square", t, 0.07);
      this.playTone(bass[i], dur, "triangle", t, 0.065);
    });
  }

  logout(): void {
    const notes = [659, 523, 392, 261];
    notes.forEach((n, i) =>
      this.playTone(n, 0.09, "triangle", i * 0.075, 0.07),
    );
  }

  tutorialStep(): void {
    this.playTone(520, 0.04, "square", 0, 0.045);
    this.playTone(780, 0.06, "triangle", 0.04, 0.055);
  }

  tutorialComplete(): void {
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, i) =>
      this.playTone(
        n,
        i === notes.length - 1 ? 0.3 : 0.09,
        "square",
        i * 0.08,
        0.07,
      ),
    );
    this.playTone(523, 0.3, "triangle", 0.24, 0.075);
  }

  // --- FOTOCAMERA, RISCATTI & CARD ---

  shutter(): void {
    this.playTone(1200, 0.035, "sawtooth", 0, 0.07);
    this.playTone(300, 0.07, "square", 0.04, 0.06);
  }

  syncViewpoint(): void {
    const notes = [330, 392, 494, 659, 784, 988];
    notes.forEach((n, i) => this.playTone(n, 0.14, "square", i * 0.085, 0.08));
    this.playTone(1318, 0.45, "triangle", notes.length * 0.085, 0.1);
  }

  claimReward(): void {
    // Riscatto capo, titolo o ricompensa generica (effetto forziere 8-bit)
    const notes = [587, 740, 880, 1175];
    notes.forEach((n, i) =>
      this.playTone(
        n,
        i === notes.length - 1 ? 0.32 : 0.085,
        "square",
        i * 0.075,
        0.07,
      ),
    );
    this.playTone(587, 0.32, "triangle", 0.225, 0.075);
  }

  bountyClaimed(): void {
    // Daily Bounty riscattato: doppio coin + mini fanfara streak
    this.playTone(988, 0.06, "square", 0, 0.075);
    this.playTone(1318, 0.14, "square", 0.06, 0.08);
    this.playTone(784, 0.08, "square", 0.22, 0.07);
    this.playTone(988, 0.08, "square", 0.3, 0.07);
    this.playTone(1175, 0.08, "square", 0.38, 0.075);
    this.playTone(1568, 0.38, "triangle", 0.46, 0.095);
    this.playTone(784, 0.38, "square", 0.46, 0.05);
  }

  specialEdition(): void {
    // Golden Hour / Night Edition (+50 XP)
    this.playGlide(440, 880, 0.18, "triangle", 0, 0.075);
    const notes = [659, 831, 988, 1318];
    notes.forEach((n, i) => {
      const t = 0.14 + i * 0.085;
      this.playTone(
        n,
        i === notes.length - 1 ? 0.42 : 0.11,
        "square",
        t,
        0.065,
      );
      this.playTone(
        n / 2,
        i === notes.length - 1 ? 0.42 : 0.11,
        "triangle",
        t,
        0.065,
      );
    });
  }

  holoCard(): void {
    // Card Olografica ✦: cascata cristallina scintillante
    const sparkle = [659, 784, 988, 1175, 1318, 1568, 1976];
    sparkle.forEach((n, i) =>
      this.playTone(
        n,
        i === sparkle.length - 1 ? 0.36 : 0.07,
        "square",
        i * 0.052,
        0.06,
      ),
    );
    this.playGlide(988, 1976, 0.28, "triangle", 0.2, 0.07);
  }

  feedbackSent(): void {
    this.playTone(659, 0.06, "square", 0, 0.055);
    this.playTone(880, 0.06, "square", 0.065, 0.06);
    this.playTone(1175, 0.16, "triangle", 0.13, 0.075);
  }

  postcardPrint(): void {
    this.playTone(740, 0.05, "square", 0, 0.055);
    this.playTone(988, 0.05, "square", 0.06, 0.055);
    this.playTone(1480, 0.22, "triangle", 0.12, 0.08);
  }

  // --- EVENTI LEGGENDARI & SPECIALI ---

  easterEgg(): void {
    const notes = [523, 659, 784, 659, 1046];
    notes.forEach((n, i) => {
      const t = i * 0.075;
      this.playTone(n, i === notes.length - 1 ? 0.26 : 0.1, "square", t, 0.08);
      if (i === 0 || i === notes.length - 1) {
        this.playTone(n / 2, 0.24, "triangle", t, 0.07);
      }
    });
  }

  victoryMedal(): void {
    const melody = [523, 523, 523, 659, 784, 659, 784, 1046];
    const times = [0, 0.12, 0.24, 0.38, 0.54, 0.7, 0.84, 1.02];
    melody.forEach((n, i) => {
      const dur = i === melody.length - 1 ? 0.6 : 0.11;
      this.playTone(n, dur, "square", times[i], 0.085);
      if (i >= 3) {
        this.playTone(n / 2, dur, "triangle", times[i], 0.065);
      }
    });
  }

  prestigeActivate(): void {
    // Carica energetica New Game+ + fanfara ascendente
    this.playGlide(220, 880, 0.36, "sawtooth", 0, 0.065);
    const fanfare = [523, 659, 784, 1046, 1318, 1568];
    fanfare.forEach((n, i) => {
      const t = 0.34 + i * 0.09;
      const dur = i === fanfare.length - 1 ? 0.55 : 0.11;
      this.playTone(n, dur, "square", t, 0.08);
      this.playTone(n / 2, dur, "triangle", t, 0.075);
    });
  }

  immortalPrestige5(): void {
    // Inno imperiale a 2 voci per il completamento ★5 MAX
    const lead = [523, 659, 784, 1046, 988, 1046, 1318, 1568, 2093];
    const harm = [261, 330, 392, 523, 494, 523, 659, 784, 1046];
    const times = [0, 0.1, 0.2, 0.32, 0.48, 0.6, 0.74, 0.9, 1.08];
    lead.forEach((n, i) => {
      const dur = i === lead.length - 1 ? 0.75 : 0.13;
      this.playTone(n, dur, "square", times[i], 0.085);
      this.playTone(harm[i], dur, "triangle", times[i], 0.085);
    });
    this.playGlide(1046, 2093, 0.35, "triangle", 1.08, 0.06);
  }

  creatorSupreme(): void {
    // Suono esclusivo del Creatore Supremo: fulmine elettrico + accordo regale ossidiana/oro
    this.playGlide(1400, 260, 0.16, "sawtooth", 0, 0.075);
    this.playGlide(320, 1760, 0.22, "sawtooth", 0.12, 0.065);
    const chordTimes = [0.28, 0.38, 0.48, 0.62];
    const chordLead = [440, 554, 659, 880];
    const chordSub = [110, 138, 165, 220];
    chordLead.forEach((n, i) => {
      const dur = i === chordLead.length - 1 ? 0.65 : 0.12;
      this.playTone(n, dur, "square", chordTimes[i], 0.08);
      this.playTone(chordSub[i], dur, "triangle", chordTimes[i], 0.09);
    });
    this.playTone(1318, 0.55, "square", 0.62, 0.055);
  }
}

export const sound8bit = new Sound8BitEngine();
