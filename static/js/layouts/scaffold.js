// -*- coding: utf-8 -*-
// static/js/layouts/scaffold.js
// Statutory Kinetic Studio - Stage Scaffold & Region Bounding System
// Strict non-overlapping 3-region layout geometry inside locked 1280x720 logical canvas.

(function() {
  const STAGE_W = 1280;
  const STAGE_H = 720;
  const MARGIN_X = 48;
  const MARGIN_Y = 32;

  // Region Definitions
  const REGIONS = {
    // 1. Header Region (x: 48, y: 32, w: 1184, h: 48)
    header: {
      x: MARGIN_X,
      y: MARGIN_Y,
      w: STAGE_W - (MARGIN_X * 2), // 1184
      h: 48
    },

    // 2. Main Stage Region (x: 48, y: 96, w: 1184, h: 480)
    // Dedicated exclusively to the layout frame and action engine. Zero overlap guaranteed!
    mainStage: {
      x: MARGIN_X,
      y: 96,
      w: STAGE_W - (MARGIN_X * 2), // 1184
      h: 480
    },

    // 3. Caption Region (x: 48, y: 592, w: 1184, h: 96)
    // Auto-fit measured 2-line teacher caption bar
    caption: {
      x: MARGIN_X,
      y: 592,
      w: STAGE_W - (MARGIN_X * 2), // 1184
      h: 96
    }
  };

  const SCAFFOLD = {
    STAGE_WIDTH: STAGE_W,
    STAGE_HEIGHT: STAGE_H,
    REGIONS: REGIONS,

    /**
     * Clears and draws the refined background with subtle vignette
     */
    drawBackground(ctx, themeColors) {
      // 1. Base clean background
      ctx.fillStyle = themeColors.bg;
      ctx.fillRect(0, 0, STAGE_W, STAGE_H);

      // 2. Very subtle corner vignette (top-left light source: center slightly offset)
      const grad = ctx.createRadialGradient(
        STAGE_W * 0.45, STAGE_H * 0.4, STAGE_W * 0.25,
        STAGE_W * 0.5, STAGE_H * 0.5, STAGE_W * 0.75
      );
      grad.addColorStop(0, "rgba(255, 255, 255, 0.4)");
      grad.addColorStop(1, "rgba(15, 23, 42, 0.035)");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    },

    /**
     * Renders the unified header:
     * - Act & Section Badge
     * - Scene Title & Phase Indicator
     * - Segmented Line Beat Dots (replaces wide pills)
     */
    drawHeader(ctx, meta, themeColors, activeLineIdx = 0, totalLines = 3) {
      const r = REGIONS.header;
      ctx.save();

      // Background Card
      ctx.fillStyle = themeColors.headerBg;
      ctx.strokeStyle = themeColors.border;
      ctx.lineWidth = window.THEME.strokeWidth;
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, window.THEME.radii.md);
      ctx.fill();
      ctx.stroke();

      // Left Meta: Act Badge + Section Badge
      let curX = r.x + 16;
      const centerY = r.y + r.h / 2;

      // Act Badge
      const actText = (meta.act_name || "Statutory Law").toUpperCase();
      ctx.font = window.THEME.typography.monoBadge;
      const actWidth = ctx.measureText(actText).width + 16;
      ctx.fillStyle = window.THEME.colors.accent.indigo.light;
      ctx.strokeStyle = window.THEME.colors.accent.indigo.border;
      ctx.beginPath();
      ctx.roundRect(curX, centerY - 12, actWidth, 24, window.THEME.radii.sm);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = window.THEME.colors.accent.indigo.main;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(actText, curX + actWidth / 2, centerY);

      curX += actWidth + 10;

      // Section Badge
      const secText = (meta.section_code || "Section").toUpperCase();
      const secWidth = ctx.measureText(secText).width + 16;
      ctx.fillStyle = window.THEME.colors.accent.emerald.light;
      ctx.strokeStyle = window.THEME.colors.accent.emerald.border;
      ctx.beginPath();
      ctx.roundRect(curX, centerY - 12, secWidth, 24, window.THEME.radii.sm);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = window.THEME.colors.accent.emerald.main;
      ctx.fillText(secText, curX + secWidth / 2, centerY);

      curX += secWidth + 16;

      // Scene Title
      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.textAlign = "left";
      const title = meta.tab_title || meta.core_doctrine || "Statutory Breakdown";
      // Truncate title if needed to prevent collision with dots
      const maxTitleW = r.w - (curX - r.x) - 180;
      let displayTitle = title;
      if (ctx.measureText(displayTitle).width > maxTitleW) {
        while (displayTitle.length > 3 && ctx.measureText(displayTitle + "…").width > maxTitleW) {
          displayTitle = displayTitle.slice(0, -1);
        }
        displayTitle += "…";
      }
      ctx.fillText(displayTitle, curX, centerY);

      // Right: Segmented Progress Dots
      const dotRadius = 4;
      const dotSpacing = 16;
      const totalDotsW = (totalLines - 1) * dotSpacing;
      let dotX = r.x + r.w - 24 - totalDotsW;

      for (let i = 0; i < totalLines; i++) {
        ctx.beginPath();
        ctx.arc(dotX, centerY, dotRadius, 0, Math.PI * 2);
        if (i === activeLineIdx) {
          ctx.fillStyle = window.THEME.colors.accent.indigo.main;
          ctx.fill();
          // Active dot pulse ring
          ctx.strokeStyle = window.THEME.colors.accent.indigo.border;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(dotX, centerY, dotRadius + 3, 0, Math.PI * 2);
          ctx.stroke();
        } else if (i < activeLineIdx) {
          ctx.fillStyle = window.THEME.colors.accent.emerald.main;
          ctx.fill();
        } else {
          ctx.fillStyle = themeColors.border;
          ctx.fill();
        }
        dotX += dotSpacing;
      }

      ctx.restore();
    },

    /**
     * Renders measured, auto-fit 2-line teacher caption bar
     * Supports Noto Sans Malayalam script and English legal terminology with zero clipping
     */
    drawCaption(ctx, sentenceText, lineTitle, themeColors) {
      const r = REGIONS.caption;
      ctx.save();

      // Card Surface
      ctx.fillStyle = themeColors.captionBg;
      ctx.strokeStyle = themeColors.border;
      ctx.lineWidth = window.THEME.strokeWidth;
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, window.THEME.radii.md);
      ctx.fill();
      ctx.stroke();

      // Top Tag: Line Title / Focus
      const padX = 20;
      let curY = r.y + 20;

      if (lineTitle) {
        ctx.font = window.THEME.typography.captionBold;
        ctx.fillStyle = window.THEME.colors.accent.indigo.main;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(lineTitle.toUpperCase(), r.x + padX, curY);
        curY += 22;
      }

      // Sentence Text (Measured 2-line wrapping with auto font size)
      const maxW = r.w - (padX * 2);
      let fontSize = 15;
      ctx.font = `600 ${fontSize}px 'Plus Jakarta Sans', 'Noto Sans Malayalam', sans-serif`;

      // Word wrapping logic
      const words = (sentenceText || "").split(" ");
      let lines = [];
      let currentLine = "";

      for (let w of words) {
        let testLine = currentLine ? (currentLine + " " + w) : w;
        if (ctx.measureText(testLine).width <= maxW) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = w;
        }
      }
      if (currentLine) lines.push(currentLine);

      // If more than 2 lines, scale font down slightly or truncate second line with ellipsis
      if (lines.length > 2) {
        fontSize = 13.5;
        ctx.font = `600 ${fontSize}px 'Plus Jakarta Sans', 'Noto Sans Malayalam', sans-serif`;
        lines = [];
        currentLine = "";
        for (let w of words) {
          let testLine = currentLine ? (currentLine + " " + w) : w;
          if (ctx.measureText(testLine).width <= maxW) {
            currentLine = testLine;
          } else {
            if (lines.length === 1) {
              // We're at line 2 and it's full: add ellipsis
              let truncated = currentLine;
              while (truncated.length > 3 && ctx.measureText(truncated + "…").width > maxW) {
                truncated = truncated.slice(0, -1);
              }
              currentLine = truncated + "…";
              lines.push(currentLine);
              break;
            } else {
              lines.push(currentLine);
              currentLine = w;
            }
          }
        }
        if (lines.length < 2 && currentLine) lines.push(currentLine);
      }

      // Render lines
      ctx.fillStyle = themeColors.textPrimary;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      const lineHeight = fontSize + 6;

      for (let i = 0; i < Math.min(lines.length, 2); i++) {
        ctx.fillText(lines[i], r.x + padX, curY + (i * lineHeight));
      }

      ctx.restore();
    }
  };

  // Expose to window
  window.SCAFFOLD = SCAFFOLD;
})();
