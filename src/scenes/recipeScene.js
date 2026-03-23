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

  function findIngredient(items, recipes, itemId) {
    return findItem(items, itemId) || findItem(recipes, itemId);
  }

  ns.RecipeScene = class {
    constructor(game, options) {
      this.game = game;
      this.options = options || game.getLaunchOptions();
      this.baseRecipes = game.getFusionRecipes();
      this.trueRecipes = game.getTrueFusionRecipes ? game.getTrueFusionRecipes() : [];
      this.recipes = this.baseRecipes.concat(this.trueRecipes);
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
        return { x: 34, y: 118 + index * 56, width: 472, height: 48 };
      }
      return { x: 58, y: 154 + index * 120, width: 844, height: 102 };
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
          var rect = this.getRowRect(i);
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

    drawItemChip(renderer, x, y, item, active, compact) {
      renderer.drawPanel(x, y, compact ? 120 : 156, compact ? 44 : 58, {
        fill: active ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.24)",
        border: active ? item.color : "#5f4423"
      });
      renderer.drawText(metaText(this.game, item, "name"), x + (compact ? 60 : 78), y + (compact ? 11 : 16), {
        size: compact ? 12 : 18,
        align: "center",
        color: "#f4f0da"
      });
    }

    draw(renderer) {
      var discovered = this.game.getDiscoveredRecipes();
      var recipe = this.recipes[this.selectedIndex] || this.recipes[0];
      var isJa = this.game.getLocale() === "ja";
      var isPortrait = this.isPortraitLayout();
      var outerX = isPortrait ? 16 : 34;
      var outerY = isPortrait ? 16 : 28;
      var outerW = isPortrait ? 508 : 892;
      var outerH = isPortrait ? 928 : 664;
      var backButton = this.getBackButton();
      var i;

      renderer.clear("#120c08");
      renderer.drawPanel(outerX, outerY, outerW, outerH, {
        fill: "rgba(12, 8, 6, 0.96)",
        border: "#f6c453"
      });
      renderer.drawText(isJa ? "進化レシピ" : "EVOLUTION RECIPES", isPortrait ? 30 : 58, isPortrait ? 28 : 42, {
        size: isPortrait ? 32 : 42,
        color: "#f6c453",
        shadow: true
      });
      renderer.drawText(
        isJa ? "特殊合成と真進化の組み合わせ一覧" : "Fusion and true evolution routes",
        isPortrait ? 30 : 58,
        isPortrait ? 62 : 92,
        { size: isPortrait ? 14 : 20, color: "#f4e0b6" }
      );

      renderer.drawPanel(isPortrait ? 24 : 58, isPortrait ? 100 : 138, isPortrait ? 492 : 844, isPortrait ? 364 : 538, {
        fill: "rgba(10, 10, 10, 0.88)",
        border: "#6a4b27"
      });
      for (i = 0; i < this.recipes.length; i += 1) {
        var row = this.recipes[i];
        var selected = i === this.selectedIndex;
        var hovered = i === this.hoverIndex;
        var rowRect = this.getRowRect(i);
        var leftItem = findIngredient(this.items, this.baseRecipes, row.ingredients[0]);
        var rightItem = findIngredient(this.items, this.baseRecipes, row.ingredients[1]);
        var discoveredText = discovered.indexOf(row.id) >= 0
          ? (isJa ? "発見済み" : "DISCOVERED")
          : (isJa ? "未発見" : "UNDISCOVERED");

        renderer.drawPanel(rowRect.x, rowRect.y, rowRect.width, rowRect.height, {
          fill: selected || hovered ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.24)",
          border: selected ? row.color : hovered ? "#fff1c4" : "#5f4423"
        });
        if (isPortrait) {
          renderer.drawText(metaText(this.game, leftItem, "name"), rowRect.x + 12, rowRect.y + 8, {
            size: 12,
            color: "#f4f0da"
          });
          renderer.drawText("+", rowRect.x + 126, rowRect.y + 10, { size: 16, color: "#fff1c4" });
          renderer.drawText(metaText(this.game, rightItem, "name"), rowRect.x + 144, rowRect.y + 8, {
            size: 12,
            color: "#f4f0da"
          });
          renderer.drawText("=", rowRect.x + 264, rowRect.y + 10, { size: 16, color: "#fff1c4" });
          renderer.drawText(metaText(this.game, row, "name"), rowRect.x + 286, rowRect.y + 8, {
            size: 13,
            color: row.color
          });
          renderer.drawText(row.trueEvolution ? (isJa ? "真進化" : "TRUE") : discoveredText, rowRect.x + rowRect.width - 12, rowRect.y + 10, {
            size: 10,
            align: "right",
            color: row.trueEvolution ? "#dffbff" : (discovered.indexOf(row.id) >= 0 ? "#fff1c4" : "#a39172")
          });
          renderer.drawText(metaText(this.game, row, "result"), rowRect.x + 12, rowRect.y + 28, {
            size: 10,
            color: "#f4e0b6"
          });
        } else {
          this.drawItemChip(renderer, 78, rowRect.y + 22, leftItem, selected, false);
          renderer.drawText("+", 256, rowRect.y + 34, { size: 34, color: "#fff1c4" });
          this.drawItemChip(renderer, 286, rowRect.y + 22, rightItem, selected, false);
          renderer.drawText("=", 468, rowRect.y + 34, { size: 34, color: "#fff1c4" });
          renderer.drawPanel(506, rowRect.y + 14, 376, 74, {
            fill: "rgba(18, 20, 28, 0.92)",
            border: row.color
          });
          renderer.drawText(metaText(this.game, row, "name"), 526, rowRect.y + 24, {
            size: 24,
            color: row.color
          });
          renderer.drawText(discoveredText, 864, rowRect.y + 24, {
            size: 16,
            align: "right",
            color: discovered.indexOf(row.id) >= 0 ? "#fff1c4" : "#a39172"
          });
          if (row.trueEvolution) {
            renderer.drawText(isJa ? "真進化" : "TRUE", 864, rowRect.y + 48, {
              size: 14,
              align: "right",
              color: "#dffbff"
            });
          }
          renderer.drawText(metaText(this.game, row, "result"), 526, rowRect.y + 56, {
            size: 15,
            color: "#f4e0b6"
          });
        }
      }

      renderer.drawPanel(isPortrait ? 24 : 58, isPortrait ? 482 : 646, isPortrait ? 492 : 652, isPortrait ? 446 : 34, {
        fill: "rgba(10, 10, 10, 0.88)",
        border: "#5f4423"
      });
      if (isPortrait) {
        var detailLeft = findIngredient(this.items, this.baseRecipes, recipe.ingredients[0]);
        var detailRight = findIngredient(this.items, this.baseRecipes, recipe.ingredients[1]);
        this.drawItemChip(renderer, 42, 508, detailLeft, true, true);
        renderer.drawText("+", 170, 516, { size: 22, color: "#fff1c4" });
        this.drawItemChip(renderer, 198, 508, detailRight, true, true);
        renderer.drawText("=", 326, 516, { size: 22, color: "#fff1c4" });
        renderer.drawText(metaText(this.game, recipe, "name"), 352, 514, {
          size: 18,
          color: recipe.color
        });
        renderer.drawText(metaText(this.game, recipe, "result"), 42, 574, {
          size: 14,
          color: "#f4e0b6"
        });
        renderer.drawParagraph(metaText(this.game, recipe, "desc"), 42, 620, 440, {
          size: 16,
          lineHeight: 22,
          color: "#f4f0da"
        });
        renderer.drawParagraph(
          isJa ? "ここで合成ルートと真進化条件を確認 / X,C,Z で戻る" : "Check fusion routes and true evolution paths here / X,C,Z to go back",
          42,
          874,
          440,
          {
            size: 14,
            lineHeight: 20,
            color: "#d2c7a9"
          }
        );
      } else {
        renderer.drawText(metaText(this.game, recipe, "desc"), 74, 652, {
          size: 16,
          color: "#f4f0da"
        });
      }

      renderer.drawPanel(backButton.x, backButton.y, backButton.width, backButton.height, {
        fill: "rgba(8, 8, 8, 0.88)",
        border: "#d6d0ff"
      });
      renderer.drawText(this.game.t("buttons.back"), backButton.x + backButton.width / 2, backButton.y + 12, {
        size: isPortrait ? 18 : 22,
        align: "center",
        color: "#d6d0ff"
      });
      if (!isPortrait) {
        renderer.drawText(
          isJa ? "ここで合成ルートと真進化条件を確認 / X,C,Z で戻る" : "Check fusion routes and true evolution paths here / X,C,Z to go back",
          478,
          666,
          {
            size: 18,
            align: "center",
            color: "#d2c7a9"
          }
        );
      }
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
