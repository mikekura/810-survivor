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

  function findItem(catalog, itemId) {
    var i;
    for (i = 0; i < catalog.length; i += 1) {
      if (catalog[i].id === itemId) {
        return catalog[i];
      }
    }
    return null;
  }

  ns.RecipeScene = class {
    constructor(game, options) {
      this.game = game;
      this.options = options || game.getLaunchOptions();
      this.recipes = game.getFusionRecipes();
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
      var i;
      var backButton = this.getBackButton();

      this.hoverIndex = -1;

      if (pointer.inside) {
        if (pointInRect(pointer, backButton) && pointer.pressed) {
          this.game.openTitle(this.options);
          return;
        }
        for (i = 0; i < this.recipes.length; i += 1) {
          var rect = { x: 58, y: 154 + i * 120, width: 844, height: 102 };
          if (pointInRect(pointer, rect)) {
            this.hoverIndex = i;
            this.selectedIndex = i;
            return;
          }
        }
      }

      if (input.wasPressed("cancel") || input.wasPressed("menu")) {
        this.game.openTitle(this.options);
        return;
      }
      if (input.wasPressed("up")) {
        this.selectedIndex = (this.selectedIndex + this.recipes.length - 1) % this.recipes.length;
      }
      if (input.wasPressed("down")) {
        this.selectedIndex = (this.selectedIndex + 1) % this.recipes.length;
      }
    }

    drawItemChip(renderer, x, y, item, active) {
      renderer.drawPanel(x, y, 156, 58, {
        fill: active ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.24)",
        border: active ? item.color : "#5f4423"
      });
      renderer.drawText(metaText(this.game, item, "name"), x + 78, y + 16, {
        size: 18,
        align: "center",
        color: "#f4f0da"
      });
    }

    draw(renderer) {
      var discovered = this.game.getDiscoveredRecipes();
      var recipe = this.recipes[this.selectedIndex] || this.recipes[0];
      var isFound = discovered.indexOf(recipe.id) >= 0;
      var i;

      renderer.clear("#120c08");
      renderer.drawPanel(34, 28, 892, 664, {
        fill: "rgba(12, 8, 6, 0.96)",
        border: "#f6c453"
      });
      renderer.drawText("EVOLUTION RECIPES", 58, 42, {
        size: 42,
        color: "#f6c453",
        shadow: true
      });
      renderer.drawText(
        this.game.getLocale() === "ja"
          ? "特殊アイテム2つで起こる合成一覧"
          : "Two-item fusion routes for special evolutions",
        58,
        92,
        { size: 20, color: "#f4e0b6" }
      );

      for (i = 0; i < this.recipes.length; i += 1) {
        var row = this.recipes[i];
        var selected = i === this.selectedIndex;
        var hovered = i === this.hoverIndex;
        var rowY = 154 + i * 120;
        var leftItem = findItem(this.items, row.ingredients[0]);
        var rightItem = findItem(this.items, row.ingredients[1]);
        renderer.drawPanel(58, rowY, 844, 102, {
          fill: selected || hovered ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.24)",
          border: selected ? row.color : hovered ? "#fff1c4" : "#5f4423"
        });
        this.drawItemChip(renderer, 78, rowY + 22, leftItem, selected);
        renderer.drawText("+", 256, rowY + 34, { size: 34, color: "#fff1c4" });
        this.drawItemChip(renderer, 286, rowY + 22, rightItem, selected);
        renderer.drawText("=", 468, rowY + 34, { size: 34, color: "#fff1c4" });
        renderer.drawPanel(506, rowY + 14, 376, 74, {
          fill: "rgba(18, 20, 28, 0.92)",
          border: row.color
        });
        renderer.drawText(metaText(this.game, row, "name"), 526, rowY + 26, {
          size: 26,
          color: row.color
        });
        renderer.drawText(isFound && row.id === recipe.id ? (this.game.getLocale() === "ja" ? "発見済み" : "DISCOVERED") : (discovered.indexOf(row.id) >= 0 ? (this.game.getLocale() === "ja" ? "発見済み" : "DISCOVERED") : (this.game.getLocale() === "ja" ? "未発見" : "UNDISCOVERED")), 864, rowY + 26, {
          size: 16,
          align: "right",
          color: discovered.indexOf(row.id) >= 0 ? "#fff1c4" : "#a39172"
        });
        renderer.drawText(metaText(this.game, row, "result"), 526, rowY + 58, {
          size: 16,
          color: "#f4e0b6"
        });
      }

      renderer.drawPanel(58, 646, 652, 34, {
        fill: "rgba(10, 10, 10, 0.88)",
        border: "#5f4423"
      });
      renderer.drawText(metaText(this.game, recipe, "desc"), 74, 652, {
        size: 16,
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
      renderer.drawText(this.game.getLocale() === "ja" ? "一覧で組み合わせを確認 / X,C,Z で戻る" : "Check combo routes here / X,C,Z to go back", 478, 666, {
        size: 18,
        align: "center",
        color: "#d2c7a9"
      });
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
