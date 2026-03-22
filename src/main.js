(function (ns) {
  window.addEventListener("DOMContentLoaded", function () {
    var canvas = document.getElementById("gameCanvas");
    if (!canvas) {
      return;
    }
    if (ns.applyViewportProfile) {
      ns.applyViewportProfile(canvas);
    }
    if (ns.Monetization && ns.Monetization.init) {
      ns.Monetization.init();
    }
    var game = new ns.Game(canvas);
    game.start();
  });
})(window.ManatsuRPG = window.ManatsuRPG || {});
