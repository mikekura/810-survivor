(function (ns) {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  ns.BattleScene = class {
    constructor(game, chapter) {
      this.game = game;
      this.chapter = chapter;
      this.extra = (ns.chapterExtras && ns.chapterExtras[chapter.id]) || null;
      this.dialogueBox = new ns.DialogueBox();
      this.enemy = {
        hp: chapter.encounter.baseHp,
        maxHp: chapter.encounter.baseHp,
        mercy: 0,
        name: chapter.encounter.enemyName
      };
      this.phase = "dialogue";
      this.currentSubMenu = null;
      this.currentSubType = "";
      this.turnRuntime = null;
      this.turnTime = 0;
      this.enemyTurnIndex = 0;
      this.pendingFightStyle = null;
      this.fightStyleLabel = "";
      this.enemyTurnDurationModifier = 1;
      this.attackPatterns = (this.extra && this.extra.battle && this.extra.battle.attackPatterns)
        ? this.extra.battle.attackPatterns.slice()
        : [chapter.encounter.attackPattern];
      this.fightMeter = {
        value: 0.1,
        direction: 1,
        speed: 1.4
      };
      this.heart = {
        x: ns.constants.BATTLE_BOX.x + ns.constants.BATTLE_BOX.w / 2,
        y: ns.constants.BATTLE_BOX.y + ns.constants.BATTLE_BOX.h / 2,
        radius: 8,
        invuln: 0
      };
      this.gameOverMenu = new ns.MenuBox({
        x: 346,
        y: 260,
        width: 250,
        height: 126,
        items: [
          { label: "RETRY", action: "retry" },
          { label: "TITLE", action: "title" }
        ]
      });
      this.mainMenu = new ns.MenuBox({
        x: 134,
        y: 286,
        width: 690,
        height: 76,
        orientation: "horizontal",
        cancelable: false,
        items: [
          { label: "FIGHT", action: "fight" },
          { label: "ACT", action: "act" },
          { label: "ITEM", action: "item" },
          { label: "MERCY", action: "mercy" }
        ]
      });
      this.fightMenu = new ns.MenuBox({
        x: 70,
        y: 286,
        width: 360,
        height: 148,
        items: [
          { label: "SLASH", action: "normal" },
          { label: "HEAVY", action: "heavy" },
          { label: "BREAK", action: "break" }
        ]
      });

      this.game.audio.playTrack("battle");
      this.openDialogue(chapter.encounter.introLines, () => {
        this.phase = "main-menu";
      });
    }

    openDialogue(lines, onComplete) {
      this.phase = "dialogue";
      this.dialogueBox.open(lines, () => {
        if (onComplete) {
          onComplete();
        }
      });
    }

    getHealAmount(itemName) {
      if (itemName.indexOf("夕立") >= 0) {
        return 14;
      }
      if (itemName.indexOf("保冷剤") >= 0) {
        return 12;
      }
      if (itemName.indexOf("ラムネ") >= 0) {
        return 8;
      }
      if (itemName.indexOf("塩") >= 0) {
        return 6;
      }
      return 5;
    }

    buildActMenu() {
      this.currentSubType = "act";
      this.currentSubMenu = new ns.MenuBox({
        x: 70,
        y: 286,
        width: 360,
        height: 148,
        items: this.chapter.encounter.acts.map(function (act) {
          return {
            label: act.label,
            actData: act
          };
        })
      });
      this.phase = "submenu";
    }

    buildItemMenu() {
      this.currentSubType = "item";
      var items = this.game.state.inventory.map(function (itemName) {
        return {
          label: itemName,
          itemName: itemName
        };
      });
      if (!items.length) {
        items.push({ label: "なにもない", disabled: true });
      }
      this.currentSubMenu = new ns.MenuBox({
        x: 70,
        y: 286,
        width: 360,
        height: 180,
        items: items
      });
      this.phase = "submenu";
    }

    buildMercyMenu() {
      this.currentSubType = "mercy";
      this.currentSubMenu = new ns.MenuBox({
        x: 70,
        y: 286,
        width: 260,
        height: 108,
        items: [
          { label: "みのがす", action: "spare" }
        ]
      });
      this.phase = "submenu";
    }

    buildFightMenu() {
      this.currentSubType = "fight";
      this.currentSubMenu = this.fightMenu;
      this.phase = "submenu";
    }

    startFightMeter(style) {
      this.pendingFightStyle = style || "normal";
      this.fightStyleLabel = this.pendingFightStyle.toUpperCase();
      this.phase = "fight-meter";
      this.fightMeter.value = 0.08;
      this.fightMeter.direction = 1;
      this.fightMeter.speed = this.pendingFightStyle === "heavy"
        ? 1.0
        : this.pendingFightStyle === "break"
          ? 1.8
          : 1.4;
    }

    runFight() {
      var baseDamage = ns.calculateFightDamage(this.fightMeter.value, this.game.state.attack);
      var damage = baseDamage;
      if (this.pendingFightStyle === "heavy") {
        damage = Math.max(1, Math.round(baseDamage * 1.55));
      } else if (this.pendingFightStyle === "break") {
        damage = Math.max(1, Math.round(baseDamage * 0.82));
        this.enemy.mercy += 1;
        this.enemyTurnDurationModifier = 0.86;
      } else {
        this.enemyTurnDurationModifier = 1;
      }
      this.enemy.hp = Math.max(0, this.enemy.hp - damage);

      if (this.enemy.hp <= 0) {
        this.finishBattle("defeated");
        return;
      }

      this.openDialogue([
        { speaker: "SYSTEM", text: this.enemy.name + " に " + damage + " ダメージ。" },
        { speaker: "SYSTEM", text: "攻撃タイプ: " + this.fightStyleLabel }
      ], () => {
        this.beginEnemyTurn();
      });
    }

    beginEnemyTurn() {
      this.phase = "enemy-turn";
      this.turnRuntime = ns.startEnemyTurn(this.attackPatterns[this.enemyTurnIndex % this.attackPatterns.length]);
      this.enemyTurnIndex += 1;
      this.turnTime = 0;
      this.heart.x = ns.constants.BATTLE_BOX.x + ns.constants.BATTLE_BOX.w / 2;
      this.heart.y = ns.constants.BATTLE_BOX.y + ns.constants.BATTLE_BOX.h / 2;
      this.heart.invuln = 0;
    }

    finishBattle(result) {
      var lines = result === "spared" ? this.chapter.postBattle.spared : this.chapter.postBattle.defeated;
      this.openDialogue(lines, () => {
        this.game.completeChapter({
          result: result,
          chapterId: this.chapter.id,
          enemyName: this.chapter.encounter.enemyName
        });
      });
    }

    triggerGameOver() {
      this.openDialogue([
        { speaker: "SYSTEM", text: "暑さで意識が遠のいていく……。" }
      ], () => {
        this.phase = "game-over";
      });
    }

    handleMainMenu(result) {
      switch (result.item.action) {
        case "fight":
          this.buildFightMenu();
          break;
        case "act":
          this.buildActMenu();
          break;
        case "item":
          this.buildItemMenu();
          break;
        case "mercy":
          this.buildMercyMenu();
          break;
      }
    }

    handleSubMenu(result) {
      if (result.type === "cancel") {
        this.phase = "main-menu";
        this.currentSubMenu = null;
        return;
      }

      if (result.type !== "select") {
        return;
      }

      if (this.currentSubType === "fight") {
        this.startFightMeter(result.item.action);
        return;
      }

      if (this.currentSubType === "act") {
        var act = result.item.actData;
        this.enemy.mercy += act.mercy || 1;
        this.openDialogue(act.text, () => {
          this.beginEnemyTurn();
        });
        return;
      }

      if (this.currentSubType === "item") {
        if (!result.item.itemName) {
          this.phase = "main-menu";
          return;
        }
        var heal = this.getHealAmount(result.item.itemName);
        var index = this.game.state.inventory.indexOf(result.item.itemName);
        if (index >= 0) {
          this.game.state.inventory.splice(index, 1);
        }
        this.game.state.hp = clamp(this.game.state.hp + heal, 0, this.game.state.maxHp);
        this.openDialogue([
          { speaker: "主人公", text: result.item.itemName + " を使った。" },
          { speaker: "SYSTEM", text: "HP が " + heal + " 回復した。" }
        ], () => {
          this.beginEnemyTurn();
        });
        return;
      }

      if (this.currentSubType === "mercy") {
        if (this.enemy.mercy >= this.chapter.encounter.spareThreshold) {
          this.finishBattle("spared");
        } else {
          this.openDialogue(this.chapter.encounter.cantSpareText, () => {
            this.beginEnemyTurn();
          });
        }
      }
    }

    updateEnemyTurn(dt, input) {
      var axis = input.getAxis();
      var length = Math.sqrt(axis.x * axis.x + axis.y * axis.y) || 1;
      var speed = ns.constants.HEART_SPEED * dt;

      this.heart.x += (axis.x / length || 0) * speed;
      this.heart.y += (axis.y / length || 0) * speed;
      this.heart.x = clamp(this.heart.x, ns.constants.BATTLE_BOX.x + 10, ns.constants.BATTLE_BOX.x + ns.constants.BATTLE_BOX.w - 10);
      this.heart.y = clamp(this.heart.y, ns.constants.BATTLE_BOX.y + 10, ns.constants.BATTLE_BOX.y + ns.constants.BATTLE_BOX.h - 10);

      if (this.heart.invuln > 0) {
        this.heart.invuln -= dt;
      }

      ns.updateEnemyTurn(this.turnRuntime, dt, ns.constants.BATTLE_BOX);
      this.turnTime += dt;

      if (this.heart.invuln <= 0 && ns.checkHeartCollision(this.heart, this.turnRuntime.bullets)) {
        this.heart.invuln = 0.55;
        this.game.state.hp = Math.max(0, this.game.state.hp - 2);
        if (this.game.state.hp <= 0) {
          this.triggerGameOver();
          return;
        }
      }

      if (this.turnTime >= this.chapter.encounter.attackDuration * this.enemyTurnDurationModifier) {
        this.phase = "main-menu";
        this.turnRuntime = null;
        this.enemyTurnDurationModifier = 1;
      }
    }

    update(dt, input) {
      var pointer = input.getPointer();

      if (this.dialogueBox.active) {
        this.dialogueBox.update(dt, input);
        return;
      }

      if (this.phase === "main-menu") {
        var mainResult = this.mainMenu.update(input, pointer);
        if (mainResult.type === "select") {
          this.handleMainMenu(mainResult);
        }
        return;
      }

      if (this.phase === "submenu") {
        this.handleSubMenu(this.currentSubMenu.update(input, pointer));
        return;
      }

      if (this.phase === "fight-meter") {
        this.fightMeter.value += this.fightMeter.direction * dt * this.fightMeter.speed;
        if (this.fightMeter.value >= 1) {
          this.fightMeter.value = 1;
          this.fightMeter.direction = -1;
        } else if (this.fightMeter.value <= 0) {
          this.fightMeter.value = 0;
          this.fightMeter.direction = 1;
        }

        if (input.wasPressed("confirm")) {
          this.runFight();
        }
        return;
      }

      if (this.phase === "enemy-turn") {
        this.updateEnemyTurn(dt, input);
        return;
      }

      if (this.phase === "game-over") {
        var gameOverResult = this.gameOverMenu.update(input, pointer);
        if (gameOverResult.type === "select") {
          if (gameOverResult.item.action === "retry") {
            this.game.restartCurrentChapter();
          } else {
            this.game.returnToTitle();
          }
        }
      }
    }

    draw(renderer) {
      var accent = this.game.monetization.getAccentColor();
      renderer.clear("#120d0a");

      renderer.drawPanel(72, 32, 816, 184, {
        fill: "rgba(16, 16, 16, 0.94)",
        border: accent
      });

      renderer.drawText(this.chapter.encounter.enemyName, 104, 62, {
        size: 28,
        color: accent
      });
      renderer.drawText(this.chapter.encounter.enemyTitle, 104, 98, {
        size: 18,
        color: "#f6e5bd"
      });

      renderer.drawBattleEnemySprite(
        this.chapter.id,
        664,
        64,
        110,
        110,
        this.chapter.encounter.spriteColor
      );

      renderer.drawPanel(104, 142, 320, 18, {
        fill: "#2c2c2c",
        border: "#8c8c8c"
      });
      renderer.drawPanel(104, 142, 320 * (this.enemy.hp / this.enemy.maxHp), 18, {
        fill: "#ff8a65",
        border: "#ff8a65"
      });
      renderer.drawText("HP " + this.enemy.hp + "/" + this.enemy.maxHp, 438, 138, {
        size: 16,
        color: "#f7e0c6"
      });

      renderer.drawPanel(104, 170, 320, 14, {
        fill: "#2c2c2c",
        border: "#8c8c8c"
      });
      renderer.drawPanel(104, 170, 320 * Math.min(1, this.enemy.mercy / this.chapter.encounter.spareThreshold), 14, {
        fill: "#88f291",
        border: "#88f291"
      });
      renderer.drawText("MERCY " + this.enemy.mercy + "/" + this.chapter.encounter.spareThreshold, 438, 164, {
        size: 16,
        color: "#ddf7df"
      });

      renderer.drawPanel(72, 242, 816, 242, {
        fill: "rgba(10, 10, 10, 0.92)",
        border: accent
      });

      renderer.drawPanel(ns.constants.BATTLE_BOX.x, ns.constants.BATTLE_BOX.y, ns.constants.BATTLE_BOX.w, ns.constants.BATTLE_BOX.h, {
        fill: "#000000",
        border: "#ffffff"
      });

      renderer.drawText("PLAYER  HP " + this.game.state.hp + "/" + this.game.state.maxHp, 100, 498, {
        size: 22,
        color: "#f5efdb"
      });
      renderer.drawText("Z: 決定  X: 戻る", 682, 498, {
        size: 18,
        color: "#d5c5a8"
      });

      if (this.phase === "main-menu") {
        this.mainMenu.draw(renderer, "COMMAND");
      }

      if (this.phase === "submenu" && this.currentSubMenu) {
        this.currentSubMenu.draw(renderer, this.currentSubType.toUpperCase());
      }

      if (this.phase === "fight-meter") {
        renderer.drawPanel(180, 300, 560, 32, {
          fill: "#1e1e1e",
          border: "#ffffff"
        });
        renderer.drawPanel(448, 300, 12, 32, {
          fill: "#f6c453",
          border: "#f6c453"
        });
        renderer.drawPanel(180 + this.fightMeter.value * 548, 300, 12, 32, {
          fill: "#ff6b6b",
          border: "#ff6b6b"
        });
        renderer.drawCenteredText(this.fightStyleLabel + " でタイミングを合わせて Z", 340, {
          size: 20,
          color: "#f0e4c4"
        });
      }

      if (this.phase === "enemy-turn" && this.turnRuntime) {
        this.turnRuntime.bullets.forEach(function (bullet) {
          renderer.drawPanel(bullet.x - bullet.radius, bullet.y - bullet.radius, bullet.radius * 2, bullet.radius * 2, {
            fill: "#f7f7f7",
            border: "#f7f7f7"
          });
        });

        if (this.heart.invuln > 0 && Math.floor(this.heart.invuln * 18) % 2 === 0) {
          // blink
        } else {
          renderer.drawHeart(this.heart.x, this.heart.y, this.heart.radius, ns.constants.COLORS.soul);
        }
      }

      if (this.phase === "game-over") {
        renderer.drawPanel(320, 214, 300, 220, {
          fill: "rgba(7, 7, 7, 0.96)",
          border: "#ff6b6b"
        });
        renderer.drawCenteredText("GAME OVER", 242, {
          size: 34,
          color: "#ff8c8c"
        });
        this.gameOverMenu.draw(renderer);
      }

      this.dialogueBox.draw(renderer, {
        assets: this.game.assets,
        playerName: this.game.getPlayerName()
      });
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
