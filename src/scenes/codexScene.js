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

    isPortraitLayout() {
      return !!(ns.constants && ns.constants.IS_MOBILE_PORTRAIT);
    }

    getBackButton() {
      if (this.isPortraitLayout()) {
        return { x: 390, y: 26, width: 122, height: 42 };
      }
      return { x: 760, y: 42, width: 150, height: 52 };
    }

    getRowRect(index) {
      if (this.isPortraitLayout()) {
        return { x: 34, y: 118 + index * 60, width: 472, height: 52 };
      }
      return { x: 70, y: 154 + index * 90, width: 256, height: 72 };
    }

    update(dt, input) {
      var pointer = input.getPointer();
      var i;
      var backButton = this.getBackButton();

      this.hoverIndex = -1;

      if (pointer.inside) {
        if (pointInRect(pointer, backButton) && pointer.pressed) {
          this.game.openTitle(this.options);
          return;
        }

        for (i = 0; i < this.items.length; i += 1) {
          var rect = this.getRowRect(i);
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
      var isPortrait = this.isPortraitLayout();
      var outerX = isPortrait ? 16 : 34;
      var outerY = isPortrait ? 16 : 28;
      var outerW = isPortrait ? 508 : 892;
      var outerH = isPortrait ? 928 : 664;
      var listX = isPortrait ? 24 : 56;
      var listY = isPortrait ? 100 : 138;
      var listW = isPortrait ? 492 : 284;
      var listH = isPortrait ? 336 : 518;
      var detailX = isPortrait ? 24 : 368;
      var detailY = isPortrait ? 454 : 138;
      var detailW = isPortrait ? 492 : 530;
      var detailH = isPortrait ? 474 : 518;
      var backButton = this.getBackButton();

      for (i = 0; i < this.items.length; i += 1) {
        if (discovered.indexOf(this.items[i].id) >= 0) {
          foundCount += 1;
        }
      }

      renderer.clear("#120c08");
      renderer.drawPanel(outerX, outerY, outerW, outerH, {
        fill: "rgba(12, 8, 6, 0.96)",
        border: "#f6c453"
      });
      renderer.drawText("ITEM CODEX", isPortrait ? 30 : 58, isPortrait ? 28 : 42, {
        size: isPortrait ? 32 : 44,
        color: "#f6c453",
        shadow: true
      });
      renderer.drawText(
        this.game.getLocale() === "ja"
          ? "一度拾った特殊アイテムの効果と入手元"
          : "Effects and sources of special items you've found",
        isPortrait ? 30 : 58,
        isPortrait ? 62 : 92,
        { size: isPortrait ? 14 : 20, color: "#f4e0b6" }
      );
      renderer.drawText(foundCount + " / " + this.items.length, isPortrait ? 330 : 306, isPortrait ? 28 : 42, {
        size: isPortrait ? 18 : 24,
        color: "#d6d0ff"
      });

      renderer.drawPanel(listX, listY, listW, listH, {
        fill: "rgba(10, 10, 10, 0.88)",
        border: "#6a4b27"
      });
      for (i = 0; i < this.items.length; i += 1) {
        var item = this.items[i];
        var rowRect = this.getRowRect(i);
        var discoveredItem = discovered.indexOf(item.id) >= 0;
        var selected = i === this.selectedIndex;
        var hovered = i === this.hoverIndex;
        renderer.drawPanel(rowRect.x, rowRect.y, rowRect.width, rowRect.height, {
          fill: selected || hovered ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.22)",
          border: selected ? item.color : hovered ? "#fff1c4" : "#5f4423"
        });
        this.drawIcon(renderer, rowRect.x + 10, rowRect.y + (isPortrait ? -2 : 8), item, discoveredItem);
        renderer.drawText(discoveredItem ? metaText(this.game, item, "name") : "LOCKED", rowRect.x + 76, rowRect.y + (isPortrait ? 8 : 12), {
          size: isPortrait ? 16 : 22,
          color: discoveredItem ? "#f4f0da" : "#8d7e66"
        });
        renderer.drawText(discoveredItem ? metaText(this.game, item, "source") : (this.game.getLocale() === "ja" ? "未発見" : "Not found yet"), rowRect.x + 76, rowRect.y + (isPortrait ? 28 : 42), {
          size: isPortrait ? 11 : 15,
          color: discoveredItem ? "#d8c8a4" : "#776854"
        });
      }

      renderer.drawPanel(detailX, detailY, detailW, detailH, {
        fill: "rgba(18, 20, 28, 0.94)",
        border: current.color || "#d6d0ff"
      });
      this.drawIcon(renderer, isPortrait ? 42 : 398, isPortrait ? 478 : 172, current, isFound);
      renderer.drawText(isFound ? metaText(this.game, current, "name") : "LOCKED", isPortrait ? 124 : 476, isPortrait ? 484 : 178, {
        size: isPortrait ? 24 : 34,
        color: isFound ? (current.color || "#f4f0da") : "#8d7e66"
      });
      renderer.drawText(isFound ? metaText(this.game, current, "source") : (this.game.getLocale() === "ja" ? "エリートかボスから見つけよう" : "Find it from elite or boss enemies"), isPortrait ? 42 : 398, isPortrait ? 552 : 252, {
        size: isPortrait ? 16 : 20,
        color: "#f4e0b6"
      });
      renderer.drawText(this.game.getLocale() === "ja" ? "概要" : "Summary", isPortrait ? 42 : 398, isPortrait ? 598 : 306, {
        size: isPortrait ? 18 : 20,
        color: "#d6d0ff"
      });
      renderer.drawParagraph(isFound ? metaText(this.game, current, "desc") : (this.game.getLocale() === "ja" ? "まだ図鑑に登録されていない特殊アイテムです。" : "This special item has not been registered in the codex yet."), isPortrait ? 42 : 398, isPortrait ? 628 : 338, isPortrait ? 440 : 452, {
        size: isPortrait ? 16 : 20,
        lineHeight: isPortrait ? 22 : 30,
        color: "#f4f0da"
      });
      renderer.drawText(this.game.getLocale() === "ja" ? "効果" : "Effect", isPortrait ? 42 : 398, isPortrait ? 744 : 444, {
        size: isPortrait ? 18 : 20,
        color: "#d6d0ff"
      });
      renderer.drawParagraph(isFound ? metaText(this.game, current, "effect") : (this.game.getLocale() === "ja" ? "拾うとここに詳細が表示される。" : "Pick it up once to reveal the full effect here."), isPortrait ? 42 : 398, isPortrait ? 774 : 476, isPortrait ? 440 : 452, {
        size: isPortrait ? 16 : 20,
        lineHeight: isPortrait ? 22 : 30,
        color: "#f4f0da"
      });

      renderer.drawPanel(backButton.x, backButton.y, backButton.width, backButton.height, {
        fill: "rgba(8, 8, 8, 0.88)",
        border: "#d6d0ff"
      });
      renderer.drawText(this.game.t("buttons.back"), backButton.x + backButton.width / 2, backButton.y + 12, {
        size: isPortrait ? 18 : 22,
        align: "center",
        color: "#d6d0ff"
      });
      renderer.drawText(this.game.getLocale() === "ja" ? "タップまたは上下キーで選択 / X,C で戻る" : "Tap or Up/Down to browse / X,C to go back", isPortrait ? 270 : 480, isPortrait ? 914 : 666, {
        size: isPortrait ? 14 : 18,
        align: "center",
        color: "#d2c7a9"
      });
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
