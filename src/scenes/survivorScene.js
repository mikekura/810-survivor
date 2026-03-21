(function (ns) {
  var RUN_LENGTH_SEC = 20 * 60;
  var VIEW_MARGIN = 160;
  var DESPAWN_DISTANCE = 1700;
  var LEVELUP_CARD_WIDTH = 430;
  var LEVELUP_CARD_HEIGHT = 116;

  var STAGE_THEMES = {
    stationFront: { label: "Station Front", bg: "#1b120d", tileA: "#2a1a13", tileB: "#352116", accent: "#ffb347", lane: "#6f4731", prop: "#84523c", glow: "#ffe2a8" },
    shoppingStreet: { label: "Shopping Street", bg: "#20120b", tileA: "#301b12", tileB: "#3f2417", accent: "#ff9c4b", lane: "#7d4428", prop: "#9a6142", glow: "#ffddb0" },
    poolSide: { label: "Pool Side", bg: "#102734", tileA: "#17374b", tileB: "#1c435b", accent: "#7fe6ff", lane: "#5fc0e0", prop: "#2a6179", glow: "#dffbff" },
    festivalGround: { label: "Festival Ground", bg: "#25111f", tileA: "#39162e", tileB: "#441c38", accent: "#ff91d7", lane: "#7d4164", prop: "#9f5a7b", glow: "#ffe0f2" },
    clockTower: { label: "Clock Tower", bg: "#1b1826", tileA: "#292537", tileB: "#322c45", accent: "#d6d0ff", lane: "#665c8c", prop: "#71668f", glow: "#f0ecff" }
  };

  var UPGRADE_CATALOG = {
    powerShirt: { color: "#ff9c4b", maxLevel: 5, weight: 10 },
    coldMugicha: { color: "#74d6ff", maxLevel: 5, weight: 9 },
    quickStep: { color: "#ffd76f", maxLevel: 5, weight: 8 },
    pickupAura: { color: "#b0ff8f", maxLevel: 5, weight: 7 },
    thickNeck: { color: "#ff8f8f", maxLevel: 4, weight: 7 },
    ramuneOrbit: { color: "#8ff7ff", maxLevel: 5, weight: 6 },
    summerPulse: { color: "#f5adff", maxLevel: 5, weight: 6 },
    sunbeam810: { color: "#ffe07a", maxLevel: 5, weight: 5 },
    pierceSandal: { color: "#d7c6ff", maxLevel: 4, weight: 5 },
    yarimasuNee: { color: "#ffb86f", maxLevel: 4, weight: 5 },
    afterimageStep: { color: "#a1e0ff", maxLevel: 4, weight: 5 },
    saltGuard: { color: "#f7efe0", maxLevel: 4, weight: 5 },
    lucky810: { color: "#ffe9a1", maxLevel: 4, weight: 4 },
    droneBuddy: { color: "#9fd4ff", maxLevel: 4, weight: 5 },
    backstepVolley: { color: "#ffcf9d", maxLevel: 4, weight: 5 },
    heatSink: { color: "#ff9f76", maxLevel: 4, weight: 5 }
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function formatTime(totalSec) {
    var safeSec = Math.max(0, Math.floor(totalSec || 0));
    var minutes = Math.floor(safeSec / 60);
    var seconds = safeSec % 60;
    return minutes + ":" + String(seconds).padStart(2, "0");
  }

  function distanceSquared(a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    return dx * dx + dy * dy;
  }

  function normalize(dx, dy) {
    var length = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: dx / length, y: dy / length, length: length };
  }

  function pointDistance(x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function pointInRect(pointer, rect) {
    return (
      pointer.x >= rect.x &&
      pointer.y >= rect.y &&
      pointer.x <= rect.x + rect.width &&
      pointer.y <= rect.y + rect.height
    );
  }

  function hash2d(x, y) {
    var value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return value - Math.floor(value);
  }

  function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var lengthSq = dx * dx + dy * dy || 1;
    var t = clamp(((px - x1) * dx + (py - y1) * dy) / lengthSq, 0, 1);
    var cx = x1 + dx * t;
    var cy = y1 + dy * t;
    return pointDistance(px, py, cx, cy);
  }

  function pickWeighted(rng, entries) {
    var total = 0;
    var i;
    for (i = 0; i < entries.length; i += 1) {
      total += entries[i].weight;
    }
    if (!total) {
      return entries[0] || null;
    }
    var roll = rng.range(0, total);
    var cursor = 0;
    for (i = 0; i < entries.length; i += 1) {
      cursor += entries[i].weight;
      if (roll <= cursor) {
        return entries[i];
      }
    }
    return entries[entries.length - 1] || null;
  }

  function getStageTheme(stageId) {
    return STAGE_THEMES[stageId] || STAGE_THEMES.stationFront;
  }

  function translate(game, key, vars) {
    return game && game.t ? game.t(key, vars) : key;
  }

  function getUpgradeName(game, upgradeId) {
    return game && game.upgradeName ? game.upgradeName(upgradeId) : upgradeId;
  }

  function getUpgradeDescription(game, upgradeId, level) {
    switch (upgradeId) {
      case "powerShirt":
        return game.upgradeDescription(upgradeId, { amount: 8 + level * 2 });
      case "coldMugicha":
        return game.upgradeDescription(upgradeId, { amount: 6 + level * 2 });
      case "quickStep":
        return game.upgradeDescription(upgradeId, { amount: 16 + level * 4 });
      case "pickupAura":
        return game.upgradeDescription(upgradeId, { amount: 24 + level * 6 });
      case "thickNeck":
        return game.upgradeDescription(upgradeId, { hp: 14 + level * 4 });
      case "pierceSandal":
        return game.upgradeDescription(upgradeId, { amount: level });
      default:
        return game.upgradeDescription(upgradeId, {});
    }
  }

  function getMetaText(game, entry, key) {
    var locale = game && game.getLocale ? game.getLocale() : "en";
    var value = entry && entry[key];
    if (!value) {
      return "";
    }
    return value[locale] || value.en || value.ja || "";
  }

  function getSpecialItemCatalog() {
    return (ns.survivorMeta && ns.survivorMeta.specialItems) || [];
  }

  function getFusionRecipes() {
    return (ns.survivorMeta && ns.survivorMeta.fusionRecipes) || [];
  }

  function getMerchantCatalog() {
    return (ns.survivorMeta && ns.survivorMeta.merchantOffers) || [];
  }

  function findSpecialItemDef(itemId) {
    var items = getSpecialItemCatalog();
    var i;
    for (i = 0; i < items.length; i += 1) {
      if (items[i].id === itemId || items[i].pickupKind === itemId) {
        return items[i];
      }
    }
    return null;
  }

  function findFusionRecipeById(recipeId) {
    var recipes = getFusionRecipes();
    var i;
    for (i = 0; i < recipes.length; i += 1) {
      if (recipes[i].id === recipeId) {
        return recipes[i];
      }
    }
    return null;
  }

  function calculateUnlockedRank(bestTimeSec, bestLevel, currentUnlocked, clearedRank, clearedRun) {
    var unlocked = Math.max(
      currentUnlocked || 0,
      Math.floor((bestTimeSec || 0) / 75),
      Math.floor(Math.max(0, (bestLevel || 1) - 1) / 8)
    );
    if (clearedRun) {
      unlocked = Math.max(unlocked, (clearedRank || 0) + 1);
    }
    return clamp(unlocked, 0, 15);
  }

  function drawUpgradeIcon(ctx, upgradeId, x, y, size, accent) {
    var inner = size - 12;
    var left = x + 6;
    var top = y + 6;
    var centerX = left + inner / 2;
    var centerY = top + inner / 2;
    var color = accent || (UPGRADE_CATALOG[upgradeId] && UPGRADE_CATALOG[upgradeId].color) || "#f6c453";

    ctx.save();
    ctx.fillStyle = "rgba(10, 10, 10, 0.92)";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
    ctx.fillStyle = color;

    switch (upgradeId) {
      case "powerShirt":
        ctx.fillRect(left + inner * 0.18, top + inner * 0.18, inner * 0.64, inner * 0.54);
        ctx.fillRect(left + inner * 0.02, top + inner * 0.24, inner * 0.18, inner * 0.22);
        ctx.fillRect(left + inner * 0.8, top + inner * 0.24, inner * 0.18, inner * 0.22);
        break;
      case "coldMugicha":
        ctx.fillRect(left + inner * 0.32, top + inner * 0.12, inner * 0.36, inner * 0.62);
        ctx.fillRect(left + inner * 0.4, top + inner * 0.06, inner * 0.2, inner * 0.12);
        ctx.fillStyle = "#e6fbff";
        ctx.fillRect(left + inner * 0.38, top + inner * 0.2, inner * 0.08, inner * 0.42);
        break;
      case "quickStep":
        ctx.beginPath();
        ctx.moveTo(left + inner * 0.18, top + inner * 0.7);
        ctx.lineTo(left + inner * 0.5, top + inner * 0.22);
        ctx.lineTo(left + inner * 0.82, top + inner * 0.22);
        ctx.lineTo(left + inner * 0.54, top + inner * 0.76);
        ctx.closePath();
        ctx.fill();
        break;
      case "pickupAura":
        ctx.beginPath();
        ctx.arc(centerX, centerY, inner * 0.34, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerX, centerY, inner * 0.16, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "thickNeck":
        ctx.fillRect(left + inner * 0.36, top + inner * 0.14, inner * 0.28, inner * 0.22);
        ctx.beginPath();
        ctx.moveTo(left + inner * 0.2, top + inner * 0.34);
        ctx.lineTo(left + inner * 0.8, top + inner * 0.34);
        ctx.lineTo(left + inner * 0.68, top + inner * 0.82);
        ctx.lineTo(left + inner * 0.32, top + inner * 0.82);
        ctx.closePath();
        ctx.fill();
        break;
      case "ramuneOrbit":
        ctx.beginPath();
        ctx.arc(centerX, centerY, inner * 0.26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerX + inner * 0.28, centerY, inner * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX - inner * 0.24, centerY - inner * 0.08, inner * 0.08, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "summerPulse":
        ctx.beginPath();
        ctx.arc(centerX, centerY, inner * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX, centerY, inner * 0.24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerX, centerY, inner * 0.38, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case "sunbeam810":
        ctx.fillRect(left + inner * 0.18, top + inner * 0.42, inner * 0.64, inner * 0.12);
        ctx.beginPath();
        ctx.moveTo(left + inner * 0.74, top + inner * 0.26);
        ctx.lineTo(left + inner * 0.94, top + inner * 0.48);
        ctx.lineTo(left + inner * 0.74, top + inner * 0.7);
        ctx.closePath();
        ctx.fill();
        break;
      case "pierceSandal":
        ctx.beginPath();
        ctx.moveTo(left + inner * 0.2, top + inner * 0.76);
        ctx.lineTo(left + inner * 0.8, top + inner * 0.2);
        ctx.lineTo(left + inner * 0.66, top + inner * 0.84);
        ctx.closePath();
        ctx.fill();
        break;
      case "yarimasuNee":
        ctx.beginPath();
        ctx.moveTo(centerX, top + inner * 0.12);
        ctx.lineTo(centerX + inner * 0.12, centerY - inner * 0.1);
        ctx.lineTo(left + inner * 0.88, centerY);
        ctx.lineTo(centerX + inner * 0.16, centerY + inner * 0.1);
        ctx.lineTo(centerX, top + inner * 0.88);
        ctx.lineTo(centerX - inner * 0.16, centerY + inner * 0.1);
        ctx.lineTo(left + inner * 0.12, centerY);
        ctx.lineTo(centerX - inner * 0.12, centerY - inner * 0.1);
        ctx.closePath();
        ctx.fill();
        break;
      case "afterimageStep":
        ctx.fillRect(left + inner * 0.18, top + inner * 0.54, inner * 0.46, inner * 0.12);
        ctx.fillRect(left + inner * 0.28, top + inner * 0.34, inner * 0.36, inner * 0.1);
        ctx.fillRect(left + inner * 0.58, top + inner * 0.2, inner * 0.18, inner * 0.08);
        break;
      case "saltGuard":
        ctx.beginPath();
        ctx.moveTo(centerX, top + inner * 0.1);
        ctx.lineTo(left + inner * 0.86, top + inner * 0.26);
        ctx.lineTo(left + inner * 0.72, top + inner * 0.82);
        ctx.lineTo(centerX, top + inner * 0.94);
        ctx.lineTo(left + inner * 0.28, top + inner * 0.82);
        ctx.lineTo(left + inner * 0.14, top + inner * 0.26);
        ctx.closePath();
        ctx.fill();
        break;
      case "lucky810":
        ctx.fillRect(left + inner * 0.18, top + inner * 0.2, inner * 0.12, inner * 0.54);
        ctx.fillRect(left + inner * 0.48, top + inner * 0.2, inner * 0.12, inner * 0.54);
        ctx.fillRect(left + inner * 0.72, top + inner * 0.2, inner * 0.12, inner * 0.54);
        ctx.fillRect(left + inner * 0.18, top + inner * 0.2, inner * 0.24, inner * 0.1);
        ctx.fillRect(left + inner * 0.18, top + inner * 0.44, inner * 0.24, inner * 0.1);
        ctx.fillRect(left + inner * 0.72, top + inner * 0.2, inner * 0.12, inner * 0.1);
        ctx.fillRect(left + inner * 0.72, top + inner * 0.44, inner * 0.12, inner * 0.1);
        break;
      case "droneBuddy":
        ctx.fillRect(left + inner * 0.34, top + inner * 0.34, inner * 0.32, inner * 0.32);
        ctx.fillRect(left + inner * 0.18, top + inner * 0.4, inner * 0.12, inner * 0.12);
        ctx.fillRect(left + inner * 0.7, top + inner * 0.4, inner * 0.12, inner * 0.12);
        ctx.fillRect(left + inner * 0.44, top + inner * 0.18, inner * 0.12, inner * 0.12);
        break;
      case "backstepVolley":
        ctx.fillRect(left + inner * 0.2, top + inner * 0.44, inner * 0.6, inner * 0.12);
        ctx.beginPath();
        ctx.moveTo(left + inner * 0.18, top + inner * 0.34);
        ctx.lineTo(left + inner * 0.06, centerY);
        ctx.lineTo(left + inner * 0.18, top + inner * 0.66);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(left + inner * 0.82, top + inner * 0.34);
        ctx.lineTo(left + inner * 0.94, centerY);
        ctx.lineTo(left + inner * 0.82, top + inner * 0.66);
        ctx.closePath();
        ctx.fill();
        break;
      case "heatSink":
        ctx.fillRect(left + inner * 0.34, top + inner * 0.14, inner * 0.32, inner * 0.56);
        ctx.fillRect(left + inner * 0.24, top + inner * 0.24, inner * 0.08, inner * 0.36);
        ctx.fillRect(left + inner * 0.68, top + inner * 0.24, inner * 0.08, inner * 0.36);
        ctx.fillStyle = "#fff1c4";
        ctx.fillRect(left + inner * 0.42, top + inner * 0.24, inner * 0.16, inner * 0.24);
        break;
      default:
        ctx.fillRect(left + inner * 0.2, top + inner * 0.2, inner * 0.6, inner * 0.6);
        break;
    }

    ctx.restore();
  }

  ns.SurvivorScene = class {
    constructor(game, options) {
      var opts = options || {};
      var theme;

      this.game = game;
      this.stageId = opts.stageId || "stationFront";
      this.hazardRank = typeof opts.hazardRank === "number" ? opts.hazardRank : 8;
      this.stageTheme = getStageTheme(this.stageId);
      theme = this.stageTheme;
      this.isTouchUi = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
      this.elapsedSec = 0;
      this.paused = false;
      this.runEnded = false;
      this.endReason = "";
      this.pointerCapturedByUi = false;
      this.playerHitTimer = 0;
      this.lastPhaseId = "";
      this.messages = [];
      this.projectiles = [];
      this.enemyProjectiles = [];
      this.enemies = [];
      this.pickups = [];
      this.orbitRender = [];
      this.droneRender = [];
      this.beamFx = [];
      this.pendingLevelUps = 0;
      this.levelUpChoices = null;
      this.levelUpSelected = 0;
      this.levelUpHover = -1;
      this.upgradeLevels = {};
      this.acquiredUpgrades = [];
      this.camera = { x: 0, y: 0 };
      this.specialInventory = {};
      this.activeFusions = {};
      this.specialItemCatalog = getSpecialItemCatalog();
      this.fusionRecipes = getFusionRecipes();
      this.merchantCatalog = getMerchantCatalog();
      this.skinId = this.game.getSelectedSurvivorSkinId ? this.game.getSelectedSurvivorSkinId() : "poolMonitor";
      this.skinDef = this.game.getSelectedSurvivorSkin ? this.game.getSelectedSurvivorSkin() : null;
      this.merchant = {
        active: false,
        open: false,
        nextAtSec: 5 * 60,
        x: 0,
        y: 0,
        life: 0,
        offers: [],
        selected: 0,
        hover: -1
      };

      this.spawner = new ns.SurvivorSpawner({
        gameWidth: ns.constants.GAME_WIDTH,
        gameHeight: ns.constants.GAME_HEIGHT,
        seed: Date.now() % 1000000
      });
      this.effects = new ns.SurvivorEffects();
      this.plan = this.spawner.reset(this.stageId, this.hazardRank, {
        seed: Date.now() % 1000000
      });

      this.player = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 24,
        hp: 120,
        maxHp: 120,
        speed: 260,
        fireCooldown: 0.1,
        fireRate: 0.36,
        bulletSpeed: 680,
        damage: 32,
        level: 1,
        xp: 0,
        xpForNext: 12,
        coins: 0,
        pickupRange: 96,
        kills: 0,
        armor: 0,
        pierce: 0,
        shotCount: 1,
        orbitLevel: 0,
        pulseLevel: 0,
        beamLevel: 0,
        hypeLevel: 0,
        afterimageLevel: 0,
        shellLevel: 0,
        luckLevel: 0,
        droneLevel: 0,
        backstepLevel: 0,
        heatSinkLevel: 0,
        pulseCooldown: 1.2,
        beamCooldown: 2.0,
        droneCooldown: 0.45,
        afterimageCooldown: 0.2,
        xpGainMultiplier: 1,
        specialCooldownFactor: 1,
        frenzyTimer: 0,
        shieldTimer: 0,
        loveAuraTimer: 0,
        loveAuraPulse: 0.6,
        facingAngle: -Math.PI * 0.5
      };

      this.refreshBuildStats(false);
      this.updateCamera(1);
      this.game.audio.playTrack("survivor");
      this.pushMessage(translate(this.game, "survivor.title"), 1.3, theme.accent);
      this.pushMessage(translate(this.game, "survivor.ready"), 1.8, "#f4f0da");
    }

    pushMessage(text, life, color) {
      this.messages.push({
        text: text,
        life: life || 1,
        maxLife: life || 1,
        color: color || "#f4f0da"
      });
    }

    getActionButtons() {
      var buttons = [
        { action: "language", label: this.game.getLocale().toUpperCase(), x: ns.constants.GAME_WIDTH - 418, y: 18, width: 88, height: 42, border: "#ffe07a" },
        { action: "title", label: translate(this.game, "buttons.title"), x: ns.constants.GAME_WIDTH - 316, y: 18, width: 88, height: 42, border: "#d6d0ff" },
        { action: "restart", label: translate(this.game, "buttons.retry"), x: ns.constants.GAME_WIDTH - 214, y: 18, width: 88, height: 42, border: "#ff8a70" },
        { action: "pause", label: this.paused ? translate(this.game, "buttons.go") : translate(this.game, "buttons.pause"), x: ns.constants.GAME_WIDTH - 112, y: 18, width: 88, height: 42, border: "#7fe6ff" }
      ];
      if (this.merchant.active && !this.merchant.open && !this.runEnded) {
        buttons.unshift({
          action: "shop",
          label: "SHOP",
          x: ns.constants.GAME_WIDTH - 520,
          y: 18,
          width: 88,
          height: 42,
          border: "#ff91d7"
        });
      }
      return buttons;
    }

    getUpgradeLevel(upgradeId) {
      return this.upgradeLevels[upgradeId] || 0;
    }

    awardCoins(amount, x, y) {
      var gained = Math.max(0, Math.round(amount || 0));
      if (gained <= 0) {
        return 0;
      }
      this.player.coins += gained;
      this.effects.spawnFloatingText("+" + gained + " " + translate(this.game, "common.coins"), x, y, {
        color: "#f6c453",
        size: 15,
        life: 0.5
      });
      return gained;
    }

    rememberSpecialItem(itemId) {
      if (this.game.rememberSpecialItem) {
        this.game.rememberSpecialItem(itemId);
      }
    }

    rememberRecipe(recipeId) {
      if (this.game.rememberRecipe) {
        this.game.rememberRecipe(recipeId);
      }
    }

    addSpecialInventory(itemId) {
      this.specialInventory[itemId] = (this.specialInventory[itemId] || 0) + 1;
    }

    removeSpecialInventory(itemId) {
      if (!this.specialInventory[itemId]) {
        return false;
      }
      this.specialInventory[itemId] -= 1;
      if (this.specialInventory[itemId] <= 0) {
        delete this.specialInventory[itemId];
      }
      return true;
    }

    getSpecialInventoryCount(itemId) {
      return this.specialInventory[itemId] || 0;
    }

    selectMerchantSpecial(forceFusion) {
      var i;
      var recipes = this.fusionRecipes;
      var possible = [];

      if (forceFusion) {
        for (i = 0; i < recipes.length; i += 1) {
          var recipe = recipes[i];
          var leftCount = this.getSpecialInventoryCount(recipe.ingredients[0]);
          var rightCount = this.getSpecialInventoryCount(recipe.ingredients[1]);
          if (leftCount > 0 && rightCount <= 0) {
            return recipe.ingredients[1];
          }
          if (rightCount > 0 && leftCount <= 0) {
            return recipe.ingredients[0];
          }
        }
      }

      for (i = 0; i < this.specialItemCatalog.length; i += 1) {
        possible.push(this.specialItemCatalog[i].pickupKind);
      }
      if (!possible.length) {
        return "item114514";
      }
      return possible[Math.floor(Math.random() * possible.length)];
    }

    buildMerchantOffers() {
      var catalog = this.merchantCatalog;
      var offers = [];
      var i;
      for (i = 0; i < catalog.length; i += 1) {
        offers.push({
          id: catalog[i].id,
          kind: catalog[i].kind,
          pickupKind: catalog[i].pickupKind || "",
          color: catalog[i].color,
          label: getMetaText(this.game, catalog[i], "label"),
          desc: getMetaText(this.game, catalog[i], "desc"),
          soldOut: false,
          cost: Math.max(8, Math.round(catalog[i].baseCost + this.hazardRank * 2 + Math.floor(this.elapsedSec / 300) * 4))
        });
      }
      return offers;
    }

    summonMerchant() {
      this.merchant.active = true;
      this.merchant.open = true;
      this.merchant.x = this.player.x + 180;
      this.merchant.y = this.player.y - 20;
      this.merchant.life = 26;
      this.merchant.offers = this.buildMerchantOffers();
      this.merchant.selected = 0;
      this.merchant.hover = -1;
      this.pointerCapturedByUi = true;
      this.effects.flashScreen("#ff91d7", 0.08, 0.14);
      this.effects.spawnRing(this.merchant.x, this.merchant.y, {
        color: "#ff91d7",
        radius: 18,
        growth: 86,
        lineWidth: 4,
        life: 0.24,
        fillAlpha: 0.08
      });
      this.pushMessage(translate(this.game, "survivor.merchantArrived"), 1.5, "#ff91d7");
    }

    closeMerchantShop() {
      this.merchant.open = false;
      this.merchant.hover = -1;
      this.pointerCapturedByUi = false;
    }

    openMerchantShop() {
      if (!this.merchant.active) {
        return;
      }
      this.merchant.open = true;
      this.merchant.selected = 0;
      this.merchant.hover = -1;
      this.pointerCapturedByUi = true;
      this.pushMessage(translate(this.game, "survivor.merchantOpen"), 1, "#ff91d7");
    }

    applyFusionResult(recipeId) {
      var recipe = findFusionRecipeById(recipeId);
      if (!recipe || this.activeFusions[recipeId]) {
        return;
      }
      this.activeFusions[recipeId] = true;
      this.rememberRecipe(recipeId);
      this.refreshBuildStats(true);
      this.effects.flashScreen(recipe.color || "#d6d0ff", 0.14, 0.2);
      this.effects.triggerShake(9, 0.24);
      this.effects.spawnBossWarning(getMetaText(this.game, recipe, "name"));
      this.pushMessage(getMetaText(this.game, recipe, "name"), 1.5, recipe.color || "#d6d0ff");

      if (recipeId === "burstVacation") {
        this.player.frenzyTimer = Math.max(this.player.frenzyTimer, 18);
        this.applyRandomUpgrades(1);
        this.fireBasicVolley();
        this.firePulseBurst();
      } else if (recipeId === "gentleWave") {
        this.healPlayer(this.player.maxHp);
        this.player.shieldTimer = Math.max(this.player.shieldTimer, 20);
        this.player.loveAuraTimer = Math.max(this.player.loveAuraTimer, 24);
        this.player.loveAuraPulse = 0.1;
      } else if (recipeId === "vacuumNova") {
        this.vacuumXpPickups();
        this.triggerIkuikuPulse();
        this.spawnRewardCrystals(10, 4);
      } else if (recipeId === "summerOverdrive") {
        this.player.frenzyTimer = Math.max(this.player.frenzyTimer, 20);
        this.firePulseBurst();
        this.fireSunbeam();
      }
    }

    tryFuseSpecialItems() {
      var i;
      for (i = 0; i < this.fusionRecipes.length; i += 1) {
        var recipe = this.fusionRecipes[i];
        if (this.activeFusions[recipe.id]) {
          continue;
        }
        if (this.getSpecialInventoryCount(recipe.ingredients[0]) > 0 && this.getSpecialInventoryCount(recipe.ingredients[1]) > 0) {
          this.removeSpecialInventory(recipe.ingredients[0]);
          this.removeSpecialInventory(recipe.ingredients[1]);
          this.applyFusionResult(recipe.id);
        }
      }
    }

    buyMerchantOffer(index) {
      var offer;
      var purchasedKind;
      var specialKind;
      if (!this.merchant.open || index < 0 || index >= this.merchant.offers.length) {
        return;
      }
      offer = this.merchant.offers[index];
      if (offer.soldOut) {
        return;
      }
      if (this.player.coins < offer.cost) {
        this.pushMessage(translate(this.game, "survivor.merchantFundsLow"), 1, "#ff8a70");
        return;
      }

      this.player.coins -= offer.cost;
      offer.soldOut = true;
      this.pushMessage(translate(this.game, "survivor.merchantBought") + " " + offer.label, 1.2, offer.color || "#f6c453");

      if (offer.kind === "pickup") {
        purchasedKind = offer.pickupKind;
      } else if (offer.kind === "special") {
        purchasedKind = this.selectMerchantSpecial(false);
      } else if (offer.kind === "fusion") {
        purchasedKind = this.selectMerchantSpecial(true);
      }

      if (purchasedKind) {
        specialKind = findSpecialItemDef(purchasedKind);
        this.applyPickupEffect({
          kind: purchasedKind,
          color: specialKind ? specialKind.color : offer.color,
          x: this.player.x,
          y: this.player.y,
          heal: purchasedKind === "heal" ? 35 : 0,
          rolls: purchasedKind === "chest" ? 1 : 0,
          value: 114
        });
      }
    }

    handleMerchantInput(input) {
      var pointer = input.getPointer();
      var panelX = 182;
      var panelY = 132;
      var i;
      var leaveButton = { x: 650, y: 566, width: 128, height: 46 };

      if (!this.merchant.open) {
        return;
      }

      this.merchant.hover = -1;

      if (pointer.inside) {
        if (pointInRect(pointer, leaveButton) && pointer.pressed) {
          this.closeMerchantShop();
          return;
        }
        for (i = 0; i < this.merchant.offers.length; i += 1) {
          var rect = { x: panelX + 244, y: panelY + 82 + i * 82, width: 498, height: 68 };
          if (pointInRect(pointer, rect)) {
            this.merchant.hover = i;
            this.merchant.selected = i;
            if (pointer.pressed) {
              this.buyMerchantOffer(i);
            }
            return;
          }
        }
      }

      if (input.wasPressed("cancel") || input.wasPressed("menu")) {
        this.closeMerchantShop();
        return;
      }
      if (input.wasPressed("up")) {
        this.merchant.selected = (this.merchant.selected + this.merchant.offers.length - 1) % this.merchant.offers.length;
      }
      if (input.wasPressed("down")) {
        this.merchant.selected = (this.merchant.selected + 1) % this.merchant.offers.length;
      }
      if (input.wasPressed("confirm")) {
        this.buyMerchantOffer(this.merchant.selected);
      }
    }

    updateMerchant(dt) {
      if (!this.runEnded && this.elapsedSec >= this.merchant.nextAtSec) {
        this.merchant.nextAtSec += 5 * 60;
        this.summonMerchant();
      }

      if (!this.merchant.active) {
        return;
      }

      if (!this.merchant.open) {
        this.merchant.life -= dt;
      }

      if (this.merchant.life <= 0) {
        this.merchant.active = false;
        this.merchant.open = false;
        this.merchant.offers = [];
      }
    }

    refreshBuildStats(healOnGrow) {
      var previousMax = this.player.maxHp || 120;
      var hpRatio = previousMax > 0 ? this.player.hp / previousMax : 1;
      var damageLevel = this.getUpgradeLevel("powerShirt");
      var speedLevel = this.getUpgradeLevel("quickStep");
      var fireLevel = this.getUpgradeLevel("coldMugicha");
      var magnetLevel = this.getUpgradeLevel("pickupAura");
      var neckLevel = this.getUpgradeLevel("thickNeck");
      var pierceLevel = this.getUpgradeLevel("pierceSandal");
      var orbitLevel = this.getUpgradeLevel("ramuneOrbit");
      var pulseLevel = this.getUpgradeLevel("summerPulse");
      var beamLevel = this.getUpgradeLevel("sunbeam810");
      var hypeLevel = this.getUpgradeLevel("yarimasuNee");
      var afterimageLevel = this.getUpgradeLevel("afterimageStep");
      var shellLevel = this.getUpgradeLevel("saltGuard");
      var luckLevel = this.getUpgradeLevel("lucky810");
      var droneLevel = this.getUpgradeLevel("droneBuddy");
      var backstepLevel = this.getUpgradeLevel("backstepVolley");
      var heatSinkLevel = this.getUpgradeLevel("heatSink");
      var fusionBurst = !!this.activeFusions.burstVacation;
      var fusionGentle = !!this.activeFusions.gentleWave;
      var fusionNova = !!this.activeFusions.vacuumNova;
      var fusionDrive = !!this.activeFusions.summerOverdrive;

      this.player.maxHp = 120 + neckLevel * 16 + (fusionGentle ? 30 : 0);
      this.player.speed = 260 + speedLevel * 20 + (fusionDrive ? 22 : 0);
      this.player.fireRate = Math.max(0.12, 0.36 - fireLevel * 0.03 - (fusionBurst ? 0.04 : 0));
      this.player.damage = 32 + damageLevel * 9 + heatSinkLevel * 2 + (fusionBurst ? 14 : 0) + (fusionDrive ? 10 : 0);
      this.player.pickupRange = 96 + magnetLevel * 26 + (fusionNova ? 60 : 0) + (fusionGentle ? 30 : 0);
      this.player.armor = neckLevel * 1.4 + shellLevel * 0.5 + (fusionGentle ? 2.5 : 0);
      this.player.pierce = pierceLevel + Math.floor(heatSinkLevel / 2);
      this.player.orbitLevel = orbitLevel;
      this.player.pulseLevel = pulseLevel;
      this.player.beamLevel = beamLevel;
      this.player.hypeLevel = hypeLevel;
      this.player.afterimageLevel = afterimageLevel;
      this.player.shellLevel = shellLevel;
      this.player.luckLevel = luckLevel;
      this.player.droneLevel = droneLevel;
      this.player.backstepLevel = backstepLevel;
      this.player.heatSinkLevel = heatSinkLevel;
      this.player.shotCount = 1 + Math.floor(hypeLevel / 2) + Math.floor(backstepLevel / 3);
      this.player.bulletSpeed = 680 + heatSinkLevel * 55 + (fusionDrive ? 120 : 0);
      this.player.xpGainMultiplier = 1 + luckLevel * 0.08 + (fusionBurst ? 0.12 : 0);
      this.player.specialCooldownFactor = Math.max(0.5, 1 - heatSinkLevel * 0.08 - (fusionNova ? 0.08 : 0) - (fusionDrive ? 0.12 : 0));

      if (healOnGrow) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 22);
      } else {
        this.player.hp = clamp(Math.round(this.player.maxHp * hpRatio), 1, this.player.maxHp);
      }
    }

    worldToScreen(x, y, shake) {
      var offset = shake || { x: 0, y: 0 };
      return { x: x - this.camera.x + offset.x, y: y - this.camera.y + offset.y };
    }

    getPlayerScreenPoint(shake) {
      return this.worldToScreen(this.player.x, this.player.y, shake);
    }

    getNearestEnemy() {
      if (!this.enemies.length) {
        return null;
      }
      var nearest = this.enemies[0];
      var nearestDistance = distanceSquared(this.player, nearest);
      var i;
      for (i = 1; i < this.enemies.length; i += 1) {
        var candidate = this.enemies[i];
        var candidateDistance = distanceSquared(this.player, candidate);
        if (candidateDistance < nearestDistance) {
          nearest = candidate;
          nearestDistance = candidateDistance;
        }
      }
      return nearest;
    }

    getViewRect() {
      return {
        x: this.camera.x - VIEW_MARGIN,
        y: this.camera.y - VIEW_MARGIN,
        width: ns.constants.GAME_WIDTH + VIEW_MARGIN * 2,
        height: ns.constants.GAME_HEIGHT + VIEW_MARGIN * 2
      };
    }

    updateCamera(dt) {
      var targetX = this.player.x - ns.constants.GAME_WIDTH / 2;
      var targetY = this.player.y - ns.constants.GAME_HEIGHT / 2;
      var follow = clamp(dt * 6, 0, 1);
      this.camera.x = lerp(this.camera.x, targetX, follow);
      this.camera.y = lerp(this.camera.y, targetY, follow);
    }

    getMoveVector(input) {
      var axis = input.getAxis();
      var pointer = input.getPointer();
      var playerScreen;
      var mouseDirection;
      var touchDirection;

      if (axis.x || axis.y) {
        return { x: axis.x, y: axis.y, intensity: 1 };
      }

      if (this.pointerCapturedByUi) {
        return { x: 0, y: 0, intensity: 0 };
      }

      playerScreen = this.getPlayerScreenPoint();

      if (pointer.type === "mouse" && pointer.inside) {
        mouseDirection = normalize(pointer.x - playerScreen.x, pointer.y - playerScreen.y);
        if (mouseDirection.length < 18) {
          return { x: 0, y: 0, intensity: 0 };
        }
        return {
          x: mouseDirection.x,
          y: mouseDirection.y,
          intensity: clamp((mouseDirection.length - 18) / 180, 0, 1)
        };
      }

      if (pointer.down && (pointer.type === "touch" || pointer.type === "pen")) {
        touchDirection = normalize(pointer.deltaX, pointer.deltaY);
        if (touchDirection.length < 8) {
          return { x: 0, y: 0, intensity: 0 };
        }
        return {
          x: touchDirection.x,
          y: touchDirection.y,
          intensity: clamp(touchDirection.length / 72, 0, 1)
        };
      }

      return { x: 0, y: 0, intensity: 0 };
    }

    createPlayerShot(direction, options) {
      var opts = options || {};
      this.projectiles.push({
        x: typeof opts.originX === "number" ? opts.originX : this.player.x,
        y: typeof opts.originY === "number" ? opts.originY : this.player.y,
        vx: direction.x * (opts.speed || this.player.bulletSpeed),
        vy: direction.y * (opts.speed || this.player.bulletSpeed),
        radius: opts.radius || 6,
        life: opts.life || 1.3,
        damage: opts.damage || this.player.damage,
        color: opts.color || "#7fe6ff",
        pierce: typeof opts.pierce === "number" ? opts.pierce : this.player.pierce,
        kind: opts.kind || "bullet"
      });
    }

    createEnemyShot(enemy, direction, options) {
      var opts = options || {};
      this.enemyProjectiles.push({
        x: enemy.x,
        y: enemy.y,
        vx: direction.x * (opts.speed || 220),
        vy: direction.y * (opts.speed || 220),
        radius: opts.radius || 7,
        life: opts.life || 3.4,
        damage: opts.damage || enemy.damage,
        color: opts.color || "#ffad7d",
        kind: opts.kind || "shot",
        age: 0,
        trailRate: typeof opts.trailRate === "number" ? opts.trailRate : 0,
        trailTimer: typeof opts.trailRate === "number" ? opts.trailRate : 0,
        spin: typeof opts.spin === "number" ? opts.spin : 0
      });
    }

    spawnEnemyShotTrail(shot) {
      switch (shot.kind) {
        case "bomb":
          this.effects.spawnParticleBurst(shot.x, shot.y, {
            count: 2,
            color: "#ffcf80",
            speedMin: 8,
            speedMax: 26,
            life: 0.14,
            sizeStart: 2,
            sizeEnd: 1,
            shape: "diamond"
          });
          break;
        case "speaker":
          this.effects.spawnRing(shot.x, shot.y, {
            color: "#ffd98d",
            radius: 4,
            growth: 18,
            lineWidth: 1,
            life: 0.12
          });
          break;
        case "mine":
          this.effects.spawnParticleBurst(shot.x, shot.y, {
            count: 2,
            color: "#ffb347",
            speedMin: 10,
            speedMax: 34,
            life: 0.16,
            sizeStart: 3,
            sizeEnd: 1,
            shape: "circle"
          });
          break;
        case "idol":
          this.effects.spawnParticleBurst(shot.x, shot.y, {
            count: 2,
            color: "#ff9f59",
            speedMin: 12,
            speedMax: 30,
            life: 0.14,
            sizeStart: 3,
            sizeEnd: 1,
            shape: "diamond"
          });
          break;
        case "idol-core":
          this.effects.spawnRing(shot.x, shot.y, {
            color: "#fff1c4",
            radius: 5,
            growth: 22,
            lineWidth: 2,
            life: 0.14
          });
          break;
        case "chlorine":
          this.effects.spawnRing(shot.x, shot.y, {
            color: "#bdf6ff",
            radius: 4,
            growth: 14,
            lineWidth: 1,
            life: 0.12,
            fillAlpha: 0.05
          });
          break;
        case "burst":
          this.effects.spawnParticleBurst(shot.x, shot.y, {
            count: 1,
            color: "#d5a2ff",
            speedMin: 6,
            speedMax: 18,
            life: 0.12,
            sizeStart: 3,
            sizeEnd: 1,
            shape: "diamond"
          });
          break;
        default:
          break;
      }
    }

    drawEnemyProjectile(ctx, shot, screenX, screenY) {
      var rotation = (shot.age || 0) * ((shot.spin || 0) || 4);

      ctx.save();
      ctx.translate(screenX, screenY);

      switch (shot.kind) {
        case "bomb":
          ctx.rotate(rotation + Math.PI * 0.25);
          ctx.fillStyle = shot.color;
          ctx.fillRect(-shot.radius, -shot.radius, shot.radius * 2, shot.radius * 2);
          ctx.strokeStyle = "#fff1c4";
          ctx.lineWidth = 2;
          ctx.strokeRect(-shot.radius - 1, -shot.radius - 1, shot.radius * 2 + 2, shot.radius * 2 + 2);
          break;
        case "speaker":
          ctx.fillStyle = shot.color;
          ctx.beginPath();
          ctx.arc(0, 0, shot.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#fff1c4";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, shot.radius + 3, -0.7, 0.7);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, shot.radius + 6, -0.65, 0.65);
          ctx.stroke();
          break;
        case "mine":
          ctx.rotate(rotation);
          ctx.fillStyle = shot.color;
          ctx.beginPath();
          ctx.moveTo(0, -shot.radius - 3);
          ctx.lineTo(shot.radius * 0.52, -shot.radius * 0.22);
          ctx.lineTo(shot.radius + 3, 0);
          ctx.lineTo(shot.radius * 0.52, shot.radius * 0.22);
          ctx.lineTo(0, shot.radius + 3);
          ctx.lineTo(-shot.radius * 0.52, shot.radius * 0.22);
          ctx.lineTo(-shot.radius - 3, 0);
          ctx.lineTo(-shot.radius * 0.52, -shot.radius * 0.22);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#fff1c4";
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(2, shot.radius * 0.32), 0, Math.PI * 2);
          ctx.fill();
          break;
        case "idol":
          ctx.rotate(rotation);
          ctx.fillStyle = shot.color;
          ctx.beginPath();
          ctx.moveTo(0, -shot.radius - 2);
          ctx.lineTo(shot.radius + 1, 0);
          ctx.lineTo(0, shot.radius + 2);
          ctx.lineTo(-shot.radius - 1, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#ffd7a1";
          ctx.lineWidth = 2;
          ctx.stroke();
          break;
        case "idol-core":
          ctx.fillStyle = "#fff1c4";
          ctx.beginPath();
          ctx.arc(0, 0, shot.radius + 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ff9f59";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, shot.radius + 4, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case "chlorine":
          ctx.fillStyle = shot.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, shot.radius * 0.9, shot.radius * 1.2, rotation * 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#e6fbff";
          ctx.beginPath();
          ctx.arc(-shot.radius * 0.18, -shot.radius * 0.22, Math.max(2, shot.radius * 0.22), 0, Math.PI * 2);
          ctx.fill();
          break;
        case "burst":
          ctx.rotate(rotation + Math.PI * 0.25);
          ctx.fillStyle = shot.color;
          ctx.fillRect(-shot.radius, -shot.radius, shot.radius * 2, shot.radius * 2);
          ctx.fillStyle = "#f1e2ff";
          ctx.fillRect(-shot.radius * 0.35, -shot.radius * 0.35, shot.radius * 0.7, shot.radius * 0.7);
          break;
        default:
          ctx.fillStyle = shot.color;
          ctx.beginPath();
          ctx.arc(0, 0, shot.radius, 0, Math.PI * 2);
          ctx.fill();
          break;
      }

      ctx.restore();
    }

    drawPickupSprite(ctx, pickup, screenX, screenY) {
      var rotation = this.elapsedSec * 2.4;
      ctx.save();
      ctx.translate(screenX, screenY);

      if (pickup.kind === "xp") {
        ctx.rotate(Math.PI * 0.25 + rotation * 0.2);
        ctx.fillStyle = pickup.color;
        ctx.fillRect(-pickup.radius, -pickup.radius, pickup.radius * 2, pickup.radius * 2);
      } else if (pickup.kind === "heal") {
        ctx.fillStyle = "#9cffb8";
        ctx.fillRect(-pickup.radius + 2, -3, (pickup.radius - 2) * 2, 6);
        ctx.fillRect(-3, -pickup.radius + 2, 6, (pickup.radius - 2) * 2);
        ctx.strokeStyle = "#eaffef";
        ctx.lineWidth = 2;
        ctx.strokeRect(-pickup.radius, -pickup.radius, pickup.radius * 2, pickup.radius * 2);
      } else if (pickup.kind === "magnet") {
        ctx.strokeStyle = "#7fe6ff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, pickup.radius - 2, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
        ctx.fillStyle = "#dffbff";
        ctx.fillRect(-pickup.radius + 1, pickup.radius - 5, 5, 8);
        ctx.fillRect(pickup.radius - 6, pickup.radius - 5, 5, 8);
      } else if (pickup.kind === "chest") {
        ctx.fillStyle = "#8c562c";
        ctx.fillRect(-pickup.radius, -pickup.radius * 0.7, pickup.radius * 2, pickup.radius * 1.4);
        ctx.fillStyle = "#f6c453";
        ctx.fillRect(-pickup.radius, -pickup.radius * 0.1, pickup.radius * 2, 4);
        ctx.fillRect(-2, -pickup.radius * 0.7, 4, pickup.radius * 1.4);
      } else if (pickup.kind === "item114514") {
        ctx.fillStyle = "#ffe07a";
        ctx.beginPath();
        ctx.arc(0, 0, pickup.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#533300";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("114", 0, 1);
      } else if (pickup.kind === "yarimasuItem") {
        ctx.fillStyle = "#ffb86f";
        ctx.beginPath();
        ctx.moveTo(0, -pickup.radius);
        ctx.lineTo(pickup.radius * 0.36, -pickup.radius * 0.2);
        ctx.lineTo(pickup.radius, 0);
        ctx.lineTo(pickup.radius * 0.36, pickup.radius * 0.2);
        ctx.lineTo(0, pickup.radius);
        ctx.lineTo(-pickup.radius * 0.36, pickup.radius * 0.2);
        ctx.lineTo(-pickup.radius, 0);
        ctx.lineTo(-pickup.radius * 0.36, -pickup.radius * 0.2);
        ctx.closePath();
        ctx.fill();
      } else if (pickup.kind === "iizoItem") {
        ctx.fillStyle = "#9cffb8";
        ctx.beginPath();
        ctx.arc(0, 0, pickup.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1a4d24";
        ctx.beginPath();
        ctx.arc(-3, -2, 1.6, 0, Math.PI * 2);
        ctx.arc(3, -2, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#1a4d24";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 2, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();
      } else if (pickup.kind === "ikuikuItem") {
        ctx.fillStyle = "#ff91d7";
        ctx.beginPath();
        ctx.moveTo(-pickup.radius, 0);
        ctx.lineTo(0, -pickup.radius);
        ctx.lineTo(pickup.radius, 0);
        ctx.lineTo(0, pickup.radius);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#fff1c4";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (pickup.kind === "loveItem") {
        ctx.fillStyle = "#ff7fb3";
        ctx.beginPath();
        ctx.moveTo(0, pickup.radius);
        ctx.bezierCurveTo(pickup.radius, pickup.radius * 0.4, pickup.radius, -pickup.radius * 0.5, 0, -pickup.radius * 0.12);
        ctx.bezierCurveTo(-pickup.radius, -pickup.radius * 0.5, -pickup.radius, pickup.radius * 0.4, 0, pickup.radius);
        ctx.fill();
      } else {
        ctx.fillStyle = pickup.color;
        ctx.beginPath();
        ctx.arc(0, 0, pickup.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    fireAfterimageBurst() {
      var level = this.player.afterimageLevel;
      var burstAngle;
      var count;
      var i;
      var originX;
      var originY;

      if (level <= 0) {
        return;
      }

      burstAngle = this.player.facingAngle + Math.PI;
      count = 1 + Math.floor((level + 1) / 2);
      originX = this.player.x + Math.cos(burstAngle) * (20 + level * 4);
      originY = this.player.y + Math.sin(burstAngle) * (20 + level * 4);

      for (i = 0; i < count; i += 1) {
        var spread = count > 1 ? (i - (count - 1) / 2) * 0.22 : 0;
        this.createPlayerShot({
          x: Math.cos(burstAngle + spread),
          y: Math.sin(burstAngle + spread)
        }, {
          originX: originX,
          originY: originY,
          speed: this.player.bulletSpeed * 0.92,
          radius: 5,
          life: 1.02,
          damage: Math.round(this.player.damage * (0.42 + level * 0.08)),
          color: "#9ee4ff",
          kind: "afterimage"
        });
      }

      this.effects.spawnRing(originX, originY, {
        color: "#9ee4ff",
        radius: 8 + level * 3,
        growth: 72 + level * 22,
        lineWidth: 2,
        life: 0.24,
        fillAlpha: 0.07
      });
    }

    updateDroneBuddy(dt) {
      var level = this.player.droneLevel;
      var droneCount;
      var orbitRadius;
      var i;
      var target;

      this.droneRender = [];
      if (level <= 0) {
        return;
      }

      droneCount = 1 + Math.floor(level / 3);
      orbitRadius = 52 + level * 10;
      for (i = 0; i < droneCount; i += 1) {
        var angle = this.elapsedSec * (1.8 + level * 0.08) + (Math.PI * 2 * i) / droneCount + Math.PI * 0.25;
        this.droneRender.push({
          x: this.player.x + Math.cos(angle) * orbitRadius,
          y: this.player.y + Math.sin(angle) * orbitRadius,
          radius: 7 + level
        });
      }

      this.player.droneCooldown -= dt;
      if (this.player.droneCooldown > 0) {
        return;
      }

      target = this.getNearestEnemy();
      if (!target) {
        return;
      }

      this.player.droneCooldown += Math.max(0.16, (0.62 - level * 0.07) * this.player.specialCooldownFactor);
      for (i = 0; i < this.droneRender.length; i += 1) {
        var drone = this.droneRender[i];
        var direction = normalize(target.x - drone.x, target.y - drone.y);
        this.createPlayerShot(direction, {
          originX: drone.x,
          originY: drone.y,
          speed: this.player.bulletSpeed * 1.08,
          radius: 5,
          life: 1.18,
          damage: Math.round(this.player.damage * 0.44 + level * 7),
          color: "#9fd4ff",
          kind: "drone"
        });
        this.effects.spawnHeatRipple(drone.x, drone.y, "#9fd4ff");
      }
    }

    updateTimedBuffs(dt) {
      var i;
      var damage;
      if (this.player.frenzyTimer > 0) {
        this.player.frenzyTimer = Math.max(0, this.player.frenzyTimer - dt);
      }
      if (this.player.shieldTimer > 0) {
        this.player.shieldTimer = Math.max(0, this.player.shieldTimer - dt);
      }
      if (this.player.loveAuraTimer > 0) {
        this.player.loveAuraTimer = Math.max(0, this.player.loveAuraTimer - dt);
        this.player.loveAuraPulse -= dt;
        if (this.player.loveAuraPulse <= 0) {
          this.player.loveAuraPulse = 0.6;
          damage = Math.round(18 + this.player.damage * 0.28);
          this.effects.spawnRing(this.player.x, this.player.y, {
            color: "#ff91d7",
            radius: 18,
            growth: 120,
            lineWidth: 3,
            life: 0.24,
            fillAlpha: 0.06
          });
          for (i = this.enemies.length - 1; i >= 0; i -= 1) {
            if (pointDistance(this.enemies[i].x, this.enemies[i].y, this.player.x, this.player.y) <= 146 + this.enemies[i].radius) {
              this.enemies[i].hp -= damage;
              this.effects.spawnHit(this.enemies[i].x, this.enemies[i].y, {
                color: "#ff91d7",
                ringColor: "#ffe0f2",
                radius: 8
              });
              if (this.enemies[i].hp <= 0) {
                this.killEnemy(this.enemies[i], this.enemies[i].category === "boss" || this.enemies[i].category === "elite");
                this.enemies.splice(i, 1);
              }
            }
          }
        }
      }
    }

    triggerSaltGuard() {
      var level = this.player.shellLevel;
      var radius;
      var damage;
      var i;

      if (level <= 0) {
        return;
      }

      radius = 104 + level * 18;
      damage = Math.round(16 + level * 12 + this.player.damage * 0.22);

      this.effects.spawnRing(this.player.x, this.player.y, {
        color: "#f7efe0",
        radius: 20,
        growth: radius,
        lineWidth: 4,
        life: 0.28,
        fillAlpha: 0.08
      });

      for (i = this.enemyProjectiles.length - 1; i >= 0; i -= 1) {
        if (pointDistance(this.enemyProjectiles[i].x, this.enemyProjectiles[i].y, this.player.x, this.player.y) <= radius) {
          this.effects.spawnHit(this.enemyProjectiles[i].x, this.enemyProjectiles[i].y, {
            color: "#f7efe0",
            ringColor: "#fff1c4",
            radius: 7
          });
          this.enemyProjectiles.splice(i, 1);
        }
      }

      for (i = this.enemies.length - 1; i >= 0; i -= 1) {
        var enemy = this.enemies[i];
        if (pointDistance(enemy.x, enemy.y, this.player.x, this.player.y) <= radius + enemy.radius) {
          enemy.hp -= damage;
          this.effects.spawnHit(enemy.x, enemy.y, {
            color: "#f7efe0",
            ringColor: "#fff1c4",
            radius: 10
          });
          if (enemy.hp <= 0) {
            this.killEnemy(enemy, enemy.category === "elite" || enemy.category === "boss");
            this.enemies.splice(i, 1);
          }
        }
      }
    }

    fireBasicVolley() {
      var target = this.getNearestEnemy();
      var direction;
      var baseAngle;
      var volleyCount;
      var i;
      var spread;
      var frenzyBoost = this.player.frenzyTimer > 0 ? 1.4 : 1;
      var critChance = this.player.hypeLevel * 0.08 + (this.player.frenzyTimer > 0 ? 0.14 : 0);

      if (target) {
        direction = normalize(target.x - this.player.x, target.y - this.player.y);
        this.player.facingAngle = Math.atan2(direction.y, direction.x);
      } else {
        direction = { x: Math.cos(this.player.facingAngle), y: Math.sin(this.player.facingAngle) };
      }

      baseAngle = Math.atan2(direction.y, direction.x);
      volleyCount = this.player.shotCount;

      for (i = 0; i < volleyCount; i += 1) {
        var crit = Math.random() < critChance;
        spread = volleyCount > 1 ? (i - (volleyCount - 1) / 2) * 0.16 : 0;
        this.createPlayerShot({
          x: Math.cos(baseAngle + spread),
          y: Math.sin(baseAngle + spread)
        }, {
          radius: crit ? 8 : 6,
          color: crit ? "#ffe07a" : "#7fe6ff",
          damage: Math.round(this.player.damage * frenzyBoost * (crit ? 1.65 : 1))
        });
      }

      if (this.player.hypeLevel >= 3 && Math.random() < 0.22) {
        this.createPlayerShot({ x: Math.cos(baseAngle + 0.28), y: Math.sin(baseAngle + 0.28) }, {
          color: "#ffb86f",
          damage: Math.round(this.player.damage * frenzyBoost * 0.88)
        });
        this.createPlayerShot({ x: Math.cos(baseAngle - 0.28), y: Math.sin(baseAngle - 0.28) }, {
          color: "#ffb86f",
          damage: Math.round(this.player.damage * frenzyBoost * 0.88)
        });
      }

      if (this.player.backstepLevel > 0) {
        var backAngle = baseAngle + Math.PI;
        var backCount = 1 + Math.floor(this.player.backstepLevel / 2);
        for (i = 0; i < backCount; i += 1) {
          spread = backCount > 1 ? (i - (backCount - 1) / 2) * 0.2 : 0;
          this.createPlayerShot({
            x: Math.cos(backAngle + spread),
            y: Math.sin(backAngle + spread)
          }, {
            speed: this.player.bulletSpeed * 0.94,
            radius: 5,
            life: 1.05,
            damage: Math.round(this.player.damage * frenzyBoost * (0.45 + this.player.backstepLevel * 0.08)),
            color: "#ffcf9d",
            pierce: Math.max(0, this.player.pierce - 1),
            kind: "backshot"
          });
        }
      }

      this.effects.spawnHeatRipple(this.player.x, this.player.y, "#7fe6ff");
    }

    firePulseBurst() {
      var count = 6 + this.player.pulseLevel * 2;
      var damage = Math.round((this.player.damage * (this.player.frenzyTimer > 0 ? 1.35 : 1)) * 0.55 + this.player.pulseLevel * 6);
      var i;
      for (i = 0; i < count; i += 1) {
        var angle = (Math.PI * 2 * i) / count;
        this.createPlayerShot({ x: Math.cos(angle), y: Math.sin(angle) }, {
          speed: 420 + this.player.pulseLevel * 28,
          damage: damage,
          radius: 7,
          life: 1.1,
          pierce: 1,
          color: "#f5adff",
          kind: "pulse"
        });
      }
      this.effects.spawnRing(this.player.x, this.player.y, {
        color: "#f5adff",
        radius: 18,
        growth: 200,
        lineWidth: 5,
        life: 0.36
      });
      this.player.pulseCooldown = Math.max(0.78, 2.8 - this.player.pulseLevel * 0.32) * this.player.specialCooldownFactor;
    }

    fireSunbeam() {
      var target = this.getNearestEnemy();
      var direction;
      var length;
      var width;
      var damage;
      var endX;
      var endY;
      var i;

      if (!target) {
        return;
      }

      direction = normalize(target.x - this.player.x, target.y - this.player.y);
      length = 420 + this.player.beamLevel * 80;
      width = 18 + this.player.beamLevel * 4;
      damage = Math.round(this.player.damage * (this.player.frenzyTimer > 0 ? 1.28 : 1) * 0.7 + 18 + this.player.beamLevel * 12);
      endX = this.player.x + direction.x * length;
      endY = this.player.y + direction.y * length;

      this.beamFx.push({
        x1: this.player.x,
        y1: this.player.y,
        x2: endX,
        y2: endY,
        width: width,
        life: 0.16,
        color: "#ffe07a"
      });

      for (i = this.enemies.length - 1; i >= 0; i -= 1) {
        var enemy = this.enemies[i];
        var dist = pointToSegmentDistance(enemy.x, enemy.y, this.player.x, this.player.y, endX, endY);
        if (dist <= enemy.radius + width) {
          enemy.hp -= damage;
          this.effects.spawnHit(enemy.x, enemy.y, {
            color: "#ffe07a",
            ringColor: "#fff1c4",
            radius: 12
          });
          if (enemy.hp <= 0) {
            this.killEnemy(enemy, enemy.category === "boss" || enemy.category === "elite");
            this.enemies.splice(i, 1);
          }
        }
      }

      this.effects.flashScreen("#ffe07a", 0.06, 0.1);
      this.player.beamCooldown = Math.max(1.2, 4.4 - this.player.beamLevel * 0.46) * this.player.specialCooldownFactor;
    }

    awardXp(amount, x, y) {
      var gained = Math.max(1, Math.round(amount * this.player.xpGainMultiplier));
      this.player.xp += gained;
      this.effects.spawnFloatingText("+" + gained + " " + translate(this.game, "common.xp"), x, y, {
        color: "#88f291",
        size: 16,
        life: 0.55
      });

      while (this.player.xp >= this.player.xpForNext) {
        this.player.xp -= this.player.xpForNext;
        this.player.level += 1;
        this.player.xpForNext = Math.round(this.player.xpForNext * 1.28 + 7);
        this.pendingLevelUps += 1;
        this.effects.spawnLevelUp(this.player.x, this.player.y - 18, translate(this.game, "common.levelUp"));
        this.pushMessage(translate(this.game, "survivor.levelLabel", { level: this.player.level }), 1.1, "#9ee4ff");
      }
    }

    createPickup(kind, x, y, options) {
      var opts = options || {};
      var defaultLife = kind === "xp" ? 36 : kind === "chest" ? 40 : 28;
      var pickup = {
        kind: kind || "xp",
        x: x,
        y: y,
        radius: opts.radius || 8,
        color: opts.color || "#88f291",
        xp: opts.xp || 0,
        heal: opts.heal || 0,
        rolls: opts.rolls || 0,
        value: opts.value || 0,
        life: opts.life || defaultLife
      };
      this.pickups.push(pickup);
      return pickup;
    }

    getPickupName(kind) {
      return this.game.pickupName ? this.game.pickupName(kind) : kind;
    }

    healPlayer(amount) {
      var healed = Math.min(this.player.maxHp - this.player.hp, Math.max(0, Math.round(amount || 0)));
      if (healed <= 0) {
        return 0;
      }
      this.player.hp += healed;
      this.effects.spawnFloatingText("+" + healed + " " + translate(this.game, "common.hp"), this.player.x, this.player.y - 24, {
        color: "#9cffb8",
        size: 18,
        life: 0.7
      });
      this.effects.spawnRing(this.player.x, this.player.y, {
        color: "#9cffb8",
        radius: 12,
        growth: 64,
        lineWidth: 3,
        life: 0.2,
        fillAlpha: 0.05
      });
      return healed;
    }

    vacuumXpPickups() {
      var totalXp = 0;
      var collected = [];
      var sampleStep = 1;
      var samples = 0;
      var i;
      for (i = this.pickups.length - 1; i >= 0; i -= 1) {
        if (this.pickups[i].kind === "xp") {
          totalXp += this.pickups[i].xp || 0;
          collected.push({
            x: this.pickups[i].x,
            y: this.pickups[i].y,
            color: this.pickups[i].color
          });
          this.pickups.splice(i, 1);
        }
      }
      if (collected.length > 0) {
        sampleStep = Math.max(1, Math.ceil(collected.length / 18));
        for (i = 0; i < collected.length; i += sampleStep) {
          this.effects.spawnPickupTrail(collected[i].x, collected[i].y, this.player.x, this.player.y, collected[i].color);
          samples += 1;
          if (samples >= 18) {
            break;
          }
        }
        if (collected.length > 18) {
          this.effects.spawnRing(this.player.x, this.player.y, {
            color: "#7fe6ff",
            radius: 18,
            growth: 150,
            lineWidth: 4,
            life: 0.22,
            fillAlpha: 0.04
          });
        }
      }
      if (totalXp > 0) {
        this.awardXp(totalXp, this.player.x, this.player.y - 12);
      }
      return totalXp;
    }

    applyRandomUpgrades(count) {
      var total = Math.max(1, count || 1);
      var applied = 0;
      var i;
      for (i = 0; i < total; i += 1) {
        var choices = this.buildLevelUpChoices();
        if (!choices.length) {
          break;
        }
        this.applyUpgrade(choices[0]);
        applied += 1;
      }
      return applied;
    }

    triggerIkuikuPulse() {
      var i;
      var damage = Math.round(48 + this.hazardRank * 3 + this.player.damage * 0.5);
      this.effects.flashScreen("#ff91d7", 0.12, 0.16);
      this.effects.triggerShake(8, 0.2);
      this.effects.spawnRing(this.player.x, this.player.y, {
        color: "#ff91d7",
        radius: 24,
        growth: 260,
        lineWidth: 6,
        life: 0.34,
        fillAlpha: 0.08
      });

      for (i = this.enemyProjectiles.length - 1; i >= 0; i -= 1) {
        this.effects.spawnHit(this.enemyProjectiles[i].x, this.enemyProjectiles[i].y, {
          color: "#ff91d7",
          ringColor: "#fff1c4",
          radius: 7
        });
        this.enemyProjectiles.splice(i, 1);
      }

      for (i = this.enemies.length - 1; i >= 0; i -= 1) {
        this.enemies[i].hp -= damage;
        this.effects.spawnHit(this.enemies[i].x, this.enemies[i].y, {
          color: "#ff91d7",
          ringColor: "#ffe0f2",
          radius: this.enemies[i].category === "boss" ? 12 : 9
        });
        if (this.enemies[i].hp <= 0) {
          this.killEnemy(this.enemies[i], this.enemies[i].category === "boss" || this.enemies[i].category === "elite");
          this.enemies.splice(i, 1);
        }
      }
    }

    applyPickupEffect(pickup) {
      var pickupName = this.getPickupName(pickup.kind);
      var chestCount;
      var specialDef = findSpecialItemDef(pickup.kind);
      if (pickup.kind === "xp") {
        this.awardXp(pickup.xp, this.player.x, this.player.y - 12);
        return;
      }

      if (specialDef) {
        this.rememberSpecialItem(specialDef.id);
        this.addSpecialInventory(specialDef.id);
      }

      if (this.game.audio && this.game.audio.playPickupCue) {
        this.game.audio.playPickupCue(pickup.kind);
      }
      this.pushMessage(pickupName, 1.1, pickup.color || "#f4f0da");

      switch (pickup.kind) {
        case "heal":
          this.healPlayer(pickup.heal || 28);
          break;
        case "magnet":
          this.effects.spawnRing(this.player.x, this.player.y, {
            color: "#7fe6ff",
            radius: 18,
            growth: 180,
            lineWidth: 4,
            life: 0.24,
            fillAlpha: 0.06
          });
          this.vacuumXpPickups();
          break;
        case "chest":
          chestCount = this.applyRandomUpgrades(pickup.rolls || 1);
          if (chestCount <= 0) {
            this.spawnRewardCrystals(8, 3);
          }
          this.effects.spawnChestOpen(this.player.x, this.player.y - 10);
          break;
        case "item114514":
          this.healPlayer(14);
          this.vacuumXpPickups();
          this.awardXp(pickup.value || 114, this.player.x, this.player.y - 20);
          this.applyRandomUpgrades(1);
          this.effects.flashScreen("#ffe07a", 0.14, 0.2);
          break;
        case "yarimasuItem":
          this.player.frenzyTimer = Math.max(this.player.frenzyTimer, 12);
          this.fireBasicVolley();
          this.firePulseBurst();
          this.effects.flashScreen("#ffb86f", 0.1, 0.14);
          break;
        case "iizoItem":
          this.healPlayer(this.player.maxHp);
          this.player.shieldTimer = Math.max(this.player.shieldTimer, 14);
          this.effects.spawnRing(this.player.x, this.player.y, {
            color: "#9cffb8",
            radius: 18,
            growth: 110,
            lineWidth: 4,
            life: 0.3,
            fillAlpha: 0.08
          });
          break;
        case "ikuikuItem":
          this.triggerIkuikuPulse();
          break;
        case "loveItem":
          this.healPlayer(24);
          this.vacuumXpPickups();
          this.player.loveAuraTimer = Math.max(this.player.loveAuraTimer, 16);
          this.player.loveAuraPulse = 0.1;
          this.effects.flashScreen("#ff7fb3", 0.08, 0.14);
          break;
        default:
          break;
      }

      if (specialDef) {
        this.tryFuseSpecialItems();
      }
    }

    spawnRewardCrystals(count, xpValue) {
      var total = count || 8;
      var i;
      for (i = 0; i < total; i += 1) {
        var angle = (Math.PI * 2 * i) / total;
        var radius = 90 + (i % 2) * 36;
        this.createPickup("xp", this.player.x + Math.cos(angle) * radius, this.player.y + Math.sin(angle) * radius, {
          radius: 8,
          xp: xpValue || 3,
          color: i % 2 === 0 ? "#88f291" : "#ffe07a"
        });
      }
    }

    buildLevelUpChoices() {
      var ids = Object.keys(UPGRADE_CATALOG);
      var available = [];
      var result = [];
      var i;

      for (i = 0; i < ids.length; i += 1) {
        var upgradeId = ids[i];
        var level = this.getUpgradeLevel(upgradeId);
        var def = UPGRADE_CATALOG[upgradeId];
        if (level >= def.maxLevel) {
          continue;
        }
        available.push({ id: upgradeId, weight: def.weight * (level === 0 ? 1.12 : 1.32) });
      }

      while (available.length && result.length < 3) {
        var picked = pickWeighted(this.spawner.rng, available);
        var index = -1;
        for (i = 0; i < available.length; i += 1) {
          if (available[i].id === picked.id) {
            index = i;
            break;
          }
        }
        if (index >= 0) {
          available.splice(index, 1);
        }
        result.push(picked.id);
      }

      return result;
    }

    resolveExcessLevelUps() {
      var bonusCount = Math.max(1, this.pendingLevelUps || 1);
      var coinReward = bonusCount * (12 + this.hazardRank);
      this.pendingLevelUps = 0;
      this.levelUpChoices = null;
      this.pointerCapturedByUi = false;
      this.awardCoins(coinReward, this.player.x, this.player.y - 10);
      this.healPlayer(8 + bonusCount * 2);
      this.pushMessage(
        this.game.getLocale() === "ja"
          ? "強化最大: コイン補填 +" + coinReward
          : "MAX BUILD: +" + coinReward + " coins",
        1.3,
        "#f6c453"
      );
    }

    openLevelUpChoices() {
      this.levelUpChoices = this.buildLevelUpChoices();
      if (!this.levelUpChoices.length) {
        this.resolveExcessLevelUps();
        return;
      }
      this.levelUpSelected = 0;
      this.levelUpHover = -1;
      this.pointerCapturedByUi = true;
    }

    applyUpgrade(upgradeId) {
      var def = UPGRADE_CATALOG[upgradeId];
      if (!def) {
        return;
      }
      this.upgradeLevels[upgradeId] = this.getUpgradeLevel(upgradeId) + 1;
      if (this.acquiredUpgrades.indexOf(upgradeId) < 0) {
        this.acquiredUpgrades.push(upgradeId);
      }
      this.refreshBuildStats(true);
      this.pushMessage(getUpgradeName(this.game, upgradeId), 1.2, def.color);
    }

    confirmLevelUpChoice(index) {
      var upgradeId;
      if (!this.levelUpChoices || index < 0 || index >= this.levelUpChoices.length) {
        return;
      }
      upgradeId = this.levelUpChoices[index];
      this.applyUpgrade(upgradeId);
      this.pendingLevelUps = Math.max(0, this.pendingLevelUps - 1);
      this.levelUpChoices = null;
      this.pointerCapturedByUi = false;
      if (this.pendingLevelUps > 0) {
        this.openLevelUpChoices();
      }
    }

    handleLevelUpInput(input) {
      var pointer = input.getPointer();
      var cardX = ns.constants.GAME_WIDTH - LEVELUP_CARD_WIDTH - 74;
      var cardY = 164;
      var i;

      if (!this.levelUpChoices || !this.levelUpChoices.length) {
        this.resolveExcessLevelUps();
        return;
      }
      this.levelUpHover = -1;

      if (pointer.inside) {
        for (i = 0; i < this.levelUpChoices.length; i += 1) {
          var rect = {
            x: cardX,
            y: cardY + i * (LEVELUP_CARD_HEIGHT + 16),
            width: LEVELUP_CARD_WIDTH,
            height: LEVELUP_CARD_HEIGHT
          };
          if (pointInRect(pointer, rect)) {
            this.levelUpHover = i;
            this.levelUpSelected = i;
            this.pointerCapturedByUi = true;
            if (pointer.pressed) {
              this.confirmLevelUpChoice(i);
            }
            return;
          }
        }
      }

      if (input.wasPressed("up")) {
        this.levelUpSelected = (this.levelUpSelected + this.levelUpChoices.length - 1) % this.levelUpChoices.length;
      }
      if (input.wasPressed("down")) {
        this.levelUpSelected = (this.levelUpSelected + 1) % this.levelUpChoices.length;
      }
      if (input.wasPressed("confirm")) {
        this.confirmLevelUpChoice(this.levelUpSelected);
      }
    }

    handleSpawnerResult(result) {
      var i;
      var phaseId = result.activePhaseId || "";

      if (phaseId && phaseId !== this.lastPhaseId) {
        this.lastPhaseId = phaseId;
        this.pushMessage(translate(this.game, "survivor.phaseEnter", { phase: this.game.phaseName(phaseId) }), 1.15, this.stageTheme.accent);
      }

      for (i = 0; i < result.spawned.length; i += 1) {
        this.enemies.push(result.spawned[i]);
        if (result.spawned[i].category === "elite") {
          this.effects.spawnRing(result.spawned[i].x, result.spawned[i].y, {
            color: "#ff9c4b",
            radius: 20,
            growth: 84,
            lineWidth: 4,
            life: 0.4
          });
        }
      }

      for (i = 0; i < result.events.length; i += 1) {
        var eventDef = result.events[i];
        this.effects.spawnBossWarning(translate(this.game, "survivor.eventAt", { time: formatTime(eventDef.atSec) }));
        this.pushMessage(translate(this.game, "survivor.eventAt", { time: formatTime(eventDef.atSec) }), 1.4, "#fff1c4");
        if (eventDef.kind === "special-wave") {
          this.spawnRewardCrystals(8 + Math.floor(this.hazardRank / 2), 3 + Math.floor(this.hazardRank / 6));
        } else if (eventDef.kind === "crisis") {
          this.effects.flashScreen("#ff8a70", 0.08, 0.16);
          this.effects.triggerShake(7, 0.22);
        }
      }

      for (i = 0; i < result.bosses.length; i += 1) {
        this.enemies.push(result.bosses[i]);
        this.effects.spawnBossWarning(this.game.enemyName(result.bosses[i].archetypeId || "") || result.bosses[i].label || "BOSS");
      }
    }

    handleUiButtons(input) {
      var pointer = input.getPointer();
      var buttons = this.getActionButtons();
      var i;

      this.pointerCapturedByUi = !!this.levelUpChoices || !!this.merchant.open;
      if (this.merchant.open) {
        return "none";
      }
      if (!pointer.inside) {
        return "none";
      }

      for (i = 0; i < buttons.length; i += 1) {
        if (pointInRect(pointer, buttons[i])) {
          this.pointerCapturedByUi = true;
          if (pointer.pressed) {
            if (buttons[i].action === "language") {
              this.game.toggleLocale();
              this.pushMessage(this.game.getLocale().toUpperCase(), 0.8, "#ffe07a");
              return "language";
            }
            if (buttons[i].action === "title") {
              this.game.openTitle({ stageId: this.stageId, hazardRank: this.hazardRank });
              return "title";
            }
            if (buttons[i].action === "restart") {
              this.game.restartSurvivor();
              return "restart";
            }
            if (buttons[i].action === "shop") {
              this.openMerchantShop();
              return "shop";
            }
            if (buttons[i].action === "pause" && !this.levelUpChoices && !this.runEnded) {
              this.paused = !this.paused;
              this.pushMessage(this.paused ? translate(this.game, "survivor.paused") : translate(this.game, "buttons.go"), 0.8, "#d9d1ff");
              return "pause";
            }
          }
          return "hover";
        }
      }
      return "none";
    }

    updatePlayer(dt, input) {
      var move = this.getMoveVector(input);
      var speed = this.player.speed * move.intensity;
      var moveMagnitude;
      var target;

      this.player.vx = move.x * speed;
      this.player.vy = move.y * speed;
      this.player.x += this.player.vx * dt;
      this.player.y += this.player.vy * dt;
      moveMagnitude = Math.sqrt(this.player.vx * this.player.vx + this.player.vy * this.player.vy);

      if (move.intensity > 0.1) {
        this.player.facingAngle = Math.atan2(move.y, move.x);
      }

      if (this.player.afterimageLevel > 0) {
        this.player.afterimageCooldown -= dt;
        if (moveMagnitude > 76 && this.player.afterimageCooldown <= 0) {
          this.fireAfterimageBurst();
          this.player.afterimageCooldown = Math.max(0.14, 0.42 - this.player.afterimageLevel * 0.05);
        }
      }

      this.player.fireCooldown -= dt;
      if (this.player.fireCooldown <= 0) {
        target = this.getNearestEnemy();
        if (target) {
          this.player.fireCooldown += this.player.fireRate;
          this.fireBasicVolley();
        }
      }

      if (this.player.pulseLevel > 0) {
        this.player.pulseCooldown -= dt;
        if (this.player.pulseCooldown <= 0) {
          this.firePulseBurst();
        }
      }

      if (this.player.beamLevel > 0) {
        this.player.beamCooldown -= dt;
        if (this.player.beamCooldown <= 0) {
          this.fireSunbeam();
        }
      }

      this.updateDroneBuddy(dt);
      this.updateTimedBuffs(dt);

      if (this.playerHitTimer > 0) {
        this.playerHitTimer -= dt;
      }
    }

    updateOrbitDamage(dt) {
      var orbitLevel = this.player.orbitLevel;
      var orbCount;
      var radius;
      var damage;
      var i;
      var j;

      this.orbitRender = [];
      if (orbitLevel <= 0) {
        return;
      }

      orbCount = 1 + orbitLevel;
      radius = 54 + orbitLevel * 7;
      damage = Math.round(10 + orbitLevel * 8 + this.player.damage * 0.18);

      for (i = this.enemies.length - 1; i >= 0; i -= 1) {
        this.enemies[i].orbitDamageTimer = Math.max(0, (this.enemies[i].orbitDamageTimer || 0) - dt);
      }

      for (j = 0; j < orbCount; j += 1) {
        var angle = this.elapsedSec * (2.8 + orbitLevel * 0.22) + (Math.PI * 2 * j) / orbCount;
        var ox = this.player.x + Math.cos(angle) * radius;
        var oy = this.player.y + Math.sin(angle) * radius;
        this.orbitRender.push({ x: ox, y: oy, radius: 8 + orbitLevel * 0.8 });
      }

      for (i = this.enemies.length - 1; i >= 0; i -= 1) {
        var enemy = this.enemies[i];
        if ((enemy.orbitDamageTimer || 0) > 0) {
          continue;
        }
        for (j = 0; j < this.orbitRender.length; j += 1) {
          var orb = this.orbitRender[j];
          if (pointDistance(orb.x, orb.y, enemy.x, enemy.y) <= orb.radius + enemy.radius) {
            enemy.hp -= damage;
            enemy.orbitDamageTimer = 0.14;
            this.effects.spawnHit(enemy.x, enemy.y, {
              color: "#8ff7ff",
              ringColor: "#dffbff",
              radius: 9
            });
            if (enemy.hp <= 0) {
              this.killEnemy(enemy);
              this.enemies.splice(i, 1);
            }
            break;
          }
        }
      }
    }

    damagePlayer(amount) {
      var finalDamage;
      var minimumDamage = this.player.shieldTimer > 0 ? 0 : 1;
      if (this.playerHitTimer > 0 || this.runEnded) {
        return;
      }
      finalDamage = Math.max(minimumDamage, Math.round(amount - this.player.armor - (this.player.shieldTimer > 0 ? 4 : 0)));
      if (finalDamage <= 0) {
        this.playerHitTimer = 0.18;
        this.effects.spawnRing(this.player.x, this.player.y, {
          color: "#9cffb8",
          radius: 12,
          growth: 54,
          lineWidth: 3,
          life: 0.16
        });
        return;
      }
      this.playerHitTimer = 0.45;
      this.player.hp = Math.max(0, this.player.hp - finalDamage);
      this.effects.spawnHit(this.player.x, this.player.y, {
        color: "#ff7f88",
        ringColor: "#ffd1d6",
        radius: 10
      });
      this.triggerSaltGuard();
      this.effects.triggerShake(5, 0.16);
      if (this.player.hp <= 0) {
        this.finishRun("DOWN");
      }
    }

    rollSpecialWorldItem() {
      var roll = Math.random();
      if (roll < 0.2) {
        return "item114514";
      }
      if (roll < 0.4) {
        return "yarimasuItem";
      }
      if (roll < 0.6) {
        return "iizoItem";
      }
      if (roll < 0.8) {
        return "ikuikuItem";
      }
      return "loveItem";
    }

    dropEnemyLoot(enemy, giveChestFx) {
      var extraDropChance;
      var extraDrops;
      var d;
      var lowHp = this.player.hp / Math.max(1, this.player.maxHp) <= 0.58;
      var luckBoost = this.player.luckLevel * 0.01;
      var specialChance = enemy.category === "boss" ? 1 : enemy.category === "elite" ? (0.34 + this.player.luckLevel * 0.03) : 0;

      this.createPickup("xp", enemy.x, enemy.y, {
        radius: enemy.category === "boss" ? 10 : enemy.category === "elite" ? 8 : 7,
        xp: enemy.category === "boss" ? enemy.xp + 12 : enemy.category === "elite" ? enemy.xp + 6 : enemy.xp,
        color: enemy.category === "boss" ? "#f6c453" : enemy.category === "elite" ? "#ffb86f" : "#88f291"
      });

      if (giveChestFx || enemy.category === "boss" || enemy.category === "elite") {
        this.createPickup("chest", enemy.x + 12, enemy.y - 8, {
          radius: enemy.category === "boss" ? 13 : 11,
          color: "#f6c453",
          rolls: enemy.category === "boss" ? 2 + Math.floor(this.hazardRank / 7) : 1
        });
      }

      if (lowHp && Math.random() < 0.08 + luckBoost) {
        this.createPickup("heal", enemy.x - 12, enemy.y + 8, {
          radius: 9,
          color: "#9cffb8",
          heal: 18 + this.hazardRank
        });
      }

      if (Math.random() < 0.018 + this.player.luckLevel * 0.008) {
        this.createPickup("magnet", enemy.x + 18, enemy.y + 10, {
          radius: 10,
          color: "#7fe6ff"
        });
      }

      if (specialChance > 0 && Math.random() < specialChance) {
        this.createPickup(this.rollSpecialWorldItem(), enemy.x - 18, enemy.y - 12, {
          radius: 11,
          color: enemy.category === "boss" ? "#ffe07a" : "#ff91d7",
          value: 114
        });
      }

      extraDropChance = 0.16 + this.player.luckLevel * 0.07;
      if (this.player.luckLevel > 0 && Math.random() < extraDropChance) {
        extraDrops = 1 + Math.floor(Math.random() * (1 + Math.floor(this.player.luckLevel / 2)));
        for (d = 0; d < extraDrops; d += 1) {
          this.createPickup("xp", enemy.x + Math.cos((Math.PI * 2 * d) / Math.max(1, extraDrops)) * (10 + d * 6), enemy.y + Math.sin((Math.PI * 2 * d) / Math.max(1, extraDrops)) * (10 + d * 6), {
            radius: 6,
            xp: 1 + Math.floor(this.player.luckLevel / 2),
            color: "#ffe07a"
          });
        }
      }
    }

    killEnemy(enemy, giveChestFx) {
      var coinValue = enemy.category === "boss" ? 28 + this.hazardRank : enemy.category === "elite" ? 12 + Math.floor(this.hazardRank / 2) : 1 + Math.floor((enemy.xp || 1) / 2);
      this.player.kills += 1;
      this.effects.spawnEnemyDeath(enemy);
      this.awardCoins(coinValue, enemy.x, enemy.y - 12);
      if (giveChestFx || enemy.category === "boss" || enemy.category === "elite") {
        this.effects.spawnChestOpen(enemy.x, enemy.y);
      }
      this.dropEnemyLoot(enemy, giveChestFx);

      if (enemy.category === "boss" && enemy.chestType === "evolution" && this.elapsedSec >= RUN_LENGTH_SEC - 5) {
        this.finishRun("CLEARED");
      }
    }

    updateProjectiles(dt) {
      var i;
      var j;

      for (i = this.projectiles.length - 1; i >= 0; i -= 1) {
        var shot = this.projectiles[i];
        shot.life -= dt;
        shot.x += shot.vx * dt;
        shot.y += shot.vy * dt;
        if (shot.life <= 0 || pointDistance(shot.x, shot.y, this.player.x, this.player.y) > DESPAWN_DISTANCE) {
          this.projectiles.splice(i, 1);
          continue;
        }

        for (j = this.enemies.length - 1; j >= 0; j -= 1) {
          var enemy = this.enemies[j];
          if (distanceSquared(shot, enemy) <= (shot.radius + enemy.radius) * (shot.radius + enemy.radius)) {
            enemy.hp -= shot.damage;
            this.effects.spawnHit(enemy.x, enemy.y, {
              color: shot.color,
              ringColor: "#e4fbff",
              radius: enemy.category === "boss" ? 12 : 8
            });
            if (shot.pierce > 0) {
              shot.pierce -= 1;
              shot.damage = Math.round(shot.damage * 0.8);
            } else {
              this.projectiles.splice(i, 1);
            }
            if (enemy.hp <= 0) {
              this.killEnemy(enemy);
              this.enemies.splice(j, 1);
            }
            break;
          }
        }
      }

      for (i = this.enemyProjectiles.length - 1; i >= 0; i -= 1) {
        var enemyShot = this.enemyProjectiles[i];
        enemyShot.life -= dt;
        enemyShot.age += dt;
        enemyShot.x += enemyShot.vx * dt;
        enemyShot.y += enemyShot.vy * dt;
        if (enemyShot.trailRate > 0) {
          enemyShot.trailTimer -= dt;
          if (enemyShot.trailTimer <= 0) {
            enemyShot.trailTimer += enemyShot.trailRate;
            this.spawnEnemyShotTrail(enemyShot);
          }
        }
        if (enemyShot.life <= 0 || pointDistance(enemyShot.x, enemyShot.y, this.player.x, this.player.y) > DESPAWN_DISTANCE) {
          this.enemyProjectiles.splice(i, 1);
          continue;
        }

        if (pointDistance(enemyShot.x, enemyShot.y, this.player.x, this.player.y) <= enemyShot.radius + this.player.radius) {
          this.damagePlayer(enemyShot.damage);
          this.enemyProjectiles.splice(i, 1);
        }
      }
    }

    updateEnemies(dt) {
      var i;
      var enemy;
      var toPlayer;
      var moveScale;
      var velocityX;
      var velocityY;
      var sideAngle;

      for (i = this.enemies.length - 1; i >= 0; i -= 1) {
        enemy = this.enemies[i];
        toPlayer = normalize(this.player.x - enemy.x, this.player.y - enemy.y);
        moveScale = 1;
        velocityX = toPlayer.x;
        velocityY = toPlayer.y;

        if (enemy.category === "wall") {
          moveScale = 0.72;
        } else if (enemy.category === "ranged" || enemy.category === "disruptor") {
          moveScale = toPlayer.length < 180 ? -0.28 : 0.86;
        }

        if (enemy.archetypeId === "rumorWisp") {
          sideAngle = Math.sin(this.elapsedSec * 5 + i) * 0.8;
          velocityX += Math.cos(Math.atan2(toPlayer.y, toPlayer.x) + Math.PI * 0.5) * sideAngle;
          velocityY += Math.sin(Math.atan2(toPlayer.y, toPlayer.x) + Math.PI * 0.5) * sideAngle;
        } else if (enemy.archetypeId === "marketShadow") {
          sideAngle = Math.sin(this.elapsedSec * 3 + i) * 0.45;
          velocityX += -toPlayer.y * sideAngle;
          velocityY += toPlayer.x * sideAngle;
        } else if (enemy.archetypeId === "signalCrab") {
          sideAngle = Math.sin(this.elapsedSec * 8 + i * 0.9) * 0.7;
          velocityX += -toPlayer.y * sideAngle;
          velocityY += toPlayer.x * sideAngle;
          if (toPlayer.length < 120) {
            moveScale *= 1.24;
          }
        } else if (enemy.archetypeId === "iceCreamBat") {
          sideAngle = Math.sin(this.elapsedSec * 6.4 + i) * 0.5;
          velocityX += Math.cos(Math.atan2(toPlayer.y, toPlayer.x) + Math.PI * 0.5) * sideAngle * 0.5;
          velocityY += Math.sin(Math.atan2(toPlayer.y, toPlayer.x) + Math.PI * 0.5) * sideAngle * 0.5;
          moveScale *= 1.08;
        } else if (enemy.archetypeId === "speakerTotem") {
          moveScale = toPlayer.length < 240 ? -0.42 : 0.18;
        } else if (enemy.archetypeId === "mirrorMoth") {
          sideAngle = Math.sin(this.elapsedSec * 8.8 + i * 1.4) * 0.95;
          velocityX += -toPlayer.y * sideAngle;
          velocityY += toPlayer.x * sideAngle;
        } else if (enemy.archetypeId === "sunspotMine") {
          moveScale = toPlayer.length < 180 ? 0.06 : 0.36;
        } else if (enemy.archetypeId === "heatIdol") {
          moveScale = toPlayer.length < 210 ? -0.2 : 0.78;
        }

        if (enemy.archetypeId === "clockNeedleHound") {
          enemy.dashTimer = (enemy.dashTimer || 0.8) - dt;
          if (enemy.dashTimer <= 0) {
            enemy.dashTimer = 1.8;
            enemy.dashBoost = 0.28;
          }
          if (enemy.dashBoost > 0) {
            enemy.dashBoost -= dt;
            moveScale *= 2.3;
          }
        } else if (enemy.archetypeId === "shadeRunner") {
          enemy.dashTimer = (enemy.dashTimer || 0.56) - dt;
          if (enemy.dashTimer <= 0) {
            enemy.dashTimer = 1.25;
            enemy.dashBoost = 0.22;
          }
          if (enemy.dashBoost > 0) {
            enemy.dashBoost -= dt;
            moveScale *= 2.7;
          }
        }

        enemy.vx = velocityX * enemy.speed * 84 * moveScale;
        enemy.vy = velocityY * enemy.speed * 84 * moveScale;
        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;
        enemy.attackTimer = (enemy.attackTimer || 0.9) - dt;

        if (enemy.archetypeId === "stallLantern" && enemy.attackTimer <= 0) {
          var angle = Math.atan2(toPlayer.y, toPlayer.x);
          enemy.attackTimer = 1.65;
          this.effects.spawnRing(enemy.x, enemy.y, {
            color: "#ffcf80",
            radius: 10,
            growth: 38,
            lineWidth: 2,
            life: 0.16,
            fillAlpha: 0.06
          });
          this.effects.spawnParticleBurst(enemy.x, enemy.y, {
            count: 4,
            color: "#ffcf80",
            speedMin: 18,
            speedMax: 46,
            life: 0.18,
            sizeStart: 3,
            sizeEnd: 1
          });
          this.createEnemyShot(enemy, { x: Math.cos(angle), y: Math.sin(angle) }, {
            speed: 190 * (this.plan.enemyScale.projectileSpeedMultiplier || 1),
            radius: 8,
            damage: enemy.damage + 2,
            color: "#ffcf80",
            kind: "bomb",
            trailRate: 0.06,
            spin: 6
          });
          this.createEnemyShot(enemy, { x: Math.cos(angle + 0.28), y: Math.sin(angle + 0.28) }, {
            speed: 172 * (this.plan.enemyScale.projectileSpeedMultiplier || 1),
            radius: 6,
            damage: enemy.damage,
            color: "#ffad7d",
            kind: "bomb",
            trailRate: 0.08,
            spin: 5
          });
          this.createEnemyShot(enemy, { x: Math.cos(angle - 0.28), y: Math.sin(angle - 0.28) }, {
            speed: 172 * (this.plan.enemyScale.projectileSpeedMultiplier || 1),
            radius: 6,
            damage: enemy.damage,
            color: "#ffad7d",
            kind: "bomb",
            trailRate: 0.08,
            spin: 5
          });
        } else if (enemy.archetypeId === "speakerTotem" && enemy.attackTimer <= 0) {
          angle = Math.atan2(toPlayer.y, toPlayer.x);
          enemy.attackTimer = 1.45;
          this.effects.spawnRing(enemy.x, enemy.y, {
            color: "#ffd98d",
            radius: 12,
            growth: 42,
            lineWidth: 2,
            life: 0.18
          });
          this.effects.spawnRing(enemy.x, enemy.y, {
            color: "#fff1c4",
            radius: 20,
            growth: 28,
            lineWidth: 1,
            life: 0.14
          });
          this.createEnemyShot(enemy, { x: Math.cos(angle), y: Math.sin(angle) }, {
            speed: 210 * (this.plan.enemyScale.projectileSpeedMultiplier || 1),
            radius: 7,
            damage: enemy.damage + 1,
            color: "#ffcf80",
            kind: "speaker",
            trailRate: 0.06,
            spin: 7
          });
          this.createEnemyShot(enemy, { x: Math.cos(angle + 0.34), y: Math.sin(angle + 0.34) }, {
            speed: 186 * (this.plan.enemyScale.projectileSpeedMultiplier || 1),
            radius: 6,
            damage: enemy.damage,
            color: "#ffad7d",
            kind: "speaker",
            trailRate: 0.07,
            spin: 6
          });
          this.createEnemyShot(enemy, { x: Math.cos(angle - 0.34), y: Math.sin(angle - 0.34) }, {
            speed: 186 * (this.plan.enemyScale.projectileSpeedMultiplier || 1),
            radius: 6,
            damage: enemy.damage,
            color: "#ffad7d",
            kind: "speaker",
            trailRate: 0.07,
            spin: 6
          });
        } else if (enemy.archetypeId === "sunspotMine" && enemy.attackTimer <= 0) {
          enemy.attackTimer = 2.18;
          this.effects.spawnRing(enemy.x, enemy.y, {
            color: "#ffbf78",
            radius: 16,
            growth: 60,
            lineWidth: 3,
            life: 0.2,
            fillAlpha: 0.08
          });
          for (var mineShot = 0; mineShot < 6; mineShot += 1) {
            var mineAngle = (Math.PI * 2 * mineShot) / 6;
            this.createEnemyShot(enemy, { x: Math.cos(mineAngle), y: Math.sin(mineAngle) }, {
              speed: 150 * (this.plan.enemyScale.projectileSpeedMultiplier || 1),
              radius: 6,
              damage: enemy.damage - 2,
              color: "#ffbf78",
              kind: "mine",
              trailRate: 0.1,
              spin: 5
            });
          }
          this.effects.spawnHeatRipple(enemy.x, enemy.y, "#ffbf78");
        } else if (enemy.archetypeId === "heatIdol" && enemy.attackTimer <= 0) {
          enemy.attackTimer = 1.18;
          this.effects.spawnRing(enemy.x, enemy.y, {
            color: "#ff9f59",
            radius: 18,
            growth: 70,
            lineWidth: 3,
            life: 0.22,
            fillAlpha: 0.08
          });
          this.effects.flashScreen("#ff9f59", 0.04, 0.08);
          for (var idolShot = 0; idolShot < 10; idolShot += 1) {
            var idolAngle = (Math.PI * 2 * idolShot) / 10;
            this.createEnemyShot(enemy, { x: Math.cos(idolAngle), y: Math.sin(idolAngle) }, {
              speed: 210 * (this.plan.enemyScale.projectileSpeedMultiplier || 1),
              radius: 7,
              damage: enemy.damage - 2,
              color: "#ff9f59",
              kind: "idol",
              trailRate: 0.06,
              spin: 8
            });
          }
          this.createEnemyShot(enemy, toPlayer, {
            speed: 250 * (this.plan.enemyScale.projectileSpeedMultiplier || 1),
            radius: 8,
            damage: enemy.damage + 4,
            color: "#fff1c4",
            kind: "idol-core",
            trailRate: 0.05,
            spin: 4
          });
          this.effects.spawnRing(enemy.x, enemy.y, {
            color: "#ff9f59",
            radius: 12,
            growth: 90,
            lineWidth: 3,
            life: 0.22
          });
        } else if (enemy.category === "ranged" && enemy.attackTimer <= 0) {
          enemy.attackTimer = enemy.archetypeId === "chlorineShade" ? 1.35 : 1.75;
          if (enemy.archetypeId === "chlorineShade") {
            this.effects.spawnRing(enemy.x, enemy.y, {
              color: "#bdf6ff",
              radius: 10,
              growth: 26,
              lineWidth: 2,
              life: 0.14,
              fillAlpha: 0.05
            });
          }
          this.createEnemyShot(enemy, toPlayer, {
            speed: 220 * (this.plan.enemyScale.projectileSpeedMultiplier || 1),
            radius: enemy.archetypeId === "chlorineShade" ? 7 : 6,
            damage: enemy.damage,
            color: enemy.archetypeId === "chlorineShade" ? "#7fe6ff" : "#ffad7d",
            kind: enemy.archetypeId === "chlorineShade" ? "chlorine" : "shot",
            trailRate: enemy.archetypeId === "chlorineShade" ? 0.08 : 0
          });
        } else if ((enemy.category === "disruptor" || enemy.category === "boss") && enemy.attackTimer <= 0) {
          var shotCount = enemy.category === "boss" ? 8 : 5;
          enemy.attackTimer = enemy.category === "boss" ? 1.05 : 2.05;
          this.effects.spawnRing(enemy.x, enemy.y, {
            color: enemy.category === "boss" ? "#f6c453" : "#d5a2ff",
            radius: enemy.category === "boss" ? 18 : 12,
            growth: enemy.category === "boss" ? 68 : 42,
            lineWidth: enemy.category === "boss" ? 3 : 2,
            life: 0.18,
            fillAlpha: 0.05
          });
          for (var s = 0; s < shotCount; s += 1) {
            var burstAngle = (Math.PI * 2 * s) / shotCount;
            this.createEnemyShot(enemy, { x: Math.cos(burstAngle), y: Math.sin(burstAngle) }, {
              speed: enemy.category === "boss" ? 235 : 178,
              radius: enemy.category === "boss" ? 8 : 6,
              damage: Math.max(8, enemy.damage - 3),
              color: enemy.category === "boss" ? "#f6c453" : "#d5a2ff",
              kind: "burst",
              trailRate: enemy.category === "boss" ? 0.05 : 0.08,
              spin: enemy.category === "boss" ? 7 : 5
            });
          }
          this.effects.spawnHeatRipple(enemy.x, enemy.y, enemy.category === "boss" ? "#f6c453" : "#d5a2ff");
        }

        if (pointDistance(enemy.x, enemy.y, this.player.x, this.player.y) <= enemy.radius + this.player.radius) {
          this.damagePlayer(enemy.damage);
        }

        if (pointDistance(enemy.x, enemy.y, this.player.x, this.player.y) > DESPAWN_DISTANCE + 300) {
          this.enemies.splice(i, 1);
        }
      }
    }

    updatePickups(dt) {
      var i;
      for (i = this.pickups.length - 1; i >= 0; i -= 1) {
        var pickup = this.pickups[i];
        var dx = this.player.x - pickup.x;
        var dy = this.player.y - pickup.y;
        var distance = Math.sqrt(dx * dx + dy * dy) || 1;
        var pickupRange = this.player.pickupRange + (this.player.loveAuraTimer > 0 ? 124 : 0);
        var moveSpeed = pickup.kind === "chest" ? 320 : pickup.kind === "xp" ? 440 : 380;

        pickup.life -= dt;
        if (pickup.life <= 0) {
          this.pickups.splice(i, 1);
          continue;
        }

        if (distance <= pickupRange) {
          pickup.x += (dx / distance) * moveSpeed * dt;
          pickup.y += (dy / distance) * moveSpeed * dt;
        }

        if (distance <= pickup.radius + this.player.radius) {
          this.effects.spawnPickupTrail(pickup.x, pickup.y, this.player.x, this.player.y, pickup.color);
          this.applyPickupEffect(pickup);
          this.pickups.splice(i, 1);
        }
      }
    }

    finishRun(reason) {
      var survivorState = this.game.state.survivor || {};
      var previousUnlocked;
      var nextUnlocked;
      if (this.runEnded) {
        return;
      }
      this.runEnded = true;
      this.endReason = reason;
      survivorState.totalRuns = (survivorState.totalRuns || 0) + 1;
      survivorState.bestTimeSec = Math.max(survivorState.bestTimeSec || 0, Math.floor(this.elapsedSec));
      survivorState.bestLevel = Math.max(survivorState.bestLevel || 1, this.player.level);
      survivorState.bestKills = Math.max(survivorState.bestKills || 0, this.player.kills);
      survivorState.lastStageId = this.stageId;
      survivorState.lastRank = this.hazardRank;
      previousUnlocked = typeof survivorState.unlockedRank === "number" ? survivorState.unlockedRank : 0;
      nextUnlocked = calculateUnlockedRank(
        survivorState.bestTimeSec,
        survivorState.bestLevel,
        previousUnlocked,
        this.hazardRank,
        reason === "CLEARED"
      );
      survivorState.unlockedRank = nextUnlocked;
      this.game.state.survivor = survivorState;
      this.game.saveState();
      this.effects.flashScreen(reason === "CLEARED" ? "#88f291" : "#ff8a70", 0.16, 0.3);
      this.effects.triggerShake(reason === "CLEARED" ? 9 : 7, 0.3);
      if (nextUnlocked > previousUnlocked) {
        if (this.game.audio && this.game.audio.playPickupCue) {
          this.game.audio.playPickupCue("rankUnlocked");
        }
        this.pushMessage(translate(this.game, "survivor.rankUnlocked", { rank: nextUnlocked }), 1.8, "#ffe07a");
      }
    }

    updateMessages(dt) {
      var i;
      for (i = this.messages.length - 1; i >= 0; i -= 1) {
        this.messages[i].life -= dt;
        if (this.messages[i].life <= 0) {
          this.messages.splice(i, 1);
        }
      }
    }

    updateBeamFx(dt) {
      var i;
      for (i = this.beamFx.length - 1; i >= 0; i -= 1) {
        this.beamFx[i].life -= dt;
        if (this.beamFx[i].life <= 0) {
          this.beamFx.splice(i, 1);
        }
      }
    }

    update(dt, input) {
      var uiAction = this.handleUiButtons(input);
      var spawnResult;

      if (uiAction === "restart" || uiAction === "title") {
        return;
      }

      if (input.wasPressed("cancel") && !this.levelUpChoices && !this.merchant.open) {
        this.game.restartSurvivor();
        return;
      }

      if (input.wasPressed("menu") && !this.levelUpChoices && !this.merchant.open && !this.runEnded) {
        this.paused = !this.paused;
      }

      if (this.levelUpChoices) {
        this.handleLevelUpInput(input);
        this.effects.update(dt * 0.3);
        this.updateMessages(dt);
        this.updateBeamFx(dt * 0.3);
        return;
      }

      if (this.merchant.open) {
        this.handleMerchantInput(input);
        this.effects.update(dt * 0.3);
        this.updateMessages(dt);
        this.updateBeamFx(dt * 0.3);
        return;
      }

      if (this.runEnded) {
        this.effects.update(dt);
        this.updateMessages(dt);
        this.updateBeamFx(dt);
        if ((input.wasPressed("confirm") || input.wasPointerPressed()) && !this.pointerCapturedByUi) {
          this.game.restartSurvivor();
        }
        return;
      }

      if (this.paused) {
        this.effects.update(dt * 0.25);
        this.updateMessages(dt);
        this.updateBeamFx(dt * 0.25);
        return;
      }

      this.elapsedSec += dt;
      this.updatePlayer(dt, input);
      this.updateCamera(dt);
      this.updateMerchant(dt);

      spawnResult = this.spawner.update(dt, {
        elapsedSec: this.elapsedSec,
        player: this.player,
        enemies: this.enemies,
        hazardRank: this.hazardRank,
        view: this.getViewRect()
      });

      this.handleSpawnerResult(spawnResult);
      this.updateOrbitDamage(dt);
      this.updateProjectiles(dt);
      this.updateEnemies(dt);
      this.updatePickups(dt);
      this.effects.update(dt);
      this.updateMessages(dt);
      this.updateBeamFx(dt);

      if (this.pendingLevelUps > 0 && !this.levelUpChoices) {
        this.openLevelUpChoices();
      }

      if (this.elapsedSec >= RUN_LENGTH_SEC && !this.enemies.length) {
        this.finishRun("CLEARED");
      }
    }

    drawBackground(renderer, shake) {
      var ctx = renderer.ctx;
      var theme = this.stageTheme;
      var tile = 96;
      var startTileX = Math.floor(this.camera.x / tile) - 2;
      var endTileX = Math.floor((this.camera.x + ns.constants.GAME_WIDTH) / tile) + 2;
      var startTileY = Math.floor(this.camera.y / tile) - 2;
      var endTileY = Math.floor((this.camera.y + ns.constants.GAME_HEIGHT) / tile) + 2;
      var tx;
      var ty;

      renderer.clear(theme.bg);
      ctx.save();
      ctx.translate(shake.x, shake.y);

      for (ty = startTileY; ty <= endTileY; ty += 1) {
        for (tx = startTileX; tx <= endTileX; tx += 1) {
          var worldX = tx * tile;
          var worldY = ty * tile;
          var screenX = worldX - this.camera.x;
          var screenY = worldY - this.camera.y;
          var h = hash2d(tx, ty);

          ctx.fillStyle = ((tx + ty) % 2 === 0) ? theme.tileA : theme.tileB;
          ctx.fillRect(screenX, screenY, tile, tile);
          ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
          ctx.fillRect(screenX + 6, screenY + 6, 10, 10);

          if (this.stageId === "poolSide") {
            ctx.fillStyle = h > 0.62 ? "rgba(223, 252, 255, 0.22)" : "rgba(47, 109, 141, 0.15)";
            ctx.fillRect(screenX + 12, screenY + 40, tile - 24, 6);
            ctx.fillRect(screenX + 12, screenY + 68, tile - 24, 4);
          } else if (this.stageId === "clockTower") {
            ctx.strokeStyle = "rgba(214, 208, 255, 0.08)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(screenX + tile / 2, screenY + tile / 2, tile * 0.18, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(screenX + tile / 2, screenY + 18);
            ctx.lineTo(screenX + tile / 2, screenY + tile - 18);
            ctx.moveTo(screenX + 18, screenY + tile / 2);
            ctx.lineTo(screenX + tile - 18, screenY + tile / 2);
            ctx.stroke();
          } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
            ctx.fillRect(screenX + 8, screenY + tile - 16, tile - 16, 4);
          }

          if (h > 0.82) {
            ctx.fillStyle = theme.prop;
            ctx.fillRect(screenX + 18, screenY + 18, 18, 18);
            ctx.fillRect(screenX + 60, screenY + 54, 12, 12);
          } else if (h < 0.12) {
            ctx.fillStyle = theme.glow;
            ctx.globalAlpha = 0.12;
            ctx.beginPath();
            ctx.arc(screenX + tile / 2, screenY + tile / 2, 10 + h * 26, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      }

      ctx.fillStyle = theme.lane;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(-40, ns.constants.GAME_HEIGHT * 0.5 - 14, ns.constants.GAME_WIDTH + 80, 28);
      ctx.fillRect(ns.constants.GAME_WIDTH * 0.5 - 10, -40, 20, ns.constants.GAME_HEIGHT + 80);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    drawButtons(renderer) {
      var buttons = this.getActionButtons();
      var pointer = this.game.input.getPointer();
      var i;
      for (i = 0; i < buttons.length; i += 1) {
        var hovered = pointer.inside && pointInRect(pointer, buttons[i]);
        renderer.drawPanel(buttons[i].x, buttons[i].y, buttons[i].width, buttons[i].height, {
          fill: hovered ? "rgba(18, 18, 18, 0.96)" : "rgba(8, 8, 8, 0.86)",
          border: buttons[i].border
        });
        renderer.drawText(buttons[i].label, buttons[i].x + buttons[i].width / 2, buttons[i].y + 10, {
          size: 18,
          align: "center",
          color: buttons[i].border
        });
      }
    }

    drawTouchStick(renderer, input) {
      var pointer = input.getPointer();
      var ctx = renderer.ctx;
      var originX;
      var originY;
      var knobX;
      var knobY;

      if (!(pointer.down && (pointer.type === "touch" || pointer.type === "pen"))) {
        return;
      }

      originX = pointer.startX;
      originY = pointer.startY;
      knobX = originX + clamp(pointer.deltaX, -52, 52);
      knobY = originY + clamp(pointer.deltaY, -52, 52);

      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = "#f4f0da";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(originX, originY, 52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.beginPath();
      ctx.arc(originX, originY, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffb347";
      ctx.beginPath();
      ctx.arc(knobX, knobY, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawMouseCursor(renderer, input) {
      var pointer = input.getPointer();
      var ctx = renderer.ctx;
      if (!pointer.inside || pointer.type !== "mouse") {
        return;
      }
      ctx.save();
      ctx.strokeStyle = "#f6c453";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pointer.x - 18, pointer.y);
      ctx.lineTo(pointer.x - 6, pointer.y);
      ctx.moveTo(pointer.x + 6, pointer.y);
      ctx.lineTo(pointer.x + 18, pointer.y);
      ctx.moveTo(pointer.x, pointer.y - 18);
      ctx.lineTo(pointer.x, pointer.y - 6);
      ctx.moveTo(pointer.x, pointer.y + 6);
      ctx.lineTo(pointer.x, pointer.y + 18);
      ctx.stroke();
      ctx.restore();
    }

    drawWorld(renderer, input) {
      var ctx = renderer.ctx;
      var shake = this.effects.getShakeOffset();
      var i;
      var moveMagnitude = Math.sqrt(this.player.vx * this.player.vx + this.player.vy * this.player.vy);

      this.drawBackground(renderer, shake);

      for (i = 0; i < this.pickups.length; i += 1) {
        var pickupScreen = this.worldToScreen(this.pickups[i].x, this.pickups[i].y, shake);
        if (pickupScreen.x < -40 || pickupScreen.y < -40 || pickupScreen.x > ns.constants.GAME_WIDTH + 40 || pickupScreen.y > ns.constants.GAME_HEIGHT + 40) {
          continue;
        }
        this.drawPickupSprite(ctx, this.pickups[i], pickupScreen.x, pickupScreen.y);
      }

      for (i = 0; i < this.projectiles.length; i += 1) {
        var shotScreen = this.worldToScreen(this.projectiles[i].x, this.projectiles[i].y, shake);
        ctx.save();
        ctx.translate(shotScreen.x, shotScreen.y);
        ctx.rotate(this.elapsedSec * 10);
        ctx.fillStyle = this.projectiles[i].color;
        ctx.fillRect(-this.projectiles[i].radius, -this.projectiles[i].radius, this.projectiles[i].radius * 2, this.projectiles[i].radius * 2);
        ctx.restore();
      }

      for (i = 0; i < this.enemyProjectiles.length; i += 1) {
        var enemyShotScreen = this.worldToScreen(this.enemyProjectiles[i].x, this.enemyProjectiles[i].y, shake);
        this.drawEnemyProjectile(ctx, this.enemyProjectiles[i], enemyShotScreen.x, enemyShotScreen.y);
      }

      for (i = 0; i < this.beamFx.length; i += 1) {
        var beam = this.beamFx[i];
        var start = this.worldToScreen(beam.x1, beam.y1, shake);
        var end = this.worldToScreen(beam.x2, beam.y2, shake);
        ctx.save();
        ctx.strokeStyle = beam.color;
        ctx.lineWidth = beam.width * (beam.life / 0.16);
        ctx.globalAlpha = beam.life / 0.16;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.restore();
      }

      for (i = 0; i < this.enemies.length; i += 1) {
        var enemy = this.enemies[i];
        var enemyScreen = this.worldToScreen(enemy.x, enemy.y, shake);
        if (enemyScreen.x < -80 || enemyScreen.y < -80 || enemyScreen.x > ns.constants.GAME_WIDTH + 80 || enemyScreen.y > ns.constants.GAME_HEIGHT + 80) {
          continue;
        }
        renderer.drawSurvivorEnemySprite(enemy, enemyScreen.x, enemyScreen.y, {
          pulse: this.elapsedSec * 5
        });

        if (enemy.category === "boss" || enemy.category === "elite") {
          var hpWidth = enemy.radius * 2.2;
          var hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 0;
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          ctx.fillRect(enemyScreen.x - enemy.radius, enemyScreen.y - enemy.radius - 13, hpWidth, 5);
          ctx.fillStyle = enemy.category === "boss" ? "#fff1c4" : "#ffddb0";
          ctx.fillRect(enemyScreen.x - enemy.radius, enemyScreen.y - enemy.radius - 13, hpWidth * hpRatio, 5);
        }
      }

      if (this.merchant.active) {
        var merchantScreen = this.worldToScreen(this.merchant.x, this.merchant.y, shake);
        renderer.drawPixelSprite({
          x: merchantScreen.x - 38,
          y: merchantScreen.y - 56,
          width: 76,
          height: 112
        }, "shop", {
          moving: false,
          border: "#ff91d7"
        });
        ctx.strokeStyle = "#ff91d7";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(merchantScreen.x, merchantScreen.y + 14, 24 + Math.sin(this.elapsedSec * 5) * 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (i = 0; i < this.orbitRender.length; i += 1) {
        var orbScreen = this.worldToScreen(this.orbitRender[i].x, this.orbitRender[i].y, shake);
        ctx.fillStyle = "#8ff7ff";
        ctx.beginPath();
        ctx.arc(orbScreen.x, orbScreen.y, this.orbitRender[i].radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#dffbff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      for (i = 0; i < this.droneRender.length; i += 1) {
        var droneScreen = this.worldToScreen(this.droneRender[i].x, this.droneRender[i].y, shake);
        ctx.save();
        ctx.translate(droneScreen.x, droneScreen.y);
        ctx.fillStyle = "#9fd4ff";
        ctx.fillRect(-8, -8, 16, 16);
        ctx.fillStyle = "#dff2ff";
        ctx.fillRect(-3, -3, 6, 6);
        ctx.fillStyle = "#4a5d80";
        ctx.fillRect(-12, -3, 4, 6);
        ctx.fillRect(8, -3, 4, 6);
        ctx.restore();
      }

      var playerScreen = this.getPlayerScreenPoint(shake);
      if (this.skinDef && this.skinDef.auraColor) {
        ctx.save();
        ctx.strokeStyle = this.skinDef.auraColor;
        ctx.globalAlpha = this.skinId === "noonAwakening" ? 0.34 : 0.2;
        ctx.lineWidth = this.skinId === "noonAwakening" ? 4 : 2;
        ctx.beginPath();
        ctx.arc(playerScreen.x, playerScreen.y + 8, this.player.radius + 10 + Math.sin(this.elapsedSec * 5) * 2, 0, Math.PI * 2);
        ctx.stroke();
        if (this.skinId === "summerFestival") {
          ctx.fillStyle = "#ff9c4b";
          ctx.fillRect(playerScreen.x - 18, playerScreen.y - 40 + Math.sin(this.elapsedSec * 6) * 3, 4, 4);
          ctx.fillRect(playerScreen.x + 14, playerScreen.y - 34 + Math.cos(this.elapsedSec * 5) * 3, 4, 4);
        } else if (this.skinId === "poolMonitor") {
          ctx.fillStyle = "#dffbff";
          ctx.fillRect(playerScreen.x - 16, playerScreen.y - 28, 3, 3);
          ctx.fillRect(playerScreen.x + 13, playerScreen.y - 24, 3, 3);
        }
        ctx.restore();
      }
      renderer.drawPixelSprite({
        x: playerScreen.x - 42,
        y: playerScreen.y - 60,
        width: 84,
        height: 120
      }, "senpai", {
        variant: this.skinId,
        moving: moveMagnitude > 40,
        walkPhase: this.elapsedSec * (8 + moveMagnitude / 60),
        border: this.playerHitTimer > 0 ? "#ffd1d6" : (this.skinDef && this.skinDef.color) || "#ffffff"
      });

      if (this.playerHitTimer > 0) {
        ctx.strokeStyle = "#ffd1d6";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(playerScreen.x, playerScreen.y, this.player.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      this.effects.draw(renderer, {
        offsetX: this.camera.x - shake.x,
        offsetY: this.camera.y - shake.y
      });
      this.drawMouseCursor(renderer, input);
    }

    drawBuildIcons(renderer, x, y, columns, size) {
      var acquired = this.acquiredUpgrades.slice(0, 8);
      var i;
      for (i = 0; i < acquired.length; i += 1) {
        var col = i % columns;
        var row = Math.floor(i / columns);
        var px = x + col * (size + 10);
        var py = y + row * (size + 10);
        drawUpgradeIcon(renderer.ctx, acquired[i], px, py, size);
        renderer.drawText(String(this.getUpgradeLevel(acquired[i])), px + size - 12, py + size - 18, {
          size: 14,
          color: "#f4f0da",
          align: "center"
        });
      }
    }

    drawDesktopHud(renderer) {
      var survivorState = this.game.state.survivor || {};
      var xpRatio = this.player.xpForNext > 0 ? this.player.xp / this.player.xpForNext : 0;
      var hpRatio = this.player.maxHp > 0 ? this.player.hp / this.player.maxHp : 0;
      var panelX = 16;
      var panelY = 16;
      var statLines;
      var i;

      renderer.drawPanel(panelX, panelY, 246, 252, {
        fill: "rgba(10, 10, 10, 0.9)",
        border: this.stageTheme.accent
      });
      renderer.drawText(translate(this.game, "survivor.title"), panelX + 18, panelY + 16, {
        size: 24,
        color: this.stageTheme.accent
      });
      renderer.drawText(formatTime(this.elapsedSec), panelX + 18, panelY + 46, {
        size: 38,
        color: "#f4f0da"
      });
      renderer.drawText(translate(this.game, "common.level") + " " + this.player.level + "   " + translate(this.game, "common.kills") + " " + this.player.kills, panelX + 18, panelY + 92, {
        size: 18,
        color: "#f4f0da"
      });
      renderer.drawText(translate(this.game, "common.best") + " " + formatTime(survivorState.bestTimeSec || 0), panelX + 18, panelY + 118, {
        size: 16,
        color: "#d6d0ff"
      });
      renderer.drawText(translate(this.game, "common.coins") + " " + this.player.coins, panelX + 128, panelY + 118, {
        size: 16,
        color: "#f6c453"
      });

      renderer.drawText(translate(this.game, "common.hp"), panelX + 18, panelY + 146, { size: 16, color: "#ffb0a6" });
      renderer.ctx.fillStyle = "rgba(255,255,255,0.08)";
      renderer.ctx.fillRect(panelX + 58, panelY + 150, 166, 14);
      renderer.ctx.fillStyle = "#ff8a70";
      renderer.ctx.fillRect(panelX + 58, panelY + 150, 166 * hpRatio, 14);

      renderer.drawText(translate(this.game, "common.xp"), panelX + 18, panelY + 176, { size: 16, color: "#bdf5c1" });
      renderer.ctx.fillStyle = "rgba(255,255,255,0.08)";
      renderer.ctx.fillRect(panelX + 58, panelY + 180, 166, 14);
      renderer.ctx.fillStyle = "#88f291";
      renderer.ctx.fillRect(panelX + 58, panelY + 180, 166 * xpRatio, 14);

      statLines = [
        translate(this.game, "common.atk") + " " + this.player.damage,
        translate(this.game, "common.spd") + " " + this.player.speed,
        translate(this.game, "common.mag") + " " + this.player.pickupRange,
        translate(this.game, "common.arm") + " " + this.player.armor.toFixed(1),
        translate(this.game, "common.phase") + " " + this.game.phaseName(this.lastPhaseId || "opening")
      ];
      for (i = 0; i < statLines.length; i += 1) {
        renderer.drawText(statLines[i], panelX + 18, panelY + 208 + i * 16, {
          size: 14,
          color: i === 4 ? this.stageTheme.accent : "#d8c8a4"
        });
      }

      renderer.drawPanel(panelX, 280, 246, 164, {
        fill: "rgba(10, 10, 10, 0.9)",
        border: "#5f4423"
      });
      renderer.drawText(translate(this.game, "common.build"), panelX + 18, 296, {
        size: 18,
        color: "#f4e0b6"
      });
      this.drawBuildIcons(renderer, panelX + 18, 326, 4, 44);

      renderer.drawPanel(278, 16, 220, 86, {
        fill: "rgba(10, 10, 10, 0.88)",
        border: "#5f4423"
      });
      renderer.drawText(this.game.stageName(this.stageId), 296, 30, {
        size: 20,
        color: this.stageTheme.accent
      });
      renderer.drawText(translate(this.game, "buttons.rank") + " " + this.hazardRank + " / " + translate(this.game, "common.surviveGoal"), 296, 62, {
        size: 16,
        color: "#f4f0da"
      });
    }

    drawMobileHud(renderer) {
      var xpRatio = this.player.xpForNext > 0 ? this.player.xp / this.player.xpForNext : 0;
      var hpRatio = this.player.maxHp > 0 ? this.player.hp / this.player.maxHp : 0;

      renderer.drawPanel(16, 16, 456, 112, {
        fill: "rgba(10, 10, 10, 0.88)",
        border: this.stageTheme.accent
      });
      renderer.drawText(translate(this.game, "survivor.title") + " " + formatTime(this.elapsedSec), 34, 28, {
        size: 34,
        color: this.stageTheme.accent
      });
      renderer.drawText(translate(this.game, "common.level") + " " + this.player.level + "  " + translate(this.game, "common.kills") + " " + this.player.kills, 34, 66, {
        size: 20,
        color: "#f4f0da"
      });
      renderer.drawText(translate(this.game, "common.coins") + " " + this.player.coins, 34, 92, {
        size: 18,
        color: "#f6c453"
      });
      renderer.ctx.fillStyle = "rgba(255,255,255,0.08)";
      renderer.ctx.fillRect(260, 42, 188, 14);
      renderer.ctx.fillRect(260, 78, 188, 14);
      renderer.ctx.fillStyle = "#ff8a70";
      renderer.ctx.fillRect(260, 42, 188 * hpRatio, 14);
      renderer.ctx.fillStyle = "#88f291";
      renderer.ctx.fillRect(260, 78, 188 * xpRatio, 14);
      renderer.drawText(translate(this.game, "common.hp"), 220, 36, { size: 16, color: "#ffb0a6" });
      renderer.drawText(translate(this.game, "common.xp"), 220, 72, { size: 16, color: "#bdf5c1" });
    }

    drawMessages(renderer) {
      var i;
      for (i = 0; i < this.messages.length; i += 1) {
        var message = this.messages[i];
        renderer.drawText(message.text, ns.constants.GAME_WIDTH * 0.5, 104 + i * 26, {
          size: this.isTouchUi ? 24 : 20,
          align: "center",
          color: message.color,
          shadow: true
        });
      }
    }

    drawControlsHint(renderer) {
      var hint = this.isTouchUi
        ? translate(this.game, "survivor.touchHint")
        : translate(this.game, "survivor.desktopHint");
      renderer.drawText(hint, ns.constants.GAME_WIDTH * 0.5, ns.constants.GAME_HEIGHT - 34, {
        size: this.isTouchUi ? 20 : 18,
        align: "center",
        color: "#d2c7a9"
      });
    }

    drawPauseOverlay(renderer) {
      renderer.drawPanel(220, 238, 520, 188, {
        fill: "rgba(5, 5, 5, 0.94)",
        border: "#7fe6ff"
      });
      renderer.drawCenteredText(translate(this.game, "survivor.paused"), 270, {
        size: 42,
        color: "#7fe6ff",
        shadow: true
      });
      renderer.drawCenteredText(translate(this.game, "survivor.pauseResume"), 336, {
        size: 24,
        color: "#f4f0da"
      });
      renderer.drawCenteredText(translate(this.game, "survivor.pauseRestart"), 372, {
        size: 24,
        color: "#d9d1ff"
      });
    }

    drawEndOverlay(renderer) {
      renderer.drawPanel(200, 214, 560, 228, {
        fill: "rgba(5, 5, 5, 0.94)",
        border: this.endReason === "CLEARED" ? "#88f291" : "#ff8a70"
      });
      renderer.drawCenteredText(this.endReason === "CLEARED" ? translate(this.game, "survivor.runCleared") : translate(this.game, "survivor.runOver"), 246, {
        size: 42,
        color: this.endReason === "CLEARED" ? "#88f291" : "#ff8a70",
        shadow: true
      });
      renderer.drawCenteredText(
        translate(this.game, "common.time") + " " + formatTime(this.elapsedSec) +
        "  " + translate(this.game, "common.level") + " " + this.player.level +
        "  " + translate(this.game, "common.kills") + " " + this.player.kills,
        312,
        { size: 24, color: "#f4f0da" }
      );
      renderer.drawCenteredText(translate(this.game, "survivor.retryHint"), 372, {
        size: 24,
        color: "#d2c7a9"
      });
    }

    drawLevelUpOverlay(renderer) {
      var ctx = renderer.ctx;
      var panelX = 92;
      var leftWidth = 246;
      var cardX = ns.constants.GAME_WIDTH - LEVELUP_CARD_WIDTH - 74;
      var cardY = 164;
      var i;

      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
      ctx.fillRect(0, 0, ns.constants.GAME_WIDTH, ns.constants.GAME_HEIGHT);
      ctx.restore();

      renderer.drawPanel(panelX, 124, leftWidth, 462, {
        fill: "rgba(18, 22, 30, 0.96)",
        border: "#6a90b0"
      });
      renderer.drawText(translate(this.game, "common.build"), panelX + 18, 144, { size: 24, color: "#d6d0ff" });
      renderer.drawText(translate(this.game, "common.level") + " " + this.player.level, panelX + 18, 178, { size: 18, color: "#f4f0da" });
      renderer.drawText(translate(this.game, "common.atk") + " " + this.player.damage, panelX + 18, 206, { size: 18, color: "#f4f0da" });
      renderer.drawText(translate(this.game, "common.spd") + " " + this.player.speed, panelX + 18, 234, { size: 18, color: "#f4f0da" });
      renderer.drawText(translate(this.game, "common.mag") + " " + this.player.pickupRange, panelX + 18, 262, { size: 18, color: "#f4f0da" });
      this.drawBuildIcons(renderer, panelX + 18, 300, 3, 58);

      renderer.drawPanel(360, 94, 526, 520, {
        fill: "rgba(40, 44, 72, 0.94)",
        border: "#d6d0ff"
      });
      renderer.drawCenteredText(translate(this.game, "common.levelUp"), 120, {
        size: 44,
        color: "#ffffff",
        shadow: true
      });
      renderer.drawCenteredText(translate(this.game, "common.chooseBuildPiece"), 168, {
        size: 22,
        color: "#f4f0da"
      });

      for (i = 0; i < this.levelUpChoices.length; i += 1) {
        var upgradeId = this.levelUpChoices[i];
        var def = UPGRADE_CATALOG[upgradeId];
        var currentLevel = this.getUpgradeLevel(upgradeId);
        var hovered = i === this.levelUpHover;
        var selected = i === this.levelUpSelected;
        var cardRectY = cardY + i * (LEVELUP_CARD_HEIGHT + 16);
        renderer.drawPanel(cardX, cardRectY, LEVELUP_CARD_WIDTH, LEVELUP_CARD_HEIGHT, {
          fill: selected || hovered ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.26)",
          border: selected ? def.color : hovered ? "#fff1c4" : "rgba(255,255,255,0.12)"
        });
        drawUpgradeIcon(ctx, upgradeId, cardX + 18, cardRectY + 24, 68, def.color);
        renderer.drawText(getUpgradeName(this.game, upgradeId), cardX + 104, cardRectY + 18, {
          size: 28,
          color: def.color
        });
        renderer.drawText(currentLevel === 0 ? translate(this.game, "common.new") : translate(this.game, "common.level") + " " + (currentLevel + 1), cardX + LEVELUP_CARD_WIDTH - 18, cardRectY + 22, {
          size: 18,
          align: "right",
          color: currentLevel === 0 ? "#fff1c4" : "#f4f0da"
        });
        renderer.drawParagraph(getUpgradeDescription(this.game, upgradeId, currentLevel + 1), cardX + 104, cardRectY + 56, 286, {
          size: 18,
          lineHeight: 26,
          color: "#f4f0da"
        });
      }

      renderer.drawCenteredText(translate(this.game, "common.chooseConfirm"), 556, {
        size: 20,
        color: "#d8c8a4"
      });
    }

    drawMerchantOverlay(renderer) {
      var ctx = renderer.ctx;
      var panelX = 182;
      var panelY = 132;
      var i;

      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
      ctx.fillRect(0, 0, ns.constants.GAME_WIDTH, ns.constants.GAME_HEIGHT);
      ctx.restore();

      renderer.drawPanel(panelX, panelY, 596, 458, {
        fill: "rgba(30, 18, 24, 0.96)",
        border: "#ff91d7"
      });
      renderer.drawText(this.game.getLocale() === "ja" ? "5:00 商人" : "5:00 MERCHANT", panelX + 24, panelY + 20, {
        size: 38,
        color: "#ff91d7",
        shadow: true
      });
      renderer.drawText(translate(this.game, "common.coins") + " " + this.player.coins, panelX + 420, panelY + 26, {
        size: 24,
        color: "#f6c453"
      });
      renderer.drawParagraph(translate(this.game, "survivor.merchantHint"), panelX + 24, panelY + 74, 526, {
        size: 18,
        lineHeight: 26,
        color: "#f4e0b6"
      });

      renderer.drawPanel(panelX + 24, panelY + 126, 196, 268, {
        fill: "rgba(10, 10, 10, 0.92)",
        border: "#6a4b27"
      });
      renderer.drawPixelSprite({
        x: panelX + 62,
        y: panelY + 146,
        width: 120,
        height: 180
      }, "shop", {
        border: "#ff91d7"
      });
      renderer.drawText(this.game.getLocale() === "ja" ? "真夏町商人" : "Midsummer Merchant", panelX + 122, panelY + 334, {
        size: 22,
        align: "center",
        color: "#f4f0da"
      });

      for (i = 0; i < this.merchant.offers.length; i += 1) {
        var offer = this.merchant.offers[i];
        var rowY = panelY + 126 + i * 66;
        var selected = i === this.merchant.selected;
        var hovered = i === this.merchant.hover;
        renderer.drawPanel(panelX + 244, rowY, 498, 58, {
          fill: selected || hovered ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.22)",
          border: offer.soldOut ? "#5a5048" : selected ? offer.color : hovered ? "#fff1c4" : "#5f4423"
        });
        renderer.drawText(offer.label, panelX + 264, rowY + 12, {
          size: 22,
          color: offer.soldOut ? "#8d7e66" : (offer.color || "#f4f0da")
        });
        renderer.drawText(offer.soldOut ? (this.game.getLocale() === "ja" ? "売り切れ" : "SOLD") : String(offer.cost), panelX + 718, rowY + 14, {
          size: 18,
          align: "right",
          color: offer.soldOut ? "#8d7e66" : "#f6c453"
        });
        renderer.drawText(offer.desc, panelX + 264, rowY + 34, {
          size: 15,
          color: "#f4e0b6"
        });
      }

      renderer.drawPanel(650, 566, 128, 46, {
        fill: "rgba(8, 8, 8, 0.92)",
        border: "#d6d0ff"
      });
      renderer.drawText(this.game.t("buttons.leave"), 714, 578, {
        size: 18,
        align: "center",
        color: "#d6d0ff"
      });
    }

    draw(renderer) {
      var input = this.game.input;
      this.drawWorld(renderer, input);
      this.drawButtons(renderer);
      if (this.isTouchUi) {
        this.drawMobileHud(renderer);
      } else {
        this.drawDesktopHud(renderer);
      }
      this.drawMessages(renderer);
      this.drawControlsHint(renderer);
      this.drawTouchStick(renderer, input);
      if (this.paused && !this.runEnded && !this.levelUpChoices) {
        this.drawPauseOverlay(renderer);
      }
      if (this.runEnded) {
        this.drawEndOverlay(renderer);
      }
      if (this.levelUpChoices) {
        this.drawLevelUpOverlay(renderer);
      }
      if (this.merchant.open) {
        this.drawMerchantOverlay(renderer);
      }
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
