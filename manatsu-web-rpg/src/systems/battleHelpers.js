(function (ns) {
  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawnBullet(runtime, bullet) {
    runtime.bullets.push(Object.assign({
      radius: 6,
      life: 8
    }, bullet));
  }

  function spawnDrizzle(runtime, box) {
    spawnBullet(runtime, {
      x: randomBetween(box.x + 14, box.x + box.w - 14),
      y: box.y - 8,
      vx: randomBetween(-12, 12),
      vy: randomBetween(155, 230)
    });
  }

  function spawnSweep(runtime, box) {
    var fromLeft = Math.random() > 0.5;
    spawnBullet(runtime, {
      x: fromLeft ? box.x - 10 : box.x + box.w + 10,
      y: randomBetween(box.y + 14, box.y + box.h - 14),
      vx: fromLeft ? randomBetween(160, 240) : randomBetween(-240, -160),
      vy: randomBetween(-20, 20)
    });
  }

  function spawnCross(runtime, box) {
    var side = Math.floor(Math.random() * 4);
    if (side === 0) {
      spawnBullet(runtime, { x: box.x - 10, y: box.y + box.h / 2, vx: 220, vy: 0, radius: 7 });
    } else if (side === 1) {
      spawnBullet(runtime, { x: box.x + box.w + 10, y: box.y + box.h / 2, vx: -220, vy: 0, radius: 7 });
    } else if (side === 2) {
      spawnBullet(runtime, { x: box.x + box.w / 2, y: box.y - 10, vx: 0, vy: 220, radius: 7 });
    } else {
      spawnBullet(runtime, { x: box.x + box.w / 2, y: box.y + box.h + 10, vx: 0, vy: -220, radius: 7 });
    }
  }

  function spawnWave(runtime, box) {
    var baseY = box.y + box.h / 2 + Math.sin(runtime.attackElapsed * 5) * 54;
    spawnBullet(runtime, {
      x: box.x - 10,
      y: baseY,
      vx: 210,
      vy: Math.sin(runtime.attackElapsed * 8) * 40,
      radius: 6
    });
  }

  function spawnBurst(runtime, box) {
    var cx = box.x + box.w / 2;
    var cy = box.y + box.h / 2;
    var i;
    for (i = 0; i < 6; i += 1) {
      var angle = runtime.attackElapsed * 2 + (Math.PI * 2 * i) / 6;
      spawnBullet(runtime, {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * 145,
        vy: Math.sin(angle) * 145,
        radius: 5
      });
    }
  }

  function spawnStorm(runtime, box) {
    spawnDrizzle(runtime, box);
    if (Math.random() > 0.55) {
      spawnSweep(runtime, box);
    }
  }

  function spawnWalls(runtime, box) {
    var gap = Math.floor(Math.random() * 8);
    var i;
    for (i = 0; i < 8; i += 1) {
      if (i === gap || i === gap + 1) {
        continue;
      }
      spawnBullet(runtime, {
        x: box.x + 22 + i * (box.w - 44) / 7,
        y: box.y - 6,
        vx: 0,
        vy: 180,
        radius: 10
      });
    }
  }

  function spawnRing(runtime, box) {
    var cx = box.x + box.w / 2;
    var cy = box.y + box.h / 2;
    var i;
    for (i = 0; i < 8; i += 1) {
      var angle = runtime.attackElapsed * 0.6 + (Math.PI * 2 * i) / 8;
      spawnBullet(runtime, {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * 155,
        vy: Math.sin(angle) * 155,
        radius: 6
      });
    }
  }

  ns.calculateFightDamage = function (meterValue, attackPower) {
    var centerDistance = Math.abs(0.5 - meterValue);
    var normalized = Math.max(0, 1 - centerDistance * 2);
    return Math.max(1, Math.round(attackPower + normalized * attackPower * 2.4));
  };

  ns.startEnemyTurn = function (patternName) {
    return {
      patternName: patternName,
      bullets: [],
      attackElapsed: 0,
      spawnElapsed: 0
    };
  };

  ns.updateEnemyTurn = function (runtime, dt, box) {
    runtime.attackElapsed += dt;
    runtime.spawnElapsed += dt;

    var interval = 0.22;
    if (runtime.patternName === "storm") {
      interval = 0.14;
    } else if (runtime.patternName === "burst") {
      interval = 0.68;
    } else if (runtime.patternName === "ring") {
      interval = 0.78;
    } else if (runtime.patternName === "walls") {
      interval = 0.82;
    }

    while (runtime.spawnElapsed >= interval) {
      runtime.spawnElapsed -= interval;
      switch (runtime.patternName) {
        case "drizzle":
          spawnDrizzle(runtime, box);
          break;
        case "sweep":
          spawnSweep(runtime, box);
          break;
        case "cross":
          spawnCross(runtime, box);
          break;
        case "wave":
          spawnWave(runtime, box);
          break;
        case "burst":
          spawnBurst(runtime, box);
          break;
        case "storm":
          spawnStorm(runtime, box);
          break;
        case "ring":
          spawnRing(runtime, box);
          break;
        case "walls":
          spawnWalls(runtime, box);
          break;
        default:
          spawnDrizzle(runtime, box);
          break;
      }
    }

    runtime.bullets = runtime.bullets.filter(function (bullet) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      var inside = (
        bullet.x > box.x - 30 &&
        bullet.x < box.x + box.w + 30 &&
        bullet.y > box.y - 30 &&
        bullet.y < box.y + box.h + 30
      );
      return bullet.life > 0 && inside;
    });
  };

  ns.checkHeartCollision = function (heart, bullets) {
    var i;
    for (i = 0; i < bullets.length; i += 1) {
      var bullet = bullets[i];
      var dx = heart.x - bullet.x;
      var dy = heart.y - bullet.y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < heart.radius + bullet.radius) {
        return true;
      }
    }
    return false;
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
