(function (ns) {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  ns.Game = class {
    constructor(canvas) {
      this.canvas = canvas;
      this.renderer = new ns.Renderer(canvas);
      this.input = new ns.InputManager(canvas);
      this.audio = new ns.AudioSystem();
      this.state = ns.SaveSystem.load();
      this.sceneManager = new ns.SceneManager(this);
      this.lastTimestamp = 0;
      this.runtimeError = null;
    }

    getLocale() {
      return ns.Localizer ? ns.Localizer.resolveLocale(this.state.locale) : "en";
    }

    setLocale(locale) {
      this.state.locale = ns.Localizer ? ns.Localizer.resolveLocale(locale) : "en";
      document.documentElement.lang = this.getLocale();
      this.saveState();
    }

    toggleLocale() {
      this.setLocale(this.getLocale() === "ja" ? "en" : "ja");
    }

    t(key, vars) {
      if (!ns.Localizer) {
        return key;
      }
      return ns.Localizer.t(this.getLocale(), key, vars);
    }

    stageName(stageId) {
      return this.t("stages." + stageId);
    }

    phaseName(phaseId) {
      return this.t("phases." + phaseId);
    }

    modeName(modeId) {
      return this.t("modes." + this.resolveSurvivorMode(modeId));
    }

    enemyName(enemyId) {
      return this.t("enemies." + enemyId);
    }

    upgradeName(upgradeId) {
      return this.t("upgrades." + upgradeId + ".name");
    }

    upgradeDescription(upgradeId, vars) {
      return this.t("upgrades." + upgradeId + ".desc", vars);
    }

    pickupName(pickupId) {
      return this.t("pickups." + pickupId);
    }

    getSurvivorMeta() {
      return ns.survivorMeta || {};
    }

    getCommerceConfig() {
      return ns.commerceConfig || {};
    }

    getSurvivorSkins() {
      return (ns.survivorSkins || []).slice();
    }

    getSurvivorModes() {
      return [
        { id: "normal" },
        { id: "infinity" }
      ];
    }

    resolveSurvivorMode(modeId) {
      return modeId === "infinity" ? "infinity" : "normal";
    }

    getSurvivorSkin(id) {
      var skins = this.getSurvivorSkins();
      var i;
      for (i = 0; i < skins.length; i += 1) {
        if (skins[i].id === id) {
          return skins[i];
        }
      }
      return skins[0] || null;
    }

    getOwnedSkins() {
      var survivorState = this.state.survivor || {};
      var owned = Array.isArray(survivorState.ownedSkins) ? survivorState.ownedSkins.slice() : [];
      var skins = this.getSurvivorSkins();
      var i;

      for (i = 0; i < skins.length; i += 1) {
        if (!skins[i].premium && owned.indexOf(skins[i].id) < 0) {
          owned.push(skins[i].id);
        }
      }

      return owned;
    }

    ownsSkin(id) {
      var skin = this.getSurvivorSkin(id);
      if (!skin) {
        return false;
      }
      if (!skin.premium) {
        return true;
      }
      return this.getOwnedSkins().indexOf(skin.id) >= 0;
    }

    unlockSkin(id) {
      var survivorState = this.state.survivor || {};
      var skin = this.getSurvivorSkin(id);
      if (!skin) {
        return false;
      }
      if (!Array.isArray(survivorState.ownedSkins)) {
        survivorState.ownedSkins = [];
      }
      if (survivorState.ownedSkins.indexOf(skin.id) >= 0 || !skin.premium) {
        if (!skin.premium && survivorState.ownedSkins.indexOf(skin.id) < 0) {
          survivorState.ownedSkins.push(skin.id);
          this.state.survivor = survivorState;
          this.saveState();
        }
        return true;
      }
      survivorState.ownedSkins.push(skin.id);
      this.state.survivor = survivorState;
      this.saveState();
      return true;
    }

    getSelectedSurvivorSkinId() {
      var survivorState = this.state.survivor || {};
      var selected = survivorState.selectedSkin;
      var resolved = this.getSurvivorSkin(selected);
      if (resolved && this.ownsSkin(resolved.id)) {
        return resolved.id;
      }
      var owned = this.getOwnedSkins();
      return owned[0] || (resolved ? resolved.id : "classicSenpai");
    }

    getSelectedSurvivorSkin() {
      return this.getSurvivorSkin(this.getSelectedSurvivorSkinId());
    }

    isScoreUnlockSkin(skin) {
      return !!(skin && skin.unlockType === "score");
    }

    canPurchaseSkin(skin) {
      return !!(skin && skin.premium && !this.isScoreUnlockSkin(skin));
    }

    getSkinCheckoutUrl(skinOrId) {
      var skin = typeof skinOrId === "string" ? this.getSurvivorSkin(skinOrId) : skinOrId;
      var commerce = this.getCommerceConfig();
      var links = commerce.stripePaymentLinks || {};
      var url = skin ? links[skin.id] : "";
      return typeof url === "string" ? url.trim() : "";
    }

    openSkinCheckout(skinOrId) {
      var url = this.getSkinCheckoutUrl(skinOrId);
      if (!url || !/^https:\/\/buy\.stripe\.com\//.test(url)) {
        return false;
      }
      window.open(url, "_blank", "noopener,noreferrer");
      return true;
    }

    setSelectedSurvivorSkin(id) {
      var survivorState = this.state.survivor || {};
      var resolved = this.getSurvivorSkin(id);
      if (!resolved || !this.ownsSkin(resolved.id)) {
        return false;
      }
      survivorState.selectedSkin = resolved.id;
      this.state.survivor = survivorState;
      this.saveState();
      return true;
    }

    getNextScoreSkinUnlock(score) {
      var skins = this.getSurvivorSkins()
        .filter((skin) => this.isScoreUnlockSkin(skin) && !this.ownsSkin(skin.id))
        .sort(function (a, b) {
          return (a.scoreThreshold || 0) - (b.scoreThreshold || 0);
        });
      var i;
      var safeScore = Math.max(0, Math.floor(score || 0));
      for (i = 0; i < skins.length; i += 1) {
        if ((skins[i].scoreThreshold || 0) > safeScore) {
          return skins[i];
        }
      }
      return skins[0] || null;
    }

    unlockScoreSkins(score) {
      var skins = this.getSurvivorSkins();
      var unlocked = [];
      var safeScore = Math.max(0, Math.floor(score || 0));
      var i;

      for (i = 0; i < skins.length; i += 1) {
        var skin = skins[i];
        if (!this.isScoreUnlockSkin(skin)) {
          continue;
        }
        if (safeScore < (skin.scoreThreshold || 0) || this.ownsSkin(skin.id)) {
          continue;
        }
        if (this.unlockSkin(skin.id)) {
          unlocked.push(skin);
        }
      }

      return unlocked;
    }

    getSpecialItemCatalog() {
      return (this.getSurvivorMeta().specialItems || []).slice();
    }

    getFusionRecipes() {
      return (this.getSurvivorMeta().fusionRecipes || []).slice();
    }

    getTrueFusionRecipes() {
      return (this.getSurvivorMeta().trueFusionRecipes || []).slice();
    }

    getMerchantOffers() {
      return (this.getSurvivorMeta().merchantOffers || []).slice();
    }

    getDiscoveredSpecialItems() {
      var survivorState = this.state.survivor || {};
      return Array.isArray(survivorState.discoveredSpecialItems) ? survivorState.discoveredSpecialItems.slice() : [];
    }

    getDiscoveredRecipes() {
      var survivorState = this.state.survivor || {};
      return Array.isArray(survivorState.discoveredRecipes) ? survivorState.discoveredRecipes.slice() : [];
    }

    rememberSpecialItem(itemId) {
      var survivorState = this.state.survivor || {};
      if (!itemId) {
        return false;
      }
      if (!Array.isArray(survivorState.discoveredSpecialItems)) {
        survivorState.discoveredSpecialItems = [];
      }
      if (survivorState.discoveredSpecialItems.indexOf(itemId) >= 0) {
        return false;
      }
      survivorState.discoveredSpecialItems.push(itemId);
      this.state.survivor = survivorState;
      this.saveState();
      return true;
    }

    rememberRecipe(recipeId) {
      var survivorState = this.state.survivor || {};
      if (!recipeId) {
        return false;
      }
      if (!Array.isArray(survivorState.discoveredRecipes)) {
        survivorState.discoveredRecipes = [];
      }
      if (survivorState.discoveredRecipes.indexOf(recipeId) >= 0) {
        return false;
      }
      survivorState.discoveredRecipes.push(recipeId);
      this.state.survivor = survivorState;
      this.saveState();
      return true;
    }

    getUnlockedRank() {
      var survivorState = this.state.survivor || {};
      return clamp(typeof survivorState.unlockedRank === "number" ? survivorState.unlockedRank : 0, 0, 15);
    }

    getLaunchOptions() {
      var params = new window.URLSearchParams(window.location.search);
      var survivorState = this.state.survivor || {};
      var rawRank = parseInt(params.get("rank") || "", 10);
      return {
        stageId: params.get("stage") || survivorState.lastStageId || "stationFront",
        hazardRank: clamp(
          Number.isFinite(rawRank) ? rawRank : (survivorState.lastRank || 0),
          0,
          this.getUnlockedRank()
        ),
        mode: this.resolveSurvivorMode(params.get("mode") || survivorState.lastMode || "normal")
      };
    }

    start() {
      document.documentElement.lang = this.getLocale();
      this.sceneManager.change(new ns.TitleScene(this, this.getLaunchOptions()));
      window.requestAnimationFrame((timestamp) => this.loop(timestamp));
    }

    loop(timestamp) {
      var dt = this.lastTimestamp ? (timestamp - this.lastTimestamp) / 1000 : 1 / ns.constants.TARGET_FPS;
      dt = Math.min(dt, 0.05);
      this.lastTimestamp = timestamp;

      try {
        if (this.input.wasPressed("confirm") || this.input.wasPressed("menu") || this.input.wasPointerPressed()) {
          this.audio.unlock();
        }

        this.state.totalPlayTime += dt;
        this.audio.update(dt);
        this.sceneManager.update(dt, this.input);
        this.sceneManager.draw(this.renderer);
        this.runtimeError = null;
      } catch (error) {
        this.runtimeError = error;
        console.error(error);
        this.renderer.clear("#120c08");
        this.renderer.drawPanel(70, 120, 820, 420, {
          fill: "rgba(12, 8, 6, 0.96)",
          border: "#ff8a70"
        });
        this.renderer.drawText("RUNTIME ERROR", 104, 152, {
          size: 36,
          color: "#ff8a70",
          shadow: true
        });
        this.renderer.drawParagraph(String(error && error.message ? error.message : error), 104, 214, 752, {
          size: 22,
          lineHeight: 30,
          color: "#f4f0da"
        });
        this.renderer.drawParagraph("Reload the page with Ctrl + F5. If this keeps happening, send this screen.", 104, 360, 752, {
          size: 18,
          lineHeight: 26,
          color: "#d8c8a4"
        });
      }

      this.input.clearFrameState();
      window.requestAnimationFrame((next) => this.loop(next));
    }

    saveState() {
      ns.SaveSystem.save(this.state);
    }

    openTitle(options) {
      this.saveState();
      this.sceneManager.change(new ns.TitleScene(this, options || this.getLaunchOptions()));
    }

    openCodex(options) {
      this.saveState();
      this.sceneManager.change(new ns.CodexScene(this, options || this.getLaunchOptions()));
    }

    openRecipes(options) {
      this.saveState();
      this.sceneManager.change(new ns.RecipeScene(this, options || this.getLaunchOptions()));
    }

    openStore(options) {
      this.saveState();
      this.sceneManager.change(new ns.StoreScene(this, options || this.getLaunchOptions()));
    }

    startSurvivor(options) {
      var opts = options || {};
      var survivorState = this.state.survivor || {};
      var unlockedRank = this.getUnlockedRank();
      survivorState.lastStageId = opts.stageId || survivorState.lastStageId || "stationFront";
      survivorState.lastRank = typeof opts.hazardRank === "number"
        ? clamp(opts.hazardRank, 0, unlockedRank)
        : clamp(survivorState.lastRank || 0, 0, unlockedRank);
      survivorState.lastMode = this.resolveSurvivorMode(opts.mode || survivorState.lastMode || "normal");
      this.state.survivor = survivorState;
      this.saveState();
      this.sceneManager.change(new ns.SurvivorScene(this, {
        stageId: survivorState.lastStageId,
        hazardRank: survivorState.lastRank,
        mode: survivorState.lastMode
      }));
    }

    restartSurvivor() {
      var survivorState = this.state.survivor || {};
      this.startSurvivor({
        stageId: survivorState.lastStageId || "stationFront",
        hazardRank: typeof survivorState.lastRank === "number" ? survivorState.lastRank : 0,
        mode: this.resolveSurvivorMode(survivorState.lastMode || "normal")
      });
    }

    resetSaveData() {
      ns.SaveSystem.clear();
      this.state = ns.createDefaultState();
      this.saveState();
      this.restartSurvivor();
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
