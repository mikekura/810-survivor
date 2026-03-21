(function (ns) {
  function pointInRect(pointer, rect) {
    return (
      pointer.x >= rect.x &&
      pointer.y >= rect.y &&
      pointer.x <= rect.x + rect.width &&
      pointer.y <= rect.y + rect.height
    );
  }

  function metaText(game, entry, key) {
    var locale = game.getLocale ? game.getLocale() : "en";
    var value = entry && entry[key];
    if (!value) {
      return "";
    }
    return value[locale] || value.en || value.ja || "";
  }

  ns.CodexScene = class {
    constructor(game, options) {
      this.game = game;
      this.options = options || game.getLaunchOptions();
      this.items = game.getSpecialItemCatalog();
      this.selectedIndex = 0;
      this.hoverIndex = -1;
      this.game.audio.playTrack("title");
    }

    getBackButton() {
      return { x: 760, y: 42, width: 150, height: 52 };
    }

    update(dt, input) {
      var pointer = input.getPointer();
      var listTop = 150;
      var i;
      var backButton = this.getBackButton();

      this.hoverIndex = -1;

      if (pointer.inside) {
        if (pointInRect(pointer, backButton) && pointer.pressed) {
          this.game.openTitle(this.options);
          return;
        }

        for (i = 0; i < this.items.length; i += 1) {
          var rect = { x: 58, y: listTop + i * 90, width: 278, height: 76 };
          if (pointInRect(pointer, rect)) {
            this.hoverIndex = i;
            this.selectedIndex = i;
            if (pointer.pressed) {
              return;
            }
          }
        }
      }

      if (input.wasPressed("cancel") || input.wasPressed("menu")) {
        this.game.openTitle(this.options);
        return;
      }
      if (input.wasPressed("up")) {
        this.selectedIndex = (this.selectedIndex + this.items.length - 1) % this.items.length;
      }
      if (input.wasPressed("down")) {
        this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
      }
    }

    drawIcon(renderer, x, y, item, discovered) {
      renderer.drawPanel(x, y, 56, 56, {
        fill: discovered ? "rgba(8, 8, 8, 0.92)" : "rgba(12, 12, 12, 0.7)",
        border: discovered ? item.color : "#5b4d3b"
      });
      renderer.drawText(discovered ? String(item.id).replace("Item", "").toUpperCase().slice(0, 4) : "????", x + 28, y + 16, {
        size: 16,
        align: "center",
        color: discovered ? "#f4f0da" : "#8d7e66"
      });
    }

    draw(renderer) {
      var discovered = this.game.getDiscoveredSpecialItems();
      var current = this.items[this.selectedIndex] || this.items[0];
      var isFound = discovered.indexOf(current.id) >= 0;
      var foundCount = 0;
      var i;

      for (i = 0; i < this.items.length; i += 1) {
        if (discovered.indexOf(this.items[i].id) >= 0) {
          foundCount += 1;
        }
      }

      renderer.clear("#120c08");
      renderer.drawPanel(34, 28, 892, 664, {
        fill: "rgba(12, 8, 6, 0.96)",
        border: "#f6c453"
      });
      renderer.drawText("ITEM CODEX", 58, 42, {
        size: 44,
        color: "#f6c453",
        shadow: true
      });
      renderer.drawText(
        this.game.getLocale() === "ja"
          ? "一度拾った特殊アイテムの効果と入手元"
          : "Effects and sources of special items you've found",
        58,
        92,
        { size: 20, color: "#f4e0b6" }
      );
      renderer.drawText(foundCount + " / " + this.items.length, 306, 42, {
        size: 24,
        color: "#d6d0ff"
      });

      renderer.drawPanel(56, 138, 284, 518, {
        fill: "rgba(10, 10, 10, 0.88)",
        border: "#6a4b27"
      });
      for (i = 0; i < this.items.length; i += 1) {
        var item = this.items[i];
        var rowY = 154 + i * 90;
        var discoveredItem = discovered.indexOf(item.id) >= 0;
        var selected = i === this.selectedIndex;
        var hovered = i === this.hoverIndex;
        renderer.drawPanel(70, rowY, 256, 72, {
          fill: selected || hovered ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.22)",
          border: selected ? item.color : hovered ? "#fff1c4" : "#5f4423"
        });
        this.drawIcon(renderer, 82, rowY + 8, item, discoveredItem);
        renderer.drawText(discoveredItem ? metaText(this.game, item, "name") : "LOCKED", 150, rowY + 12, {
          size: 22,
          color: discoveredItem ? "#f4f0da" : "#8d7e66"
        });
        renderer.drawText(discoveredItem ? metaText(this.game, item, "source") : (this.game.getLocale() === "ja" ? "未発見" : "Not found yet"), 150, rowY + 42, {
          size: 15,
          color: discoveredItem ? "#d8c8a4" : "#776854"
        });
      }

      renderer.drawPanel(368, 138, 530, 518, {
        fill: "rgba(18, 20, 28, 0.94)",
        border: current.color || "#d6d0ff"
      });
      this.drawIcon(renderer, 398, 172, current, isFound);
      renderer.drawText(isFound ? metaText(this.game, current, "name") : "LOCKED", 476, 178, {
        size: 34,
        color: isFound ? (current.color || "#f4f0da") : "#8d7e66"
      });
      renderer.drawText(isFound ? metaText(this.game, current, "source") : (this.game.getLocale() === "ja" ? "エリートかボスから見つけよう" : "Find it from elite or boss enemies"), 398, 252, {
        size: 20,
        color: "#f4e0b6"
      });
      renderer.drawText(this.game.getLocale() === "ja" ? "概要" : "Summary", 398, 306, {
        size: 20,
        color: "#d6d0ff"
      });
      renderer.drawParagraph(isFound ? metaText(this.game, current, "desc") : (this.game.getLocale() === "ja" ? "まだ図鑑に登録されていない特殊アイテムです。" : "This special item has not been registered in the codex yet."), 398, 338, 452, {
        size: 20,
        lineHeight: 30,
        color: "#f4f0da"
      });
      renderer.drawText(this.game.getLocale() === "ja" ? "効果" : "Effect", 398, 444, {
        size: 20,
        color: "#d6d0ff"
      });
      renderer.drawParagraph(isFound ? metaText(this.game, current, "effect") : (this.game.getLocale() === "ja" ? "拾うとここに詳細が表示される。" : "Pick it up once to reveal the full effect here."), 398, 476, 452, {
        size: 20,
        lineHeight: 30,
        color: "#f4f0da"
      });

      renderer.drawPanel(760, 42, 150, 52, {
        fill: "rgba(8, 8, 8, 0.88)",
        border: "#d6d0ff"
      });
      renderer.drawText(this.game.t("buttons.back"), 835, 56, {
        size: 22,
        align: "center",
        color: "#d6d0ff"
      });
      renderer.drawText(this.game.getLocale() === "ja" ? "上下キーまたはクリックで選択 / X,C で戻る" : "Click or Up/Down to browse / X,C to go back", 480, 666, {
        size: 18,
        align: "center",
        color: "#d2c7a9"
      });
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
