(function (ns) {
  function defaultLocale() {
    var language = (window.navigator && (window.navigator.language || window.navigator.userLanguage)) || "en";
    return String(language).toLowerCase().indexOf("ja") === 0 ? "ja" : "en";
  }

  ns.createDefaultState = function () {
      return {
        locale: defaultLocale(),
        survivor: {
          playerId: "",
          totalRuns: 0,
          bestTimeSec: 0,
          bestScore: 0,
          bestEndlessScore: 0,
          bestEndlessTimeSec: 0,
          bestLevel: 1,
          bestKills: 0,
          lastStageId: "stationFront",
          lastRank: 0,
          lastMode: "normal",
          lastBotRelayIndex: 0,
          unlockedRank: 0,
          selectedSkin: "classicSenpai",
          ownedSkins: ["classicSenpai"],
          discoveredSpecialItems: [],
          discoveredRecipes: []
        },
        totalPlayTime: 0
      };
  };

  ns.cloneState = function (value) {
    return JSON.parse(JSON.stringify(value));
  };

  ns.normalizeState = function (state) {
    var defaults = ns.createDefaultState();
    var normalized = Object.assign({}, defaults, state || {});
    normalized.locale = normalized.locale === "ja" ? "ja" : "en";
    normalized.survivor = Object.assign({}, defaults.survivor, normalized.survivor || {});
    normalized.survivor.playerId = typeof normalized.survivor.playerId === "string"
      ? normalized.survivor.playerId
      : defaults.survivor.playerId;
    normalized.survivor.ownedSkins = Array.isArray(normalized.survivor.ownedSkins)
      ? normalized.survivor.ownedSkins
        .filter(function (id, index, list) {
          return typeof id === "string" && id && list.indexOf(id) === index;
        })
      : defaults.survivor.ownedSkins.slice();
    if (normalized.survivor.ownedSkins.indexOf("classicSenpai") < 0) {
      normalized.survivor.ownedSkins.unshift("classicSenpai");
    }
    normalized.survivor.selectedSkin = typeof normalized.survivor.selectedSkin === "string" && normalized.survivor.selectedSkin
      ? normalized.survivor.selectedSkin
      : defaults.survivor.selectedSkin;
    if (normalized.survivor.ownedSkins.indexOf(normalized.survivor.selectedSkin) < 0) {
      normalized.survivor.selectedSkin = normalized.survivor.ownedSkins[0] || defaults.survivor.selectedSkin;
    }
    normalized.survivor.discoveredSpecialItems = Array.isArray(normalized.survivor.discoveredSpecialItems)
      ? normalized.survivor.discoveredSpecialItems.slice()
      : [];
    normalized.survivor.discoveredRecipes = Array.isArray(normalized.survivor.discoveredRecipes)
      ? normalized.survivor.discoveredRecipes.slice()
      : [];
    normalized.survivor.bestTimeSec = typeof normalized.survivor.bestTimeSec === "number" ? normalized.survivor.bestTimeSec : 0;
    normalized.survivor.bestScore = typeof normalized.survivor.bestScore === "number" ? normalized.survivor.bestScore : 0;
    normalized.survivor.bestEndlessScore = typeof normalized.survivor.bestEndlessScore === "number" ? normalized.survivor.bestEndlessScore : 0;
    normalized.survivor.bestEndlessTimeSec = typeof normalized.survivor.bestEndlessTimeSec === "number" ? normalized.survivor.bestEndlessTimeSec : 0;
    normalized.survivor.bestLevel = typeof normalized.survivor.bestLevel === "number" ? normalized.survivor.bestLevel : 1;
    normalized.survivor.bestKills = typeof normalized.survivor.bestKills === "number" ? normalized.survivor.bestKills : 0;
    normalized.survivor.totalRuns = typeof normalized.survivor.totalRuns === "number" ? normalized.survivor.totalRuns : 0;
    normalized.survivor.lastRank = typeof normalized.survivor.lastRank === "number" ? normalized.survivor.lastRank : 0;
    normalized.survivor.lastBotRelayIndex = typeof normalized.survivor.lastBotRelayIndex === "number" ? normalized.survivor.lastBotRelayIndex : 0;
    normalized.survivor.unlockedRank = typeof normalized.survivor.unlockedRank === "number" ? normalized.survivor.unlockedRank : 0;
    normalized.survivor.lastMode = normalized.survivor.lastMode === "infinity" || normalized.survivor.lastMode === "bot"
      ? normalized.survivor.lastMode
      : "normal";
    normalized.totalPlayTime = typeof normalized.totalPlayTime === "number" ? normalized.totalPlayTime : 0;
    return normalized;
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
