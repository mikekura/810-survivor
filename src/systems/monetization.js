(function (ns) {
  ns.MonetizationSystem = class {
    constructor(state) {
      this.state = state;
      this.lastMessage = "支援は任意です。本編は最後までそのまま遊べます。";
    }

    getCatalog() {
      return ns.supportCatalog.slice();
    }

    isUnlocked(id) {
      return !!this.state.supportUnlocks[id];
    }

    unlock(id) {
      this.state.supportUnlocks[id] = true;
    }

    purchase(id) {
      var item = this.getCatalog().find(function (entry) {
        return entry.id === id;
      });

      if (!item) {
        this.lastMessage = "支援項目が見つかりません。";
        return this.lastMessage;
      }

      if (this.isUnlocked(id)) {
        this.lastMessage = item.name + " は既に解放済みです。";
        return this.lastMessage;
      }

      this.unlock(id);
      this.lastMessage = item.name + " を解放しました。公開時はここを投稿サイトの決済導線に差し替えてください。";
      return this.lastMessage;
    }

    getAccentColor() {
      return this.isUnlocked("palette-pack") ? "#74d6ff" : ns.constants.COLORS.accent;
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
