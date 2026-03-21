(function (ns) {
  ns.InputManager = class {
    constructor(canvas) {
      this.canvas = canvas;
      this.down = new Set();
      this.pressed = new Set();
      this.released = new Set();
      this.pointer = {
        x: 0,
        y: 0,
        inside: false,
        pressed: false,
        down: false,
        released: false,
        type: "mouse",
        pointerId: null,
        startX: 0,
        startY: 0
      };

      if (this.canvas) {
        this.canvas.style.touchAction = "none";
      }

      window.addEventListener("keydown", (event) => {
        if (!this.down.has(event.code)) {
          this.pressed.add(event.code);
        }
        this.down.add(event.code);

        if (this.isTracked(event.code)) {
          event.preventDefault();
        }
      });

      window.addEventListener("keyup", (event) => {
        this.down.delete(event.code);
        this.released.add(event.code);

        if (this.isTracked(event.code)) {
          event.preventDefault();
        }
      });

      if (this.canvas) {
        this.canvas.addEventListener("pointermove", (event) => {
          this.updatePointerPosition(event);
        });

        this.canvas.addEventListener("pointerdown", (event) => {
          this.updatePointerPosition(event);
          this.pointer.type = event.pointerType || "mouse";
          this.pointer.pointerId = event.pointerId;
          this.pointer.startX = this.pointer.x;
          this.pointer.startY = this.pointer.y;
          this.pointer.down = true;
          this.pointer.pressed = true;
          this.pointer.released = false;
          if (this.canvas.setPointerCapture) {
            try {
              this.canvas.setPointerCapture(event.pointerId);
            } catch (error) {
              // Ignore pointer capture failures.
            }
          }
          event.preventDefault();
        });

        this.canvas.addEventListener("pointerup", (event) => {
          this.releasePointer(event);
        });

        this.canvas.addEventListener("pointercancel", (event) => {
          this.releasePointer(event);
        });

        this.canvas.addEventListener("pointerleave", (event) => {
          this.updatePointerPosition(event);
          if (!this.pointer.down && this.pointer.type === "mouse") {
            this.pointer.inside = false;
          }
        });
      }

      window.addEventListener("blur", () => {
        this.down.clear();
        this.pressed.clear();
        this.released.clear();
        this.pointer.down = false;
        this.pointer.pressed = false;
        this.pointer.released = false;
      });
    }

    updatePointerPosition(event) {
      if (!this.canvas) {
        return;
      }
      var rect = this.canvas.getBoundingClientRect();
      var scaleX = this.canvas.width / rect.width;
      var scaleY = this.canvas.height / rect.height;
      this.pointer.x = (event.clientX - rect.left) * scaleX;
      this.pointer.y = (event.clientY - rect.top) * scaleY;
      this.pointer.inside = (
        this.pointer.x >= 0 &&
        this.pointer.y >= 0 &&
        this.pointer.x <= this.canvas.width &&
        this.pointer.y <= this.canvas.height
      );
    }

    releasePointer(event) {
      this.updatePointerPosition(event);
      if (this.canvas && this.canvas.releasePointerCapture) {
        try {
          this.canvas.releasePointerCapture(event.pointerId);
        } catch (error) {
          // Ignore release failures.
        }
      }
      this.pointer.down = false;
      this.pointer.released = true;
      this.pointer.pointerId = null;
      event.preventDefault();
    }

    isTracked(code) {
      var actions = ns.constants.ACTIONS;
      return Object.keys(actions).some(function (key) {
        return actions[key].indexOf(code) >= 0;
      });
    }

    isDown(action) {
      return ns.constants.ACTIONS[action].some((code) => this.down.has(code));
    }

    wasPressed(action) {
      return ns.constants.ACTIONS[action].some((code) => this.pressed.has(code));
    }

    wasPointerPressed() {
      return this.pointer.pressed;
    }

    getPointer() {
      return {
        x: this.pointer.x,
        y: this.pointer.y,
        inside: this.pointer.inside,
        pressed: this.pointer.pressed,
        down: this.pointer.down,
        released: this.pointer.released,
        type: this.pointer.type,
        pointerId: this.pointer.pointerId,
        startX: this.pointer.startX,
        startY: this.pointer.startY,
        deltaX: this.pointer.x - this.pointer.startX,
        deltaY: this.pointer.y - this.pointer.startY
      };
    }

    clearFrameState() {
      this.pressed.clear();
      this.released.clear();
      this.pointer.pressed = false;
      this.pointer.released = false;
    }

    getAxis() {
      var x = 0;
      var y = 0;
      if (this.isDown("left")) {
        x -= 1;
      }
      if (this.isDown("right")) {
        x += 1;
      }
      if (this.isDown("up")) {
        y -= 1;
      }
      if (this.isDown("down")) {
        y += 1;
      }
      return { x: x, y: y };
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
