(function (ns) {
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
    MAX_HP: 24
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
