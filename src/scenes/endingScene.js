(function (ns) {
  ns.EndingScene = class {
    constructor(game) {
      this.game = game;
      this.game.audio.playTrack("ending");
      this.dialogueBox = new ns.DialogueBox();
      this.phase = "dialogue";
      this.extraSeen = false;

      this.menu = new ns.MenuBox({
        x: 330,
        y: 540,
        width: 300,
        height: 118,
        items: [
          { label: "TITLE", action: "title" },
          { label: "CH7 AGAIN", action: "chapter7" }
        ]
      });

      this.openMainEnding();
    }

    buildEndingLines() {
      var kindness = this.game.state.kindness;
      var fear = this.game.state.fear;
      var lines;

      if (kindness >= fear + 2) {
        lines = [
          { speaker: "SYSTEM", text: "夕立が降り、止まっていた15:44が静かに動き出す。" },
          { speaker: "先輩", text: "終わったな。少し寂しいけど、ちゃんと終われた。" },
          { speaker: "主人公", text: "終わっても、ここで過ごした夏はなくならない。" },
          { speaker: "SYSTEM", text: "やわらかい雨の匂いとともに、町は前へ進みはじめた。" }
        ];
      } else if (fear > kindness) {
        lines = [
          { speaker: "SYSTEM", text: "まぶしさが砕け、強い静けさのあとで時計が動き出す。" },
          { speaker: "先輩", text: "少し荒かったが……それでも、前には進める。" },
          { speaker: "主人公", text: "次の夏は、もう少しうまくやりたい。" },
          { speaker: "SYSTEM", text: "苦さを残しながらも、終わらない午後はほどけていく。" }
        ];
      } else {
        lines = [
          { speaker: "SYSTEM", text: "夕立の気配が町に差し込み、止まっていた熱がゆるむ。" },
          { speaker: "先輩", text: "完璧じゃなくても、終われるんだな。" },
          { speaker: "主人公", text: "うん。たぶん、それで十分だ。" },
          { speaker: "SYSTEM", text: "真夏町は静かに、次の季節へ向かいはじめた。" }
        ];
      }

      lines.push({ speaker: "SYSTEM", text: "第七章クリア。ありがとう。" });
      return lines;
    }

    openMainEnding() {
      this.phase = "dialogue";
      this.dialogueBox.open(this.buildEndingLines(), () => {
        this.phase = "menu";
      });
    }

    openExtraTalk() {
      this.phase = "dialogue";
      this.dialogueBox.open([
        { speaker: "主人公", text: "……結局、先輩の本名って聞いてなかった。" },
        { speaker: "先輩", text: "今さらか。" },
        { speaker: "主人公", text: "今さらだよ。" },
        { speaker: "先輩", text: "また今度、涼しい日にでも話す。" },
        { speaker: "主人公", text: "それ、来るんだな。ちゃんと秋。" }
      ], () => {
        this.phase = "menu";
        this.extraSeen = true;
      });
    }

    update(dt, input) {
      if (this.dialogueBox.active) {
        this.dialogueBox.update(dt, input);
        return;
      }

      if (this.phase !== "menu") {
        return;
      }

      if (input.wasPressed("menu") && this.game.monetization.isUnlocked("aftertalk-pack") && !this.extraSeen) {
        this.openExtraTalk();
        return;
      }

      var result = this.menu.update(input, input.getPointer());
      if (result.type !== "select") {
        return;
      }

      if (result.item.action === "title") {
        this.game.returnToTitle();
      } else if (result.item.action === "chapter7") {
        this.game.startNewGame(6);
      }
    }

    draw(renderer) {
      var accent = this.game.monetization.getAccentColor();
      renderer.clear("#0d1018");

      renderer.drawCenteredText("CLEAR", 54, {
        size: 52,
        color: accent,
        shadow: true
      });
      renderer.drawCenteredText("真夏町の先輩", 114, {
        size: 22,
        color: "#f0e4c1"
      });

      renderer.drawPanel(78, 166, 804, 254, {
        fill: "rgba(12, 12, 12, 0.94)",
        border: accent
      });

      renderer.drawText("ROUTE", 110, 196, { size: 20, color: accent });
      renderer.drawParagraph(
        "やさしさ: " + this.game.state.kindness +
        "\n押し切り: " + this.game.state.fear +
        "\n解放支援: " + Object.keys(this.game.state.supportUnlocks).length + " 件",
        110,
        232,
        240,
        { size: 22, lineHeight: 34 }
      );

      renderer.drawText("OUTCOMES", 410, 196, { size: 20, color: accent });
      renderer.drawParagraph(
        ns.chapterData.map((chapter) => {
          var result = this.game.state.chapterOutcomes[String(chapter.id)] || "unknown";
          return "CH" + chapter.id + "  " + chapter.shortTitle + " : " + result;
        }).join("\n"),
        410,
        232,
        410,
        { size: 18, lineHeight: 26 }
      );

      if (this.phase === "menu") {
        this.menu.draw(renderer, "NEXT");
        if (this.game.monetization.isUnlocked("aftertalk-pack") && !this.extraSeen) {
          renderer.drawCenteredText("C で追加会話", 500, {
            size: 18,
            color: "#d8caa9"
          });
        }
      }

      this.dialogueBox.draw(renderer, {
        assets: this.game.assets,
        playerName: this.game.getPlayerName()
      });
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
