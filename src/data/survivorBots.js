(function (ns) {
  ns.survivorBots = [
    {
      id: "takeruBlaze",
      skinId: "summerFestival",
      color: "#ffb86f",
      name: {
        ja: "熱血タケル",
        en: "Takeru Blaze"
      },
      tone: {
        ja: "前に出れば流れはこっちに来る。",
        en: "Push forward and the run bends your way."
      },
      intro: {
        ja: "剣と斧で押し込む。細かいことは走りながら考える。",
        en: "Sword first, axe second. Think later, survive now."
      },
      defeat: {
        ja: "まだ足りない。次でもっと前に出る。",
        en: "Not enough. Next run, I push even harder."
      },
      favoriteUpgrades: ["summerSword", "breakerAxe", "yarimasuNee", "powerShirt"],
      hatedEnemies: ["speakerTotem", "abyssPriest"],
      preferredRange: 132,
      avoidRange: 90,
      pickupBias: 0.58,
      strafeWeight: 0.42,
      projectileFear: 0.48,
      crowdFear: 0.56,
      orbitSign: 1
    },
    {
      id: "reiStatic",
      skinId: "poolMonitor",
      color: "#7fe6ff",
      name: {
        ja: "冷静レイ",
        en: "Rei Static"
      },
      tone: {
        ja: "焦ると射線が崩れる。距離を保つ。",
        en: "Panic ruins aim. Keep your spacing."
      },
      intro: {
        ja: "杖とドローンで整える。危険は先に切る。",
        en: "Wand and drone. Trim danger before it snowballs."
      },
      defeat: {
        ja: "判断は悪くなかった。配置が上だっただけ。",
        en: "The call was fine. The spawn was simply better."
      },
      favoriteUpgrades: ["mysticWand", "droneBuddy", "heatSink", "pickupAura"],
      hatedEnemies: ["shadeRunner", "clockNeedleHound"],
      preferredRange: 234,
      avoidRange: 152,
      pickupBias: 0.86,
      strafeWeight: 0.66,
      projectileFear: 0.92,
      crowdFear: 0.84,
      orbitSign: -1
    },
    {
      id: "kazuZenith",
      skinId: "noonAwakening",
      color: "#ffe07a",
      name: {
        ja: "昼王カズ",
        en: "Kazu Zenith"
      },
      tone: {
        ja: "太陽線を通す。見えている敵は全部焦がす。",
        en: "Line up the sunbeam. Burn everything in sight."
      },
      intro: {
        ja: "ビームと印で中央を支配する。王の走りを見せる。",
        en: "Beam, sigil, pressure. Rule the center lane."
      },
      defeat: {
        ja: "王は倒れても次の演出を残す。",
        en: "Even a fallen king leaves the next entrance glowing."
      },
      favoriteUpgrades: ["sunbeam810", "haloSigil", "meteorCall", "lucky810"],
      hatedEnemies: ["mirrorMoth", "marketShadow"],
      preferredRange: 182,
      avoidRange: 118,
      pickupBias: 0.7,
      strafeWeight: 0.58,
      projectileFear: 0.68,
      crowdFear: 0.72,
      orbitSign: 1
    }
  ];
})(window.ManatsuRPG = window.ManatsuRPG || {});
