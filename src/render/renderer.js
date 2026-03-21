(function (ns) {
  ns.Renderer = class {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.ctx.imageSmoothingEnabled = false;
    }

    clear(color) {
      this.ctx.fillStyle = color || ns.constants.COLORS.bg;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setFont(size, color, align) {
      this.ctx.font = size + "px " + ns.constants.FONT_FAMILY;
      this.ctx.fillStyle = color || ns.constants.COLORS.text;
      this.ctx.textAlign = align || "left";
      this.ctx.textBaseline = "top";
    }

    drawPanel(x, y, width, height, options) {
      var fill = (options && options.fill) || ns.constants.COLORS.panel;
      var border = (options && options.border) || ns.constants.COLORS.border;
      var alpha = options && typeof options.alpha === "number" ? options.alpha : 1;

      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = fill;
      this.ctx.fillRect(x, y, width, height);
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = border;
      this.ctx.strokeRect(x + 1.5, y + 1.5, width - 3, height - 3);
      this.ctx.restore();
    }

    drawText(text, x, y, options) {
      var opts = options || {};
      this.setFont(opts.size || 20, opts.color || ns.constants.COLORS.text, opts.align || "left");
      if (opts.shadow) {
        this.ctx.save();
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        this.ctx.fillText(text, x + 2, y + 2);
        this.ctx.restore();
        this.setFont(opts.size || 20, opts.color || ns.constants.COLORS.text, opts.align || "left");
      }
      this.ctx.fillText(text, x, y);
    }

    measure(text, size) {
      this.setFont(size || 20, ns.constants.COLORS.text, "left");
      return this.ctx.measureText(text).width;
    }

    wrapText(text, maxWidth, size) {
      var lines = [];
      var blocks = String(text).split("\n");
      var blockIndex;

      this.setFont(size || 20, ns.constants.COLORS.text, "left");

      for (blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
        var current = "";
        var block = blocks[blockIndex];
        var i;

        if (!block.length) {
          lines.push("");
          continue;
        }

        for (i = 0; i < block.length; i += 1) {
          var test = current + block[i];
          if (this.ctx.measureText(test).width > maxWidth && current.length > 0) {
            lines.push(current);
            current = block[i];
          } else {
            current = test;
          }
        }

        if (current) {
          lines.push(current);
        }
      }

      return lines;
    }

    drawParagraph(text, x, y, maxWidth, options) {
      var opts = options || {};
      var size = opts.size || 20;
      var lineHeight = opts.lineHeight || Math.round(size * 1.35);
      var lines = this.wrapText(text, maxWidth, size);
      var i;

      for (i = 0; i < lines.length; i += 1) {
        this.drawText(lines[i], x, y + i * lineHeight, opts);
      }

      return lines.length * lineHeight;
    }

    drawCenteredText(text, y, options) {
      this.drawText(text, this.canvas.width / 2, y, Object.assign({}, options || {}, { align: "center" }));
    }

    drawImageContain(image, x, y, width, height) {
      if (!image || !image.complete || !image.naturalWidth) {
        return false;
      }

      var scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
      var drawWidth = image.naturalWidth * scale;
      var drawHeight = image.naturalHeight * scale;
      var drawX = x + (width - drawWidth) / 2;
      var drawY = y + (height - drawHeight) / 2;
      this.ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      return true;
    }

    drawActor(entity, options) {
      var opts = options || {};
      this.ctx.fillStyle = opts.fill || entity.color || "#cccccc";
      this.ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
      this.ctx.strokeStyle = opts.border || "#ffffff";
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(entity.x, entity.y, entity.width, entity.height);
      if (entity.label) {
        this.drawText(entity.label, entity.x + entity.width / 2, entity.y - 18, {
          size: 16,
          align: "center",
          color: opts.labelColor || ns.constants.COLORS.text
        });
      }
    }

    drawSenpaiSprite(entity, options) {
      var opts = options || {};
      var ctx = this.ctx;
      var x = entity.x;
      var y = entity.y;
      var w = entity.width;
      var h = entity.height;
      var skin = opts.skin || "#b5795f";
      var skinShade = "#8f5e4c";
      var hair = "#191513";
      var shirt = "#2b3250";

      ctx.save();
      ctx.translate(x, y);

      ctx.fillStyle = shirt;
      ctx.fillRect(w * 0.18, h * 0.48, w * 0.64, h * 0.48);

      ctx.fillStyle = skin;
      ctx.fillRect(w * 0.38, h * 0.34, w * 0.24, h * 0.18);

      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.24, w * 0.24, h * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = skinShade;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.3, w * 0.18, h * 0.1, 0, 0, Math.PI);
      ctx.fill();

      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.moveTo(w * 0.25, h * 0.19);
      ctx.lineTo(w * 0.28, h * 0.08);
      ctx.lineTo(w * 0.45, h * 0.02);
      ctx.lineTo(w * 0.63, h * 0.04);
      ctx.lineTo(w * 0.74, h * 0.12);
      ctx.lineTo(w * 0.75, h * 0.22);
      ctx.lineTo(w * 0.25, h * 0.22);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#241a18";
      ctx.fillRect(w * 0.34, h * 0.18, w * 0.11, h * 0.03);
      ctx.fillRect(w * 0.55, h * 0.18, w * 0.11, h * 0.03);

      ctx.fillStyle = "#1b1614";
      ctx.fillRect(w * 0.35, h * 0.24, w * 0.08, h * 0.03);
      ctx.fillRect(w * 0.57, h * 0.24, w * 0.08, h * 0.03);

      ctx.fillStyle = "#e8dfd6";
      ctx.fillRect(w * 0.41, h * 0.245, w * 0.015, h * 0.015);
      ctx.fillRect(w * 0.62, h * 0.245, w * 0.015, h * 0.015);

      ctx.strokeStyle = "#6d4737";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.24);
      ctx.lineTo(w * 0.495, h * 0.31);
      ctx.stroke();

      ctx.strokeStyle = "#6b473b";
      ctx.beginPath();
      ctx.moveTo(w * 0.43, h * 0.35);
      ctx.quadraticCurveTo(w * 0.5, h * 0.39, w * 0.58, h * 0.35);
      ctx.stroke();

      ctx.strokeStyle = opts.border || "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, w, h);
      ctx.restore();

      if (entity.label) {
        this.drawText(entity.label, entity.x + entity.width / 2, entity.y - 18, {
          size: 16,
          align: "center",
          color: opts.labelColor || ns.constants.COLORS.text
        });
      }
    }

    drawSenpaiPortrait(x, y, width, height, options) {
      var opts = options || {};
      var ctx = this.ctx;
      var frameBorder = opts.border || ns.constants.COLORS.border;
      var innerX = x + 8;
      var innerY = y + 8;
      var innerW = width - 16;
      var innerH = height - 16;
      var cx = innerX + innerW * 0.5;
      var cy = innerY + innerH * 0.42;
      var faceW = innerW * 0.2;
      var faceH = innerH * 0.27;
      var skin = "#b5795f";
      var skinLight = "#cf957a";
      var skinShade = "#8d5d4b";
      var hair = "#171412";
      var shirt = "#29314f";

      this.drawPanel(x, y, width, height, {
        fill: "rgba(10, 10, 10, 0.94)",
        border: frameBorder
      });

      ctx.save();

      ctx.fillStyle = "#b7cdc7";
      ctx.fillRect(innerX, innerY, innerW * 0.33, innerH);
      ctx.fillStyle = "#e4ddd6";
      ctx.fillRect(innerX + innerW * 0.33, innerY, innerW * 0.67, innerH);

      ctx.strokeStyle = "rgba(63, 94, 92, 0.55)";
      ctx.lineWidth = 1.5;
      for (var i = 0; i < 12; i += 1) {
        var lineY = innerY + 6 + i * 10;
        ctx.beginPath();
        ctx.moveTo(innerX + 4, lineY);
        ctx.lineTo(innerX + innerW * 0.33 - 4, lineY);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.beginPath();
      ctx.ellipse(innerX + innerW * 0.8, innerY + innerH * 0.74, innerW * 0.16, innerH * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = shirt;
      ctx.beginPath();
      ctx.moveTo(cx - innerW * 0.26, innerY + innerH * 0.8);
      ctx.lineTo(cx - innerW * 0.17, innerY + innerH * 0.66);
      ctx.lineTo(cx + innerW * 0.19, innerY + innerH * 0.66);
      ctx.lineTo(cx + innerW * 0.3, innerY + innerH * 0.8);
      ctx.lineTo(cx + innerW * 0.3, innerY + innerH);
      ctx.lineTo(cx - innerW * 0.3, innerY + innerH);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = skin;
      ctx.fillRect(cx - innerW * 0.08, innerY + innerH * 0.5, innerW * 0.16, innerH * 0.2);

      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(cx, cy, faceW, faceH, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = skinLight;
      ctx.beginPath();
      ctx.ellipse(cx - faceW * 0.2, cy - faceH * 0.08, faceW * 0.7, faceH * 0.66, 0, 0, Math.PI * 2);
      ctx.globalAlpha = 0.25;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = skinShade;
      ctx.beginPath();
      ctx.moveTo(cx - faceW * 0.86, cy + faceH * 0.28);
      ctx.quadraticCurveTo(cx, cy + faceH * 1.18, cx + faceW * 0.9, cy + faceH * 0.22);
      ctx.lineTo(cx + faceW * 0.66, cy + faceH * 0.74);
      ctx.lineTo(cx - faceW * 0.6, cy + faceH * 0.74);
      ctx.closePath();
      ctx.globalAlpha = 0.28;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.moveTo(cx - faceW * 1.02, cy - faceH * 0.32);
      ctx.lineTo(cx - faceW * 0.92, cy - faceH * 0.96);
      ctx.lineTo(cx - faceW * 0.2, cy - faceH * 1.18);
      ctx.lineTo(cx + faceW * 0.5, cy - faceH * 1.06);
      ctx.lineTo(cx + faceW * 0.98, cy - faceH * 0.72);
      ctx.lineTo(cx + faceW * 0.94, cy - faceH * 0.14);
      ctx.lineTo(cx - faceW * 0.98, cy - faceH * 0.08);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#2a1d18";
      ctx.fillRect(cx - faceW * 0.62, cy - faceH * 0.18, faceW * 0.42, faceH * 0.08);
      ctx.fillRect(cx + faceW * 0.16, cy - faceH * 0.17, faceW * 0.42, faceH * 0.08);

      ctx.fillStyle = "#201917";
      ctx.beginPath();
      ctx.ellipse(cx - faceW * 0.34, cy + faceH * 0.03, faceW * 0.16, faceH * 0.08, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + faceW * 0.33, cy + faceH * 0.04, faceW * 0.16, faceH * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f7f2ec";
      ctx.beginPath();
      ctx.ellipse(cx - faceW * 0.28, cy - faceH * 0.01, faceW * 0.035, faceH * 0.03, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + faceW * 0.39, cy, faceW * 0.035, faceH * 0.03, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#7e5441";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + faceW * 0.02, cy - faceH * 0.02);
      ctx.lineTo(cx - faceW * 0.02, cy + faceH * 0.26);
      ctx.stroke();

      ctx.strokeStyle = "#6d4538";
      ctx.beginPath();
      ctx.moveTo(cx - faceW * 0.2, cy + faceH * 0.52);
      ctx.quadraticCurveTo(cx + faceW * 0.06, cy + faceH * 0.62, cx + faceW * 0.34, cy + faceH * 0.48);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
      ctx.lineWidth = 1;
      ctx.strokeRect(innerX, innerY, innerW, innerH);
      ctx.restore();
    }

    getSurvivorSkinConfig(variantId) {
      var skins = ns.survivorSkins || [];
      var i;
      for (i = 0; i < skins.length; i += 1) {
        if (skins[i].id === variantId) {
          return skins[i].sprite || null;
        }
      }
      return null;
    }

    getPixelSpriteConfig(kind, variantId) {
      switch (kind) {
        case "player":
          return { skin: "#e0bb8d", hair: "#3a2a22", shirt: "#c95a46", pants: "#2e4f6d", shoes: "#2a2a2a" };
        case "senpai":
          return Object.assign({
            skin: "#b97d5e",
            hair: "#161212",
            shirt: "#2b3452",
            pants: "#1b2236",
            shoes: "#111111",
            wide: true,
            thickBrow: true,
            croppedHair: true,
            strongJaw: true
          }, this.getSurvivorSkinConfig(variantId) || {});
        case "kid":
          return { skin: "#f0c497", hair: "#2d211c", shirt: "#62c9ff", pants: "#3a5370", shoes: "#303030", short: true };
        case "salaryman":
          return { skin: "#d2a07c", hair: "#2e231e", shirt: "#d9d9d9", pants: "#576070", shoes: "#262626", tie: "#c44c4c" };
        case "lady":
          return { skin: "#e0ad90", hair: "#5a3427", shirt: "#d7838c", pants: "#7a4358", shoes: "#3a2231", skirt: true };
        case "shop":
          return { skin: "#d7aa7e", hair: "#6b523c", shirt: "#d0a846", pants: "#5c442b", shoes: "#2b2216", apron: true };
        case "scientist":
          return { skin: "#d0a67b", hair: "#554334", shirt: "#88c768", pants: "#45634a", shoes: "#232323", coat: true };
        case "guard":
          return { skin: "#b98d6e", hair: "#2c2725", shirt: "#9fa6af", pants: "#50565f", shoes: "#1d1d1d", cap: true };
        case "ghost":
          return { skin: "#c7f4ff", hair: "#8fd7e6", shirt: "#9cecff", pants: "#6ec7d8", shoes: "#7ee2ef", ghost: true };
        case "child":
          return { skin: "#f2c690", hair: "#483126", shirt: "#ffd56f", pants: "#8e6f2a", shoes: "#322514", short: true };
        case "clock":
          return { object: "clock" };
        case "surface":
          return { object: "surface" };
        case "voice":
          return { object: "speaker" };
        default:
          return { skin: "#d1a27e", hair: "#3d2f29", shirt: "#8e8eb5", pants: "#4d4d68", shoes: "#262626" };
      }
    }

    drawPixelSprite(entity, kind, options) {
      var opts = options || {};
      var config = this.getPixelSpriteConfig(kind, opts.variant);
      var ctx = this.ctx;
      var scale = Math.max(2, Math.floor(Math.min(entity.width / 16, entity.height / 24)));
      var spriteWidth = 16 * scale;
      var spriteHeight = 24 * scale;
      var moving = !!opts.moving;
      var walkPhase = opts.walkPhase || 0;
      var bob = moving ? Math.round(Math.abs(Math.sin(walkPhase)) * scale * 0.7) : 0;
      var leftArmOffset = moving ? Math.round(Math.max(0, Math.sin(walkPhase)) * scale) : 0;
      var rightArmOffset = moving ? Math.round(Math.max(0, -Math.sin(walkPhase)) * scale) : 0;
      var leftLegOffset = moving ? Math.round(Math.max(0, -Math.sin(walkPhase)) * scale * 1.4) : 0;
      var rightLegOffset = moving ? Math.round(Math.max(0, Math.sin(walkPhase)) * scale * 1.4) : 0;
      var ox = Math.round(entity.x + (entity.width - spriteWidth) / 2);
      var oy = Math.round(entity.y + entity.height - spriteHeight + bob);
      var hair = config.hair;
      var skin = config.skin;
      var shirt = config.shirt;
      var pants = config.pants;
      var shoes = config.shoes;

      if (config.object) {
        this.drawPixelObjectSprite(kind, ox, oy, spriteWidth, spriteHeight);
        if (entity.label) {
          this.drawText(entity.label, entity.x + entity.width / 2, entity.y - 18, {
            size: 16,
            align: "center",
            color: (options && options.labelColor) || ns.constants.COLORS.text
          });
        }
        return;
      }

      ctx.save();
      if (config.ghost) {
        ctx.globalAlpha = 0.88;
      }
      if (config.glow) {
        ctx.fillStyle = config.glowColor || "#ffe07a";
        ctx.globalAlpha = 0.18;
        ctx.fillRect(ox - 2 * scale, oy + 1 * scale, spriteWidth + 4 * scale, spriteHeight - 2 * scale);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(ox + 2 * scale, oy + 22 * scale + Math.round(bob * 0.2), 12 * scale, 2 * scale);

      var bodyLeft = config.wide ? 2 : 3;
      var bodyWidth = config.wide ? 12 : 10;
      var headLeft = config.wide ? 3 : 4;
      var headWidth = config.wide ? 10 : 8;
      var torsoTop = config.short ? 9 : 10;
      var bodyHeight = config.short ? 7 : 8;
      var legTop = config.short ? 16 : 18;

      ctx.fillStyle = shirt;
      ctx.fillRect(ox + bodyLeft * scale, oy + torsoTop * scale, bodyWidth * scale, bodyHeight * scale);
      ctx.fillRect(ox + 1 * scale, oy + (torsoTop + 1) * scale + leftArmOffset, 2 * scale, 5 * scale);
      ctx.fillRect(ox + 13 * scale, oy + (torsoTop + 1) * scale + rightArmOffset, 2 * scale, 5 * scale);
      if (config.happi) {
        ctx.fillStyle = config.trimColor || "#f6c453";
        ctx.fillRect(ox + 3 * scale, oy + torsoTop * scale, 1 * scale, bodyHeight * scale);
        ctx.fillRect(ox + 12 * scale, oy + torsoTop * scale, 1 * scale, bodyHeight * scale);
        ctx.fillRect(ox + 7 * scale, oy + (torsoTop + 1) * scale, 2 * scale, bodyHeight * scale - 1 * scale);
      }

      if (config.apron) {
        ctx.fillStyle = "#f3e0b4";
        ctx.fillRect(ox + 5 * scale, oy + (torsoTop + 1) * scale, 6 * scale, 6 * scale);
      }
      if (config.coat) {
        ctx.fillStyle = "#d9efe0";
        ctx.fillRect(ox + 2 * scale, oy + torsoTop * scale, 3 * scale, bodyHeight * scale);
        ctx.fillRect(ox + 11 * scale, oy + torsoTop * scale, 3 * scale, bodyHeight * scale);
      }
      if (config.tie) {
        ctx.fillStyle = config.tie;
        ctx.fillRect(ox + 7 * scale, oy + (torsoTop + 1) * scale, 2 * scale, 4 * scale);
      }

      ctx.fillStyle = pants;
      if (config.skirt) {
        ctx.fillRect(ox + 4 * scale, oy + legTop * scale - 2 * scale, 8 * scale, 4 * scale);
      }
      ctx.fillRect(ox + 4 * scale, oy + legTop * scale + leftLegOffset, 3 * scale, (config.shorts ? 2 : 4) * scale - leftLegOffset);
      ctx.fillRect(ox + 9 * scale, oy + legTop * scale + rightLegOffset, 3 * scale, (config.shorts ? 2 : 4) * scale - rightLegOffset);

      ctx.fillStyle = shoes;
      ctx.fillRect(ox + 3 * scale, oy + (config.shorts ? 20 : 22) * scale + leftLegOffset, 4 * scale, 2 * scale);
      ctx.fillRect(ox + 9 * scale, oy + (config.shorts ? 20 : 22) * scale + rightLegOffset, 4 * scale, 2 * scale);

      ctx.fillStyle = skin;
      if (config.strongJaw) {
        ctx.fillRect(ox + 5 * scale, oy + 8 * scale, 6 * scale, 3 * scale);
      } else {
        ctx.fillRect(ox + 6 * scale, oy + 8 * scale, 4 * scale, 2 * scale);
      }
      ctx.fillRect(ox + 1 * scale, oy + (torsoTop + 2) * scale + leftArmOffset, 2 * scale, 3 * scale);
      ctx.fillRect(ox + 13 * scale, oy + (torsoTop + 2) * scale + rightArmOffset, 2 * scale, 3 * scale);
      ctx.fillRect(ox + headLeft * scale, oy + 1 * scale, headWidth * scale, 8 * scale);

      ctx.fillStyle = hair;
      ctx.fillRect(ox + headLeft * scale, oy, headWidth * scale, config.croppedHair ? 2 * scale : 3 * scale);
      ctx.fillRect(ox + (headLeft - 1) * scale, oy + 1 * scale, 2 * scale, config.croppedHair ? 3 * scale : 4 * scale);
      ctx.fillRect(ox + (headLeft + headWidth - 1) * scale, oy + 1 * scale, 2 * scale, config.croppedHair ? 3 * scale : 4 * scale);
      if (config.headband) {
        ctx.fillStyle = config.headbandColor || "#fff0e8";
        ctx.fillRect(ox + headLeft * scale, oy + 2 * scale, headWidth * scale, 1 * scale);
      }
      if (config.cap) {
        ctx.fillStyle = "#42474f";
        ctx.fillRect(ox + (headLeft - 1) * scale, oy + 1 * scale, (headWidth + 2) * scale, 2 * scale);
      }

      ctx.fillStyle = "#201916";
      if (config.thickBrow) {
        ctx.fillRect(ox + 4 * scale, oy + 4 * scale, 3 * scale, 1 * scale);
        ctx.fillRect(ox + 9 * scale, oy + 4 * scale, 3 * scale, 1 * scale);
        ctx.fillStyle = "#f0ede8";
        ctx.fillRect(ox + 5 * scale, oy + 4 * scale, 1 * scale, 1 * scale);
        ctx.fillRect(ox + 10 * scale, oy + 4 * scale, 1 * scale, 1 * scale);
        ctx.fillStyle = "#7e5948";
        ctx.fillRect(ox + 6 * scale, oy + 6 * scale, 4 * scale, 1 * scale);
        ctx.fillRect(ox + 7 * scale, oy + 7 * scale, 2 * scale, 1 * scale);
      } else {
        ctx.fillRect(ox + 5 * scale, oy + 4 * scale, 2 * scale, 1 * scale);
        ctx.fillRect(ox + 9 * scale, oy + 4 * scale, 2 * scale, 1 * scale);
        ctx.fillStyle = "#f0ede8";
        ctx.fillRect(ox + 6 * scale, oy + 4 * scale, 1 * scale, 1 * scale);
        ctx.fillRect(ox + 10 * scale, oy + 4 * scale, 1 * scale, 1 * scale);
        ctx.fillStyle = "#7e5948";
        ctx.fillRect(ox + 7 * scale, oy + 6 * scale, 2 * scale, 1 * scale);
      }
      if (config.sunglasses) {
        ctx.fillStyle = "#0e1015";
        ctx.fillRect(ox + 4 * scale, oy + 4 * scale, 8 * scale, 2 * scale);
        ctx.fillRect(ox + 7 * scale, oy + 5 * scale, 2 * scale, 1 * scale);
      }
      if (config.eyeGlow) {
        ctx.fillStyle = config.glowColor || "#ffe07a";
        ctx.fillRect(ox + 5 * scale, oy + 4 * scale, 1 * scale, 1 * scale);
        ctx.fillRect(ox + 10 * scale, oy + 4 * scale, 1 * scale, 1 * scale);
      }
      if (config.whistle) {
        ctx.strokeStyle = "#f0ede8";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ox + 8 * scale, oy + (torsoTop + 1) * scale);
        ctx.lineTo(ox + 9 * scale, oy + (torsoTop + 4) * scale);
        ctx.stroke();
        ctx.fillStyle = config.whistleColor || "#ffd76f";
        ctx.fillRect(ox + 8 * scale, oy + (torsoTop + 4) * scale, 2 * scale, 1 * scale);
      }
      if (config.trimColor && !config.happi) {
        ctx.fillStyle = config.trimColor;
        ctx.fillRect(ox + 5 * scale, oy + torsoTop * scale, 6 * scale, 1 * scale);
      }

      ctx.strokeStyle = opts.border || "#ffffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(ox - 1, oy - 1, spriteWidth + 2, spriteHeight + 2);
      ctx.restore();

      if (entity.label) {
        this.drawText(entity.label, entity.x + entity.width / 2, entity.y - 18, {
          size: 16,
          align: "center",
          color: opts.labelColor || ns.constants.COLORS.text
        });
      }
    }

    drawPixelObjectSprite(kind, x, y, width, height) {
      var ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
      ctx.fillRect(x + 4, y + height - 8, width - 8, 6);

      if (kind === "clock") {
        ctx.fillStyle = "#dbe7ff";
        ctx.fillRect(x + width / 2 - 10, y + 2, 20, height - 8);
        ctx.fillStyle = "#f7fbff";
        ctx.fillRect(x + width / 2 - 14, y + 2, 28, 28);
        ctx.fillStyle = "#29344f";
        ctx.fillRect(x + width / 2 - 1, y + 10, 2, 8);
        ctx.fillRect(x + width / 2 - 6, y + 13, 7, 2);
      } else if (kind === "surface") {
        ctx.fillStyle = "#55cfff";
        ctx.fillRect(x + 3, y + 10, width - 6, 10);
        ctx.fillStyle = "#bdf6ff";
        ctx.fillRect(x + 6, y + 6, width - 12, 4);
        ctx.fillStyle = "#dffcff";
        ctx.fillRect(x + 10, y + 18, width - 20, 3);
      } else {
        ctx.fillStyle = "#d8d3ef";
        ctx.fillRect(x + 4, y + 2, width - 8, height - 8);
        ctx.fillStyle = "#98a2c4";
        ctx.fillRect(x + 7, y + 5, width - 14, height - 14);
      }

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);
      ctx.restore();
    }

    drawSurvivorEnemySprite(enemy, screenX, screenY, options) {
      var ctx = this.ctx;
      var opts = options || {};
      var r = enemy.radius || 16;
      var pulse = opts.pulse || 0;
      var bob = Math.sin(pulse + (enemy.spawnTimeSec || 0)) * Math.max(2, r * 0.08);
      var x = Math.round(screenX);
      var y = Math.round(screenY + bob);
      var shadowY = y + r * 0.8;

      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
      ctx.beginPath();
      ctx.ellipse(x, shadowY, r * 0.9, Math.max(4, r * 0.28), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.translate(x, y);

      switch (enemy.archetypeId) {
        case "semiScout":
          ctx.fillStyle = "#ffcf80";
          ctx.beginPath();
          ctx.ellipse(-r * 0.35, 0, r * 0.45, r * 0.28, -0.4, 0, Math.PI * 2);
          ctx.ellipse(r * 0.35, 0, r * 0.45, r * 0.28, 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#4b2f20";
          ctx.beginPath();
          ctx.ellipse(0, 0, r * 0.42, r * 0.62, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fff4d8";
          ctx.fillRect(-r * 0.12, -r * 0.14, r * 0.08, r * 0.08);
          ctx.fillRect(r * 0.04, -r * 0.14, r * 0.08, r * 0.08);
          break;
        case "heatHazeSmall":
          ctx.fillStyle = "#ff9f59";
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(r * 0.75, -r * 0.2);
          ctx.lineTo(r * 0.4, r);
          ctx.lineTo(-r * 0.45, r * 0.7);
          ctx.lineTo(-r * 0.8, -r * 0.1);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#ffe0a8";
          ctx.fillRect(-r * 0.15, -r * 0.2, r * 0.3, r * 0.55);
          break;
        case "rumorWisp":
          ctx.fillStyle = "#d9d1ff";
          ctx.beginPath();
          ctx.arc(0, -r * 0.2, r * 0.65, Math.PI, 0);
          ctx.lineTo(r * 0.48, r * 0.8);
          ctx.lineTo(0, r * 0.45);
          ctx.lineTo(-r * 0.48, r * 0.8);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#2d1c50";
          ctx.fillRect(-r * 0.18, -r * 0.08, r * 0.12, r * 0.12);
          ctx.fillRect(r * 0.05, -r * 0.08, r * 0.12, r * 0.12);
          break;
        case "chlorineShade":
          ctx.fillStyle = "#78d8ff";
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.bezierCurveTo(r * 0.85, -r * 0.3, r * 0.7, r * 0.7, 0, r);
          ctx.bezierCurveTo(-r * 0.7, r * 0.7, -r * 0.85, -r * 0.3, 0, -r);
          ctx.fill();
          ctx.fillStyle = "#e6fbff";
          ctx.beginPath();
          ctx.arc(-r * 0.2, -r * 0.1, r * 0.18, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "marketShadow":
          ctx.fillStyle = "#7a5af8";
          ctx.fillRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
          ctx.fillStyle = "#cbb7ff";
          ctx.fillRect(-r * 0.45, -r * 0.45, r * 0.26, r * 0.26);
          ctx.fillRect(r * 0.18, -r * 0.45, r * 0.26, r * 0.26);
          ctx.strokeStyle = "#d9d1ff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-r * 0.52, r * 0.35);
          ctx.lineTo(r * 0.52, -r * 0.35);
          ctx.stroke();
          break;
        case "stallLantern":
          ctx.fillStyle = "#e5933d";
          ctx.fillRect(-r * 0.48, -r * 0.35, r * 0.96, r * 1.1);
          ctx.fillStyle = "#ffd76f";
          ctx.fillRect(-r * 0.2, -r * 0.05, r * 0.4, r * 0.45);
          ctx.strokeStyle = "#fff1c4";
          ctx.lineWidth = 2;
          ctx.strokeRect(-r * 0.58, -r * 0.48, r * 1.16, r * 1.36);
          ctx.beginPath();
          ctx.moveTo(-r * 0.24, -r * 0.48);
          ctx.lineTo(0, -r * 0.8);
          ctx.lineTo(r * 0.24, -r * 0.48);
          ctx.stroke();
          break;
        case "poolRemnant":
          ctx.fillStyle = "#3f6f8d";
          ctx.fillRect(-r * 0.95, -r * 0.62, r * 1.9, r * 1.24);
          ctx.fillStyle = "#bdefff";
          ctx.fillRect(-r * 0.68, -r * 0.22, r * 1.36, r * 0.22);
          ctx.strokeStyle = "#d9f6ff";
          ctx.lineWidth = 2;
          ctx.strokeRect(-r * 0.95, -r * 0.62, r * 1.9, r * 1.24);
          break;
        case "summerWall":
          ctx.fillStyle = "#7b4d36";
          ctx.fillRect(-r, -r * 0.72, r * 2, r * 1.44);
          ctx.fillStyle = "#9f664a";
          ctx.fillRect(-r, -r * 0.12, r * 2, r * 0.18);
          ctx.fillRect(-r * 0.2, -r * 0.72, r * 0.18, r * 1.44);
          ctx.fillRect(r * 0.42, -r * 0.72, r * 0.18, r * 1.44);
          break;
        case "clockNeedleHound":
          ctx.fillStyle = "#c9d8ff";
          ctx.beginPath();
          ctx.moveTo(r, 0);
          ctx.lineTo(-r * 0.15, -r * 0.72);
          ctx.lineTo(-r * 0.8, -r * 0.28);
          ctx.lineTo(-r * 0.8, r * 0.28);
          ctx.lineTo(-r * 0.15, r * 0.72);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#445987";
          ctx.fillRect(-r * 0.18, -r * 0.12, r * 0.22, r * 0.24);
          break;
        case "noonCompressor":
          ctx.fillStyle = "#ff7f58";
          ctx.fillRect(-r * 0.72, -r * 0.72, r * 1.44, r * 1.44);
          ctx.fillStyle = "#fff0d5";
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ffcf80";
          ctx.lineWidth = 2;
          ctx.strokeRect(-r * 0.86, -r * 0.86, r * 1.72, r * 1.72);
          break;
        case "middayShadow":
          ctx.fillStyle = "#ff8b6c";
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#2f1214";
          ctx.fillRect(-r * 0.36, -r * 0.18, r * 0.2, r * 0.16);
          ctx.fillRect(r * 0.16, -r * 0.18, r * 0.2, r * 0.16);
          ctx.fillRect(-r * 0.2, r * 0.24, r * 0.4, r * 0.12);
          break;
        case "rumorBeast":
          ctx.fillStyle = "#7d5dff";
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(r * 0.72, -r * 0.2);
          ctx.lineTo(r * 0.55, r * 0.82);
          ctx.lineTo(-r * 0.55, r * 0.82);
          ctx.lineTo(-r * 0.72, -r * 0.2);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#fff4d8";
          ctx.fillRect(-r * 0.34, -r * 0.12, r * 0.18, r * 0.18);
          ctx.fillRect(r * 0.16, -r * 0.12, r * 0.18, r * 0.18);
          break;
        case "afternoonShard":
          ctx.fillStyle = "#74d6ff";
          ctx.beginPath();
          ctx.moveTo(0, -r * 1.08);
          ctx.lineTo(r * 0.82, 0);
          ctx.lineTo(0, r * 1.08);
          ctx.lineTo(-r * 0.82, 0);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#e4fbff";
          ctx.fillRect(-r * 0.12, -r * 0.48, r * 0.24, r * 0.96);
          break;
        case "signalCrab":
          ctx.fillStyle = "#ff9868";
          ctx.beginPath();
          ctx.ellipse(0, 0, r * 0.72, r * 0.48, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(-r * 0.96, -r * 0.22, r * 0.32, r * 0.12);
          ctx.fillRect(r * 0.64, -r * 0.22, r * 0.32, r * 0.12);
          ctx.fillRect(-r * 0.76, r * 0.12, r * 0.28, r * 0.12);
          ctx.fillRect(r * 0.48, r * 0.12, r * 0.28, r * 0.12);
          ctx.fillStyle = "#fff4d8";
          ctx.fillRect(-r * 0.22, -r * 0.08, r * 0.12, r * 0.12);
          ctx.fillRect(r * 0.1, -r * 0.08, r * 0.12, r * 0.12);
          break;
        case "iceCreamBat":
          ctx.fillStyle = "#7fe6ff";
          ctx.beginPath();
          ctx.moveTo(0, -r * 0.2);
          ctx.lineTo(-r * 0.92, -r * 0.58);
          ctx.lineTo(-r * 0.44, 0);
          ctx.lineTo(-r * 0.92, r * 0.28);
          ctx.lineTo(0, r * 0.48);
          ctx.lineTo(r * 0.92, r * 0.28);
          ctx.lineTo(r * 0.44, 0);
          ctx.lineTo(r * 0.92, -r * 0.58);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#fff1c4";
          ctx.fillRect(-r * 0.16, -r * 0.1, r * 0.12, r * 0.12);
          ctx.fillRect(r * 0.04, -r * 0.1, r * 0.12, r * 0.12);
          break;
        case "speakerTotem":
          ctx.fillStyle = "#5e6b86";
          ctx.fillRect(-r * 0.66, -r * 0.92, r * 1.32, r * 1.84);
          ctx.fillStyle = "#b3c2e0";
          ctx.beginPath();
          ctx.arc(0, -r * 0.24, r * 0.26, 0, Math.PI * 2);
          ctx.arc(0, r * 0.36, r * 0.18, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#d6e4ff";
          ctx.lineWidth = 2;
          ctx.strokeRect(-r * 0.76, -r, r * 1.52, r * 2);
          break;
        case "shadeRunner":
          ctx.fillStyle = "#28141c";
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(r * 0.7, -r * 0.12);
          ctx.lineTo(r * 0.24, r);
          ctx.lineTo(-r * 0.24, r);
          ctx.lineTo(-r * 0.7, -r * 0.12);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#ff8a70";
          ctx.fillRect(-r * 0.2, -r * 0.12, r * 0.14, r * 0.14);
          ctx.fillRect(r * 0.06, -r * 0.12, r * 0.14, r * 0.14);
          break;
        case "mirrorMoth":
          ctx.fillStyle = "#d8c7ff";
          ctx.beginPath();
          ctx.moveTo(0, -r * 0.92);
          ctx.lineTo(-r * 0.88, -r * 0.24);
          ctx.lineTo(-r * 0.3, r * 0.16);
          ctx.lineTo(-r * 0.84, r * 0.82);
          ctx.lineTo(0, r * 0.34);
          ctx.lineTo(r * 0.84, r * 0.82);
          ctx.lineTo(r * 0.3, r * 0.16);
          ctx.lineTo(r * 0.88, -r * 0.24);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#5d4ea0";
          ctx.fillRect(-r * 0.08, -r * 0.66, r * 0.16, r * 1.18);
          break;
        case "sunspotMine":
          ctx.fillStyle = "#ffcf80";
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.56, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#fff1c4";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(0, -r * 0.6);
          ctx.moveTo(r * 0.72, -r * 0.72);
          ctx.lineTo(r * 0.42, -r * 0.42);
          ctx.moveTo(r, 0);
          ctx.lineTo(r * 0.6, 0);
          ctx.moveTo(r * 0.72, r * 0.72);
          ctx.lineTo(r * 0.42, r * 0.42);
          ctx.moveTo(0, r);
          ctx.lineTo(0, r * 0.6);
          ctx.moveTo(-r * 0.72, r * 0.72);
          ctx.lineTo(-r * 0.42, r * 0.42);
          ctx.moveTo(-r, 0);
          ctx.lineTo(-r * 0.6, 0);
          ctx.moveTo(-r * 0.72, -r * 0.72);
          ctx.lineTo(-r * 0.42, -r * 0.42);
          ctx.stroke();
          break;
        case "heatIdol":
          ctx.fillStyle = "#ffb86f";
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(r * 0.68, -r * 0.24);
          ctx.lineTo(r * 0.52, r * 0.94);
          ctx.lineTo(-r * 0.52, r * 0.94);
          ctx.lineTo(-r * 0.68, -r * 0.24);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#fff1c4";
          ctx.fillRect(-r * 0.2, -r * 0.16, r * 0.14, r * 0.14);
          ctx.fillRect(r * 0.06, -r * 0.16, r * 0.14, r * 0.14);
          ctx.fillRect(-r * 0.12, r * 0.24, r * 0.24, r * 0.1);
          break;
        case "stationLord":
        case "arcadeLord":
        case "poolLord":
        case "festivalLord":
        case "clockLord":
          ctx.fillStyle = enemy.archetypeId === "clockLord" ? "#d9d1ff" : "#f6c453";
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#fff1c4";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "#2d1c18";
          ctx.fillRect(-r * 0.32, -r * 0.16, r * 0.18, r * 0.14);
          ctx.fillRect(r * 0.14, -r * 0.16, r * 0.18, r * 0.14);
          ctx.fillRect(-r * 0.16, r * 0.22, r * 0.32, r * 0.1);
          break;
        default:
          ctx.fillStyle = enemy.category === "boss" ? "#f6c453" : "#ffb347";
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
          ctx.fill();
          break;
      }

      ctx.restore();
    }

    drawBattleEnemySprite(chapterId, x, y, width, height, accent) {
      var ctx = this.ctx;
      var px = Math.round(x);
      var py = Math.round(y);
      var w = Math.round(width);
      var h = Math.round(height);
      var color = accent || "#ff8a65";

      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
      ctx.fillRect(px + 12, py + h - 14, w - 24, 10);
      ctx.fillStyle = color;

      switch (chapterId) {
        case 1:
          ctx.fillRect(px + 26, py + 26, w - 52, h - 52);
          ctx.fillRect(px + 36, py + 16, w - 72, 16);
          break;
        case 2:
          ctx.fillRect(px + 22, py + 26, w - 44, h - 46);
          ctx.fillRect(px + 10, py + 44, 20, 20);
          ctx.fillRect(px + w - 30, py + 44, 20, 20);
          break;
        case 3:
          ctx.fillRect(px + 30, py + 18, w - 60, h - 36);
          ctx.fillRect(px + 18, py + 40, 20, 20);
          ctx.fillRect(px + w - 38, py + 40, 20, 20);
          break;
        case 4:
          ctx.fillRect(px + 18, py + 24, w - 36, h - 48);
          ctx.fillRect(px + 32, py + 38, w - 64, 18);
          break;
        case 5:
          ctx.fillRect(px + 28, py + 16, w - 56, h - 32);
          ctx.fillRect(px + 18, py + 30, 18, 18);
          ctx.fillRect(px + w - 36, py + 30, 18, 18);
          break;
        case 6:
          ctx.fillRect(px + 18, py + 18, w - 36, h - 36);
          ctx.fillRect(px + 6, py + 36, 22, 22);
          ctx.fillRect(px + w - 28, py + 36, 22, 22);
          ctx.fillRect(px + 36, py + h - 36, w - 72, 12);
          break;
        default:
          ctx.fillRect(px + 14, py + 14, w - 28, h - 28);
          ctx.fillRect(px + 28, py + 30, w - 56, 18);
          break;
      }

      ctx.fillStyle = "#1c1414";
      ctx.fillRect(px + 34, py + 40, 12, 8);
      ctx.fillRect(px + w - 46, py + 40, 12, 8);
      ctx.fillStyle = "#fff1eb";
      ctx.fillRect(px + 38, py + 42, 4, 4);
      ctx.fillRect(px + w - 42, py + 42, 4, 4);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, w, h);
      ctx.restore();
    }

    drawMapObstacle(obstacle, fill, shade) {
      var ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
      ctx.fillRect(obstacle.x + 6, obstacle.y + 6, obstacle.width, obstacle.height);
      ctx.fillStyle = fill;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.fillStyle = shade;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, 8);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
      ctx.lineWidth = 1;
      for (var y = obstacle.y + 12; y < obstacle.y + obstacle.height; y += 12) {
        ctx.beginPath();
        ctx.moveTo(obstacle.x + 2, y);
        ctx.lineTo(obstacle.x + obstacle.width - 2, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawChapterBackdrop(chapterId, room) {
      var ctx = this.ctx;
      var tileSize = 32;
      var baseA = room.background;
      var baseB = room.stripe;
      var tx;
      var ty;

      for (ty = 0; ty < this.canvas.height; ty += tileSize) {
        for (tx = 0; tx < this.canvas.width; tx += tileSize) {
          ctx.fillStyle = ((tx / tileSize + ty / tileSize) % 2 === 0) ? baseA : baseB;
          ctx.fillRect(tx, ty, tileSize, tileSize);
          ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
          ctx.fillRect(tx, ty, 4, 4);
        }
      }

      ctx.save();
      switch (chapterId) {
        case 1:
          ctx.fillStyle = "rgba(255, 219, 138, 0.12)";
          ctx.fillRect(0, 120, this.canvas.width, 120);
          ctx.fillStyle = "#916240";
          ctx.fillRect(0, 540, this.canvas.width, 70);
          ctx.fillStyle = "#f2d9b2";
          for (tx = 48; tx < 280; tx += 48) {
            ctx.fillRect(tx, 564, 24, 10);
          }
          ctx.fillStyle = "#62402e";
          ctx.fillRect(32, 94, 260, 24);
          ctx.fillRect(40, 420, 180, 16);
          ctx.fillRect(290, 420, 124, 16);
          ctx.fillStyle = "#ffdb80";
          ctx.fillRect(54, 100, 72, 12);
          ctx.fillRect(138, 100, 104, 12);
          break;
        case 2:
          ctx.fillStyle = "#4a2a18";
          ctx.fillRect(0, 96, this.canvas.width, 84);
          ctx.fillStyle = "#ffcc6e";
          for (tx = 40; tx < this.canvas.width; tx += 72) {
            ctx.fillRect(tx, 112, 40, 18);
          }
          ctx.fillStyle = "#6b3d26";
          for (tx = 26; tx < this.canvas.width; tx += 154) {
            ctx.fillRect(tx, 206, 110, 78);
            ctx.fillRect(tx + 8, 196, 94, 12);
          }
          break;
        case 3:
          ctx.fillStyle = "#4dbcf3";
          ctx.fillRect(540, 90, 300, 250);
          ctx.fillStyle = "#d8f5ff";
          for (ty = 104; ty < 320; ty += 24) {
            ctx.fillRect(556, ty, 268, 6);
          }
          ctx.fillStyle = "#95dfff";
          for (tx = 84; tx < 470; tx += 80) {
            ctx.fillRect(tx, 120, 44, 18);
          }
          ctx.fillStyle = "#2f6578";
          ctx.fillRect(552, 340, 272, 22);
          break;
        case 4:
          ctx.fillStyle = "#4b4d57";
          ctx.fillRect(0, 522, this.canvas.width, 90);
          ctx.fillStyle = "#8a8d99";
          ctx.fillRect(0, 554, this.canvas.width, 8);
          ctx.fillRect(0, 582, this.canvas.width, 8);
          ctx.fillStyle = "#272932";
          ctx.fillRect(0, 170, this.canvas.width, 26);
          for (tx = 24; tx < this.canvas.width; tx += 92) {
            ctx.fillRect(tx, 198, 56, 10);
          }
          break;
        case 5:
          ctx.fillStyle = "#55223f";
          ctx.fillRect(0, 96, this.canvas.width, 90);
          ctx.fillStyle = "#ffbbeb";
          for (tx = 54; tx < this.canvas.width; tx += 82) {
            ctx.fillRect(tx, 110, 8, 22);
            ctx.fillRect(tx - 10, 132, 28, 14);
          }
          ctx.fillStyle = "#7d315b";
          ctx.fillRect(0, 510, this.canvas.width, 34);
          for (tx = 34; tx < this.canvas.width; tx += 116) {
            ctx.fillRect(tx, 472, 60, 38);
          }
          break;
        case 6:
          ctx.fillStyle = "#7b3b23";
          ctx.beginPath();
          ctx.arc(482, 344, 150, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#d7b982";
          ctx.beginPath();
          ctx.arc(482, 344, 78, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#4b2214";
          ctx.fillRect(436, 126, 92, 132);
          ctx.fillRect(452, 86, 60, 40);
          break;
        default:
          ctx.fillStyle = "#2c5d7a";
          ctx.fillRect(0, 116, this.canvas.width, 340);
          ctx.fillStyle = "#a5efff";
          for (ty = 132; ty < 430; ty += 32) {
            ctx.fillRect(50, ty, this.canvas.width - 100, 6);
          }
          ctx.fillStyle = "#1c3545";
          ctx.fillRect(380, 90, 200, 64);
          ctx.fillRect(422, 154, 116, 80);
          break;
      }
      ctx.restore();

      var obstacleFill = "#5a4232";
      var obstacleShade = "#7b5a44";
      if (chapterId === 3) {
        obstacleFill = "#31586d";
        obstacleShade = "#4b7f98";
      } else if (chapterId === 4) {
        obstacleFill = "#414353";
        obstacleShade = "#5e6173";
      } else if (chapterId === 5) {
        obstacleFill = "#562949";
        obstacleShade = "#7f3d69";
      } else if (chapterId === 6) {
        obstacleFill = "#5d2f1d";
        obstacleShade = "#8a4b31";
      } else if (chapterId === 7) {
        obstacleFill = "#284f70";
        obstacleShade = "#3c769f";
      }

      room.obstacles.forEach((obstacle) => {
        this.drawMapObstacle(obstacle, obstacleFill, obstacleShade);
      });
    }

    drawInteractiveSpot(interactive, accent) {
      var x = interactive.x;
      var y = interactive.y;
      var w = interactive.width;
      var h = interactive.height;
      var fill = accent || "#f6c453";

      this.drawPanel(x, y, w, h, {
        fill: "rgba(12, 12, 12, 0.85)",
        border: fill
      });

      if (interactive.type === "puzzle") {
        this.drawText("?", x + w / 2, y + 10, {
          size: 22,
          align: "center",
          color: fill
        });
      } else if (interactive.type === "rest") {
        this.drawText("+", x + w / 2, y + 10, {
          size: 22,
          align: "center",
          color: "#88f291"
        });
      } else {
        this.drawText("*", x + w / 2, y + 10, {
          size: 22,
          align: "center",
          color: fill
        });
      }

      this.drawText(interactive.label, x + w / 2, y + h + 4, {
        size: 12,
        align: "center",
        color: "#f0e6cf"
      });
    }

    drawHeart(x, y, size, color) {
      var s = size || 9;
      this.ctx.fillStyle = color || ns.constants.COLORS.soul;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + s / 2);
      this.ctx.bezierCurveTo(x, y, x - s, y, x - s, y + s / 2);
      this.ctx.bezierCurveTo(x - s, y + s, x, y + s * 1.2, x, y + s * 1.6);
      this.ctx.bezierCurveTo(x, y + s * 1.2, x + s, y + s, x + s, y + s / 2);
      this.ctx.bezierCurveTo(x + s, y, x, y, x, y + s / 2);
      this.ctx.fill();
    }
  };
})(window.ManatsuRPG = window.ManatsuRPG || {});
