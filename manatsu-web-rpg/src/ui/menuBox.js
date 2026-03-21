(function (ns) {
  ns.MenuBox = class {
    constructor(options) {
      var opts = options || {};
      this.items = opts.items || [];
      this.orientation = opts.orientation || "vertical";
      this.x = opts.x || 60;
      this.y = opts.y || 60;
      this.width = opts.width || 240;
      this.height = opts.height || 180;
      this.selectedIndex = 0;
      this.cancelable = opts.cancelable !== false;
    }

    setItems(items) {
      this.items = items || [];
      this.selectedIndex = Math.max(0, Math.min(this.selectedIndex, this.items.length - 1));
      this.moveToEnabled(0);
    }

    move(delta) {
      if (!this.items.length) {
        return;
      }

      var next = this.selectedIndex;
      var tries = 0;
      do {
        next = (next + delta + this.items.length) % this.items.length;
        tries += 1;
      } while (this.items[next].disabled && tries <= this.items.length);

      this.selectedIndex = next;
    }

    moveToEnabled(startIndex) {
      if (!this.items.length) {
        return;
      }
      this.selectedIndex = Math.max(0, Math.min(startIndex, this.items.length - 1));
      if (this.items[this.selectedIndex] && !this.items[this.selectedIndex].disabled) {
        return;
      }
      this.move(1);
    }

    getSelected() {
      return this.items[this.selectedIndex];
    }

    getItemRect(index) {
      var px = this.x + 24;
      var py = this.y + 52 + index * 28;
      var width = this.width - 48;
      var height = 24;

      if (this.orientation === "horizontal") {
        px = this.x + 24 + index * 112;
        py = this.y + 36;
        width = 96;
      }

      return {
        x: px - 20,
        y: py - 4,
        width: width,
        height: height
      };
    }

    findItemIndexAt(x, y) {
      var i;
      for (i = 0; i < this.items.length; i += 1) {
        var rect = this.getItemRect(i);
        if (
          x >= rect.x &&
          y >= rect.y &&
          x <= rect.x + rect.width &&
          y <= rect.y + rect.height
        ) {
          return i;
        }
      }
      return -1;
    }

    update(input, pointer) {
      if (!this.items.length) {
        return { type: "none" };
      }

      if (pointer && pointer.inside) {
        var hoveredIndex = this.findItemIndexAt(pointer.x, pointer.y);
        if (hoveredIndex >= 0 && !this.items[hoveredIndex].disabled) {
          this.selectedIndex = hoveredIndex;
          if (pointer.pressed) {
            return {
              type: "select",
              item: this.items[this.selectedIndex],
              index: this.selectedIndex
            };
          }
        }
      }

      if (this.orientation === "vertical") {
        if (input.wasPressed("up")) {
          this.move(-1);
        }
        if (input.wasPressed("down")) {
          this.move(1);
        }
      } else {
        if (input.wasPressed("left")) {
          this.move(-1);
        }
        if (input.wasPressed("right")) {
          this.move(1);
        }
      }

      if (input.wasPressed("confirm")) {
        var selected = this.getSelected();
        if (selected && !selected.disabled) {
          return { type: "select", item: selected, index: this.selectedIndex };
        }
      }

      if (this.cancelable && input.wasPressed("cancel")) {
        return { type: "cancel" };
      }

      return { type: "none" };
    }

    draw(renderer, title) {
      renderer.drawPanel(this.x, this.y, this.width, this.height, {
        fill: "rgba(15, 15, 15, 0.9)",
        border: ns.constants.COLORS.border
      });

      if (title) {
        renderer.drawText(title, this.x + 18, this.y + 14, {
          size: 18,
          color: ns.constants.COLORS.accent
        });
      }

      var i;
      for (i = 0; i < this.items.length; i += 1) {
        var item = this.items[i];
        var isSelected = i === this.selectedIndex;
        var label = item.label || String(item);
        var color = item.disabled
          ? "#776f5f"
          : isSelected
            ? ns.constants.COLORS.accent
            : ns.constants.COLORS.text;

        var px = this.x + 24;
        var py = this.y + 52 + i * 28;

        if (this.orientation === "horizontal") {
          px = this.x + 24 + i * 112;
          py = this.y + 36;
        }

        if (isSelected) {
          var rect = this.getItemRect(i);
          renderer.drawPanel(rect.x, rect.y, rect.width, rect.height, {
            fill: "rgba(246, 196, 83, 0.14)",
            border: "rgba(246, 196, 83, 0.45)"
          });
          renderer.drawText(">", px - 18, py, {
            size: 20,
            color: ns.constants.COLORS.accent
          });
        }

        renderer.drawText(label, px, py, {
          size: 20,
          color: color
        });
      }
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
