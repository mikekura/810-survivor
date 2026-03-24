(function (ns) {
  var RUN_LENGTH_SEC = 20 * 60;
  var INFINITY_SCORE_STEP = 81000;
  var SPECIAL_SCORE_STEP = 114514;
  var ENDLESS_LOOP_START_SEC = 8 * 60;
  var ENDLESS_LOOP_RANGE_SEC = RUN_LENGTH_SEC - ENDLESS_LOOP_START_SEC - 8;
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
    heatSink: { color: "#ff9f76", maxLevel: 4, weight: 5 },
    neonNeedle: { color: "#9fc8ff", maxLevel: 5, weight: 6 },
    meteorCall: { color: "#ff9a76", maxLevel: 5, weight: 5 },
    haloSigil: { color: "#d7c8ff", maxLevel: 5, weight: 5 },
    summerSword: { color: "#ffe7a6", maxLevel: 5, weight: 6 },
    breakerAxe: { color: "#ffc38f", maxLevel: 5, weight: 5 },
    mysticWand: { color: "#c9b2ff", maxLevel: 5, weight: 6 },
    thunderChain: { color: "#b8c7ff", maxLevel: 5, weight: 5 },
    blizzardFan: { color: "#9feeff", maxLevel: 5, weight: 5 },
    crossLance: { color: "#ffc68f", maxLevel: 5, weight: 5 },
    boomerangDisc: { color: "#ffe07a", maxLevel: 5, weight: 5 },
    petalStorm: { color: "#ff9fd6", maxLevel: 5, weight: 5 },
    cometTrail: { color: "#9fc8ff", maxLevel: 5, weight: 5 },
    vitalBloom: { color: "#9cffb8", maxLevel: 4, weight: 4 },
    overclockLoop: { color: "#ffd28a", maxLevel: 4, weight: 4 },
    emberFork: { color: "#ffb07a", maxLevel: 5, weight: 5 },
    prismRail: { color: "#b7c8ff", maxLevel: 5, weight: 5 },
    frostMine: { color: "#9feeff", maxLevel: 4, weight: 4 },
    spiralDrive: { color: "#ffa6dd", maxLevel: 5, weight: 5 }
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

  function formatScore(total) {
    return Math.max(0, Math.floor(total || 0)).toLocaleString();
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

  function angleDifference(a, b) {
    return Math.atan2(Math.sin(a - b), Math.cos(a - b));
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

  function mixColor(a, b, t) {
    var ratio = clamp(t, 0, 1);
    var ar = parseInt(a.slice(1, 3), 16);
    var ag = parseInt(a.slice(3, 5), 16);
    var ab = parseInt(a.slice(5, 7), 16);
    var br = parseInt(b.slice(1, 3), 16);
    var bg = parseInt(b.slice(3, 5), 16);
    var bb = parseInt(b.slice(5, 7), 16);
    var rr = Math.round(ar + (br - ar) * ratio).toString(16).padStart(2, "0");
    var rg = Math.round(ag + (bg - ag) * ratio).toString(16).padStart(2, "0");
    var rb = Math.round(ab + (bb - ab) * ratio).toString(16).padStart(2, "0");
    return "#" + rr + rg + rb;
  }

  function getStageShiftIndex(elapsedSec) {
    if (elapsedSec >= 15 * 60) {
      return 3;
    }
    if (elapsedSec >= 10 * 60) {
      return 2;
    }
    if (elapsedSec >= 5 * 60) {
      return 1;
    }
    return 0;
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

  function getTrueFusionRecipes() {
    return (ns.survivorMeta && ns.survivorMeta.trueFusionRecipes) || [];
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

  function findTrueFusionRecipeById(recipeId) {
    var recipes = getTrueFusionRecipes();
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
      case "thunderChain":
        ctx.beginPath();
        ctx.moveTo(left + inner * 0.24, top + inner * 0.16);
        ctx.lineTo(left + inner * 0.52, top + inner * 0.16);
        ctx.lineTo(left + inner * 0.4, top + inner * 0.44);
        ctx.lineTo(left + inner * 0.66, top + inner * 0.44);
        ctx.lineTo(left + inner * 0.3, top + inner * 0.86);
        ctx.lineTo(left + inner * 0.42, top + inner * 0.58);
        ctx.lineTo(left + inner * 0.22, top + inner * 0.58);
        ctx.closePath();
        ctx.fill();
        break;
      case "blizzardFan":
        ctx.beginPath();
        ctx.moveTo(centerX, top + inner * 0.12);
        ctx.lineTo(left + inner * 0.82, top + inner * 0.82);
        ctx.lineTo(left + inner * 0.18, top + inner * 0.82);
        ctx.closePath();
        ctx.fill();
        break;
      case "crossLance":
        ctx.fillRect(left + inner * 0.45, top + inner * 0.12, inner * 0.1, inner * 0.76);
        ctx.fillRect(left + inner * 0.12, top + inner * 0.45, inner * 0.76, inner * 0.1);
        break;
      case "boomerangDisc":
        ctx.beginPath();
        ctx.arc(centerX, centerY, inner * 0.28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerX + inner * 0.16, centerY, inner * 0.08, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "petalStorm":
        ctx.beginPath();
        ctx.arc(centerX, centerY - inner * 0.18, inner * 0.12, 0, Math.PI * 2);
        ctx.arc(centerX + inner * 0.18, centerY, inner * 0.12, 0, Math.PI * 2);
        ctx.arc(centerX, centerY + inner * 0.18, inner * 0.12, 0, Math.PI * 2);
        ctx.arc(centerX - inner * 0.18, centerY, inner * 0.12, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "cometTrail":
        ctx.beginPath();
        ctx.moveTo(left + inner * 0.18, top + inner * 0.72);
        ctx.lineTo(left + inner * 0.76, top + inner * 0.14);
        ctx.lineTo(left + inner * 0.86, top + inner * 0.28);
        ctx.lineTo(left + inner * 0.28, top + inner * 0.86);
        ctx.closePath();
        ctx.fill();
        break;
      case "vitalBloom":
        ctx.beginPath();
        ctx.arc(centerX, centerY, inner * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX, centerY, inner * 0.38, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case "overclockLoop":
        ctx.fillRect(left + inner * 0.24, top + inner * 0.24, inner * 0.18, inner * 0.52);
        ctx.fillRect(left + inner * 0.58, top + inner * 0.24, inner * 0.18, inner * 0.52);
        ctx.fillRect(left + inner * 0.18, top + inner * 0.46, inner * 0.64, inner * 0.1);
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
      case "neonNeedle":
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-0.55);
        ctx.fillRect(-inner * 0.24, -inner * 0.06, inner * 0.5, inner * 0.12);
        ctx.fillStyle = "#fff1c4";
        ctx.beginPath();
        ctx.moveTo(inner * 0.3, 0);
        ctx.lineTo(inner * 0.06, -inner * 0.12);
        ctx.lineTo(inner * 0.06, inner * 0.12);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;
      case "meteorCall":
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(centerX - inner * 0.22, top + inner * 0.18);
        ctx.lineTo(centerX + inner * 0.18, top + inner * 0.46);
        ctx.lineTo(centerX - inner * 0.04, top + inner * 0.74);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#fff1c4";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - inner * 0.28, top + inner * 0.1);
        ctx.lineTo(centerX + inner * 0.3, top + inner * 0.58);
        ctx.stroke();
        break;
      case "haloSigil":
        ctx.beginPath();
        ctx.arc(centerX, centerY, inner * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX, top + inner * 0.1);
        ctx.lineTo(centerX + inner * 0.1, centerY - inner * 0.08);
        ctx.lineTo(left + inner * 0.9, centerY);
        ctx.lineTo(centerX + inner * 0.1, centerY + inner * 0.08);
        ctx.lineTo(centerX, top + inner * 0.9);
        ctx.lineTo(centerX - inner * 0.1, centerY + inner * 0.08);
        ctx.lineTo(left + inner * 0.1, centerY);
        ctx.lineTo(centerX - inner * 0.1, centerY - inner * 0.08);
        ctx.closePath();
        ctx.stroke();
        break;
      case "summerSword":
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-0.8);
        ctx.fillRect(-inner * 0.06, -inner * 0.34, inner * 0.12, inner * 0.52);
        ctx.fillStyle = "#fff1c4";
        ctx.fillRect(-inner * 0.03, -inner * 0.3, inner * 0.06, inner * 0.42);
        ctx.fillStyle = color;
        ctx.fillRect(-inner * 0.18, inner * 0.16, inner * 0.36, inner * 0.08);
        ctx.restore();
        break;
      case "breakerAxe":
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-0.44);
        ctx.fillStyle = "#f0e7da";
        ctx.fillRect(-inner * 0.04, -inner * 0.34, inner * 0.08, inner * 0.62);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-inner * 0.06, -inner * 0.26);
        ctx.lineTo(inner * 0.28, -inner * 0.34);
        ctx.lineTo(inner * 0.34, -inner * 0.08);
        ctx.lineTo(inner * 0.02, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;
      case "mysticWand":
        ctx.fillRect(left + inner * 0.44, top + inner * 0.18, inner * 0.12, inner * 0.52);
        ctx.fillStyle = "#fff1c4";
        ctx.beginPath();
        ctx.arc(centerX, top + inner * 0.16, inner * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(centerX, top + inner * 0.03);
        ctx.lineTo(centerX + inner * 0.07, top + inner * 0.12);
        ctx.lineTo(centerX + inner * 0.18, top + inner * 0.15);
        ctx.lineTo(centerX + inner * 0.08, top + inner * 0.22);
        ctx.lineTo(centerX + inner * 0.12, top + inner * 0.32);
        ctx.lineTo(centerX, top + inner * 0.26);
        ctx.lineTo(centerX - inner * 0.12, top + inner * 0.32);
        ctx.lineTo(centerX - inner * 0.08, top + inner * 0.22);
        ctx.lineTo(centerX - inner * 0.18, top + inner * 0.15);
        ctx.lineTo(centerX - inner * 0.07, top + inner * 0.12);
        ctx.closePath();
        ctx.fill();
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
      this.mode = opts.mode === "bot" ? "bot" : opts.mode === "infinity" ? "infinity" : "normal";
      this.isBotMode = this.mode === "bot";
      this.isInfinityMode = this.mode === "infinity" || this.isBotMode;
      this.stageTheme = getStageTheme(this.stageId);
      theme = this.stageTheme;
      this.isTouchUi = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
      this.elapsedSec = 0;
      this.score = 0;
      this.scoreRemainder = 0;
      this.dangerTier = 0;
      this.stageShiftIndex = 0;
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
      this.haloRender = [];
      this.droneRender = [];
      this.beamFx = [];
      this.weaponFx = [];
      this.pendingLevelUps = 0;
      this.levelUpChoices = null;
      this.levelUpSelected = 0;
      this.levelUpHover = -1;
      this.upgradeLevels = {};
      this.acquiredUpgrades = [];
      this.camera = { x: 0, y: 0 };
      this.specialInventory = {};
      this.activeFusions = {};
      this.activeTrueFusions = {};
      this.specialItemCatalog = getSpecialItemCatalog();
      this.fusionRecipes = getFusionRecipes();
      this.trueFusionRecipes = getTrueFusionRecipes();
      this.merchantCatalog = getMerchantCatalog();
      this.botRelayIndex = typeof opts.botRelayIndex === "number" ? Math.max(0, Math.floor(opts.botRelayIndex)) : 0;
      this.botProfile = this.isBotMode && this.game.getSurvivorBotProfile ? this.game.getSurvivorBotProfile(this.botRelayIndex) : null;
      this.skinId = this.game.getSelectedSurvivorSkinId ? this.game.getSelectedSurvivorSkinId() : "classicSenpai";
      this.skinDef = this.game.getSelectedSurvivorSkin ? this.game.getSelectedSurvivorSkin() : null;
      if (this.botProfile && this.botProfile.skinId && this.game.getSurvivorSkin) {
        this.skinId = this.botProfile.skinId;
        this.skinDef = this.game.getSurvivorSkin(this.skinId) || this.skinDef;
      }
      this.skinStepTimer = 0;
      this.botState = {
        restartTimer: 2.6,
        wanderAngle: (this.botRelayIndex + 1) * 0.83,
        orbitSign: this.botProfile && this.botProfile.orbitSign === -1 ? -1 : 1
      };
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
        needleLevel: 0,
        meteorLevel: 0,
        haloLevel: 0,
        swordLevel: 0,
        axeLevel: 0,
        wandLevel: 0,
        thunderLevel: 0,
        blizzardLevel: 0,
        crossLevel: 0,
        boomerangLevel: 0,
        petalLevel: 0,
        cometTrailLevel: 0,
        vitalBloomLevel: 0,
        overclockLevel: 0,
        emberForkLevel: 0,
        prismRailLevel: 0,
        frostMineLevel: 0,
        spiralDriveLevel: 0,
        pulseCooldown: 1.2,
        beamCooldown: 2.0,
        droneCooldown: 0.45,
        afterimageCooldown: 0.2,
        needleCooldown: 0.2,
        meteorCooldown: 1.1,
        swordCooldown: 0.22,
        axeCooldown: 0.72,
        wandCooldown: 0.4,
        thunderCooldown: 0.7,
        blizzardCooldown: 0.6,
        crossCooldown: 0.8,
        boomerangCooldown: 0.9,
        petalCooldown: 1.1,
        cometTrailCooldown: 1.2,
        emberForkCooldown: 0.66,
        prismRailCooldown: 0.96,
        frostMineCooldown: 1.34,
        spiralDriveCooldown: 0.92,
        xpGainMultiplier: 1,
        specialCooldownFactor: 1,
        frenzyTimer: 0,
        shieldTimer: 0,
        loveAuraTimer: 0,
        loveAuraPulse: 0.6,
        vitalBloomPulse: 0.75,
        facingAngle: -Math.PI * 0.5
      };

      if (this.isBotMode) {
        this.player.xpForNext = 8;
      }

      this.refreshBuildStats(false);
      this.updateCamera(1);
      this.game.audio.playTrack("survivor");
      this.pushMessage(translate(this.game, "survivor.title"), 1.3, theme.accent);
      if (this.isInfinityMode) {
        this.pushMessage(translate(this.game, "survivor.infinityReady"), 1.4, "#7fe6ff");
      }
      if (this.isBotMode && this.botProfile) {
        this.pushMessage(this.getBotName(this.botProfile), 1.6, this.botProfile.color || "#ffe07a");
        this.pushMessage(getMetaText(this.game, this.botProfile, "intro"), 1.8, "#f4f0da");
      }
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

    getBotName(profile) {
      return getMetaText(this.game, profile || this.botProfile || {}, "name") || "";
    }

    getBotUpgradeBonus(upgradeId) {
      var favorites = this.botProfile && this.botProfile.favoriteUpgrades;
      return favorites && favorites.indexOf(upgradeId) >= 0 ? 1.9 : 1;
    }

    shouldShowXpProgress() {
      return true;
    }

    getBotEnemyPenalty(enemyId) {
      var hates = this.botProfile && this.botProfile.hatedEnemies;
      return hates && hates.indexOf(enemyId) >= 0 ? 1.5 : 1;
    }

    getSkinFx() {
      return (this.skinDef && this.skinDef.cosmetics) || null;
    }

    getSkinShotVisual(kind, fallbackColor) {
      var fx = this.getSkinFx();
      var shots = fx && fx.shots ? fx.shots : null;
      var profile = shots && (shots[kind] || shots.bullet);
      return {
        color: (profile && profile.color) || fallbackColor || "#7fe6ff",
        trailColor: (profile && profile.trailColor) || fallbackColor || "#7fe6ff",
        accentColor: (profile && profile.accentColor) || "#ffffff",
        trailRate: profile && typeof profile.trailRate === "number" ? profile.trailRate : 0,
        shape: (profile && profile.shape) || "square",
        spin: profile && typeof profile.spin === "number" ? profile.spin : 8,
        rippleColor: (profile && profile.rippleColor) || fallbackColor || "#7fe6ff",
        flashColor: (profile && profile.flashColor) || (profile && profile.color) || fallbackColor || "#7fe6ff"
      };
    }

    getWeaponVisual(kind) {
      var baseKey = kind === "wand" ? "pulse" : kind === "axe" ? "backshot" : "crit";
      var base = this.getSkinShotVisual(baseKey, (this.skinDef && this.skinDef.color) || "#ffe07a");
      var motif = "classic";
      if (this.skinId === "poolMonitor") {
        motif = "water";
      } else if (this.skinId === "summerFestival") {
        motif = "spark";
      } else if (this.skinId === "noonAwakening") {
        motif = "solar";
      } else if (this.skinId === "nightPatrol") {
        motif = "neon";
      } else if (this.skinId === "ramuneDrive") {
        motif = "bubble";
      } else if (this.skinId === "stationMaster") {
        motif = "brass";
      } else if (this.skinId === "score81000") {
        motif = "water";
      } else if (this.skinId === "score114514") {
        motif = "solar";
      } else if (this.skinId === "score162000") {
        motif = "neon";
      } else if (this.skinId === "score243000") {
        motif = "solar";
      } else if (this.skinId === "score324000") {
        motif = "spark";
      } else if (this.skinId === "score405000") {
        motif = "brass";
      }
      return {
        color: base.color,
        trailColor: base.trailColor,
        accentColor: base.accentColor,
        flashColor: base.flashColor,
        rippleColor: base.rippleColor,
        motif: motif
      };
    }

    getSkinShowcaseTheme() {
      var motif = this.getWeaponVisual("wand").motif;
      var primary = (this.skinDef && (this.skinDef.auraColor || this.skinDef.color)) || "#f6c453";
      var secondary = (this.skinDef && this.skinDef.color) || primary;
      var sparkle = "#fff1c4";
      var panelFill = "rgba(10, 8, 6, 0.94)";

      if (motif === "water") {
        secondary = "#dffbff";
        sparkle = "#b9f7ff";
        panelFill = "rgba(8, 22, 28, 0.94)";
      } else if (motif === "spark") {
        secondary = "#ffe0b4";
        sparkle = "#ffcf9d";
        panelFill = "rgba(28, 14, 10, 0.94)";
      } else if (motif === "solar") {
        secondary = "#fff1c4";
        sparkle = "#ffffff";
        panelFill = "rgba(30, 20, 8, 0.94)";
      } else if (motif === "neon") {
        secondary = "#d7e5ff";
        sparkle = "#c7d6ff";
        panelFill = "rgba(10, 14, 28, 0.94)";
      } else if (motif === "bubble") {
        secondary = "#dffef7";
        sparkle = "#bffff2";
        panelFill = "rgba(8, 24, 22, 0.94)";
      } else if (motif === "brass") {
        secondary = "#f6e8c9";
        sparkle = "#fff8e8";
        panelFill = "rgba(24, 16, 10, 0.94)";
      }

      return {
        motif: motif,
        primary: primary,
        secondary: secondary,
        sparkle: sparkle,
        panelFill: panelFill
      };
    }

    getSkillVisual(skillId) {
      var profile;
      switch (skillId) {
        case "summerPulse":
        case "pickupAura":
        case "haloSigil":
        case "mysticWand":
          profile = this.getWeaponVisual("wand");
          break;
        case "sunbeam810":
        case "lucky810":
        case "meteorCall":
          profile = this.getWeaponVisual("axe");
          profile.color = this.getSkinShotVisual("beam", profile.color).color;
          profile.flashColor = this.getSkinShotVisual("beam", profile.color).flashColor;
          break;
        case "summerSword":
          profile = this.getWeaponVisual("sword");
          break;
        case "breakerAxe":
          profile = this.getWeaponVisual("axe");
          break;
        case "afterimageStep":
        case "backstepVolley":
        case "quickStep":
        case "pierceSandal":
          profile = this.getWeaponVisual("axe");
          break;
        case "droneBuddy":
        case "ramuneOrbit":
          profile = this.getWeaponVisual("wand");
          break;
        case "saltGuard":
        case "thickNeck":
          profile = this.getWeaponVisual("sword");
          profile.color = "#f7efe0";
          profile.trailColor = "#fff1c4";
          break;
        case "coldMugicha":
          profile = this.getWeaponVisual("wand");
          profile.color = "#9feeff";
          profile.trailColor = "#dffbff";
          break;
        case "heatSink":
          profile = this.getWeaponVisual("axe");
          profile.color = "#ffb38a";
          profile.trailColor = "#ffd9c8";
          break;
        case "yarimasuNee":
          profile = this.getWeaponVisual("sword");
          break;
        case "thunderChain":
          profile = this.getWeaponVisual("wand");
          profile.color = "#b8c7ff";
          profile.trailColor = "#e8ecff";
          profile.accentColor = "#7fa7ff";
          break;
        case "blizzardFan":
          profile = this.getWeaponVisual("wand");
          profile.color = "#9feeff";
          profile.trailColor = "#dffcff";
          profile.accentColor = "#74d6ff";
          break;
        case "crossLance":
          profile = this.getWeaponVisual("sword");
          profile.color = "#ffc68f";
          profile.trailColor = "#ffe4be";
          profile.accentColor = "#ff9c4b";
          break;
        case "boomerangDisc":
          profile = this.getWeaponVisual("axe");
          profile.color = "#ffe07a";
          profile.trailColor = "#fff1c4";
          profile.accentColor = "#ffc768";
          break;
        case "petalStorm":
          profile = this.getWeaponVisual("wand");
          profile.color = "#ff9fd6";
          profile.trailColor = "#ffe0f2";
          profile.accentColor = "#ff7fb3";
          break;
        case "cometTrail":
          profile = this.getWeaponVisual("axe");
          profile.color = "#9fc8ff";
          profile.trailColor = "#d7e5ff";
          profile.accentColor = "#7fa7ff";
          break;
        case "vitalBloom":
          profile = this.getWeaponVisual("wand");
          profile.color = "#9cffb8";
          profile.trailColor = "#e6fff0";
          profile.accentColor = "#7edb98";
          break;
        case "overclockLoop":
          profile = this.getWeaponVisual("axe");
          profile.color = "#ffd28a";
          profile.trailColor = "#fff1c4";
          profile.accentColor = "#ffb86f";
          break;
        case "emberFork":
          profile = this.getWeaponVisual("axe");
          profile.color = "#ffb07a";
          profile.trailColor = "#ffe0c4";
          profile.accentColor = "#ff8e6d";
          break;
        case "prismRail":
          profile = this.getWeaponVisual("sword");
          profile.color = "#b7c8ff";
          profile.trailColor = "#e4ebff";
          profile.accentColor = "#8ba8ff";
          break;
        case "frostMine":
          profile = this.getWeaponVisual("wand");
          profile.color = "#9feeff";
          profile.trailColor = "#e4fdff";
          profile.accentColor = "#74d6ff";
          break;
        case "spiralDrive":
          profile = this.getWeaponVisual("wand");
          profile.color = "#ffa6dd";
          profile.trailColor = "#ffe3f3";
          profile.accentColor = "#ff74bf";
          break;
        default:
          profile = this.getWeaponVisual("wand");
          profile.color = this.getSkinShotVisual("bullet", profile.color).color;
          profile.trailColor = this.getSkinShotVisual("bullet", profile.color).trailColor;
          break;
      }
      return profile;
    }

    spawnSkillSignature(skillId, x, y, options) {
      var visual = this.getSkillVisual(skillId);
      var opts = options || {};
      var power = opts.power || 1;
      var angle = typeof opts.angle === "number" ? opts.angle : this.player.facingAngle;
      var ringRadius = opts.radius || (16 + power * 8);

      this.spawnWeaponMotifFx(x, y, visual, power);

      if (skillId === "sunbeam810" || skillId === "meteorCall" || skillId === "cometTrail" || skillId === "thunderChain" || skillId === "prismRail") {
        this.effects.spawnRadialStreakBurst(x, y, {
          count: 7 + Math.floor(power * 2),
          speedMin: 44,
          speedMax: 110,
          life: 0.18,
          color: visual.flashColor || visual.accentColor,
          width: 2,
          length: 14 + power * 4,
          drag: 0.84
        });
      } else if (skillId === "summerPulse" || skillId === "haloSigil" || skillId === "pickupAura" || skillId === "petalStorm" || skillId === "vitalBloom" || skillId === "spiralDrive" || skillId === "frostMine") {
        this.effects.spawnRing(x, y, {
          color: visual.color,
          radius: ringRadius,
          growth: 44 + power * 20,
          lineWidth: 2 + Math.floor(power),
          life: 0.18,
          fillAlpha: 0.07
        });
      } else if (skillId === "quickStep" || skillId === "afterimageStep" || skillId === "backstepVolley" || skillId === "blizzardFan" || skillId === "crossLance" || skillId === "boomerangDisc" || skillId === "overclockLoop" || skillId === "emberFork") {
        this.effects.spawnStreak(x, y, -Math.cos(angle) * (70 + power * 24), -Math.sin(angle) * (70 + power * 24), {
          life: 0.18,
          color: visual.trailColor,
          width: 3,
          length: 18 + power * 6,
          drag: 0.88
        });
      } else {
        this.effects.spawnEcho(x, y, {
          width: 18 + power * 6,
          height: 18 + power * 6,
          life: 0.12,
          color: visual.color,
          outlineColor: visual.accentColor,
          rotation: angle,
          shape: "orb"
        });
      }
    }

    spawnSkinMovementFx(dt, move, moveMagnitude) {
      var fx = this.getSkinFx();
      var step;
      var directionX;
      var directionY;
      var originX;
      var originY;
      var rotation;

      if (!fx || !fx.footsteps || moveMagnitude < 54) {
        return;
      }

      this.skinStepTimer -= dt;
      if (this.skinStepTimer > 0) {
        return;
      }

      step = fx.footsteps;
      this.skinStepTimer = step.interval || 0.1;
      directionX = moveMagnitude > 0 ? this.player.vx / moveMagnitude : move.x || 0;
      directionY = moveMagnitude > 0 ? this.player.vy / moveMagnitude : move.y || 0;
      originX = this.player.x - directionX * 12;
      originY = this.player.y + 18 - directionY * 12;
      rotation = Math.atan2(directionY, directionX);

      this.effects.spawnParticleBurst(originX, originY, {
        count: step.count || 2,
        color: step.color || "#ffffff",
        speedMin: 6,
        speedMax: 28,
        life: 0.22,
        sizeStart: 3,
        sizeEnd: 1,
        shape: step.shape === "circle" ? "circle" : "diamond"
      });

      if (step.accentColor) {
        this.effects.spawnParticleBurst(originX, originY, {
          count: 1,
          color: step.accentColor,
          speedMin: 4,
          speedMax: 18,
          life: 0.18,
          sizeStart: 2,
          sizeEnd: 1,
          shape: step.shape === "circle" ? "circle" : "diamond"
        });
      }

      this.effects.spawnEcho(originX, originY, {
        width: step.shape === "circle" ? 10 : 18,
        height: step.shape === "circle" ? 10 : 6,
        life: 0.16,
        color: step.color || "#ffffff",
        outlineColor: step.accentColor || "",
        rotation: rotation,
        shape: step.shape === "circle" ? "orb" : "box"
      });
      this.effects.spawnStreak(originX, originY, -directionX * 56, -directionY * 56, {
        life: 0.14,
        color: step.accentColor || step.color || "#ffffff",
        width: step.shape === "circle" ? 2 : 3,
        length: step.shape === "circle" ? 10 : 18
      });

      if (step.ring) {
        this.effects.spawnRing(originX, originY, {
          color: step.color || "#ffffff",
          radius: 4,
          growth: 26,
          lineWidth: 1,
          life: 0.14,
          fillAlpha: 0.05
        });
      }
    }

    spawnSkinAttackFx(kind, x, y, visual) {
      var burstCount;
      if (kind === "pulse" && Math.random() > 0.34) {
        return;
      }
      burstCount = kind === "pulse" ? 2 : kind === "crit" ? 4 : 3;
      this.effects.spawnParticleBurst(x, y, {
        count: burstCount,
        color: visual.trailColor,
        speedMin: 18,
        speedMax: kind === "pulse" ? 58 : 42,
        life: 0.18,
        sizeStart: kind === "pulse" ? 4 : 3,
        sizeEnd: 1,
        shape: visual.shape === "circle" ? "circle" : "diamond"
      });
      this.effects.spawnRadialStreakBurst(x, y, {
        count: kind === "pulse" ? 10 : kind === "crit" ? 8 : 5,
        speedMin: kind === "pulse" ? 70 : 44,
        speedMax: kind === "pulse" ? 140 : 94,
        life: kind === "pulse" ? 0.24 : 0.18,
        color: visual.accentColor || visual.trailColor,
        width: kind === "pulse" ? 3 : 2,
        length: kind === "pulse" ? 26 : 16,
        drag: 0.84
      });
      this.effects.spawnEcho(x, y, {
        width: kind === "pulse" ? 18 : 12,
        height: kind === "pulse" ? 18 : 12,
        life: kind === "pulse" ? 0.18 : 0.12,
        color: visual.trailColor,
        outlineColor: visual.accentColor,
        shape: "orb"
      });
      if (kind !== "pulse") {
        this.effects.spawnRing(x, y, {
          color: visual.rippleColor,
          radius: 5,
          growth: 24,
          lineWidth: 1,
          life: 0.12,
          fillAlpha: 0.04
        });
      }
      if (kind === "crit") {
        this.effects.flashScreen(visual.flashColor, 0.025, 0.05);
      }
    }

    spawnPlayerShotTrail(shot) {
      if (shot.kind === "wandbolt") {
        this.effects.spawnParticleBurst(shot.x, shot.y, {
          count: 2,
          color: shot.trailColor || shot.color,
          speedMin: 5,
          speedMax: 18,
          life: 0.14,
          sizeStart: Math.max(2, shot.radius * 0.5),
          sizeEnd: 1,
          shape: "circle"
        });
        this.effects.spawnEcho(shot.x, shot.y, {
          width: shot.radius * 2.2,
          height: shot.radius * 2.2,
          life: 0.08,
          color: shot.color,
          outlineColor: shot.accentColor || "",
          shape: "orb"
        });
      }
      this.effects.spawnParticleBurst(shot.x, shot.y, {
        count: 1,
        color: shot.trailColor || shot.color,
        speedMin: 4,
        speedMax: 14,
        life: 0.12,
        sizeStart: Math.max(2, shot.radius * 0.4),
        sizeEnd: 1,
        shape: shot.shape === "circle" ? "circle" : "diamond"
      });
      this.effects.spawnStreak(shot.x, shot.y, -shot.vx * 0.06, -shot.vy * 0.06, {
        life: 0.12,
        color: shot.trailColor || shot.color,
        width: shot.shape === "circle" ? 2 : 3,
        length: shot.shape === "circle" ? 12 : 18,
        drag: 0.9
      });
      if (shot.shape === "circle" && Math.random() < 0.3) {
        this.effects.spawnEcho(shot.x, shot.y, {
          width: shot.radius * 1.8,
          height: shot.radius * 1.8,
          life: 0.08,
          color: shot.color,
          outlineColor: shot.accentColor || "",
          shape: "orb"
        });
      }
    }

    drawPlayerProjectile(ctx, shot, screenX, screenY) {
      var glowRadius = shot.radius + 5;
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate((shot.age || 0) * (shot.spin || 8));
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = shot.trailColor || shot.color;
      ctx.beginPath();
      ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = shot.color;

      if (shot.kind === "wandbolt") {
        ctx.beginPath();
        ctx.arc(0, 0, shot.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = shot.accentColor || "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -shot.radius - 3);
        ctx.lineTo(0, shot.radius + 3);
        ctx.moveTo(-shot.radius - 3, 0);
        ctx.lineTo(shot.radius + 3, 0);
        ctx.stroke();
      } else if (shot.kind === "needle") {
        ctx.fillRect(-shot.radius - 2, -shot.radius * 0.22, shot.radius * 2 + 4, shot.radius * 0.44);
        ctx.fillStyle = shot.accentColor || "#fff1c4";
        ctx.beginPath();
        ctx.moveTo(shot.radius + 4, 0);
        ctx.lineTo(shot.radius - 1, -shot.radius * 0.46);
        ctx.lineTo(shot.radius - 1, shot.radius * 0.46);
        ctx.closePath();
        ctx.fill();
      } else if (shot.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, shot.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (shot.shape === "ticket") {
        ctx.fillRect(-shot.radius - 1, -shot.radius * 0.7, shot.radius * 2 + 2, shot.radius * 1.4);
        ctx.fillStyle = shot.accentColor || "#fff1c4";
        ctx.fillRect(-shot.radius * 0.28, -shot.radius * 0.66, 2, shot.radius * 1.32);
        ctx.fillRect(shot.radius * 0.08, -shot.radius * 0.66, 2, shot.radius * 1.32);
      } else {
        ctx.fillRect(-shot.radius, -shot.radius, shot.radius * 2, shot.radius * 2);
        ctx.fillStyle = shot.accentColor || "#fff1c4";
        ctx.fillRect(-shot.radius * 0.3, -shot.radius * 0.3, shot.radius * 0.6, shot.radius * 0.6);
      }

      if (shot.accentColor) {
        ctx.strokeStyle = shot.accentColor;
        ctx.lineWidth = 2;
        if (shot.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(2, shot.radius - 1), 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.strokeRect(-shot.radius - 1, -shot.radius - 1, shot.radius * 2 + 2, shot.radius * 2 + 2);
        }
      }
      if (shot.shape !== "circle") {
        ctx.rotate(Math.PI * 0.25);
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = shot.trailColor || shot.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-shot.radius * 0.6, -shot.radius * 0.6, shot.radius * 1.2, shot.radius * 1.2);
      }
      ctx.restore();
    }

    getActionButtons() {
      if (this.isBotMode) {
        return [];
      }
      if (ns.constants.IS_MOBILE_PORTRAIT) {
        var compactButtons = [];
        var width = this.merchant.active && !this.merchant.open && !this.runEnded ? 84 : 104;
        var gap = 8;
        var total = this.merchant.active && !this.merchant.open && !this.runEnded ? 5 : 4;
        var startX = Math.floor((ns.constants.GAME_WIDTH - (total * width + (total - 1) * gap)) * 0.5);
        var y = ns.constants.GAME_HEIGHT - 72;
        if (this.merchant.active && !this.merchant.open && !this.runEnded) {
          compactButtons.push({ action: "shop", label: "SHOP", x: startX, y: y, width: width, height: 40, border: "#ff91d7" });
          startX += width + gap;
        }
        compactButtons.push({ action: "language", label: this.game.getLocale().toUpperCase(), x: startX, y: y, width: width, height: 40, border: "#ffe07a" });
        compactButtons.push({ action: "title", label: translate(this.game, "buttons.title"), x: startX + (width + gap), y: y, width: width, height: 40, border: "#d6d0ff" });
        compactButtons.push({ action: "restart", label: translate(this.game, "buttons.retry"), x: startX + (width + gap) * 2, y: y, width: width, height: 40, border: "#ff8a70" });
        compactButtons.push({ action: "pause", label: this.paused ? translate(this.game, "buttons.go") : translate(this.game, "buttons.pause"), x: startX + (width + gap) * 3, y: y, width: width, height: 40, border: "#7fe6ff" });
        return compactButtons;
      }
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

    getModeLabel() {
      return this.game.modeName ? this.game.modeName(this.mode) : this.mode.toUpperCase();
    }

    getLiveStageTheme() {
      var base = getStageTheme(this.stageId);
      var shift = getStageShiftIndex(this.elapsedSec);
      if (shift <= 0) {
        return base;
      }
      if (shift === 1) {
        return {
          label: base.label,
          bg: mixColor(base.bg, "#3b1c0d", 0.34),
          tileA: mixColor(base.tileA, "#50301a", 0.3),
          tileB: mixColor(base.tileB, "#64381d", 0.3),
          accent: mixColor(base.accent, "#ffd37a", 0.35),
          lane: mixColor(base.lane, "#9d6137", 0.3),
          prop: mixColor(base.prop, "#b06c48", 0.26),
          glow: mixColor(base.glow, "#fff0ba", 0.28)
        };
      }
      if (shift === 2) {
        return {
          label: base.label,
          bg: mixColor(base.bg, "#121824", 0.52),
          tileA: mixColor(base.tileA, "#1f2c40", 0.48),
          tileB: mixColor(base.tileB, "#27344a", 0.48),
          accent: mixColor(base.accent, "#8db4ff", 0.5),
          lane: mixColor(base.lane, "#6176b8", 0.5),
          prop: mixColor(base.prop, "#48618f", 0.44),
          glow: mixColor(base.glow, "#d7e5ff", 0.5)
        };
      }
      return {
        label: base.label,
        bg: mixColor(base.bg, "#2a0818", 0.58),
        tileA: mixColor(base.tileA, "#411126", 0.54),
        tileB: mixColor(base.tileB, "#561833", 0.54),
        accent: mixColor(base.accent, "#ff8de0", 0.62),
        lane: mixColor(base.lane, "#a24f86", 0.56),
        prop: mixColor(base.prop, "#c86ba3", 0.52),
        glow: mixColor(base.glow, "#ffe2f5", 0.56)
      };
    }

    getSpawnerElapsedSec() {
      if (!this.isInfinityMode || this.elapsedSec <= RUN_LENGTH_SEC) {
        return this.elapsedSec;
      }
      return ENDLESS_LOOP_START_SEC + ((this.elapsedSec - ENDLESS_LOOP_START_SEC) % ENDLESS_LOOP_RANGE_SEC);
    }

    getSpawnIntensity() {
      var base = Math.floor(this.score / 12000);
      if (this.isBotMode) {
        base += Math.floor(this.elapsedSec / 50);
      } else if (this.isInfinityMode) {
        base += Math.floor(this.elapsedSec / 90);
      }
      return base;
    }

    getDangerTier() {
      return this.dangerTier;
    }

    getEnemyTimeTier() {
      if (this.isBotMode) {
        return Math.floor(this.elapsedSec / 40);
      }
      if (this.isInfinityMode) {
        return Math.floor(this.elapsedSec / 70);
      }
      return Math.floor(this.elapsedSec / 100);
    }

    getEnemyTimeRates() {
      if (this.isBotMode) {
        return {
          hp: 1.09,
          speed: 1.016,
          damage: 1.055
        };
      }
      if (this.isInfinityMode) {
        return {
          hp: 1.07,
          speed: 1.013,
          damage: 1.045
        };
      }
      return {
        hp: 1.05,
        speed: 1.01,
        damage: 1.035
      };
    }

    getEnemyPressureSnapshot() {
      var scoreTier = this.getSpawnIntensity();
      var timeTier = this.getEnemyTimeTier();
      var timeRates = this.getEnemyTimeRates();
      var hpScale = 1 + Math.min(3.6, scoreTier * 0.07);
      var speedScale = 1 + Math.min(0.9, scoreTier * 0.018);
      var damageScale = 1 + Math.min(2.6, scoreTier * 0.05);

      if (this.isBotMode) {
        hpScale *= 1.08;
        speedScale *= 1.06;
        damageScale *= 1.08;
      }

      return {
        scoreTier: scoreTier,
        timeTier: timeTier,
        hpScale: hpScale * Math.pow(timeRates.hp, timeTier),
        speedScale: speedScale * Math.pow(timeRates.speed, timeTier),
        damageScale: damageScale * Math.pow(timeRates.damage, timeTier),
        level: 1 + this.hazardRank + scoreTier + timeTier
      };
    }

    getNextScoreSkinUnlock() {
      return this.game.getNextScoreSkinUnlock ? this.game.getNextScoreSkinUnlock(this.score) : null;
    }

    applyScoreScalingToEnemy(enemy) {
      var pressure = this.getEnemyPressureSnapshot();
      if (!enemy) {
        return enemy;
      }
      enemy.maxHp = Math.max(enemy.hp, Math.round(enemy.maxHp * pressure.hpScale));
      enemy.hp = Math.max(1, Math.round(enemy.hp * pressure.hpScale));
      enemy.speed *= pressure.speedScale;
      enemy.baseSpeed = enemy.speed;
      enemy.damage = Math.max(1, Math.round(enemy.damage * pressure.damageScale));
      enemy.baseDamage = enemy.damage;
      enemy.xp = Math.max(1, Math.round(enemy.xp * (1 + Math.min(1.8, pressure.scoreTier * 0.03 + pressure.timeTier * 0.04))));
      enemy.scoreTier = pressure.scoreTier;
      enemy.baseLevel = pressure.level - pressure.timeTier;
      enemy.level = pressure.level;
      enemy.timeTierApplied = pressure.timeTier;
      return enemy;
    }

    applyTimePressureToEnemy(enemy) {
      var targetTier;
      var currentTier;
      var timeRates;
      var hpRatio;
      var i;
      if (!enemy) {
        return;
      }
      targetTier = this.getEnemyTimeTier();
      currentTier = enemy.timeTierApplied || 0;
      if (targetTier <= currentTier) {
        return;
      }
      timeRates = this.getEnemyTimeRates();
      for (i = currentTier; i < targetTier; i += 1) {
        hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1;
        enemy.maxHp = Math.max(1, Math.round(enemy.maxHp * timeRates.hp));
        enemy.hp = Math.max(1, Math.round(enemy.maxHp * clamp(hpRatio, 0.08, 1)));
        enemy.speed *= timeRates.speed;
        enemy.baseSpeed = enemy.speed;
        enemy.damage = Math.max(1, Math.round(enemy.damage * timeRates.damage));
        enemy.baseDamage = enemy.damage;
      }
      enemy.timeTierApplied = targetTier;
      enemy.level = Math.max(1, (enemy.baseLevel || enemy.level || 1) + targetTier);
    }

    getDangerWaveEnemyIds() {
      var archetypes = this.plan && this.plan.enemyArchetypes ? this.plan.enemyArchetypes : null;
      var ids = [];
      var id;
      if (!archetypes) {
        return ids;
      }
      for (id in archetypes) {
        if (!Object.prototype.hasOwnProperty.call(archetypes, id)) {
          continue;
        }
        if (archetypes[id].category === "elite") {
          ids.push(id);
        }
      }
      return ids;
    }

    spawnDangerWave(tier) {
      var eliteIds = this.getDangerWaveEnemyIds();
      var spawnCount;
      var i;
      if (!eliteIds.length) {
        return;
      }
      spawnCount = Math.min(3, 1 + Math.floor(tier / 4));
      for (i = 0; i < spawnCount; i += 1) {
        var enemyId = eliteIds[(tier + i) % eliteIds.length];
        var spawn = this.spawner.getPatternSpawn("front-arc", this.player, i, spawnCount, this.getViewRect());
        var enemy = this.spawner.createEnemy(enemyId, spawn, this.elapsedSec, {
          isDangerWave: true
        });
        if (enemy) {
          this.applyScoreScalingToEnemy(enemy);
          this.enemies.push(enemy);
          this.effects.spawnRing(enemy.x, enemy.y, {
            color: "#ff8a70",
            radius: 24,
            growth: 110,
            lineWidth: 5,
            life: 0.46
          });
        }
      }
    }

    handleScoreMilestones(previousScore, nextScore) {
      var previousTier = Math.floor(Math.max(0, previousScore || 0) / 12000);
      var nextTier = Math.floor(Math.max(0, nextScore || 0) / 12000);
      var unlockedSkins;
      var i;

      if (nextTier > previousTier) {
        for (i = previousTier + 1; i <= nextTier; i += 1) {
          this.dangerTier = i;
          this.pushMessage(translate(this.game, "survivor.dangerTier", { tier: i }), 1.4, "#ff9c4b");
          this.effects.flashScreen("#ff9c4b", 0.06, 0.11);
          this.effects.triggerShake(5 + Math.min(7, i), 0.14);
          if (this.isInfinityMode) {
            this.spawnDangerWave(i);
          }
        }
      }

      unlockedSkins = this.isBotMode ? [] : (this.game.unlockScoreSkins ? this.game.unlockScoreSkins(nextScore) : []);
      for (i = 0; i < unlockedSkins.length; i += 1) {
        var skin = unlockedSkins[i];
        var skinName = getMetaText(this.game, skin, "name");
        if (this.game.audio && this.game.audio.playPickupCue) {
          this.game.audio.playPickupCue("chest");
        }
        this.pushMessage(
          translate(
            this.game,
            skin.scoreThreshold === SPECIAL_SCORE_STEP ? "survivor.specialScoreUnlocked" : "survivor.scoreUnlocked",
            { skin: skinName }
          ),
          2.1,
          skin.color || "#ffe07a"
        );
        this.effects.flashScreen(skin.auraColor || skin.color || "#ffe07a", 0.08, 0.14);
      }
    }

    addScore(amount, x, y, options) {
      var gained = Math.max(0, Math.round(amount || 0));
      var opts = options || {};
      var previousScore = this.score;
      if (gained <= 0) {
        return 0;
      }
      this.score += gained;
      if (!opts.silent && (gained >= 80 || opts.forceText)) {
        this.effects.spawnFloatingText("+" + formatScore(gained) + " " + translate(this.game, "common.score"), x, y, {
          color: opts.color || "#ffe07a",
          size: opts.size || 16,
          life: 0.55
        });
      }
      this.handleScoreMilestones(previousScore, this.score);
      return gained;
    }

    triggerLegendChestShow() {
      this.effects.spawnChestOpen(this.player.x, this.player.y - 10);
      this.effects.spawnRing(this.player.x, this.player.y - 10, {
        color: "#fff1c4",
        radius: 22,
        growth: 180,
        lineWidth: 5,
        life: 0.42,
        fillAlpha: 0.08
      });
      this.effects.spawnRing(this.player.x, this.player.y - 10, {
        color: "#ffe07a",
        radius: 14,
        growth: 116,
        lineWidth: 4,
        life: 0.34,
        fillAlpha: 0.1
      });
      this.effects.spawnRadialStreakBurst(this.player.x, this.player.y - 10, {
        count: 16,
        speedMin: 42,
        speedMax: 140,
        life: 0.34,
        color: "#fff1c4",
        width: 3,
        length: 28,
        drag: 0.84
      });
      this.effects.flashScreen("#fff1c4", 0.12, 0.2);
      this.effects.triggerShake(10, 0.24);
      if (this.game.audio && this.game.audio.playPickupCue) {
        this.game.audio.playPickupCue("legendChest");
      }
    }

    triggerSkinChestShow() {
      var theme = this.getSkinShowcaseTheme();
      var x = this.player.x;
      var y = this.player.y - 10;

      if (this.skinId === "score114514") {
        this.triggerLegendChestShow();
        return;
      }

      this.effects.spawnChestOpen(x, y);
      this.effects.spawnRing(x, y, {
        color: theme.primary,
        radius: 18,
        growth: 136,
        lineWidth: 4,
        life: 0.28,
        fillAlpha: 0.06
      });
      this.effects.spawnRing(x, y, {
        color: theme.secondary,
        radius: 12,
        growth: 92,
        lineWidth: 3,
        life: 0.22,
        fillAlpha: 0.08
      });
      this.effects.spawnRadialStreakBurst(x, y, {
        count: theme.motif === "solar" ? 14 : theme.motif === "spark" ? 12 : 10,
        speedMin: 42,
        speedMax: theme.motif === "solar" ? 132 : 110,
        life: 0.24,
        color: theme.sparkle,
        width: theme.motif === "solar" ? 3 : 2,
        length: theme.motif === "spark" ? 22 : 18,
        drag: 0.86
      });

      if (theme.motif === "water" || theme.motif === "bubble") {
        this.effects.spawnParticleBurst(x, y, {
          count: theme.motif === "bubble" ? 16 : 12,
          color: theme.secondary,
          speedMin: 18,
          speedMax: 74,
          life: 0.4,
          sizeStart: 6,
          sizeEnd: 1,
          shape: "circle"
        });
      } else if (theme.motif === "spark") {
        this.effects.spawnParticleBurst(x, y, {
          count: 18,
          color: theme.primary,
          speedMin: 28,
          speedMax: 120,
          life: 0.34,
          sizeStart: 5,
          sizeEnd: 1,
          shape: "diamond"
        });
      } else if (theme.motif === "neon") {
        this.effects.spawnRadialStreakBurst(x, y, {
          count: 14,
          speedMin: 56,
          speedMax: 144,
          life: 0.28,
          color: theme.primary,
          width: 3,
          length: 26,
          drag: 0.84
        });
      } else if (theme.motif === "brass") {
        this.effects.spawnParticleBurst(x, y, {
          count: 14,
          color: theme.primary,
          speedMin: 18,
          speedMax: 86,
          life: 0.34,
          sizeStart: 4,
          sizeEnd: 1,
          shape: "diamond"
        });
      } else {
        this.effects.spawnParticleBurst(x, y, {
          count: 14,
          color: theme.sparkle,
          speedMin: 22,
          speedMax: 92,
          life: 0.36,
          sizeStart: 5,
          sizeEnd: 1,
          shape: "circle"
        });
      }

      this.effects.flashScreen(theme.primary, 0.08, 0.16);
      this.effects.triggerShake(theme.motif === "solar" ? 9 : 6, 0.18);
      if (this.game.audio && this.game.audio.playPickupCue) {
        this.game.audio.playPickupCue("chest");
      }
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
      if (this.isBotMode) {
        this.autoResolveMerchant();
      }
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
      if (this.isBotMode) {
        this.autoResolveMerchant();
      }
    }

    getMerchantOfferPriority(offer) {
      var hpRatio = this.player.maxHp > 0 ? this.player.hp / this.player.maxHp : 1;
      if (!offer || offer.soldOut || this.player.coins < offer.cost) {
        return -1;
      }
      if (offer.kind === "fusion") {
        return 140;
      }
      if (offer.kind === "special") {
        return 120;
      }
      if (offer.pickupKind === "chest") {
        return 110;
      }
      if (offer.pickupKind === "heal") {
        return hpRatio <= 0.62 ? 130 : 50;
      }
      if (offer.pickupKind === "magnet") {
        return 90;
      }
      return 40;
    }

    selectBotMerchantOffer() {
      var bestIndex = -1;
      var bestPriority = -1;
      var i;
      for (i = 0; i < this.merchant.offers.length; i += 1) {
        var priority = this.getMerchantOfferPriority(this.merchant.offers[i]);
        if (priority > bestPriority) {
          bestPriority = priority;
          bestIndex = i;
        }
      }
      return bestIndex;
    }

    autoResolveMerchant() {
      var buyCount = 0;
      var nextIndex;
      if (!this.isBotMode || !this.merchant.open) {
        return;
      }
      while (buyCount < 2) {
        nextIndex = this.selectBotMerchantOffer();
        if (nextIndex < 0) {
          break;
        }
        this.buyMerchantOffer(nextIndex);
        buyCount += 1;
      }
      this.closeMerchantShop();
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
      this.tryTrueFusions();
    }

    applyTrueFusionResult(recipeId) {
      var recipe = findTrueFusionRecipeById(recipeId);
      if (!recipe || this.activeTrueFusions[recipeId]) {
        return;
      }
      this.activeTrueFusions[recipeId] = true;
      this.rememberRecipe(recipeId);
      this.refreshBuildStats(true);
      this.effects.flashScreen(recipe.color || "#fff1c4", 0.18, 0.28);
      this.effects.triggerShake(12, 0.32);
      this.effects.spawnBossWarning(getMetaText(this.game, recipe, "name"));
      this.pushMessage(getMetaText(this.game, recipe, "name"), 1.8, recipe.color || "#fff1c4");

      if (recipeId === "solarMyth") {
        this.player.frenzyTimer = Math.max(this.player.frenzyTimer, 24);
        this.fireBasicVolley();
        this.fireSummerSword();
        this.fireBreakerAxe();
        this.fireSunbeam();
      } else if (recipeId === "tidalSanctuary") {
        this.healPlayer(this.player.maxHp);
        this.player.shieldTimer = Math.max(this.player.shieldTimer, 28);
        this.player.loveAuraTimer = Math.max(this.player.loveAuraTimer, 28);
        this.player.loveAuraPulse = 0.1;
        this.vacuumXpPickups();
        this.triggerIkuikuPulse();
      }
    }

    tryTrueFusions() {
      var i;
      for (i = 0; i < this.trueFusionRecipes.length; i += 1) {
        var recipe = this.trueFusionRecipes[i];
        if (this.activeTrueFusions[recipe.id]) {
          continue;
        }
        if (this.activeFusions[recipe.ingredients[0]] && this.activeFusions[recipe.ingredients[1]]) {
          this.applyTrueFusionResult(recipe.id);
        }
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

    getMerchantOfferRect(index) {
      if (ns.constants.IS_MOBILE_PORTRAIT) {
        return {
          x: 36,
          y: 368 + index * 88,
          width: 468,
          height: 76
        };
      }
      return {
        x: 426,
        y: 258 + index * 66,
        width: 498,
        height: 58
      };
    }

    getMerchantLeaveRect() {
      if (ns.constants.IS_MOBILE_PORTRAIT) {
        return { x: 350, y: 774, width: 154, height: 46 };
      }
      return { x: 650, y: 566, width: 128, height: 46 };
    }

    handleMerchantInput(input) {
      var pointer = input.getPointer();
      var i;
      var leaveButton = this.getMerchantLeaveRect();

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
          var rect = this.getMerchantOfferRect(i);
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
      var needleLevel = this.getUpgradeLevel("neonNeedle");
      var meteorLevel = this.getUpgradeLevel("meteorCall");
      var haloLevel = this.getUpgradeLevel("haloSigil");
      var swordLevel = this.getUpgradeLevel("summerSword");
      var axeLevel = this.getUpgradeLevel("breakerAxe");
      var wandLevel = this.getUpgradeLevel("mysticWand");
      var thunderLevel = this.getUpgradeLevel("thunderChain");
      var blizzardLevel = this.getUpgradeLevel("blizzardFan");
      var crossLevel = this.getUpgradeLevel("crossLance");
      var boomerangLevel = this.getUpgradeLevel("boomerangDisc");
      var petalLevel = this.getUpgradeLevel("petalStorm");
      var cometTrailLevel = this.getUpgradeLevel("cometTrail");
      var vitalBloomLevel = this.getUpgradeLevel("vitalBloom");
      var overclockLevel = this.getUpgradeLevel("overclockLoop");
      var emberForkLevel = this.getUpgradeLevel("emberFork");
      var prismRailLevel = this.getUpgradeLevel("prismRail");
      var frostMineLevel = this.getUpgradeLevel("frostMine");
      var spiralDriveLevel = this.getUpgradeLevel("spiralDrive");
      var fusionBurst = !!this.activeFusions.burstVacation;
      var fusionGentle = !!this.activeFusions.gentleWave;
      var fusionNova = !!this.activeFusions.vacuumNova;
      var fusionDrive = !!this.activeFusions.summerOverdrive;
      var trueSolar = !!this.activeTrueFusions.solarMyth;
      var trueTide = !!this.activeTrueFusions.tidalSanctuary;

      this.player.maxHp = 120 + neckLevel * 16 + vitalBloomLevel * 10 + (fusionGentle ? 30 : 0) + (trueTide ? 54 : 0);
      this.player.speed = 260 + speedLevel * 20 + (fusionDrive ? 22 : 0) + (trueSolar ? 26 : 0);
      this.player.fireRate = Math.max(0.09, 0.36 - fireLevel * 0.03 - overclockLevel * 0.01 - (fusionBurst ? 0.04 : 0) - (trueSolar ? 0.05 : 0));
      this.player.damage = 32 + damageLevel * 9 + heatSinkLevel * 2 + overclockLevel * 3 + vitalBloomLevel * 2 + (fusionBurst ? 14 : 0) + (fusionDrive ? 10 : 0) + (trueSolar ? 20 : 0);
      this.player.pickupRange = 96 + magnetLevel * 26 + (fusionNova ? 60 : 0) + (fusionGentle ? 30 : 0) + (trueTide ? 80 : 0);
      this.player.armor = neckLevel * 1.4 + shellLevel * 0.5 + (fusionGentle ? 2.5 : 0) + (trueTide ? 3.5 : 0);
      this.player.pierce = pierceLevel + Math.floor(heatSinkLevel / 2);
      this.player.orbitLevel = orbitLevel;
      this.player.pulseLevel = pulseLevel;
      this.player.beamLevel = beamLevel + (trueSolar ? 1 : 0);
      this.player.hypeLevel = hypeLevel;
      this.player.afterimageLevel = afterimageLevel;
      this.player.shellLevel = shellLevel;
      this.player.luckLevel = luckLevel;
      this.player.droneLevel = droneLevel;
      this.player.backstepLevel = backstepLevel;
      this.player.heatSinkLevel = heatSinkLevel;
      this.player.needleLevel = needleLevel;
      this.player.meteorLevel = meteorLevel;
      this.player.haloLevel = haloLevel;
      this.player.swordLevel = swordLevel + (trueSolar ? 1 : 0);
      this.player.axeLevel = axeLevel + (trueSolar ? 1 : 0);
      this.player.wandLevel = wandLevel + (trueSolar ? 1 : 0);
      this.player.thunderLevel = thunderLevel;
      this.player.blizzardLevel = blizzardLevel;
      this.player.crossLevel = crossLevel;
      this.player.boomerangLevel = boomerangLevel;
      this.player.petalLevel = petalLevel;
      this.player.cometTrailLevel = cometTrailLevel;
      this.player.vitalBloomLevel = vitalBloomLevel;
      this.player.overclockLevel = overclockLevel;
      this.player.emberForkLevel = emberForkLevel;
      this.player.prismRailLevel = prismRailLevel;
      this.player.frostMineLevel = frostMineLevel;
      this.player.spiralDriveLevel = spiralDriveLevel;
      this.player.shotCount = 1 + Math.floor(hypeLevel / 2) + Math.floor(backstepLevel / 3) + (trueSolar ? 1 : 0);
      this.player.bulletSpeed = 680 + heatSinkLevel * 55 + overclockLevel * 35 + (fusionDrive ? 120 : 0) + (trueSolar ? 140 : 0);
      this.player.xpGainMultiplier = 1 + luckLevel * 0.08 + (fusionBurst ? 0.12 : 0);
      this.player.specialCooldownFactor = Math.max(0.34, 1 - heatSinkLevel * 0.08 - overclockLevel * 0.05 - (fusionNova ? 0.08 : 0) - (fusionDrive ? 0.12 : 0) - (trueSolar ? 0.08 : 0) - (trueTide ? 0.05 : 0));

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

    getNearestEnemyFrom(x, y) {
      if (!this.enemies.length) {
        return null;
      }
      var nearest = this.enemies[0];
      var nearestDistance = distanceSquared({ x: x, y: y }, nearest);
      var i;
      for (i = 1; i < this.enemies.length; i += 1) {
        var candidate = this.enemies[i];
        var candidateDistance = distanceSquared({ x: x, y: y }, candidate);
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

    getBotPickupTarget() {
      var best = null;
      var bestScore = -Infinity;
      var hpRatio = this.player.hp / Math.max(1, this.player.maxHp);
      var i;

      for (i = 0; i < this.pickups.length; i += 1) {
        var pickup = this.pickups[i];
        var dist = pointDistance(this.player.x, this.player.y, pickup.x, pickup.y);
        var priority = 0;
        if (pickup.kind === "chest") {
          priority = 240;
        } else if (pickup.kind === "heal") {
          priority = hpRatio < 0.6 ? 300 : 90;
        } else if (pickup.kind === "magnet") {
          priority = 170;
        } else if (pickup.kind === "xp") {
          priority = 115 + Math.min(60, (pickup.xp || 1) * 8);
        } else if (pickup.kind !== "xp") {
          priority = 190;
        }
        if (priority <= 0) {
          continue;
        }
        priority *= this.botProfile ? (this.botProfile.pickupBias || 0.7) + 0.35 : 1;
        priority -= dist * 0.42;
        if (priority > bestScore) {
          best = pickup;
          bestScore = priority;
        }
      }

      return best;
    }

    getBotPrimaryEnemy() {
      var best = null;
      var bestScore = -Infinity;
      var i;
      for (i = 0; i < this.enemies.length; i += 1) {
        var enemy = this.enemies[i];
        var dist = pointDistance(this.player.x, this.player.y, enemy.x, enemy.y);
        var score = (enemy.category === "boss" ? 420 : enemy.category === "elite" ? 260 : 140) - dist;
        score *= this.getBotEnemyPenalty(enemy.archetypeId || "");
        if (score > bestScore) {
          best = enemy;
          bestScore = score;
        }
      }
      return best;
    }

    getBotMoveVector() {
      var moveX = 0;
      var moveY = 0;
      var profile = this.botProfile || {};
      var pickupTarget = this.getBotPickupTarget();
      var primaryEnemy = this.getBotPrimaryEnemy();
      var preferredRange = profile.preferredRange || 180;
      var avoidRange = profile.avoidRange || Math.max(96, preferredRange * 0.64);
      var strafeWeight = profile.strafeWeight || 0.55;
      var projectileFear = profile.projectileFear || 0.65;
      var crowdFear = profile.crowdFear || 0.65;
      var i;

      if (pickupTarget) {
        var pickupDirection = normalize(pickupTarget.x - this.player.x, pickupTarget.y - this.player.y);
        moveX += pickupDirection.x * ((profile.pickupBias || 0.7) + 0.2);
        moveY += pickupDirection.y * ((profile.pickupBias || 0.7) + 0.2);
      }

      if (primaryEnemy) {
        var enemyDirection = normalize(primaryEnemy.x - this.player.x, primaryEnemy.y - this.player.y);
        var enemyDistance = enemyDirection.length;
        if (enemyDistance > preferredRange + 42) {
          moveX += enemyDirection.x * 0.92;
          moveY += enemyDirection.y * 0.92;
        } else if (enemyDistance < avoidRange) {
          moveX -= enemyDirection.x * 1.26;
          moveY -= enemyDirection.y * 1.26;
        }
        moveX += -enemyDirection.y * strafeWeight * (this.botState.orbitSign || 1);
        moveY += enemyDirection.x * strafeWeight * (this.botState.orbitSign || 1);
      } else {
        this.botState.wanderAngle += 0.018;
        moveX += Math.cos(this.botState.wanderAngle) * 0.72;
        moveY += Math.sin(this.botState.wanderAngle * 0.9) * 0.72;
      }

      for (i = 0; i < this.enemies.length; i += 1) {
        var enemy = this.enemies[i];
        var dist = pointDistance(this.player.x, this.player.y, enemy.x, enemy.y);
        if (dist <= 0 || dist > 240) {
          continue;
        }
        var penalty = enemy.category === "boss" ? 1.25 : enemy.category === "elite" ? 0.9 : 0.5;
        penalty *= crowdFear * (1 + (240 - dist) / 240);
        penalty *= this.getBotEnemyPenalty(enemy.archetypeId || "");
        moveX -= ((enemy.x - this.player.x) / dist) * penalty;
        moveY -= ((enemy.y - this.player.y) / dist) * penalty;
      }

      for (i = 0; i < this.enemyProjectiles.length; i += 1) {
        var shot = this.enemyProjectiles[i];
        var shotDist = pointDistance(this.player.x, this.player.y, shot.x, shot.y);
        if (shotDist <= 0 || shotDist > 170) {
          continue;
        }
        moveX -= ((shot.x - this.player.x) / shotDist) * projectileFear * (1 + (170 - shotDist) / 170);
        moveY -= ((shot.y - this.player.y) / shotDist) * projectileFear * (1 + (170 - shotDist) / 170);
      }

      if (this.player.hp / Math.max(1, this.player.maxHp) < 0.32) {
        moveX *= 1.08;
        moveY *= 1.08;
      }

      moveX += Math.cos(this.elapsedSec * 1.8 + this.botRelayIndex * 0.9) * 0.18;
      moveY += Math.sin(this.elapsedSec * 1.4 + this.botRelayIndex * 1.1) * 0.16;

      var length = Math.sqrt(moveX * moveX + moveY * moveY);
      if (length <= 0.001) {
        return { x: 0, y: 0, intensity: 0 };
      }

      return {
        x: moveX / length,
        y: moveY / length,
        intensity: clamp(length * 0.92, 0.52, 0.94)
      };
    }

    getMoveVector(input) {
      var axis = input.getAxis();
      var pointer = input.getPointer();
      var playerScreen;
      var mouseDirection;
      var touchDirection;

      if (this.isBotMode) {
        return this.getBotMoveVector();
      }

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
      var originX = typeof opts.originX === "number" ? opts.originX : this.player.x;
      var originY = typeof opts.originY === "number" ? opts.originY : this.player.y;
      var visual = this.getSkinShotVisual(opts.skinKind || opts.kind || "bullet", opts.color || "#7fe6ff");
      this.projectiles.push({
        x: originX,
        y: originY,
        vx: direction.x * (opts.speed || this.player.bulletSpeed),
        vy: direction.y * (opts.speed || this.player.bulletSpeed),
        radius: opts.radius || 6,
        life: opts.life || 1.3,
        damage: opts.damage || this.player.damage,
        color: opts.color || visual.color,
        pierce: typeof opts.pierce === "number" ? opts.pierce : this.player.pierce,
        kind: opts.kind || "bullet",
        trailRate: typeof opts.trailRate === "number" ? opts.trailRate : visual.trailRate,
        trailTimer: typeof opts.trailRate === "number" ? opts.trailRate : visual.trailRate,
        trailColor: opts.trailColor || visual.trailColor,
        accentColor: opts.accentColor || visual.accentColor,
        shape: opts.shape || visual.shape,
        spin: typeof opts.spin === "number" ? opts.spin : visual.spin,
        age: 0,
        homing: opts.homing || 0,
        turnRate: opts.turnRate || 0,
        weaponKind: opts.weaponKind || ""
      });
      this.spawnSkinAttackFx(opts.skinKind || opts.kind || "bullet", originX, originY, visual);
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
        case "toast":
          this.effects.spawnRing(shot.x, shot.y, {
            color: "#ff9dc9",
            radius: 4,
            growth: 16,
            lineWidth: 1,
            life: 0.12,
            fillAlpha: 0.06
          });
          break;
        case "anvil":
          this.effects.spawnParticleBurst(shot.x, shot.y, {
            count: 2,
            color: "#d5dde7",
            speedMin: 8,
            speedMax: 22,
            life: 0.14,
            sizeStart: 2,
            sizeEnd: 1,
            shape: "diamond"
          });
          break;
        case "spore":
          this.effects.spawnParticleBurst(shot.x, shot.y, {
            count: 2,
            color: "#f0a7a7",
            speedMin: 5,
            speedMax: 18,
            life: 0.12,
            sizeStart: 2,
            sizeEnd: 1,
            shape: "circle"
          });
          break;
        case "relic":
          this.effects.spawnStreak(shot.x, shot.y, -shot.vx * 0.07, -shot.vy * 0.07, {
            life: 0.12,
            color: "#d9d1ff",
            width: 2,
            length: 14,
            drag: 0.9
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
        case "toast":
          ctx.fillStyle = shot.color;
          ctx.beginPath();
          ctx.moveTo(0, -shot.radius);
          ctx.bezierCurveTo(shot.radius * 0.8, -shot.radius * 0.4, shot.radius * 0.7, shot.radius * 0.8, 0, shot.radius);
          ctx.bezierCurveTo(-shot.radius * 0.7, shot.radius * 0.8, -shot.radius * 0.8, -shot.radius * 0.4, 0, -shot.radius);
          ctx.fill();
          ctx.fillStyle = "#fff1f5";
          ctx.beginPath();
          ctx.arc(-shot.radius * 0.16, -shot.radius * 0.1, shot.radius * 0.18, 0, Math.PI * 2);
          ctx.arc(shot.radius * 0.18, shot.radius * 0.06, shot.radius * 0.13, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "anvil":
          ctx.rotate(rotation + Math.PI * 0.18);
          ctx.fillStyle = shot.color;
          ctx.fillRect(-shot.radius, -shot.radius * 0.7, shot.radius * 2, shot.radius * 1.4);
          ctx.fillRect(-shot.radius * 0.52, -shot.radius, shot.radius * 1.04, shot.radius * 0.34);
          ctx.fillStyle = "#f8fbff";
          ctx.fillRect(-shot.radius * 0.22, -shot.radius * 0.34, shot.radius * 0.44, shot.radius * 0.2);
          break;
        case "spore":
          ctx.fillStyle = shot.color;
          ctx.beginPath();
          ctx.arc(0, 0, shot.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffd7d7";
          ctx.beginPath();
          ctx.arc(-shot.radius * 0.24, -shot.radius * 0.12, shot.radius * 0.2, 0, Math.PI * 2);
          ctx.arc(shot.radius * 0.18, shot.radius * 0.18, shot.radius * 0.14, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "relic":
          ctx.rotate(rotation + Math.PI * 0.25);
          ctx.fillStyle = shot.color;
          ctx.beginPath();
          ctx.moveTo(0, -shot.radius);
          ctx.lineTo(shot.radius * 0.44, 0);
          ctx.lineTo(0, shot.radius);
          ctx.lineTo(-shot.radius * 0.44, 0);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#fff1c4";
          ctx.fillRect(-1, -shot.radius * 0.6, 2, shot.radius * 1.2);
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

    drawWeaponFx(ctx, shake) {
      var i;
      for (i = 0; i < this.weaponFx.length; i += 1) {
        var fx = this.weaponFx[i];
        var center = this.worldToScreen(fx.x, fx.y, shake);
        var lifeRatio = fx.maxLife > 0 ? fx.life / fx.maxLife : 0;
        var radius = fx.reach * (fx.kind === "wandCast" ? 0.34 : 0.72);
        var startAngle = fx.angle - fx.arc * 0.5;
        var endAngle = fx.angle + fx.arc * 0.5;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, lifeRatio));

        if (fx.kind === "slash") {
          ctx.strokeStyle = fx.color;
          ctx.lineWidth = fx.width * lifeRatio;
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, startAngle, endAngle);
          ctx.stroke();
          ctx.strokeStyle = fx.accentColor || "#ffffff";
          ctx.lineWidth = Math.max(2, fx.width * 0.32 * lifeRatio);
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius - fx.width * 0.2, startAngle + 0.04, endAngle - 0.04);
          ctx.stroke();
        } else if (fx.kind === "axe") {
          ctx.strokeStyle = fx.color;
          ctx.lineWidth = fx.width * lifeRatio;
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, startAngle, endAngle);
          ctx.stroke();
          var tipX = center.x + Math.cos(fx.angle) * radius;
          var tipY = center.y + Math.sin(fx.angle) * radius;
          ctx.fillStyle = fx.accentColor || "#fff1c4";
          ctx.beginPath();
          ctx.moveTo(tipX, tipY);
          ctx.lineTo(tipX + Math.cos(fx.angle - 0.9) * 22, tipY + Math.sin(fx.angle - 0.9) * 22);
          ctx.lineTo(tipX + Math.cos(fx.angle + 0.3) * 12, tipY + Math.sin(fx.angle + 0.3) * 12);
          ctx.lineTo(tipX + Math.cos(fx.angle + 0.9) * 24, tipY + Math.sin(fx.angle + 0.9) * 24);
          ctx.closePath();
          ctx.fill();
        } else if (fx.kind === "wandCast") {
          ctx.strokeStyle = fx.color;
          ctx.lineWidth = Math.max(2, fx.width * 0.2 * lifeRatio);
          ctx.beginPath();
          ctx.arc(center.x, center.y, 18 + fx.age * 30, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = fx.accentColor || "#fff1c4";
          ctx.beginPath();
          ctx.arc(center.x, center.y, 8 + fx.age * 18, 0, Math.PI * 2);
          ctx.stroke();
          ctx.translate(center.x, center.y);
          ctx.rotate(fx.angle + fx.age * 3);
          ctx.strokeStyle = fx.trailColor || fx.color;
          ctx.beginPath();
          ctx.moveTo(0, -22);
          ctx.lineTo(0, 22);
          ctx.moveTo(-22, 0);
          ctx.lineTo(22, 0);
          ctx.stroke();
        } else if (fx.kind === "meteor") {
          var cometY = center.y - 120 + (1 - lifeRatio) * 120;
          ctx.strokeStyle = fx.trailColor || fx.color;
          ctx.lineWidth = Math.max(3, fx.width * 0.3);
          ctx.beginPath();
          ctx.moveTo(center.x - 18, cometY - 34);
          ctx.lineTo(center.x, cometY);
          ctx.stroke();
          ctx.fillStyle = fx.color;
          ctx.beginPath();
          ctx.arc(center.x, cometY, 10 + (1 - lifeRatio) * 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = fx.accentColor || "#fff1c4";
          ctx.beginPath();
          ctx.arc(center.x, cometY, 4 + (1 - lifeRatio) * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        if (fx.motif === "water" || fx.motif === "bubble") {
          ctx.fillStyle = fx.trailColor;
          ctx.beginPath();
          ctx.arc(center.x + Math.cos(fx.angle) * (radius * 0.7), center.y + Math.sin(fx.angle) * (radius * 0.7), 5 * lifeRatio + 1, 0, Math.PI * 2);
          ctx.fill();
        } else if (fx.motif === "spark" || fx.motif === "brass") {
          ctx.strokeStyle = fx.accentColor || "#fff1c4";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(center.x + Math.cos(startAngle) * radius, center.y + Math.sin(startAngle) * radius);
          ctx.lineTo(center.x + Math.cos(startAngle) * (radius + 16), center.y + Math.sin(startAngle) * (radius + 16));
          ctx.moveTo(center.x + Math.cos(endAngle) * radius, center.y + Math.sin(endAngle) * radius);
          ctx.lineTo(center.x + Math.cos(endAngle) * (radius + 16), center.y + Math.sin(endAngle) * (radius + 16));
          ctx.stroke();
        } else if (fx.motif === "solar") {
          ctx.strokeStyle = fx.accentColor || "#ffffff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius + 10, startAngle, endAngle);
          ctx.stroke();
        } else if (fx.motif === "neon") {
          ctx.strokeStyle = fx.trailColor || fx.color;
          ctx.globalAlpha = 0.45 * lifeRatio;
          ctx.beginPath();
          ctx.arc(center.x + 8, center.y - 6, radius, startAngle, endAngle);
          ctx.stroke();
        }

        ctx.restore();
      }
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
      var visual;

      if (level <= 0) {
        return;
      }

      burstAngle = this.player.facingAngle + Math.PI;
      count = 1 + Math.floor((level + 1) / 2);
      originX = this.player.x + Math.cos(burstAngle) * (20 + level * 4);
      originY = this.player.y + Math.sin(burstAngle) * (20 + level * 4);
      visual = this.getSkillVisual("afterimageStep");

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
          color: visual.color,
          trailColor: visual.trailColor,
          accentColor: visual.accentColor,
          kind: "afterimage"
        });
      }

      this.effects.spawnRing(originX, originY, {
        color: visual.color,
        radius: 8 + level * 3,
        growth: 72 + level * 22,
        lineWidth: 2,
        life: 0.24,
        fillAlpha: 0.07
      });
      this.spawnSkillSignature("afterimageStep", originX, originY, {
        power: 0.8 + level * 0.2,
        angle: burstAngle,
        radius: 12 + level * 3
      });
    }

    pushWeaponFx(effect) {
      var fx = Object.assign({}, effect || {});
      fx.life = fx.life || 0.18;
      fx.maxLife = fx.maxLife || fx.life;
      this.weaponFx.push(fx);
      if (this.weaponFx.length > 28) {
        this.weaponFx.shift();
      }
    }

    spawnWeaponMotifFx(x, y, visual, scale) {
      var amount = scale || 1;
      if (visual.motif === "water" || visual.motif === "bubble") {
        this.effects.spawnParticleBurst(x, y, {
          count: 3 + Math.floor(amount),
          color: visual.trailColor,
          speedMin: 12,
          speedMax: 40,
          life: 0.18,
          sizeStart: 3,
          sizeEnd: 1,
          shape: "circle"
        });
      } else if (visual.motif === "spark" || visual.motif === "brass") {
        this.effects.spawnRadialStreakBurst(x, y, {
          count: 6 + Math.floor(amount * 2),
          speedMin: 36,
          speedMax: 92,
          life: 0.18,
          color: visual.accentColor,
          width: 2,
          length: 12 + amount * 4,
          drag: 0.86
        });
      } else if (visual.motif === "solar") {
        this.effects.spawnRing(x, y, {
          color: visual.flashColor,
          radius: 8,
          growth: 56 + amount * 18,
          lineWidth: 2,
          life: 0.18,
          fillAlpha: 0.08
        });
      } else if (visual.motif === "neon") {
        this.effects.spawnEcho(x, y, {
          width: 22 + amount * 6,
          height: 10 + amount * 2,
          life: 0.12,
          color: visual.color,
          outlineColor: visual.accentColor,
          rotation: this.player.facingAngle,
          shape: "box"
        });
      }
    }

    hitEnemiesInArc(originX, originY, angle, reach, arcWidth, damage, options) {
      var opts = options || {};
      var hits = 0;
      var i;
      for (i = this.enemies.length - 1; i >= 0; i -= 1) {
        var enemy = this.enemies[i];
        var dist = pointDistance(originX, originY, enemy.x, enemy.y);
        var enemyAngle;
        var tolerance;
        if (dist > reach + enemy.radius) {
          continue;
        }
        enemyAngle = Math.atan2(enemy.y - originY, enemy.x - originX);
        tolerance = Math.abs(angleDifference(enemyAngle, angle));
        if (tolerance > arcWidth * 0.5 + enemy.radius / Math.max(40, reach)) {
          continue;
        }
        enemy.hp -= damage;
        if (opts.impulse) {
          enemy.x += Math.cos(angle) * opts.impulse;
          enemy.y += Math.sin(angle) * opts.impulse;
        }
        this.effects.spawnHit(enemy.x, enemy.y, {
          color: opts.color || "#ffe07a",
          ringColor: opts.ringColor || "#fff1c4",
          radius: enemy.category === "boss" ? 12 : 9
        });
        if (enemy.hp <= 0) {
          this.killEnemy(enemy, enemy.category === "elite" || enemy.category === "boss");
          this.enemies.splice(i, 1);
        }
        hits += 1;
      }
      return hits;
    }

    fireSummerSword() {
      var level = this.player.swordLevel;
      var target = this.getNearestEnemy();
      var angle;
      var reach;
      var arcWidth;
      var damage;
      var visual;
      var tipX;
      var tipY;
      var echoOffset;

      if (level <= 0 || !target) {
        return;
      }

      angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
      this.player.facingAngle = angle;
      reach = 112 + level * 18;
      arcWidth = 1.02 + level * 0.08;
      damage = Math.round(this.player.damage * 0.72 + 14 + level * 10);
      visual = this.getWeaponVisual("sword");
      tipX = this.player.x + Math.cos(angle) * (reach * 0.74);
      tipY = this.player.y + Math.sin(angle) * (reach * 0.74);
      echoOffset = level >= 4 ? 0.18 : 0;

      this.pushWeaponFx({
        kind: "slash",
        x: this.player.x,
        y: this.player.y,
        angle: angle,
        reach: reach,
        arc: arcWidth,
        width: 18 + level * 2,
        life: 0.2,
        color: visual.color,
        accentColor: visual.accentColor,
        trailColor: visual.trailColor,
        motif: visual.motif
      });
      if (echoOffset) {
        this.pushWeaponFx({
          kind: "slash",
          x: this.player.x,
          y: this.player.y,
          angle: angle - echoOffset,
          reach: reach * 0.9,
          arc: arcWidth * 0.82,
          width: 10 + level,
          life: 0.14,
          color: visual.accentColor,
          accentColor: "#ffffff",
          trailColor: visual.trailColor,
          motif: visual.motif
        });
      }
      this.hitEnemiesInArc(this.player.x, this.player.y, angle, reach, arcWidth, damage, {
        color: visual.color,
        ringColor: visual.accentColor,
        impulse: 4 + level * 1.4
      });
      this.spawnWeaponMotifFx(tipX, tipY, visual, 1 + level * 0.25);
      this.effects.spawnRadialStreakBurst(tipX, tipY, {
        count: 5 + level,
        speedMin: 40,
        speedMax: 104,
        life: 0.16,
        color: visual.trailColor,
        width: 2,
        length: 16,
        drag: 0.86
      });
      this.spawnSkillSignature("summerSword", tipX, tipY, {
        power: 1 + level * 0.2,
        angle: angle,
        radius: 18 + level * 3
      });
      this.player.swordCooldown = Math.max(0.28, 1.12 - level * 0.12) * this.player.specialCooldownFactor;
    }

    fireBreakerAxe() {
      var level = this.player.axeLevel;
      var target = this.getNearestEnemy();
      var angle;
      var reach;
      var arcWidth;
      var damage;
      var impactRadius;
      var visual;
      var tipX;
      var tipY;
      var i;

      if (level <= 0 || !target) {
        return;
      }

      angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
      this.player.facingAngle = angle;
      reach = 124 + level * 16;
      arcWidth = 0.88 + level * 0.05;
      damage = Math.round(this.player.damage * 0.94 + 18 + level * 12);
      impactRadius = 34 + level * 8;
      visual = this.getWeaponVisual("axe");
      tipX = this.player.x + Math.cos(angle) * (reach * 0.78);
      tipY = this.player.y + Math.sin(angle) * (reach * 0.78);

      this.pushWeaponFx({
        kind: "axe",
        x: this.player.x,
        y: this.player.y,
        angle: angle,
        reach: reach,
        arc: arcWidth,
        width: 24 + level * 3,
        life: 0.24,
        color: visual.color,
        accentColor: visual.accentColor,
        trailColor: visual.trailColor,
        motif: visual.motif
      });
      this.hitEnemiesInArc(this.player.x, this.player.y, angle, reach, arcWidth, damage, {
        color: visual.color,
        ringColor: visual.accentColor,
        impulse: 10 + level * 2
      });
      for (i = this.enemies.length - 1; i >= 0; i -= 1) {
        var enemy = this.enemies[i];
        if (pointDistance(enemy.x, enemy.y, tipX, tipY) <= impactRadius + enemy.radius) {
          enemy.hp -= Math.round(damage * 0.38);
          this.effects.spawnHit(enemy.x, enemy.y, {
            color: visual.trailColor,
            ringColor: visual.accentColor,
            radius: 10
          });
          if (enemy.hp <= 0) {
            this.killEnemy(enemy, enemy.category === "elite" || enemy.category === "boss");
            this.enemies.splice(i, 1);
          }
        }
      }
      this.effects.spawnRing(tipX, tipY, {
        color: visual.color,
        radius: 16,
        growth: impactRadius + 26,
        lineWidth: 3,
        life: 0.22,
        fillAlpha: 0.08
      });
      this.spawnWeaponMotifFx(tipX, tipY, visual, 1.4 + level * 0.25);
      this.effects.triggerShake(6 + level, 0.1);
      this.spawnSkillSignature("breakerAxe", tipX, tipY, {
        power: 1.1 + level * 0.22,
        angle: angle,
        radius: impactRadius * 0.5
      });
      this.player.axeCooldown = Math.max(0.52, 1.7 - level * 0.16) * this.player.specialCooldownFactor;
    }

    fireMysticWand() {
      var level = this.player.wandLevel;
      var bolts;
      var target = this.getNearestEnemy();
      var angle;
      var visual;
      var originX;
      var originY;
      var i;

      if (level <= 0 || !target) {
        return;
      }

      angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
      this.player.facingAngle = angle;
      bolts = 1 + Math.floor(level / 2);
      visual = this.getWeaponVisual("wand");
      originX = this.player.x + Math.cos(angle) * 22;
      originY = this.player.y + Math.sin(angle) * 22;

      this.pushWeaponFx({
        kind: "wandCast",
        x: this.player.x,
        y: this.player.y,
        angle: angle,
        reach: 60 + level * 8,
        arc: 0.7,
        width: 12 + level * 2,
        life: 0.22,
        color: visual.color,
        accentColor: visual.accentColor,
        trailColor: visual.trailColor,
        motif: visual.motif
      });

      for (i = 0; i < bolts; i += 1) {
        var spread = bolts > 1 ? (i - (bolts - 1) / 2) * 0.18 : 0;
        this.createPlayerShot({
          x: Math.cos(angle + spread),
          y: Math.sin(angle + spread)
        }, {
          originX: originX,
          originY: originY,
          speed: 420 + level * 30,
          radius: 7,
          life: 1.9,
          damage: Math.round(this.player.damage * 0.56 + 9 + level * 8),
          color: visual.color,
          trailColor: visual.trailColor,
          accentColor: visual.accentColor,
          kind: "wandbolt",
          skinKind: "pulse",
          shape: "circle",
          spin: 10,
          trailRate: 0.05,
          homing: 1.4 + level * 0.28,
          turnRate: 5.5 + level * 1.2,
          weaponKind: "wand"
        });
      }

      this.effects.spawnRing(originX, originY, {
        color: visual.color,
        radius: 10,
        growth: 66 + level * 12,
        lineWidth: 2,
        life: 0.18,
        fillAlpha: 0.06
      });
      this.spawnWeaponMotifFx(originX, originY, visual, 1 + level * 0.2);
      this.spawnSkillSignature("mysticWand", originX, originY, {
        power: 1 + level * 0.2,
        angle: angle,
        radius: 18 + level * 2
      });
      this.player.wandCooldown = Math.max(0.38, 1.18 - level * 0.1) * this.player.specialCooldownFactor;
    }

    updateWeaponFx(dt) {
      var i;
      for (i = this.weaponFx.length - 1; i >= 0; i -= 1) {
        var fx = this.weaponFx[i];
        fx.life -= dt;
        fx.age = (fx.age || 0) + dt;
        if (fx.kind === "wandCast") {
          fx.reach += dt * 48;
        }
        if (fx.life <= 0) {
          this.weaponFx.splice(i, 1);
        }
      }
    }

    fireNeonNeedles() {
      var level = this.player.needleLevel;
      var target = this.getNearestEnemy();
      var angle;
      var count;
      var visual;
      var i;

      if (level <= 0 || !target) {
        return;
      }

      angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
      this.player.facingAngle = angle;
      count = 2 + Math.floor(level / 2);
      visual = this.getSkillVisual("neonNeedle");
      for (i = 0; i < count; i += 1) {
        var spread = count > 1 ? (i - (count - 1) / 2) * 0.14 : 0;
        this.createPlayerShot({
          x: Math.cos(angle + spread),
          y: Math.sin(angle + spread)
        }, {
          originX: this.player.x + Math.cos(angle) * 18,
          originY: this.player.y + Math.sin(angle) * 18,
          speed: this.player.bulletSpeed * 1.12,
          radius: 5,
          life: 1.5,
          damage: Math.round(this.player.damage * 0.36 + 8 + level * 6),
          color: visual.color,
          trailColor: visual.trailColor,
          accentColor: visual.accentColor,
          kind: "needle",
          skinKind: "crit",
          shape: "ticket",
          spin: 12,
          trailRate: 0.04,
          homing: 0.9 + level * 0.2,
          turnRate: 4.8 + level * 0.8
        });
      }
      this.spawnSkillSignature("neonNeedle", this.player.x, this.player.y, {
        power: 1 + level * 0.2,
        angle: angle,
        radius: 14 + level * 2
      });
      this.player.needleCooldown = Math.max(0.28, 1.02 - level * 0.08) * this.player.specialCooldownFactor;
    }

    fireMeteorCall() {
      var level = this.player.meteorLevel;
      var target = this.getNearestEnemy();
      var impactX;
      var impactY;
      var radius;
      var damage;
      var visual;
      var i;

      if (level <= 0 || !target) {
        return;
      }

      impactX = target.x;
      impactY = target.y;
      radius = 42 + level * 8;
      damage = Math.round(this.player.damage * 0.82 + 18 + level * 11);
      visual = this.getSkillVisual("meteorCall");

      this.pushWeaponFx({
        kind: "meteor",
        x: impactX,
        y: impactY,
        angle: -Math.PI * 0.5,
        reach: 120 + level * 12,
        arc: 0.2,
        width: 16 + level * 2,
        life: 0.28,
        color: visual.color,
        accentColor: visual.accentColor,
        trailColor: visual.trailColor,
        motif: visual.motif
      });
      this.effects.triggerShake(6 + level, 0.12);
      this.spawnSkillSignature("meteorCall", impactX, impactY, {
        power: 1.4 + level * 0.2,
        radius: radius
      });

      for (i = this.enemies.length - 1; i >= 0; i -= 1) {
        var enemy = this.enemies[i];
        if (pointDistance(enemy.x, enemy.y, impactX, impactY) <= radius + enemy.radius) {
          enemy.hp -= damage;
          this.effects.spawnHit(enemy.x, enemy.y, {
            color: visual.color,
            ringColor: visual.accentColor,
            radius: 12
          });
          if (enemy.hp <= 0) {
            this.killEnemy(enemy, enemy.category === "elite" || enemy.category === "boss");
            this.enemies.splice(i, 1);
          }
        }
      }

      this.player.meteorCooldown = Math.max(1.2, 4.3 - level * 0.32) * this.player.specialCooldownFactor;
    }

    fireThunderChain() {
      var level = this.player.thunderLevel;
      var currentTarget = this.getNearestEnemy();
      var visual;
      var chainRange;
      var jumps;
      var damage;
      var fromX;
      var fromY;
      var hitEnemies;
      var i;
      var j;
      var nextTarget;
      var nearestDistance;

      if (level <= 0 || !currentTarget) {
        return;
      }

      visual = this.getSkillVisual("thunderChain");
      chainRange = 158 + level * 20;
      jumps = 2 + Math.floor(level / 2);
      damage = Math.round(this.player.damage * 0.5 + 14 + level * 9);
      fromX = this.player.x;
      fromY = this.player.y;
      hitEnemies = [];

      for (i = 0; i < jumps && currentTarget; i += 1) {
        this.beamFx.push({
          x1: fromX,
          y1: fromY,
          x2: currentTarget.x,
          y2: currentTarget.y,
          width: 8 + level,
          life: 0.14,
          color: visual.color,
          flashColor: visual.accentColor
        });
        currentTarget.hp -= Math.round(damage * Math.max(0.68, 1 - i * 0.12));
        this.effects.spawnHit(currentTarget.x, currentTarget.y, {
          color: visual.color,
          ringColor: visual.accentColor,
          radius: 11
        });
        hitEnemies.push(currentTarget);
        if (currentTarget.hp <= 0) {
          this.killEnemy(currentTarget, currentTarget.category === "elite" || currentTarget.category === "boss");
          this.enemies.splice(this.enemies.indexOf(currentTarget), 1);
        }
        fromX = currentTarget.x;
        fromY = currentTarget.y;
        nextTarget = null;
        nearestDistance = chainRange * chainRange;
        for (j = 0; j < this.enemies.length; j += 1) {
          var enemy = this.enemies[j];
          if (hitEnemies.indexOf(enemy) >= 0) {
            continue;
          }
          var dist = distanceSquared({ x: fromX, y: fromY }, enemy);
          if (dist < nearestDistance) {
            nearestDistance = dist;
            nextTarget = enemy;
          }
        }
        currentTarget = nextTarget;
      }

      this.spawnSkillSignature("thunderChain", fromX, fromY, {
        power: 1.1 + level * 0.18,
        radius: 16 + level * 2
      });
      this.player.thunderCooldown = Math.max(0.8, 3.2 - level * 0.24) * this.player.specialCooldownFactor;
    }

    fireBlizzardFan() {
      var level = this.player.blizzardLevel;
      var target = this.getNearestEnemy();
      var angle;
      var count;
      var visual;
      var i;

      if (level <= 0) {
        return;
      }

      angle = target
        ? Math.atan2(target.y - this.player.y, target.x - this.player.x)
        : this.player.facingAngle;
      this.player.facingAngle = angle;
      count = 4 + level * 2;
      visual = this.getSkillVisual("blizzardFan");

      for (i = 0; i < count; i += 1) {
        var spread = count > 1 ? (i - (count - 1) / 2) * 0.1 : 0;
        this.createPlayerShot({
          x: Math.cos(angle + spread),
          y: Math.sin(angle + spread)
        }, {
          originX: this.player.x + Math.cos(angle) * 16,
          originY: this.player.y + Math.sin(angle) * 16,
          speed: this.player.bulletSpeed * 0.82,
          radius: 5,
          life: 1.35,
          damage: Math.round(this.player.damage * 0.34 + 8 + level * 5),
          color: visual.color,
          trailColor: visual.trailColor,
          accentColor: visual.accentColor,
          kind: "ice",
          skinKind: "pulse",
          shape: "circle",
          trailRate: 0.05
        });
      }

      this.spawnSkillSignature("blizzardFan", this.player.x, this.player.y, {
        power: 0.9 + level * 0.18,
        angle: angle,
        radius: 20 + level * 3
      });
      this.player.blizzardCooldown = Math.max(0.46, 1.56 - level * 0.1) * this.player.specialCooldownFactor;
    }

    fireCrossLance() {
      var level = this.player.crossLevel;
      var visual;
      var directions;
      var i;

      if (level <= 0) {
        return;
      }

      visual = this.getSkillVisual("crossLance");
      directions = [
        0,
        Math.PI * 0.5,
        Math.PI,
        Math.PI * 1.5
      ];
      if (level >= 4) {
        directions.push(Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75);
      }

      for (i = 0; i < directions.length; i += 1) {
        this.createPlayerShot({
          x: Math.cos(directions[i]),
          y: Math.sin(directions[i])
        }, {
          speed: this.player.bulletSpeed * 0.96,
          radius: 6,
          life: 1.18,
          damage: Math.round(this.player.damage * 0.42 + 10 + level * 6),
          pierce: 1 + Math.floor(level / 3),
          color: visual.color,
          trailColor: visual.trailColor,
          accentColor: visual.accentColor,
          kind: "cross",
          skinKind: "beam",
          shape: "diamond",
          trailRate: 0.05
        });
      }

      this.spawnSkillSignature("crossLance", this.player.x, this.player.y, {
        power: 1 + level * 0.2,
        radius: 24 + level * 4
      });
      this.player.crossCooldown = Math.max(0.88, 2.65 - level * 0.16) * this.player.specialCooldownFactor;
    }

    fireBoomerangDisc() {
      var level = this.player.boomerangLevel;
      var target = this.getNearestEnemy();
      var angle;
      var count;
      var visual;
      var i;

      if (level <= 0) {
        return;
      }

      angle = target
        ? Math.atan2(target.y - this.player.y, target.x - this.player.x)
        : this.player.facingAngle;
      this.player.facingAngle = angle;
      count = 1 + Math.floor(level / 2);
      visual = this.getSkillVisual("boomerangDisc");

      for (i = 0; i < count; i += 1) {
        var spread = count > 1 ? (i - (count - 1) / 2) * 0.24 : 0;
        this.createPlayerShot({
          x: Math.cos(angle + spread),
          y: Math.sin(angle + spread)
        }, {
          originX: this.player.x + Math.cos(angle + spread) * 22,
          originY: this.player.y + Math.sin(angle + spread) * 22,
          speed: this.player.bulletSpeed * 0.74,
          radius: 9,
          life: 1.7,
          damage: Math.round(this.player.damage * 0.46 + 12 + level * 7),
          pierce: 2 + Math.floor(level / 2),
          color: visual.color,
          trailColor: visual.trailColor,
          accentColor: visual.accentColor,
          kind: "disc",
          skinKind: "crit",
          shape: "diamond",
          spin: 14,
          trailRate: 0.04
        });
      }

      this.spawnSkillSignature("boomerangDisc", this.player.x, this.player.y, {
        power: 1 + level * 0.2,
        angle: angle,
        radius: 18 + level * 3
      });
      this.player.boomerangCooldown = Math.max(0.84, 2.2 - level * 0.14) * this.player.specialCooldownFactor;
    }

    firePetalStorm() {
      var level = this.player.petalLevel;
      var count;
      var visual;
      var i;

      if (level <= 0) {
        return;
      }

      count = 8 + level * 2;
      visual = this.getSkillVisual("petalStorm");

      for (i = 0; i < count; i += 1) {
        var angle = this.elapsedSec * 1.8 + (Math.PI * 2 * i) / count;
        this.createPlayerShot({
          x: Math.cos(angle),
          y: Math.sin(angle)
        }, {
          speed: 320 + level * 18,
          radius: 5,
          life: 1.08,
          damage: Math.round(this.player.damage * 0.32 + 7 + level * 5),
          pierce: 1,
          color: visual.color,
          trailColor: visual.trailColor,
          accentColor: visual.accentColor,
          kind: "petal",
          skinKind: "pulse",
          shape: "circle",
          trailRate: 0.06
        });
      }

      this.spawnSkillSignature("petalStorm", this.player.x, this.player.y, {
        power: 0.9 + level * 0.16,
        radius: 26 + level * 4
      });
      this.player.petalCooldown = Math.max(0.76, 2.42 - level * 0.16) * this.player.specialCooldownFactor;
    }

    fireCometTrail() {
      var level = this.player.cometTrailLevel;
      var target = this.getNearestEnemy();
      var visual;
      var hits;
      var radius;
      var damage;
      var i;
      var j;

      if (level <= 0) {
        return;
      }

      visual = this.getSkillVisual("cometTrail");
      hits = 2 + Math.floor(level / 2);
      radius = 34 + level * 6;
      damage = Math.round(this.player.damage * 0.58 + 14 + level * 8);

      for (i = 0; i < hits; i += 1) {
        var anchorX = target ? target.x : this.player.x;
        var anchorY = target ? target.y : this.player.y;
        var offsetAngle = this.elapsedSec * 1.2 + i * (Math.PI * 0.8);
        var impactX = anchorX + Math.cos(offsetAngle) * (30 + level * 10);
        var impactY = anchorY + Math.sin(offsetAngle) * (26 + level * 8);
        this.pushWeaponFx({
          kind: "meteor",
          x: impactX,
          y: impactY,
          angle: -Math.PI * 0.5,
          reach: 94 + level * 10,
          arc: 0.18,
          width: 12 + level,
          life: 0.24,
          color: visual.color,
          accentColor: visual.accentColor,
          trailColor: visual.trailColor,
          motif: visual.motif
        });
        this.spawnSkillSignature("cometTrail", impactX, impactY, {
          power: 1 + level * 0.16,
          radius: radius
        });
        for (j = this.enemies.length - 1; j >= 0; j -= 1) {
          var enemy = this.enemies[j];
          if (pointDistance(enemy.x, enemy.y, impactX, impactY) <= radius + enemy.radius) {
            enemy.hp -= damage;
            this.effects.spawnHit(enemy.x, enemy.y, {
              color: visual.color,
              ringColor: visual.accentColor,
              radius: 10
            });
            if (enemy.hp <= 0) {
              this.killEnemy(enemy, enemy.category === "elite" || enemy.category === "boss");
              this.enemies.splice(j, 1);
            }
          }
        }
      }

      this.player.cometTrailCooldown = Math.max(1.5, 4.9 - level * 0.3) * this.player.specialCooldownFactor;
    }

    fireEmberFork() {
      var level = this.player.emberForkLevel;
      var target = this.getNearestEnemy();
      var angle;
      var count;
      var visual;
      var i;

      if (level <= 0) {
        return;
      }

      angle = target
        ? Math.atan2(target.y - this.player.y, target.x - this.player.x)
        : this.player.facingAngle;
      this.player.facingAngle = angle;
      count = 3 + Math.floor(level / 2);
      visual = this.getSkillVisual("emberFork");

      for (i = 0; i < count; i += 1) {
        var spread = count > 1 ? (i - (count - 1) / 2) * 0.16 : 0;
        this.createPlayerShot({
          x: Math.cos(angle + spread),
          y: Math.sin(angle + spread)
        }, {
          originX: this.player.x + Math.cos(angle) * 18,
          originY: this.player.y + Math.sin(angle) * 18,
          speed: this.player.bulletSpeed * 0.88,
          radius: 5,
          life: 1.22,
          damage: Math.round(this.player.damage * 0.36 + 8 + level * 5),
          pierce: Math.floor(level / 3),
          color: visual.color,
          trailColor: visual.trailColor,
          accentColor: visual.accentColor,
          kind: "ember",
          skinKind: "beam",
          shape: "diamond",
          trailRate: 0.05
        });
      }

      this.spawnSkillSignature("emberFork", this.player.x, this.player.y, {
        power: 0.9 + level * 0.18,
        angle: angle,
        radius: 18 + level * 3
      });
      this.player.emberForkCooldown = Math.max(0.48, 1.44 - level * 0.09) * this.player.specialCooldownFactor;
    }

    firePrismRail() {
      var level = this.player.prismRailLevel;
      var target = this.getNearestEnemy();
      var angle;
      var count;
      var spacing;
      var visual;
      var i;

      if (level <= 0) {
        return;
      }

      angle = target
        ? Math.atan2(target.y - this.player.y, target.x - this.player.x)
        : this.player.facingAngle;
      this.player.facingAngle = angle;
      count = level >= 4 ? 3 : 2;
      spacing = 14 + level * 2;
      visual = this.getSkillVisual("prismRail");

      for (i = 0; i < count; i += 1) {
        var offsetIndex = count === 3 ? i - 1 : i - 0.5;
        var px = -Math.sin(angle) * spacing * offsetIndex;
        var py = Math.cos(angle) * spacing * offsetIndex;
        this.createPlayerShot({
          x: Math.cos(angle),
          y: Math.sin(angle)
        }, {
          originX: this.player.x + px,
          originY: this.player.y + py,
          speed: this.player.bulletSpeed * 1.18,
          radius: 6,
          life: 1.24,
          damage: Math.round(this.player.damage * 0.54 + 12 + level * 6),
          pierce: 2 + Math.floor(level / 2),
          color: visual.color,
          trailColor: visual.trailColor,
          accentColor: visual.accentColor,
          kind: "prism",
          skinKind: "beam",
          shape: "diamond",
          trailRate: 0.04
        });
      }

      this.spawnSkillSignature("prismRail", this.player.x, this.player.y, {
        power: 1 + level * 0.18,
        angle: angle,
        radius: 20 + level * 3
      });
      this.player.prismRailCooldown = Math.max(0.78, 2.36 - level * 0.15) * this.player.specialCooldownFactor;
    }

    fireFrostMine() {
      var level = this.player.frostMineLevel;
      var count;
      var visual;
      var i;

      if (level <= 0) {
        return;
      }

      count = 2 + Math.floor(level / 2);
      visual = this.getSkillVisual("frostMine");
      for (i = 0; i < count; i += 1) {
        var angle = this.player.facingAngle + Math.PI + (count > 1 ? (i - (count - 1) / 2) * 0.42 : 0);
        this.createPlayerShot({
          x: Math.cos(angle),
          y: Math.sin(angle)
        }, {
          originX: this.player.x + Math.cos(angle) * 14,
          originY: this.player.y + Math.sin(angle) * 14,
          speed: 90 + level * 12,
          radius: 8,
          life: 2.6 + level * 0.12,
          damage: Math.round(this.player.damage * 0.42 + 10 + level * 6),
          pierce: 1,
          color: visual.color,
          trailColor: visual.trailColor,
          accentColor: visual.accentColor,
          kind: "mine",
          skinKind: "pulse",
          shape: "circle",
          spin: 5,
          trailRate: 0.07
        });
      }

      this.spawnSkillSignature("frostMine", this.player.x, this.player.y, {
        power: 1 + level * 0.16,
        angle: this.player.facingAngle + Math.PI,
        radius: 24 + level * 4
      });
      this.player.frostMineCooldown = Math.max(1.2, 3.42 - level * 0.2) * this.player.specialCooldownFactor;
    }

    fireSpiralDrive() {
      var level = this.player.spiralDriveLevel;
      var visual;
      var count;
      var i;

      if (level <= 0) {
        return;
      }

      visual = this.getSkillVisual("spiralDrive");
      count = 6 + level * 2;
      for (i = 0; i < count; i += 1) {
        var angle = this.elapsedSec * 2.4 + (Math.PI * 2 * i) / count;
        this.createPlayerShot({
          x: Math.cos(angle),
          y: Math.sin(angle)
        }, {
          speed: 290 + level * 18,
          radius: 5,
          life: 1.36,
          damage: Math.round(this.player.damage * 0.3 + 7 + level * 5),
          pierce: 1,
          color: visual.color,
          trailColor: visual.trailColor,
          accentColor: visual.accentColor,
          kind: "spiral",
          skinKind: "pulse",
          shape: "circle",
          trailRate: 0.05
        });
      }

      this.spawnSkillSignature("spiralDrive", this.player.x, this.player.y, {
        power: 0.95 + level * 0.16,
        radius: 24 + level * 4
      });
      this.player.spiralDriveCooldown = Math.max(0.7, 1.96 - level * 0.12) * this.player.specialCooldownFactor;
    }

    updateHaloSigils(dt) {
      var level = this.player.haloLevel;
      var count;
      var radius;
      var damage;
      var visual;
      var i;
      var j;

      this.haloRender = [];
      if (level <= 0) {
        return;
      }

      count = 1 + Math.floor(level / 2);
      radius = 84 + level * 8;
      damage = Math.round(9 + level * 7 + this.player.damage * 0.2);
      visual = this.getSkillVisual("haloSigil");

      for (i = this.enemies.length - 1; i >= 0; i -= 1) {
        this.enemies[i].haloDamageTimer = Math.max(0, (this.enemies[i].haloDamageTimer || 0) - dt);
      }

      for (j = 0; j < count; j += 1) {
        var angle = -this.elapsedSec * (1.4 + level * 0.08) + (Math.PI * 2 * j) / count;
        this.haloRender.push({
          x: this.player.x + Math.cos(angle) * radius,
          y: this.player.y + Math.sin(angle) * radius,
          radius: 10 + level,
          angle: angle,
          color: visual.color,
          accentColor: visual.accentColor
        });
      }

      for (i = this.enemies.length - 1; i >= 0; i -= 1) {
        var enemy = this.enemies[i];
        if ((enemy.haloDamageTimer || 0) > 0) {
          continue;
        }
        for (j = 0; j < this.haloRender.length; j += 1) {
          var sigil = this.haloRender[j];
          if (pointDistance(sigil.x, sigil.y, enemy.x, enemy.y) <= sigil.radius + enemy.radius + 6) {
            enemy.hp -= damage;
            enemy.haloDamageTimer = 0.18;
            this.effects.spawnHit(enemy.x, enemy.y, {
              color: visual.color,
              ringColor: visual.accentColor,
              radius: 9
            });
            this.spawnSkillSignature("haloSigil", sigil.x, sigil.y, {
              power: 0.9 + level * 0.18,
              angle: sigil.angle,
              radius: 14 + level * 2
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

    updateDroneBuddy(dt) {
      var level = this.player.droneLevel;
      var droneCount;
      var orbitRadius;
      var i;
      var target;
      var visual;

      this.droneRender = [];
      if (level <= 0) {
        return;
      }

      visual = this.getSkillVisual("droneBuddy");
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
          color: visual.color,
          trailColor: visual.trailColor,
          accentColor: visual.accentColor,
          kind: "drone"
        });
        this.effects.spawnHeatRipple(drone.x, drone.y, visual.rippleColor || visual.color);
        this.spawnSkillSignature("droneBuddy", drone.x, drone.y, {
          power: 0.8 + level * 0.18,
          angle: Math.atan2(direction.y, direction.x),
          radius: 10 + level * 2
        });
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
          this.spawnSkillSignature("lucky810", this.player.x, this.player.y, {
            power: 1.2,
            radius: 24
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
      if (this.player.vitalBloomLevel > 0) {
        this.player.vitalBloomPulse -= dt;
        if (this.player.vitalBloomPulse <= 0) {
          var vitalRadius = 88 + this.player.vitalBloomLevel * 14;
          var vitalDamage = Math.round(8 + this.player.vitalBloomLevel * 6 + this.player.damage * 0.16);
          var vitalVisual = this.getSkillVisual("vitalBloom");
          this.player.vitalBloomPulse = Math.max(0.54, 1.95 - this.player.vitalBloomLevel * 0.12);
          this.healPlayer(3 + this.player.vitalBloomLevel * 2);
          this.effects.spawnRing(this.player.x, this.player.y, {
            color: vitalVisual.color,
            radius: 16,
            growth: vitalRadius,
            lineWidth: 3,
            life: 0.22,
            fillAlpha: 0.06
          });
          this.spawnSkillSignature("vitalBloom", this.player.x, this.player.y, {
            power: 0.9 + this.player.vitalBloomLevel * 0.18,
            radius: 22 + this.player.vitalBloomLevel * 3
          });
          for (i = this.enemies.length - 1; i >= 0; i -= 1) {
            if (pointDistance(this.enemies[i].x, this.enemies[i].y, this.player.x, this.player.y) <= vitalRadius + this.enemies[i].radius) {
              this.enemies[i].hp -= vitalDamage;
              this.effects.spawnHit(this.enemies[i].x, this.enemies[i].y, {
                color: vitalVisual.color,
                ringColor: vitalVisual.accentColor,
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
      var visual;

      if (level <= 0) {
        return;
      }

      radius = 104 + level * 18;
      damage = Math.round(16 + level * 12 + this.player.damage * 0.22);
      visual = this.getSkillVisual("saltGuard");

      this.effects.spawnRing(this.player.x, this.player.y, {
        color: visual.color,
        radius: 20,
        growth: radius,
        lineWidth: 4,
        life: 0.28,
        fillAlpha: 0.08
      });
      this.spawnSkillSignature("saltGuard", this.player.x, this.player.y, {
        power: 1.1 + level * 0.2,
        radius: radius * 0.36
      });

      for (i = this.enemyProjectiles.length - 1; i >= 0; i -= 1) {
        if (pointDistance(this.enemyProjectiles[i].x, this.enemyProjectiles[i].y, this.player.x, this.player.y) <= radius) {
          this.effects.spawnHit(this.enemyProjectiles[i].x, this.enemyProjectiles[i].y, {
            color: visual.color,
            ringColor: visual.accentColor,
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
            color: visual.color,
            ringColor: visual.accentColor,
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
      var bulletVisual = this.getSkinShotVisual("bullet", "#7fe6ff");
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
          damage: Math.round(this.player.damage * frenzyBoost * (crit ? 1.65 : 1)),
          skinKind: crit ? "crit" : "bullet"
        });
      }

      if (this.player.hypeLevel >= 3 && Math.random() < 0.22) {
        this.createPlayerShot({ x: Math.cos(baseAngle + 0.28), y: Math.sin(baseAngle + 0.28) }, {
          damage: Math.round(this.player.damage * frenzyBoost * 0.88),
          skinKind: "crit"
        });
        this.createPlayerShot({ x: Math.cos(baseAngle - 0.28), y: Math.sin(baseAngle - 0.28) }, {
          damage: Math.round(this.player.damage * frenzyBoost * 0.88),
          skinKind: "crit"
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
            pierce: Math.max(0, this.player.pierce - 1),
            kind: "backshot",
            skinKind: "backshot"
          });
        }
      }

      this.effects.spawnHeatRipple(this.player.x, this.player.y, bulletVisual.rippleColor);
      this.spawnSkillSignature("powerShirt", this.player.x, this.player.y, {
        power: 0.7 + this.getUpgradeLevel("powerShirt") * 0.08 + this.player.hypeLevel * 0.12,
        angle: baseAngle,
        radius: 10 + volleyCount * 2
      });
      if (this.player.backstepLevel > 0) {
        this.spawnSkillSignature("backstepVolley", this.player.x, this.player.y, {
          power: 0.7 + this.player.backstepLevel * 0.18,
          angle: baseAngle + Math.PI,
          radius: 16
        });
      }
      if (this.player.hypeLevel > 0) {
        this.spawnSkillSignature("yarimasuNee", this.player.x, this.player.y, {
          power: 0.8 + this.player.hypeLevel * 0.18,
          angle: baseAngle,
          radius: 18
        });
      }
      if (this.player.overclockLevel > 0 && Math.random() < 0.34) {
        this.spawnSkillSignature("overclockLoop", this.player.x, this.player.y, {
          power: 0.8 + this.player.overclockLevel * 0.16,
          angle: baseAngle,
          radius: 14 + this.player.overclockLevel * 2
        });
      }
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
          kind: "pulse",
          skinKind: "pulse"
        });
      }
      this.effects.spawnRing(this.player.x, this.player.y, {
        color: this.getSkinShotVisual("pulse", "#f5adff").rippleColor,
        radius: 18,
        growth: 200,
        lineWidth: 5,
        life: 0.36
      });
      this.spawnSkillSignature("summerPulse", this.player.x, this.player.y, {
        power: 1 + this.player.pulseLevel * 0.2,
        radius: 22 + this.player.pulseLevel * 4
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
      var beamVisual = this.getSkinShotVisual("beam", "#ffe07a");

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
        color: beamVisual.color,
        flashColor: beamVisual.flashColor
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

      this.effects.flashScreen(beamVisual.flashColor, 0.06, 0.1);
      this.spawnSkillSignature("sunbeam810", endX, endY, {
        power: 1.1 + this.player.beamLevel * 0.18,
        angle: Math.atan2(direction.y, direction.x),
        radius: width + 14
      });
      this.player.beamCooldown = Math.max(1.2, 4.4 - this.player.beamLevel * 0.46) * this.player.specialCooldownFactor;
    }

    awardXp(amount, x, y) {
      var gained = Math.max(1, Math.round(amount * this.player.xpGainMultiplier * (this.isBotMode ? 1.95 : this.isInfinityMode ? 1.12 : 1)));
      this.player.xp += gained;
      this.effects.spawnFloatingText("+" + gained + " " + translate(this.game, "common.xp"), x, y, {
        color: "#88f291",
        size: 16,
        life: 0.55
      });

      while (this.player.xp >= this.player.xpForNext) {
        this.player.xp -= this.player.xpForNext;
        this.player.level += 1;
        this.player.xpForNext = Math.round(this.player.xpForNext * (this.isBotMode ? 1.18 : 1.28) + (this.isBotMode ? 4 : 7));
        this.pendingLevelUps += 1;
        this.effects.spawnLevelUp(this.player.x, this.player.y - 18, translate(this.game, "common.levelUp"));
        this.pushMessage(translate(this.game, "survivor.levelLabel", { level: this.player.level }), 1.1, "#9ee4ff");
      }
      return gained;
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
        this.spawnSkillSignature("pickupAura", this.player.x, this.player.y, {
          power: 1 + this.getUpgradeLevel("pickupAura") * 0.18 + this.player.luckLevel * 0.1,
          radius: 20 + this.getUpgradeLevel("pickupAura") * 4
        });
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
        if (!this.isInfinityMode) {
          this.addScore(Math.max(2, Math.round((pickup.xp || 1) * 3)), this.player.x, this.player.y - 24, {
            silent: true
          });
        }
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
          if (!this.isInfinityMode) {
            this.addScore(90 + this.hazardRank * 4, this.player.x, this.player.y - 20, {
              silent: true
            });
          }
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
          if (!this.isInfinityMode) {
            this.addScore(220 + this.player.level * 12, this.player.x, this.player.y - 20, {
              color: "#7fe6ff"
            });
          }
          break;
        case "chest":
          chestCount = this.applyRandomUpgrades(pickup.rolls || 1);
          if (chestCount <= 0) {
            this.spawnRewardCrystals(8, 3);
          }
          this.triggerSkinChestShow();
          if (!this.isInfinityMode) {
            this.addScore(360 + (pickup.rolls || 1) * 180, this.player.x, this.player.y - 24, {
              color: "#f6c453"
            });
          }
          break;
        case "item114514":
          this.healPlayer(14);
          this.vacuumXpPickups();
          this.awardXp(pickup.value || 114, this.player.x, this.player.y - 20);
          this.applyRandomUpgrades(1);
          this.effects.flashScreen("#ffe07a", 0.14, 0.2);
          if (!this.isInfinityMode) {
            this.addScore(1514, this.player.x, this.player.y - 30, {
              color: "#ffe07a",
              forceText: true
            });
          }
          break;
        case "yarimasuItem":
          this.player.frenzyTimer = Math.max(this.player.frenzyTimer, 12);
          this.fireBasicVolley();
          this.firePulseBurst();
          this.effects.flashScreen("#ffb86f", 0.1, 0.14);
          if (!this.isInfinityMode) {
            this.addScore(810, this.player.x, this.player.y - 26, {
              color: "#ffb86f",
              forceText: true
            });
          }
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
          if (!this.isInfinityMode) {
            this.addScore(920, this.player.x, this.player.y - 26, {
              color: "#9cffb8",
              forceText: true
            });
          }
          break;
        case "ikuikuItem":
          this.triggerIkuikuPulse();
          if (!this.isInfinityMode) {
            this.addScore(980, this.player.x, this.player.y - 26, {
              color: "#ff91d7",
              forceText: true
            });
          }
          break;
        case "loveItem":
          this.healPlayer(24);
          this.vacuumXpPickups();
          this.player.loveAuraTimer = Math.max(this.player.loveAuraTimer, 16);
          this.player.loveAuraPulse = 0.1;
          this.effects.flashScreen("#ff7fb3", 0.08, 0.14);
          if (!this.isInfinityMode) {
            this.addScore(1110, this.player.x, this.player.y - 26, {
              color: "#ff7fb3",
              forceText: true
            });
          }
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
        available.push({
          id: upgradeId,
          weight: def.weight * (level === 0 ? 1.12 : 1.32) * this.getBotUpgradeBonus(upgradeId)
        });
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
          ? "最大強化: コイン +" + coinReward
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
      if (this.isBotMode) {
        this.levelUpSelected = this.pickBotLevelUpChoice();
        this.botState.levelUpTimer = 0.36;
      }
      this.pointerCapturedByUi = true;
    }

    pickBotLevelUpChoice() {
      var bestIndex = 0;
      var bestWeight = -Infinity;
      var i;
      if (!this.levelUpChoices || !this.levelUpChoices.length) {
        return 0;
      }
      for (i = 0; i < this.levelUpChoices.length; i += 1) {
        var upgradeId = this.levelUpChoices[i];
        var def = UPGRADE_CATALOG[upgradeId] || { weight: 1 };
        var level = this.getUpgradeLevel(upgradeId);
        var weight = def.weight * this.getBotUpgradeBonus(upgradeId) - level * 0.2;
        if (weight > bestWeight) {
          bestWeight = weight;
          bestIndex = i;
        }
      }
      return bestIndex;
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

    getLevelUpCardRect(index) {
      if (ns.constants.IS_MOBILE_PORTRAIT) {
        return {
          x: 32,
          y: 170 + index * 172,
          width: 476,
          height: 148
        };
      }
      return {
        x: ns.constants.GAME_WIDTH - LEVELUP_CARD_WIDTH - 74,
        y: 164 + index * (LEVELUP_CARD_HEIGHT + 16),
        width: LEVELUP_CARD_WIDTH,
        height: LEVELUP_CARD_HEIGHT
      };
    }

    handleLevelUpInput(input, dt) {
      var pointer = input.getPointer();
      var i;

      if (!this.levelUpChoices || !this.levelUpChoices.length) {
        this.resolveExcessLevelUps();
        return;
      }
      this.levelUpHover = -1;

      if (this.isBotMode) {
        this.botState.levelUpTimer = Math.max(0, (this.botState.levelUpTimer || 0) - (dt || 0));
        if (this.botState.levelUpTimer <= 0) {
          this.confirmLevelUpChoice(this.levelUpSelected);
        }
        return;
      }

      if (pointer.inside) {
        for (i = 0; i < this.levelUpChoices.length; i += 1) {
          var rect = this.getLevelUpCardRect(i);
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
        this.applyScoreScalingToEnemy(result.spawned[i]);
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
        this.applyScoreScalingToEnemy(result.bosses[i]);
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
              this.game.openTitle({ stageId: this.stageId, hazardRank: this.hazardRank, mode: this.mode });
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

      this.spawnSkinMovementFx(dt, move, moveMagnitude);

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

      if (this.player.needleLevel > 0) {
        this.player.needleCooldown -= dt;
        if (this.player.needleCooldown <= 0) {
          this.fireNeonNeedles();
        }
      }

      if (this.player.meteorLevel > 0) {
        this.player.meteorCooldown -= dt;
        if (this.player.meteorCooldown <= 0) {
          this.fireMeteorCall();
        }
      }

      if (this.player.swordLevel > 0) {
        this.player.swordCooldown -= dt;
        if (this.player.swordCooldown <= 0) {
          this.fireSummerSword();
        }
      }

      if (this.player.axeLevel > 0) {
        this.player.axeCooldown -= dt;
        if (this.player.axeCooldown <= 0) {
          this.fireBreakerAxe();
        }
      }

      if (this.player.wandLevel > 0) {
        this.player.wandCooldown -= dt;
        if (this.player.wandCooldown <= 0) {
          this.fireMysticWand();
        }
      }

      if (this.player.thunderLevel > 0) {
        this.player.thunderCooldown -= dt;
        if (this.player.thunderCooldown <= 0) {
          this.fireThunderChain();
        }
      }

      if (this.player.blizzardLevel > 0) {
        this.player.blizzardCooldown -= dt;
        if (this.player.blizzardCooldown <= 0) {
          this.fireBlizzardFan();
        }
      }

      if (this.player.crossLevel > 0) {
        this.player.crossCooldown -= dt;
        if (this.player.crossCooldown <= 0) {
          this.fireCrossLance();
        }
      }

      if (this.player.boomerangLevel > 0) {
        this.player.boomerangCooldown -= dt;
        if (this.player.boomerangCooldown <= 0) {
          this.fireBoomerangDisc();
        }
      }

      if (this.player.petalLevel > 0) {
        this.player.petalCooldown -= dt;
        if (this.player.petalCooldown <= 0) {
          this.firePetalStorm();
        }
      }

      if (this.player.cometTrailLevel > 0) {
        this.player.cometTrailCooldown -= dt;
        if (this.player.cometTrailCooldown <= 0) {
          this.fireCometTrail();
        }
      }

      if (this.player.emberForkLevel > 0) {
        this.player.emberForkCooldown -= dt;
        if (this.player.emberForkCooldown <= 0) {
          this.fireEmberFork();
        }
      }

      if (this.player.prismRailLevel > 0) {
        this.player.prismRailCooldown -= dt;
        if (this.player.prismRailCooldown <= 0) {
          this.firePrismRail();
        }
      }

      if (this.player.frostMineLevel > 0) {
        this.player.frostMineCooldown -= dt;
        if (this.player.frostMineCooldown <= 0) {
          this.fireFrostMine();
        }
      }

      if (this.player.spiralDriveLevel > 0) {
        this.player.spiralDriveCooldown -= dt;
        if (this.player.spiralDriveCooldown <= 0) {
          this.fireSpiralDrive();
        }
      }

      this.updateHaloSigils(dt);
      this.updateDroneBuddy(dt);
      this.updateTimedBuffs(dt);
      this.updateWeaponFx(dt);

      if (this.playerHitTimer > 0) {
        this.playerHitTimer -= dt;
      }
    }

    updateOrbitDamage(dt) {
      var orbitLevel = this.player.orbitLevel;
      var orbCount;
      var radius;
      var damage;
      var orbitVisual;
      var i;
      var j;

      this.orbitRender = [];
      if (orbitLevel <= 0) {
        return;
      }

      orbCount = 1 + orbitLevel;
      radius = 54 + orbitLevel * 7;
      damage = Math.round(10 + orbitLevel * 8 + this.player.damage * 0.18);
      orbitVisual = this.getSkillVisual("ramuneOrbit");

      for (i = this.enemies.length - 1; i >= 0; i -= 1) {
        this.enemies[i].orbitDamageTimer = Math.max(0, (this.enemies[i].orbitDamageTimer || 0) - dt);
      }

      for (j = 0; j < orbCount; j += 1) {
        var angle = this.elapsedSec * (2.8 + orbitLevel * 0.22) + (Math.PI * 2 * j) / orbCount;
        var ox = this.player.x + Math.cos(angle) * radius;
        var oy = this.player.y + Math.sin(angle) * radius;
        this.orbitRender.push({
          x: ox,
          y: oy,
          radius: 8 + orbitLevel * 0.8,
          color: orbitVisual.color,
          accentColor: orbitVisual.accentColor
        });
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
              color: orbitVisual.color,
              ringColor: orbitVisual.accentColor,
              radius: 9
            });
            this.spawnSkillSignature("ramuneOrbit", orb.x, orb.y, {
              power: 0.8 + orbitLevel * 0.14,
              angle: Math.atan2(enemy.y - orb.y, enemy.x - orb.x),
              radius: 12 + orbitLevel * 2
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
      var lowHp = this.player.hp / Math.max(1, this.player.maxHp) <= 0.58;
      var luckBoost = this.player.luckLevel * 0.01;
      var specialChance = enemy.category === "boss" ? (0.18 + luckBoost * 2) : enemy.category === "elite" ? (0.035 + luckBoost * 0.8) : 0;
      var healChance = enemy.category === "boss"
        ? (lowHp ? 0.18 + luckBoost : 0.04)
        : enemy.category === "elite"
          ? (lowHp ? 0.045 + luckBoost * 0.6 : 0)
          : 0;
      var magnetChance = enemy.category === "boss" ? (0.08 + luckBoost) : enemy.category === "elite" ? (0.02 + luckBoost * 0.4) : 0;

      var xpMultiplier = this.isBotMode ? 1.55 : this.isInfinityMode ? 1.18 : 1;
      this.createPickup("xp", enemy.x, enemy.y, {
        radius: enemy.category === "boss" ? 10 : enemy.category === "elite" ? 8 : 7,
        xp: Math.max(
          1,
          Math.round((enemy.category === "boss" ? enemy.xp + 14 : enemy.category === "elite" ? enemy.xp + 8 : enemy.xp) * xpMultiplier)
        ),
        color: enemy.category === "boss" ? "#f6c453" : enemy.category === "elite" ? "#ffb86f" : "#88f291"
      });

      if (giveChestFx || enemy.category === "boss" || enemy.category === "elite") {
        this.createPickup("chest", enemy.x + 12, enemy.y - 8, {
          radius: enemy.category === "boss" ? 13 : 11,
          color: "#f6c453",
          rolls: enemy.category === "boss" ? 2 + Math.floor(this.hazardRank / 7) : 1
        });
      }

      if (healChance > 0 && Math.random() < healChance) {
        this.createPickup("heal", enemy.x - 12, enemy.y + 8, {
          radius: 9,
          color: "#9cffb8",
          heal: 18 + this.hazardRank
        });
      }

      if (magnetChance > 0 && Math.random() < magnetChance) {
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

      if (!this.isInfinityMode && enemy.category === "boss" && enemy.chestType === "evolution" && this.elapsedSec >= RUN_LENGTH_SEC - 5) {
        this.finishRun("CLEARED");
      }
    }

    updateProjectiles(dt) {
      var i;
      var j;

      for (i = this.projectiles.length - 1; i >= 0; i -= 1) {
        var shot = this.projectiles[i];
        shot.life -= dt;
        shot.age = (shot.age || 0) + dt;
        if (shot.homing > 0 && this.enemies.length) {
          var target = this.getNearestEnemyFrom(shot.x, shot.y);
          if (target) {
            var desiredAngle = Math.atan2(target.y - shot.y, target.x - shot.x);
            var currentAngle = Math.atan2(shot.vy, shot.vx);
            var speed = Math.sqrt(shot.vx * shot.vx + shot.vy * shot.vy) || this.player.bulletSpeed;
            currentAngle += clamp(angleDifference(desiredAngle, currentAngle), -shot.turnRate * dt, shot.turnRate * dt);
            shot.vx = Math.cos(currentAngle) * speed;
            shot.vy = Math.sin(currentAngle) * speed;
          }
          shot.homing = Math.max(0, shot.homing - dt);
        }
        shot.x += shot.vx * dt;
        shot.y += shot.vy * dt;
        if (shot.trailRate > 0) {
          shot.trailTimer -= dt;
          if (shot.trailTimer <= 0) {
            shot.trailTimer += shot.trailRate;
            this.spawnPlayerShotTrail(shot);
          }
        }
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

    applyEnemySynergies() {
      var i;
      var j;
      var k;
      var left;
      var right;
      var bucket;
      var grid = {};
      var cellSize = 160;
      var closeRangeSq = 150 * 150;
      var cx;
      var cy;
      var nx;
      var ny;
      var key;

      function applyPair(a, b) {
        if (
          (a.archetypeId === "speakerTotem" && (b.category === "rush" || b.archetypeId === "cometHeron" || b.archetypeId === "shadeRunner")) ||
          (b.archetypeId === "speakerTotem" && (a.category === "rush" || a.archetypeId === "cometHeron" || a.archetypeId === "shadeRunner"))
        ) {
          a.synergyColor = a.synergyColor || "#ff91d7";
          b.synergyColor = b.synergyColor || "#ff91d7";
          if (a.archetypeId !== "speakerTotem") {
            a.synergySpeed = Math.max(a.synergySpeed, 1.22);
          }
          if (b.archetypeId !== "speakerTotem") {
            b.synergySpeed = Math.max(b.synergySpeed, 1.22);
          }
        }

        if (a.archetypeId === "heatIdol" || a.archetypeId === "stallLantern" || b.archetypeId === "heatIdol" || b.archetypeId === "stallLantern") {
          a.synergyColor = a.synergyColor || "#ffb86f";
          b.synergyColor = b.synergyColor || "#ffb86f";
          a.synergyDamage = Math.max(a.synergyDamage, 1.2);
          b.synergyDamage = Math.max(b.synergyDamage, 1.2);
        }

        if (
          (a.archetypeId === "brainGolem" && (b.category === "ranged" || b.category === "disruptor")) ||
          (b.archetypeId === "brainGolem" && (a.category === "ranged" || a.category === "disruptor")) ||
          (a.archetypeId === "sunspotMine" && b.category === "wall") ||
          (b.archetypeId === "sunspotMine" && a.category === "wall")
        ) {
          a.synergyColor = a.synergyColor || "#d6d0ff";
          b.synergyColor = b.synergyColor || "#d6d0ff";
          a.synergyDamage = Math.max(a.synergyDamage, 1.14);
          b.synergyDamage = Math.max(b.synergyDamage, 1.14);
        }

        if (
          (a.archetypeId === "mirrorMoth" && (b.archetypeId === "chlorineShade" || b.archetypeId === "rumorWisp")) ||
          (b.archetypeId === "mirrorMoth" && (a.archetypeId === "chlorineShade" || a.archetypeId === "rumorWisp"))
        ) {
          a.synergyColor = a.synergyColor || "#8db4ff";
          b.synergyColor = b.synergyColor || "#8db4ff";
          a.synergySpeed = Math.max(a.synergySpeed, 1.16);
          b.synergySpeed = Math.max(b.synergySpeed, 1.16);
        }
      }

      for (i = 0; i < this.enemies.length; i += 1) {
        this.enemies[i].speed = this.enemies[i].baseSpeed || this.enemies[i].speed;
        this.enemies[i].damage = this.enemies[i].baseDamage || this.enemies[i].damage;
        this.enemies[i].synergySpeed = 1;
        this.enemies[i].synergyDamage = 1;
        this.enemies[i].synergyColor = "";
        this.enemies[i]._synergyIndex = i;
        cx = Math.floor(this.enemies[i].x / cellSize);
        cy = Math.floor(this.enemies[i].y / cellSize);
        key = cx + ":" + cy;
        if (!grid[key]) {
          grid[key] = [];
        }
        grid[key].push(this.enemies[i]);
      }

      for (i = 0; i < this.enemies.length; i += 1) {
        left = this.enemies[i];
        cx = Math.floor(left.x / cellSize);
        cy = Math.floor(left.y / cellSize);
        for (ny = cy - 1; ny <= cy + 1; ny += 1) {
          for (nx = cx - 1; nx <= cx + 1; nx += 1) {
            bucket = grid[nx + ":" + ny];
            if (!bucket) {
              continue;
            }
            for (k = 0; k < bucket.length; k += 1) {
              right = bucket[k];
              if (right._synergyIndex <= left._synergyIndex) {
                continue;
              }
              if (distanceSquared(left, right) > closeRangeSq) {
                continue;
              }
              applyPair(left, right);
            }
          }
        }
      }

      for (i = 0; i < this.enemies.length; i += 1) {
        this.enemies[i].speed = (this.enemies[i].baseSpeed || this.enemies[i].speed) * (this.enemies[i].synergySpeed || 1);
        this.enemies[i].damage = Math.max(1, Math.round((this.enemies[i].baseDamage || this.enemies[i].damage) * (this.enemies[i].synergyDamage || 1)));
        delete this.enemies[i]._synergyIndex;
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

      this.applyEnemySynergies();

      for (i = this.enemies.length - 1; i >= 0; i -= 1) {
        enemy = this.enemies[i];
        this.applyTimePressureToEnemy(enemy);
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
        } else if (enemy.archetypeId === "toastPhantom") {
          sideAngle = Math.sin(this.elapsedSec * 5.8 + i * 0.7) * 0.62;
          velocityX += Math.cos(Math.atan2(toPlayer.y, toPlayer.x) + Math.PI * 0.5) * sideAngle * 0.7;
          velocityY += Math.sin(Math.atan2(toPlayer.y, toPlayer.x) + Math.PI * 0.5) * sideAngle * 0.7;
          moveScale = toPlayer.length < 180 ? -0.18 : 0.74;
        } else if (enemy.archetypeId === "forgeSmith") {
          moveScale = toPlayer.length < 240 ? -0.36 : 0.46;
        } else if (enemy.archetypeId === "brainGolem") {
          moveScale = toPlayer.length < 160 ? 0.08 : 0.28;
        } else if (enemy.archetypeId === "cometHeron") {
          sideAngle = Math.sin(this.elapsedSec * 9 + i * 1.2) * 0.4;
          velocityX += -toPlayer.y * sideAngle;
          velocityY += toPlayer.x * sideAngle;
          moveScale *= 1.18;
        } else if (enemy.archetypeId === "abyssPriest") {
          sideAngle = Math.sin(this.elapsedSec * 4.2 + i * 0.6) * 0.4;
          velocityX += -toPlayer.y * sideAngle;
          velocityY += toPlayer.x * sideAngle;
          moveScale = toPlayer.length < 220 ? -0.22 : 0.66;
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
        } else if (enemy.archetypeId === "cometHeron") {
          enemy.dashTimer = (enemy.dashTimer || 0.72) - dt;
          if (enemy.dashTimer <= 0) {
            enemy.dashTimer = 1.52;
            enemy.dashBoost = 0.26;
          }
          if (enemy.dashBoost > 0) {
            enemy.dashBoost -= dt;
            moveScale *= 2.3;
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
        } else if (enemy.archetypeId === "toastPhantom" && enemy.attackTimer <= 0) {
          angle = Math.atan2(toPlayer.y, toPlayer.x);
          enemy.attackTimer = 1.62;
          this.effects.spawnRing(enemy.x, enemy.y, {
            color: "#ff9dc9",
            radius: 12,
            growth: 32,
            lineWidth: 2,
            life: 0.16,
            fillAlpha: 0.06
          });
          this.createEnemyShot(enemy, { x: Math.cos(angle), y: Math.sin(angle) }, {
            speed: 188 * (this.plan.enemyScale.projectileSpeedMultiplier || 1),
            radius: 7,
            damage: enemy.damage,
            color: "#ff9dc9",
            kind: "toast",
            trailRate: 0.06,
            spin: 5
          });
          this.createEnemyShot(enemy, { x: Math.cos(angle + 0.28), y: Math.sin(angle + 0.28) }, {
            speed: 176 * (this.plan.enemyScale.projectileSpeedMultiplier || 1),
            radius: 6,
            damage: enemy.damage - 1,
            color: "#ffc5df",
            kind: "toast",
            trailRate: 0.07,
            spin: 4
          });
          this.createEnemyShot(enemy, { x: Math.cos(angle - 0.28), y: Math.sin(angle - 0.28) }, {
            speed: 176 * (this.plan.enemyScale.projectileSpeedMultiplier || 1),
            radius: 6,
            damage: enemy.damage - 1,
            color: "#ffc5df",
            kind: "toast",
            trailRate: 0.07,
            spin: 4
          });
        } else if (enemy.archetypeId === "forgeSmith" && enemy.attackTimer <= 0) {
          angle = Math.atan2(toPlayer.y, toPlayer.x);
          enemy.attackTimer = 1.85;
          this.effects.spawnRadialStreakBurst(enemy.x, enemy.y, {
            count: 6,
            speedMin: 28,
            speedMax: 72,
            life: 0.18,
            color: "#d5dde7",
            width: 2,
            length: 14,
            drag: 0.86
          });
          this.createEnemyShot(enemy, { x: Math.cos(angle), y: Math.sin(angle) }, {
            speed: 182 * (this.plan.enemyScale.projectileSpeedMultiplier || 1),
            radius: 9,
            damage: enemy.damage + 2,
            color: "#d5dde7",
            kind: "anvil",
            trailRate: 0.08,
            spin: 8
          });
          this.createEnemyShot(enemy, { x: Math.cos(angle + 0.24), y: Math.sin(angle + 0.24) }, {
            speed: 166 * (this.plan.enemyScale.projectileSpeedMultiplier || 1),
            radius: 6,
            damage: enemy.damage,
            color: "#f0e7da",
            kind: "anvil",
            trailRate: 0.1,
            spin: 7
          });
        } else if (enemy.archetypeId === "brainGolem" && enemy.attackTimer <= 0) {
          enemy.attackTimer = 2.4;
          this.effects.spawnRing(enemy.x, enemy.y, {
            color: "#f0a7a7",
            radius: 18,
            growth: 52,
            lineWidth: 3,
            life: 0.18,
            fillAlpha: 0.08
          });
          for (var spore = 0; spore < 4; spore += 1) {
            var sporeAngle = (Math.PI * 2 * spore) / 4 + Math.PI * 0.25;
            this.createEnemyShot(enemy, { x: Math.cos(sporeAngle), y: Math.sin(sporeAngle) }, {
              speed: 154 * (this.plan.enemyScale.projectileSpeedMultiplier || 1),
              radius: 7,
              damage: enemy.damage - 1,
              color: "#f0a7a7",
              kind: "spore",
              trailRate: 0.09,
              spin: 5
            });
          }
        } else if (enemy.archetypeId === "abyssPriest" && enemy.attackTimer <= 0) {
          enemy.attackTimer = 1.24;
          this.effects.flashScreen("#d9d1ff", 0.035, 0.06);
          this.effects.spawnRing(enemy.x, enemy.y, {
            color: "#d9d1ff",
            radius: 16,
            growth: 64,
            lineWidth: 3,
            life: 0.18,
            fillAlpha: 0.06
          });
          for (var relic = 0; relic < 6; relic += 1) {
            var relicAngle = (Math.PI * 2 * relic) / 6 + this.elapsedSec * 0.25;
            this.createEnemyShot(enemy, { x: Math.cos(relicAngle), y: Math.sin(relicAngle) }, {
              speed: 214 * (this.plan.enemyScale.projectileSpeedMultiplier || 1),
              radius: 7,
              damage: enemy.damage - 2,
              color: "#d9d1ff",
              kind: "relic",
              trailRate: 0.05,
              spin: 9
            });
          }
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
      var unlockedSkins;
      if (this.runEnded) {
        return;
      }
      this.runEnded = true;
      this.endReason = reason;
      unlockedSkins = this.isBotMode ? [] : (this.game.unlockScoreSkins ? this.game.unlockScoreSkins(this.score) : []);
      survivorState.totalRuns = (survivorState.totalRuns || 0) + 1;
      survivorState.bestTimeSec = Math.max(survivorState.bestTimeSec || 0, Math.floor(this.elapsedSec));
      survivorState.bestScore = Math.max(survivorState.bestScore || 0, Math.floor(this.score));
      if (this.isInfinityMode) {
        survivorState.bestEndlessScore = Math.max(survivorState.bestEndlessScore || 0, Math.floor(this.score));
        survivorState.bestEndlessTimeSec = Math.max(survivorState.bestEndlessTimeSec || 0, Math.floor(this.elapsedSec));
      }
      survivorState.bestLevel = Math.max(survivorState.bestLevel || 1, this.player.level);
      survivorState.bestKills = Math.max(survivorState.bestKills || 0, this.player.kills);
      survivorState.lastStageId = this.stageId;
      survivorState.lastRank = this.hazardRank;
      survivorState.lastMode = this.mode;
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
      if (unlockedSkins.length && this.game.audio && this.game.audio.playPickupCue) {
        this.game.audio.playPickupCue("chest");
      }
      if (this.isBotMode) {
        this.botState.restartTimer = 2.6;
        if (this.botProfile) {
          this.pushMessage(getMetaText(this.game, this.botProfile, "defeat"), 1.5, this.botProfile.color || "#ff9c4b");
        }
        if (this.game.getSurvivorBots && this.game.getSurvivorBots().length > 1) {
          this.pushMessage(
            translate(this.game, "survivor.botNext", {
              bot: this.getBotName(this.game.getSurvivorBotProfile(this.botRelayIndex + 1))
            }),
            1.7,
            "#7fe6ff"
          );
        }
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
        this.handleLevelUpInput(input, dt);
        this.effects.update(dt * 0.3);
        this.updateMessages(dt);
        this.updateBeamFx(dt * 0.3);
        return;
      }

      if (this.merchant.open) {
        if (this.isBotMode) {
          this.autoResolveMerchant();
        }
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
        if (this.isBotMode) {
          this.botState.restartTimer -= dt;
          if (this.botState.restartTimer <= 0) {
            this.game.restartSurvivor({ rotateBot: true });
            return;
          }
        } else if ((input.wasPressed("confirm") || input.wasPointerPressed()) && !this.pointerCapturedByUi) {
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
      this.scoreRemainder += dt * 3;
      if (this.scoreRemainder >= 1) {
        this.addScore(Math.floor(this.scoreRemainder), this.player.x, this.player.y - 42, {
          silent: true
        });
        this.scoreRemainder %= 1;
      }
      var nextStageShift = getStageShiftIndex(this.elapsedSec);
      if (nextStageShift !== this.stageShiftIndex) {
        this.stageShiftIndex = nextStageShift;
        this.effects.flashScreen(this.getLiveStageTheme().accent, 0.08, 0.14);
        this.pushMessage(translate(this.game, "survivor.stageShift"), 1.1, this.getLiveStageTheme().accent);
      }
      this.updatePlayer(dt, input);
      this.updateCamera(dt);
      this.updateMerchant(dt);

      spawnResult = this.spawner.update(dt, {
        elapsedSec: this.getSpawnerElapsedSec(),
        player: this.player,
        enemies: this.enemies,
        hazardRank: this.hazardRank,
        spawnIntensity: this.getSpawnIntensity(),
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

      if (!this.isInfinityMode && this.elapsedSec >= RUN_LENGTH_SEC && !this.enemies.length) {
        this.finishRun("CLEARED");
      }
    }

    drawBackground(renderer, shake) {
      var ctx = renderer.ctx;
      var theme = this.getLiveStageTheme();
      var shift = this.stageShiftIndex;
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

      if (shift >= 1) {
        ctx.strokeStyle = theme.accent;
        ctx.globalAlpha = 0.08;
        ctx.lineWidth = 2;
        for (tx = -1; tx <= 5; tx += 1) {
          ctx.beginPath();
          ctx.moveTo(tx * 180 - 40, -20);
          ctx.lineTo(tx * 180 + 120, ns.constants.GAME_HEIGHT + 20);
          ctx.stroke();
        }
      }

      if (shift >= 2) {
        ctx.globalAlpha = 0.06;
        for (ty = startTileY; ty <= endTileY; ty += 1) {
          for (tx = startTileX; tx <= endTileX; tx += 1) {
            if (hash2d(tx + 12.4, ty - 8.8) < 0.72) {
              continue;
            }
            worldX = tx * tile;
            worldY = ty * tile;
            screenX = worldX - this.camera.x;
            screenY = worldY - this.camera.y;
            ctx.fillStyle = theme.glow;
            ctx.beginPath();
            ctx.arc(screenX + tile * 0.5, screenY + tile * 0.5, 16 + hash2d(tx - 2.1, ty + 4.6) * 22, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if (shift >= 3) {
        ctx.strokeStyle = "#fff1c4";
        ctx.globalAlpha = 0.1;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ns.constants.GAME_WIDTH * 0.5, ns.constants.GAME_HEIGHT * 0.5, 94 + Math.sin(this.elapsedSec * 2.2) * 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ns.constants.GAME_WIDTH * 0.5, ns.constants.GAME_HEIGHT * 0.5, 168 + Math.cos(this.elapsedSec * 1.7) * 24, 0, Math.PI * 2);
        ctx.stroke();
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
      var compact = !!ns.constants.IS_MOBILE_PORTRAIT;
      var i;
      for (i = 0; i < buttons.length; i += 1) {
        var hovered = pointer.inside && pointInRect(pointer, buttons[i]);
        renderer.drawPanel(buttons[i].x, buttons[i].y, buttons[i].width, buttons[i].height, {
          fill: hovered ? "rgba(18, 18, 18, 0.96)" : "rgba(8, 8, 8, 0.86)",
          border: buttons[i].border
        });
        renderer.drawText(buttons[i].label, buttons[i].x + buttons[i].width / 2, buttons[i].y + 10, {
          size: compact ? 14 : 18,
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

    drawPassiveSkillAuras(ctx, playerScreen, moveMagnitude) {
      var t = this.elapsedSec;
      var angle = this.player.facingAngle;

      if (this.getUpgradeLevel("pickupAura") > 0) {
        var auraVisual = this.getSkillVisual("pickupAura");
        ctx.save();
        ctx.strokeStyle = auraVisual.color;
        ctx.globalAlpha = 0.18;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(playerScreen.x, playerScreen.y + 8, Math.min(160, this.player.pickupRange * 0.42) + Math.sin(t * 3) * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (this.getUpgradeLevel("powerShirt") > 0) {
        var shirtVisual = this.getSkillVisual("powerShirt");
        ctx.save();
        ctx.strokeStyle = shirtVisual.accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playerScreen.x - 16, playerScreen.y - 6);
        ctx.lineTo(playerScreen.x, playerScreen.y - 20);
        ctx.lineTo(playerScreen.x + 16, playerScreen.y - 6);
        ctx.stroke();
        ctx.restore();
      }

      if (this.getUpgradeLevel("coldMugicha") > 0) {
        var mugiVisual = this.getSkillVisual("coldMugicha");
        ctx.save();
        ctx.fillStyle = mugiVisual.trailColor;
        ctx.beginPath();
        ctx.arc(playerScreen.x - 12, playerScreen.y - 28 + Math.sin(t * 4.8) * 3, 3, 0, Math.PI * 2);
        ctx.arc(playerScreen.x + 10, playerScreen.y - 24 + Math.cos(t * 4.2) * 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (this.getUpgradeLevel("quickStep") > 0 && moveMagnitude > 50) {
        var quickVisual = this.getSkillVisual("quickStep");
        ctx.save();
        ctx.strokeStyle = quickVisual.trailColor;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playerScreen.x - Math.cos(angle) * 16, playerScreen.y - Math.sin(angle) * 16);
        ctx.lineTo(playerScreen.x - Math.cos(angle) * 34, playerScreen.y - Math.sin(angle) * 34);
        ctx.moveTo(playerScreen.x - Math.cos(angle + 0.2) * 12, playerScreen.y - Math.sin(angle + 0.2) * 12);
        ctx.lineTo(playerScreen.x - Math.cos(angle + 0.2) * 28, playerScreen.y - Math.sin(angle + 0.2) * 28);
        ctx.stroke();
        ctx.restore();
      }

      if (this.getUpgradeLevel("thickNeck") > 0) {
        var neckVisual = this.getSkillVisual("thickNeck");
        ctx.save();
        ctx.fillStyle = neckVisual.color;
        ctx.globalAlpha = 0.22;
        ctx.fillRect(playerScreen.x - 20, playerScreen.y - 2, 8, 16);
        ctx.fillRect(playerScreen.x + 12, playerScreen.y - 2, 8, 16);
        ctx.restore();
      }

      if (this.getUpgradeLevel("pierceSandal") > 0) {
        var pierceVisual = this.getSkillVisual("pierceSandal");
        ctx.save();
        ctx.translate(playerScreen.x + Math.cos(angle) * 24, playerScreen.y + Math.sin(angle) * 24);
        ctx.rotate(angle);
        ctx.strokeStyle = pierceVisual.accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, -6);
        ctx.lineTo(0, 0);
        ctx.lineTo(-10, 6);
        ctx.moveTo(0, -6);
        ctx.lineTo(10, 0);
        ctx.lineTo(0, 6);
        ctx.stroke();
        ctx.restore();
      }

      if (this.getUpgradeLevel("lucky810") > 0) {
        var luckVisual = this.getSkillVisual("lucky810");
        ctx.save();
        ctx.fillStyle = luckVisual.color;
        ctx.globalAlpha = 0.8;
        for (var l = 0; l < 3; l += 1) {
          var la = t * 1.2 + l * 2.1;
          ctx.fillRect(playerScreen.x + Math.cos(la) * 28 - 2, playerScreen.y - 18 + Math.sin(la) * 10 - 2, 4, 4);
        }
        ctx.restore();
      }

      if (this.getUpgradeLevel("heatSink") > 0) {
        var heatVisual = this.getSkillVisual("heatSink");
        ctx.save();
        ctx.strokeStyle = heatVisual.color;
        ctx.globalAlpha = 0.28;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playerScreen.x - 14, playerScreen.y - 32 + Math.sin(t * 6) * 2);
        ctx.lineTo(playerScreen.x - 8, playerScreen.y - 42 + Math.sin(t * 6) * 2);
        ctx.moveTo(playerScreen.x, playerScreen.y - 34 + Math.cos(t * 5.4) * 2);
        ctx.lineTo(playerScreen.x + 4, playerScreen.y - 46 + Math.cos(t * 5.4) * 2);
        ctx.moveTo(playerScreen.x + 14, playerScreen.y - 32 + Math.sin(t * 5.6) * 2);
        ctx.lineTo(playerScreen.x + 8, playerScreen.y - 44 + Math.sin(t * 5.6) * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (this.player.shieldTimer > 0) {
        var shieldVisual = this.getSkillVisual("saltGuard");
        ctx.save();
        ctx.strokeStyle = shieldVisual.accentColor;
        ctx.globalAlpha = 0.28;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(playerScreen.x, playerScreen.y + 8, this.player.radius + 16 + Math.sin(t * 5) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (this.player.frenzyTimer > 0) {
        var frenzyVisual = this.getSkillVisual("yarimasuNee");
        ctx.save();
        ctx.strokeStyle = frenzyVisual.color;
        ctx.globalAlpha = 0.28;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playerScreen.x - 18, playerScreen.y - 26);
        ctx.lineTo(playerScreen.x - 8, playerScreen.y - 38);
        ctx.moveTo(playerScreen.x + 18, playerScreen.y - 26);
        ctx.lineTo(playerScreen.x + 8, playerScreen.y - 38);
        ctx.stroke();
        ctx.restore();
      }

      if (this.player.loveAuraTimer > 0) {
        ctx.save();
        ctx.strokeStyle = "#ff91d7";
        ctx.globalAlpha = 0.18;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(playerScreen.x, playerScreen.y + 8, this.player.radius + 22 + Math.sin(t * 4.5) * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
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
        this.drawPlayerProjectile(ctx, this.projectiles[i], shotScreen.x, shotScreen.y);
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
        ctx.strokeStyle = beam.flashColor || beam.color;
        ctx.lineWidth = beam.width * 1.8 * (beam.life / 0.16);
        ctx.globalAlpha = 0.22 * (beam.life / 0.16);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.strokeStyle = beam.color;
        ctx.lineWidth = beam.width * (beam.life / 0.16);
        ctx.globalAlpha = 0.72 * (beam.life / 0.16);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.strokeStyle = "#fffdf2";
        ctx.lineWidth = Math.max(2, beam.width * 0.24) * (beam.life / 0.16);
        ctx.globalAlpha = 0.8 * (beam.life / 0.16);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.fillStyle = beam.flashColor || beam.color;
        ctx.globalAlpha = 0.4 * (beam.life / 0.16);
        ctx.beginPath();
        ctx.arc(end.x, end.y, beam.width * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (i = 0; i < this.enemies.length; i += 1) {
        var enemy = this.enemies[i];
        var enemyScreen = this.worldToScreen(enemy.x, enemy.y, shake);
        if (enemyScreen.x < -80 || enemyScreen.y < -80 || enemyScreen.x > ns.constants.GAME_WIDTH + 80 || enemyScreen.y > ns.constants.GAME_HEIGHT + 80) {
          continue;
        }
        if (enemy.synergyColor) {
          ctx.save();
          ctx.strokeStyle = enemy.synergyColor;
          ctx.globalAlpha = 0.18;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(enemyScreen.x, enemyScreen.y, enemy.radius + 8 + Math.sin(this.elapsedSec * 4 + i) * 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
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

      this.drawWeaponFx(ctx, shake);

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
        ctx.fillStyle = this.orbitRender[i].color || "#8ff7ff";
        ctx.beginPath();
        ctx.arc(orbScreen.x, orbScreen.y, this.orbitRender[i].radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.orbitRender[i].accentColor || "#dffbff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      for (i = 0; i < this.haloRender.length; i += 1) {
        var haloScreen = this.worldToScreen(this.haloRender[i].x, this.haloRender[i].y, shake);
        ctx.save();
        ctx.translate(haloScreen.x, haloScreen.y);
        ctx.rotate(this.haloRender[i].angle + this.elapsedSec * 0.8);
        ctx.strokeStyle = this.haloRender[i].color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.haloRender[i].radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = this.haloRender[i].accentColor;
        ctx.beginPath();
        ctx.moveTo(0, -this.haloRender[i].radius - 4);
        ctx.lineTo(this.haloRender[i].radius + 4, 0);
        ctx.lineTo(0, this.haloRender[i].radius + 4);
        ctx.lineTo(-this.haloRender[i].radius - 4, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      for (i = 0; i < this.droneRender.length; i += 1) {
        var droneScreen = this.worldToScreen(this.droneRender[i].x, this.droneRender[i].y, shake);
        var droneVisual = this.getSkillVisual("droneBuddy");
        ctx.save();
        ctx.translate(droneScreen.x, droneScreen.y);
        ctx.fillStyle = droneVisual.color;
        ctx.fillRect(-8, -8, 16, 16);
        ctx.fillStyle = droneVisual.accentColor || "#dff2ff";
        ctx.fillRect(-3, -3, 6, 6);
        ctx.fillStyle = "#4a5d80";
        ctx.fillRect(-12, -3, 4, 6);
        ctx.fillRect(8, -3, 4, 6);
        ctx.restore();
      }

      var playerScreen = this.getPlayerScreenPoint(shake);
      this.drawPassiveSkillAuras(ctx, playerScreen, moveMagnitude);
      if (this.skinDef && this.skinDef.auraColor) {
        ctx.save();
        ctx.strokeStyle = this.skinDef.auraColor;
        ctx.globalAlpha = this.skinId === "noonAwakening" ? 0.34 : 0.2;
        ctx.lineWidth = this.skinId === "noonAwakening" ? 4 : 2;
        ctx.beginPath();
        ctx.arc(playerScreen.x, playerScreen.y + 8, this.player.radius + 10 + Math.sin(this.elapsedSec * 5) * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.1;
        ctx.beginPath();
        ctx.arc(playerScreen.x, playerScreen.y + 8, this.player.radius + 18 + Math.cos(this.elapsedSec * 4.3) * 3, 0, Math.PI * 2);
        ctx.stroke();
        if (this.skinId === "summerFestival") {
          ctx.fillStyle = "#ff9c4b";
          ctx.fillRect(playerScreen.x - 18, playerScreen.y - 40 + Math.sin(this.elapsedSec * 6) * 3, 4, 4);
          ctx.fillRect(playerScreen.x + 14, playerScreen.y - 34 + Math.cos(this.elapsedSec * 5) * 3, 4, 4);
          ctx.strokeStyle = "#ffe0b4";
          ctx.globalAlpha = 0.18;
          ctx.beginPath();
          ctx.arc(playerScreen.x, playerScreen.y + 8, this.player.radius + 24, this.elapsedSec * 2, this.elapsedSec * 2 + Math.PI * 1.2);
          ctx.stroke();
        } else if (this.skinId === "poolMonitor") {
          ctx.fillStyle = "#dffbff";
          ctx.fillRect(playerScreen.x - 16, playerScreen.y - 28, 3, 3);
          ctx.fillRect(playerScreen.x + 13, playerScreen.y - 24, 3, 3);
          ctx.fillStyle = "#7fe6ff";
          ctx.beginPath();
          ctx.arc(playerScreen.x - 22, playerScreen.y - 18 + Math.sin(this.elapsedSec * 5.4) * 4, 2.5, 0, Math.PI * 2);
          ctx.arc(playerScreen.x + 20, playerScreen.y - 12 + Math.cos(this.elapsedSec * 5.8) * 4, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (this.skinId === "nightPatrol") {
          ctx.fillStyle = "#d7e5ff";
          ctx.fillRect(playerScreen.x - 18, playerScreen.y - 36, 3, 3);
          ctx.fillRect(playerScreen.x + 15, playerScreen.y - 31, 3, 3);
          ctx.strokeStyle = "#8db4ff";
          ctx.globalAlpha = 0.16;
          ctx.beginPath();
          ctx.moveTo(playerScreen.x - 24, playerScreen.y + 20);
          ctx.lineTo(playerScreen.x + 24, playerScreen.y - 20);
          ctx.stroke();
        } else if (this.skinId === "ramuneDrive") {
          ctx.fillStyle = "#dffef7";
          ctx.beginPath();
          ctx.arc(playerScreen.x - 14, playerScreen.y - 28, 3, 0, Math.PI * 2);
          ctx.arc(playerScreen.x + 15, playerScreen.y - 24, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#7bf0d4";
          ctx.globalAlpha = 0.18;
          ctx.beginPath();
          ctx.arc(playerScreen.x, playerScreen.y + 6, this.player.radius + 20, 0, Math.PI * 2);
          ctx.stroke();
        } else if (this.skinId === "stationMaster") {
          ctx.fillStyle = "#f6e8c9";
          ctx.fillRect(playerScreen.x - 18, playerScreen.y - 34, 5, 3);
          ctx.fillRect(playerScreen.x + 12, playerScreen.y - 30, 5, 3);
          ctx.strokeStyle = "#d4b48a";
          ctx.globalAlpha = 0.16;
          ctx.beginPath();
          ctx.arc(playerScreen.x, playerScreen.y + 8, this.player.radius + 22, this.elapsedSec * 1.6, this.elapsedSec * 1.6 + Math.PI * 0.8);
          ctx.stroke();
        } else if (this.skinId === "noonAwakening") {
          ctx.strokeStyle = "#fff1c4";
          ctx.globalAlpha = 0.22;
          ctx.beginPath();
          ctx.moveTo(playerScreen.x, playerScreen.y - 34);
          ctx.lineTo(playerScreen.x, playerScreen.y - 54);
          ctx.moveTo(playerScreen.x - 20, playerScreen.y - 18);
          ctx.lineTo(playerScreen.x - 34, playerScreen.y - 30);
          ctx.moveTo(playerScreen.x + 20, playerScreen.y - 18);
          ctx.lineTo(playerScreen.x + 34, playerScreen.y - 30);
          ctx.stroke();
        } else if (this.skinId === "score114514") {
          ctx.strokeStyle = "#fff1c4";
          ctx.globalAlpha = 0.26;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(playerScreen.x, playerScreen.y + 8, this.player.radius + 28 + Math.sin(this.elapsedSec * 5.2) * 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(playerScreen.x, playerScreen.y - 44);
          ctx.lineTo(playerScreen.x, playerScreen.y - 66);
          ctx.moveTo(playerScreen.x - 24, playerScreen.y - 18);
          ctx.lineTo(playerScreen.x - 40, playerScreen.y - 34);
          ctx.moveTo(playerScreen.x + 24, playerScreen.y - 18);
          ctx.lineTo(playerScreen.x + 40, playerScreen.y - 34);
          ctx.moveTo(playerScreen.x - 34, playerScreen.y + 8);
          ctx.lineTo(playerScreen.x - 54, playerScreen.y + 8);
          ctx.moveTo(playerScreen.x + 34, playerScreen.y + 8);
          ctx.lineTo(playerScreen.x + 54, playerScreen.y + 8);
          ctx.stroke();
          ctx.fillStyle = "#fff1c4";
          ctx.fillRect(playerScreen.x - 3, playerScreen.y - 52, 6, 6);
          ctx.fillRect(playerScreen.x - 30, playerScreen.y - 28, 5, 5);
          ctx.fillRect(playerScreen.x + 25, playerScreen.y - 28, 5, 5);
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

      var hpRatio = this.player.maxHp > 0 ? this.player.hp / this.player.maxHp : 0;
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
      ctx.fillRect(playerScreen.x - 32, playerScreen.y - 72, 64, 8);
      ctx.strokeStyle = this.playerHitTimer > 0 ? "#ffd1d6" : "rgba(255, 255, 255, 0.28)";
      ctx.lineWidth = 1;
      ctx.strokeRect(playerScreen.x - 32.5, playerScreen.y - 72.5, 65, 9);
      ctx.fillStyle = hpRatio > 0.5 ? "#88f291" : hpRatio > 0.25 ? "#f6c453" : "#ff8a70";
      ctx.fillRect(playerScreen.x - 31, playerScreen.y - 71, 62 * hpRatio, 6);
      ctx.restore();

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
      var acquired = this.acquiredUpgrades.slice(0, 12);
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

    drawBotRelayPanel(renderer, x, y, width, compact) {
      var profile = this.botProfile;
      var nextBot = this.game.getSurvivorBotProfile ? this.game.getSurvivorBotProfile(this.botRelayIndex + 1) : null;
      var totalBots = this.game.getSurvivorBots ? this.game.getSurvivorBots().length : 1;
      var favorite = profile && profile.favoriteUpgrades && profile.favoriteUpgrades.length
        ? this.game.upgradeName(profile.favoriteUpgrades[0])
        : "-";
      var avoid = profile && profile.hatedEnemies && profile.hatedEnemies.length
        ? this.game.enemyName(profile.hatedEnemies[0])
        : "-";

      if (!this.isBotMode || !profile) {
        return;
      }

      renderer.drawPanel(x, y, width, compact ? 84 : 122, {
        fill: "rgba(12, 14, 22, 0.9)",
        border: profile.color || "#7fe6ff"
      });
      renderer.drawText(translate(this.game, "survivor.botRelay", {
        index: (this.botRelayIndex % Math.max(1, totalBots)) + 1,
        total: totalBots,
        bot: this.getBotName(profile)
      }), x + 16, y + 14, {
        size: compact ? 16 : 18,
        color: profile.color || "#7fe6ff"
      });
      renderer.drawText(getMetaText(this.game, profile, "tone"), x + 16, y + (compact ? 40 : 42), {
        size: compact ? 12 : 14,
        color: "#f4f0da"
      });
      if (!compact) {
        renderer.drawText(translate(this.game, "common.favorite") + " " + favorite, x + 16, y + 72, {
          size: 13,
          color: "#ffe07a"
        });
        renderer.drawText(translate(this.game, "common.avoid") + " " + avoid, x + 16, y + 92, {
          size: 13,
          color: "#ff9c9c"
        });
        renderer.drawText(translate(this.game, "survivor.botNext", {
          bot: nextBot ? this.getBotName(nextBot) : "-"
        }), x + 16, y + 108, {
          size: 12,
          color: "#d6d0ff"
        });
      }
    }

    drawBotBroadcastPanel(renderer, x, y, width, height) {
      var profile = this.botProfile;
      var nextBot = this.game.getSurvivorBotProfile ? this.game.getSurvivorBotProfile(this.botRelayIndex + 1) : null;
      var totalBots = this.game.getSurvivorBots ? this.game.getSurvivorBots().length : 1;
      var pressure = this.getEnemyPressureSnapshot();
      var favorite = profile && profile.favoriteUpgrades && profile.favoriteUpgrades.length
        ? this.game.upgradeName(profile.favoriteUpgrades[0])
        : "-";
      var avoid = profile && profile.hatedEnemies && profile.hatedEnemies.length
        ? this.game.enemyName(profile.hatedEnemies[0])
        : "-";
      var rightX;
      var progressWidth;
      var i;

      if (!this.isBotMode || !profile) {
        return;
      }

      renderer.drawPanel(x, y, width, height, {
        fill: "rgba(8, 10, 18, 0.93)",
        border: profile.color || "#7fe6ff"
      });

      renderer.drawPanel(x + 16, y + 16, width - 144, 78, {
        fill: "rgba(255,255,255,0.04)",
        border: "rgba(255,255,255,0.12)"
      });
      renderer.drawText("BOT LIVE", x + 30, y + 30, {
        size: 14,
        color: profile.color || "#7fe6ff"
      });
      renderer.drawText(this.getBotName(profile), x + 30, y + 54, {
        size: 28,
        color: "#f4f0da"
      });
      renderer.drawText(getMetaText(this.game, profile, "tone"), x + 30, y + 78, {
        size: 14,
        color: "#d8c8a4"
      });

      renderer.drawPixelSprite({
        x: x + width - 118,
        y: y + 12,
        width: 90,
        height: 130
      }, "senpai", {
        variant: profile.skinId || this.skinId,
        moving: true,
        walkPhase: this.elapsedSec * 5,
        border: profile.color || "#7fe6ff"
      });

      renderer.drawPanel(x + 16, y + 108, width - 32, 66, {
        fill: "rgba(255,255,255,0.03)",
        border: "#5f4423"
      });
      renderer.drawText(translate(this.game, "common.time") + " " + formatTime(this.elapsedSec), x + 30, y + 126, {
        size: 22,
        color: this.stageTheme.accent
      });
      renderer.drawText(translate(this.game, "common.score") + " " + formatScore(this.score), x + 30, y + 152, {
        size: 22,
        color: "#ffe07a"
      });
      renderer.drawText(translate(this.game, "common.level") + " " + this.player.level, x + width - 156, y + 126, {
        size: 20,
        color: "#9ee4ff"
      });
      renderer.drawText(translate(this.game, "common.kills") + " " + this.player.kills, x + width - 156, y + 152, {
        size: 18,
        color: "#f4f0da"
      });

      renderer.drawText(this.game.stageName(this.stageId), x + 18, y + 188, {
        size: 16,
        color: this.stageTheme.accent
      });
      renderer.drawText(translate(this.game, "buttons.mode") + " " + this.getModeLabel(), x + 18, y + 208, {
        size: 14,
        color: "#f4f0da"
      });
      renderer.drawText(translate(this.game, "survivor.botRelay", {
        index: (this.botRelayIndex % Math.max(1, totalBots)) + 1,
        total: totalBots,
        bot: this.getBotName(profile)
      }), x + 18, y + 228, {
        size: 14,
        color: profile.color || "#7fe6ff"
      });
      renderer.drawText(translate(this.game, "survivor.botNext", {
        bot: nextBot ? this.getBotName(nextBot) : "-"
      }), x + 18, y + 248, {
        size: 14,
        color: "#d6d0ff"
      });

      rightX = x + Math.floor(width * 0.5);
      renderer.drawText(translate(this.game, "common.favorite") + " " + favorite, rightX, y + 188, {
        size: 14,
        color: "#ffe07a"
      });
      renderer.drawText(translate(this.game, "common.avoid") + " " + avoid, rightX, y + 208, {
        size: 14,
        color: "#ff9c9c"
      });
      renderer.drawText(
        translate(this.game, "common.level") + " " + pressure.level + " / " + translate(this.game, "survivor.dangerTier", { tier: this.getDangerTier() }),
        rightX,
        y + 228,
        {
          size: 14,
          color: "#ffcf8f"
        }
      );
      renderer.drawText("HP x" + pressure.hpScale.toFixed(2) + " / SPD x" + pressure.speedScale.toFixed(2), rightX, y + 248, {
        size: 14,
        color: "#9ee4ff"
      });
      renderer.drawText("DMG x" + pressure.damageScale.toFixed(2) + " / T+" + pressure.timeTier, rightX, y + 268, {
        size: 14,
        color: "#f4f0da"
      });

      for (i = 0; i < Math.min(3, profile.favoriteUpgrades.length); i += 1) {
        drawUpgradeIcon(renderer.ctx, profile.favoriteUpgrades[i], x + 18 + i * 42, y + 260, 34);
      }

      progressWidth = width - 32;
      renderer.ctx.fillStyle = "rgba(255,255,255,0.06)";
      renderer.ctx.fillRect(x + 16, y + height - 22, progressWidth, 8);
      renderer.ctx.fillStyle = profile.color || "#7fe6ff";
      renderer.ctx.fillRect(
        x + 16,
        y + height - 22,
        progressWidth * Math.min(1, (this.botState.restartTimer ? 2.6 - this.botState.restartTimer : 2.6) / 2.6),
        8
      );
      if (this.runEnded) {
        renderer.drawText(translate(this.game, "survivor.botAutoRetry", {
          time: (this.botState.restartTimer || 0).toFixed(1)
        }), x + 18, y + height - 40, {
          size: 14,
          color: "#ffb86f"
        });
      } else {
        renderer.drawText(translate(this.game, "survivor.botLiveHint"), x + 18, y + height - 40, {
          size: 14,
          color: "#d8c8a4"
        });
      }
    }

    drawDesktopHud(renderer) {
      var survivorState = this.game.state.survivor || {};
      var hpRatio = this.player.maxHp > 0 ? this.player.hp / this.player.maxHp : 0;
      var nextScoreSkin = this.isBotMode ? null : this.getNextScoreSkinUnlock();
      var bestTimeSec = this.isInfinityMode ? (survivorState.bestEndlessTimeSec || 0) : (survivorState.bestTimeSec || 0);
      var primaryStatText = this.isBotMode || this.isInfinityMode
        ? translate(this.game, "common.level") + " " + this.player.level + "   " + translate(this.game, "common.kills") + " " + this.player.kills
        : translate(this.game, "common.level") + " " + this.player.level;
      var panelX = 16;
      var panelY = 16;
      var statLines;
      var statsStartY;
      var i;

      renderer.drawPanel(panelX, panelY, 246, 332, {
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
      renderer.drawText(translate(this.game, "common.score") + " " + formatScore(this.score), panelX + 18, panelY + 92, {
        size: 24,
        color: "#ffe07a"
      });
      renderer.drawText(primaryStatText, panelX + 18, panelY + 118, {
        size: 18,
        color: "#f4f0da"
      });
      renderer.drawText(translate(this.game, "common.best") + " " + formatTime(bestTimeSec), panelX + 18, panelY + 140, {
        size: 14,
        color: "#d6d0ff"
      });
      renderer.drawText(translate(this.game, "common.bestScore") + " " + formatScore(survivorState.bestEndlessScore || 0), panelX + 18, panelY + 158, {
        size: 14,
        color: "#7fe6ff"
      });
      renderer.drawText(translate(this.game, "common.coins") + " " + this.player.coins, panelX + 18, panelY + 176, {
        size: 16,
        color: "#f6c453"
      });

      renderer.drawText(translate(this.game, "common.hp"), panelX + 18, panelY + 198, { size: 16, color: "#ffb0a6" });
      renderer.ctx.fillStyle = "rgba(255,255,255,0.08)";
      renderer.ctx.fillRect(panelX + 58, panelY + 202, 166, 14);
      renderer.ctx.fillStyle = "#ff8a70";
      renderer.ctx.fillRect(panelX + 58, panelY + 202, 166 * hpRatio, 14);

      if (this.shouldShowXpProgress()) {
        var xpRatio = this.player.xpForNext > 0 ? this.player.xp / this.player.xpForNext : 0;
        renderer.drawText(translate(this.game, "common.xp"), panelX + 18, panelY + 226, { size: 16, color: "#bdf5c1" });
        renderer.ctx.fillStyle = "rgba(255,255,255,0.08)";
        renderer.ctx.fillRect(panelX + 58, panelY + 230, 166, 14);
        renderer.ctx.fillStyle = "#88f291";
        renderer.ctx.fillRect(panelX + 58, panelY + 230, 166 * xpRatio, 14);
      }

      statsStartY = this.shouldShowXpProgress() ? 254 : 226;
      statLines = [
        translate(this.game, "common.atk") + " " + this.player.damage,
        translate(this.game, "common.spd") + " " + this.player.speed,
        translate(this.game, "common.mag") + " " + this.player.pickupRange,
        translate(this.game, "common.arm") + " " + this.player.armor.toFixed(1),
        translate(this.game, "common.phase") + " " + this.game.phaseName(this.lastPhaseId || "opening"),
        this.isInfinityMode && nextScoreSkin
          ? translate(this.game, "store.unlockAtScore", { score: formatScore(nextScoreSkin.scoreThreshold || 0) })
          : translate(this.game, "buttons.mode") + " " + this.getModeLabel()
      ];
      for (i = 0; i < statLines.length; i += 1) {
        renderer.drawText(statLines[i], panelX + 18, panelY + statsStartY + i * 14, {
          size: 14,
          color: i >= 4 ? this.stageTheme.accent : "#d8c8a4"
        });
      }

      renderer.drawPanel(panelX, 354, 246, 210, {
        fill: "rgba(10, 10, 10, 0.9)",
        border: "#5f4423"
      });
      renderer.drawText(translate(this.game, "common.build"), panelX + 18, 370, {
        size: 18,
        color: "#f4e0b6"
      });
      this.drawBuildIcons(renderer, panelX + 18, 398, 4, 44);

      if (!this.isBotMode) {
        renderer.drawPanel(278, 16, 260, 96, {
          fill: "rgba(10, 10, 10, 0.88)",
          border: "#5f4423"
        });
        renderer.drawText(this.game.stageName(this.stageId), 296, 30, {
          size: 20,
          color: this.stageTheme.accent
        });
        renderer.drawText(translate(this.game, "buttons.mode") + " " + this.getModeLabel(), 296, 58, {
          size: 16,
          color: "#f4f0da"
        });
        renderer.drawText(translate(this.game, "buttons.rank") + " " + this.hazardRank + (this.isInfinityMode ? " / " + translate(this.game, "survivor.dangerTier", { tier: this.getDangerTier() }) : " / " + translate(this.game, "common.surviveGoal")), 296, 82, {
          size: 12,
          color: "#d8c8a4"
        });
        this.drawBotRelayPanel(renderer, 278, 124, 260, false);
      }
    }

    drawMobileHud(renderer) {
      var hpRatio = this.player.maxHp > 0 ? this.player.hp / this.player.maxHp : 0;
      var showXp = this.shouldShowXpProgress();
      var primaryStatText = this.isBotMode || this.isInfinityMode
        ? translate(this.game, "common.level") + " " + this.player.level + "   " + translate(this.game, "common.kills") + " " + this.player.kills
        : translate(this.game, "common.level") + " " + this.player.level;

      renderer.drawPanel(16, 16, 456, this.isBotMode ? 188 : 132, {
        fill: "rgba(10, 10, 10, 0.88)",
        border: this.stageTheme.accent
      });
      renderer.drawText(translate(this.game, "survivor.title") + " " + formatTime(this.elapsedSec), 34, 28, {
        size: 34,
        color: this.stageTheme.accent
      });
      renderer.drawText(translate(this.game, "common.score") + " " + formatScore(this.score), 34, 62, {
        size: 22,
        color: "#ffe07a"
      });
      renderer.drawText(primaryStatText, 34, 90, {
        size: 20,
        color: "#f4f0da"
      });
      renderer.drawText(translate(this.game, "common.coins") + " " + this.player.coins, 34, 114, {
        size: 18,
        color: "#f6c453"
      });
      renderer.ctx.fillStyle = "rgba(255,255,255,0.08)";
      renderer.ctx.fillRect(260, 46, 188, 14);
      renderer.ctx.fillStyle = "#ff8a70";
      renderer.ctx.fillRect(260, 46, 188 * hpRatio, 14);
      renderer.drawText(translate(this.game, "common.hp"), 220, 40, { size: 16, color: "#ffb0a6" });
      if (showXp) {
        var xpRatio = this.player.xpForNext > 0 ? this.player.xp / this.player.xpForNext : 0;
        renderer.ctx.fillStyle = "rgba(255,255,255,0.08)";
        renderer.ctx.fillRect(260, 88, 188, 14);
        renderer.ctx.fillStyle = "#88f291";
        renderer.ctx.fillRect(260, 88, 188 * xpRatio, 14);
        renderer.drawText(translate(this.game, "common.xp"), 220, 82, { size: 16, color: "#bdf5c1" });
      } else {
        renderer.drawText(translate(this.game, "survivor.dangerTier", { tier: this.getDangerTier() }), 220, 82, {
          size: 16,
          color: "#ffcf8f"
        });
      }
      if (this.isBotMode) {
        this.drawBotRelayPanel(renderer, 16, 152, 456, true);
      }
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
      var hint = this.isBotMode
        ? translate(this.game, "survivor.botLiveHint")
        : this.isTouchUi
          ? translate(this.game, "survivor.touchHint")
          : translate(this.game, "survivor.desktopHint");
      var hintY = ns.constants.IS_MOBILE_PORTRAIT ? ns.constants.GAME_HEIGHT - 118 : ns.constants.GAME_HEIGHT - 34;
      renderer.drawText(hint, ns.constants.GAME_WIDTH * 0.5, hintY, {
        size: ns.constants.IS_MOBILE_PORTRAIT ? 14 : (this.isTouchUi ? 20 : 18),
        align: "center",
        color: "#d2c7a9"
      });
    }

    drawPauseOverlay(renderer) {
      if (ns.constants.IS_MOBILE_PORTRAIT) {
        renderer.drawPanel(34, 328, 472, 174, {
          fill: "rgba(5, 5, 5, 0.94)",
          border: "#7fe6ff"
        });
        renderer.drawCenteredText(translate(this.game, "survivor.paused"), 360, {
          size: 32,
          color: "#7fe6ff",
          shadow: true
        });
        renderer.drawCenteredText(translate(this.game, "survivor.pauseResume"), 414, {
          size: 18,
          color: "#f4f0da"
        });
        renderer.drawCenteredText(translate(this.game, "survivor.pauseRestart"), 446, {
          size: 18,
          color: "#d9d1ff"
        });
        return;
      }
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

    drawSkinVictoryDecor(renderer, panelX, panelY, panelWidth, panelHeight) {
      var ctx = renderer.ctx;
      var theme = this.getSkinShowcaseTheme();
      var cardX = panelX + panelWidth - 180;
      var cardY = panelY + 26;
      var spriteX = cardX + 12;
      var spriteY = cardY + 12;
      var name = getMetaText(this.game, this.skinDef || {}, "name");

      ctx.save();
      ctx.globalAlpha = 0.12;
      if (theme.motif === "water" || theme.motif === "bubble") {
        ctx.fillStyle = theme.secondary;
        ctx.beginPath();
        ctx.arc(cardX + 44, cardY + 36, 16, 0, Math.PI * 2);
        ctx.arc(cardX + 118, cardY + 60, 10, 0, Math.PI * 2);
        ctx.arc(cardX + 84, cardY + 122, 14, 0, Math.PI * 2);
        ctx.fill();
      } else if (theme.motif === "spark") {
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cardX + 24, cardY + 24);
        ctx.lineTo(cardX + 44, cardY + 54);
        ctx.lineTo(cardX + 70, cardY + 24);
        ctx.moveTo(cardX + 122, cardY + 34);
        ctx.lineTo(cardX + 140, cardY + 62);
        ctx.lineTo(cardX + 158, cardY + 34);
        ctx.stroke();
      } else if (theme.motif === "neon") {
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cardX + 18, cardY + 28);
        ctx.lineTo(cardX + 150, cardY + 150);
        ctx.moveTo(cardX + 42, cardY + 18);
        ctx.lineTo(cardX + 162, cardY + 128);
        ctx.stroke();
      } else if (theme.motif === "brass") {
        ctx.fillStyle = theme.primary;
        ctx.fillRect(cardX + 24, cardY + 26, 40, 10);
        ctx.fillRect(cardX + 118, cardY + 110, 32, 10);
      } else {
        ctx.strokeStyle = theme.secondary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cardX + 86, cardY + 76, 54, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cardX + 86, cardY + 6);
        ctx.lineTo(cardX + 86, cardY + 146);
        ctx.moveTo(cardX + 16, cardY + 76);
        ctx.lineTo(cardX + 156, cardY + 76);
        ctx.stroke();
      }
      ctx.restore();

      renderer.drawPanel(cardX, cardY, 160, 190, {
        fill: theme.panelFill,
        border: theme.primary
      });
      renderer.drawPixelSprite({
        x: spriteX,
        y: spriteY,
        width: 136,
        height: 128
      }, "senpai", {
        variant: this.skinId,
        moving: true,
        walkPhase: this.elapsedSec * 4
      });
      renderer.drawParagraph(name, cardX + 14, cardY + 146, 132, {
        size: 16,
        lineHeight: 20,
        align: "center",
        color: "#f4f0da"
      });
      renderer.drawText(this.game.t("buttons.skin"), cardX + 80, cardY + 118, {
        size: 16,
        align: "center",
        color: theme.secondary
      });
    }

    drawEndOverlay(renderer) {
      var theme = this.getSkinShowcaseTheme();
      var panelX = ns.constants.IS_MOBILE_PORTRAIT ? 24 : 154;
      var panelY = ns.constants.IS_MOBILE_PORTRAIT ? 156 : 188;
      var panelWidth = ns.constants.IS_MOBILE_PORTRAIT ? 492 : 652;
      var panelHeight = ns.constants.IS_MOBILE_PORTRAIT ? 514 : 274;
      var titleColor = this.endReason === "CLEARED" ? "#88f291" : "#ff8a70";
      var nextBot = this.isBotMode && this.game.getSurvivorBotProfile ? this.game.getSurvivorBotProfile(this.botRelayIndex + 1) : null;
      var textWidth = ns.constants.IS_MOBILE_PORTRAIT ? 438 : 406;

      renderer.drawPanel(panelX, panelY, panelWidth, panelHeight, {
        fill: theme.panelFill,
        border: this.endReason === "CLEARED" ? theme.primary : titleColor
      });
      this.drawSkinVictoryDecor(renderer, panelX, panelY, panelWidth, panelHeight);
      renderer.drawText(this.endReason === "CLEARED" ? translate(this.game, "survivor.runCleared") : translate(this.game, "survivor.runOver"), panelX + 28, panelY + 24, {
        size: ns.constants.IS_MOBILE_PORTRAIT ? 30 : 40,
        color: titleColor,
        shadow: true
      });
      renderer.drawText(
        translate(this.game, "common.time") + " " + formatTime(this.elapsedSec) +
        "  " + (this.isBotMode
          ? translate(this.game, "common.level") + " " + this.player.level
          : this.isInfinityMode
            ? translate(this.game, "survivor.dangerTier", { tier: this.getDangerTier() })
            : translate(this.game, "common.level") + " " + this.player.level) +
        "  " + translate(this.game, "common.kills") + " " + this.player.kills,
        panelX + 30,
        panelY + (ns.constants.IS_MOBILE_PORTRAIT ? 88 : 92),
        { size: ns.constants.IS_MOBILE_PORTRAIT ? 18 : 22, color: "#f4f0da" }
      );
      renderer.drawText(
        translate(this.game, "buttons.mode") + " " + this.getModeLabel() +
        "  " + translate(this.game, "common.score") + " " + formatScore(this.score),
        panelX + 30,
        panelY + (ns.constants.IS_MOBILE_PORTRAIT ? 118 : 126),
        { size: ns.constants.IS_MOBILE_PORTRAIT ? 18 : 21, color: theme.secondary }
      );
      renderer.drawParagraph(translate(this.game, "survivor.retryHint"), panelX + 30, panelY + (ns.constants.IS_MOBILE_PORTRAIT ? 162 : 164), textWidth, {
        size: ns.constants.IS_MOBILE_PORTRAIT ? 18 : 24,
        lineHeight: ns.constants.IS_MOBILE_PORTRAIT ? 24 : 30,
        color: "#d2c7a9"
      });
      if (this.isBotMode) {
        renderer.drawText(translate(this.game, "survivor.botAutoRetry", {
          time: Math.max(0, this.botState.restartTimer).toFixed(1)
        }), panelX + 30, panelY + (ns.constants.IS_MOBILE_PORTRAIT ? 248 : 198), {
          size: ns.constants.IS_MOBILE_PORTRAIT ? 16 : 18,
          color: "#7fe6ff"
        });
        renderer.drawText(translate(this.game, "survivor.botNext", {
          bot: nextBot ? this.getBotName(nextBot) : "-"
        }), panelX + 30, panelY + (ns.constants.IS_MOBILE_PORTRAIT ? 274 : 224), {
          size: ns.constants.IS_MOBILE_PORTRAIT ? 14 : 16,
          color: "#d6d0ff"
        });
      }
      renderer.drawParagraph(getMetaText(this.game, this.skinDef || {}, "desc"), panelX + 30, panelY + (ns.constants.IS_MOBILE_PORTRAIT ? (this.isBotMode ? 318 : 244) : (this.isBotMode ? 246 : 206)), textWidth, {
        size: ns.constants.IS_MOBILE_PORTRAIT ? 14 : 16,
        lineHeight: ns.constants.IS_MOBILE_PORTRAIT ? 20 : 22,
        color: "#f4e0b6"
      });
    }

    drawLevelUpOverlay(renderer) {
      var ctx = renderer.ctx;
      if (ns.constants.IS_MOBILE_PORTRAIT) {
        var mPanelX = 22;
        var mCardX = 32;
        var mCardY = 170;
        var mCardWidth = 476;
        var i;

        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
        ctx.fillRect(0, 0, ns.constants.GAME_WIDTH, ns.constants.GAME_HEIGHT);
        ctx.restore();

        renderer.drawPanel(mPanelX, 54, 496, 82, {
          fill: "rgba(40, 44, 72, 0.94)",
          border: "#d6d0ff"
        });
        renderer.drawCenteredText(translate(this.game, "common.levelUp"), 72, {
          size: 32,
          color: "#ffffff",
          shadow: true
        });
        renderer.drawCenteredText(translate(this.game, "common.chooseBuildPiece"), 106, {
          size: 16,
          color: "#f4f0da"
        });
        renderer.drawText(
          translate(this.game, "common.level") + " " + this.player.level +
          "  " + translate(this.game, "common.atk") + " " + this.player.damage +
          "  " + translate(this.game, "common.spd") + " " + this.player.speed,
          270,
          132,
          {
            size: 14,
            align: "center",
            color: "#d8c8a4"
          }
        );

        for (i = 0; i < this.levelUpChoices.length; i += 1) {
          var mobileUpgradeId = this.levelUpChoices[i];
          var mobileDef = UPGRADE_CATALOG[mobileUpgradeId];
          var mobileCurrentLevel = this.getUpgradeLevel(mobileUpgradeId);
          var mobileHovered = i === this.levelUpHover;
          var mobileSelected = i === this.levelUpSelected;
          var mobileCardY = mCardY + i * 172;
          renderer.drawPanel(mCardX, mobileCardY, mCardWidth, 148, {
            fill: mobileSelected || mobileHovered ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.26)",
            border: mobileSelected ? mobileDef.color : mobileHovered ? "#fff1c4" : "rgba(255,255,255,0.12)"
          });
          drawUpgradeIcon(ctx, mobileUpgradeId, mCardX + 18, mobileCardY + 40, 72, mobileDef.color);
          renderer.drawText(getUpgradeName(this.game, mobileUpgradeId), mCardX + 108, mobileCardY + 20, {
            size: 24,
            color: mobileDef.color
          });
          renderer.drawText(mobileCurrentLevel === 0 ? translate(this.game, "common.new") : translate(this.game, "common.level") + " " + (mobileCurrentLevel + 1), mCardX + mCardWidth - 18, mobileCardY + 22, {
            size: 15,
            align: "right",
            color: mobileCurrentLevel === 0 ? "#fff1c4" : "#f4f0da"
          });
          renderer.drawParagraph(getUpgradeDescription(this.game, mobileUpgradeId, mobileCurrentLevel + 1), mCardX + 108, mobileCardY + 56, 336, {
            size: 16,
            lineHeight: 22,
            color: "#f4f0da"
          });
        }

        renderer.drawCenteredText(translate(this.game, "common.chooseConfirm"), 922, {
          size: 14,
          color: "#d8c8a4"
        });
        return;
      }
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
      if (ns.constants.IS_MOBILE_PORTRAIT) {
        var mobilePanelX = 18;
        var mobilePanelY = 120;
        var mobileWidth = 504;
        var i;

        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
        ctx.fillRect(0, 0, ns.constants.GAME_WIDTH, ns.constants.GAME_HEIGHT);
        ctx.restore();

        renderer.drawPanel(mobilePanelX, mobilePanelY, mobileWidth, 700, {
          fill: "rgba(30, 18, 24, 0.96)",
          border: "#ff91d7"
        });
        renderer.drawText(translate(this.game, "survivor.merchantTitle"), mobilePanelX + 20, mobilePanelY + 18, {
          size: 28,
          color: "#ff91d7",
          shadow: true
        });
        renderer.drawText(translate(this.game, "common.coins") + " " + this.player.coins, mobilePanelX + mobileWidth - 20, mobilePanelY + 22, {
          size: 18,
          align: "right",
          color: "#f6c453"
        });
        renderer.drawParagraph(translate(this.game, "survivor.merchantHint"), mobilePanelX + 20, mobilePanelY + 62, 464, {
          size: 14,
          lineHeight: 20,
          color: "#f4e0b6"
        });

        renderer.drawPanel(mobilePanelX + 18, mobilePanelY + 112, 468, 120, {
          fill: "rgba(10, 10, 10, 0.92)",
          border: "#6a4b27"
        });
        renderer.drawPixelSprite({
          x: mobilePanelX + 36,
          y: mobilePanelY + 124,
          width: 84,
          height: 94
        }, "shop", {
          border: "#ff91d7"
        });
        renderer.drawText(translate(this.game, "survivor.merchantName"), mobilePanelX + 144, mobilePanelY + 132, {
          size: 18,
          color: "#f4f0da"
        });
        renderer.drawParagraph(translate(this.game, "survivor.merchantHint"), mobilePanelX + 144, mobilePanelY + 162, 318, {
          size: 12,
          lineHeight: 18,
          color: "#d8c8a4"
        });

        for (i = 0; i < this.merchant.offers.length; i += 1) {
          var mobileOffer = this.merchant.offers[i];
          var mobileRowY = mobilePanelY + 248 + i * 88;
          var mobileSelected = i === this.merchant.selected;
          var mobileHovered = i === this.merchant.hover;
          renderer.drawPanel(mobilePanelX + 18, mobileRowY, 468, 76, {
            fill: mobileSelected || mobileHovered ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.22)",
            border: mobileOffer.soldOut ? "#5a5048" : mobileSelected ? mobileOffer.color : mobileHovered ? "#fff1c4" : "#5f4423"
          });
          renderer.drawText(mobileOffer.label, mobilePanelX + 34, mobileRowY + 14, {
            size: 18,
            color: mobileOffer.soldOut ? "#8d7e66" : (mobileOffer.color || "#f4f0da")
          });
          renderer.drawText(mobileOffer.soldOut ? translate(this.game, "common.sold") : String(mobileOffer.cost), mobilePanelX + 468, mobileRowY + 16, {
            size: 16,
            align: "right",
            color: mobileOffer.soldOut ? "#8d7e66" : "#f6c453"
          });
          renderer.drawParagraph(mobileOffer.desc, mobilePanelX + 34, mobileRowY + 38, 414, {
            size: 12,
            lineHeight: 16,
            color: "#f4e0b6"
          });
        }

        renderer.drawPanel(mobilePanelX + 332, mobilePanelY + 654, 154, 46, {
          fill: "rgba(8, 8, 8, 0.92)",
          border: "#d6d0ff"
        });
        renderer.drawText(this.game.t("buttons.leave"), mobilePanelX + 409, mobilePanelY + 666, {
          size: 18,
          align: "center",
          color: "#d6d0ff"
        });
        return;
      }
      var panelX = 182;
      var panelY = 132;
      var i;
      var offer;
      var rowY;
      var selected;
      var hovered;

      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
      ctx.fillRect(0, 0, ns.constants.GAME_WIDTH, ns.constants.GAME_HEIGHT);
      ctx.restore();

      renderer.drawPanel(panelX, panelY, 596, 458, {
        fill: "rgba(30, 18, 24, 0.96)",
        border: "#ff91d7"
      });
      renderer.drawText(translate(this.game, "survivor.merchantTitle"), panelX + 24, panelY + 20, {
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
      renderer.drawText(translate(this.game, "survivor.merchantName"), panelX + 122, panelY + 334, {
        size: 22,
        align: "center",
        color: "#f4f0da"
      });

      for (i = 0; i < this.merchant.offers.length; i += 1) {
        offer = this.merchant.offers[i];
        rowY = panelY + 126 + i * 66;
        selected = i === this.merchant.selected;
        hovered = i === this.merchant.hover;
        renderer.drawPanel(panelX + 244, rowY, 498, 58, {
          fill: selected || hovered ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.22)",
          border: offer.soldOut ? "#5a5048" : selected ? offer.color : hovered ? "#fff1c4" : "#5f4423"
        });
        renderer.drawText(offer.label, panelX + 264, rowY + 12, {
          size: 22,
          color: offer.soldOut ? "#8d7e66" : (offer.color || "#f4f0da")
        });
        renderer.drawText(offer.soldOut ? translate(this.game, "common.sold") : String(offer.cost), panelX + 718, rowY + 14, {
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
      return; /*

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
      */
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
