(function (ns) {
  function defaultLocale() {
    var language = (window.navigator && (window.navigator.language || window.navigator.userLanguage)) || "en";
    return String(language).toLowerCase().indexOf("ja") === 0 ? "ja" : "en";
  }

  ns.createDefaultState = function () {
    return {
      locale: defaultLocale(),
      survivor: {
        totalRuns: 0,
        bestTimeSec: 0,
        bestLevel: 1,
        bestKills: 0,
        lastStageId: "stationFront",
        lastRank: 0,
        unlockedRank: 0,
        selectedSkin: "poolMonitor",
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
    normalized.survivor.selectedSkin = typeof normalized.survivor.selectedSkin === "string" && normalized.survivor.selectedSkin
      ? normalized.survivor.selectedSkin
      : defaults.survivor.selectedSkin;
    normalized.survivor.discoveredSpecialItems = Array.isArray(normalized.survivor.discoveredSpecialItems)
      ? normalized.survivor.discoveredSpecialItems.slice()
      : [];
    normalized.survivor.discoveredRecipes = Array.isArray(normalized.survivor.discoveredRecipes)
      ? normalized.survivor.discoveredRecipes.slice()
      : [];
    normalized.totalPlayTime = typeof normalized.totalPlayTime === "number" ? normalized.totalPlayTime : 0;
    return normalized;
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
