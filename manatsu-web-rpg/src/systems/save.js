(function (ns) {
  ns.SaveSystem = {
    load: function () {
      try {
        var raw = window.localStorage.getItem(ns.constants.STORAGE_KEY);
        if (!raw) {
          return ns.createDefaultState();
        }
        return ns.normalizeState(JSON.parse(raw));
      } catch (error) {
        console.warn("save load failed", error);
        return ns.createDefaultState();
      }
    },

    save: function (state) {
      try {
        window.localStorage.setItem(ns.constants.STORAGE_KEY, JSON.stringify(ns.normalizeState(state)));
      } catch (error) {
        console.warn("save failed", error);
      }
    },

    clear: function () {
      try {
        window.localStorage.removeItem(ns.constants.STORAGE_KEY);
      } catch (error) {
        console.warn("save clear failed", error);
      }
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
