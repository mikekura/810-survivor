(function (ns) {
  var MAX_PARTICLES = 420;
  var MAX_RINGS = 80;
  var MAX_TEXTS = 48;
  var MAX_FLASHES = 8;
  var MAX_STREAKS = 140;
  var MAX_ECHOS = 40;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function pushCapped(list, item, max) {
    if (list.length >= max) {
      list.shift();
    }
    list.push(item);
  }

  ns.SurvivorEffects = class {
    constructor() {
      this.particles = [];
      this.rings = [];
      this.texts = [];
      this.flashes = [];
      this.streaks = [];
      this.echoes = [];
      this.shakePower = 0;
      this.shakeTime = 0;
      this.shakeDuration = 0;
    }

    reset() {
      this.particles = [];
      this.rings = [];
      this.texts = [];
      this.flashes = [];
      this.streaks = [];
      this.echoes = [];
      this.shakePower = 0;
      this.shakeTime = 0;
      this.shakeDuration = 0;
    }

    triggerShake(power, duration) {
      this.shakePower = Math.max(this.shakePower, power || 0);
      this.shakeDuration = Math.max(this.shakeDuration, duration || 0);
      this.shakeTime = this.shakeDuration;
    }

    getShakeOffset() {
      if (this.shakeTime <= 0 || this.shakeDuration <= 0 || this.shakePower <= 0) {
        return { x: 0, y: 0 };
      }
      var strength = (this.shakeTime / this.shakeDuration) * this.shakePower;
      return {
        x: randomRange(-strength, strength),
        y: randomRange(-strength, strength)
      };
    }

    spawnParticleBurst(x, y, options) {
      var opts = options || {};
      var count = opts.count || 10;
      var i;
      for (i = 0; i < count; i += 1) {
        var angle = randomRange(0, Math.PI * 2);
        var speed = randomRange(opts.speedMin || 30, opts.speedMax || 120);
        pushCapped(this.particles, {
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: opts.life || 0.45,
          maxLife: opts.life || 0.45,
          sizeStart: opts.sizeStart || 6,
          sizeEnd: opts.sizeEnd || 1,
          color: opts.color || "#ffb347",
          shape: opts.shape || "diamond",
          screenSpace: !!opts.screenSpace,
          gravity: opts.gravity || 0,
          drag: opts.drag || 0.94
        }, MAX_PARTICLES);
      }
    }

    spawnRing(x, y, options) {
      var opts = options || {};
      pushCapped(this.rings, {
        x: x,
        y: y,
        radius: opts.radius || 8,
        growth: opts.growth || 140,
        lineWidth: opts.lineWidth || 4,
        life: opts.life || 0.35,
        maxLife: opts.life || 0.35,
        color: opts.color || "#ffffff",
        fillAlpha: opts.fillAlpha || 0,
        screenSpace: !!opts.screenSpace
      }, MAX_RINGS);
    }

    spawnFloatingText(text, x, y, options) {
      var opts = options || {};
      pushCapped(this.texts, {
        text: text,
        x: x,
        y: y,
        vx: opts.vx || 0,
        vy: opts.vy || -28,
        life: opts.life || 0.8,
        maxLife: opts.life || 0.8,
        color: opts.color || "#f4f0da",
        size: opts.size || 18,
        screenSpace: !!opts.screenSpace
      }, MAX_TEXTS);
    }

    spawnStreak(x, y, vx, vy, options) {
      var opts = options || {};
      pushCapped(this.streaks, {
        x: x,
        y: y,
        vx: vx || 0,
        vy: vy || 0,
        life: opts.life || 0.18,
        maxLife: opts.life || 0.18,
        color: opts.color || "#ffffff",
        width: opts.width || 3,
        length: opts.length || 18,
        screenSpace: !!opts.screenSpace,
        drag: typeof opts.drag === "number" ? opts.drag : 0.92
      }, MAX_STREAKS);
    }

    spawnRadialStreakBurst(x, y, options) {
      var opts = options || {};
      var count = opts.count || 6;
      var i;
      for (i = 0; i < count; i += 1) {
        var angle = randomRange(0, Math.PI * 2);
        var speed = randomRange(opts.speedMin || 50, opts.speedMax || 120);
        this.spawnStreak(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
          life: opts.life || 0.2,
          color: opts.color || "#ffffff",
          width: opts.width || 2,
          length: opts.length || 20,
          drag: typeof opts.drag === "number" ? opts.drag : 0.88,
          screenSpace: !!opts.screenSpace
        });
      }
    }

    spawnEcho(x, y, options) {
      var opts = options || {};
      pushCapped(this.echoes, {
        x: x,
        y: y,
        vx: opts.vx || 0,
        vy: opts.vy || 0,
        width: opts.width || 18,
        height: opts.height || 10,
        life: opts.life || 0.2,
        maxLife: opts.life || 0.2,
        color: opts.color || "#ffffff",
        outlineColor: opts.outlineColor || "",
        rotation: opts.rotation || 0,
        shape: opts.shape || "box",
        screenSpace: !!opts.screenSpace,
        drag: typeof opts.drag === "number" ? opts.drag : 0.9
      }, MAX_ECHOS);
    }

    flashScreen(color, alpha, duration) {
      pushCapped(this.flashes, {
        color: color || "#ffffff",
        alpha: typeof alpha === "number" ? alpha : 0.14,
        life: duration || 0.18,
        maxLife: duration || 0.18
      }, MAX_FLASHES);
    }

    spawnHit(x, y, options) {
      var opts = options || {};
      this.spawnParticleBurst(x, y, {
        count: opts.count || 8,
        color: opts.color || "#ff8a70",
        speedMin: 40,
        speedMax: 150,
        life: 0.34,
        sizeStart: 5,
        sizeEnd: 1,
        shape: "diamond"
      });
      this.spawnRing(x, y, {
        color: opts.ringColor || "#ffd39f",
        radius: opts.radius || 6,
        growth: opts.growth || 120,
        lineWidth: 3,
        life: 0.22
      });
    }

    spawnEnemyDeath(enemy) {
      var x = enemy.x;
      var y = enemy.y;
      var color = enemy.category === "boss"
        ? "#f6c453"
        : enemy.category === "elite"
          ? "#ff9c4b"
          : "#ffb347";
      this.spawnParticleBurst(x, y, {
        count: enemy.category === "boss" ? 24 : enemy.category === "elite" ? 16 : 10,
        color: color,
        speedMin: 48,
        speedMax: enemy.category === "boss" ? 220 : 160,
        life: enemy.category === "boss" ? 0.72 : 0.42,
        sizeStart: enemy.category === "boss" ? 9 : 6,
        shape: enemy.category === "boss" ? "circle" : "diamond"
      });
      this.spawnRing(x, y, {
        color: color,
        radius: enemy.category === "boss" ? 18 : 10,
        growth: enemy.category === "boss" ? 220 : 140,
        lineWidth: enemy.category === "boss" ? 6 : 4,
        life: enemy.category === "boss" ? 0.48 : 0.28
      });
      this.spawnRadialStreakBurst(x, y, {
        count: enemy.category === "boss" ? 14 : enemy.category === "elite" ? 9 : 5,
        color: color,
        speedMin: enemy.category === "boss" ? 80 : 50,
        speedMax: enemy.category === "boss" ? 180 : 110,
        width: enemy.category === "boss" ? 4 : 2,
        length: enemy.category === "boss" ? 30 : 18,
        life: enemy.category === "boss" ? 0.28 : 0.18
      });
      this.spawnEcho(x, y, {
        width: enemy.category === "boss" ? 40 : 20,
        height: enemy.category === "boss" ? 40 : 20,
        life: enemy.category === "boss" ? 0.24 : 0.16,
        color: color,
        outlineColor: "#fff1c4",
        shape: "orb"
      });
      if (enemy.category === "boss") {
        this.flashScreen("#fff1c4", 0.18, 0.24);
        this.triggerShake(9, 0.26);
      } else if (enemy.category === "elite") {
        this.triggerShake(4, 0.18);
      }
    }

    spawnLevelUp(x, y, label) {
      this.spawnParticleBurst(x, y, {
        count: 18,
        color: "#9ee4ff",
        speedMin: 60,
        speedMax: 190,
        life: 0.56,
        sizeStart: 7,
        shape: "diamond"
      });
      this.spawnRing(x, y, {
        color: "#9ee4ff",
        radius: 14,
        growth: 180,
        lineWidth: 5,
        life: 0.46
      });
      this.spawnRadialStreakBurst(x, y, {
        count: 10,
        color: "#dff6ff",
        speedMin: 70,
        speedMax: 150,
        width: 3,
        length: 24,
        life: 0.24
      });
      this.spawnEcho(x, y, {
        width: 28,
        height: 28,
        life: 0.2,
        color: "#9ee4ff",
        outlineColor: "#ffffff",
        shape: "orb"
      });
      this.spawnFloatingText(label || "LEVEL UP", x, y - 22, {
        color: "#9ee4ff",
        size: 20,
        vy: -36,
        life: 1
      });
      this.flashScreen("#74d6ff", 0.1, 0.16);
    }

    spawnChestOpen(x, y) {
      this.spawnParticleBurst(x, y, {
        count: 22,
        color: "#f6c453",
        speedMin: 70,
        speedMax: 220,
        life: 0.62,
        sizeStart: 8,
        shape: "circle"
      });
      this.spawnRing(x, y, {
        color: "#f6c453",
        radius: 16,
        growth: 220,
        lineWidth: 6,
        life: 0.42
      });
      this.spawnRadialStreakBurst(x, y, {
        count: 12,
        color: "#fff1c4",
        speedMin: 84,
        speedMax: 180,
        width: 3,
        length: 28,
        life: 0.28
      });
      this.spawnEcho(x, y, {
        width: 34,
        height: 34,
        life: 0.22,
        color: "#f6c453",
        outlineColor: "#fff1c4",
        shape: "orb"
      });
      this.flashScreen("#fff1c4", 0.12, 0.14);
      this.triggerShake(6, 0.2);
    }

    spawnPickupTrail(fromX, fromY, toX, toY, color) {
      var i;
      for (i = 0; i < 6; i += 1) {
        var t = i / 5;
        pushCapped(this.particles, {
          x: fromX + (toX - fromX) * t,
          y: fromY + (toY - fromY) * t,
          vx: randomRange(-8, 8),
          vy: randomRange(-8, 8),
          life: 0.24,
          maxLife: 0.24,
          sizeStart: 4,
          sizeEnd: 1,
          color: color || "#88f291",
          shape: "diamond",
          gravity: 0,
          drag: 0.9
        }, MAX_PARTICLES);
      }
    }

    spawnBossWarning(text) {
      this.spawnFloatingText(text || "BOSS", ns.constants.GAME_WIDTH / 2, 90, {
        color: "#ff9c4b",
        size: 28,
        vy: -8,
        life: 1.3,
        screenSpace: true
      });
      this.flashScreen("#ff9c4b", 0.1, 0.18);
      this.triggerShake(8, 0.24);
    }

    spawnHeatRipple(x, y, color) {
      this.spawnRing(x, y, {
        color: color || "#ffb347",
        radius: 10,
        growth: 90,
        lineWidth: 2,
        life: 0.3,
        fillAlpha: 0.05
      });
    }

    update(dt) {
      var i;

      if (this.shakeTime > 0) {
        this.shakeTime = Math.max(0, this.shakeTime - dt);
      }

      for (i = this.particles.length - 1; i >= 0; i -= 1) {
        var particle = this.particles[i];
        particle.life -= dt;
        if (particle.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        particle.vx *= particle.drag;
        particle.vy = particle.vy * particle.drag + particle.gravity * dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
      }

      for (i = this.streaks.length - 1; i >= 0; i -= 1) {
        var streak = this.streaks[i];
        streak.life -= dt;
        if (streak.life <= 0) {
          this.streaks.splice(i, 1);
          continue;
        }
        streak.vx *= streak.drag;
        streak.vy *= streak.drag;
        streak.x += streak.vx * dt;
        streak.y += streak.vy * dt;
      }

      for (i = this.echoes.length - 1; i >= 0; i -= 1) {
        var echo = this.echoes[i];
        echo.life -= dt;
        if (echo.life <= 0) {
          this.echoes.splice(i, 1);
          continue;
        }
        echo.vx *= echo.drag;
        echo.vy *= echo.drag;
        echo.x += echo.vx * dt;
        echo.y += echo.vy * dt;
      }

      for (i = this.rings.length - 1; i >= 0; i -= 1) {
        var ring = this.rings[i];
        ring.life -= dt;
        if (ring.life <= 0) {
          this.rings.splice(i, 1);
          continue;
        }
        ring.radius += ring.growth * dt;
      }

      for (i = this.texts.length - 1; i >= 0; i -= 1) {
        var text = this.texts[i];
        text.life -= dt;
        if (text.life <= 0) {
          this.texts.splice(i, 1);
          continue;
        }
        text.x += text.vx * dt;
        text.y += text.vy * dt;
      }

      for (i = this.flashes.length - 1; i >= 0; i -= 1) {
        var flash = this.flashes[i];
        flash.life -= dt;
        if (flash.life <= 0) {
          this.flashes.splice(i, 1);
        }
      }
    }

    draw(renderer, options) {
      var ctx = renderer.ctx;
      var opts = options || {};
      var offsetX = opts.offsetX || 0;
      var offsetY = opts.offsetY || 0;
      var i;

      for (i = 0; i < this.echoes.length; i += 1) {
        var echo = this.echoes[i];
        var echoAlpha = clamp(echo.life / echo.maxLife, 0, 1);
        var echoX = echo.screenSpace ? echo.x : echo.x - offsetX;
        var echoY = echo.screenSpace ? echo.y : echo.y - offsetY;
        ctx.save();
        ctx.translate(echoX, echoY);
        ctx.rotate(echo.rotation);
        ctx.globalAlpha = echoAlpha * 0.5;
        ctx.fillStyle = echo.color;
        if (echo.shape === "orb") {
          ctx.beginPath();
          ctx.ellipse(0, 0, echo.width * 0.5, echo.height * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-echo.width * 0.5, -echo.height * 0.5, echo.width, echo.height);
        }
        if (echo.outlineColor) {
          ctx.globalAlpha = echoAlpha * 0.75;
          ctx.strokeStyle = echo.outlineColor;
          ctx.lineWidth = 1.5;
          if (echo.shape === "orb") {
            ctx.beginPath();
            ctx.ellipse(0, 0, echo.width * 0.5, echo.height * 0.5, 0, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.strokeRect(-echo.width * 0.5, -echo.height * 0.5, echo.width, echo.height);
          }
        }
        ctx.restore();
      }

      for (i = 0; i < this.rings.length; i += 1) {
        var ring = this.rings[i];
        var ringAlpha = clamp(ring.life / ring.maxLife, 0, 1);
        var ringX = ring.screenSpace ? ring.x : ring.x - offsetX;
        var ringY = ring.screenSpace ? ring.y : ring.y - offsetY;
        ctx.save();
        ctx.globalAlpha = ringAlpha;
        if (ring.fillAlpha > 0) {
          ctx.fillStyle = ring.color;
          ctx.globalAlpha = ringAlpha * ring.fillAlpha;
          ctx.beginPath();
          ctx.arc(ringX, ringY, ring.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = ringAlpha;
        }
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.lineWidth;
        ctx.beginPath();
        ctx.arc(ringX, ringY, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      for (i = 0; i < this.particles.length; i += 1) {
        var particle = this.particles[i];
        var t = 1 - particle.life / particle.maxLife;
        var size = particle.sizeStart + (particle.sizeEnd - particle.sizeStart) * t;
        var alpha = clamp(particle.life / particle.maxLife, 0, 1);
        var particleX = particle.screenSpace ? particle.x : particle.x - offsetX;
        var particleY = particle.screenSpace ? particle.y : particle.y - offsetY;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;

        if (particle.shape === "circle") {
          ctx.beginPath();
          ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.translate(particleX, particleY);
          ctx.rotate(Math.PI * 0.25);
          ctx.fillRect(-size, -size, size * 2, size * 2);
        }
        ctx.restore();
      }

      for (i = 0; i < this.streaks.length; i += 1) {
        var streak = this.streaks[i];
        var streakAlpha = clamp(streak.life / streak.maxLife, 0, 1);
        var streakX = streak.screenSpace ? streak.x : streak.x - offsetX;
        var streakY = streak.screenSpace ? streak.y : streak.y - offsetY;
        var nx = streak.vx || 0;
        var ny = streak.vy || 0;
        var length = Math.sqrt(nx * nx + ny * ny) || 1;
        var dx = (nx / length) * streak.length;
        var dy = (ny / length) * streak.length;
        ctx.save();
        ctx.globalAlpha = streakAlpha;
        ctx.strokeStyle = streak.color;
        ctx.lineWidth = streak.width;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(streakX, streakY);
        ctx.lineTo(streakX - dx, streakY - dy);
        ctx.stroke();
        ctx.restore();
      }

      for (i = 0; i < this.texts.length; i += 1) {
        var text = this.texts[i];
        renderer.drawText(text.text, text.screenSpace ? text.x : text.x - offsetX, text.screenSpace ? text.y : text.y - offsetY, {
          size: text.size,
          align: "center",
          color: text.color,
          shadow: true
        });
      }

      for (i = 0; i < this.flashes.length; i += 1) {
        var flash = this.flashes[i];
        ctx.save();
        ctx.globalAlpha = clamp((flash.life / flash.maxLife) * flash.alpha, 0, 1);
        ctx.fillStyle = flash.color;
        ctx.fillRect(0, 0, ns.constants.GAME_WIDTH, ns.constants.GAME_HEIGHT);
        ctx.restore();
      }
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
