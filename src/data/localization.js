(function (ns) {
  var DICTIONARIES = {
    en: {
      buttons: {
        startRun: "START RUN",
        title: "TITLE",
        retry: "RETRY",
        pause: "PAUSE",
        go: "GO",
        language: "LANG",
        skin: "SKIN",
        codex: "CODEX",
        recipes: "RECIPES",
        back: "BACK",
        buy: "BUY",
        leave: "LEAVE",
        action: "ACTION",
        stage: "STAGE",
        rank: "RANK"
      },
      common: {
        bestRun: "BEST RUN",
        clearGoal: "CLEAR GOAL",
        build: "BUILD",
        buildPicks: "BUILD PICKS",
        chooseBuildPiece: "Choose a build piece",
        chooseConfirm: "Arrow keys or click. Z confirms.",
        best: "BEST",
        hp: "HP",
        xp: "XP",
        atk: "ATK",
        spd: "SPD",
        mag: "MAG",
        arm: "ARM",
        phase: "PHASE",
        levelUp: "LEVEL UP!",
        new: "NEW!",
        level: "LEVEL",
        kills: "KILLS",
        runs: "RUNS",
        time: "TIME",
        coins: "COINS",
        surviveGoal: "SURVIVE 20:00"
      },
      title: {
        subtitle: "MOUSE / TOUCH / WASD / ARROWS",
        intro: "20 minute survival. Time changes the enemy set, spawn speed, and pressure.",
        clearGoalBody: "Stay alive through 20:00 and beat the final boss.",
        buildGuide: "Suggested build routes inspired by survivor combo screens.",
        footerHint: "Z or click to choose. Left and right change stage and rank.",
        rankOpen: "Unlocked rank: {rank}"
      },
      survivor: {
        title: "810 SURVIVOR",
        ready: "Mouse / Touch / WASD / Arrows",
        paused: "PAUSED",
        pauseResume: "C or top button to resume",
        pauseRestart: "X or Retry to restart",
        runCleared: "RUN CLEARED",
        runOver: "RUN OVER",
        merchantArrived: "MERCHANT ARRIVED",
        merchantOpen: "SHOP OPEN",
        merchantFundsLow: "NOT ENOUGH COINS",
        merchantBought: "PURCHASED",
        merchantHint: "Every 5:00 a merchant arrives with healing, chests, and fusion goods.",
        retryHint: "Click / Tap / Z to retry",
        touchHint: "Touch drag to move. Top buttons pause, retry, title, language.",
        desktopHint: "Mouse / WASD / Arrows move. Z choose. X retry. C pause.",
        eventAt: "EVENT {time}",
        phaseEnter: "PHASE {phase}",
        levelLabel: "LEVEL {level}",
        rankUnlocked: "RANK {rank} UNLOCKED"
      },
      stages: {
        stationFront: "Station Front",
        shoppingStreet: "Shopping Street",
        poolSide: "Pool Side",
        festivalGround: "Festival Ground",
        clockTower: "Clock Tower"
      },
      phases: {
        opening: "Opening",
        pressure1: "Pressure 1",
        elitePrep: "Elite Prep",
        swarm1: "Swarm 1",
        rangedCheck: "Ranged Check",
        event810: "8:10 Event",
        midPrep: "Mid Prep",
        mixedLate: "Mixed Late",
        crisis1544: "15:44 Crisis",
        finalPrep: "Final Prep"
      },
      enemies: {
        semiScout: "Cicada Scout",
        heatHazeSmall: "Heat Haze",
        rumorWisp: "Rumor Wisp",
        chlorineShade: "Chlorine Shade",
        marketShadow: "Market Shadow",
        stallLantern: "Stall Lantern",
        poolRemnant: "Pool Remnant",
        summerWall: "Summer Wall",
        clockNeedleHound: "Clock Hound",
        noonCompressor: "Noon Compressor",
        middayShadow: "Midday Shadow",
        rumorBeast: "Rumor Beast",
        afternoonShard: "Afternoon Shard",
        signalCrab: "Signal Crab",
        iceCreamBat: "Ice Cream Bat",
        speakerTotem: "Speaker Totem",
        shadeRunner: "Shade Runner",
        mirrorMoth: "Mirror Moth",
        sunspotMine: "Sunspot Mine",
        heatIdol: "Heat Idol",
        stationLord: "Station Lord",
        arcadeLord: "Arcade Lord",
        poolLord: "Pool Lord",
        festivalLord: "Festival Lord",
        clockLord: "Clock Lord"
      },
      upgrades: {
        powerShirt: { name: "Power Shirt", desc: "Basic shot damage +{amount}." },
        coldMugicha: { name: "Cold Mugicha", desc: "Fire interval -{amount}%." },
        quickStep: { name: "Quick Step", desc: "Move speed +{amount}." },
        pickupAura: { name: "Pickup Aura", desc: "Pickup range +{amount}." },
        thickNeck: { name: "Thick Neck", desc: "Max HP +{hp} and armor up." },
        ramuneOrbit: { name: "Ramune Orbit", desc: "Orbit shards circle you and hit enemies." },
        summerPulse: { name: "Summer Pulse", desc: "Releases outward pulses every few seconds." },
        sunbeam810: { name: "810 Sunbeam", desc: "Fires a piercing beam through aligned enemies." },
        pierceSandal: { name: "Pierce Sandal", desc: "Shots pierce +{amount} target(s)." },
        yarimasuNee: { name: "Yarimasu Nee", desc: "Extra volley chance and crit burst up." },
        afterimageStep: { name: "Afterimage Step", desc: "Moving leaves hot afterimages that burst backward." },
        saltGuard: { name: "Salt Guard", desc: "Getting hit sends out a salty shock ring." },
        lucky810: { name: "Lucky 810", desc: "More XP and a better chance of extra drops." },
        droneBuddy: { name: "Buddy Drone", desc: "A side drone auto-fires at the nearest enemy." },
        backstepVolley: { name: "Backstep Volley", desc: "Basic fire also shoots behind you." },
        heatSink: { name: "Heat Sink", desc: "Bullet speed and special cooldowns improve." }
      },
      pickups: {
        xp: "XP Crystal",
        heal: "Cold Mugicha",
        magnet: "All XP Collect",
        chest: "Treasure Chest",
        item114514: "114514 Item",
        yarimasuItem: "Yarimasu Nee Item",
        iizoItem: "Ii Zo Kore Item",
        ikuikuItem: "Ikimasu Yo Ikimasu Item",
        loveItem: "I Liked You Item"
      }
    },
    ja: {
      buttons: {
        startRun: "\u30b9\u30bf\u30fc\u30c8",
        title: "\u30bf\u30a4\u30c8\u30eb",
        retry: "\u30ea\u30c8\u30e9\u30a4",
        pause: "\u4e00\u6642\u505c\u6b62",
        go: "\u518d\u958b",
        language: "\u8a00\u8a9e",
        skin: "\u30b9\u30ad\u30f3",
        codex: "\u56f3\u9451",
        recipes: "\u30ec\u30b7\u30d4",
        back: "\u623b\u308b",
        buy: "\u8cfc\u5165",
        leave: "\u9589\u3058\u308b",
        action: "\u6c7a\u5b9a",
        stage: "\u30b9\u30c6\u30fc\u30b8",
        rank: "\u30e9\u30f3\u30af"
      },
      common: {
        bestRun: "\u30d9\u30b9\u30c8\u30e9\u30f3",
        clearGoal: "\u30af\u30ea\u30a2\u76ee\u6a19",
        build: "\u30d3\u30eb\u30c9",
        buildPicks: "\u30d3\u30eb\u30c9\u5019\u88dc",
        chooseBuildPiece: "\u30d3\u30eb\u30c9\u30921\u3064\u9078\u629e",
        chooseConfirm: "\u77e2\u5370\u30ad\u30fc\u304b\u30af\u30ea\u30c3\u30af\u3067\u9078\u629e\u3002Z\u3067\u6c7a\u5b9a\u3002",
        best: "BEST",
        hp: "HP",
        xp: "XP",
        atk: "\u653b\u6483",
        spd: "\u901f\u5ea6",
        mag: "\u56de\u53ce",
        arm: "\u9632\u5fa1",
        phase: "\u30d5\u30a7\u30fc\u30ba",
        levelUp: "\u30ec\u30d9\u30eb\u30a2\u30c3\u30d7!",
        new: "NEW!",
        level: "\u30ec\u30d9\u30eb",
        kills: "\u6483\u7834\u6570",
        runs: "\u30d7\u30ec\u30a4",
        time: "\u6642\u9593",
        coins: "\u30b3\u30a4\u30f3",
        surviveGoal: "20:00 \u751f\u5b58"
      },
      title: {
        subtitle: "\u30de\u30a6\u30b9 / \u30bf\u30c3\u30c1 / WASD / \u77e2\u5370\u30ad\u30fc",
        intro: "20\u5206\u9593\u751f\u304d\u6b8b\u308b\u30b5\u30d0\u30a4\u30d0\u30fc\u3002\u6642\u9593\u7d4c\u904e\u3067\u6575\u306e\u7a2e\u985e\u3001\u51fa\u73fe\u901f\u5ea6\u3001\u5727\u304c\u5909\u5316\u3059\u308b\u3002",
        clearGoalBody: "20:00\u307e\u3067\u751f\u304d\u6b8b\u308a\u3001\u6700\u5f8c\u306e\u30dc\u30b9\u3092\u5012\u305b\u3002",
        buildGuide: "\u30b5\u30d0\u30a4\u30d0\u30fc\u98a8\u306e\u7d44\u307f\u5408\u308f\u305b\u4f8b\u3002",
        footerHint: "Z\u304b\u30af\u30ea\u30c3\u30af\u3067\u6c7a\u5b9a\u3002\u5de6\u53f3\u3067\u30b9\u30c6\u30fc\u30b8\u3068\u30e9\u30f3\u30af\u3092\u5909\u66f4\u3002",
        rankOpen: "\u89e3\u653e\u6e08\u307f\u30e9\u30f3\u30af: {rank}"
      },
      survivor: {
        title: "810 SURVIVOR",
        ready: "\u30de\u30a6\u30b9 / \u30bf\u30c3\u30c1 / WASD / \u77e2\u5370\u30ad\u30fc\u5bfe\u5fdc",
        paused: "\u4e00\u6642\u505c\u6b62\u4e2d",
        pauseResume: "C \u304b\u4e0a\u306e\u30dc\u30bf\u30f3\u3067\u518d\u958b",
        pauseRestart: "X \u304b\u30ea\u30c8\u30e9\u30a4\u3067\u3084\u308a\u76f4\u3057",
        runCleared: "\u30af\u30ea\u30a2",
        runOver: "\u30b2\u30fc\u30e0\u30aa\u30fc\u30d0\u30fc",
        merchantArrived: "\u5546\u4eba\u304c\u5230\u7740",
        merchantOpen: "\u5546\u4eba\u3092\u958b\u304f",
        merchantFundsLow: "\u30b3\u30a4\u30f3\u304c\u8db3\u308a\u306a\u3044",
        merchantBought: "\u8cfc\u5165\u3057\u305f",
        merchantHint: "5\u5206\u3054\u3068\u306b\u5546\u4eba\u304c\u51fa\u73fe\u3057\u3001\u56de\u5fa9\u3001\u5b9d\u7bb1\u3001\u5408\u6210\u5411\u3051\u306e\u54c1\u3092\u58f2\u308b\u3002",
        retryHint: "\u30af\u30ea\u30c3\u30af / \u30bf\u30c3\u30d7 / Z \u3067\u30ea\u30c8\u30e9\u30a4",
        touchHint: "\u30bf\u30c3\u30c1\u30c9\u30e9\u30c3\u30b0\u3067\u79fb\u52d5\u3002\u4e0a\u306e\u30dc\u30bf\u30f3\u3067\u4e00\u6642\u505c\u6b62\u3001\u30ea\u30c8\u30e9\u30a4\u3001\u30bf\u30a4\u30c8\u30eb\u3001\u8a00\u8a9e\u5207\u66ff\u3002",
        desktopHint: "\u30de\u30a6\u30b9 / WASD / \u77e2\u5370\u3067\u79fb\u52d5\u3002Z \u6c7a\u5b9a\u3002X \u30ea\u30c8\u30e9\u30a4\u3002C \u4e00\u6642\u505c\u6b62\u3002",
        eventAt: "\u30a4\u30d9\u30f3\u30c8 {time}",
        phaseEnter: "\u30d5\u30a7\u30fc\u30ba {phase}",
        levelLabel: "\u30ec\u30d9\u30eb {level}",
        rankUnlocked: "\u30e9\u30f3\u30af {rank} \u89e3\u653e"
      },
      stages: {
        stationFront: "\u99c5\u524d",
        shoppingStreet: "\u5546\u5e97\u8857",
        poolSide: "\u30d7\u30fc\u30eb\u30b5\u30a4\u30c9",
        festivalGround: "\u796d\u308a\u4f1a\u5834",
        clockTower: "\u6642\u8a08\u5854"
      },
      phases: {
        opening: "\u5e8f\u76e4",
        pressure1: "\u5727\u529b\u4e0a\u6607",
        elitePrep: "\u4e2d\u30dc\u30b9\u6e96\u5099",
        swarm1: "\u96c6\u56e3\u8972\u6765",
        rangedCheck: "\u9060\u8ddd\u96e2\u30c1\u30a7\u30c3\u30af",
        event810: "8:10\u30a4\u30d9\u30f3\u30c8",
        midPrep: "\u4e2d\u76e4\u6e96\u5099",
        mixedLate: "\u6df7\u6210\u7d42\u76e4",
        crisis1544: "15:44\u5371\u6a5f",
        finalPrep: "\u6700\u7d42\u6e96\u5099"
      },
      enemies: {
        semiScout: "\u30bb\u30df\u5075\u5bdf",
        heatHazeSmall: "\u71b1\u3060\u307e\u308a",
        rumorWisp: "\u3046\u308f\u3055\u706b",
        chlorineShade: "\u5869\u7d20\u306e\u5f71",
        marketShadow: "\u5546\u5e97\u8857\u306e\u5f71",
        stallLantern: "\u5c4b\u53f0\u30e9\u30f3\u30bf\u30f3",
        poolRemnant: "\u30d7\u30fc\u30eb\u6b8b\u6ecb",
        summerWall: "\u771f\u590f\u306e\u58c1",
        clockNeedleHound: "\u91dd\u72ac",
        noonCompressor: "\u771f\u663c\u5727\u7e2e\u6a5f",
        middayShadow: "\u771f\u663c\u306e\u5f71",
        rumorBeast: "\u3046\u308f\u3055\u7363",
        afternoonShard: "\u5348\u5f8c\u306e\u6b20\u7247",
        signalCrab: "\u30b7\u30b0\u30ca\u30eb\u30ac\u30cb",
        iceCreamBat: "\u30a2\u30a4\u30b9\u30b3\u30a6\u30e2\u30ea",
        speakerTotem: "\u30b9\u30d4\u30fc\u30ab\u30fc\u30c8\u30fc\u30c6\u30e0",
        shadeRunner: "\u30b7\u30a7\u30fc\u30c9\u30e9\u30f3\u30ca\u30fc",
        mirrorMoth: "\u30df\u30e9\u30fc\u30e2\u30b9",
        sunspotMine: "\u30b5\u30f3\u30b9\u30dd\u30c3\u30c8\u5730\u96f7",
        heatIdol: "\u71b1\u306e\u5076\u50cf",
        stationLord: "\u99c5\u524d\u306e\u4e3b",
        arcadeLord: "\u5546\u5e97\u8857\u306e\u4e3b",
        poolLord: "\u30d7\u30fc\u30eb\u306e\u4e3b",
        festivalLord: "\u796d\u308a\u306e\u4e3b",
        clockLord: "\u6642\u8a08\u5854\u306e\u4e3b"
      },
      upgrades: {
        powerShirt: { name: "\u30d1\u30ef\u30fc\u30b7\u30e3\u30c4", desc: "\u901a\u5e38\u5f3e\u306e\u30c0\u30e1\u30fc\u30b8 +{amount}\u3002" },
        coldMugicha: { name: "\u51b7\u3048\u305f\u9ea6\u8336", desc: "\u9023\u5c04\u9593\u9694 -{amount}%\u3002" },
        quickStep: { name: "\u30af\u30a4\u30c3\u30af\u30b9\u30c6\u30c3\u30d7", desc: "\u79fb\u52d5\u901f\u5ea6 +{amount}\u3002" },
        pickupAura: { name: "\u56de\u53ce\u30aa\u30fc\u30e9", desc: "\u56de\u53ce\u7bc4\u56f2 +{amount}\u3002" },
        thickNeck: { name: "\u592a\u3044\u9996", desc: "\u6700\u5927HP +{hp}\u3001\u9632\u5fa1\u3082\u4e0a\u6607\u3002" },
        ramuneOrbit: { name: "\u30e9\u30e0\u30cd\u30aa\u30fc\u30d3\u30c3\u30c8", desc: "\u5468\u56de\u5f3e\u304c\u4f53\u306e\u5468\u308a\u3092\u56de\u3063\u3066\u6575\u306b\u5f53\u305f\u308b\u3002" },
        summerPulse: { name: "\u30b5\u30de\u30fc\u30d1\u30eb\u30b9", desc: "\u6570\u79d2\u3054\u3068\u306b\u5916\u5074\u3078\u30d1\u30eb\u30b9\u3092\u653e\u3064\u3002" },
        sunbeam810: { name: "810\u30b5\u30f3\u30d3\u30fc\u30e0", desc: "\u4e00\u76f4\u7dda\u3092\u8cab\u304f\u30d3\u30fc\u30e0\u3092\u767a\u5c04\u3002" },
        pierceSandal: { name: "\u8cab\u901a\u30b5\u30f3\u30c0\u30eb", desc: "\u5f3e\u304c {amount} \u4f53\u8cab\u901a\u3059\u308b\u3002" },
        yarimasuNee: { name: "\u3084\u308a\u307e\u3059\u306d\u3047", desc: "\u8ffd\u52a0\u5c04\u6483\u3068\u30af\u30ea\u30c6\u30a3\u30ab\u30eb\u30d0\u30fc\u30b9\u30c8\u304c\u5f37\u5316\u3002" },
        afterimageStep: { name: "\u6b8b\u50cf\u30b9\u30c6\u30c3\u30d7", desc: "\u6b69\u304f\u3068\u80cc\u5f8c\u306b\u6b8b\u50cf\u304c\u6b8b\u308a\u3001\u5f8c\u65b9\u3078\u7834\u88c2\u5f3e\u3092\u653e\u3064\u3002" },
        saltGuard: { name: "\u5869\u30ac\u30fc\u30c9", desc: "\u88ab\u5f3e\u6642\u306b\u5468\u56f2\u3078\u8861\u6483\u30ea\u30f3\u30b0\u3092\u653e\u3064\u3002" },
        lucky810: { name: "\u30e9\u30c3\u30ad\u30fc810", desc: "XP\u5897\u52a0\u3002\u8ffd\u52a0\u30c9\u30ed\u30c3\u30d7\u306e\u767a\u751f\u7387\u3082\u4e0a\u304c\u308b\u3002" },
        droneBuddy: { name: "\u30d0\u30c7\u30a3\u30c9\u30ed\u30fc\u30f3", desc: "\u5074\u885b\u30c9\u30ed\u30fc\u30f3\u304c\u6700\u3082\u8fd1\u3044\u6575\u3078\u81ea\u52d5\u5c04\u6483\u3002" },
        backstepVolley: { name: "\u30d0\u30c3\u30af\u30b9\u30c6\u30c3\u30d7\u5f3e\u5e55", desc: "\u901a\u5e38\u653b\u6483\u3068\u540c\u6642\u306b\u80cc\u5f8c\u3078\u3082\u5c04\u6483\u3002" },
        heatSink: { name: "\u30d2\u30fc\u30c8\u30b7\u30f3\u30af", desc: "\u5f3e\u901f\u304c\u4e0a\u304c\u308a\u3001\u7279\u6b8a\u653b\u6483\u306e\u518d\u4f7f\u7528\u3082\u901f\u304f\u306a\u308b\u3002" }
      },
      pickups: {
        xp: "XP\u7d50\u6676",
        heal: "\u51b7\u3048\u305f\u9ea6\u8336",
        magnet: "\u7d4c\u9a13\u5024\u5168\u56de\u53ce",
        chest: "\u5b9d\u7bb1",
        item114514: "114514\u30a2\u30a4\u30c6\u30e0",
        yarimasuItem: "\u3084\u308a\u307e\u3059\u306d\u3047\u30a2\u30a4\u30c6\u30e0",
        iizoItem: "\u3044\u3044\u30be\uff5e\u3053\u308c\u30a2\u30a4\u30c6\u30e0",
        ikuikuItem: "\u3044\u304d\u307e\u3059\u3088\u30fc\u3044\u304f\u3044\u304f\u30a2\u30a4\u30c6\u30e0",
        loveItem: "\u304a\u524d\u306e\u3053\u3068\u304c\u597d\u304d\u3060\u3063\u305f\u3093\u3060\u3088\u30a2\u30a4\u30c6\u30e0"
      }
    }
  };

  function resolveLocale(locale) {
    return String(locale || "").toLowerCase().indexOf("ja") === 0 ? "ja" : "en";
  }

  function detectLocale() {
    var language = (window.navigator && (window.navigator.language || window.navigator.userLanguage)) || "en";
    return resolveLocale(language);
  }

  function interpolate(template, vars) {
    var values = vars || {};
    return String(template).replace(/\{(\w+)\}/g, function (_, key) {
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : "";
    });
  }

  function lookup(locale, key) {
    var current = DICTIONARIES[locale] || DICTIONARIES.en;
    var parts = key.split(".");
    var i;
    for (i = 0; i < parts.length; i += 1) {
      if (!current || !Object.prototype.hasOwnProperty.call(current, parts[i])) {
        return null;
      }
      current = current[parts[i]];
    }
    return current;
  }

  ns.Localizer = {
    resolveLocale: resolveLocale,
    detectLocale: detectLocale,
    t: function (locale, key, vars) {
      var safeLocale = resolveLocale(locale);
      var value = lookup(safeLocale, key);
      if (value == null) {
        value = lookup("en", key);
      }
      if (typeof value === "string") {
        return interpolate(value, vars);
      }
      return value != null ? value : key;
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
