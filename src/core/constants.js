(function (ns) {
  var DEFAULT_VIEWPORT = {
    width: 960,
    height: 720,
    battleBox: { x: 228, y: 392, w: 504, h: 176 },
    mobilePortrait: false
  };

  var MOBILE_PORTRAIT_VIEWPORT = {
    width: 540,
    height: 960,
    battleBox: { x: 54, y: 666, w: 432, h: 204 },
    mobilePortrait: true
  };

  function applyViewport(constants, viewport) {
    var target = viewport || DEFAULT_VIEWPORT;
    constants.GAME_WIDTH = target.width;
    constants.GAME_HEIGHT = target.height;
    constants.BATTLE_BOX = {
      x: target.battleBox.x,
      y: target.battleBox.y,
      w: target.battleBox.w,
      h: target.battleBox.h
    };
    constants.IS_MOBILE_PORTRAIT = !!target.mobilePortrait;
  }

  ns.constants = {
    GAME_WIDTH: 960,
    GAME_HEIGHT: 720,
    TARGET_FPS: 60,
    FONT_FAMILY: "\"Yu Gothic UI\", \"Meiryo\", monospace",
    COLORS: {
      bg: "#0b0b0b",
      panel: "#111111",
      panelSoft: "#1b1b1b",
      border: "#f6c453",
      text: "#f4f0da",
      muted: "#d1c6a3",
      accent: "#ff9c4b",
      accentAlt: "#74d6ff",
      danger: "#ff6b6b",
      mercy: "#88f291",
      soul: "#ff4f7c",
      white: "#ffffff",
      black: "#000000"
    },
    ACTIONS: {
      up: ["ArrowUp", "KeyW"],
      down: ["ArrowDown", "KeyS"],
      left: ["ArrowLeft", "KeyA"],
      right: ["ArrowRight", "KeyD"],
      confirm: ["KeyZ", "Enter"],
      cancel: ["KeyX", "ShiftLeft", "ShiftRight"],
      menu: ["KeyC", "ControlLeft", "ControlRight"]
    },
    PLAYER_SIZE: 42,
    PLAYER_SPEED: 220,
    HEART_SPEED: 260,
    BATTLE_BOX: { x: 228, y: 392, w: 504, h: 176 },
    STORAGE_KEY: "manatsu-web-rpg-save-v1",
    MAX_HP: 24,
    IS_MOBILE_PORTRAIT: false
  };

  ns.getViewportProfile = function () {
    var coarsePointer = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    var portrait = (window.innerHeight || 0) >= (window.innerWidth || 0);
    var narrowScreen = Math.min(window.innerWidth || 0, window.innerHeight || 0) <= 720;
    if (coarsePointer && portrait && narrowScreen) {
      return MOBILE_PORTRAIT_VIEWPORT;
    }
    return DEFAULT_VIEWPORT;
  };

  ns.applyViewportProfile = function (canvas) {
    var profile = ns.getViewportProfile();
    applyViewport(ns.constants, profile);
    if (canvas) {
      canvas.width = profile.width;
      canvas.height = profile.height;
    }
    if (document && document.body) {
      document.body.classList.toggle("mobile-portrait-game", !!profile.mobilePortrait);
    }
    return profile;
  };

  applyViewport(ns.constants, DEFAULT_VIEWPORT);
})(window.ManatsuRPG = window.ManatsuRPG || {});
