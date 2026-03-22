(function (ns) {
  function pointInRect(pointer, rect) {
    return (
      pointer.x >= rect.x &&
      pointer.y >= rect.y &&
      pointer.x <= rect.x + rect.width &&
      pointer.y <= rect.y + rect.height
    );
  }

  function skinText(game, skin, key) {
    var locale = game.getLocale ? game.getLocale() : "en";
    var entry = skin && skin[key];
    if (!entry) {
      return "";
    }
    return entry[locale] || entry.en || entry.ja || "";
  }

  function formatPrice(game, skin) {
    if (skin && skin.unlockType === "score") {
      return game.t("store.scoreGoal", {
        score: (skin.scoreThreshold || 0).toLocaleString ? (skin.scoreThreshold || 0).toLocaleString() : (skin.scoreThreshold || 0)
      });
    }
    if (!skin || !skin.premium) {
      return game.t("common.free");
    }
    return "JPY " + skin.price;
  }

  ns.StoreScene = class {
    constructor(game, options) {
      var opts = options || game.getLaunchOptions();
      var skins = game.getSurvivorSkins ? game.getSurvivorSkins() : [];
      var currentId = opts.focusSkinId || game.getSelectedSurvivorSkinId();
      var i;

      this.game = game;
      this.options = opts;
      this.skins = skins;
      this.selectedIndex = 0;
      this.hoverIndex = -1;
      this.dialogHover = -1;
      this.purchaseTarget = null;
      this.previewTime = 0;
      this.notice = "";
      this.noticeColor = "#d8c8a4";
      this.noticeTimer = 0;

      for (i = 0; i < skins.length; i += 1) {
        if (skins[i].id === currentId) {
          this.selectedIndex = i;
          break;
        }
      }

      this.game.audio.playTrack("title");
    }

    getCurrentSkin() {
      return this.skins[this.selectedIndex] || this.skins[0] || null;
    }

    isOwned(skin) {
      return !!(skin && this.game.ownsSkin && this.game.ownsSkin(skin.id));
    }

    isSelected(skin) {
      return !!(skin && this.game.getSelectedSurvivorSkinId && this.game.getSelectedSurvivorSkinId() === skin.id);
    }

    isScoreUnlock(skin) {
      return !!(skin && skin.unlockType === "score");
    }

    getListMetrics() {
      if (this.skins.length > 10) {
        return {
          rowHeight: 36,
          gap: 6,
          spriteWidth: 28,
          spriteHeight: 34
        };
      }
      return {
        rowHeight: 58,
        gap: 14,
        spriteWidth: 40,
        spriteHeight: 50
      };
    }

    getRowRect(index) {
      var metrics = this.getListMetrics();
      return {
        x: 70,
        y: 154 + index * (metrics.rowHeight + metrics.gap),
        width: 272,
        height: metrics.rowHeight
      };
    }

    getBackButton() {
      return { x: 760, y: 42, width: 150, height: 52 };
    }

    getPrimaryButton() {
      return { x: 604, y: 576, width: 248, height: 64 };
    }

    getDialogButtons() {
      return [
        { x: 324, y: 484, width: 156, height: 54 },
        { x: 500, y: 484, width: 156, height: 54 }
      ];
    }

    openPurchaseDialog(skin) {
      this.purchaseTarget = skin || null;
      this.dialogHover = -1;
    }

    closePurchaseDialog() {
      this.purchaseTarget = null;
      this.dialogHover = -1;
    }

    setNotice(text, color) {
      this.notice = text || "";
      this.noticeColor = color || "#d8c8a4";
      this.noticeTimer = this.notice ? 3.5 : 0;
    }

    activateCurrentSkin() {
      var skin = this.getCurrentSkin();
      if (!skin) {
        return;
      }
      if (this.isOwned(skin)) {
        this.game.setSelectedSurvivorSkin(skin.id);
        return;
      }
      if (this.isScoreUnlock(skin)) {
        return;
      }
      this.openPurchaseDialog(skin);
    }

    confirmPurchase() {
      if (!this.purchaseTarget) {
        return;
      }
      if (this.game.openSkinCheckout && this.game.openSkinCheckout(this.purchaseTarget)) {
        this.setNotice(this.game.t("store.checkoutOpened"), this.purchaseTarget.color || "#ff91d7");
      } else {
        this.setNotice(this.game.t("store.checkoutMissing"), "#ff8a70");
      }
      this.closePurchaseDialog();
    }

    update(dt, input) {
      var pointer = input.getPointer();
      var i;
      var backButton = this.getBackButton();
      var primaryButton = this.getPrimaryButton();

      this.previewTime += dt;
      if (this.noticeTimer > 0) {
        this.noticeTimer = Math.max(0, this.noticeTimer - dt);
        if (this.noticeTimer <= 0) {
          this.notice = "";
        }
      }

      if (this.purchaseTarget) {
        var dialogButtons = this.getDialogButtons();
        this.dialogHover = -1;

        if (pointer.inside) {
          for (i = 0; i < dialogButtons.length; i += 1) {
            if (pointInRect(pointer, dialogButtons[i])) {
              this.dialogHover = i;
              if (pointer.pressed) {
                if (i === 0) {
                  this.confirmPurchase();
                } else {
                  this.closePurchaseDialog();
                }
                return;
              }
            }
          }
        }

        if (input.wasPressed("confirm")) {
          this.confirmPurchase();
          return;
        }
        if (input.wasPressed("cancel") || input.wasPressed("menu")) {
          this.closePurchaseDialog();
          return;
        }
        if (input.wasPressed("left") || input.wasPressed("right")) {
          this.dialogHover = this.dialogHover === 0 ? 1 : 0;
        }
        return;
      }

      this.hoverIndex = -1;

      if (pointer.inside) {
        if (pointInRect(pointer, backButton) && pointer.pressed) {
          this.game.openTitle(this.options);
          return;
        }
        if (pointInRect(pointer, primaryButton) && pointer.pressed) {
          this.activateCurrentSkin();
          return;
        }

        for (i = 0; i < this.skins.length; i += 1) {
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
        this.selectedIndex = (this.selectedIndex + this.skins.length - 1) % this.skins.length;
      }
      if (input.wasPressed("down")) {
        this.selectedIndex = (this.selectedIndex + 1) % this.skins.length;
      }
      if (input.wasPressed("confirm")) {
        this.activateCurrentSkin();
      }
    }

    draw(renderer) {
      var current = this.getCurrentSkin();
      var owned = this.isOwned(current);
      var equipped = this.isSelected(current);
      var primaryButton = this.getPrimaryButton();
      var backButton = this.getBackButton();
      var metrics = this.getListMetrics();
      var i;

      renderer.clear("#120c08");
      renderer.drawPanel(34, 28, 892, 664, {
        fill: "rgba(12, 8, 6, 0.96)",
        border: "#f6c453"
      });
      renderer.drawText(this.game.t("store.title"), 58, 42, {
        size: 42,
        color: "#f6c453",
        shadow: true
      });
      renderer.drawText(this.game.t("store.subtitle"), 58, 92, {
        size: 20,
        color: "#f4e0b6"
      });

      renderer.drawPanel(56, 138, 300, 518, {
        fill: "rgba(10, 10, 10, 0.88)",
        border: "#6a4b27"
      });

      for (i = 0; i < this.skins.length; i += 1) {
        var skin = this.skins[i];
        var rowRect = this.getRowRect(i);
        var rowY = rowRect.y;
        var selected = i === this.selectedIndex;
        var hovered = i === this.hoverIndex;
        var rowOwned = this.isOwned(skin);
        var rowEquipped = this.isSelected(skin);
        var compact = metrics.rowHeight < 58;
        renderer.drawPanel(rowRect.x, rowY, rowRect.width, rowRect.height, {
          fill: selected || hovered ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.22)",
          border: selected ? (skin.color || "#f6c453") : hovered ? "#fff1c4" : "#5f4423"
        });
        renderer.drawPixelSprite({
          x: rowRect.x + 12,
          y: rowY + Math.max(2, (rowRect.height - metrics.spriteHeight) / 2),
          width: metrics.spriteWidth,
          height: metrics.spriteHeight
        }, "senpai", {
          variant: skin.id,
          moving: false,
          border: skin.color || "#ffffff"
        });
        renderer.drawText(skinText(this.game, skin, "name"), rowRect.x + 66, rowY + (compact ? 6 : 10), {
          size: compact ? 14 : 18,
          color: "#f4f0da"
        });
        renderer.drawText(
          rowEquipped
            ? this.game.t("buttons.selected")
            : rowOwned
              ? this.game.t("common.owned")
              : this.isScoreUnlock(skin)
                ? this.game.t("store.scoreGoal", {
                  score: (skin.scoreThreshold || 0).toLocaleString ? (skin.scoreThreshold || 0).toLocaleString() : (skin.scoreThreshold || 0)
                })
                : this.game.t("common.locked"),
          rowRect.x + rowRect.width - 20,
          rowY + (compact ? 8 : 14),
          {
            size: compact ? 11 : 14,
            align: "right",
            color: rowEquipped ? "#fff1c4" : rowOwned ? "#9cffb8" : this.isScoreUnlock(skin) ? "#7fe6ff" : "#ff9c4b"
          }
        );
        renderer.drawText(
          this.isScoreUnlock(skin)
            ? this.game.t("store.unlockAtScore", {
              score: (skin.scoreThreshold || 0).toLocaleString ? (skin.scoreThreshold || 0).toLocaleString() : (skin.scoreThreshold || 0)
            })
            : skin.premium ? this.game.t("common.premium") : this.game.t("common.free"),
          rowRect.x + 66,
          rowY + (compact ? 22 : 32),
          {
            size: compact ? 10 : 14,
            color: this.isScoreUnlock(skin) ? "#7fe6ff" : skin.premium ? "#ff91d7" : "#9cffb8"
          }
        );
      }

      renderer.drawPanel(382, 138, 516, 518, {
        fill: "rgba(18, 20, 28, 0.94)",
        border: (current && current.color) || "#d6d0ff"
      });
      if (current && current.auraColor) {
        renderer.ctx.save();
        renderer.ctx.strokeStyle = current.auraColor;
        renderer.ctx.globalAlpha = 0.22;
        renderer.ctx.lineWidth = 3;
        renderer.ctx.beginPath();
        renderer.ctx.arc(514, 334, 74 + Math.sin(this.previewTime * 4.8) * 4, 0, Math.PI * 2);
        renderer.ctx.stroke();
        renderer.ctx.globalAlpha = 0.12;
        renderer.ctx.beginPath();
        renderer.ctx.arc(514, 334, 90 + Math.cos(this.previewTime * 4) * 5, 0, Math.PI * 2);
        renderer.ctx.stroke();
        renderer.ctx.fillStyle = current.auraColor;
        renderer.ctx.globalAlpha = 0.3;
        renderer.ctx.fillRect(462, 250 + Math.sin(this.previewTime * 6) * 3, 5, 5);
        renderer.ctx.fillRect(560, 278 + Math.cos(this.previewTime * 5) * 3, 5, 5);
        renderer.ctx.restore();
      }
      renderer.drawPixelSprite({
        x: 420,
        y: 182,
        width: 188,
        height: 244
      }, "senpai", {
        variant: current ? current.id : "",
        moving: true,
        walkPhase: this.previewTime * 7,
        border: (current && current.color) || "#ffffff"
      });
      renderer.drawText(current ? skinText(this.game, current, "name") : "", 630, 182, {
        size: 34,
        color: (current && current.color) || "#f4f0da"
      });
      renderer.drawText(
        equipped
          ? this.game.t("buttons.selected")
          : owned
            ? this.game.t("common.owned")
            : this.game.t("common.locked"),
        854,
        194,
        {
          size: 18,
          align: "right",
          color: equipped ? "#fff1c4" : owned ? "#9cffb8" : "#ff9c4b"
        }
      );
      renderer.drawText(
        this.game.t("common.price") + "  " + formatPrice(this.game, current),
        630,
        230,
        {
          size: 18,
          color: "#f4e0b6"
        }
      );
      renderer.drawText(
        this.isScoreUnlock(current)
          ? this.game.t("store.unlockAtScore", {
            score: (current && current.scoreThreshold || 0).toLocaleString ? (current && current.scoreThreshold || 0).toLocaleString() : (current && current.scoreThreshold || 0)
          })
          : current && current.premium ? this.game.t("common.premium") : this.game.t("common.free"),
        630,
        260,
        {
          size: 18,
          color: this.isScoreUnlock(current) ? "#7fe6ff" : current && current.premium ? "#ff91d7" : "#9cffb8"
        }
      );
      renderer.drawParagraph(current ? skinText(this.game, current, "desc") : "", 630, 308, 228, {
        size: 20,
        lineHeight: 30,
        color: "#f4f0da"
      });
      renderer.drawParagraph(this.game.t("store.cosmeticOnly"), 420, 454, 438, {
        size: 18,
        lineHeight: 26,
        color: "#d8c8a4"
      });
      renderer.drawParagraph(
        owned ? this.game.t("store.hint") : this.isScoreUnlock(current) ? this.game.t("store.scoreLockedHint") : this.game.t("store.lockedHint"),
        420,
        528,
        438,
        {
          size: 18,
          lineHeight: 26,
          color: "#f4e0b6"
        }
      );

      if (this.notice) {
        renderer.drawParagraph(this.notice, 420, 492, 438, {
          size: 16,
          lineHeight: 22,
          color: this.noticeColor
        });
      }

      renderer.drawPanel(primaryButton.x, primaryButton.y, primaryButton.width, primaryButton.height, {
        fill: "rgba(8, 8, 8, 0.88)",
        border: current && current.color ? current.color : "#d6d0ff"
      });
      renderer.drawText(
        owned
          ? (equipped ? this.game.t("buttons.selected") : this.game.t("buttons.equip"))
          : this.isScoreUnlock(current)
            ? this.game.t("store.scoreGoal", {
              score: (current && current.scoreThreshold || 0).toLocaleString ? (current && current.scoreThreshold || 0).toLocaleString() : (current && current.scoreThreshold || 0)
            })
            : this.game.t("buttons.buy"),
        primaryButton.x + primaryButton.width / 2,
        primaryButton.y + 18,
        {
          size: this.isScoreUnlock(current) ? 22 : 28,
          align: "center",
          color: "#f4f0da"
        }
      );

      renderer.drawPanel(backButton.x, backButton.y, backButton.width, backButton.height, {
        fill: "rgba(8, 8, 8, 0.88)",
        border: "#d6d0ff"
      });
      renderer.drawText(this.game.t("buttons.back"), 835, 56, {
        size: 22,
        align: "center",
        color: "#d6d0ff"
      });

      if (this.purchaseTarget) {
        var dialogButtons = this.getDialogButtons();
        renderer.drawPanel(234, 214, 492, 356, {
          fill: "rgba(5, 5, 5, 0.96)",
          border: this.purchaseTarget.color || "#ff91d7"
        });
        renderer.drawCenteredText(this.game.t("store.purchasePrompt"), 246, {
          size: 32,
          color: this.purchaseTarget.color || "#ff91d7",
          shadow: true
        });
        renderer.drawCenteredText(skinText(this.game, this.purchaseTarget, "name"), 294, {
          size: 30,
          color: "#f4f0da"
        });
        renderer.drawCenteredText(formatPrice(this.game, this.purchaseTarget), 334, {
          size: 22,
          color: "#fff1c4"
        });
        renderer.drawParagraph(this.game.t("store.purchaseNote"), 270, 388, 420, {
          size: 18,
          lineHeight: 26,
          color: "#f4e0b6"
        });
        renderer.drawParagraph(this.game.t("store.confirmNote"), 270, 454, 420, {
          size: 18,
          lineHeight: 26,
          color: "#d8c8a4"
        });

        for (i = 0; i < dialogButtons.length; i += 1) {
          var isConfirm = i === 0;
          var hovered = i === this.dialogHover;
          renderer.drawPanel(dialogButtons[i].x, dialogButtons[i].y, dialogButtons[i].width, dialogButtons[i].height, {
            fill: hovered ? "rgba(255,255,255,0.08)" : "rgba(8, 8, 8, 0.88)",
            border: isConfirm ? (this.purchaseTarget.color || "#ff91d7") : "#d6d0ff"
          });
          renderer.drawText(isConfirm ? this.game.t("buttons.buy") : this.game.t("buttons.cancel"), dialogButtons[i].x + dialogButtons[i].width / 2, dialogButtons[i].y + 14, {
            size: 24,
            align: "center",
            color: "#f4f0da"
          });
        }
      }
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
