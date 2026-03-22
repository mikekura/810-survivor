(function (ns) {
  function note(name) {
    var table = {
      C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
      C6: 1046.5
    };
    return table[name] || 0;
  }

  ns.AudioSystem = class {
    constructor() {
      this.context = null;
      this.master = null;
      this.currentTrack = "";
      this.stepIndex = 0;
      this.stepTimer = 0;
      this.unlocked = false;
      this.patterns = {
        title: {
          tempo: 0.34,
          lead: ["E4", "G4", "A4", "E4", "D4", "G4", "A4", "C5"],
          bass: ["C3", 0, "A3", 0, "F3", 0, "G3", 0]
        },
        chapter1: {
          tempo: 0.32,
          lead: ["E4", "G4", "A4", "G4", "E4", "D4", "E4", "A4"],
          bass: ["A3", 0, "F3", 0, "E3", 0, "G3", 0]
        },
        chapter2: {
          tempo: 0.3,
          lead: ["G4", "A4", "C5", "A4", "G4", "E4", "D4", "E4"],
          bass: ["E3", 0, "G3", 0, "A3", 0, "E3", 0]
        },
        chapter3: {
          tempo: 0.31,
          lead: ["A4", "C5", "E5", "C5", "A4", "G4", "E4", "G4"],
          bass: ["A3", 0, "E3", 0, "F3", 0, "E3", 0]
        },
        chapter4: {
          tempo: 0.28,
          lead: ["D4", "F4", "A4", "F4", "D4", "C4", "D4", "F4"],
          bass: ["D3", 0, "A3", 0, "C3", 0, "D3", 0]
        },
        chapter5: {
          tempo: 0.29,
          lead: ["A4", "B4", "C5", "A4", "G4", "E4", "G4", "A4"],
          bass: ["A3", 0, "G3", 0, "F3", 0, "G3", 0]
        },
        chapter6: {
          tempo: 0.24,
          lead: ["E4", "E4", "G4", "A4", "E4", "E4", "D4", "C4"],
          bass: ["E3", 0, "E3", 0, "D3", 0, "C3", 0]
        },
        chapter7: {
          tempo: 0.26,
          lead: ["A4", "C5", "D5", "C5", "A4", "G4", "E4", "D4"],
          bass: ["A3", 0, "F3", 0, "D3", 0, "E3", 0]
        },
        battle: {
          tempo: 0.2,
          lead: ["A4", "A4", "C5", "D5", "A4", "G4", "E4", "D4"],
          bass: ["A3", 0, "A3", 0, "G3", 0, "E3", 0]
        },
        survivor: {
          tempo: 0.18,
          lead: ["A4", "C5", "E5", "D5", "A4", "G4", "E4", "D4"],
          bass: ["A3", 0, "F3", 0, "G3", 0, "E3", 0]
        },
        ending: {
          tempo: 0.36,
          lead: ["C4", "E4", "G4", "A4", "G4", "E4", "D4", "C4"],
          bass: ["C3", 0, "G3", 0, "A3", 0, "F3", 0]
        }
      };
    }

    ensureContext() {
      if (this.context) {
        return;
      }
      var AudioContextRef = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextRef) {
        return;
      }
      this.context = new AudioContextRef();
      this.master = this.context.createGain();
      this.master.gain.value = 0.045;
      this.master.connect(this.context.destination);
    }

    unlock() {
      this.ensureContext();
      if (!this.context) {
        return;
      }
      if (this.context.state === "suspended") {
        this.context.resume();
      }
      this.unlocked = true;
    }

    playTrack(trackName) {
      if (!this.patterns[trackName]) {
        return;
      }
      if (this.currentTrack !== trackName) {
        this.currentTrack = trackName;
        this.stepIndex = 0;
        this.stepTimer = 0;
      }
    }

    playNote(freq, duration, type, volume, detune) {
      if (!this.context || !this.master || !freq) {
        return;
      }
      var osc = this.context.createOscillator();
      var gain = this.context.createGain();
      osc.type = type || "square";
      osc.frequency.value = freq;
      if (detune) {
        osc.detune.value = detune;
      }
      gain.gain.setValueAtTime(volume, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start();
      osc.stop(this.context.currentTime + duration);
    }

    playNoteAt(freq, delay, duration, type, volume, detune) {
      if (!this.context || !this.master || !freq) {
        return;
      }
      var startAt = this.context.currentTime + Math.max(0, delay || 0);
      var osc = this.context.createOscillator();
      var gain = this.context.createGain();
      osc.type = type || "square";
      osc.frequency.value = freq;
      if (detune) {
        osc.detune.value = detune;
      }
      gain.gain.setValueAtTime(volume, startAt);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(startAt);
      osc.stop(startAt + duration);
    }

    playSequence(sequence) {
      var i;
      this.ensureContext();
      if (!this.context || !this.master || !this.unlocked || this.context.state !== "running") {
        return;
      }
      for (i = 0; i < sequence.length; i += 1) {
        this.playNoteAt(
          note(sequence[i].note),
          sequence[i].delay,
          sequence[i].duration,
          sequence[i].type,
          sequence[i].volume,
          sequence[i].detune
        );
      }
    }

    playPickupCue(kind) {
      switch (kind) {
        case "heal":
          this.playSequence([
            { note: "C5", delay: 0, duration: 0.18, type: "triangle", volume: 0.05 },
            { note: "E5", delay: 0.08, duration: 0.22, type: "triangle", volume: 0.042 },
            { note: "G5", delay: 0.16, duration: 0.28, type: "sine", volume: 0.036 }
          ]);
          break;
        case "magnet":
          this.playSequence([
            { note: "D4", delay: 0, duration: 0.08, type: "square", volume: 0.04 },
            { note: "A4", delay: 0.05, duration: 0.1, type: "square", volume: 0.035 },
            { note: "D5", delay: 0.11, duration: 0.18, type: "triangle", volume: 0.032 },
            { note: "A5", delay: 0.18, duration: 0.24, type: "sine", volume: 0.026 }
          ]);
          break;
        case "chest":
          this.playSequence([
            { note: "C4", delay: 0, duration: 0.12, type: "square", volume: 0.045 },
            { note: "E4", delay: 0.06, duration: 0.12, type: "square", volume: 0.042 },
            { note: "G4", delay: 0.12, duration: 0.15, type: "square", volume: 0.04 },
            { note: "C5", delay: 0.19, duration: 0.28, type: "triangle", volume: 0.036 },
            { note: "E5", delay: 0.28, duration: 0.32, type: "sine", volume: 0.03 }
          ]);
          break;
        case "legendChest":
          this.playSequence([
            { note: "A3", delay: 0, duration: 0.12, type: "square", volume: 0.048 },
            { note: "E4", delay: 0.06, duration: 0.14, type: "square", volume: 0.044 },
            { note: "A4", delay: 0.14, duration: 0.16, type: "triangle", volume: 0.04 },
            { note: "C5", delay: 0.24, duration: 0.18, type: "triangle", volume: 0.036 },
            { note: "E5", delay: 0.34, duration: 0.26, type: "sine", volume: 0.034 },
            { note: "A5", delay: 0.48, duration: 0.48, type: "sine", volume: 0.03 },
            { note: "C6", delay: 0.66, duration: 0.54, type: "triangle", volume: 0.026 }
          ]);
          break;
        case "item114514":
          this.playSequence([
            { note: "A3", delay: 0, duration: 0.1, type: "square", volume: 0.046 },
            { note: "A4", delay: 0.08, duration: 0.1, type: "square", volume: 0.04 },
            { note: "C5", delay: 0.16, duration: 0.12, type: "square", volume: 0.038 },
            { note: "E5", delay: 0.24, duration: 0.22, type: "triangle", volume: 0.034 },
            { note: "A5", delay: 0.32, duration: 0.3, type: "sine", volume: 0.03 }
          ]);
          break;
        case "yarimasuItem":
          this.playSequence([
            { note: "E4", delay: 0, duration: 0.08, type: "square", volume: 0.044 },
            { note: "G4", delay: 0.06, duration: 0.08, type: "square", volume: 0.04 },
            { note: "A4", delay: 0.12, duration: 0.08, type: "square", volume: 0.04 },
            { note: "C5", delay: 0.18, duration: 0.14, type: "square", volume: 0.036 },
            { note: "E5", delay: 0.24, duration: 0.22, type: "triangle", volume: 0.034 }
          ]);
          break;
        case "iizoItem":
          this.playSequence([
            { note: "C4", delay: 0, duration: 0.18, type: "triangle", volume: 0.042 },
            { note: "E4", delay: 0.04, duration: 0.2, type: "triangle", volume: 0.038 },
            { note: "G4", delay: 0.08, duration: 0.24, type: "triangle", volume: 0.034 },
            { note: "C5", delay: 0.14, duration: 0.32, type: "sine", volume: 0.03 }
          ]);
          break;
        case "ikuikuItem":
          this.playSequence([
            { note: "D4", delay: 0, duration: 0.08, type: "square", volume: 0.04 },
            { note: "F4", delay: 0.05, duration: 0.08, type: "square", volume: 0.04 },
            { note: "A4", delay: 0.1, duration: 0.1, type: "square", volume: 0.038 },
            { note: "C5", delay: 0.16, duration: 0.12, type: "square", volume: 0.036 },
            { note: "D5", delay: 0.22, duration: 0.24, type: "triangle", volume: 0.034 },
            { note: "A5", delay: 0.3, duration: 0.2, type: "sine", volume: 0.03 }
          ]);
          break;
        case "loveItem":
          this.playSequence([
            { note: "E4", delay: 0, duration: 0.14, type: "triangle", volume: 0.04 },
            { note: "A4", delay: 0.08, duration: 0.18, type: "triangle", volume: 0.036 },
            { note: "C5", delay: 0.16, duration: 0.22, type: "triangle", volume: 0.032 },
            { note: "E5", delay: 0.26, duration: 0.3, type: "sine", volume: 0.028 }
          ]);
          break;
        case "rankUnlocked":
          this.playSequence([
            { note: "C5", delay: 0, duration: 0.1, type: "square", volume: 0.04 },
            { note: "E5", delay: 0.08, duration: 0.12, type: "square", volume: 0.038 },
            { note: "G5", delay: 0.16, duration: 0.14, type: "square", volume: 0.036 },
            { note: "C6", delay: 0.24, duration: 0.34, type: "triangle", volume: 0.03 }
          ]);
          break;
        default:
          this.playSequence([
            { note: "C5", delay: 0, duration: 0.1, type: "square", volume: 0.03 },
            { note: "G5", delay: 0.08, duration: 0.18, type: "triangle", volume: 0.022 }
          ]);
          break;
      }
    }

    update(dt) {
      if (!this.unlocked || !this.currentTrack || !this.patterns[this.currentTrack]) {
        return;
      }
      this.ensureContext();
      if (!this.context || this.context.state !== "running") {
        return;
      }
      var pattern = this.patterns[this.currentTrack];
      this.stepTimer -= dt;
      if (this.stepTimer > 0) {
        return;
      }

      var lead = pattern.lead[this.stepIndex % pattern.lead.length];
      var bass = pattern.bass[this.stepIndex % pattern.bass.length];
      this.stepTimer = pattern.tempo;
      this.stepIndex += 1;

      if (lead) {
        this.playNote(note(lead), pattern.tempo * 0.9, "square", 0.032);
      }
      if (bass) {
        this.playNote(note(bass), pattern.tempo * 0.95, "triangle", 0.024, -8);
      }
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
