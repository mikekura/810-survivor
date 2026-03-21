(function (ns) {
  ns.DialogueBox = class {
    constructor() {
      this.active = false;
      this.entries = [];
      this.index = 0;
      this.visibleChars = 0;
      this.charRate = 52;
      this.onComplete = null;
    }

    open(entries, onComplete) {
      this.entries = Array.isArray(entries) ? entries.slice() : [];
      this.index = 0;
      this.visibleChars = 0;
      this.active = this.entries.length > 0;
      this.onComplete = onComplete || null;
    }

    close() {
      var callback = this.onComplete;
      this.active = false;
      this.entries = [];
      this.index = 0;
      this.visibleChars = 0;
      this.onComplete = null;
      if (callback) {
        callback();
      }
    }

    getCurrentEntry() {
      return this.entries[this.index] || null;
    }

    isLineComplete() {
      var entry = this.getCurrentEntry();
      return !entry || this.visibleChars >= entry.text.length;
    }

    advance() {
      if (!this.active) {
        return;
      }

      if (!this.isLineComplete()) {
        this.visibleChars = this.getCurrentEntry().text.length;
        return;
      }

      this.index += 1;
      this.visibleChars = 0;

      if (this.index >= this.entries.length) {
        this.close();
      }
    }

    update(dt, input) {
      var entry = this.getCurrentEntry();

      if (!this.active || !entry) {
        return;
      }

      if (!this.isLineComplete()) {
        this.visibleChars = Math.min(entry.text.length, this.visibleChars + this.charRate * dt);
      }

      if (input.wasPressed("confirm") || input.wasPressed("cancel") || input.wasPointerPressed()) {
        this.advance();
      }
    }

    isSenpaiSpeaker(speaker) {
      return typeof speaker === "string" && (
        speaker.indexOf("先輩") >= 0 ||
        speaker.indexOf("蜈郁ｼｩ") >= 0
      );
    }

    draw(renderer, options) {
      if (!this.active) {
        return;
      }

      var opts = options || {};
      var assets = opts.assets || null;
      var playerName = opts.playerName || "主人公";
      var entry = this.getCurrentEntry();
      var rawSpeaker = entry.speaker || "SYSTEM";
      var speaker = rawSpeaker === "主人公" ? playerName : rawSpeaker;
      var text = String(entry.text).replace(/\{player\}/g, playerName).slice(0, Math.floor(this.visibleChars));
      var hasSenpaiPortrait = this.isSenpaiSpeaker(speaker);
      var hasStandingArt = !!(hasSenpaiPortrait && assets && assets.isReady("senpaiStanding"));
      var textX = hasStandingArt ? 70 : (hasSenpaiPortrait ? 226 : 70);
      var textWidth = hasStandingArt ? 820 : (hasSenpaiPortrait ? 658 : 820);

      if (hasStandingArt) {
        renderer.drawPanel(696, 214, 208, 294, {
          fill: "rgba(8, 8, 8, 0.9)",
          border: ns.constants.COLORS.accentAlt
        });
        renderer.drawImageContain(assets.getImage("senpaiStanding"), 704, 222, 192, 278);
      }

      renderer.drawPanel(42, 528, 876, 154, {
        fill: "rgba(10, 10, 10, 0.92)",
        border: ns.constants.COLORS.border
      });

      if (hasSenpaiPortrait && !hasStandingArt) {
        renderer.drawSenpaiPortrait(58, 542, 146, 126, {
          border: ns.constants.COLORS.accentAlt
        });
      }

      renderer.drawText(speaker, textX, 552, {
        size: 20,
        color: ns.constants.COLORS.accent,
        shadow: true
      });

      renderer.drawParagraph(text, textX, 588, textWidth, {
        size: 24,
        color: ns.constants.COLORS.text
      });

      if (this.isLineComplete()) {
        renderer.drawText("▼", 870, 642, {
          size: 18,
          color: ns.constants.COLORS.muted
        });
      }
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
