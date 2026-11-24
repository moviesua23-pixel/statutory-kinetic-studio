// -*- coding: utf-8 -*-
// static/js/actions/batch2_engines.js
// Statutory Kinetic Studio - Batch 2 Action Engines:
// 1. financial_meter  2. clock_limitation  3. property_transfer  4. condition_checklist
// Strictly renders into given bounds {x, y, w, h}. Reaches final state by 65% and holds stable through 100%.

(function() {
  window.ACTION_ENGINES = window.ACTION_ENGINES || {};

  const BATCH2 = {
    /**
     * ============================================================
     * 1. FINANCIAL METER ENGINE
     * ============================================================
     * Semicircular precision instrument gauge / metric dial with statutory threshold.
     * Tabular count-up with Indian number grouping (en-IN), needle rotation,
     * threshold marker, and settled compliance verdict badge.
     */
    financial_meter(ctx, payload = {}, bounds, phaseState, themeColors, sceneGraph, lineIdx = 0) {
      const p = phaseState.progress;
      const isSettle = p >= 0.65;
      const effectiveP = isSettle ? 1.0 : window.TWEEN.remap(p, 0.15, 0.65, 0, 1);
      const isReduced = window.THEME.prefersReducedMotion();

      const title = payload.title || "Financial Quantum / Statutory Metric";
      const minVal = Number(payload.min_val ?? 0);
      const maxVal = Number(payload.max_val ?? 10000000);
      const targetVal = Number(payload.current_val ?? 7500000);
      const thresholdVal = Number(payload.threshold ?? 5000000);
      const unit = payload.unit || "₹";
      const statusText = payload.status || (targetVal >= thresholdVal ? "STATUTORY THRESHOLD EXCEEDED" : "WITHIN STATUTORY LIMIT");

      const cardW = Math.min(620, bounds.w * 0.85);
      const cardH = Math.min(350, bounds.h * 0.90);
      const cardX = bounds.x + (bounds.w - cardW) / 2;
      const cardY = bounds.y + (bounds.h - cardH) / 2;

      // Gauge geometry
      const gaugeCenterX = cardX + cardW / 2;
      const gaugeCenterY = cardY + cardH * 0.52;
      const gaugeRadius = Math.min(130, cardH * 0.38);

      const startAngle = Math.PI * 0.80; // 144 deg
      const endAngle = Math.PI * 2.20;   // 396 deg (total span: 252 deg)
      const totalSpan = endAngle - startAngle;

      const normTarget = Math.max(0, Math.min(1, (targetVal - minVal) / (maxVal - minVal || 1)));
      const normThreshold = Math.max(0, Math.min(1, (thresholdVal - minVal) / (maxVal - minVal || 1)));

      // Current progress
      const currentNorm = isSettle ? normTarget : (isReduced ? normTarget : normTarget * window.TWEEN.ease.easeOutCubic(effectiveP));
      const currentAngle = startAngle + (currentNorm * totalSpan);
      const thresholdAngle = startAngle + (normThreshold * totalSpan);

      // Keyed actor persistence
      if (sceneGraph) {
        sceneGraph.setLineIndex(lineIdx);
        sceneGraph.resolveActor("actor_financial_meter", { x: cardX, y: cardY }, phaseState.enterT);
      }

      ctx.save();

      // 1. Instrument Dashboard Card
      window.SHARED_DRAW.card(ctx, cardX, cardY, cardW, cardH, {
        fill: themeColors.bgCard,
        stroke: themeColors.borderStrong,
        radius: window.THEME.radii.lg
      });

      // Top Header
      ctx.font = window.THEME.typography.monoBadge;
      ctx.fillStyle = window.THEME.colors.accent.indigo.main;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(title.toUpperCase(), gaugeCenterX, cardY + 28);

      // 2. Semicircular Gauge Track (Background)
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.strokeStyle = themeColors.bgSubtle;
      ctx.beginPath();
      ctx.arc(gaugeCenterX, gaugeCenterY, gaugeRadius, startAngle, endAngle);
      ctx.stroke();

      // Active Value Arc
      const isAboveThreshold = targetVal >= thresholdVal;
      const arcColor = isAboveThreshold ? window.THEME.colors.accent.emerald.main : window.THEME.colors.accent.indigo.main;
      ctx.strokeStyle = arcColor;
      ctx.beginPath();
      ctx.arc(gaugeCenterX, gaugeCenterY, gaugeRadius, startAngle, currentAngle);
      ctx.stroke();

      // 3. Threshold Marker Tick & Label
      const thX1 = gaugeCenterX + Math.cos(thresholdAngle) * (gaugeRadius - 12);
      const thY1 = gaugeCenterY + Math.sin(thresholdAngle) * (gaugeRadius - 12);
      const thX2 = gaugeCenterX + Math.cos(thresholdAngle) * (gaugeRadius + 12);
      const thY2 = gaugeCenterY + Math.sin(thresholdAngle) * (gaugeRadius + 12);

      ctx.strokeStyle = window.THEME.colors.accent.amber.main;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(thX1, thY1);
      ctx.lineTo(thX2, thY2);
      ctx.stroke();

      // 4. Center Tabular Counter Display (en-IN Indian grouping)
      const displayVal = Math.round(isSettle ? targetVal : (isReduced ? targetVal : targetVal * window.TWEEN.ease.easeOutCubic(effectiveP)));
      const formattedVal = `${unit} ${displayVal.toLocaleString("en-IN")}`;

      ctx.font = window.THEME.typography.hero;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(formattedVal, gaugeCenterX, gaugeCenterY - 10);

      ctx.font = window.THEME.typography.caption;
      ctx.fillStyle = themeColors.textSecondary;
      const thFormatted = `${unit} ${thresholdVal.toLocaleString("en-IN")}`;
      ctx.fillText(`Statutory Threshold: ${thFormatted}`, gaugeCenterX, gaugeCenterY + 28);

      // Min / Max Labels at track bases
      ctx.font = window.THEME.typography.captionBold;
      ctx.fillStyle = themeColors.textMuted;
      const minX = gaugeCenterX + Math.cos(startAngle) * (gaugeRadius + 22);
      const minY = gaugeCenterY + Math.sin(startAngle) * (gaugeRadius + 22);
      ctx.fillText(`${unit} ${minVal.toLocaleString("en-IN")}`, minX, minY);

      const maxX = gaugeCenterX + Math.cos(endAngle) * (gaugeRadius + 22);
      const maxY = gaugeCenterY + Math.sin(endAngle) * (gaugeRadius + 22);
      ctx.fillText(`${unit} ${maxVal.toLocaleString("en-IN")}`, maxX, maxY);

      // 5. Settled Compliance / Assessment Badge (Bottom)
      if (isSettle) {
        const badgeColor = isAboveThreshold ? window.THEME.colors.accent.emerald : window.THEME.colors.accent.indigo;
        window.SHARED_DRAW.pill(ctx, statusText.toUpperCase(), cardX + (cardW - 380) / 2, cardY + cardH - 46, {
          fill: badgeColor.light,
          textFill: badgeColor.main,
          stroke: badgeColor.border,
          icon: isAboveThreshold ? "checkCircle" : "shield"
        });
      }

      ctx.restore();
    },

    /**
     * ============================================================
     * 2. CLOCK LIMITATION ENGINE
     * ============================================================
     * Precision limitation clock dial with rotating limitation hand,
     * statutory deadline sector sweep, countdown card, and settled time-bar badge.
     */
    clock_limitation(ctx, payload = {}, bounds, phaseState, themeColors, sceneGraph, lineIdx = 0) {
      const p = phaseState.progress;
      const isSettle = p >= 0.65;
      const effectiveP = isSettle ? 1.0 : window.TWEEN.remap(p, 0.15, 0.65, 0, 1);
      const isReduced = window.THEME.prefersReducedMotion();

      const actTitle = payload.act_title || "Statutory Limitation Period";
      const deadlineText = payload.deadline || "Within 3 Years from Cause of Action";
      const isBarred = payload.is_barred === true;
      const verdict = payload.verdict || (isBarred ? "TIME-BARRED: REMEDY EXTINGUISHED" : "TIMELY COMPLIANCE: CLAIM ENFORCEABLE");

      const clockR = Math.min(100, bounds.h * 0.28);
      const clockX = bounds.x + bounds.w * 0.28;
      const clockY = bounds.y + bounds.h * 0.48;

      // Rotation angles: Hand rotates from -90 deg (12 o'clock) clockwise
      const startHandAngle = -Math.PI / 2;
      const maxSweep = isBarred ? (Math.PI * 1.85) : (Math.PI * 1.25);
      const handT = isSettle ? 1.0 : (isReduced ? 1.0 : window.TWEEN.ease.easeInOutQuart(effectiveP));
      const currentHandAngle = startHandAngle + (handT * maxSweep);

      // Keyed actor persistence
      if (sceneGraph) {
        sceneGraph.setLineIndex(lineIdx);
        sceneGraph.resolveActor("actor_clock_dial", { x: clockX, y: clockY }, phaseState.enterT);
      }

      ctx.save();

      // 1. Clock Face Outer Case
      ctx.fillStyle = themeColors.bgCard;
      ctx.strokeStyle = themeColors.borderStrong;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(clockX, clockY, clockR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Swept Limitation Sector Arc
      ctx.fillStyle = isBarred ? "rgba(220, 38, 38, 0.12)" : "rgba(16, 185, 129, 0.12)";
      ctx.beginPath();
      ctx.moveTo(clockX, clockY);
      ctx.arc(clockX, clockY, clockR - 4, startHandAngle, currentHandAngle, false);
      ctx.closePath();
      ctx.fill();

      // 12 Clock Hour Pips
      for (let i = 0; i < 12; i++) {
        const ang = (i * Math.PI) / 6 - Math.PI / 2;
        const isMajor = i % 3 === 0;
        const pLen = isMajor ? 10 : 5;
        const px1 = clockX + Math.cos(ang) * (clockR - 6);
        const py1 = clockY + Math.sin(ang) * (clockR - 6);
        const px2 = clockX + Math.cos(ang) * (clockR - 6 - pLen);
        const py2 = clockY + Math.sin(ang) * (clockR - 6 - pLen);

        ctx.strokeStyle = isMajor ? themeColors.textPrimary : themeColors.textMuted;
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(px1, py1);
        ctx.lineTo(px2, py2);
        ctx.stroke();
      }

      // Rotating Limitation Hand
      ctx.strokeStyle = isBarred ? window.THEME.colors.accent.crimson.main : window.THEME.colors.accent.indigo.main;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(clockX, clockY);
      ctx.lineTo(
        clockX + Math.cos(currentHandAngle) * (clockR - 22),
        clockY + Math.sin(currentHandAngle) * (clockR - 22)
      );
      ctx.stroke();

      // Center Pin
      ctx.fillStyle = isBarred ? window.THEME.colors.accent.crimson.main : window.THEME.colors.accent.indigo.main;
      ctx.beginPath();
      ctx.arc(clockX, clockY, 5, 0, Math.PI * 2);
      ctx.fill();

      // 2. Right Side Limitation Dossier Card
      const cardW = Math.min(480, bounds.w * 0.52);
      const cardH = 220;
      const cardX = bounds.x + bounds.w - cardW - 30;
      const cardY = bounds.y + (bounds.h - cardH) / 2;

      window.SHARED_DRAW.card(ctx, cardX, cardY, cardW, cardH, {
        fill: themeColors.bgCard,
        stroke: isSettle && isBarred ? window.THEME.colors.accent.crimson.border : themeColors.border,
        radius: window.THEME.radii.lg
      });

      // Top Tag
      ctx.fillStyle = isBarred ? window.THEME.colors.accent.crimson.light : window.THEME.colors.accent.indigo.light;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, 46, [window.THEME.radii.lg, window.THEME.radii.lg, 0, 0]);
      ctx.fill();
      ctx.stroke();

      window.ICONS.draw(ctx, "clock", cardX + 24, cardY + 23, 20, isBarred ? window.THEME.colors.accent.crimson.main : window.THEME.colors.accent.indigo.main);

      ctx.font = window.THEME.typography.monoBadge;
      ctx.fillStyle = isBarred ? window.THEME.colors.accent.crimson.dark : window.THEME.colors.accent.indigo.dark;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(actTitle.toUpperCase(), cardX + 46, cardY + 23);

      // Deadline Detail
      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.fillText(deadlineText, cardX + 24, cardY + 82);

      ctx.font = window.THEME.typography.body;
      ctx.fillStyle = themeColors.textSecondary;
      ctx.fillText(payload.detail || "Statutory period within which claim or appeal must be instituted.", cardX + 24, cardY + 112);

      // 3. Settled Verdict Badge
      if (isSettle) {
        const badgeTheme = isBarred ? window.THEME.colors.accent.crimson : window.THEME.colors.accent.emerald;
        window.SHARED_DRAW.pill(ctx, verdict.toUpperCase(), cardX + 24, cardY + cardH - 44, {
          fill: badgeTheme.light,
          textFill: badgeTheme.main,
          stroke: badgeTheme.border,
          icon: isBarred ? "alertTriangle" : "checkCircle"
        });
      }

      ctx.restore();
    },

    /**
     * ============================================================
     * 3. PROPERTY TRANSFER ENGINE
     * ============================================================
     * Real estate architecture boundary, Transferor/Transferee bilateral stations,
     * golden title key conveying across trajectory, settled mutation deed badge.
     */
    property_transfer(ctx, payload = {}, bounds, phaseState, themeColors, sceneGraph, lineIdx = 0) {
      const p = phaseState.progress;
      const isSettle = p >= 0.65;
      const effectiveP = isSettle ? 1.0 : window.TWEEN.remap(p, 0.15, 0.65, 0, 1);
      const isReduced = window.THEME.prefersReducedMotion();

      const transferor = payload.transferor || "Transferor (Vendor)";
      const transferee = payload.transferee || "Transferee (Purchaser)";
      const propertyDesc = payload.property_desc || "Commercial Immovable Property";
      const deedText = payload.deed_title || "Registered Conveyance Deed";
      const statusText = payload.status || "TITLE VESTED & MUTATED";

      const stationW = Math.min(220, bounds.w * 0.26);
      const stationH = 120;
      const stationY = bounds.y + bounds.h * 0.52;

      const leftX = bounds.x + 30;
      const rightX = bounds.x + bounds.w - stationW - 30;

      // Key travel
      const startX = leftX + stationW;
      const startY = stationY + 40;
      const endX = rightX;
      const endY = stationY + 40;
      const keyT = isSettle ? 1.0 : (isReduced ? 1.0 : window.TWEEN.ease.easeInOutQuart(effectiveP));

      // Keyed actor persistence
      if (sceneGraph) {
        sceneGraph.setLineIndex(lineIdx);
        sceneGraph.resolveActor("actor_property_asset", { x: leftX, y: stationY }, phaseState.enterT);
      }

      ctx.save();

      // 1. Central Architectural Building Silhouette
      const bldgCenterX = bounds.x + bounds.w / 2;
      const bldgY = bounds.y + 40;
      const bldgW = 160;
      const bldgH = 130;

      // Building Card
      window.SHARED_DRAW.card(ctx, bldgCenterX - (bldgW / 2), bldgY, bldgW, bldgH, {
        fill: themeColors.bgCard,
        stroke: themeColors.borderStrong,
        radius: window.THEME.radii.md
      });

      // Roof Gable
      ctx.fillStyle = window.THEME.colors.accent.indigo.light;
      ctx.strokeStyle = window.THEME.colors.accent.indigo.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bldgCenterX - (bldgW / 2), bldgY + 36);
      ctx.lineTo(bldgCenterX, bldgY + 6);
      ctx.lineTo(bldgCenterX + (bldgW / 2), bldgY + 36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Building Icon
      window.ICONS.draw(ctx, "building", bldgCenterX, bldgY + 68, 32, window.THEME.colors.accent.indigo.main);

      // Property Label
      ctx.font = window.THEME.typography.captionBold;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let dispProp = propertyDesc;
      if (ctx.measureText(dispProp).width > (bldgW - 20)) {
        while (dispProp.length > 3 && ctx.measureText(dispProp + "…").width > (bldgW - 20)) {
          dispProp = dispProp.slice(0, -1);
        }
        dispProp += "…";
      }
      ctx.fillText(dispProp, bldgCenterX, bldgY + 110);

      // 2. Transferor Card (Left)
      window.SHARED_DRAW.card(ctx, leftX, stationY, stationW, stationH, {
        fill: themeColors.bgCard,
        stroke: window.THEME.colors.accent.indigo.border
      });
      window.ICONS.draw(ctx, "user", leftX + 32, stationY + 36, 22, window.THEME.colors.accent.indigo.main);
      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      let dispTransferor = transferor;
      const maxPartyW = stationW - 65;
      if (ctx.measureText(dispTransferor).width > maxPartyW) {
        while (dispTransferor.length > 3 && ctx.measureText(dispTransferor + "…").width > maxPartyW) {
          dispTransferor = dispTransferor.slice(0, -1);
        }
        dispTransferor += "…";
      }
      ctx.fillText(dispTransferor, leftX + 54, stationY + 36);

      ctx.font = window.THEME.typography.caption;
      ctx.fillStyle = themeColors.textSecondary;
      ctx.fillText("Relinquishing Possession", leftX + 24, stationY + 74);

      // 3. Transferee Card (Right)
      window.SHARED_DRAW.card(ctx, rightX, stationY, stationW, stationH, {
        fill: themeColors.bgCard,
        stroke: isSettle ? window.THEME.colors.accent.emerald.border : themeColors.border
      });
      window.ICONS.draw(ctx, "user", rightX + 32, stationY + 36, 22, isSettle ? window.THEME.colors.accent.emerald.main : themeColors.textMuted);
      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.textAlign = "left";
      let dispTransferee = transferee;
      if (ctx.measureText(dispTransferee).width > maxPartyW) {
        while (dispTransferee.length > 3 && ctx.measureText(dispTransferee + "…").width > maxPartyW) {
          dispTransferee = dispTransferee.slice(0, -1);
        }
        dispTransferee += "…";
      }
      ctx.fillText(dispTransferee, rightX + 54, stationY + 36);

      ctx.font = window.THEME.typography.caption;
      ctx.fillStyle = themeColors.textSecondary;
      ctx.fillText("Vesting Legal Estate", rightX + 24, stationY + 74);

      // 4. Trajectory Arc & Key Transfer
      const proj = window.SHARED_DRAW.trajectoryArc(ctx, startX, startY, endX, endY, -60, keyT, window.THEME.colors.accent.amber.main);

      // Key Token
      if (!isSettle && p > 0.15) {
        const kx = proj.x;
        const ky = proj.y;
        ctx.save();
        ctx.translate(kx, ky);
        ctx.fillStyle = "#F59E0B";
        ctx.strokeStyle = "#D97706";
        ctx.lineWidth = 1.5;
        // Key head
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Inner cutout
        ctx.fillStyle = themeColors.bgCard;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        // Key shaft & teeth
        ctx.fillStyle = "#F59E0B";
        ctx.fillRect(8, -2, 14, 4);
        ctx.fillRect(16, 2, 3, 5);
        ctx.fillRect(20, 2, 3, 4);
        ctx.restore();
      }

      // 5. Settled Title Mutation Badge (Bottom)
      if (isSettle) {
        window.SHARED_DRAW.pill(ctx, `${statusText}: ${deedText}`, bounds.x + (bounds.w - 460) / 2, bounds.y + bounds.h - 48, {
          fill: window.THEME.colors.accent.emerald.light,
          textFill: window.THEME.colors.accent.emerald.main,
          stroke: window.THEME.colors.accent.emerald.border,
          icon: "checkCircle"
        });
      }

      ctx.restore();
    },

    /**
     * ============================================================
     * 4. CONDITION CHECKLIST ENGINE
     * ============================================================
     * Multi-step statutory criteria compliance board.
     * Checkmarks spring into place sequentially across PERFORM phase,
     * concluding in settled emerald all-satisfied banner.
     */
    condition_checklist(ctx, payload = {}, bounds, phaseState, themeColors, sceneGraph, lineIdx = 0) {
      const p = phaseState.progress;
      const isSettle = p >= 0.65;
      const effectiveP = isSettle ? 1.0 : window.TWEEN.remap(p, 0.15, 0.65, 0, 1);
      const isReduced = window.THEME.prefersReducedMotion();

      const title = payload.title || "Statutory Essential Conditions";
      const conditions = payload.conditions || [
        { text: "Prescribed Statutory Document in Possession", satisfied: true },
        { text: "Physical Receipt of Goods or Services Certified", satisfied: true },
        { text: "Statutory Tax Discharged to Appropriate Government", satisfied: true },
        { text: "Valid Prescribed Return Furnished under Law", satisfied: true }
      ];
      const verdict = payload.verdict || "ALL STATUTORY CONDITIONS FULFILLED";

      const boardW = Math.min(640, bounds.w * 0.85);
      const boardH = Math.min(360, bounds.h * 0.90);
      const boardX = bounds.x + (bounds.w - boardW) / 2;
      const boardY = bounds.y + (bounds.h - boardH) / 2;

      // Keyed actor persistence
      if (sceneGraph) {
        sceneGraph.setLineIndex(lineIdx);
        sceneGraph.resolveActor("actor_checklist_board", { x: boardX, y: boardY }, phaseState.enterT);
      }

      ctx.save();

      // 1. Compliance Board Card
      window.SHARED_DRAW.card(ctx, boardX, boardY, boardW, boardH, {
        fill: themeColors.bgCard,
        stroke: isSettle ? window.THEME.colors.accent.emerald.border : themeColors.borderStrong,
        radius: window.THEME.radii.lg
      });

      // Header Ribbon
      ctx.fillStyle = window.THEME.colors.accent.indigo.light;
      ctx.beginPath();
      ctx.roundRect(boardX, boardY, boardW, 46, [window.THEME.radii.lg, window.THEME.radii.lg, 0, 0]);
      ctx.fill();
      ctx.stroke();

      window.ICONS.draw(ctx, "fileText", boardX + 24, boardY + 23, 20, window.THEME.colors.accent.indigo.main);

      ctx.font = window.THEME.typography.monoBadge;
      ctx.fillStyle = window.THEME.colors.accent.indigo.dark;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(title.toUpperCase(), boardX + 44, boardY + 23);

      // 2. Sequential Checklist Rows
      const n = conditions.length;
      const availableH = boardH - 110;
      const rowH = Math.floor(availableH / n);
      const startRowY = boardY + 54;

      conditions.forEach((cond, idx) => {
        const ry = startRowY + (idx * rowH);
        // Step subphase: each item springs between (idx/n) and ((idx+1)/n)
        const subStart = idx / n;
        const subEnd = (idx + 1) / n;
        const itemP = isSettle ? 1.0 : window.TWEEN.getSubPhase(effectiveP, subStart, subEnd);
        const isItemDone = itemP >= 0.99;

        // Row background on completion
        if (isItemDone) {
          const isDark = window.THEME && window.THEME.mode === "dark";
          ctx.fillStyle = isDark ? "rgba(5, 150, 105, 0.16)" : window.THEME.colors.accent.emerald.light;
          ctx.beginPath();
          ctx.roundRect(boardX + 16, ry + 4, boardW - 32, rowH - 8, window.THEME.radii.sm);
          ctx.fill();
        }

        // Step number indicator
        ctx.fillStyle = isItemDone ? window.THEME.colors.accent.emerald.main : themeColors.textMuted;
        ctx.beginPath();
        ctx.arc(boardX + 38, ry + (rowH / 2), 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = window.THEME.typography.monoBadge;
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(idx + 1), boardX + 38, ry + (rowH / 2));

        // Condition text
        ctx.font = isItemDone ? window.THEME.typography.bodyBold : window.THEME.typography.body;
        ctx.fillStyle = isItemDone ? themeColors.textPrimary : themeColors.textSecondary;
        ctx.textAlign = "left";
        let dispText = cond.text || `Condition ${idx + 1}`;
        const maxTextW = boardW - 120;
        if (ctx.measureText(dispText).width > maxTextW) {
          while (dispText.length > 3 && ctx.measureText(dispText + "…").width > maxTextW) {
            dispText = dispText.slice(0, -1);
          }
          dispText += "…";
        }
        ctx.fillText(dispText, boardX + 60, ry + (rowH / 2));

        // Check Icon with spring pop
        if (itemP > 0) {
          ctx.save();
          ctx.translate(boardX + boardW - 40, ry + (rowH / 2));
          const scale = isSettle || isReduced ? 1.0 : window.TWEEN.ease.spring(itemP, 12, 0.7);
          ctx.scale(scale, scale);
          window.ICONS.draw(ctx, "checkCircle", 0, 0, 22, window.THEME.colors.accent.emerald.main);
          ctx.restore();
        }
      });

      // 3. Settled All-Satisfied Bottom Pill
      if (isSettle) {
        window.SHARED_DRAW.pill(ctx, verdict.toUpperCase(), boardX + (boardW - 380) / 2, boardY + boardH - 46, {
          fill: window.THEME.colors.accent.emerald.light,
          textFill: window.THEME.colors.accent.emerald.main,
          stroke: window.THEME.colors.accent.emerald.border,
          icon: "award"
        });
      }

      ctx.restore();
    }
  };

  // Register Batch 2 engines onto global ACTION_ENGINES
  Object.assign(window.ACTION_ENGINES, BATCH2);
})();
