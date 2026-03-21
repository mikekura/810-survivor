(function (ns) {
  var STAGES = [
    { id: "stationFront" },
    { id: "shoppingStreet" },
    { id: "poolSide" },
    { id: "festivalGround" },
    { id: "clockTower" }
  ];

  var GUIDE_ROWS = [
    { leftColor: "#8ff7ff", leftKind: "orbit", rightColor: "#ff8f8f", rightKind: "trail", upgradeId: "afterimageStep" },
    { leftColor: "#f5adff", leftKind: "pulse", rightColor: "#74d6ff", rightKind: "speed", upgradeId: "summerPulse" },
    { leftColor: "#ffe07a", leftKind: "beam", rightColor: "#ffcf9d", rightKind: "backshot", upgradeId: "sunbeam810" },
    { leftColor: "#9fd4ff", leftKind: "drone", rightColor: "#f7efe0", rightKind: "shield", upgradeId: "droneBuddy" },
    { leftColor: "#ffb86f", leftKind: "burst", rightColor: "#ffe9a1", rightKind: "luck", upgradeId: "yarimasuNee" },
    { leftColor: "#ff9f76", leftKind: "core", rightColor: "#d7c6ff", rightKind: "beam", upgradeId: "heatSink" }
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function findStageIndex(stageId) {
    var i;
    for (i = 0; i < STAGES.length; i += 1) {
      if (STAGES[i].id === stageId) {
        return i;
      }
    }
    return 0;
  }

  function pointInRect(pointer, rect) {
    return (
      pointer.x >= rect.x &&
      pointer.y >= rect.y &&
      pointer.x <= rect.x + rect.width &&
      pointer.y <= rect.y + rect.height
    );
  }

  function drawMiniIcon(ctx, x, y, color, kind) {
    ctx.save();
    ctx.fillStyle = "rgba(8, 8, 8, 0.92)";
    ctx.fillRect(x, y, 36, 36);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, 34, 34);
    ctx.fillStyle = color;

    if (kind === "beam") {
      ctx.fillRect(x + 8, y + 16, 18, 4);
      ctx.beginPath();
      ctx.moveTo(x + 24, y + 10);
      ctx.lineTo(x + 31, y + 18);
      ctx.lineTo(x + 24, y + 26);
      ctx.closePath();
      ctx.fill();
    } else if (kind === "pulse") {
      ctx.beginPath();
      ctx.arc(x + 18, y + 18, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 18, y + 18, 9, 0, Math.PI * 2);
      ctx.stroke();
    } else if (kind === "orbit") {
      ctx.beginPath();
      ctx.arc(x + 18, y + 18, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 27, y + 18, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === "speed") {
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 26);
      ctx.lineTo(x + 18, y + 8);
      ctx.lineTo(x + 28, y + 8);
      ctx.lineTo(x + 20, y + 28);
      ctx.closePath();
      ctx.fill();
    } else if (kind === "trail") {
      ctx.fillRect(x + 8, y + 18, 18, 4);
      ctx.fillRect(x + 15, y + 10, 14, 4);
      ctx.fillRect(x + 22, y + 26, 10, 4);
    } else if (kind === "shield") {
      ctx.beginPath();
      ctx.moveTo(x + 18, y + 8);
      ctx.lineTo(x + 28, y + 12);
      ctx.lineTo(x + 26, y + 25);
      ctx.lineTo(x + 18, y + 30);
      ctx.lineTo(x + 10, y + 25);
      ctx.lineTo(x + 8, y + 12);
      ctx.closePath();
      ctx.fill();
    } else if (kind === "drone") {
      ctx.fillRect(x + 13, y + 13, 10, 10);
      ctx.fillRect(x + 8, y + 16, 4, 4);
      ctx.fillRect(x + 24, y + 16, 4, 4);
      ctx.fillRect(x + 16, y + 8, 4, 4);
    } else if (kind === "luck") {
      ctx.beginPath();
      ctx.arc(x + 14, y + 15, 4, 0, Math.PI * 2);
      ctx.arc(x + 22, y + 15, 4, 0, Math.PI * 2);
      ctx.arc(x + 14, y + 23, 4, 0, Math.PI * 2);
      ctx.arc(x + 22, y + 23, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + 17, y + 23, 2, 7);
    } else if (kind === "backshot") {
      ctx.fillRect(x + 10, y + 16, 16, 4);
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 12);
      ctx.lineTo(x + 4, y + 18);
      ctx.lineTo(x + 10, y + 24);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 26, y + 12);
      ctx.lineTo(x + 32, y + 18);
      ctx.lineTo(x + 26, y + 24);
      ctx.closePath();
      ctx.fill();
    } else if (kind === "burst") {
      ctx.beginPath();
      ctx.moveTo(x + 18, y + 7);
      ctx.lineTo(x + 22, y + 14);
      ctx.lineTo(x + 30, y + 18);
      ctx.lineTo(x + 22, y + 22);
      ctx.lineTo(x + 18, y + 30);
      ctx.lineTo(x + 14, y + 22);
      ctx.lineTo(x + 6, y + 18);
      ctx.lineTo(x + 14, y + 14);
      ctx.closePath();
      ctx.fill();
    } else if (kind === "core") {
      ctx.fillRect(x + 13, y + 13, 10, 10);
      ctx.fillRect(x + 11, y + 7, 14, 3);
      ctx.fillRect(x + 11, y + 26, 14, 3);
      ctx.fillRect(x + 7, y + 11, 3, 14);
      ctx.fillRect(x + 26, y + 11, 3, 14);
    } else {
      ctx.fillRect(x + 10, y + 10, 16, 16);
    }

    ctx.restore();
  }

  ns.TitleScene = class {
    constructor(game, options) {
      var opts = options || {};
      var unlockedRank = game.getUnlockedRank ? game.getUnlockedRank() : 0;
      var skins = game.getSurvivorSkins ? game.getSurvivorSkins() : [];
      var selectedSkinId = game.getSelectedSurvivorSkinId ? game.getSelectedSurvivorSkinId() : "";
      var i;
      this.game = game;
      this.titlePulse = 0;
      this.selectedIndex = 0;
      this.stageIndex = findStageIndex(opts.stageId || "stationFront");
      this.rank = clamp(typeof opts.hazardRank === "number" ? opts.hazardRank : 0, 0, unlockedRank);
      this.hoverIndex = -1;
      this.skins = skins;
      this.skinIndex = 0;
      for (i = 0; i < skins.length; i += 1) {
        if (skins[i].id === selectedSkinId) {
          this.skinIndex = i;
          break;
        }
      }
      this.game.audio.playTrack("title");
    }

    getUnlockedRank() {
      return this.game.getUnlockedRank ? this.game.getUnlockedRank() : 0;
    }

    getButtons() {
      var unlockedRank = this.getUnlockedRank();
      var skinCount = Math.max(1, this.skins.length);
      return [
        { type: "start", label: this.game.t("buttons.startRun"), x: 106, y: 438, width: 360, height: 70 },
        { type: "stage", label: this.game.stageName(STAGES[this.stageIndex].id), x: 106, y: 522, width: 172, height: 54 },
        { type: "rank", label: String(this.rank) + " / " + String(unlockedRank), x: 290, y: 522, width: 94, height: 54 },
        { type: "language", label: this.game.getLocale().toUpperCase(), x: 396, y: 522, width: 70, height: 54 },
        { type: "skin", label: String(this.skinIndex + 1) + " / " + String(skinCount), x: 106, y: 590, width: 112, height: 54 },
        { type: "codex", label: this.game.t("buttons.codex"), x: 230, y: 590, width: 112, height: 54 },
        { type: "recipes", label: this.game.t("buttons.recipes"), x: 354, y: 590, width: 112, height: 54 }
      ];
    }

    cycleStage(delta) {
      this.stageIndex = (this.stageIndex + delta + STAGES.length) % STAGES.length;
    }

    cycleRank(delta) {
      this.rank = clamp(this.rank + delta, 0, this.getUnlockedRank());
    }

    getCurrentSkin() {
      return this.skins[this.skinIndex] || null;
    }

    cycleSkin(delta) {
      if (!this.skins.length) {
        return;
      }
      this.skinIndex = (this.skinIndex + delta + this.skins.length) % this.skins.length;
      this.game.setSelectedSurvivorSkin(this.skins[this.skinIndex].id);
    }

    activateSelected(delta) {
      if (this.selectedIndex === 0) {
        this.game.startSurvivor({
          stageId: STAGES[this.stageIndex].id,
          hazardRank: this.rank
        });
      } else if (this.selectedIndex === 1) {
        this.cycleStage(delta || 1);
      } else if (this.selectedIndex === 2) {
        this.cycleRank(delta || 1);
      } else if (this.selectedIndex === 3) {
        this.game.toggleLocale();
      } else if (this.selectedIndex === 4) {
        this.cycleSkin(delta || 1);
      } else if (this.selectedIndex === 5) {
        this.game.openCodex({
          stageId: STAGES[this.stageIndex].id,
          hazardRank: this.rank
        });
      } else {
        this.game.openRecipes({
          stageId: STAGES[this.stageIndex].id,
          hazardRank: this.rank
        });
      }
    }

    update(dt, input) {
      var pointer = input.getPointer();
      var buttons = this.getButtons();
      var i;

      this.titlePulse += dt;
      this.hoverIndex = -1;

      if (pointer.inside) {
        for (i = 0; i < buttons.length; i += 1) {
          if (pointInRect(pointer, buttons[i])) {
            this.hoverIndex = i;
            this.selectedIndex = i;
            break;
          }
        }
      }

      if (input.wasPressed("up")) {
        this.selectedIndex = (this.selectedIndex + buttons.length - 1) % buttons.length;
      }
      if (input.wasPressed("down")) {
        this.selectedIndex = (this.selectedIndex + 1) % buttons.length;
      }
      if (input.wasPressed("left")) {
        if (this.selectedIndex === 1) {
          this.cycleStage(-1);
        } else if (this.selectedIndex === 2) {
          this.cycleRank(-1);
        } else if (this.selectedIndex === 3) {
          this.game.toggleLocale();
        } else if (this.selectedIndex === 4) {
          this.cycleSkin(-1);
        }
      }
      if (input.wasPressed("right")) {
        if (this.selectedIndex === 1) {
          this.cycleStage(1);
        } else if (this.selectedIndex === 2) {
          this.cycleRank(1);
        } else if (this.selectedIndex === 3) {
          this.game.toggleLocale();
        } else if (this.selectedIndex === 4) {
          this.cycleSkin(1);
        }
      }

      if (pointer.pressed && this.hoverIndex >= 0) {
        this.activateSelected(1);
        return;
      }

      if (input.wasPressed("confirm")) {
        this.activateSelected(1);
      }
    }

    draw(renderer) {
      var pulse = 0.5 + Math.sin(this.titlePulse * 2.2) * 0.5;
      var buttons = this.getButtons();
      var survivorState = this.game.state.survivor || {};
      var ctx = renderer.ctx;
      var i;
      var stageName = this.game.stageName(STAGES[this.stageIndex].id);
      var unlockedRank = this.getUnlockedRank();
      var currentSkin = this.getCurrentSkin();

      renderer.clear("#120c08");
      renderer.drawPanel(44, 40, 872, 640, {
        fill: "rgba(12, 8, 6, 0.96)",
        border: "#f6c453"
      });

      renderer.drawPanel(78, 72, 804, 126, {
        fill: "rgba(18, 12, 10, 0.94)",
        border: "#ff9c4b"
      });
      renderer.drawCenteredText(this.game.t("survivor.title"), 94, {
        size: 64,
        color: "#f6c453",
        shadow: true
      });
      renderer.drawCenteredText(this.game.t("title.subtitle"), 158, {
        size: 22,
        color: "#f4e0b6"
      });

      renderer.drawPanel(78, 226, 420, 412, {
        fill: "rgba(10, 10, 10, 0.9)",
        border: "#6a4b27"
      });
      renderer.drawParagraph(this.game.t("title.intro"), 106, 252, 366, {
        size: 20,
        lineHeight: 28,
        color: "#d8c8a4"
      });
      renderer.drawText(this.game.t("common.clearGoal"), 106, 320, {
        size: 18,
        color: "#ff9c4b"
      });
      renderer.drawParagraph(this.game.t("title.clearGoalBody"), 106, 350, 364, {
        size: 22,
        lineHeight: 30,
        color: "#f4f0da"
      });
      renderer.drawText(this.game.t("buttons.stage"), 106, 396, {
        size: 18,
        color: "#f6c453"
      });
      renderer.drawText(stageName, 106, 422, {
        size: 24,
        color: this.titlePulse % 2 > 1 ? "#fff1c4" : "#f4f0da"
      });

      for (i = 0; i < buttons.length; i += 1) {
        var button = buttons[i];
        var selected = i === this.selectedIndex;
        var hovered = i === this.hoverIndex;
        var titleKey = button.type === "start"
          ? "buttons.action"
          : button.type === "stage"
            ? "buttons.stage"
            : button.type === "rank"
              ? "buttons.rank"
              : button.type === "language"
                ? "buttons.language"
                : button.type === "skin"
                  ? "buttons.skin"
                : button.type === "codex"
                  ? "buttons.codex"
                  : "buttons.recipes";
        renderer.drawPanel(button.x, button.y, button.width, button.height, {
          fill: selected || hovered
            ? "rgba(246, 196, 83, " + (0.16 + pulse * 0.14) + ")"
            : "rgba(8, 8, 8, 0.92)",
          border: selected ? "#f6c453" : hovered ? "#ff9c4b" : "#5f4423"
        });
        renderer.drawText(this.game.t(titleKey), button.x + 18, button.y + 12, {
          size: 16,
          color: selected ? "#fff1c4" : "#f4e0b6"
        });
        renderer.drawText(button.label, button.x + button.width / 2, button.y + 26, {
          size: button.type === "start" ? 30 : 24,
          align: "center",
          color: "#f4f0da"
        });
      }

      renderer.drawPanel(528, 226, 354, 196, {
        fill: "rgba(12, 14, 22, 0.94)",
        border: "#d6d0ff"
      });
      renderer.drawText(this.game.t("common.bestRun"), 552, 248, {
        size: 24,
        color: "#d6d0ff"
      });
      renderer.drawText(
        this.game.t("common.time") + "  " +
        Math.floor((survivorState.bestTimeSec || 0) / 60) + ":" +
        String(Math.floor((survivorState.bestTimeSec || 0) % 60)).padStart(2, "0"),
        552,
        294,
        {
          size: 28,
          color: "#f4f0da"
        }
      );
      renderer.drawText(this.game.t("common.level") + " " + (survivorState.bestLevel || 1), 552, 334, {
        size: 22,
        color: "#f4f0da"
      });
      renderer.drawText(
        this.game.t("common.kills") + " " + (survivorState.bestKills || 0) +
        "   " +
        this.game.t("common.runs") + " " + (survivorState.totalRuns || 0),
        552,
        360,
        {
          size: 20,
          color: "#d8c8a4"
        }
      );
      renderer.drawText(this.game.t("title.rankOpen", { rank: unlockedRank }), 552, 386, {
        size: 16,
        color: "#ffe07a"
      });
      if (currentSkin) {
        renderer.drawText(this.game.t("buttons.skin"), 794, 244, {
          size: 16,
          align: "center",
          color: currentSkin.color || "#d6d0ff"
        });
        renderer.drawPixelSprite({
          x: 746,
          y: 258,
          width: 96,
          height: 136
        }, "senpai", {
          variant: currentSkin.id,
          border: currentSkin.color || "#ffffff"
        });
        renderer.drawText((currentSkin.name && (currentSkin.name[this.game.getLocale()] || currentSkin.name.en || currentSkin.name.ja)) || currentSkin.id, 794, 394, {
          size: 16,
          align: "center",
          color: "#f4f0da"
        });
      }

      renderer.drawPanel(528, 424, 354, 226, {
        fill: "rgba(22, 24, 42, 0.94)",
        border: "#7fa2cc"
      });
      renderer.drawText(this.game.t("common.buildPicks"), 552, 446, {
        size: 24,
        color: "#d6d0ff"
      });
      renderer.drawText(this.game.t("title.buildGuide"), 552, 480, {
        size: 16,
        color: "#f4e0b6"
      });

      for (i = 0; i < GUIDE_ROWS.length; i += 1) {
        var row = GUIDE_ROWS[i];
        var rowY = 504 + i * 24;
        drawMiniIcon(ctx, 552, rowY, row.leftColor, row.leftKind);
        renderer.drawText("+", 595, rowY + 8, { size: 22, color: "#fff1c4" });
        drawMiniIcon(ctx, 618, rowY, row.rightColor, row.rightKind);
        renderer.drawText("=", 661, rowY + 8, { size: 22, color: "#fff1c4" });
        renderer.drawText(this.game.upgradeName(row.upgradeId), 690, rowY + 8, {
          size: 18,
          color: "#f4f0da"
        });
      }

      renderer.drawText(this.game.t("title.footerHint"), 106, 650, {
        size: 18,
        color: "#d8c8a4"
      });
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
