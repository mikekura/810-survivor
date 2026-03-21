(function (ns) {
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function pack(enemyId, weight, minPack, maxPack, pattern, extra) {
    return Object.assign({
      enemyId: enemyId,
      weight: weight,
      minPack: minPack,
      maxPack: maxPack,
      pattern: pattern,
      minRank: 0
    }, extra || {});
  }

  function pushGroups(stageId, phaseId, groups) {
    var tables = ns.survivorSpawnTables && ns.survivorSpawnTables.stages && ns.survivorSpawnTables.stages[stageId];
    var variants;
    var i;
    var j;
    if (!tables || !tables.phaseTables || !tables.phaseTables[phaseId]) {
      return;
    }
    variants = tables.phaseTables[phaseId];
    for (i = 0; i < variants.length; i += 1) {
      for (j = 0; j < groups.length; j += 1) {
        variants[i].groups.push(clone(groups[j]));
      }
    }
  }

  if (!ns.survivorSpawnTables || !ns.survivorSpawnTables.enemyArchetypes) {
    return;
  }

  Object.assign(ns.survivorSpawnTables.enemyArchetypes, {
    semiScout: Object.assign(ns.survivorSpawnTables.enemyArchetypes.semiScout || {}, { label: "Cicada Scout" }),
    heatHazeSmall: Object.assign(ns.survivorSpawnTables.enemyArchetypes.heatHazeSmall || {}, { label: "Heat Haze" }),
    rumorWisp: Object.assign(ns.survivorSpawnTables.enemyArchetypes.rumorWisp || {}, { label: "Rumor Wisp" }),
    chlorineShade: Object.assign(ns.survivorSpawnTables.enemyArchetypes.chlorineShade || {}, { label: "Chlorine Shade" }),
    marketShadow: Object.assign(ns.survivorSpawnTables.enemyArchetypes.marketShadow || {}, { label: "Market Shadow" }),
    stallLantern: Object.assign(ns.survivorSpawnTables.enemyArchetypes.stallLantern || {}, { label: "Stall Lantern" }),
    poolRemnant: Object.assign(ns.survivorSpawnTables.enemyArchetypes.poolRemnant || {}, { label: "Pool Remnant" }),
    summerWall: Object.assign(ns.survivorSpawnTables.enemyArchetypes.summerWall || {}, { label: "Summer Wall" }),
    clockNeedleHound: Object.assign(ns.survivorSpawnTables.enemyArchetypes.clockNeedleHound || {}, { label: "Clock Hound" }),
    noonCompressor: Object.assign(ns.survivorSpawnTables.enemyArchetypes.noonCompressor || {}, { label: "Noon Compressor" }),
    middayShadow: Object.assign(ns.survivorSpawnTables.enemyArchetypes.middayShadow || {}, { label: "Midday Shadow" }),
    rumorBeast: Object.assign(ns.survivorSpawnTables.enemyArchetypes.rumorBeast || {}, { label: "Rumor Beast" }),
    afternoonShard: Object.assign(ns.survivorSpawnTables.enemyArchetypes.afternoonShard || {}, { label: "Afternoon Shard" }),
    stationLord: Object.assign(ns.survivorSpawnTables.enemyArchetypes.stationLord || {}, { label: "Station Lord" }),
    arcadeLord: Object.assign(ns.survivorSpawnTables.enemyArchetypes.arcadeLord || {}, { label: "Arcade Lord" }),
    poolLord: Object.assign(ns.survivorSpawnTables.enemyArchetypes.poolLord || {}, { label: "Pool Lord" }),
    festivalLord: Object.assign(ns.survivorSpawnTables.enemyArchetypes.festivalLord || {}, { label: "Festival Lord" }),
    clockLord: Object.assign(ns.survivorSpawnTables.enemyArchetypes.clockLord || {}, { label: "Clock Lord" }),
    signalCrab: { label: "Signal Crab", category: "rush", hp: 26, speed: 1.28, damage: 10, xp: 2, tags: ["side-step"] },
    iceCreamBat: { label: "Ice Cream Bat", category: "hunter", hp: 30, speed: 1.2, damage: 11, xp: 2, tags: ["flying"] },
    speakerTotem: { label: "Speaker Totem", category: "ranged", hp: 60, speed: 0.74, damage: 15, xp: 4, tags: ["speaker"] },
    shadeRunner: { label: "Shade Runner", category: "rush", hp: 40, speed: 1.42, damage: 13, xp: 3, tags: ["dash"] },
    mirrorMoth: { label: "Mirror Moth", category: "disruptor", hp: 56, speed: 1.04, damage: 14, xp: 4, tags: ["zigzag"] },
    sunspotMine: { label: "Sunspot Mine", category: "wall", hp: 88, speed: 0.42, damage: 20, xp: 5, tags: ["heavy"] },
    heatIdol: { label: "Heat Idol", category: "elite", hp: 480, speed: 0.96, damage: 26, xp: 28, tags: ["elite", "burst"] }
  });

  if (ns.survivorSpawnTables.stages.stationFront) {
    ns.survivorSpawnTables.stages.stationFront.label = "Station Front";
  }
  if (ns.survivorSpawnTables.stages.shoppingStreet) {
    ns.survivorSpawnTables.stages.shoppingStreet.label = "Shopping Street";
  }
  if (ns.survivorSpawnTables.stages.poolSide) {
    ns.survivorSpawnTables.stages.poolSide.label = "Pool Side";
  }
  if (ns.survivorSpawnTables.stages.festivalGround) {
    ns.survivorSpawnTables.stages.festivalGround.label = "Festival Ground";
  }
  if (ns.survivorSpawnTables.stages.clockTower) {
    ns.survivorSpawnTables.stages.clockTower.label = "Clock Tower";
  }

  pushGroups("stationFront", "opening", [
    pack("signalCrab", 24, 2, 4, "edge-stream")
  ]);
  pushGroups("stationFront", "midPrep", [
    pack("iceCreamBat", 20, 2, 4, "rear-pulse")
  ]);
  pushGroups("shoppingStreet", "pressure1", [
    pack("speakerTotem", 18, 1, 2, "bomb-arc")
  ]);
  pushGroups("shoppingStreet", "mixedLate", [
    pack("shadeRunner", 20, 2, 4, "cross-dash", { minRank: 4 })
  ]);
  pushGroups("poolSide", "opening", [
    pack("iceCreamBat", 20, 2, 3, "waterline")
  ]);
  pushGroups("poolSide", "midPrep", [
    pack("mirrorMoth", 22, 1, 2, "front-arc", { minRank: 4 })
  ]);
  pushGroups("festivalGround", "pressure1", [
    pack("speakerTotem", 22, 1, 2, "bomb-arc")
  ]);
  pushGroups("festivalGround", "crisis1544", [
    pack("sunspotMine", 22, 1, 2, "edge-wall", { minRank: 6 })
  ]);
  pushGroups("clockTower", "elitePrep", [
    pack("shadeRunner", 24, 2, 4, "cross-dash")
  ]);
  pushGroups("clockTower", "mixedLate", [
    pack("mirrorMoth", 20, 1, 2, "front-arc", { minRank: 6 }),
    pack("heatIdol", 14, 1, 1, "rear-pulse", { minRank: 8 })
  ]);
})(window.ManatsuRPG = window.ManatsuRPG || {});
