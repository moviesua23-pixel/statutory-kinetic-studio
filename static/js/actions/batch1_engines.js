// -*- coding: utf-8 -*-
// static/js/actions/batch1_engines.js
// Statutory Kinetic Studio - Batch 1 Action Engines:
// 1. contract_sign  2. handshake_consent  3. goods_transport  4. breach_block
// Strictly renders into given bounds {x, y, w, h}. Reaches final state by 65% and holds stable through 100%.

(function() {
  window.ACTION_ENGINES = window.ACTION_ENGINES || {};
  if (window.PILOT_ENGINES) {
    Object.assign(window.ACTION_ENGINES, window.PILOT_ENGINES);
  }

  const BATCH1 = {
    /**
     * ============================================================
     * 1. CONTRACT SIGN ENGINE
     * ============================================================
     * Crisp parchment document, signature traced with stroke-dash reveal,
     * wax seal stamped with squash & stretch impact.
     */
    contract_sign(ctx, payload = {}, bounds, phaseState, themeColors, sceneGraph, lineIdx = 0) {
      const p = phaseState.progress;
      const isSettle = p >= 0.65;
      const effectiveP = isSettle ? 1.0 : window.TWEEN.remap(p, 0.15, 0.65, 0, 1);

      const title = payload.title || "Statutory Instrument / Agreement";
      const parties = payload.parties || "Party A & Party B";
      const keyTerm = payload.key_term || "Binding Statutory Covenant & Conditions";
      const stampText = payload.stamp_text || "EXECUTED RECORD";

      // Centered parchment document
      const docW = Math.min(520, bounds.w * 0.60);
      const docH = Math.min(340, bounds.h * 0.85);
      const docX = bounds.x + (bounds.w - docW) / 2;
      const docY = bounds.y + (bounds.h - docH) / 2;

      // Sub-phases:
      // 0.0 - 0.60: Signature traces on
      // 0.60 - 0.85: Wax seal descends with impact bounce (squash & stretch)
      // 0.85 - 1.0: Hold final state
      const sigProgress = isSettle ? 1.0 : window.TWEEN.getSubPhase(effectiveP, 0, 0.60);
      const sealProgress = isSettle ? 1.0 : window.TWEEN.getSubPhase(effectiveP, 0.60, 0.90);

      // Keyed actor persistence
      if (sceneGraph) {
        sceneGraph.setLineIndex(lineIdx);
        sceneGraph.resolveActor("actor_contract_doc", { x: docX, y: docY }, phaseState.enterT);
      }

      ctx.save();

      // 1. Document Parchment Card
      window.SHARED_DRAW.card(ctx, docX, docY, docW, docH, {
        fill: themeColors.bgCard,
        stroke: themeColors.borderStrong,
        radius: window.THEME.radii.lg
      });

      // Top Header Ribbon
      ctx.fillStyle = window.THEME.colors.accent.indigo.light;
      ctx.beginPath();
      ctx.roundRect(docX, docY, docW, 46, [window.THEME.radii.lg, window.THEME.radii.lg, 0, 0]);
      ctx.fill();
      ctx.stroke();

      window.ICONS.draw(ctx, "fileText", docX + 24, docY + 23, 20, window.THEME.colors.accent.indigo.main);

      ctx.font = window.THEME.typography.monoBadge;
      ctx.fillStyle = window.THEME.colors.accent.indigo.dark;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(payload.document_header || "OFFICIAL INSTRUMENT / RECORD", docX + 44, docY + 23);

      // Title & Parties with robust text truncation for long names
      const maxDocTextW = docW - 48;
      let displayTitle = title;
      ctx.font = window.THEME.typography.titleBold;
      if (ctx.measureText(displayTitle).width > maxDocTextW) {
        while (displayTitle.length > 8 && ctx.measureText(displayTitle + "…").width > maxDocTextW) {
          displayTitle = displayTitle.slice(0, -1);
        }
        displayTitle += "…";
      }
      ctx.fillStyle = themeColors.textPrimary;
      ctx.fillText(displayTitle, docX + 24, docY + 76);

      ctx.font = window.THEME.typography.body;
      let displayParties = `Parties: ${parties}`;
      if (ctx.measureText(displayParties).width > maxDocTextW) {
        while (displayParties.length > 12 && ctx.measureText(displayParties + "…").width > maxDocTextW) {
          displayParties = displayParties.slice(0, -1);
        }
        displayParties += "…";
      }
      ctx.fillStyle = themeColors.textSecondary;
      ctx.fillText(displayParties, docX + 24, docY + 104);

      // Real text lines placeholder
      ctx.strokeStyle = themeColors.bgSubtle;
      ctx.lineWidth = 1.5;
      const textLinesY = [135, 155, 175, 195];
      textLinesY.forEach((ly, i) => {
        ctx.beginPath();
        ctx.moveTo(docX + 24, docY + ly);
        ctx.lineTo(docX + docW - (i === 3 ? 140 : 24), docY + ly);
        ctx.stroke();
      });

      // Key term callout box
      ctx.fillStyle = window.THEME.colors.accent.amber.light;
      ctx.strokeStyle = window.THEME.colors.accent.amber.border;
      ctx.beginPath();
      ctx.roundRect(docX + 24, docY + 215, docW - 48, 38, window.THEME.radii.sm);
      ctx.fill();
      ctx.stroke();

      const maxKeyTermW = docW - 72;
      const termPrefix = payload.term_label ? `${payload.term_label}: ` : "";
      let displayKeyTerm = `${termPrefix}${keyTerm}`;
      ctx.font = window.THEME.typography.captionBold;
      if (ctx.measureText(displayKeyTerm).width > maxKeyTermW) {
        while (displayKeyTerm.length > 12 && ctx.measureText(displayKeyTerm + "…").width > maxKeyTermW) {
          displayKeyTerm = displayKeyTerm.slice(0, -1);
        }
        displayKeyTerm += "…";
      }
      ctx.fillStyle = window.THEME.colors.accent.amber.dark;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(displayKeyTerm, docX + 36, docY + 234);

      // 2. Animated Signature Trace (Path2D stroke-dash reveal)
      const sigStartX = docX + 40;
      const sigStartY = docY + docH - 42;
      ctx.strokeStyle = window.THEME.colors.accent.indigo.main;
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Cursive signature path
      const sigTotalLen = 220;
      const sigDash = sigProgress * sigTotalLen;
      ctx.setLineDash([sigDash, sigTotalLen]);
      ctx.beginPath();
      ctx.moveTo(sigStartX, sigStartY);
      ctx.bezierCurveTo(sigStartX + 20, sigStartY - 24, sigStartX + 45, sigStartY + 8, sigStartX + 70, sigStartY - 14);
      ctx.bezierCurveTo(sigStartX + 95, sigStartY - 30, sigStartX + 120, sigStartY + 6, sigStartX + 150, sigStartY - 10);
      ctx.lineTo(sigStartX + 180, sigStartY - 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = window.THEME.typography.caption;
      ctx.fillStyle = themeColors.textMuted;
      ctx.fillText("Authorized Signatory", sigStartX, docY + docH - 14);

      // 3. Wax Seal Stamp with Squash & Stretch Impact Bounce
      if (sealProgress > 0) {
        const sealX = docX + docW - 74;
        const sealY = docY + docH - 46;
        const sealR = 30;

        ctx.save();
        ctx.translate(sealX, sealY);

        // Squash & stretch: scaleY compresses on landing, scaleX widens
        let sx = 1.0, sy = 1.0;
        if (sealProgress < 1.0) {
          const bounceT = window.TWEEN.ease.spring(sealProgress, 14, 0.65);
          sx = 1.0 + (1 - bounceT) * 0.25;
          sy = 1.0 - (1 - bounceT) * 0.25;
        }
        ctx.scale(sx, sy);

        // Red Wax Seal Base
        ctx.fillStyle = "#DC2626";
        ctx.strokeStyle = "#991B1B";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, sealR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner Embossed Ring
        ctx.strokeStyle = "#FCA5A5";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, sealR - 5, 0, Math.PI * 2);
        ctx.stroke();

        // Stamp Text
        ctx.font = "800 8px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const stampWords = stampText.split("&").map(s => s.trim());
        if (stampWords.length >= 2) {
          ctx.fillText(stampWords[0], 0, -6);
          ctx.fillText(stampWords[1], 0, 6);
        } else {
          ctx.fillText(stampText, 0, 0);
        }

        ctx.restore();
      }

      ctx.restore();
    },

    /**
     * ============================================================
     * 2. HANDSHAKE CONSENT ENGINE
     * ============================================================
     * Two party cards slide in from corridors, meet in center,
     * and a glowing emerald consensus check shield blooms.
     */
    handshake_consent(ctx, payload = {}, bounds, phaseState, themeColors, sceneGraph, lineIdx = 0) {
      const p = phaseState.progress;
      const isSettle = p >= 0.65;
      const effectiveP = isSettle ? 1.0 : window.TWEEN.remap(p, 0.15, 0.65, 0, 1);

      const partyA = payload.party_a || "Party A (Initiator / Claimant)";
      const partyB = payload.party_b || "Party B (Counterparty / Assessee)";
      const consentRule = payload.consent_rule || payload.rule || "Statutory Mutual Assent / Concurrence";
      const statusText = payload.status || "BILATERAL ACCORD CONCLUDED";

      const cardW = Math.min(260, bounds.w * 0.30);
      const cardH = 140;
      const cardY = bounds.y + (bounds.h - cardH) / 2;

      // Cards slide toward center
      const travelDist = (bounds.w - (cardW * 2) - 80) / 2;
      const slideT = isSettle ? 1.0 : window.TWEEN.ease.easeOutCubic(window.TWEEN.getSubPhase(effectiveP, 0, 0.65));

      const leftX = bounds.x + 30 + (slideT * travelDist);
      const rightX = bounds.x + bounds.w - cardW - 30 - (slideT * travelDist);

      // Keyed actors persistence
      if (sceneGraph) {
        sceneGraph.setLineIndex(lineIdx);
        sceneGraph.resolveActor("actor_consent_a", { x: leftX, y: cardY }, phaseState.enterT);
        sceneGraph.resolveActor("actor_consent_b", { x: rightX, y: cardY }, phaseState.enterT);
      }

      ctx.save();

      // 1. Party A Card
      window.SHARED_DRAW.card(ctx, leftX, cardY, cardW, cardH, {
        fill: themeColors.bgCard,
        stroke: window.THEME.colors.accent.indigo.border
      });
      window.ICONS.draw(ctx, "user", leftX + 32, cardY + 36, 24, window.THEME.colors.accent.indigo.main);
      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const maxPartyCardW = cardW - 70;
      let dispPartyA = partyA;
      if (ctx.measureText(dispPartyA).width > maxPartyCardW) {
        while (dispPartyA.length > 3 && ctx.measureText(dispPartyA + "…").width > maxPartyCardW) {
          dispPartyA = dispPartyA.slice(0, -1);
        }
        dispPartyA += "…";
      }
      ctx.fillText(dispPartyA, leftX + 54, cardY + 36);

      ctx.font = window.THEME.typography.body;
      ctx.fillStyle = themeColors.textSecondary;
      ctx.fillText(payload.party_a_role || "Initiator / Offeror", leftX + 24, cardY + 76);

      window.SHARED_DRAW.pill(ctx, payload.party_a_badge || "ELIGIBLE ENTITY", leftX + 24, cardY + 102, {
        fill: window.THEME.colors.accent.indigo.light,
        textFill: window.THEME.colors.accent.indigo.main,
        icon: "shield"
      });

      // 2. Party B Card
      window.SHARED_DRAW.card(ctx, rightX, cardY, cardW, cardH, {
        fill: themeColors.bgCard,
        stroke: window.THEME.colors.accent.indigo.border
      });
      window.ICONS.draw(ctx, "user", rightX + 32, cardY + 36, 24, window.THEME.colors.accent.indigo.main);
      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.textAlign = "left";
      let dispPartyB = partyB;
      if (ctx.measureText(dispPartyB).width > maxPartyCardW) {
        while (dispPartyB.length > 3 && ctx.measureText(dispPartyB + "…").width > maxPartyCardW) {
          dispPartyB = dispPartyB.slice(0, -1);
        }
        dispPartyB += "…";
      }
      ctx.fillText(dispPartyB, rightX + 54, cardY + 36);

      ctx.font = window.THEME.typography.body;
      ctx.fillStyle = themeColors.textSecondary;
      ctx.fillText(payload.party_b_role || "Offeree / Concurring Party", rightX + 24, cardY + 76);

      window.SHARED_DRAW.pill(ctx, payload.party_b_badge || "MUTUAL ASSENT", rightX + 24, cardY + 102, {
        fill: window.THEME.colors.accent.indigo.light,
        textFill: window.THEME.colors.accent.indigo.main,
        icon: "shield"
      });

      // 3. Central Consensus Meeting Shield Badge (Blooms upon cards meeting)
      if (effectiveP > 0.50) {
        const shieldT = isSettle ? 1.0 : window.TWEEN.ease.spring(window.TWEEN.getSubPhase(effectiveP, 0.50, 0.90), 12, 0.7);
        const centerX = bounds.x + bounds.w / 2;
        const centerY = cardY + cardH / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(shieldT, shieldT);

        // Circular bloom background
        ctx.fillStyle = window.THEME.colors.accent.emerald.light;
        ctx.strokeStyle = window.THEME.colors.accent.emerald.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Check Icon
        window.ICONS.draw(ctx, "checkCircle", 0, 0, 32, window.THEME.colors.accent.emerald.main, 2.2);

        ctx.restore();
      }

      // 4. Settled Consent Verdict Card (Bottom)
      if (isSettle) {
        const ribbonW = Math.min(620, bounds.w - 80);
        const ribbonH = 46;
        const ribbonX = bounds.x + (bounds.w - ribbonW) / 2;
        const ribbonY = bounds.y + bounds.h - ribbonH - 12;

        window.SHARED_DRAW.card(ctx, ribbonX, ribbonY, ribbonW, ribbonH, {
          fill: window.THEME.colors.accent.emerald.light,
          stroke: window.THEME.colors.accent.emerald.border,
          radius: window.THEME.radii.sm
        });

        window.ICONS.draw(ctx, "shield", ribbonX + 24, ribbonY + (ribbonH / 2), 20, window.THEME.colors.accent.emerald.main);

        ctx.font = window.THEME.typography.bodyBold;
        ctx.fillStyle = window.THEME.colors.accent.emerald.dark;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`${consentRule.toUpperCase()} — ${statusText}`, ribbonX + 46, ribbonY + (ribbonH / 2));
      }

      ctx.restore();
    },

    /**
     * ============================================================
     * 3. GOODS TRANSPORT ENGINE
     * ============================================================
     * Geometric cargo truck driving across highway between origin depot
     * and destination warehouse. Consistent perspective, settled delivery badge.
     */
    goods_transport(ctx, payload = {}, bounds, phaseState, themeColors, sceneGraph, lineIdx = 0) {
      const p = phaseState.progress;
      const isSettle = p >= 0.65;
      const effectiveP = isSettle ? 1.0 : window.TWEEN.remap(p, 0.15, 0.65, 0, 1);

      const origin = payload.origin || "Origin Warehouse";
      const dest = payload.destination || "Destination Port / Buyer Facility";
      const cargo = payload.cargo || "Capital Goods & Equipment";

      const depotW = 160;
      const depotH = 110;
      const highwayY = bounds.y + bounds.h * 0.62;

      const originX = bounds.x + 30;
      const destX = bounds.x + bounds.w - depotW - 30;

      // Truck travel calculation along highway
      const truckStart = originX + depotW + 10;
      const truckEnd = destX - 110;
      const truckX = isSettle ? truckEnd : window.TWEEN.lerp(truckStart, truckEnd, window.TWEEN.ease.easeInOutQuart(effectiveP));

      ctx.save();

      // 1. Origin Depot Card
      window.SHARED_DRAW.card(ctx, originX, highwayY - depotH + 10, depotW, depotH, {
        fill: themeColors.bgCard,
        stroke: themeColors.border
      });
      window.ICONS.draw(ctx, "building", originX + 28, highwayY - depotH + 34, 22, window.THEME.colors.accent.indigo.main);
      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("ORIGIN", originX + 50, highwayY - depotH + 34);

      ctx.font = window.THEME.typography.caption;
      ctx.fillStyle = themeColors.textSecondary;
      ctx.fillText(origin, originX + 16, highwayY - 30);

      // 2. Destination Warehouse Card
      window.SHARED_DRAW.card(ctx, destX, highwayY - depotH + 10, depotW, depotH, {
        fill: themeColors.bgCard,
        stroke: isSettle ? window.THEME.colors.accent.emerald.border : themeColors.border
      });
      window.ICONS.draw(ctx, "store", destX + 28, highwayY - depotH + 34, 22, isSettle ? window.THEME.colors.accent.emerald.main : themeColors.textMuted);
      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.textAlign = "left";
      ctx.fillText("DESTINATION", destX + 50, highwayY - depotH + 34);

      ctx.font = window.THEME.typography.caption;
      ctx.fillStyle = themeColors.textSecondary;
      ctx.fillText(dest, destX + 16, highwayY - 30);

      // 3. Highway Lane
      ctx.strokeStyle = themeColors.borderStrong;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(originX + depotW, highwayY + 14);
      ctx.lineTo(destX, highwayY + 14);
      ctx.stroke();

      // Dashed lane marker
      ctx.strokeStyle = window.THEME.colors.accent.amber.main;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.moveTo(originX + depotW + 10, highwayY + 8);
      ctx.lineTo(destX - 10, highwayY + 8);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Clean Geometric Cargo Truck
      const truckY = highwayY - 26;
      const truckW = 90;
      const truckH = 36;

      // Trailer Body
      ctx.fillStyle = window.THEME.colors.accent.indigo.main;
      ctx.strokeStyle = window.THEME.colors.accent.indigo.dark;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(truckX, truckY, 62, truckH, 3);
      ctx.fill();
      ctx.stroke();

      // Cabin
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.roundRect(truckX + 62, truckY + 8, 26, truckH - 8, [0, 4, 4, 0]);
      ctx.fill();
      ctx.stroke();

      // Cabin Window
      ctx.fillStyle = "#E2E8F0";
      ctx.fillRect(truckX + 66, truckY + 12, 12, 10);

      // Wheels
      const wheelR = 6;
      ctx.fillStyle = "#0F172A";
      ctx.beginPath();
      ctx.arc(truckX + 16, truckY + truckH + 2, wheelR, 0, Math.PI * 2);
      ctx.arc(truckX + 46, truckY + truckH + 2, wheelR, 0, Math.PI * 2);
      ctx.arc(truckX + 76, truckY + truckH + 2, wheelR, 0, Math.PI * 2);
      ctx.fill();

      // Cargo label on truck
      ctx.font = "700 9px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("CARGO", truckX + 31, truckY + 18);

      // 5. Settled Delivery Badge
      if (isSettle) {
        window.SHARED_DRAW.pill(ctx, payload.delivery_status || `DELIVERED & TRANSFERRED: ${cargo}`, bounds.x + (bounds.w - 380) / 2, bounds.y + bounds.h - 50, {
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
     * 4. BREACH BLOCK ENGINE
     * ============================================================
     * Fractured pathway line, slow accessibility pulse (no strobe),
     * road block barrier slams down, default warning card.
     */
    breach_block(ctx, payload = {}, bounds, phaseState, themeColors, sceneGraph, lineIdx = 0) {
      const p = phaseState.progress;
      const isSettle = p >= 0.65;
      const effectiveP = isSettle ? 1.0 : window.TWEEN.remap(p, 0.15, 0.65, 0, 1);

      const eventTitle = payload.event_title || "Statutory Default / Non-Compliance";
      const cause = payload.cause || "Default under Statutory Provision";
      const consequence = payload.consequence || "Statutory Liability Imposed";

      const centerX = bounds.x + bounds.w / 2;
      const centerY = bounds.y + bounds.h * 0.45;

      ctx.save();

      // 1. Fractured Pathway
      ctx.strokeStyle = themeColors.borderStrong;
      ctx.lineWidth = 3;
      // Left solid highway
      ctx.beginPath();
      ctx.moveTo(bounds.x + 80, centerY + 60);
      ctx.lineTo(centerX - 40, centerY + 60);
      ctx.stroke();

      // Central Jagged Crack
      ctx.strokeStyle = window.THEME.colors.accent.crimson.main;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX - 40, centerY + 60);
      ctx.lineTo(centerX - 15, centerY + 78);
      ctx.lineTo(centerX + 8, centerY + 46);
      ctx.lineTo(centerX + 40, centerY + 60);
      ctx.stroke();

      // Right highway
      ctx.strokeStyle = themeColors.borderStrong;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX + 40, centerY + 60);
      ctx.lineTo(bounds.x + bounds.w - 80, centerY + 60);
      ctx.stroke();

      // 2. Barrier Gate Descending
      // 0.0 - 0.70: Gate slams down with slight overshoot
      const gateT = isSettle ? 1.0 : window.TWEEN.ease.spring(window.TWEEN.getSubPhase(effectiveP, 0, 0.75), 14, 0.75);
      const gateY = centerY - 10 + (gateT * 50);

      // Barrier Posts
      ctx.fillStyle = "#334155";
      ctx.fillRect(centerX - 110, centerY, 12, 60);
      ctx.fillRect(centerX + 98, centerY, 12, 60);

      // Striped Barrier Bar
      ctx.fillStyle = window.THEME.colors.accent.crimson.main;
      ctx.fillRect(centerX - 120, gateY, 240, 16);

      // White reflective hazard stripes
      ctx.fillStyle = "#FFFFFF";
      for (let sx = centerX - 110; sx < centerX + 110; sx += 32) {
        ctx.beginPath();
        ctx.moveTo(sx, gateY);
        ctx.lineTo(sx + 14, gateY);
        ctx.lineTo(sx + 6, gateY + 16);
        ctx.lineTo(sx - 8, gateY + 16);
        ctx.closePath();
        ctx.fill();
      }

      // 3. Alert Icon with Deterministic Pulse (accessibility safe)
      // Pulse freezes static (pulseAlpha = 1.0) during settle hold (>= 65%) or under prefers-reduced-motion
      const isReduced = window.THEME.prefersReducedMotion();
      let pulseAlpha = 1.0;
      if (!isSettle && !isReduced) {
        pulseAlpha = 0.75 + (Math.sin(effectiveP * Math.PI * 4) * 0.25);
      }

      ctx.save();
      ctx.globalAlpha = pulseAlpha;
      window.ICONS.draw(ctx, "alertTriangle", centerX, centerY - 48, 36, window.THEME.colors.accent.crimson.main, 2.2);
      ctx.restore();

      // 4. Breach Consequence Card
      const cardW = Math.min(540, bounds.w - 80);
      const cardH = 90;
      const cardX = bounds.x + (bounds.w - cardW) / 2;
      const cardY = bounds.y + bounds.h - cardH - 12;

      window.SHARED_DRAW.card(ctx, cardX, cardY, cardW, cardH, {
        fill: themeColors.bgCard,
        stroke: window.THEME.colors.accent.crimson.border,
        radius: window.THEME.radii.md
      });

      // Left Crimson Accent Bar
      ctx.fillStyle = window.THEME.colors.accent.crimson.main;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, 6, cardH, [window.THEME.radii.md, 0, 0, window.THEME.radii.md]);
      ctx.fill();

      // Event Title
      ctx.font = window.THEME.typography.titleBold;
      ctx.fillStyle = window.THEME.colors.accent.crimson.main;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(eventTitle.toUpperCase(), cardX + 24, cardY + 24);

      // Cause & Consequence
      ctx.font = window.THEME.typography.body;
      ctx.fillStyle = themeColors.textPrimary;
      ctx.fillText(`Cause: ${cause}`, cardX + 24, cardY + 50);

      ctx.font = window.THEME.typography.captionBold;
      ctx.fillStyle = themeColors.textSecondary;
      ctx.fillText(`Legal Consequence: ${consequence}`, cardX + 24, cardY + 72);

      ctx.restore();
    }
  };

  Object.assign(window.ACTION_ENGINES, BATCH1);
})();
