(function (ns) {
  ns.AssetSystem = class {
    constructor() {
      this.images = {};
    }

    loadImage(id, src) {
      var image = new Image();
      image.decoding = "async";
      image.src = src;
      this.images[id] = image;
      return image;
    }

    loadDefaults() {
      this.loadImage("senpaiStanding", "./assets/portraits/senpai-standing.svg");
    }

    getImage(id) {
      return this.images[id] || null;
    }

    isReady(id) {
      var image = this.getImage(id);
      return !!(image && image.complete && image.naturalWidth > 0);
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
