// -*- coding: utf-8 -*-
// static/js/actions/pilot_engines.js
// Statutory Kinetic Studio - 3 Core Pilot Action Engines
// 1. money_transfer  2. balance_scale  3. gavel_verdict
// Strictly renders into given bounds {x, y, w, h}. Reaches final state by 65% and holds stable through 100%.

(function() {
  const PILOT_ENGINES = {
    /**
     * ============================================================
     * 1. MONEY TRANSFER ENGINE
     * ============================================================
     * Payment of consideration, advance, rent, statutory fees.
     * Flat minted coins, tabular counter, clean arc trajectory, receiver tick.
     */
    money_transfer(ctx, payload = {}, bounds, phaseState, themeColors, sceneGraph, lineIdx = 0) {
      const p = phaseState.progress; // 0 to 1
      const isSettle = p >= 0.65;
      const effectiveP = isSettle ? 1.0 : window.TWEEN.remap(p, 0.15, 0.65, 0, 1);
      const enterT = phaseState.enterT;

      const fromActor = payload.from_actor || "Payer";
      const toActor = payload.to_actor || "Receiver";
      const amountStr = payload.amount || "₹50,000";
      const desc = payload.description || "Lawful Consideration";

      // Parse numerical value for tabular count-up
      const numMatch = amountStr.replace(/[^0-9]/g, "");
      const targetVal = numMatch ? parseInt(numMatch, 10) : 50000;
      const currencySymbol = amountStr.startsWith("₹") ? "₹" : "$";

      // Compute geometric positions relative to bounds
      const cardW = Math.min(220, bounds.w * 0.28);
      const cardH = 110;
      const cardY = bounds.y + (bounds.h - cardH) / 2;

      const leftX = bounds.x + 20;
      const rightX = bounds.x + bounds.w - cardW - 20;

      // Keyed Actor Persistence (Party Cards)
      if (sceneGraph) {
        sceneGraph.setLineIndex(lineIdx);
        sceneGraph.resolveActor("actor_payer", { x: leftX, y: cardY }, enterT);
        sceneGraph.resolveActor("actor_receiver", { x: rightX, y: cardY }, enterT);
      }

      ctx.save();

      // 1. Payer Card (Left)
      window.SHARED_DRAW.card(ctx, leftX, cardY, cardW, cardH, {
        fill: themeColors.bgCard,
        stroke: window.THEME.colors.accent.indigo.border
      });
      window.ICONS.draw(ctx, "user", leftX + 32, cardY + 36, 24, window.THEME.colors.accent.indigo.main);
      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(fromActor, leftX + 54, cardY + 36);

      ctx.font = window.THEME.typography.caption;
      ctx.fillStyle = themeColors.textSecondary;
      ctx.fillText("Remitting Consideration", leftX + 24, cardY + 74);

      // 2. Receiver Card (Right)
      window.SHARED_DRAW.card(ctx, rightX, cardY, cardW, cardH, {
        fill: themeColors.bgCard,
        stroke: window.THEME.colors.accent.emerald.border
      });
      window.ICONS.draw(ctx, "store", rightX + 32, cardY + 36, 24, window.THEME.colors.accent.emerald.main);
      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.textAlign = "left";
      ctx.fillText(toActor, rightX + 54, cardY + 36);

      // Status under Receiver: Counts up or shows "Received"
      if (isSettle) {
        window.SHARED_DRAW.pill(ctx, "RECEIVED & CREDITED", rightX + 24, cardY + 64, {
          fill: window.THEME.colors.accent.emerald.light,
          textFill: window.THEME.colors.accent.emerald.main,
          stroke: window.THEME.colors.accent.emerald.border,
          icon: "checkCircle"
        });
      } else {
        ctx.font = window.THEME.typography.caption;
        ctx.fillStyle = themeColors.textMuted;
        ctx.fillText("Awaiting Settlement...", rightX + 24, cardY + 74);
      }

      // 3. Central Trajectory Arc & Minted Coins
      const arcStartX = leftX + cardW + 10;
      const arcStartY = cardY + 40;
      const arcEndX = rightX - 10;
      const arcEndY = cardY + 40;
      const arcHeight = -Math.min(90, bounds.h * 0.28);

      // Draw trajectory guide
      const projectile = window.SHARED_DRAW.trajectoryArc(
        ctx, arcStartX, arcStartY, arcEndX, arcEndY, arcHeight, effectiveP, window.THEME.colors.accent.amber.main
      );

      // Draw traveling flat minted coin (no tumbling distortion)
      if (!isSettle && p > 0.15) {
        const coinX = projectile.x;
        const coinY = projectile.y;
        const coinR = 14;

        // Outer rim
        ctx.fillStyle = "#F59E0B";
        ctx.strokeStyle = "#D97706";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(coinX, coinY, coinR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner coin core
        ctx.fillStyle = "#FEF3C7";
        ctx.beginPath();
        ctx.arc(coinX, coinY, coinR - 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "800 11px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#B45309";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(currencySymbol, coinX, coinY);
      }

      // 4. Central Amount Card with Tabular Counter
      const counterCardW = 240;
      const counterCardH = 74;
      const counterCardX = bounds.x + (bounds.w - counterCardW) / 2;
      const counterCardY = bounds.y + bounds.h - counterCardH - 16;

      window.SHARED_DRAW.card(ctx, counterCardX, counterCardY, counterCardW, counterCardH, {
        fill: themeColors.bgCard,
        stroke: isSettle ? window.THEME.colors.accent.emerald.border : themeColors.border
      });

      // Description label
      ctx.font = window.THEME.typography.captionBold;
      ctx.fillStyle = isSettle ? window.THEME.colors.accent.emerald.main : themeColors.textMuted;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(desc.toUpperCase(), counterCardX + counterCardW / 2, counterCardY + 12);

      // Tabular count-up
      const currentCount = isSettle ? targetVal : Math.round(targetVal * window.TWEEN.ease.easeOutCubic(effectiveP));
      ctx.font = window.THEME.typography.monoStat;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(`${currencySymbol} ${currentCount.toLocaleString()}`, counterCardX + counterCardW / 2, counterCardY + 54);

      ctx.restore();
    },

    /**
     * ============================================================
     * 2. BALANCE SCALE ENGINE
     * ============================================================
     * Weighing arguments, ordinary vs remote damages, burden of proof.
     * Level hanging pans, harmonic spring physics tilt, settled verdict badge.
     */
    balance_scale(ctx, payload = {}, bounds, phaseState, themeColors, sceneGraph, lineIdx = 0) {
      const p = phaseState.progress;
      const isSettle = p >= 0.65;
      const effectiveP = isSettle ? 1.0 : window.TWEEN.remap(p, 0.15, 0.65, 0, 1);

      const leftWeight = payload.left_weight || "Direct / Ordinary Loss";
      const leftAmount = payload.left_amount || "₹1,50,000";
      const rightWeight = payload.right_weight || "Remote / Consequential Loss";
      const rightAmount = payload.right_amount || "₹10,00,000";
      const verdict = payload.verdict || "Scale Tilts: Only Natural & Direct Loss Recoverable";

      const centerX = bounds.x + bounds.w / 2;
      const centerY = bounds.y + bounds.h * 0.44;
      const beamHalfLength = Math.min(220, bounds.w * 0.30);

      // Physical tilt calculation: spring overshoot into settled tilt (-12 degrees)
      const maxTiltRad = (13 * Math.PI) / 180;
      let curTilt = 0;
      if (effectiveP > 0) {
        const springT = window.TWEEN.ease.spring(effectiveP, 10, 0.7);
        curTilt = springT * maxTiltRad; // Tilts clockwise towards heavier/settled loss
      }
      if (isSettle) {
        curTilt = maxTiltRad; // 100% frozen from 65% to 100%
      }

      // Keyed Actor Persistence (Fulcrum Pedestal)
      if (sceneGraph) {
        sceneGraph.setLineIndex(lineIdx);
        sceneGraph.resolveActor("actor_scale_pedestal", { x: centerX, y: centerY }, phaseState.enterT);
      }

      ctx.save();

      // 1. Central Pedestal & Triangular Fulcrum
      ctx.strokeStyle = themeColors.borderStrong;
      ctx.lineWidth = 2;
      // Vertical Pillar
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX, bounds.y + bounds.h - 50);
      ctx.stroke();

      // Base Plate
      ctx.beginPath();
      ctx.moveTo(centerX - 60, bounds.y + bounds.h - 50);
      ctx.lineTo(centerX + 60, bounds.y + bounds.h - 50);
      ctx.stroke();

      // Triangular Fulcrum Cap
      ctx.fillStyle = window.THEME.colors.accent.indigo.main;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 8);
      ctx.lineTo(centerX - 12, centerY + 8);
      ctx.lineTo(centerX + 12, centerY + 8);
      ctx.closePath();
      ctx.fill();

      // 2. Tilted Beam (Rotating around centerX, centerY)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(curTilt);

      // Main Lever Bar
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-beamHalfLength, 0);
      ctx.lineTo(beamHalfLength, 0);
      ctx.stroke();

      // Pivot Ring
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = window.THEME.colors.accent.indigo.main;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // 3. Hanging Pans (Level Pans: suspended vertically despite beam rotation)
      const leftTipX = centerX - Math.cos(curTilt) * beamHalfLength;
      const leftTipY = centerY - Math.sin(curTilt) * beamHalfLength;
      const rightTipX = centerX + Math.cos(curTilt) * beamHalfLength;
      const rightTipY = centerY + Math.sin(curTilt) * beamHalfLength;

      const stringLen = 70;
      const panW = 140;

      // Left Pan
      ctx.strokeStyle = themeColors.borderStrong;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(leftTipX, leftTipY);
      ctx.lineTo(leftTipX - (panW / 2), leftTipY + stringLen);
      ctx.moveTo(leftTipX, leftTipY);
      ctx.lineTo(leftTipX + (panW / 2), leftTipY + stringLen);
      ctx.stroke();

      // Left Pan Base (Curved dish)
      ctx.fillStyle = window.THEME.colors.accent.emerald.light;
      ctx.strokeStyle = window.THEME.colors.accent.emerald.border;
      ctx.beginPath();
      ctx.moveTo(leftTipX - (panW / 2), leftTipY + stringLen);
      ctx.quadraticCurveTo(leftTipX, leftTipY + stringLen + 20, leftTipX + (panW / 2), leftTipY + stringLen);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Left Weight Token Label
      window.SHARED_DRAW.card(ctx, leftTipX - 70, leftTipY + stringLen + 8, 140, 52, {
        fill: themeColors.bgCard,
        stroke: window.THEME.colors.accent.emerald.border
      });
      ctx.font = window.THEME.typography.monoStat;
      ctx.fillStyle = window.THEME.colors.accent.emerald.main;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(leftAmount, leftTipX, leftTipY + stringLen + 26);
      ctx.font = window.THEME.typography.captionBold;
      ctx.fillStyle = themeColors.textSecondary;
      ctx.fillText(leftWeight, leftTipX, leftTipY + stringLen + 46);

      // Right Pan
      ctx.strokeStyle = themeColors.borderStrong;
      ctx.beginPath();
      ctx.moveTo(rightTipX, rightTipY);
      ctx.lineTo(rightTipX - (panW / 2), rightTipY + stringLen);
      ctx.moveTo(rightTipX, rightTipY);
      ctx.lineTo(rightTipX + (panW / 2), rightTipY + stringLen);
      ctx.stroke();

      // Right Pan Base
      ctx.fillStyle = window.THEME.colors.accent.crimson.light;
      ctx.strokeStyle = window.THEME.colors.accent.crimson.border;
      ctx.beginPath();
      ctx.moveTo(rightTipX - (panW / 2), rightTipY + stringLen);
      ctx.quadraticCurveTo(rightTipX, rightTipY + stringLen + 20, rightTipX + (panW / 2), rightTipY + stringLen);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Weight Token Label
      window.SHARED_DRAW.card(ctx, rightTipX - 70, rightTipY + stringLen + 8, 140, 52, {
        fill: themeColors.bgCard,
        stroke: window.THEME.colors.accent.crimson.border
      });
      ctx.font = window.THEME.typography.monoStat;
      ctx.fillStyle = window.THEME.colors.accent.crimson.main;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(rightAmount, rightTipX, rightTipY + stringLen + 26);
      ctx.font = window.THEME.typography.captionBold;
      ctx.fillStyle = themeColors.textSecondary;
      ctx.fillText(rightWeight, rightTipX, rightTipY + stringLen + 46);

      // 4. Settled Verdict Ribbon (Appears upon settling >= 65% and holds stable)
      if (isSettle) {
        const ribbonW = Math.min(620, bounds.w - 80);
        const ribbonH = 42;
        const ribbonX = bounds.x + (bounds.w - ribbonW) / 2;
        const ribbonY = bounds.y + 14;

        window.SHARED_DRAW.card(ctx, ribbonX, ribbonY, ribbonW, ribbonH, {
          fill: window.THEME.colors.accent.emerald.light,
          stroke: window.THEME.colors.accent.emerald.border,
          radius: window.THEME.radii.sm
        });

        window.ICONS.draw(ctx, "scale", ribbonX + 24, ribbonY + (ribbonH / 2), 18, window.THEME.colors.accent.emerald.main);

        ctx.font = window.THEME.typography.bodyBold;
        ctx.fillStyle = window.THEME.colors.accent.emerald.dark;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(verdict.toUpperCase(), ribbonX + 44, ribbonY + (ribbonH / 2));
      }

      ctx.restore();
    },

    /**
     * ============================================================
     * 3. GAVEL VERDICT ENGINE
     * ============================================================
     * Court judgments, landmark rulings, arbitrator decrees.
     * Mahogany gavel with windup anticipation, sharp impact strike,
     * expanding shockwave, and settled judicial ratio decree card.
     */
    gavel_verdict(ctx, payload = {}, bounds, phaseState, themeColors, sceneGraph, lineIdx = 0) {
      const p = phaseState.progress;
      const isSettle = p >= 0.65;
      const effectiveP = isSettle ? 1.0 : window.TWEEN.remap(p, 0.15, 0.65, 0, 1);

      const courtName = payload.court_name || "SUPREME COURT OF INDIA";
      const caseCitation = payload.case_citation || "Landmark Judicial Precedent";
      const ratio = payload.ratio || "Settled Legal Principle Established";

      const centerX = bounds.x + bounds.w * 0.32;
      const soundblockY = bounds.y + bounds.h * 0.72;

      // Sub-phases inside PERFORM (effectiveP from 0 to 1):
      // 0.0 - 0.35: Anticipation Wind-up (gavel raises backward)
      // 0.35 - 0.60: Strike down
      // 0.60 - 0.80: Impact & Shockwave ring
      // 0.80 - 1.0: Decree card unrolls to final hold state
      let gavelAngle = 0;
      let shockwaveR = 0;
      let shockwaveAlpha = 0;
      let decreeRevealT = isSettle ? 1.0 : 0;

      if (!isSettle) {
        if (effectiveP < 0.35) {
          // Windup: rotate up to -45 deg
          const t = window.TWEEN.getSubPhase(effectiveP, 0, 0.35);
          gavelAngle = -window.TWEEN.ease.easeOutBack(t) * 0.75;
        } else if (effectiveP < 0.60) {
          // Downward strike
          const t = window.TWEEN.getSubPhase(effectiveP, 0.35, 0.60);
          gavelAngle = window.TWEEN.lerp(-0.75, 0.08, window.TWEEN.ease.easeInOutQuart(t));
        } else {
          // Gavel resting on block
          gavelAngle = 0.04;
          // Shockwave expands
          if (effectiveP < 0.85) {
            const t = window.TWEEN.getSubPhase(effectiveP, 0.60, 0.85);
            shockwaveR = t * 65;
            shockwaveAlpha = (1 - t) * 0.8;
          }
          // Decree reveals
          const t = window.TWEEN.getSubPhase(effectiveP, 0.70, 1.0);
          decreeRevealT = window.TWEEN.ease.easeOutCubic(t);
        }
      }

      // Keyed Actor Persistence (Sound Block Base)
      if (sceneGraph) {
        sceneGraph.setLineIndex(lineIdx);
        sceneGraph.resolveActor("actor_soundblock", { x: centerX, y: soundblockY }, phaseState.enterT);
      }

      ctx.save();

      // 1. Sound Block (Mahogany Base)
      const blockW = 150;
      const blockH = 26;
      ctx.fillStyle = "#5D4037"; // Rich mahogany
      ctx.strokeStyle = "#3E2723";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(centerX - blockW / 2, soundblockY, blockW, blockH, window.THEME.radii.sm);
      ctx.fill();
      ctx.stroke();

      // Top brass soundplate rim
      ctx.fillStyle = "#D97706";
      ctx.fillRect(centerX - blockW / 2 + 12, soundblockY, blockW - 24, 4);

      // 2. Shockwave Ripple upon impact
      if (shockwaveAlpha > 0.01) {
        ctx.strokeStyle = window.THEME.colors.accent.amber.main;
        ctx.lineWidth = 2;
        ctx.globalAlpha = shockwaveAlpha;
        ctx.beginPath();
        ctx.ellipse(centerX, soundblockY + 2, shockwaveR, shockwaveR * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // 3. Mahogany Gavel (Head & Handle)
      ctx.save();
      ctx.translate(centerX - 10, soundblockY - 6);
      ctx.rotate(gavelAngle);

      // Handle (angled up and to the right)
      ctx.strokeStyle = "#8D6E63";
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-10, -2);
      ctx.lineTo(-95, -75);
      ctx.stroke();

      // Brass Ring accent on handle
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(-35, -22);
      ctx.lineTo(-42, -28);
      ctx.stroke();

      // Gavel Mallet Head (Double-headed cylinder)
      ctx.fillStyle = "#4E342E";
      ctx.strokeStyle = "#3E2723";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-24, -30, 48, 28, 4);
      ctx.fill();
      ctx.stroke();

      // Brass rings on mallet head ends
      ctx.fillStyle = "#F59E0B";
      ctx.fillRect(-24, -30, 6, 28);
      ctx.fillRect(18, -30, 6, 28);

      ctx.restore();

      // 4. Judicial Decree Ratio Card (Right Column)
      const decreeW = Math.min(460, bounds.w * 0.52);
      const decreeH = 260;
      const decreeX = bounds.x + bounds.w - decreeW - 20;
      const decreeY = bounds.y + (bounds.h - decreeH) / 2;

      ctx.save();
      ctx.globalAlpha = decreeRevealT;

      window.SHARED_DRAW.card(ctx, decreeX, decreeY, decreeW, decreeH, {
        fill: themeColors.bgCard,
        stroke: window.THEME.colors.accent.amber.border,
        radius: window.THEME.radii.lg
      });

      // Top Stately Header
      ctx.fillStyle = window.THEME.colors.accent.amber.light;
      ctx.beginPath();
      ctx.roundRect(decreeX, decreeY, decreeW, 50, [window.THEME.radii.lg, window.THEME.radii.lg, 0, 0]);
      ctx.fill();
      ctx.stroke();

      window.ICONS.draw(ctx, "gavel", decreeX + 28, decreeY + 25, 20, window.THEME.colors.accent.amber.main);

      ctx.font = window.THEME.typography.monoBadge;
      ctx.fillStyle = window.THEME.colors.accent.amber.dark;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(courtName.toUpperCase(), decreeX + 48, decreeY + 25);

      // Case Law Citation
      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.fillText(caseCitation, decreeX + 24, decreeY + 86);

      // Divider line
      ctx.strokeStyle = themeColors.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(decreeX + 24, decreeY + 115);
      ctx.lineTo(decreeX + decreeW - 24, decreeY + 115);
      ctx.stroke();

      // Ratio Decidendi text
      ctx.font = window.THEME.typography.captionBold;
      ctx.fillStyle = window.THEME.colors.accent.indigo.main;
      ctx.fillText("BINDING LEGAL RATIO:", decreeX + 24, decreeY + 138);

      ctx.font = window.THEME.typography.body;
      ctx.fillStyle = themeColors.textSecondary;
      ctx.textBaseline = "alphabetic";

      // Wrap ratio text cleanly
      const words = ratio.split(" ");
      let line = "";
      let lineY = decreeY + 165;
      for (let w of words) {
        let test = line ? (line + " " + w) : w;
        if (ctx.measureText(test).width <= (decreeW - 48)) {
          line = test;
        } else {
          ctx.fillText(line, decreeX + 24, lineY);
          lineY += 22;
          line = w;
        }
      }
      if (line) ctx.fillText(line, decreeX + 24, lineY);

      // Valid stamp badge
      window.SHARED_DRAW.pill(ctx, "FINAL & BINDING", decreeX + 24, decreeY + decreeH - 34, {
        fill: window.THEME.colors.accent.emerald.light,
        textFill: window.THEME.colors.accent.emerald.main,
        stroke: window.THEME.colors.accent.emerald.border,
        icon: "checkCircle"
      });

      ctx.restore();
      ctx.restore();
    }
  };

  // Expose to window
  window.PILOT_ENGINES = PILOT_ENGINES;
})();
