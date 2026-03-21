(function (ns) {
  ns.SceneManager = class {
    constructor(game) {
      this.game = game;
      this.current = null;
    }

    change(scene) {
      this.current = scene;
    }

    update(dt, input) {
      if (this.current && this.current.update) {
        this.current.update(dt, input);
      }
    }

    draw(renderer) {
      if (this.current && this.current.draw) {
        this.current.draw(renderer);
      }
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
