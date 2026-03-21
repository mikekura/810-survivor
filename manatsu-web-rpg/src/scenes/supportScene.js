(function (ns) {
  ns.SupportScene = class {
    constructor(game) {
      this.game = game;
      this.game.audio.playTrack("title");
      this.message = "本編はそのまま遊べます。支援導線は控えめです。";
      var items = ns.supportCatalog.map(function (entry) {
        return {
          label: entry.name,
          supportId: entry.id
        };
      });
      items.push({ label: "BACK", supportId: "back" });

      this.menu = new ns.MenuBox({
        x: 70,
        y: 132,
        width: 280,
        height: 280,
        items: items
      });
    }

    update(dt, input) {
      var result = this.menu.update(input, input.getPointer());
      if (result.type === "cancel") {
        this.game.returnToTitle();
        return;
      }
      if (result.type === "select") {
        if (result.item.supportId === "back") {
          this.game.returnToTitle();
          return;
        }
        this.message = this.game.monetization.purchase(result.item.supportId);
        this.game.saveState();
      }
    }

    draw(renderer) {
      var accent = this.game.monetization.getAccentColor();
      var selected = this.menu.getSelected();
      var item = ns.supportCatalog.find(function (entry) {
        return entry.id === selected.supportId;
      }) || ns.supportCatalog[0];

      renderer.clear("#100d09");
      renderer.drawCenteredText("SUPPORT", 58, {
        size: 48,
        color: accent,
        shadow: true
      });
      renderer.drawCenteredText("課金を前面に出さず、支援だけ静かに置く設計", 116, {
        size: 18,
        color: "#e9dcc2"
      });

      this.menu.draw(renderer, "PACKS");

      renderer.drawPanel(396, 132, 500, 380, {
        fill: "rgba(14, 14, 14, 0.94)",
        border: accent
      });

      renderer.drawText(item.name, 428, 168, {
        size: 28,
        color: accent
      });
      renderer.drawText(item.price, 820, 174, {
        size: 18,
        color: "#f5e8b2",
        align: "right"
      });
      renderer.drawParagraph(item.short, 428, 216, 420, {
        size: 22,
        color: "#f0e5c7"
      });
      renderer.drawParagraph(item.description, 428, 280, 420, {
        size: 20,
        lineHeight: 30,
        color: "#ddd0ad"
      });

      if (item && item.id !== "back" && this.game.monetization.isUnlocked(item.id)) {
        renderer.drawPanel(428, 406, 188, 42, {
          fill: "rgba(20, 41, 18, 0.92)",
          border: "#88f291"
        });
        renderer.drawText("UNLOCKED", 522, 418, {
          size: 18,
          align: "center",
          color: "#dfffe3"
        });
      }

      renderer.drawPanel(42, 566, 876, 96, {
        fill: "rgba(9, 9, 9, 0.92)",
        border: accent
      });
      renderer.drawParagraph(this.message, 68, 592, 820, {
        size: 20
      });
      renderer.drawText("Z: 解放  X: 戻る", 690, 626, {
        size: 18,
        color: "#d5c6a3"
      });
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
