// -*- coding: utf-8 -*-
// static/js/actions/shared.js
// Statutory Kinetic Studio - Shared Action Engine Primitives
// Clean, reusable vector primitives snapped to 8px grid with 1.5px strokes and 2-layer shadows.

(function() {
  const SHARED_DRAW = {
    /**
     * Draws a card container with optional 2-layer subtle shadow
     */
    card(ctx, x, y, w, h, options = {}) {
      const radius = options.radius !== undefined ? options.radius : window.THEME.radii.md;
      const fill = options.fill || "#FFFFFF";
      const stroke = options.stroke || window.THEME.getThemeColors().border;
      const lineWidth = options.lineWidth !== undefined ? options.lineWidth : window.THEME.strokeWidth;

      ctx.save();
      if (options.shadow !== false) {
        // Ambient shadow
        ctx.shadowColor = "rgba(15, 23, 42, 0.04)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
      }

      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    },

    /**
     * Draws a status pill or tag with optional icon
     */
    pill(ctx, text, x, y, options = {}) {
      ctx.save();
      ctx.font = options.font || window.THEME.typography.monoBadge;
      const metrics = ctx.measureText(text);
      const hasIcon = !!options.icon;
      const iconSize = 14;
      const padX = 10;
      const padY = 4;
      const h = 22;
      const w = metrics.width + (padX * 2) + (hasIcon ? (iconSize + 4) : 0);

      let fill = options.fill || window.THEME.colors.accent.indigo.light;
      let textFill = options.textFill || window.THEME.colors.accent.indigo.main;
      let stroke = options.stroke || window.THEME.colors.accent.indigo.border;

      // Dark mode contrast enhancement for semantic tint pills
      if (window.THEME && window.THEME.mode === "dark") {
        if (fill === window.THEME.colors.accent.emerald.light) fill = "rgba(5, 150, 105, 0.22)";
        else if (fill === window.THEME.colors.accent.indigo.light) fill = "rgba(79, 70, 229, 0.22)";
        else if (fill === window.THEME.colors.accent.amber.light) fill = "rgba(217, 119, 6, 0.22)";
        else if (fill === window.THEME.colors.accent.crimson.light) fill = "rgba(220, 38, 38, 0.22)";

        if (textFill === window.THEME.colors.accent.emerald.main) textFill = "#34D399";
        else if (textFill === window.THEME.colors.accent.indigo.main) textFill = "#818CF8";
        else if (textFill === window.THEME.colors.accent.amber.main) textFill = "#FBBF24";
        else if (textFill === window.THEME.colors.accent.crimson.main) textFill = "#F87171";
      }

      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, window.THEME.radii.sm);
      ctx.fill();
      ctx.stroke();

      let textStartX = x + padX;
      if (hasIcon) {
        window.ICONS.draw(ctx, options.icon, textStartX + (iconSize / 2), y + (h / 2), iconSize, textFill);
        textStartX += iconSize + 4;
      }

      ctx.fillStyle = textFill;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(text, textStartX, y + (h / 2));

      ctx.restore();
      return w;
    },

    /**
     * Requirement 5: Universal Indian number grouping (en-IN, e.g. ₹99,99,99,999)
     */
    formatIndianNumber(num) {
      if (num === null || num === undefined || isNaN(Number(num))) return String(num ?? "");
      return Number(num).toLocaleString("en-IN");
    },

    formatIndianCurrency(amount, symbol = "₹") {
      if (typeof amount === "string") {
        const numClean = amount.replace(/[^0-9.]/g, "");
        if (numClean && !isNaN(Number(numClean))) {
          return `${symbol}${Number(numClean).toLocaleString("en-IN")}`;
        }
        return amount;
      }
      if (typeof amount === "number") {
        return `${symbol}${amount.toLocaleString("en-IN")}`;
      }
      return `${symbol}${amount}`;
    },

    /**
     * Draws high-contrast tabular number counter (e.g. currency amounts) with Indian grouping
     */
    counter(ctx, currentVal, targetVal, x, y, options = {}) {
      ctx.save();
      ctx.font = options.font || window.THEME.typography.monoStat;
      ctx.fillStyle = options.color || window.THEME.getThemeColors().textPrimary;
      ctx.textAlign = options.align || "center";
      ctx.textBaseline = options.baseline || "middle";

      let text;
      if (options.formatter) {
        text = options.formatter(currentVal);
      } else if (typeof currentVal === "number") {
        text = currentVal.toLocaleString("en-IN");
      } else {
        text = String(currentVal);
      }
      ctx.fillText(text, x, y);
      ctx.restore();
    },

    /**
     * Draws a smooth quadratic trajectory arc with dashed guide and traveling particle/token
     */
    trajectoryArc(ctx, x1, y1, x2, y2, peakOffset = -80, progress = 0, color = "#D97706") {
      const midX = (x1 + x2) / 2;
      const midY = Math.min(y1, y2) + peakOffset;

      ctx.save();
      // 1. Dashed trajectory path
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(midX, midY, x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;

      // 2. Position of projectile at progress t: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
      const t = window.TWEEN.clamp(progress, 0, 1);
      const oneMinusT = 1 - t;
      const curX = (oneMinusT * oneMinusT * x1) + (2 * oneMinusT * t * midX) + (t * t * x2);
      const curY = (oneMinusT * oneMinusT * y1) + (2 * oneMinusT * t * midY) + (t * t * y2);

      // Tangent angle
      const dx = 2 * oneMinusT * (midX - x1) + 2 * t * (x2 - midX);
      const dy = 2 * oneMinusT * (midY - y1) + 2 * t * (y2 - midY);
      const angle = Math.atan2(dy, dx);

      ctx.restore();
      return { x: curX, y: curY, angle };
    }
  };

  window.SHARED_DRAW = SHARED_DRAW;
})();
