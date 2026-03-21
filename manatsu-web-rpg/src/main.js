(function (ns) {
  window.addEventListener("DOMContentLoaded", function () {
    var canvas = document.getElementById("gameCanvas");
    if (!canvas) {
      return;
    }
    var game = new ns.Game(canvas);
    game.start();
  });
})(window.ManatsuRPG = window.ManatsuRPG || {});
