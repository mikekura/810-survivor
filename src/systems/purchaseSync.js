(function (ns) {
  function trimTrailingSlash(value) {
    return String(value || "").replace(/\/+$/, "");
  }

  function fallbackId() {
    return "player_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  ns.PurchaseSync = {
    createPlayerId: function () {
      if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
      }
      return fallbackId();
    },

    ensurePlayerId: function (state) {
      var target = state || ns.createDefaultState();
      if (!target.survivor) {
        target.survivor = {};
      }
      if (!target.survivor.playerId) {
        target.survivor.playerId = this.createPlayerId();
      }
      return target.survivor.playerId;
    },

    mergeOwnedSkins: function (state, skinIds) {
      var target = state || ns.createDefaultState();
      var survivor = target.survivor || (target.survivor = {});
      var merged = Array.isArray(survivor.ownedSkins) ? survivor.ownedSkins.slice() : [];
      var incoming = Array.isArray(skinIds) ? skinIds : [];
      var changed = false;
      var i;

      if (merged.indexOf("classicSenpai") < 0) {
        merged.unshift("classicSenpai");
        changed = true;
      }

      for (i = 0; i < incoming.length; i += 1) {
        if (typeof incoming[i] !== "string" || !incoming[i]) {
          continue;
        }
        if (merged.indexOf(incoming[i]) >= 0) {
          continue;
        }
        merged.push(incoming[i]);
        changed = true;
      }

      survivor.ownedSkins = merged;
      target.survivor = survivor;
      return changed;
    },

    getServerBaseUrl: function (commerceConfig) {
      var config = commerceConfig || {};
      return trimTrailingSlash(config.baseUrl || "");
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
