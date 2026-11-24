// -*- coding: utf-8 -*-
// static/js/actions/batch3_engines.js
// Statutory Kinetic Studio - Batch 3 Action Engines:
// 1. lock_security  2. corporate_board  3. notice_dispatch  4. penalty_fine  5. waterfall_flow
// Strictly renders into given bounds {x, y, w, h}. Reaches final state by 65% and holds stable through 100%.

(function() {
  window.ACTION_ENGINES = window.ACTION_ENGINES || {};

  const BATCH3 = {
    /**
     * ============================================================
     * 1. LOCK SECURITY ENGINE
     * ============================================================
     * Precision vault safe / padlock tumbler mechanism.
     * Bank guarantees, escrow deposits, statutory liens, fiduciary security.
     * Tumbler dial aligns pins during PERFORM, bolt slides and locks by 65%.
     */
    lock_security(ctx, payload = {}, bounds, phaseState, themeColors, sceneGraph, lineIdx = 0) {
      const p = phaseState.progress;
      const isSettle = p >= 0.65;
      const effectiveP = isSettle ? 1.0 : window.TWEEN.remap(p, 0.15, 0.65, 0, 1);
      const isReduced = window.THEME.prefersReducedMotion();

      const title = payload.title || payload.security_type || "Statutory Security Guarantee";
      const amountStr = payload.amount ? window.SHARED_DRAW.formatIndianCurrency(payload.amount) : "";
      const obligor = payload.obligor || "Obligor / Contractor";
      const beneficiary = payload.beneficiary || "Beneficiary / Government";
      const statusText = payload.status || "STATUTORILY SECURED & ENFORCEABLE";

      const cardW = Math.min(620, bounds.w * 0.85);
      const cardH = Math.min(350, bounds.h * 0.90);
      const cardX = bounds.x + (bounds.w - cardW) / 2;
      const cardY = bounds.y + (bounds.h - cardH) / 2;

      // Tumbler rotation & bolt position
      const dialCenterX = cardX + cardW * 0.32;
      const dialCenterY = cardY + cardH * 0.52;
      const dialRadius = Math.min(75, cardH * 0.28);

      const rotAngle = isSettle ? Math.PI * 2 : (isReduced ? Math.PI * 2 : effectiveP * Math.PI * 2);
      const boltProgress = isSettle ? 1.0 : (isReduced ? 1.0 : window.TWEEN.ease.easeInOutQuart(effectiveP));

      if (sceneGraph) {
        sceneGraph.setLineIndex(lineIdx);
        sceneGraph.resolveActor("actor_lock_vault", { x: cardX, y: cardY }, phaseState.enterT);
      }

      ctx.save();

      // 1. Vault Chassis Card
      window.SHARED_DRAW.card(ctx, cardX, cardY, cardW, cardH, {
        fill: themeColors.bgCard,
        stroke: isSettle ? window.THEME.colors.accent.emerald.border : themeColors.borderStrong,
        radius: window.THEME.radii.lg
      });

      // Header Banner
      ctx.fillStyle = window.THEME.colors.accent.indigo.light;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, 44, [window.THEME.radii.lg, window.THEME.radii.lg, 0, 0]);
      ctx.fill();
      ctx.stroke();

      window.ICONS.draw(ctx, "lock", cardX + 24, cardY + 22, 20, window.THEME.colors.accent.indigo.main);

      ctx.font = window.THEME.typography.monoBadge;
      ctx.fillStyle = window.THEME.colors.accent.indigo.dark;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(title.toUpperCase(), cardX + 44, cardY + 22);

      // 2. Circular Vault Tumbler Dial (Left)
      // Outer dial rim
      ctx.fillStyle = themeColors.bgSubtle;
      ctx.strokeStyle = isSettle ? window.THEME.colors.accent.emerald.main : themeColors.borderStrong;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(dialCenterX, dialCenterY, dialRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner tumbler ring
      ctx.fillStyle = themeColors.bgCard;
      ctx.beginPath();
      ctx.arc(dialCenterX, dialCenterY, dialRadius - 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rotating tumbler notches
      ctx.save();
      ctx.translate(dialCenterX, dialCenterY);
      ctx.rotate(rotAngle);
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        ctx.strokeStyle = isSettle ? window.THEME.colors.accent.emerald.main : themeColors.textMuted;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * (dialRadius - 14), Math.sin(ang) * (dialRadius - 14));
        ctx.lineTo(Math.cos(ang) * (dialRadius - 4), Math.sin(ang) * (dialRadius - 4));
        ctx.stroke();
      }
      ctx.restore();

      // Center lock core icon
      window.ICONS.draw(
        ctx,
        isSettle ? "checkCircle" : "shield",
        dialCenterX,
        dialCenterY,
        32,
        isSettle ? window.THEME.colors.accent.emerald.main : window.THEME.colors.accent.indigo.main
      );

      // 3. Sliding Locking Bolt (engages into rim on right)
      const boltX1 = dialCenterX + dialRadius - 6;
      const boltY = dialCenterY - 10;
      const boltTravel = 28 * boltProgress;
      ctx.fillStyle = isSettle ? window.THEME.colors.accent.emerald.main : window.THEME.colors.accent.amber.main;
      ctx.fillRect(boltX1, boltY, boltTravel, 20);

      // 4. Dossier Data Box (Right)
      const infoX = cardX + cardW * 0.54;
      const infoY = cardY + 68;

      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      if (amountStr) {
        ctx.font = window.THEME.typography.hero;
        ctx.fillStyle = themeColors.textPrimary;
        ctx.fillText(amountStr, infoX, infoY + 16);

        ctx.font = window.THEME.typography.caption;
        ctx.fillStyle = themeColors.textSecondary;
        ctx.fillText("Guaranteed Statutory Quantum", infoX, infoY + 44);
      } else {
        ctx.font = window.THEME.typography.titleBold;
        ctx.fillStyle = themeColors.textPrimary;
        ctx.fillText(payload.protection_scope || "Fiduciary & Statutory Protection", infoX, infoY + 16);
      }

      // Parties
      ctx.font = window.THEME.typography.body;
      ctx.fillStyle = themeColors.textPrimary;
      let obligorText = `Obligor: ${obligor}`;
      if (ctx.measureText(obligorText).width > (cardW * 0.42)) {
        obligorText = obligorText.slice(0, 24) + "…";
      }
      ctx.fillText(obligorText, infoX, infoY + 76);

      let beneText = `Beneficiary: ${beneficiary}`;
      if (ctx.measureText(beneText).width > (cardW * 0.42)) {
        beneText = beneText.slice(0, 24) + "…";
      }
      ctx.fillText(beneText, infoX, infoY + 100);

      // 5. Settled Enforceability Badge (Bottom)
      if (isSettle) {
        window.SHARED_DRAW.pill(ctx, statusText.toUpperCase(), cardX + (cardW - 420) / 2, cardY + cardH - 44, {
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
     * 2. CORPORATE BOARD ENGINE
     * ============================================================
     * Boardroom conference table, director seats, voting majority bar.
     * Directors raise ballots sequentially, majority bar animates to threshold.
     */
    corporate_board(ctx, payload = {}, bounds, phaseState, themeColors, sceneGraph, lineIdx = 0) {
      const p = phaseState.progress;
      const isSettle = p >= 0.65;
      const effectiveP = isSettle ? 1.0 : window.TWEEN.remap(p, 0.15, 0.65, 0, 1);
      const isReduced = window.THEME.prefersReducedMotion();

      const company = payload.company_name || "Corporate Board of Directors";
      const resolution = payload.resolution_title || "Special Resolution under Companies Act";
      const votesFor = Number(payload.votes_for ?? 85);
      const votesAgainst = Number(payload.votes_against ?? 15);
      const totalVotes = votesFor + votesAgainst || 100;
      const pctFor = Math.round((votesFor / totalVotes) * 100);
      const reqThreshold = Number(payload.required_threshold ?? 75); // 75% for special, 51% for ordinary
      const isPassed = pctFor >= reqThreshold;
      const statusText = payload.status || (isPassed ? `SPECIAL RESOLUTION PASSED (${pctFor}% ASSENT)` : "RESOLUTION REJECTED");

      const cardW = Math.min(640, bounds.w * 0.86);
      const cardH = Math.min(350, bounds.h * 0.90);
      const cardX = bounds.x + (bounds.w - cardW) / 2;
      const cardY = bounds.y + (bounds.h - cardH) / 2;

      if (sceneGraph) {
        sceneGraph.setLineIndex(lineIdx);
        sceneGraph.resolveActor("actor_board_table", { x: cardX, y: cardY }, phaseState.enterT);
      }

      ctx.save();

      // 1. Boardroom Card
      window.SHARED_DRAW.card(ctx, cardX, cardY, cardW, cardH, {
        fill: themeColors.bgCard,
        stroke: isSettle && isPassed ? window.THEME.colors.accent.emerald.border : themeColors.borderStrong,
        radius: window.THEME.radii.lg
      });

      // Header Tag
      ctx.fillStyle = window.THEME.colors.accent.indigo.light;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, 44, [window.THEME.radii.lg, window.THEME.radii.lg, 0, 0]);
      ctx.fill();
      ctx.stroke();

      window.ICONS.draw(ctx, "users", cardX + 24, cardY + 22, 20, window.THEME.colors.accent.indigo.main);

      ctx.font = window.THEME.typography.monoBadge;
      ctx.fillStyle = window.THEME.colors.accent.indigo.dark;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(company.toUpperCase(), cardX + 44, cardY + 22);

      // Resolution Title
      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = themeColors.textPrimary;
      let dispRes = resolution;
      if (ctx.measureText(dispRes).width > (cardW - 48)) {
        dispRes = dispRes.slice(0, 48) + "…";
      }
      ctx.fillText(dispRes, cardX + 24, cardY + 74);

      // 2. Central Boardroom Conference Table Graphic
      const tableW = cardW - 80;
      const tableH = 80;
      const tableX = cardX + 40;
      const tableY = cardY + 104;

      // Table surface
      ctx.fillStyle = themeColors.bgSubtle;
      ctx.strokeStyle = themeColors.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(tableX, tableY, tableW, tableH, 20);
      ctx.fill();
      ctx.stroke();

      // Director Seats (6 seats: 3 top, 3 bottom)
      const seatCount = 6;
      for (let s = 0; s < seatCount; s++) {
        const isTop = s < 3;
        const col = isTop ? s : (s - 3);
        const seatX = tableX + (tableW / 4) * (col + 1);
        const seatY = isTop ? (tableY - 16) : (tableY + tableH + 16);

        // Subphase vote emergence
        const subStart = s / seatCount;
        const subEnd = (s + 1) / seatCount;
        const seatP = isSettle ? 1.0 : window.TWEEN.getSubPhase(effectiveP, subStart, subEnd);
        const hasVoted = seatP >= 0.99;
        const isAssent = s < 5; // 5 assent, 1 dissent = ~83%

        // Director Avatar
        ctx.fillStyle = hasVoted ? (isAssent ? window.THEME.colors.accent.emerald.main : window.THEME.colors.accent.crimson.main) : themeColors.textMuted;
        ctx.beginPath();
        ctx.arc(seatX, seatY, 10, 0, Math.PI * 2);
        ctx.fill();

        // Raised ballot check
        if (hasVoted && isAssent) {
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(seatX - 3, seatY);
          ctx.lineTo(seatX - 1, seatY + 3);
          ctx.lineTo(seatX + 4, seatY - 3);
          ctx.stroke();
        }
      }

      // Quorum & Table Center Label
      ctx.font = window.THEME.typography.monoBadge;
      ctx.fillStyle = themeColors.textSecondary;
      ctx.textAlign = "center";
      ctx.fillText("QUORUM VERIFIED • 6/6 ATTENDING", tableX + tableW / 2, tableY + tableH / 2);

      // 3. Voting Progress Bar (Bottom Section)
      const barY = cardY + 228;
      const barW = cardW - 80;
      const barH = 16;
      const currentPct = isSettle ? pctFor : (isReduced ? pctFor : Math.round(pctFor * window.TWEEN.ease.easeOutCubic(effectiveP)));

      ctx.fillStyle = themeColors.bgSubtle;
      ctx.beginPath();
      ctx.roundRect(tableX, barY, barW, barH, 8);
      ctx.fill();

      // Filled portion
      const fillW = Math.max(0, Math.min(barW, (barW * currentPct) / 100));
      ctx.fillStyle = isPassed ? window.THEME.colors.accent.emerald.main : window.THEME.colors.accent.amber.main;
      ctx.beginPath();
      ctx.roundRect(tableX, barY, fillW, barH, 8);
      ctx.fill();

      // 75% Statutory Threshold Line
      const thX = tableX + (barW * reqThreshold) / 100;
      ctx.strokeStyle = window.THEME.colors.accent.amber.main;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(thX, barY - 4);
      ctx.lineTo(thX, barY + barH + 4);
      ctx.stroke();

      // Vote labels
      ctx.font = window.THEME.typography.captionBold;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.textAlign = "left";
      ctx.fillText(`Assent: ${currentPct}%`, tableX, barY + 32);

      ctx.textAlign = "right";
      ctx.fillStyle = themeColors.textMuted;
      ctx.fillText(`Statutory Threshold: ${reqThreshold}%`, tableX + barW, barY + 32);

      // 4. Settled Verdict Pill
      if (isSettle) {
        const badgeTheme = isPassed ? window.THEME.colors.accent.emerald : window.THEME.colors.accent.crimson;
        window.SHARED_DRAW.pill(ctx, statusText.toUpperCase(), cardX + (cardW - 400) / 2, cardY + cardH - 44, {
          fill: badgeTheme.light,
          textFill: badgeTheme.main,
          stroke: badgeTheme.border,
          icon: isPassed ? "award" : "alertTriangle"
        });
      }

      ctx.restore();
    },

    /**
     * ============================================================
     * 3. NOTICE DISPATCH ENGINE
     * ============================================================
     * Official legal notice conveyor, postal envelope with seal,
     * transit track, and settled delivery acknowledgment card.
     */
    notice_dispatch(ctx, payload = {}, bounds, phaseState, themeColors, sceneGraph, lineIdx = 0) {
      const p = phaseState.progress;
      const isSettle = p >= 0.65;
      const effectiveP = isSettle ? 1.0 : window.TWEEN.remap(p, 0.15, 0.65, 0, 1);
      const isReduced = window.THEME.prefersReducedMotion();

      const noticeTitle = payload.notice_title || payload.title || "Statutory Legal Notice";
      const sender = payload.sender || "Issuing Statutory Authority";
      const recipient = payload.recipient || "Notice Addressee / Taxpayer";
      const dispatchMode = payload.dispatch_mode || "Registered Post with Acknowledgment Due";
      const statusText = payload.status || "NOTICE DULY SERVED & ACKNOWLEDGED";

      const stationW = Math.min(220, bounds.w * 0.26);
      const stationH = 120;
      const stationY = bounds.y + bounds.h * 0.48;

      const leftX = bounds.x + 30;
      const rightX = bounds.x + bounds.w - stationW - 30;

      // Envelope transit
      const startX = leftX + stationW;
      const startY = stationY + 40;
      const endX = rightX;
      const endY = stationY + 40;
      const envT = isSettle ? 1.0 : (isReduced ? 1.0 : window.TWEEN.ease.easeInOutQuart(effectiveP));

      if (sceneGraph) {
        sceneGraph.setLineIndex(lineIdx);
        sceneGraph.resolveActor("actor_notice_station", { x: leftX, y: stationY }, phaseState.enterT);
      }

      ctx.save();

      // Top Notice Header Banner
      const headerW = Math.min(600, bounds.w * 0.75);
      const headerX = bounds.x + (bounds.w - headerW) / 2;
      const headerY = bounds.y + 24;

      window.SHARED_DRAW.card(ctx, headerX, headerY, headerW, 48, {
        fill: themeColors.bgCard,
        stroke: themeColors.borderStrong,
        radius: window.THEME.radii.md
      });

      window.ICONS.draw(ctx, "mail", headerX + 24, headerY + 24, 20, window.THEME.colors.accent.indigo.main);

      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      let dispNotice = noticeTitle;
      if (ctx.measureText(dispNotice).width > (headerW - 80)) {
        dispNotice = dispNotice.slice(0, 36) + "…";
      }
      ctx.fillText(dispNotice, headerX + 46, headerY + 24);

      // 1. Sender Station (Left)
      window.SHARED_DRAW.card(ctx, leftX, stationY, stationW, stationH, {
        fill: themeColors.bgCard,
        stroke: window.THEME.colors.accent.indigo.border
      });
      window.ICONS.draw(ctx, "building", leftX + 32, stationY + 36, 22, window.THEME.colors.accent.indigo.main);
      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = themeColors.textPrimary;
      let dispSender = sender;
      const maxPartyW = stationW - 65;
      if (ctx.measureText(dispSender).width > maxPartyW) {
        dispSender = dispSender.slice(0, 18) + "…";
      }
      ctx.fillText(dispSender, leftX + 54, stationY + 36);

      ctx.font = window.THEME.typography.caption;
      ctx.fillStyle = themeColors.textSecondary;
      ctx.fillText("Dispatching Station", leftX + 24, stationY + 74);
      ctx.fillText(dispatchMode.slice(0, 22) + "…", leftX + 24, stationY + 94);

      // 2. Recipient Station (Right)
      window.SHARED_DRAW.card(ctx, rightX, stationY, stationW, stationH, {
        fill: themeColors.bgCard,
        stroke: isSettle ? window.THEME.colors.accent.emerald.border : themeColors.border
      });
      window.ICONS.draw(ctx, "user", rightX + 32, stationY + 36, 22, isSettle ? window.THEME.colors.accent.emerald.main : themeColors.textMuted);
      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = themeColors.textPrimary;
      let dispRecipient = recipient;
      if (ctx.measureText(dispRecipient).width > maxPartyW) {
        dispRecipient = dispRecipient.slice(0, 18) + "…";
      }
      ctx.fillText(dispRecipient, rightX + 54, stationY + 36);

      ctx.font = window.THEME.typography.caption;
      ctx.fillStyle = isSettle ? window.THEME.colors.accent.emerald.main : themeColors.textSecondary;
      ctx.fillText(isSettle ? "Acknowledgment Received" : "Awaiting Service…", rightX + 24, stationY + 74);

      // 3. Trajectory & Traveling Envelope
      const proj = window.SHARED_DRAW.trajectoryArc(ctx, startX, startY, endX, endY, -40, envT, window.THEME.colors.accent.indigo.main);

      if (!isSettle && p > 0.15) {
        const ex = proj.x;
        const ey = proj.y;
        ctx.save();
        ctx.translate(ex, ey);

        // Envelope shape
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = window.THEME.colors.accent.indigo.main;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-20, -14, 40, 28, 4);
        ctx.fill();
        ctx.stroke();

        // Flap
        ctx.beginPath();
        ctx.moveTo(-20, -14);
        ctx.lineTo(0, 2);
        ctx.lineTo(20, -14);
        ctx.stroke();

        // Red wax seal
        ctx.fillStyle = "#DC2626";
        ctx.beginPath();
        ctx.arc(0, 2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 4. Settled Service Acknowledgment Badge (Bottom)
      if (isSettle) {
        window.SHARED_DRAW.pill(ctx, statusText.toUpperCase(), bounds.x + (bounds.w - 440) / 2, bounds.y + bounds.h - 48, {
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
     * 4. PENALTY FINE ENGINE
     * ============================================================
     * Statutory fine / revenue demand ledger breakdown.
     * Itemized rows: Tax Demand + Penalty + Statutory Interest = Total.
     * Numbers count up sequentially, concluding in settled crimson warning badge.
     */
    penalty_fine(ctx, payload = {}, bounds, phaseState, themeColors, sceneGraph, lineIdx = 0) {
      const p = phaseState.progress;
      const isSettle = p >= 0.65;
      const effectiveP = isSettle ? 1.0 : window.TWEEN.remap(p, 0.15, 0.65, 0, 1);
      const isReduced = window.THEME.prefersReducedMotion();

      const title = payload.penalty_title || payload.title || "Statutory Penalty & Fine Notice";
      const reason = payload.reason || "Willful Non-Compliance & Statutory Default";
      const statusText = payload.status || "STATUTORY DEMAND ORDER ISSUED";

      // Ledger row items
      const baseDemandStr = payload.base_demand || payload.tax_amount || "₹50,00,000";
      const penaltyStr = payload.penalty_amount || payload.amount || "₹50,00,000";
      const interestStr = payload.interest_amount || "₹9,00,000";
      const totalStr = payload.total_amount || "₹1,09,00,000";

      const rows = [
        { label: "1. Basic Statutory Output Demand", val: baseDemandStr },
        { label: "2. Statutory Penalty (100% Demand)", val: penaltyStr },
        { label: "3. Statutory Interest under Section 50", val: interestStr }
      ];

      const cardW = Math.min(620, bounds.w * 0.85);
      const cardH = Math.min(350, bounds.h * 0.90);
      const cardX = bounds.x + (bounds.w - cardW) / 2;
      const cardY = bounds.y + (bounds.h - cardH) / 2;

      if (sceneGraph) {
        sceneGraph.setLineIndex(lineIdx);
        sceneGraph.resolveActor("actor_penalty_ledger", { x: cardX, y: cardY }, phaseState.enterT);
      }

      ctx.save();

      // 1. Demand Ledger Chassis Card
      window.SHARED_DRAW.card(ctx, cardX, cardY, cardW, cardH, {
        fill: themeColors.bgCard,
        stroke: isSettle ? window.THEME.colors.accent.crimson.border : themeColors.borderStrong,
        radius: window.THEME.radii.lg
      });

      // Crimson Header Ribbon
      ctx.fillStyle = window.THEME.colors.accent.crimson.light;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, 44, [window.THEME.radii.lg, window.THEME.radii.lg, 0, 0]);
      ctx.fill();
      ctx.stroke();

      window.ICONS.draw(ctx, "alertTriangle", cardX + 24, cardY + 22, 20, window.THEME.colors.accent.crimson.main);

      ctx.font = window.THEME.typography.monoBadge;
      ctx.fillStyle = window.THEME.colors.accent.crimson.dark;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(title.toUpperCase(), cardX + 44, cardY + 22);

      // 2. Itemized Ledger Rows
      const rowStartY = cardY + 54;
      const rowH = 34;

      rows.forEach((r, idx) => {
        const ry = rowStartY + idx * rowH;
        const subStart = idx / 3;
        const subEnd = (idx + 1) / 3;
        const rowP = isSettle ? 1.0 : window.TWEEN.getSubPhase(effectiveP, subStart, subEnd);
        const isRowDone = rowP >= 0.99;

        // Subtle row highlight
        if (isRowDone) {
          ctx.fillStyle = themeColors.bgSubtle;
          ctx.beginPath();
          ctx.roundRect(cardX + 16, ry + 2, cardW - 32, rowH - 4, 4);
          ctx.fill();
        }

        ctx.font = window.THEME.typography.body;
        ctx.fillStyle = themeColors.textPrimary;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(r.label, cardX + 24, ry + (rowH / 2));

        // Formatted amount
        ctx.font = window.THEME.typography.monoBadge;
        ctx.fillStyle = themeColors.textPrimary;
        ctx.textAlign = "right";
        const fmtVal = window.SHARED_DRAW.formatIndianCurrency(r.val);
        ctx.fillText(isRowDone ? fmtVal : "—", cardX + cardW - 24, ry + (rowH / 2));
      });

      // 3. Highlighted Total Row (Summation Bar)
      const totalY = rowStartY + 3 * rowH + 6;
      ctx.fillStyle = isSettle ? "rgba(220, 38, 38, 0.10)" : themeColors.bgMuted;
      ctx.strokeStyle = isSettle ? window.THEME.colors.accent.crimson.border : themeColors.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cardX + 16, totalY, cardW - 32, 44, window.THEME.radii.sm);
      ctx.fill();
      ctx.stroke();

      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("TOTAL STATUTORY REVENUE DEMAND", cardX + 28, totalY + 22);

      const fmtTotal = window.SHARED_DRAW.formatIndianCurrency(totalStr);
      ctx.font = window.THEME.typography.monoStat;
      ctx.fillStyle = window.THEME.colors.accent.crimson.main;
      ctx.textAlign = "right";
      ctx.fillText(isSettle ? fmtTotal : (isReduced ? fmtTotal : fmtTotal), cardX + cardW - 28, totalY + 22);

      // 4. Settled Warning Badge (Bottom)
      if (isSettle) {
        window.SHARED_DRAW.pill(ctx, statusText.toUpperCase(), cardX + (cardW - 400) / 2, cardY + cardH - 44, {
          fill: window.THEME.colors.accent.crimson.light,
          textFill: window.THEME.colors.accent.crimson.main,
          stroke: window.THEME.colors.accent.crimson.border,
          icon: "alertTriangle"
        });
      }

      ctx.restore();
    },

    /**
     * ============================================================
     * 5. WATERFALL FLOW ENGINE
     * ============================================================
     * Cascading statutory priority distribution tiers (e.g. IBC Section 53).
     * Stepped liquid cascade flowing down priority tiers during PERFORM.
     * Higher priority tiers satisfied first; exhausted lower tiers marked.
     */
    waterfall_flow(ctx, payload = {}, bounds, phaseState, themeColors, sceneGraph, lineIdx = 0) {
      const p = phaseState.progress;
      const isSettle = p >= 0.65;
      const effectiveP = isSettle ? 1.0 : window.TWEEN.remap(p, 0.15, 0.65, 0, 1);
      const isReduced = window.THEME.prefersReducedMotion();

      const title = payload.waterfall_title || payload.title || "Statutory Priority of Distribution";
      const corpusStr = payload.realized_corpus || payload.corpus || "₹5,00,00,000";
      const statusText = payload.status || "ORDER OF PRIORITY SATISFIED";

      const tiers = payload.tiers || [
        { label: "1. Insolvency Resolution & Liquidation Costs", amount: "₹50,00,000", settled: true },
        { label: "2. Secured Creditors & Workmen Dues (24m)", amount: "₹2,50,00,000", settled: true },
        { label: "3. Unpaid Employee Wages (12m)", amount: "₹1,00,00,000", settled: true },
        { label: "4. Financial Debts of Unsecured Creditors", amount: "₹1,00,00,000", settled: true },
        { label: "5. Government Dues & Remaining Debts", amount: "₹0 (Exhausted)", settled: false }
      ];

      const cardW = Math.min(640, bounds.w * 0.86);
      const cardH = Math.min(360, bounds.h * 0.90);
      const cardX = bounds.x + (bounds.w - cardW) / 2;
      const cardY = bounds.y + (bounds.h - cardH) / 2;

      if (sceneGraph) {
        sceneGraph.setLineIndex(lineIdx);
        sceneGraph.resolveActor("actor_waterfall_pedestal", { x: cardX, y: cardY }, phaseState.enterT);
      }

      ctx.save();

      // 1. Waterfall Frame Card
      window.SHARED_DRAW.card(ctx, cardX, cardY, cardW, cardH, {
        fill: themeColors.bgCard,
        stroke: isSettle ? window.THEME.colors.accent.emerald.border : themeColors.borderStrong,
        radius: window.THEME.radii.lg
      });

      // Header Tag
      ctx.fillStyle = window.THEME.colors.accent.indigo.light;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, 44, [window.THEME.radii.lg, window.THEME.radii.lg, 0, 0]);
      ctx.fill();
      ctx.stroke();

      window.ICONS.draw(ctx, "layers", cardX + 24, cardY + 22, 20, window.THEME.colors.accent.indigo.main);

      ctx.font = window.THEME.typography.monoBadge;
      ctx.fillStyle = window.THEME.colors.accent.indigo.dark;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(title.toUpperCase(), cardX + 44, cardY + 22);

      // Corpus Pill (Right of header)
      const fmtCorpus = window.SHARED_DRAW.formatIndianCurrency(corpusStr);
      ctx.font = window.THEME.typography.captionBold;
      ctx.fillStyle = window.THEME.colors.accent.indigo.main;
      ctx.textAlign = "right";
      ctx.fillText(`Corpus: ${fmtCorpus}`, cardX + cardW - 24, cardY + 22);

      // 2. Cascading Tiers
      const n = tiers.length;
      const availableH = cardH - 110;
      const rowH = Math.floor(availableH / n);
      const startRowY = cardY + 52;

      tiers.forEach((tier, idx) => {
        const ry = startRowY + idx * rowH;
        const subStart = idx / n;
        const subEnd = (idx + 1) / n;
        const tierP = isSettle ? 1.0 : window.TWEEN.getSubPhase(effectiveP, subStart, subEnd);
        const isTierDone = tierP >= 0.99;
        const isSettled = tier.settled !== false;

        // Tier background (emerald if settled, slate/amber if exhausted)
        if (isTierDone) {
          const isDark = window.THEME && window.THEME.mode === "dark";
          if (isSettled) {
            ctx.fillStyle = isDark ? "rgba(5, 150, 105, 0.16)" : window.THEME.colors.accent.emerald.light;
          } else {
            ctx.fillStyle = isDark ? "rgba(100, 116, 139, 0.16)" : themeColors.bgSubtle;
          }
          ctx.beginPath();
          ctx.roundRect(cardX + 16, ry + 2, cardW - 32, rowH - 4, window.THEME.radii.sm);
          ctx.fill();
        }

        // Tier priority badge
        ctx.fillStyle = isTierDone ? (isSettled ? window.THEME.colors.accent.emerald.main : themeColors.textMuted) : themeColors.textMuted;
        ctx.beginPath();
        ctx.arc(cardX + 36, ry + rowH / 2, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = window.THEME.typography.monoBadge;
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(idx + 1), cardX + 36, ry + rowH / 2);

        // Tier label
        ctx.font = isTierDone ? window.THEME.typography.bodyBold : window.THEME.typography.body;
        ctx.fillStyle = isTierDone ? themeColors.textPrimary : themeColors.textSecondary;
        ctx.textAlign = "left";
        let dispTier = tier.label || `Priority Tier ${idx + 1}`;
        const maxTierW = cardW - 220;
        if (ctx.measureText(dispTier).width > maxTierW) {
          dispTier = dispTier.slice(0, 32) + "…";
        }
        ctx.fillText(dispTier, cardX + 56, ry + rowH / 2);

        // Tier allocated amount
        const fmtAmt = window.SHARED_DRAW.formatIndianCurrency(tier.amount);
        ctx.font = window.THEME.typography.monoBadge;
        ctx.fillStyle = isTierDone ? (isSettled ? window.THEME.colors.accent.emerald.main : themeColors.textMuted) : themeColors.textMuted;
        ctx.textAlign = "right";
        ctx.fillText(isTierDone ? fmtAmt : "—", cardX + cardW - 40, ry + rowH / 2);

        // Checkmark or dash
        if (isTierDone) {
          window.ICONS.draw(
            ctx,
            isSettled ? "checkCircle" : "cross",
            cardX + cardW - 24,
            ry + rowH / 2,
            16,
            isSettled ? window.THEME.colors.accent.emerald.main : themeColors.textMuted
          );
        }
      });

      // 3. Settled All-Distributed Bottom Pill
      if (isSettle) {
        window.SHARED_DRAW.pill(ctx, statusText.toUpperCase(), cardX + (cardW - 420) / 2, cardY + cardH - 44, {
          fill: window.THEME.colors.accent.emerald.light,
          textFill: window.THEME.colors.accent.emerald.main,
          stroke: window.THEME.colors.accent.emerald.border,
          icon: "award"
        });
      }

      ctx.restore();
    }
  };

  // Register Batch 3 engines onto global ACTION_ENGINES
  Object.assign(window.ACTION_ENGINES, BATCH3);
})();
