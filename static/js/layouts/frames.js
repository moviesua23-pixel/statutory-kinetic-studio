// -*- coding: utf-8 -*-
// static/js/layouts/frames.js
// Statutory Kinetic Studio - 5 Data-Driven Layout Archetype Frame Renderers
// Renders dynamic, law-agnostic structural framing inside mainStageRegion (1184x480).

(function() {
  const FRAMES = {
    /**
     * 1. BILATERAL SPLIT
     * Reads: left_label, right_label, left_role, right_role, status
     * Leaves central corridor (w: 520, h: 480) strictly for kinetic action engine
     */
    layout_bilateral_split(ctx, payload = {}, rect, progress, themeColors) {
      const enterT = window.TWEEN.ease.easeOutCubic(progress);
      const isReduced = window.THEME.prefersReducedMotion();

      const leftLabel = payload.left_label || "Party A (Promisor / Assessee)";
      const leftRole = payload.left_role || "Transferor / Initiator";
      const rightLabel = payload.right_label || "Party B (Promisee / Department)";
      const rightRole = payload.right_role || "Transferee / Adjudicator";

      const cardW = 280;
      const cardH = 360;
      const cardY = rect.y + (rect.h - cardH) / 2;

      // Left Column
      const leftX = rect.x + (isReduced ? 0 : (1 - enterT) * -20);
      ctx.save();
      ctx.globalAlpha = enterT;

      // Card Background & Shadow
      ctx.fillStyle = themeColors.bgCard;
      ctx.strokeStyle = window.THEME.colors.accent.indigo.border;
      ctx.lineWidth = window.THEME.strokeWidth;
      ctx.beginPath();
      ctx.roundRect(leftX, cardY, cardW, cardH, window.THEME.radii.lg);
      ctx.fill();
      ctx.stroke();

      // Top Accent Header
      ctx.fillStyle = window.THEME.colors.accent.indigo.light;
      ctx.beginPath();
      ctx.roundRect(leftX, cardY, cardW, 56, [window.THEME.radii.lg, window.THEME.radii.lg, 0, 0]);
      ctx.fill();
      ctx.stroke();

      // Left Icon & Role Tag
      window.ICONS.draw(ctx, "user", leftX + 32, cardY + 28, 22, window.THEME.colors.accent.indigo.main);
      ctx.font = window.THEME.typography.monoBadge;
      ctx.fillStyle = window.THEME.colors.accent.indigo.main;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("FIRST PARTY", leftX + 54, cardY + 28);

      // Party Label & Subtitle
      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.fillText(leftLabel, leftX + 20, cardY + 95);

      ctx.font = window.THEME.typography.body;
      ctx.fillStyle = themeColors.textSecondary;
      ctx.fillText(leftRole, leftX + 20, cardY + 125);

      // Decorative divider
      ctx.strokeStyle = themeColors.border;
      ctx.beginPath();
      ctx.moveTo(leftX + 20, cardY + 155);
      ctx.lineTo(leftX + cardW - 20, cardY + 155);
      ctx.stroke();

      // Right Column
      const rightX = rect.x + rect.w - cardW + (isReduced ? 0 : (1 - enterT) * 20);
      ctx.fillStyle = themeColors.bgCard;
      ctx.strokeStyle = window.THEME.colors.accent.emerald.border;
      ctx.beginPath();
      ctx.roundRect(rightX, cardY, cardW, cardH, window.THEME.radii.lg);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = window.THEME.colors.accent.emerald.light;
      ctx.beginPath();
      ctx.roundRect(rightX, cardY, cardW, 56, [window.THEME.radii.lg, window.THEME.radii.lg, 0, 0]);
      ctx.fill();
      ctx.stroke();

      window.ICONS.draw(ctx, "building", rightX + 32, cardY + 28, 22, window.THEME.colors.accent.emerald.main);
      ctx.font = window.THEME.typography.monoBadge;
      ctx.fillStyle = window.THEME.colors.accent.emerald.main;
      ctx.fillText("SECOND PARTY", rightX + 54, cardY + 28);

      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.fillText(rightLabel, rightX + 20, cardY + 95);

      ctx.font = window.THEME.typography.body;
      ctx.fillStyle = themeColors.textSecondary;
      ctx.fillText(rightRole, rightX + 20, cardY + 125);

      ctx.strokeStyle = themeColors.border;
      ctx.beginPath();
      ctx.moveTo(rightX + 20, cardY + 155);
      ctx.lineTo(rightX + cardW - 20, cardY + 155);
      ctx.stroke();

      ctx.restore();

      // Return designated action sub-region
      return {
        x: leftX + cardW + 20,
        y: rect.y,
        w: rect.w - (cardW * 2) - 40,
        h: rect.h
      };
    },

    /**
     * 2. SEQUENTIAL PIPELINE
     * Reads: stages[] (array of 2-5 items: { label, detail, status })
     */
    layout_sequential_pipeline(ctx, payload = {}, rect, progress, themeColors) {
      const enterT = window.TWEEN.ease.easeOutCubic(progress);
      const stages = payload.stages || [
        { label: "1. Inception", detail: "Mutual Intention Formed" },
        { label: "2. Execution", detail: "Consideration Exchanged" },
        { label: "3. Satisfaction", detail: "Statutory Discharge" }
      ];

      const n = stages.length;
      const stepW = Math.min(220, (rect.w - 100) / n);
      const totalW = n * stepW + (n - 1) * 30;
      const startX = rect.x + (rect.w - totalW) / 2;
      const conduitY = rect.y + 70;

      ctx.save();
      ctx.globalAlpha = enterT;

      // Horizontal Connecting Conduit Line
      ctx.strokeStyle = themeColors.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX + stepW / 2, conduitY);
      ctx.lineTo(startX + totalW - stepW / 2, conduitY);
      ctx.stroke();

      // Stages
      stages.forEach((st, idx) => {
        const x = startX + idx * (stepW + 30);
        const cardH = 80;

        // Node Circle on Conduit
        ctx.fillStyle = idx === 0 ? window.THEME.colors.accent.indigo.main : themeColors.bgCard;
        ctx.strokeStyle = window.THEME.colors.accent.indigo.main;
        ctx.lineWidth = window.THEME.strokeWidth;
        ctx.beginPath();
        ctx.arc(x + stepW / 2, conduitY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = window.THEME.typography.monoBadge;
        ctx.fillStyle = idx === 0 ? "#FFFFFF" : window.THEME.colors.accent.indigo.main;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(idx + 1), x + stepW / 2, conduitY);

        // Stage Card
        const cardY = conduitY + 24;
        ctx.fillStyle = themeColors.bgCard;
        ctx.strokeStyle = themeColors.border;
        ctx.beginPath();
        ctx.roundRect(x, cardY, stepW, cardH, window.THEME.radii.md);
        ctx.fill();
        ctx.stroke();

        ctx.font = window.THEME.typography.bodyBold;
        ctx.fillStyle = themeColors.textPrimary;
        ctx.fillText(st.label || `Stage ${idx + 1}`, x + stepW / 2, cardY + 24);

        ctx.font = window.THEME.typography.caption;
        ctx.fillStyle = themeColors.textSecondary;
        ctx.fillText(st.detail || "", x + stepW / 2, cardY + 50);
      });

      ctx.restore();

      // Return action stage below pipeline
      return {
        x: rect.x + 40,
        y: conduitY + 120,
        w: rect.w - 80,
        h: rect.h - 190
      };
    },

    /**
     * 3. QUADRANT GRID
     * Reads: quadrants[] (4 items: { title, body, accent })
     */
    layout_quadrant_grid(ctx, payload = {}, rect, progress, themeColors) {
      const enterT = window.TWEEN.ease.easeOutCubic(progress);
      const quads = payload.quadrants || [
        { title: "Condition I", body: "Statutory Competence of Parties", accent: "indigo" },
        { title: "Condition II", body: "Consensus ad Idem & Free Consent", accent: "emerald" },
        { title: "Condition III", body: "Lawful Object & Public Policy", accent: "amber" },
        { title: "Condition IV", body: "Lawful Real Consideration", accent: "crimson" }
      ];

      const gap = 24;
      const qw = (rect.w - gap) / 2;
      const qh = (rect.h - gap) / 2;

      ctx.save();
      ctx.globalAlpha = enterT;

      quads.slice(0, 4).forEach((q, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const qx = rect.x + col * (qw + gap);
        const qy = rect.y + row * (qh + gap);

        const accentName = q.accent || (idx === 0 ? "indigo" : idx === 1 ? "emerald" : idx === 2 ? "amber" : "crimson");
        const accent = window.THEME.colors.accent[accentName] || window.THEME.colors.accent.indigo;

        // Card
        ctx.fillStyle = themeColors.bgCard;
        ctx.strokeStyle = accent.border;
        ctx.lineWidth = window.THEME.strokeWidth;
        ctx.beginPath();
        ctx.roundRect(qx, qy, qw, qh, window.THEME.radii.lg);
        ctx.fill();
        ctx.stroke();

        // Left accent stripe
        ctx.fillStyle = accent.main;
        ctx.beginPath();
        ctx.roundRect(qx, qy, 6, qh, [window.THEME.radii.lg, 0, 0, window.THEME.radii.lg]);
        ctx.fill();

        // Title
        ctx.font = window.THEME.typography.titleBold;
        ctx.fillStyle = themeColors.textPrimary;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(q.title || `Ingredient ${idx + 1}`, qx + 24, qy + 40);

        // Body
        ctx.font = window.THEME.typography.body;
        ctx.fillStyle = themeColors.textSecondary;
        ctx.fillText(q.body || "", qx + 24, qy + 80);

        // Icon
        const iconKey = idx === 0 ? "shield" : idx === 1 ? "checkCircle" : idx === 2 ? "scale" : "fileText";
        window.ICONS.draw(ctx, iconKey, qx + qw - 36, qy + 40, 24, accent.main);
      });

      ctx.restore();

      return rect;
    },

    /**
     * 4. PRECEDENT PARCHMENT
     * Reads: court, case_name, year, ratio_headline
     */
    layout_precedent_parchment(ctx, payload = {}, rect, progress, themeColors) {
      const enterT = window.TWEEN.ease.easeOutCubic(progress);
      const court = payload.court || "SUPREME COURT OF INDIA";
      const caseName = payload.case_name || "Landmark Judicial Precedent";
      const year = payload.year || "2024";
      const ratio = payload.ratio_headline || "Settled Ratio Decidendi & Binding Interpretation";

      const pw = Math.min(840, rect.w);
      const ph = 400;
      const px = rect.x + (rect.w - pw) / 2;
      const py = rect.y + (rect.h - ph) / 2;

      ctx.save();
      ctx.globalAlpha = enterT;

      // Parchment Card
      ctx.fillStyle = themeColors.bgCard;
      ctx.strokeStyle = window.THEME.colors.accent.amber.border;
      ctx.lineWidth = window.THEME.strokeWidth;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, window.THEME.radii.lg);
      ctx.fill();
      ctx.stroke();

      // Stately Gold Ribbon Header
      ctx.fillStyle = window.THEME.colors.accent.amber.light;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, 64, [window.THEME.radii.lg, window.THEME.radii.lg, 0, 0]);
      ctx.fill();
      ctx.stroke();

      window.ICONS.draw(ctx, "award", px + 40, py + 32, 28, window.THEME.colors.accent.amber.main);

      ctx.font = window.THEME.typography.monoBadge;
      ctx.fillStyle = window.THEME.colors.accent.amber.dark;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`${court.toUpperCase()} • ${year}`, px + 68, py + 32);

      // Case Name
      ctx.font = window.THEME.typography.headline;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.fillText(caseName, px + 40, py + 120);

      // Ratio Subtitle
      ctx.font = window.THEME.typography.title;
      ctx.fillStyle = themeColors.textSecondary;
      ctx.fillText(ratio, px + 40, py + 160);

      // Horizontal separator
      ctx.strokeStyle = themeColors.border;
      ctx.beginPath();
      ctx.moveTo(px + 40, py + 195);
      ctx.lineTo(px + pw - 40, py + 195);
      ctx.stroke();

      ctx.restore();

      // Return action stage inside lower parchment
      return {
        x: px + 40,
        y: py + 210,
        w: pw - 80,
        h: ph - 230
      };
    },

    /**
     * 5. HERO STAGE
     * Reads: hero_headline, focal_element
     */
    layout_hero_stage(ctx, payload = {}, rect, progress, themeColors) {
      const enterT = window.TWEEN.ease.easeOutCubic(progress);
      const headline = payload.hero_headline || "";

      ctx.save();
      ctx.globalAlpha = enterT;

      if (headline) {
        ctx.font = window.THEME.typography.titleBold;
        ctx.fillStyle = themeColors.textMuted;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(headline.toUpperCase(), rect.x + rect.w / 2, rect.y + 12);
      }

      // Ground Pedestal Guideline (Flat/clean aesthetic)
      const groundY = rect.y + rect.h - 40;
      ctx.strokeStyle = themeColors.border;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(rect.x + 80, groundY);
      ctx.lineTo(rect.x + rect.w - 80, groundY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();

      return {
        x: rect.x + 60,
        y: rect.y + (headline ? 48 : 20),
        w: rect.w - 120,
        h: rect.h - (headline ? 88 : 60)
      };
    }
  };

  const LAYOUT_FRAMES = {
    render(ctx, archetype, payload, mainStageRect, progress, themeColors) {
      const renderer = FRAMES[archetype] || FRAMES["layout_hero_stage"];
      return renderer(ctx, payload, mainStageRect, progress, themeColors);
    }
  };

  // Expose to window
  window.LAYOUT_FRAMES = LAYOUT_FRAMES;
})();
