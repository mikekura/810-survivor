(function (ns) {
  function rectsIntersect(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  ns.OverworldScene = class {
    constructor(game, chapter) {
      this.game = game;
      this.chapter = chapter;
      this.game.audio.playTrack("chapter" + chapter.id);
      this.extra = (ns.chapterExtras && ns.chapterExtras[chapter.id]) || null;
      this.dialogueBox = new ns.DialogueBox();
      this.statusVisible = false;
      this.preBattleDone = false;
      this.titleTimer = 2.5;
      this.player = {
        x: chapter.room.playerStart.x,
        y: chapter.room.playerStart.y,
        width: ns.constants.PLAYER_SIZE,
        height: ns.constants.PLAYER_SIZE + 8,
        color: "#f4f0da"
      };
      this.npcTalkProgress = {};
      this.talkCount = 0;
      this.interactives = this.extra && this.extra.interactives ? this.extra.interactives.slice() : [];
      this.completedObjectives = {};
      this.requiredObjectiveCount = this.extra && this.extra.requiredObjectives ? this.extra.requiredObjectives : 0;

      var introLines = [];
      if (this.game.state.pendingMessages.length) {
        introLines = introLines.concat(this.game.state.pendingMessages);
        this.game.state.pendingMessages = [];
      }
      introLines = introLines.concat(chapter.intro);
      this.dialogueBox.open(introLines);
    }

    getColliders() {
      var colliders = this.chapter.room.obstacles.map(function (obstacle) {
        return {
          x: obstacle.x,
          y: obstacle.y,
          width: obstacle.width,
          height: obstacle.height
        };
      });

      this.chapter.room.npcs.forEach(function (character) {
        colliders.push({
          x: character.x,
          y: character.y,
          width: character.width,
          height: character.height
        });
      });

      colliders.push({ x: 0, y: 0, width: ns.constants.GAME_WIDTH, height: 18 });
      colliders.push({ x: 0, y: ns.constants.GAME_HEIGHT - 18, width: ns.constants.GAME_WIDTH, height: 18 });
      colliders.push({ x: 0, y: 0, width: 18, height: ns.constants.GAME_HEIGHT });
      colliders.push({ x: ns.constants.GAME_WIDTH - 18, y: 0, width: 18, height: ns.constants.GAME_HEIGHT });
      return colliders;
    }

    movePlayer(dt, input) {
      var axis = input.getAxis();
      if (!axis.x && !axis.y) {
        return;
      }

      var length = Math.sqrt(axis.x * axis.x + axis.y * axis.y) || 1;
      var speed = ns.constants.PLAYER_SPEED * dt;
      var nextX = this.player.x + (axis.x / length) * speed;
      var nextY = this.player.y + (axis.y / length) * speed;
      var colliders = this.getColliders();
      var testRect;
      var i;

      testRect = {
        x: nextX,
        y: this.player.y,
        width: this.player.width,
        height: this.player.height
      };
      for (i = 0; i < colliders.length; i += 1) {
        if (rectsIntersect(testRect, colliders[i])) {
          nextX = this.player.x;
          break;
        }
      }

      testRect = {
        x: nextX,
        y: nextY,
        width: this.player.width,
        height: this.player.height
      };
      for (i = 0; i < colliders.length; i += 1) {
        if (rectsIntersect(testRect, colliders[i])) {
          nextY = this.player.y;
          break;
        }
      }

      this.player.x = clamp(nextX, 24, ns.constants.GAME_WIDTH - this.player.width - 24);
      this.player.y = clamp(nextY, 32, ns.constants.GAME_HEIGHT - this.player.height - 36);
    }

    getNearestNpc() {
      var result = null;
      var bestDistance = Infinity;
      var i;

      for (i = 0; i < this.chapter.room.npcs.length; i += 1) {
        var character = this.chapter.room.npcs[i];
        var dx = (character.x + character.width / 2) - (this.player.x + this.player.width / 2);
        var dy = (character.y + character.height / 2) - (this.player.y + this.player.height / 2);
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 72 && distance < bestDistance) {
          bestDistance = distance;
          result = character;
        }
      }

      return result;
    }

    getNpcConversationStages(character) {
      var stages = [];
      if (character.firstLines && character.firstLines.length) {
        stages.push(character.firstLines);
      }
      if (character.repeatLines && character.repeatLines.length) {
        stages.push(character.repeatLines);
      }
      if (!stages.length) {
        stages.push([{ speaker: character.label || "SYSTEM", text: "今はそのくらいしか言えない。" }]);
      }
      return stages;
    }

    getNpcConversationProgress(character) {
      return this.npcTalkProgress[character.id] || 0;
    }

    hasPendingNpcConversation(character) {
      return this.getNpcConversationProgress(character) < this.getNpcConversationStages(character).length;
    }

    getDistanceTo(entity) {
      var dx = (entity.x + entity.width / 2) - (this.player.x + this.player.width / 2);
      var dy = (entity.y + entity.height / 2) - (this.player.y + this.player.height / 2);
      return Math.sqrt(dx * dx + dy * dy);
    }

    isNearExit() {
      var exit = this.chapter.room.exit;
      var expanded = {
        x: exit.x - 24,
        y: exit.y - 24,
        width: exit.width + 48,
        height: exit.height + 48
      };
      return rectsIntersect(this.player, expanded);
    }

    getNearestInteractive() {
      var result = null;
      var bestDistance = Infinity;
      var i;

      for (i = 0; i < this.interactives.length; i += 1) {
        var interactive = this.interactives[i];
        var distance = this.getDistanceTo(interactive);
        if (distance < 78 && distance < bestDistance) {
          bestDistance = distance;
          result = interactive;
        }
      }

      return result;
    }

    getNearestTarget() {
      var npc = this.getNearestNpc();
      var interactive = this.getNearestInteractive();

      if (npc && interactive) {
        return this.getDistanceTo(npc) <= this.getDistanceTo(interactive)
          ? { type: "npc", data: npc }
          : { type: "interactive", data: interactive };
      }
      if (npc) {
        return { type: "npc", data: npc };
      }
      if (interactive) {
        return { type: "interactive", data: interactive };
      }
      return null;
    }

    getSpriteKind(character) {
      switch (character.id) {
        case "senpai":
          return "senpai";
        case "ice-kid":
          return "kid";
        case "salaryman":
        case "salaryman-return":
          return "salaryman";
        case "dog-lady":
          return "lady";
        case "dagashi":
        case "stall-uncle":
          return "shop";
        case "semi-doctor":
          return "scientist";
        case "monitor":
        case "watcher":
          return "guard";
        case "health":
        case "town-a":
        case "town-b":
          return "player";
        case "captain-ghost":
        case "station-shadow":
        case "festival-stall":
          return "ghost";
        case "lost-child":
          return "child";
        case "clock":
          return "clock";
        case "surface":
          return "surface";
        case "station-voice":
          return "voice";
        default:
          return "player";
      }
    }

    completeObjective(id) {
      if (!id || this.completedObjectives[id]) {
        return;
      }
      this.completedObjectives[id] = true;
    }

    getCompletedObjectiveCount() {
      return Object.keys(this.completedObjectives).length;
    }

    giveRewardItem(rewardItem) {
      if (!rewardItem) {
        return;
      }
      this.game.state.inventory.push(rewardItem.name);
      this.dialogueBox.open([
        { speaker: "SYSTEM", text: rewardItem.name + " を手に入れた。" },
        { speaker: "SYSTEM", text: rewardItem.description }
      ]);
    }

    solvePuzzle(interactive) {
      var answer = window.prompt(interactive.prompt || "番号を入力", "");
      if (answer === null) {
        return;
      }
      if (String(answer).trim() === String(interactive.answer)) {
        this.completeObjective(interactive.id);
        if (interactive.rewardItem) {
          this.game.state.inventory.push(interactive.rewardItem.name);
        }
        var lines = (interactive.successLines || []).slice();
        if (interactive.rewardItem) {
          lines.push({ speaker: "SYSTEM", text: interactive.rewardItem.name + " を手に入れた。" });
        }
        this.dialogueBox.open(lines);
      } else {
        this.dialogueBox.open(interactive.failLines || [{ speaker: "SYSTEM", text: "何も起きない。" }]);
      }
    }

    handleInteractive(interactive) {
      var alreadyCompleted = !!this.completedObjectives[interactive.id];
      var openRepeat = () => {
        this.dialogueBox.open(interactive.repeatLines || [{ speaker: "SYSTEM", text: "特に変化はない。" }]);
      };

      if (interactive.type === "puzzle") {
        if (alreadyCompleted) {
          openRepeat();
          return;
        }
        if (interactive.firstLines && interactive.firstLines.length) {
          this.dialogueBox.open(interactive.firstLines, () => {
            this.solvePuzzle(interactive);
          });
        } else {
          this.solvePuzzle(interactive);
        }
        return;
      }

      if (interactive.type === "rest") {
        if (!alreadyCompleted && interactive.heal) {
          this.game.state.hp = Math.min(this.game.state.maxHp, this.game.state.hp + interactive.heal);
          this.completeObjective(interactive.required ? interactive.id : null);
        }
        this.dialogueBox.open(alreadyCompleted ? (interactive.repeatLines || interactive.firstLines) : interactive.firstLines);
        return;
      }

      if (!alreadyCompleted && interactive.required) {
        this.completeObjective(interactive.id);
      }
      this.dialogueBox.open(alreadyCompleted ? (interactive.repeatLines || interactive.firstLines) : interactive.firstLines);
    }

    tryInteract() {
      var target = this.getNearestTarget();
      if (!target) {
        if (this.isNearExit()) {
          this.tryExit();
        }
        return;
      }

      if (target.type === "interactive") {
        this.handleInteractive(target.data);
        return;
      }

      var character = target.data;
      var stages = this.getNpcConversationStages(character);
      var progress = this.getNpcConversationProgress(character);
      var stageIndex = Math.min(progress, stages.length - 1);
      var lines = stages[stageIndex];
      this.dialogueBox.open(lines);

      if (progress < stages.length) {
        this.npcTalkProgress[character.id] = progress + 1;
        this.talkCount += 1;
      }
    }

    tryExit() {
      if (this.talkCount < this.chapter.room.requiredTalks) {
        this.dialogueBox.open([{ speaker: "主人公", text: this.chapter.room.exit.lockedText }]);
        return;
      }
      if (this.getCompletedObjectiveCount() < this.requiredObjectiveCount) {
        this.dialogueBox.open([{ speaker: "主人公", text: "まだこの場所で調べることが残っている。" }]);
        return;
      }

      if (!this.preBattleDone) {
        this.preBattleDone = true;
        this.dialogueBox.open(this.chapter.preBattle, () => {
          this.game.startBattle(this.chapter);
        });
        return;
      }

      this.game.startBattle(this.chapter);
    }

    update(dt, input) {
      if (this.titleTimer > 0) {
        this.titleTimer -= dt;
      }

      if (this.dialogueBox.active) {
        this.dialogueBox.update(dt, input);
        return;
      }

      if (this.statusVisible) {
        if (input.wasPressed("menu") || input.wasPressed("cancel") || input.wasPressed("confirm")) {
          this.statusVisible = false;
        }
        return;
      }

      if (input.wasPressed("menu")) {
        this.statusVisible = true;
        return;
      }

      this.movePlayer(dt, input);

      if (input.wasPressed("confirm")) {
        this.tryInteract();
      }
    }

    draw(renderer) {
      var room = this.chapter.room;
      var accent = this.game.monetization.getAccentColor();
      var nearestTarget = this.getNearestTarget();
      renderer.clear(room.background);
      renderer.drawChapterBackdrop(this.chapter.id, room);

      room.npcs.forEach((character) => {
        renderer.drawPixelSprite(character, this.getSpriteKind(character), {
          border: "#ffffff"
        });
        if (this.hasPendingNpcConversation(character)) {
          renderer.drawText("!", character.x + character.width / 2, character.y - 34, {
            size: 20,
            align: "center",
            color: accent
          });
        }
      });

      this.interactives.forEach((interactive) => {
        renderer.drawInteractiveSpot(
          interactive,
          this.completedObjectives[interactive.id] ? "#88f291" : accent
        );
      });

      renderer.drawPanel(room.exit.x, room.exit.y, room.exit.width, room.exit.height, {
        fill: (
          this.talkCount >= room.requiredTalks &&
          this.getCompletedObjectiveCount() >= this.requiredObjectiveCount
        ) ? "rgba(55, 90, 45, 0.9)" : "rgba(50, 30, 20, 0.9)",
        border: (
          this.talkCount >= room.requiredTalks &&
          this.getCompletedObjectiveCount() >= this.requiredObjectiveCount
        ) ? "#88f291" : "#d7a77f"
      });
      renderer.drawText(room.exit.label, room.exit.x + room.exit.width / 2, room.exit.y + room.exit.height / 2 - 10, {
        size: 16,
        align: "center",
        color: "#fff7dd"
      });

      renderer.drawPixelSprite({
        x: this.player.x,
        y: this.player.y,
        width: this.player.width,
        height: this.player.height,
        label: this.game.getPlayerName(),
        color: this.player.color
      }, "player", {
        border: "#000000"
      });

      renderer.drawPanel(24, 20, 324, 92, {
        fill: "rgba(12, 12, 12, 0.86)",
        border: accent
      });
      renderer.drawText(this.chapter.title, 42, 36, { size: 24, color: accent });
      renderer.drawParagraph(room.objective, 42, 68, 286, {
        size: 18,
        color: "#f3ead0"
      });

      renderer.drawPanel(716, 20, 220, 92, {
        fill: "rgba(12, 12, 12, 0.86)",
        border: accent
      });
      renderer.drawText("STATUS", 738, 36, { size: 20, color: accent });
      renderer.drawParagraph(
        this.game.getPlayerName() + "\nHP " + this.game.state.hp + "/" + this.game.state.maxHp + "\nKIND " + this.game.state.kindness + "  FEAR " + this.game.state.fear,
        738,
        66,
        176,
        { size: 18, lineHeight: 24 }
      );

      renderer.drawText("TALK " + this.talkCount + "/" + room.requiredTalks, 38, 476, {
        size: 18,
        color: "#f8e0a8"
      });
      renderer.drawText("EXPLORE " + this.getCompletedObjectiveCount() + "/" + this.requiredObjectiveCount, 182, 476, {
        size: 18,
        color: "#9ee4ff"
      });
      renderer.drawText("Z: INTERACT / X: BACK / C: STATUS", 540, 476, {
        size: 16,
        color: "#d7c8a6"
      });
      if (nearestTarget) {
        var actionLabel = nearestTarget.type === "npc"
          ? "話す"
          : (nearestTarget.data.actionLabel || "しらべる");
        renderer.drawText("NEAR: " + actionLabel, 720, 448, {
          size: 16,
          color: accent
        });
      }

      if (this.statusVisible) {
        renderer.drawPanel(160, 130, 640, 398, {
          fill: "rgba(7, 7, 7, 0.94)",
          border: accent
        });
        renderer.drawCenteredText("STATUS", 164, { size: 34, color: accent });
        renderer.drawParagraph(
          "章: " + this.chapter.title +
          "\n名前: " + this.game.getPlayerName() +
          "\nHP: " + this.game.state.hp + " / " + this.game.state.maxHp +
          "\nやさしさ: " + this.game.state.kindness +
          "\n押し切り: " + this.game.state.fear +
          "\n所持品: " + (this.game.state.inventory.join(" / ") || "なし") +
          "\n支援解放: " + Object.keys(this.game.state.supportUnlocks).length + " 件",
          206,
          228,
          548,
          { size: 22, lineHeight: 34 }
        );
        renderer.drawCenteredText("C / X / Z で閉じる", 466, {
          size: 18,
          color: "#d8c9ab"
        });
      }

      if (this.titleTimer > 0) {
        var alpha = Math.min(1, this.titleTimer);
        renderer.drawPanel(250, 182, 460, 90, {
          fill: "rgba(10, 10, 10, " + (0.78 * alpha) + ")",
          border: accent,
          alpha: alpha
        });
        renderer.drawCenteredText(this.chapter.title, 212, {
          size: 30,
          color: "#fff2ca"
        });
      }

      this.dialogueBox.draw(renderer, {
        assets: this.game.assets,
        playerName: this.game.getPlayerName()
      });
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
