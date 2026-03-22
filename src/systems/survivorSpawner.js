(function (ns) {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function createRng(seed) {
    var state = (seed >>> 0) || 1;
    return {
      next: function () {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 4294967296;
      },
      range: function (min, max) {
        return min + (max - min) * this.next();
      },
      int: function (min, max) {
        return Math.floor(this.range(min, max + 1));
      }
    };
  }

  function chooseWeighted(rng, items, weightKey) {
    var total = 0;
    var i;
    for (i = 0; i < items.length; i += 1) {
      total += items[i][weightKey] || 0;
    }
    if (!total) {
      return items[0] || null;
    }
    var roll = rng.range(0, total);
    var cursor = 0;
    for (i = 0; i < items.length; i += 1) {
      cursor += items[i][weightKey] || 0;
      if (roll <= cursor) {
        return items[i];
      }
    }
    return items[items.length - 1] || null;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  ns.SurvivorSpawner = class {
    constructor(options) {
      var opts = options || {};
      this.gameWidth = opts.gameWidth || ns.constants.GAME_WIDTH;
      this.gameHeight = opts.gameHeight || ns.constants.GAME_HEIGHT;
      this.spawnMargin = opts.spawnMargin || 56;
      this.seed = opts.seed || 810;
      this.rng = createRng(this.seed);
      this.serial = 0;
      this.lastFacingAngle = 0;
      this.lastTargetX = this.gameWidth / 2;
      this.lastTargetY = this.gameHeight / 2;
      this.phaseState = {};
      this.triggeredEvents = {};
      this.triggeredBosses = {};
      this.plan = null;
      this.stageId = "";
      this.hazardRank = 0;
    }

    reset(stageId, hazardRank, options) {
      var opts = options || {};
      this.stageId = stageId;
      this.hazardRank = hazardRank || 0;
      this.seed = typeof opts.seed === "number" ? opts.seed : this.seed;
      this.rng = createRng(this.seed);
      this.serial = 0;
      this.lastFacingAngle = 0;
      this.lastTargetX = this.gameWidth / 2;
      this.lastTargetY = this.gameHeight / 2;
      this.phaseState = {};
      this.triggeredEvents = {};
      this.triggeredBosses = {};
      this.plan = ns.getSurvivorWavePlan ? ns.getSurvivorWavePlan(stageId, this.hazardRank) : null;
      return this.plan;
    }

    getEnemyCount(runtime) {
      if (!runtime) {
        return 0;
      }
      if (Array.isArray(runtime.enemies)) {
        return runtime.enemies.length;
      }
      if (typeof runtime.enemyCount === "number") {
        return runtime.enemyCount;
      }
      return 0;
    }

    getTarget(runtime) {
      var target = (runtime && (runtime.player || runtime.target)) || {};
      return {
        x: typeof target.x === "number" ? target.x : this.gameWidth / 2,
        y: typeof target.y === "number" ? target.y : this.gameHeight / 2,
        vx: typeof target.vx === "number" ? target.vx : 0,
        vy: typeof target.vy === "number" ? target.vy : 0
      };
    }

    getView(runtime) {
      var view = (runtime && runtime.view) || {};
      return {
        x: typeof view.x === "number" ? view.x : 0,
        y: typeof view.y === "number" ? view.y : 0,
        width: typeof view.width === "number" ? view.width : this.gameWidth,
        height: typeof view.height === "number" ? view.height : this.gameHeight
      };
    }

    updateFacing(target, dt) {
      var vx = target.vx;
      var vy = target.vy;
      if (!vx && !vy && dt > 0) {
        vx = (target.x - this.lastTargetX) / dt;
        vy = (target.y - this.lastTargetY) / dt;
      }
      if (Math.abs(vx) > 0.001 || Math.abs(vy) > 0.001) {
        this.lastFacingAngle = Math.atan2(vy, vx);
      }
      this.lastTargetX = target.x;
      this.lastTargetY = target.y;
    }

    getActivePhase(elapsedSec) {
      if (!this.plan || !Array.isArray(this.plan.phases)) {
        return null;
      }
      for (var i = 0; i < this.plan.phases.length; i += 1) {
        var phase = this.plan.phases[i];
        if (elapsedSec >= phase.startSec && elapsedSec < phase.endSec) {
          return phase;
        }
      }
      return null;
    }

    ensurePhaseState(phase) {
      var state = this.phaseState[phase.id];
      if (state) {
        return state;
      }
      state = {
        variantId: "",
        spawnTimer: 0,
        chosenVariant: null
      };
      this.phaseState[phase.id] = state;
      return state;
    }

    choosePhaseVariant(phase, state) {
      var chosen = chooseWeighted(this.rng, phase.variants || [], "variantWeight");
      state.chosenVariant = chosen;
      state.variantId = chosen ? chosen.id : "";
      state.spawnTimer = 0;
      return chosen;
    }

    getPerimeterSpawn(view) {
      var rect = view || { x: 0, y: 0, width: this.gameWidth, height: this.gameHeight };
      var edge = this.rng.int(0, 3);
      if (edge === 0) {
        return {
          x: rect.x - this.spawnMargin,
          y: this.rng.range(rect.y - this.spawnMargin, rect.y + rect.height + this.spawnMargin)
        };
      }
      if (edge === 1) {
        return {
          x: rect.x + rect.width + this.spawnMargin,
          y: this.rng.range(rect.y - this.spawnMargin, rect.y + rect.height + this.spawnMargin)
        };
      }
      if (edge === 2) {
        return {
          x: this.rng.range(rect.x - this.spawnMargin, rect.x + rect.width + this.spawnMargin),
          y: rect.y - this.spawnMargin
        };
      }
      return {
        x: this.rng.range(rect.x - this.spawnMargin, rect.x + rect.width + this.spawnMargin),
        y: rect.y + rect.height + this.spawnMargin
      };
    }

    getPatternSpawn(pattern, target, index, total, view) {
      var rect = view || { x: 0, y: 0, width: this.gameWidth, height: this.gameHeight };
      var cx = clamp(target.x, rect.x + 24, rect.x + rect.width - 24);
      var cy = clamp(target.y, rect.y + 24, rect.y + rect.height - 24);
      var angle = this.lastFacingAngle;
      var radius = Math.max(rect.width, rect.height) * 0.58;
      var laneRatio = total > 1 ? index / (total - 1) : 0.5;
      var leftX = rect.x - this.spawnMargin;
      var rightX = rect.x + rect.width + this.spawnMargin;
      var topY = rect.y - this.spawnMargin;
      var bottomY = rect.y + rect.height + this.spawnMargin;

      switch (pattern) {
        case "front-arc":
          angle += this.rng.range(-0.7, 0.7);
          return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
        case "rear-pulse":
          angle += Math.PI + this.rng.range(-0.5, 0.5);
          return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
        case "side-pin":
          angle += (this.rng.next() < 0.5 ? -1 : 1) * Math.PI * 0.5 + this.rng.range(-0.25, 0.25);
          return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
        case "edge-stream":
          return this.rng.next() < 0.5
            ? { x: leftX, y: this.rng.range(rect.y, rect.y + rect.height) }
            : { x: rightX, y: this.rng.range(rect.y, rect.y + rect.height) };
        case "edge-wall":
        case "lane-wall":
        case "alley-block":
          return this.rng.next() < 0.5
            ? { x: leftX, y: rect.y + rect.height * laneRatio }
            : { x: rightX, y: rect.y + rect.height * laneRatio };
        case "lane-left":
          return { x: leftX, y: rect.y + rect.height * (0.15 + laneRatio * 0.7) };
        case "lane-right":
          return { x: rightX, y: rect.y + rect.height * (0.15 + laneRatio * 0.7) };
        case "waterline":
          return this.rng.next() < 0.5
            ? { x: rect.x + rect.width * laneRatio, y: topY }
            : { x: rect.x + rect.width * laneRatio, y: bottomY };
        case "bonus-ring":
          angle = this.rng.range(0, Math.PI * 2);
          radius = Math.max(180, Math.min(280, radius * 0.52));
          return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
        case "cross-dash":
          if (this.rng.next() < 0.5) {
            return { x: this.rng.next() < 0.5 ? leftX : rightX, y: rect.y + rect.height * laneRatio };
          }
          return { x: rect.x + rect.width * laneRatio, y: this.rng.next() < 0.5 ? topY : bottomY };
        case "bomb-arc":
          return { x: rect.x + rect.width * (0.1 + laneRatio * 0.8), y: topY };
        default:
          return this.getPerimeterSpawn(rect);
      }
    }

    createEnemy(archetypeId, spawn, elapsedSec, extra) {
      var archetype = this.plan.enemyArchetypes ? this.plan.enemyArchetypes[archetypeId] : null;
      if (!archetype && ns.survivorSpawnTables && ns.survivorSpawnTables.enemyArchetypes) {
        archetype = ns.survivorSpawnTables.enemyArchetypes[archetypeId];
      }
      if (!archetype) {
        return null;
      }

      var scale = this.plan.enemyScale || {};
      var timeScale = 1 + Math.min(0.65, elapsedSec / 1200 * 0.45);
      var hpMultiplier = archetype.category === "elite" || archetype.category === "boss"
        ? (scale.eliteHpMultiplier || 1)
        : (scale.hpMultiplier || 1) * timeScale;
      var speedMultiplier = scale.speedMultiplier || 1;
      var damageMultiplier = 1 + Math.min(0.4, elapsedSec / 1200 * 0.28);
      var size = archetype.category === "boss"
        ? 42
        : archetype.category === "elite"
          ? 28
          : archetype.category === "wall"
            ? 18
            : 14;

      return Object.assign({
        id: "survivor-enemy-" + (this.serial += 1),
        archetypeId: archetypeId,
        label: archetype.label,
        category: archetype.category,
        x: spawn.x,
        y: spawn.y,
        vx: 0,
        vy: 0,
        radius: size,
        hp: Math.round(archetype.hp * hpMultiplier),
        maxHp: Math.round(archetype.hp * hpMultiplier),
        speed: archetype.speed * speedMultiplier,
        baseSpeed: archetype.speed * speedMultiplier,
        damage: Math.max(1, Math.round(archetype.damage * damageMultiplier)),
        baseDamage: Math.max(1, Math.round(archetype.damage * damageMultiplier)),
        xp: Math.max(1, Math.round(archetype.xp * (1 + elapsedSec / 1200 * 0.18))),
        tags: (archetype.tags || []).slice(),
        levelScale: timeScale,
        spawnTimeSec: elapsedSec
      }, extra || {});
    }

    spawnFromGroup(group, target, elapsedSec, aliveCount, maxAlive, view) {
      var available = maxAlive - aliveCount;
      if (available <= 0) {
        return [];
      }

      var count = Math.min(this.rng.int(group.minPack, group.maxPack), available);
      var spawned = [];
      for (var i = 0; i < count; i += 1) {
        var spawn = this.getPatternSpawn(group.pattern, target, i, count, view);
        var enemy = this.createEnemy(group.enemyId, spawn, elapsedSec, {
          spawnPattern: group.pattern
        });
        if (enemy) {
          spawned.push(enemy);
        }
      }
      return spawned;
    }

    update(dt, runtime) {
      var elapsedSec = runtime && typeof runtime.elapsedSec === "number" ? runtime.elapsedSec : 0;
      var target = this.getTarget(runtime);
      var view = this.getView(runtime);
      this.updateFacing(target, dt || 0);

      var result = {
        activePhaseId: null,
        spawned: [],
        events: [],
        bosses: []
      };

      if (!this.plan) {
        return result;
      }

      var activePhase = this.getActivePhase(elapsedSec);
      if (activePhase && activePhase.variants && activePhase.variants.length) {
        result.activePhaseId = activePhase.id;
        var state = this.ensurePhaseState(activePhase);
        var variant = state.chosenVariant;
        var spawnIntensity = runtime && typeof runtime.spawnIntensity === "number"
          ? Math.max(0, runtime.spawnIntensity)
          : 0;
        if (!variant) {
          variant = this.choosePhaseVariant(activePhase, state);
        }

        if (variant) {
          var aliveCount = this.getEnemyCount(runtime);
          var maxAlive = ((variant.director && variant.director.maxAlive) || 40) + Math.min(72, Math.floor(spawnIntensity * 4));
          var spawnInterval = Math.max(
            0.12,
            (((variant.director && variant.director.spawnInterval) || 1) / (1 + spawnIntensity * 0.07))
          );
          state.spawnTimer -= dt;

          while (state.spawnTimer <= 0) {
            state.spawnTimer += spawnInterval;
            if (aliveCount + result.spawned.length >= maxAlive) {
              break;
            }
            var groups = (variant.groups || []).filter(function (entry) {
              return entry.minRank <= (runtime && typeof runtime.hazardRank === "number" ? runtime.hazardRank : 0);
            });
            if (!groups.length) {
              groups = variant.groups || [];
            }
            var chosenGroup = chooseWeighted(this.rng, groups, "weight");
            if (!chosenGroup) {
              break;
            }
            var spawned = this.spawnFromGroup(
              chosenGroup,
              target,
              elapsedSec,
              aliveCount + result.spawned.length,
              maxAlive,
              view
            );
            Array.prototype.push.apply(result.spawned, spawned);
          }
        }
      }

      var i;
      for (i = 0; i < this.plan.events.length; i += 1) {
        var eventDef = this.plan.events[i];
        if (!this.triggeredEvents[eventDef.id] && elapsedSec >= eventDef.atSec) {
          this.triggeredEvents[eventDef.id] = true;
          result.events.push(clone(eventDef));
        }
      }

      for (i = 0; i < this.plan.bosses.length; i += 1) {
        var bossDef = this.plan.bosses[i];
        if (!this.triggeredBosses[bossDef.id] && elapsedSec >= bossDef.atSec) {
          this.triggeredBosses[bossDef.id] = true;
          var bossSpawn = this.getPatternSpawn("front-arc", target, 0, 1, view);
          var bossEnemy = this.createEnemy(bossDef.enemyId, bossSpawn, elapsedSec, {
            isBossSpawn: true,
            chestType: bossDef.chestType
          });
          if (bossEnemy) {
            result.bosses.push(bossEnemy);
          }
        }
      }

      return result;
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
