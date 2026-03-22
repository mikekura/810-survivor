(function (ns) {
  function text(ja, en) {
    return { ja: ja, en: en };
  }

  function shot(color, trailColor, accentColor, trailRate, shape, spin, rippleColor) {
    return {
      color: color,
      trailColor: trailColor,
      accentColor: accentColor,
      trailRate: trailRate,
      shape: shape,
      spin: spin,
      rippleColor: rippleColor || color
    };
  }

  ns.survivorSkins = [
    {
      id: "classicSenpai",
      premium: false,
      price: 0,
      color: "#f6c453",
      auraColor: "#f6c453",
      name: text("クラシック先輩", "Classic Senpai"),
      desc: text("基準になる無料スキン。熱とホコリのさりげない軌跡が残る。", "The free baseline skin. Leaves a subtle heat-and-dust trail."),
      sprite: {
        skin: "#ba7f60",
        hair: "#151110",
        shirt: "#2f4465",
        pants: "#1c2437",
        shoes: "#f1f3f8",
        wide: true,
        thickBrow: true,
        croppedHair: true,
        strongJaw: true
      },
      cosmetics: {
        footsteps: { color: "#d7b37a", accentColor: "#ffe8b3", interval: 0.11, count: 2, shape: "diamond", ring: false },
        shots: {
          bullet: shot("#8fe9ff", "#dffbff", "#fff1c4", 0.08, "square", 8, "#8fe9ff"),
          crit: shot("#ffe07a", "#fff1c4", "#ffffff", 0.09, "diamond", 10, "#ffe07a"),
          pulse: shot("#f5adff", "#ffd9ff", "#fff1c4", 0.06, "diamond", 7, "#f5adff"),
          backshot: shot("#ffcf9d", "#ffe2c5", "#fff1c4", 0.07, "square", 7, "#ffcf9d"),
          beam: { color: "#ffe07a", flashColor: "#ffe07a" }
        }
      }
    },
    {
      id: "poolMonitor",
      premium: true,
      price: 300,
      color: "#7fe6ff",
      auraColor: "#7fe6ff",
      name: text("プール監視先輩", "Pool Guard Senpai"),
      desc: text("サングラスと笛が目印の夏本番スキン。水しぶきが歩き跡と射撃のあとに残る。", "A midsummer pool-guard skin with sunglasses and a whistle. Water splashes follow both steps and shots."),
      sprite: {
        skin: "#ba7f60",
        hair: "#151110",
        shirt: "#33506f",
        pants: "#5f8aa9",
        shoes: "#f1f3f8",
        wide: true,
        thickBrow: true,
        croppedHair: true,
        strongJaw: true,
        sunglasses: true,
        whistle: true,
        whistleColor: "#ffd76f",
        shorts: true
      },
      cosmetics: {
        footsteps: { color: "#7fe6ff", accentColor: "#dffbff", interval: 0.08, count: 3, shape: "circle", ring: true },
        shots: {
          bullet: shot("#7fe6ff", "#bff7ff", "#ffffff", 0.05, "circle", 6, "#7fe6ff"),
          crit: shot("#b7f6ff", "#e8fdff", "#ffffff", 0.05, "circle", 7, "#b7f6ff"),
          pulse: shot("#72d9ff", "#dffbff", "#ffffff", 0.05, "circle", 6, "#72d9ff"),
          backshot: shot("#9feeff", "#dffbff", "#ffffff", 0.05, "circle", 6, "#9feeff"),
          beam: { color: "#b7f6ff", flashColor: "#dffbff" }
        }
      }
    },
    {
      id: "summerFestival",
      premium: true,
      price: 300,
      color: "#ff9c4b",
      auraColor: "#ff9c4b",
      name: text("夏祭り先輩", "Summer Festival Senpai"),
      desc: text("法被とはちまきのお祭り仕様。歩くと紙吹雪、攻撃すると花火みたいな火花が散る。", "A happi-coat festival look. Leaves confetti on the ground and sparkler bursts on attack."),
      sprite: {
        skin: "#bb805f",
        hair: "#151110",
        shirt: "#8a2d32",
        pants: "#2b2e55",
        shoes: "#f0e1c5",
        wide: true,
        thickBrow: true,
        croppedHair: true,
        strongJaw: true,
        happi: true,
        trimColor: "#f6c453",
        headband: true,
        headbandColor: "#fff0e8"
      },
      cosmetics: {
        footsteps: { color: "#ff9c4b", accentColor: "#ffe0b4", interval: 0.085, count: 3, shape: "diamond", ring: false },
        shots: {
          bullet: shot("#ffb86f", "#ffd49c", "#fff1c4", 0.06, "diamond", 10, "#ffb86f"),
          crit: shot("#ffd76f", "#fff1c4", "#ffffff", 0.06, "diamond", 12, "#ffd76f"),
          pulse: shot("#ff91d7", "#ffd1ef", "#fff1c4", 0.05, "diamond", 10, "#ff91d7"),
          backshot: shot("#ffcf9d", "#ffe6c8", "#fff1c4", 0.05, "diamond", 10, "#ffcf9d"),
          beam: { color: "#ffd76f", flashColor: "#fff1c4" }
        }
      }
    },
    {
      id: "noonAwakening",
      premium: true,
      price: 400,
      color: "#ffe07a",
      auraColor: "#ffe07a",
      name: text("真昼覚醒先輩", "Noon Awakened Senpai"),
      desc: text("白金の光をまとう覚醒形態。歩き跡は灼熱の揺らぎとなり、弾もまぶしく発光する。", "An awakened white-gold form. Leaves radiant heat shimmer and blazing projectile flashes."),
      sprite: {
        skin: "#bf8564",
        hair: "#171311",
        shirt: "#f3efe3",
        pants: "#d1a244",
        shoes: "#fff6d4",
        wide: true,
        thickBrow: true,
        croppedHair: true,
        strongJaw: true,
        glow: true,
        glowColor: "#ffe07a",
        eyeGlow: true,
        trimColor: "#f6c453"
      },
      cosmetics: {
        footsteps: { color: "#ffe07a", accentColor: "#fff1c4", interval: 0.075, count: 3, shape: "circle", ring: true },
        shots: {
          bullet: shot("#ffe07a", "#fff1c4", "#ffffff", 0.04, "circle", 8, "#ffe07a"),
          crit: shot("#fff1c4", "#ffffff", "#ffffff", 0.04, "circle", 10, "#fff1c4"),
          pulse: shot("#ffd76f", "#fff1c4", "#ffffff", 0.04, "circle", 8, "#ffd76f"),
          backshot: shot("#ffe4a6", "#fff1c4", "#ffffff", 0.04, "circle", 8, "#ffe4a6"),
          beam: { color: "#fff1c4", flashColor: "#ffe07a" }
        }
      }
    },
    {
      id: "nightPatrol",
      premium: true,
      price: 350,
      color: "#8db4ff",
      auraColor: "#8db4ff",
      name: text("夜巡回先輩", "Night Patrol Senpai"),
      desc: text("深夜の監視員みたいなネオンスキン。足元と射撃に青紫の残光が流れる。", "A neon midnight patrol skin. Blue-violet afterglow trails follow steps and attacks."),
      sprite: {
        skin: "#b58062",
        hair: "#10131c",
        shirt: "#1d2f5d",
        pants: "#12192d",
        shoes: "#dce8ff",
        wide: true,
        thickBrow: true,
        croppedHair: true,
        strongJaw: true,
        cap: true,
        glow: true,
        glowColor: "#8db4ff"
      },
      cosmetics: {
        footsteps: { color: "#8db4ff", accentColor: "#d7e5ff", interval: 0.085, count: 2, shape: "diamond", ring: true },
        shots: {
          bullet: shot("#8db4ff", "#d7e5ff", "#ffffff", 0.05, "square", 11, "#8db4ff"),
          crit: shot("#c7d6ff", "#f0f5ff", "#ffffff", 0.05, "diamond", 12, "#c7d6ff"),
          pulse: shot("#a38cff", "#dcd0ff", "#ffffff", 0.05, "diamond", 10, "#a38cff"),
          backshot: shot("#7fa2cc", "#d7e5ff", "#ffffff", 0.05, "square", 10, "#7fa2cc"),
          beam: { color: "#c7d6ff", flashColor: "#8db4ff" }
        }
      }
    },
    {
      id: "ramuneDrive",
      premium: true,
      price: 350,
      color: "#7bf0d4",
      auraColor: "#7bf0d4",
      name: text("ラムネドライブ先輩", "Ramune Drive Senpai"),
      desc: text("ラムネみたいな冷たい青緑スキン。泡が足元からはじけ、弾もソーダっぽく光る。", "A cool ramune-inspired mint skin. Bubbles pop underfoot and soda-like shots sparkle on impact."),
      sprite: {
        skin: "#bb8062",
        hair: "#131518",
        shirt: "#2d7f7f",
        pants: "#1f4450",
        shoes: "#eefefe",
        wide: true,
        thickBrow: true,
        croppedHair: true,
        strongJaw: true,
        headband: true,
        headbandColor: "#cffff8"
      },
      cosmetics: {
        footsteps: { color: "#7bf0d4", accentColor: "#dffef7", interval: 0.08, count: 3, shape: "circle", ring: true },
        shots: {
          bullet: shot("#7bf0d4", "#dffef7", "#ffffff", 0.05, "circle", 9, "#7bf0d4"),
          crit: shot("#bffff2", "#ffffff", "#ffffff", 0.05, "circle", 10, "#bffff2"),
          pulse: shot("#9cecff", "#dffbff", "#ffffff", 0.05, "circle", 9, "#9cecff"),
          backshot: shot("#7fe6ff", "#dffbff", "#ffffff", 0.05, "circle", 9, "#7fe6ff"),
          beam: { color: "#bffff2", flashColor: "#dffef7" }
        }
      }
    },
    {
      id: "stationMaster",
      premium: true,
      price: 350,
      color: "#d4b48a",
      auraColor: "#d4b48a",
      name: text("駅員先輩", "Station Master Senpai"),
      desc: text("駅前ステージ向けのスキン。チケットとレールスパークみたいな土色の軌跡が残る。", "A station-front themed skin. Leaves ticket-like copper sparks and rail flashes behind every volley."),
      sprite: {
        skin: "#b98365",
        hair: "#181512",
        shirt: "#7f5632",
        pants: "#2c2f40",
        shoes: "#f0ead8",
        wide: true,
        thickBrow: true,
        croppedHair: true,
        strongJaw: true,
        cap: true,
        tie: "#d9c27d"
      },
      cosmetics: {
        footsteps: { color: "#d4b48a", accentColor: "#f6e8c9", interval: 0.09, count: 2, shape: "diamond", ring: false },
        shots: {
          bullet: shot("#d4b48a", "#f6e8c9", "#ffffff", 0.06, "ticket", 8, "#d4b48a"),
          crit: shot("#f6e8c9", "#fff8e8", "#ffffff", 0.06, "ticket", 9, "#f6e8c9"),
          pulse: shot("#c6b39b", "#ece1d0", "#ffffff", 0.06, "ticket", 8, "#c6b39b"),
          backshot: shot("#b89562", "#f6e8c9", "#ffffff", 0.06, "ticket", 8, "#b89562"),
          beam: { color: "#f6e8c9", flashColor: "#d4b48a" }
        }
      }
    },
    {
      id: "score81000",
      premium: true,
      price: 0,
      unlockType: "score",
      scoreThreshold: 81000,
      color: "#7fe6ff",
      auraColor: "#7fe6ff",
      name: text("8.1万 潮走先輩", "81K Tide Runner"),
      desc: text("スコア81000で解放。歩き跡と攻撃が明るい水流と飛沫に変わる。", "Unlocked at 81,000 score. Turns steps and attacks into bright aqua wakes and rushing streaks."),
      sprite: {
        skin: "#bc8264",
        hair: "#131316",
        shirt: "#2f5d7b",
        pants: "#1f3950",
        shoes: "#f3fbff",
        wide: true,
        thickBrow: true,
        croppedHair: true,
        strongJaw: true,
        whistle: true,
        whistleColor: "#dffbff",
        glow: true,
        glowColor: "#7fe6ff"
      },
      cosmetics: {
        footsteps: { color: "#7fe6ff", accentColor: "#dffbff", interval: 0.075, count: 3, shape: "circle", ring: true },
        shots: {
          bullet: shot("#7fe6ff", "#dffbff", "#ffffff", 0.045, "circle", 8, "#7fe6ff"),
          crit: shot("#b9f7ff", "#effdff", "#ffffff", 0.045, "circle", 9, "#b9f7ff"),
          pulse: shot("#74d6ff", "#dffbff", "#ffffff", 0.045, "circle", 8, "#74d6ff"),
          backshot: shot("#9feeff", "#dffbff", "#ffffff", 0.045, "circle", 8, "#9feeff"),
          beam: { color: "#dffbff", flashColor: "#7fe6ff" }
        }
      }
    },
    {
      id: "score114514",
      premium: true,
      price: 0,
      unlockType: "score",
      scoreThreshold: 114514,
      color: "#fff1c4",
      auraColor: "#ffe07a",
      name: text("114514 王冠先輩", "114514 Infinity Crown"),
      desc: text("スコア114514で解放される特別スキン。白金の残光、豪華なオーラ、大きな存在感を持つ。", "A special skin unlocked at 114,514 score. White-gold afterglow, lavish aura, and a massive on-screen presence."),
      sprite: {
        skin: "#c48867",
        hair: "#151110",
        shirt: "#fff3d3",
        pants: "#caa244",
        shoes: "#fff9e8",
        wide: true,
        thickBrow: true,
        croppedHair: true,
        strongJaw: true,
        glow: true,
        glowColor: "#ffe07a",
        eyeGlow: true,
        trimColor: "#fff1c4",
        headband: true,
        headbandColor: "#fff7da"
      },
      cosmetics: {
        footsteps: { color: "#ffe07a", accentColor: "#fff1c4", interval: 0.06, count: 4, shape: "circle", ring: true },
        shots: {
          bullet: shot("#fff1c4", "#ffffff", "#ffe07a", 0.035, "circle", 10, "#fff1c4"),
          crit: shot("#ffffff", "#fff8e6", "#ffe07a", 0.035, "circle", 12, "#ffffff"),
          pulse: shot("#ffd76f", "#fff1c4", "#ffffff", 0.035, "circle", 10, "#ffd76f"),
          backshot: shot("#ffe8a6", "#fff1c4", "#ffffff", 0.035, "circle", 10, "#ffe8a6"),
          beam: { color: "#ffffff", flashColor: "#ffe07a" }
        }
      }
    },
    {
      id: "score162000",
      premium: true,
      price: 0,
      unlockType: "score",
      scoreThreshold: 162000,
      color: "#9db7ff",
      auraColor: "#9db7ff",
      name: text("16.2万 夜駆先輩", "162K Night Driver"),
      desc: text("スコア162000で解放。軌跡と飛び道具がネオンの深夜特急みたいに変わる。", "Unlocked at 162,000 score. Turns your trail and projectiles into a neon midnight express."),
      sprite: {
        skin: "#bc8264",
        hair: "#10131c",
        shirt: "#243c72",
        pants: "#12192d",
        shoes: "#e8f0ff",
        wide: true,
        thickBrow: true,
        croppedHair: true,
        strongJaw: true,
        cap: true,
        glow: true,
        glowColor: "#9db7ff"
      },
      cosmetics: {
        footsteps: { color: "#9db7ff", accentColor: "#d7e5ff", interval: 0.08, count: 3, shape: "diamond", ring: true },
        shots: {
          bullet: shot("#9db7ff", "#d7e5ff", "#ffffff", 0.045, "square", 11, "#9db7ff"),
          crit: shot("#d7e5ff", "#f0f5ff", "#ffffff", 0.045, "diamond", 13, "#d7e5ff"),
          pulse: shot("#b58cff", "#e5d8ff", "#ffffff", 0.045, "diamond", 11, "#b58cff"),
          backshot: shot("#8db4ff", "#d7e5ff", "#ffffff", 0.045, "square", 11, "#8db4ff"),
          beam: { color: "#d7e5ff", flashColor: "#9db7ff" }
        }
      }
    },
    {
      id: "score243000",
      premium: true,
      price: 0,
      unlockType: "score",
      scoreThreshold: 243000,
      color: "#ffbe7a",
      auraColor: "#ffbe7a",
      name: text("24.3万 灼熱先輩", "243K Solar Breaker"),
      desc: text("スコア243000で解放。過熱した閃光と太陽ビームが走る灼熱スキン。", "Unlocked at 243,000 score. A blazing gold-orange skin with overheated flashes and solar beams."),
      sprite: {
        skin: "#c28667",
        hair: "#151110",
        shirt: "#fff0cb",
        pants: "#c26d2f",
        shoes: "#fff4df",
        wide: true,
        thickBrow: true,
        croppedHair: true,
        strongJaw: true,
        glow: true,
        glowColor: "#ffbe7a",
        eyeGlow: true,
        trimColor: "#ffe7a6"
      },
      cosmetics: {
        footsteps: { color: "#ffbe7a", accentColor: "#fff1c4", interval: 0.07, count: 4, shape: "circle", ring: true },
        shots: {
          bullet: shot("#ffbe7a", "#ffe8be", "#ffffff", 0.04, "circle", 9, "#ffbe7a"),
          crit: shot("#fff1c4", "#ffffff", "#ffffff", 0.04, "circle", 10, "#fff1c4"),
          pulse: shot("#ffd76f", "#fff1c4", "#ffffff", 0.04, "circle", 9, "#ffd76f"),
          backshot: shot("#ffcf9d", "#ffe6c8", "#ffffff", 0.04, "circle", 9, "#ffcf9d"),
          beam: { color: "#fff1c4", flashColor: "#ffbe7a" }
        }
      }
    },
    {
      id: "score324000",
      premium: true,
      price: 0,
      unlockType: "score",
      scoreThreshold: 324000,
      color: "#ff91d7",
      auraColor: "#ff91d7",
      name: text("32.4万 祭王先輩", "324K Festival King"),
      desc: text("スコア324000で解放。火花、紙吹雪、祭りの締めみたいな派手な残像が広がる。", "Unlocked at 324,000 score. Full-on spark showers, confetti, and a festival finale silhouette."),
      sprite: {
        skin: "#bc8161",
        hair: "#151110",
        shirt: "#872437",
        pants: "#30285d",
        shoes: "#f4e3c8",
        wide: true,
        thickBrow: true,
        croppedHair: true,
        strongJaw: true,
        happi: true,
        trimColor: "#ffe07a",
        headband: true,
        headbandColor: "#fff0f7",
        glow: true,
        glowColor: "#ff91d7"
      },
      cosmetics: {
        footsteps: { color: "#ff91d7", accentColor: "#ffe0f2", interval: 0.07, count: 4, shape: "diamond", ring: true },
        shots: {
          bullet: shot("#ff91d7", "#ffd1ef", "#fff1c4", 0.04, "diamond", 12, "#ff91d7"),
          crit: shot("#ffe07a", "#fff1c4", "#ffffff", 0.04, "diamond", 13, "#ffe07a"),
          pulse: shot("#ffb86f", "#ffe0b4", "#ffffff", 0.04, "diamond", 12, "#ffb86f"),
          backshot: shot("#ffcf9d", "#ffe6c8", "#ffffff", 0.04, "diamond", 12, "#ffcf9d"),
          beam: { color: "#ffe07a", flashColor: "#ff91d7" }
        }
      }
    },
    {
      id: "score405000",
      premium: true,
      price: 0,
      unlockType: "score",
      scoreThreshold: 405000,
      color: "#d4b48a",
      auraColor: "#d4b48a",
      name: text("40.5万 時計王先輩", "405K Clock Regent"),
      desc: text("スコア405000で解放。真鍮の軌跡と淡い白金ビームが伸びる報酬スキン。", "Unlocked at 405,000 score. A regal clock-tower reward skin with brass trails and pale platinum beams."),
      sprite: {
        skin: "#bb8366",
        hair: "#181512",
        shirt: "#755332",
        pants: "#2c2f40",
        shoes: "#f0ead8",
        wide: true,
        thickBrow: true,
        croppedHair: true,
        strongJaw: true,
        cap: true,
        tie: "#fff1c4",
        glow: true,
        glowColor: "#d4b48a"
      },
      cosmetics: {
        footsteps: { color: "#d4b48a", accentColor: "#f6e8c9", interval: 0.08, count: 3, shape: "diamond", ring: false },
        shots: {
          bullet: shot("#d4b48a", "#f6e8c9", "#ffffff", 0.05, "ticket", 9, "#d4b48a"),
          crit: shot("#f6e8c9", "#fff8e8", "#ffffff", 0.05, "ticket", 10, "#f6e8c9"),
          pulse: shot("#c6b39b", "#ece1d0", "#ffffff", 0.05, "ticket", 9, "#c6b39b"),
          backshot: shot("#b89562", "#f6e8c9", "#ffffff", 0.05, "ticket", 9, "#b89562"),
          beam: { color: "#fff8e8", flashColor: "#d4b48a" }
        }
      }
    }
  ];
})(window.ManatsuRPG = window.ManatsuRPG || {});
