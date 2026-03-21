(function (ns) {
  function toSeconds(value) {
    if (typeof value === "number") {
      return value;
    }
    var parts = String(value).split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function phase(start, end) {
    return { startSec: toSeconds(start), endSec: toSeconds(end) };
  }

  function pack(enemyId, weight, minPack, maxPack, pattern, extra) {
    return Object.assign({
      enemyId: enemyId,
      weight: weight,
      minPack: minPack,
      maxPack: maxPack,
      pattern: pattern || "edge-ring",
      minRank: 0
    }, extra || {});
  }

  function waveVariant(id, director, groups, extra) {
    return Object.assign({
      id: id,
      director: director,
      groups: groups,
      minRank: 0,
      variantWeight: 1
    }, extra || {});
  }

  function timedEvent(id, at, kind, extra) {
    return Object.assign({
      id: id,
      atSec: toSeconds(at),
      kind: kind,
      minRank: 0
    }, extra || {});
  }

  function bossEvent(id, at, enemyId, chestType, extra) {
    return Object.assign({
      id: id,
      atSec: toSeconds(at),
      enemyId: enemyId,
      chestType: chestType || "normal",
      minRank: 0
    }, extra || {});
  }

  function round(value, digits) {
    var factor = Math.pow(10, digits || 2);
    return Math.round(value * factor) / factor;
  }

  var phaseSchedule = {
    opening: phase("00:00", "01:30"),
    pressure1: phase("01:30", "03:00"),
    elitePrep: phase("03:00", "05:00"),
    swarm1: phase("05:00", "06:30"),
    rangedCheck: phase("06:30", "08:10"),
    event810: phase("08:10", "10:00"),
    midPrep: phase("10:00", "12:30"),
    mixedLate: phase("12:30", "15:44"),
    crisis1544: phase("15:44", "18:00"),
    finalPrep: phase("18:00", "20:00")
  };

  var enemyArchetypes = {
    semiScout: { label: "セミ群", category: "rush", hp: 16, speed: 1.18, damage: 8, xp: 1, tags: ["early", "swarm"] },
    heatHazeSmall: { label: "熱だまり小", category: "rush", hp: 28, speed: 0.96, damage: 10, xp: 2, tags: ["heat"] },
    rumorWisp: { label: "うわさ球", category: "hunter", hp: 34, speed: 1.24, damage: 10, xp: 2, tags: ["tracking"] },
    chlorineShade: { label: "塩素影", category: "ranged", hp: 42, speed: 0.92, damage: 12, xp: 3, tags: ["mist", "ranged"] },
    marketShadow: { label: "商店街の影", category: "disruptor", hp: 46, speed: 1.05, damage: 11, xp: 3, tags: ["pickup-dampen"] },
    stallLantern: { label: "提灯怪異", category: "ranged", hp: 54, speed: 0.88, damage: 14, xp: 4, tags: ["bomb"] },
    poolRemnant: { label: "プール残響", category: "wall", hp: 92, speed: 0.62, damage: 16, xp: 5, tags: ["tank"] },
    summerWall: { label: "真夏の壁", category: "wall", hp: 108, speed: 0.56, damage: 18, xp: 6, tags: ["tank", "late"] },
    clockNeedleHound: { label: "時計針獣", category: "hunter", hp: 66, speed: 1.36, damage: 18, xp: 5, tags: ["dash"] },
    noonCompressor: { label: "圧縮日差し", category: "disruptor", hp: 72, speed: 0.98, damage: 18, xp: 5, tags: ["slow-field"] },
    middayShadow: { label: "真昼の影", category: "elite", hp: 340, speed: 1.08, damage: 22, xp: 20, tags: ["elite", "chest"] },
    rumorBeast: { label: "うわさ獣", category: "elite", hp: 420, speed: 1.02, damage: 24, xp: 24, tags: ["elite", "panic"] },
    afternoonShard: { label: "午後の欠片", category: "elite", hp: 520, speed: 1.14, damage: 28, xp: 30, tags: ["elite", "needle"] },
    stationLord: { label: "駅前の熱源", category: "boss", hp: 2800, speed: 0.96, damage: 34, xp: 120, tags: ["boss"] },
    arcadeLord: { label: "商店街の主", category: "boss", hp: 3100, speed: 1.0, damage: 36, xp: 130, tags: ["boss"] },
    poolLord: { label: "塩素まぼろし核", category: "boss", hp: 3200, speed: 0.92, damage: 36, xp: 135, tags: ["boss"] },
    festivalLord: { label: "祭囃子の核", category: "boss", hp: 3350, speed: 0.98, damage: 38, xp: 140, tags: ["boss"] },
    clockLord: { label: "終わらない午後", category: "boss", hp: 3600, speed: 1.05, damage: 40, xp: 150, tags: ["boss", "final"] }
  };

  var hazardRanks = [];
  for (var i = 0; i <= 15; i += 1) {
    hazardRanks.push({
      rank: i,
      label: i < 4 ? "平常" : i < 8 ? "猛暑" : i < 12 ? "酷暑" : i < 15 ? "灼熱" : "真夏核",
      enemyHpMultiplier: round(1 + i * 0.12, 2),
      enemySpeedMultiplier: round(1 + i * 0.025, 3),
      spawnIntervalMultiplier: round(Math.max(0.58, 1 - i * 0.025), 3),
      maxAliveMultiplier: round(1 + i * 0.09, 2),
      eliteHpMultiplier: round(1 + i * 0.18, 2),
      projectileSpeedMultiplier: round(1 + i * 0.035, 2),
      rewardMultiplier: round(1 + i * 0.11, 2)
    });
  }

  var stages = {
    stationFront: {
      label: "駅前",
      recommendedStyle: "通常",
      endlessRamp: { everySec: 120, hpStep: 0.18, speedStep: 0.06, spawnStep: 0.12, extraEliteEverySec: 300 },
      phaseTables: {
        opening: [
          waveVariant("station-opening-a", { intensity: 0.82, spawnInterval: 1.18, maxAlive: 26 }, [
            pack("semiScout", 76, 4, 8, "edge-ring"),
            pack("heatHazeSmall", 24, 1, 2, "front-arc")
          ])
        ],
        pressure1: [
          waveVariant("station-pressure-a", { intensity: 0.96, spawnInterval: 1.06, maxAlive: 32 }, [
            pack("semiScout", 64, 5, 9, "edge-stream"),
            pack("heatHazeSmall", 36, 2, 4, "front-arc")
          ])
        ],
        elitePrep: [
          waveVariant("station-eliteprep-a", { intensity: 1.06, spawnInterval: 0.98, maxAlive: 40 }, [
            pack("semiScout", 52, 6, 10, "edge-ring"),
            pack("rumorWisp", 28, 2, 3, "rear-pulse"),
            pack("marketShadow", 20, 1, 2, "side-pin")
          ])
        ],
        swarm1: [
          waveVariant("station-swarm-a", { intensity: 1.24, spawnInterval: 0.9, maxAlive: 52 }, [
            pack("semiScout", 48, 7, 11, "edge-ring"),
            pack("heatHazeSmall", 32, 3, 5, "front-arc"),
            pack("poolRemnant", 20, 1, 1, "edge-wall")
          ])
        ],
        rangedCheck: [
          waveVariant("station-ranged-a", { intensity: 1.34, spawnInterval: 0.86, maxAlive: 56 }, [
            pack("rumorWisp", 42, 3, 5, "rear-pulse"),
            pack("chlorineShade", 24, 1, 2, "side-pin"),
            pack("poolRemnant", 34, 1, 2, "edge-wall")
          ])
        ],
        event810: [
          waveVariant("station-810-a", { intensity: 1.42, spawnInterval: 0.82, maxAlive: 62 }, [
            pack("semiScout", 30, 6, 10, "bonus-ring"),
            pack("rumorWisp", 34, 3, 6, "rear-pulse"),
            pack("marketShadow", 36, 2, 3, "side-pin")
          ])
        ],
        midPrep: [
          waveVariant("station-mid-a", { intensity: 1.55, spawnInterval: 0.78, maxAlive: 68 }, [
            pack("clockNeedleHound", 38, 2, 4, "edge-stream"),
            pack("chlorineShade", 24, 2, 3, "side-pin"),
            pack("summerWall", 38, 1, 2, "edge-wall")
          ])
        ],
        mixedLate: [
          waveVariant("station-late-a", { intensity: 1.7, spawnInterval: 0.72, maxAlive: 76 }, [
            pack("clockNeedleHound", 30, 3, 5, "cross-dash"),
            pack("marketShadow", 28, 2, 4, "rear-pulse"),
            pack("noonCompressor", 42, 1, 2, "front-arc")
          ]),
          waveVariant("station-late-r8", { intensity: 1.82, spawnInterval: 0.68, maxAlive: 82 }, [
            pack("clockNeedleHound", 34, 3, 5, "cross-dash"),
            pack("noonCompressor", 30, 2, 2, "front-arc"),
            pack("afternoonShard", 36, 1, 1, "rear-pulse")
          ], { minRank: 8, variantWeight: 0.7 })
        ],
        crisis1544: [
          waveVariant("station-crisis-a", { intensity: 1.98, spawnInterval: 0.62, maxAlive: 92 }, [
            pack("clockNeedleHound", 28, 4, 6, "cross-dash"),
            pack("summerWall", 24, 2, 3, "edge-wall"),
            pack("afternoonShard", 48, 1, 2, "rear-pulse")
          ])
        ],
        finalPrep: [
          waveVariant("station-finalprep-a", { intensity: 2.12, spawnInterval: 0.58, maxAlive: 98 }, [
            pack("clockNeedleHound", 34, 4, 6, "cross-dash"),
            pack("noonCompressor", 32, 2, 3, "front-arc"),
            pack("summerWall", 34, 2, 3, "edge-wall")
          ])
        ]
      },
      events: [
        timedEvent("station-810-rush", "08:10", "special-wave", { pool: ["bonusXpSwarm", "coinRush", "elitePickupTrain"], guaranteePickup: "magnet" }),
        timedEvent("station-1544-crisis", "15:44", "crisis", { screenFx: "amber-freeze", musicCue: "crisis-1544" })
      ],
      bosses: [
        bossEvent("station-elite-03", "03:00", "middayShadow", "normal"),
        bossEvent("station-elite-10", "10:00", "rumorBeast", "rare"),
        bossEvent("station-final-20", "20:00", "stationLord", "evolution")
      ]
    },

    shoppingStreet: {
      label: "商店街",
      recommendedStyle: "圧強め",
      endlessRamp: { everySec: 120, hpStep: 0.2, speedStep: 0.05, spawnStep: 0.14, extraEliteEverySec: 280 },
      phaseTables: {
        opening: [waveVariant("street-opening-a", { intensity: 0.8, spawnInterval: 1.2, maxAlive: 24 }, [
          pack("semiScout", 52, 3, 6, "lane-left"), pack("marketShadow", 48, 1, 2, "lane-right")
        ])],
        pressure1: [waveVariant("street-pressure-a", { intensity: 0.95, spawnInterval: 1.04, maxAlive: 30 }, [
          pack("semiScout", 36, 5, 8, "lane-left"), pack("rumorWisp", 38, 2, 4, "rear-pulse"), pack("marketShadow", 26, 1, 2, "lane-right")
        ])],
        elitePrep: [waveVariant("street-eliteprep-a", { intensity: 1.08, spawnInterval: 0.96, maxAlive: 38 }, [
          pack("rumorWisp", 44, 3, 5, "rear-pulse"), pack("marketShadow", 24, 2, 3, "side-pin"), pack("stallLantern", 32, 1, 2, "bomb-arc")
        ])],
        swarm1: [waveVariant("street-swarm-a", { intensity: 1.2, spawnInterval: 0.9, maxAlive: 46 }, [
          pack("stallLantern", 34, 2, 3, "bomb-arc"), pack("rumorWisp", 28, 4, 7, "rear-pulse"), pack("poolRemnant", 38, 1, 2, "alley-block")
        ])],
        rangedCheck: [waveVariant("street-ranged-a", { intensity: 1.32, spawnInterval: 0.84, maxAlive: 54 }, [
          pack("stallLantern", 28, 2, 3, "bomb-arc"), pack("marketShadow", 30, 2, 4, "rear-pulse"), pack("clockNeedleHound", 42, 2, 3, "lane-left")
        ])],
        event810: [waveVariant("street-810-a", { intensity: 1.46, spawnInterval: 0.8, maxAlive: 60 }, [
          pack("rumorWisp", 32, 4, 7, "rear-pulse"), pack("stallLantern", 28, 2, 4, "bomb-arc"), pack("noonCompressor", 40, 1, 2, "alley-block")
        ])],
        midPrep: [waveVariant("street-mid-a", { intensity: 1.58, spawnInterval: 0.74, maxAlive: 68 }, [
          pack("clockNeedleHound", 28, 3, 5, "lane-left"), pack("stallLantern", 26, 2, 4, "bomb-arc"), pack("summerWall", 46, 1, 2, "alley-block")
        ])],
        mixedLate: [waveVariant("street-late-a", { intensity: 1.72, spawnInterval: 0.68, maxAlive: 76 }, [
          pack("clockNeedleHound", 26, 3, 5, "cross-dash"), pack("noonCompressor", 28, 2, 3, "front-arc"), pack("rumorBeast", 46, 1, 1, "rear-pulse")
        ])],
        crisis1544: [waveVariant("street-crisis-a", { intensity: 1.98, spawnInterval: 0.62, maxAlive: 86 }, [
          pack("stallLantern", 24, 3, 5, "bomb-arc"), pack("clockNeedleHound", 24, 4, 6, "cross-dash"), pack("afternoonShard", 52, 1, 2, "rear-pulse")
        ])],
        finalPrep: [waveVariant("street-finalprep-a", { intensity: 2.16, spawnInterval: 0.56, maxAlive: 96 }, [
          pack("summerWall", 32, 2, 3, "alley-block"), pack("stallLantern", 28, 3, 5, "bomb-arc"), pack("clockNeedleHound", 40, 4, 7, "cross-dash")
        ])]
      },
      events: [
        timedEvent("street-810-sale", "08:10", "special-wave", { pool: ["coinRush", "elitePickupTrain", "bombLane"], guaranteePickup: "coin-bag" }),
        timedEvent("street-1544-crisis", "15:44", "crisis", { screenFx: "neon-compress", musicCue: "crisis-1544" })
      ],
      bosses: [
        bossEvent("street-elite-03", "03:00", "middayShadow", "normal"),
        bossEvent("street-elite-10", "10:00", "rumorBeast", "rare"),
        bossEvent("street-final-20", "20:00", "arcadeLord", "evolution")
      ]
    },

    poolSide: {
      label: "プールサイド",
      recommendedStyle: "面倒見",
      endlessRamp: { everySec: 120, hpStep: 0.19, speedStep: 0.055, spawnStep: 0.13, extraEliteEverySec: 290 },
      phaseTables: {
        opening: [waveVariant("pool-opening-a", { intensity: 0.78, spawnInterval: 1.22, maxAlive: 22 }, [
          pack("heatHazeSmall", 48, 2, 3, "lane-left"), pack("chlorineShade", 52, 1, 2, "waterline")
        ])],
        pressure1: [waveVariant("pool-pressure-a", { intensity: 0.92, spawnInterval: 1.08, maxAlive: 28 }, [
          pack("chlorineShade", 38, 1, 2, "waterline"), pack("semiScout", 28, 4, 7, "edge-ring"), pack("poolRemnant", 34, 1, 1, "edge-wall")
        ])],
        elitePrep: [waveVariant("pool-eliteprep-a", { intensity: 1.02, spawnInterval: 0.98, maxAlive: 36 }, [
          pack("chlorineShade", 34, 2, 3, "waterline"), pack("poolRemnant", 44, 1, 2, "lane-wall"), pack("rumorWisp", 22, 2, 4, "rear-pulse")
        ])],
        swarm1: [waveVariant("pool-swarm-a", { intensity: 1.18, spawnInterval: 0.9, maxAlive: 44 }, [
          pack("poolRemnant", 42, 2, 3, "lane-wall"), pack("marketShadow", 24, 1, 2, "side-pin"), pack("rumorWisp", 34, 3, 5, "rear-pulse")
        ])],
        rangedCheck: [waveVariant("pool-ranged-a", { intensity: 1.3, spawnInterval: 0.84, maxAlive: 52 }, [
          pack("chlorineShade", 26, 2, 4, "waterline"), pack("clockNeedleHound", 30, 2, 3, "lane-left"), pack("poolRemnant", 44, 2, 3, "lane-wall")
        ])],
        event810: [waveVariant("pool-810-a", { intensity: 1.42, spawnInterval: 0.8, maxAlive: 58 }, [
          pack("chlorineShade", 24, 2, 4, "waterline"), pack("poolRemnant", 34, 2, 3, "lane-wall"), pack("noonCompressor", 42, 1, 2, "front-arc")
        ])],
        midPrep: [waveVariant("pool-mid-a", { intensity: 1.56, spawnInterval: 0.74, maxAlive: 66 }, [
          pack("clockNeedleHound", 24, 3, 4, "cross-dash"), pack("chlorineShade", 26, 3, 4, "waterline"), pack("summerWall", 50, 1, 2, "lane-wall")
        ])],
        mixedLate: [waveVariant("pool-late-a", { intensity: 1.74, spawnInterval: 0.68, maxAlive: 74 }, [
          pack("chlorineShade", 22, 3, 5, "waterline"), pack("noonCompressor", 26, 2, 3, "front-arc"), pack("middayShadow", 52, 1, 1, "rear-pulse")
        ])],
        crisis1544: [waveVariant("pool-crisis-a", { intensity: 1.96, spawnInterval: 0.62, maxAlive: 84 }, [
          pack("clockNeedleHound", 26, 4, 6, "cross-dash"), pack("afternoonShard", 40, 1, 2, "rear-pulse"), pack("summerWall", 34, 2, 3, "lane-wall")
        ])],
        finalPrep: [waveVariant("pool-finalprep-a", { intensity: 2.12, spawnInterval: 0.56, maxAlive: 94 }, [
          pack("chlorineShade", 22, 3, 5, "waterline"), pack("summerWall", 36, 2, 3, "lane-wall"), pack("noonCompressor", 42, 2, 3, "front-arc")
        ])]
      },
      events: [
        timedEvent("pool-810-break", "08:10", "special-wave", { pool: ["bonusXpSwarm", "cooldownShard", "healDropWave"], guaranteePickup: "heal-small" }),
        timedEvent("pool-1544-crisis", "15:44", "crisis", { screenFx: "aqua-freeze", musicCue: "crisis-1544" })
      ],
      bosses: [
        bossEvent("pool-elite-03", "03:00", "middayShadow", "normal"),
        bossEvent("pool-elite-10", "10:00", "afternoonShard", "rare"),
        bossEvent("pool-final-20", "20:00", "poolLord", "evolution")
      ]
    },

    festivalGround: {
      label: "夏祭り会場",
      recommendedStyle: "無口",
      endlessRamp: { everySec: 120, hpStep: 0.22, speedStep: 0.05, spawnStep: 0.15, extraEliteEverySec: 270 },
      phaseTables: {
        opening: [waveVariant("festival-opening-a", { intensity: 0.8, spawnInterval: 1.18, maxAlive: 26 }, [
          pack("semiScout", 36, 4, 7, "edge-ring"), pack("stallLantern", 64, 1, 2, "bomb-arc")
        ])],
        pressure1: [waveVariant("festival-pressure-a", { intensity: 0.96, spawnInterval: 1.02, maxAlive: 32 }, [
          pack("stallLantern", 44, 2, 3, "bomb-arc"), pack("rumorWisp", 24, 2, 4, "rear-pulse"), pack("marketShadow", 32, 1, 2, "side-pin")
        ])],
        elitePrep: [waveVariant("festival-eliteprep-a", { intensity: 1.08, spawnInterval: 0.96, maxAlive: 40 }, [
          pack("stallLantern", 34, 2, 4, "bomb-arc"), pack("marketShadow", 26, 2, 3, "rear-pulse"), pack("poolRemnant", 40, 1, 2, "edge-wall")
        ])],
        swarm1: [waveVariant("festival-swarm-a", { intensity: 1.22, spawnInterval: 0.88, maxAlive: 48 }, [
          pack("stallLantern", 28, 3, 5, "bomb-arc"), pack("clockNeedleHound", 24, 2, 3, "lane-left"), pack("poolRemnant", 48, 1, 2, "edge-wall")
        ])],
        rangedCheck: [waveVariant("festival-ranged-a", { intensity: 1.36, spawnInterval: 0.82, maxAlive: 56 }, [
          pack("stallLantern", 28, 3, 5, "bomb-arc"), pack("rumorBeast", 24, 1, 1, "rear-pulse"), pack("clockNeedleHound", 48, 2, 4, "cross-dash")
        ])],
        event810: [waveVariant("festival-810-a", { intensity: 1.5, spawnInterval: 0.78, maxAlive: 64 }, [
          pack("stallLantern", 24, 3, 6, "bomb-arc"), pack("noonCompressor", 30, 2, 3, "front-arc"), pack("clockNeedleHound", 46, 3, 4, "cross-dash")
        ])],
        midPrep: [waveVariant("festival-mid-a", { intensity: 1.66, spawnInterval: 0.72, maxAlive: 72 }, [
          pack("stallLantern", 20, 4, 6, "bomb-arc"), pack("summerWall", 34, 2, 3, "edge-wall"), pack("afternoonShard", 46, 1, 1, "rear-pulse")
        ])],
        mixedLate: [waveVariant("festival-late-a", { intensity: 1.82, spawnInterval: 0.66, maxAlive: 80 }, [
          pack("stallLantern", 24, 4, 7, "bomb-arc"), pack("clockNeedleHound", 24, 3, 5, "cross-dash"), pack("noonCompressor", 52, 2, 3, "front-arc")
        ])],
        crisis1544: [waveVariant("festival-crisis-a", { intensity: 2.02, spawnInterval: 0.6, maxAlive: 90 }, [
          pack("stallLantern", 22, 5, 8, "bomb-arc"), pack("afternoonShard", 38, 1, 2, "rear-pulse"), pack("summerWall", 40, 2, 3, "edge-wall")
        ])],
        finalPrep: [waveVariant("festival-finalprep-a", { intensity: 2.18, spawnInterval: 0.54, maxAlive: 98 }, [
          pack("stallLantern", 20, 5, 8, "bomb-arc"), pack("clockNeedleHound", 32, 4, 6, "cross-dash"), pack("noonCompressor", 48, 2, 4, "front-arc")
        ])]
      },
      events: [
        timedEvent("festival-810-beat", "08:10", "special-wave", { pool: ["coinRush", "rareChestEscort", "bonusXpSwarm"], guaranteePickup: "treasure-pulse" }),
        timedEvent("festival-1544-crisis", "15:44", "crisis", { screenFx: "pink-bloom", musicCue: "crisis-1544" })
      ],
      bosses: [
        bossEvent("festival-elite-03", "03:00", "rumorBeast", "normal"),
        bossEvent("festival-elite-10", "10:00", "afternoonShard", "rare"),
        bossEvent("festival-final-20", "20:00", "festivalLord", "evolution")
      ]
    },

    clockTower: {
      label: "時計台前",
      recommendedStyle: "本気",
      endlessRamp: { everySec: 120, hpStep: 0.24, speedStep: 0.06, spawnStep: 0.16, extraEliteEverySec: 250 },
      phaseTables: {
        opening: [waveVariant("clock-opening-a", { intensity: 0.84, spawnInterval: 1.14, maxAlive: 28 }, [
          pack("clockNeedleHound", 52, 2, 4, "lane-left"), pack("heatHazeSmall", 48, 2, 3, "front-arc")
        ])],
        pressure1: [waveVariant("clock-pressure-a", { intensity: 1.0, spawnInterval: 1.0, maxAlive: 34 }, [
          pack("clockNeedleHound", 38, 3, 5, "cross-dash"), pack("summerWall", 28, 1, 2, "edge-wall"), pack("noonCompressor", 34, 1, 2, "front-arc")
        ])],
        elitePrep: [waveVariant("clock-eliteprep-a", { intensity: 1.14, spawnInterval: 0.92, maxAlive: 42 }, [
          pack("clockNeedleHound", 32, 3, 5, "cross-dash"), pack("noonCompressor", 34, 2, 3, "front-arc"), pack("afternoonShard", 34, 1, 1, "rear-pulse")
        ])],
        swarm1: [waveVariant("clock-swarm-a", { intensity: 1.28, spawnInterval: 0.84, maxAlive: 50 }, [
          pack("clockNeedleHound", 28, 4, 6, "cross-dash"), pack("summerWall", 32, 2, 2, "edge-wall"), pack("noonCompressor", 40, 2, 3, "front-arc")
        ])],
        rangedCheck: [waveVariant("clock-ranged-a", { intensity: 1.46, spawnInterval: 0.78, maxAlive: 58 }, [
          pack("clockNeedleHound", 28, 4, 6, "cross-dash"), pack("afternoonShard", 26, 1, 1, "rear-pulse"), pack("summerWall", 46, 2, 3, "edge-wall")
        ])],
        event810: [waveVariant("clock-810-a", { intensity: 1.6, spawnInterval: 0.72, maxAlive: 66 }, [
          pack("clockNeedleHound", 26, 4, 7, "cross-dash"), pack("noonCompressor", 28, 2, 4, "front-arc"), pack("afternoonShard", 46, 1, 2, "rear-pulse")
        ])],
        midPrep: [waveVariant("clock-mid-a", { intensity: 1.78, spawnInterval: 0.68, maxAlive: 74 }, [
          pack("clockNeedleHound", 24, 5, 7, "cross-dash"), pack("summerWall", 28, 2, 3, "edge-wall"), pack("afternoonShard", 48, 1, 2, "rear-pulse")
        ])],
        mixedLate: [waveVariant("clock-late-a", { intensity: 1.96, spawnInterval: 0.62, maxAlive: 82 }, [
          pack("clockNeedleHound", 22, 5, 8, "cross-dash"), pack("afternoonShard", 34, 2, 2, "rear-pulse"), pack("noonCompressor", 44, 2, 4, "front-arc")
        ])],
        crisis1544: [waveVariant("clock-crisis-a", { intensity: 2.18, spawnInterval: 0.56, maxAlive: 94 }, [
          pack("clockNeedleHound", 20, 6, 9, "cross-dash"), pack("afternoonShard", 36, 2, 3, "rear-pulse"), pack("summerWall", 44, 2, 4, "edge-wall")
        ])],
        finalPrep: [waveVariant("clock-finalprep-a", { intensity: 2.34, spawnInterval: 0.5, maxAlive: 104 }, [
          pack("clockNeedleHound", 18, 6, 10, "cross-dash"), pack("noonCompressor", 32, 3, 4, "front-arc"), pack("afternoonShard", 50, 2, 3, "rear-pulse")
        ])]
      },
      events: [
        timedEvent("clock-810-breach", "08:10", "special-wave", { pool: ["rareChestEscort", "bonusXpSwarm", "timeDiscount"], guaranteePickup: "cooldown-shard" }),
        timedEvent("clock-1544-crisis", "15:44", "crisis", { screenFx: "time-crack", musicCue: "crisis-1544" })
      ],
      bosses: [
        bossEvent("clock-elite-03", "03:00", "afternoonShard", "normal"),
        bossEvent("clock-elite-10", "10:00", "rumorBeast", "rare"),
        bossEvent("clock-final-20", "20:00", "clockLord", "evolution")
      ]
    }
  };

  ns.survivorSpawnTables = {
    version: 1,
    phaseSchedule: phaseSchedule,
    enemyArchetypes: enemyArchetypes,
    hazardRanks: hazardRanks,
    stages: stages
  };

  ns.getSurvivorWavePlan = function (stageId, rank) {
    var stage = stages[stageId];
    if (!stage) {
      return null;
    }

    var safeRank = Math.max(0, Math.min(15, rank || 0));
    var hazard = clone(hazardRanks[safeRank]);
    var plan = clone(stage);
    plan.hazard = hazard;
    plan.phases = Object.keys(phaseSchedule).map(function (phaseId) {
      var schedule = phaseSchedule[phaseId];
      var variants = (plan.phaseTables[phaseId] || []).filter(function (entry) {
        return entry.minRank <= safeRank;
      }).map(function (entry) {
        entry.startSec = schedule.startSec;
        entry.endSec = schedule.endSec;
        entry.director.spawnInterval = round(entry.director.spawnInterval * hazard.spawnIntervalMultiplier, 3);
        entry.director.maxAlive = Math.max(1, Math.round(entry.director.maxAlive * hazard.maxAliveMultiplier));
        entry.director.intensity = round(entry.director.intensity * hazard.maxAliveMultiplier, 2);
        return entry;
      });

      return {
        id: phaseId,
        startSec: schedule.startSec,
        endSec: schedule.endSec,
        variants: variants
      };
    });

    plan.events = plan.events.filter(function (entry) {
      return entry.minRank <= safeRank;
    });

    plan.bosses = plan.bosses.filter(function (entry) {
      return entry.minRank <= safeRank;
    });

    plan.enemyScale = {
      hpMultiplier: hazard.enemyHpMultiplier,
      speedMultiplier: hazard.enemySpeedMultiplier,
      eliteHpMultiplier: hazard.eliteHpMultiplier,
      projectileSpeedMultiplier: hazard.projectileSpeedMultiplier
    };

    return plan;
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
