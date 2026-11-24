// -*- coding: utf-8 -*-
// static/js/presentation_player.js
// Universal Action-Driven Kinetic Animation Player
// What the sentence describes physically animates on the canvas!
// (e.g. money traveling, contracts being signed, trucks driving, scales tilting, gavels striking)

(function() {
  window.PRESENTATION_PLAYER = {};

  let canvas, ctx;
  let activeData = null;
  let currentSceneIdx = 0;
  let currentTimeMs = 0;
  let isPlaying = true;
  let fontScale = 1.15; // Prominent default (+15%)
  let lastFrameTime = performance.now();
  let animationFrameId = null;

  function initPlayer() {
    canvas = document.getElementById("stage_canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
  }

  function loadPresentation(data) {
    activeData = data;
    currentSceneIdx = 0;
    currentTimeMs = 0;
    isPlaying = true;
    updatePlayBtnState();
    renderTabs();
    switchScene(0);

    if (!animationFrameId) {
      lastFrameTime = performance.now();
      animationFrameId = requestAnimationFrame(renderLoop);
    }
  }

  function renderTabs() {
    const tabsContainer = document.getElementById("anim_scene_tabs");
    if (!tabsContainer || !activeData || !activeData.scenes) return;

    tabsContainer.innerHTML = "";
    activeData.scenes.forEach((sc, idx) => {
      const btn = document.createElement("button");
      const isPhase1 = sc.screenplay_phase && sc.screenplay_phase.includes("PHASE 1");
      btn.className = `scene-tab-btn ${idx === currentSceneIdx ? "active" : ""} ${isPhase1 ? "phase-story" : "phase-statute"}`;
      const prefix = isPhase1 ? "📖" : "⚖️";
      btn.innerHTML = `${prefix} Slide ${idx + 1}: ${sc.tab_title || `Slide ${idx+1}`}`;
      btn.onclick = () => switchScene(idx);
      tabsContainer.appendChild(btn);
    });
  }

  function switchScene(idx) {
    if (!activeData || !activeData.scenes || !activeData.scenes[idx]) return;
    currentSceneIdx = idx;
    currentTimeMs = 0;

    const tabs = document.querySelectorAll("#anim_scene_tabs .scene-tab-btn");
    tabs.forEach((t, i) => t.classList.toggle("active", i === idx));

    const sc = activeData.scenes[idx];
    const isPhase1 = sc.screenplay_phase && sc.screenplay_phase.includes("PHASE 1");

    // Narration Meta
    const phaseBadge = document.getElementById("anim_phase_badge");
    if (phaseBadge) {
      phaseBadge.textContent = isPhase1 ? "📖 PHASE 1: STORY EXPOSITION" : "⚖️ PHASE 2: STATUTORY BREAKDOWN";
      phaseBadge.style.background = isPhase1 ? "#D97706" : "#059669";
    }

    const tagLabel = document.getElementById("anim_tag_label");
    if (tagLabel) tagLabel.textContent = (sc.tag || `SLIDE ${idx+1}`).toUpperCase();

    const storyRef = document.getElementById("anim_story_ref");
    if (storyRef) {
      if (sc.story_point_ref) {
        storyRef.style.display = "block";
        storyRef.textContent = `🎯 ${sc.story_point_ref}`;
      } else {
        storyRef.style.display = "none";
      }
    }

    const linesCount = sc.lines ? sc.lines.length : 3;
    const maxMs = linesCount * 3500;
    const slider = document.getElementById("anim_timeline_slider");
    if (slider) {
      slider.max = maxMs;
      slider.value = 0;
    }
  }

  function togglePlay() {
    isPlaying = !isPlaying;
    updatePlayBtnState();
  }

  function updatePlayBtnState() {
    const btn = document.getElementById("btn_anim_play_pause");
    if (btn) btn.innerHTML = isPlaying ? "⏸ Pause" : "▶ Play Animation";
  }

  function setFontScale(scale, btnEl) {
    fontScale = scale;
    document.querySelectorAll(".font-zoom-btn").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
  }

  // ==========================================
  // ANIMATION LOOP & CANVAS RENDERER
  // ==========================================
  function renderLoop(now) {
    const dt = now - lastFrameTime;
    lastFrameTime = now;

    if (isPlaying && activeData && activeData.scenes) {
      currentTimeMs += dt;
      const sc = activeData.scenes[currentSceneIdx];
      const linesCount = sc?.lines?.length || 3;
      const maxMs = linesCount * 3500;
      if (currentTimeMs >= maxMs) {
        currentTimeMs = maxMs; // Hold at end of scene
      }
      const slider = document.getElementById("anim_timeline_slider");
      if (slider) slider.value = currentTimeMs;
    }

    drawScene();
    animationFrameId = requestAnimationFrame(renderLoop);
  }

  function drawScene() {
    if (!ctx) return;
    ctx.clearRect(0, 0, 1000, 500);

    // Canvas Background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 1000, 500);

    // Subtle Grid
    ctx.strokeStyle = "#F1F5F9";
    ctx.lineWidth = 1;
    for (let x = 0; x < 1000; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 500); ctx.stroke();
    }
    for (let y = 0; y < 500; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1000, y); ctx.stroke();
    }

    if (!activeData || !activeData.scenes || !activeData.scenes[currentSceneIdx]) {
      drawPlaceholder();
      return;
    }

    const sc = activeData.scenes[currentSceneIdx];
    const isPhase1 = sc.screenplay_phase && sc.screenplay_phase.includes("PHASE 1");

    // Update time display
    const linesCount = sc.lines?.length || 3;
    const maxMs = linesCount * 3500;
    const timeDisplay = document.getElementById("anim_time_display");
    if (timeDisplay) {
      const curSec = (currentTimeMs / 1000).toFixed(1);
      const totalSec = (maxMs / 1000).toFixed(1);
      timeDisplay.textContent = `00:${curSec.padStart(4, "0")} / 00:${totalSec.padStart(4, "0")}`;
    }

    // Top Header Banner
    drawTopHeaderBanner(sc, isPhase1);

    // Render Action Animation for Active Line
    drawActionScene(sc, isPhase1);
  }

  function drawTopHeaderBanner(sc, isPhase1) {
    ctx.save();
    const actBadgeText = (activeData.act_name || "STATUTE").toUpperCase();
    const secBadgeText = (activeData.section_code || "PROVISION").toUpperCase();
    
    // Act Pill
    ctx.fillStyle = isPhase1 ? "#FFFBEB" : "#ECFDF5";
    ctx.strokeStyle = isPhase1 ? "#FDE68A" : "#A7F3D0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(50, 16, 340, 30, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = isPhase1 ? "#B45309" : "#047857";
    ctx.font = `bold ${Math.round(11 * fontScale)}px JetBrains Mono, monospace`;
    ctx.fillText(`🏛️ ${actBadgeText} · ${secBadgeText}`, 62, 36);

    // Slide Title
    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(16 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(sc.tab_title || sc.tag || "Scene Analysis", 410, 37);
    ctx.restore();
  }

  // ============================================================
  // MASTER ACTION-DRIVEN SCENE CHOREOGRAPHER
  // ============================================================
  function drawActionScene(sc, isPhase1) {
    const lines = sc.lines || [];
    const count = Math.max(1, lines.length);
    const lineDurationMs = 3500;

    // Determine currently playing line index
    const activeLineIdx = Math.min(count - 1, Math.floor(currentTimeMs / lineDurationMs));
    const activeLine = lines[activeLineIdx] || {};
    const lineElapsedMs = currentTimeMs - (activeLineIdx * lineDurationMs);
    const lineProgress = Math.min(1.0, Math.max(0, lineElapsedMs / lineDurationMs));

    // Phase 2 Reference Banner (if any)
    if (sc.story_point_ref) {
      ctx.save();
      ctx.fillStyle = "#FFFBEB";
      ctx.strokeStyle = "#FDE68A";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(60, 56, 880, 30, 6);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#B45309";
      ctx.font = `800 ${Math.round(11.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(`🎯 ${sc.story_point_ref}`, 76, 76);
      ctx.restore();
    }

    // Layout Archetype
    const layout = sc.layout_archetype || detectLayoutFallback(sc);
    updateLayoutBadge(layout);

    // Draw Layout Frame / Backdrop
    drawLayoutFrame(layout, sc, isPhase1, activeLineIdx, lineProgress);

    // Line Stepper Indicator at top of stage
    drawLineStepperBar(lines, activeLineIdx, lineProgress);

    // Render the specific Kinetic Action on the Stage
    const actionType = activeLine.action_type || detectActionFallback(activeLine);
    const payload = activeLine.action_payload || {};

    // Trigger synced Lottie Vector Overlay
    updateLottieAnimation(actionType);

    ctx.save();
    switch (actionType) {
      case "money_transfer":
        drawMoneyTransferAction(payload, lineProgress);
        break;
      case "contract_sign":
        drawContractSignAction(payload, lineProgress);
        break;
      case "handshake_consent":
        drawHandshakeConsentAction(payload, lineProgress);
        break;
      case "goods_transport":
        drawGoodsTransportAction(payload, lineProgress);
        break;
      case "breach_block":
        drawBreachBlockAction(payload, lineProgress);
        break;
      case "balance_scale":
        drawBalanceScaleAction(payload, lineProgress);
        break;
      case "financial_meter":
        drawFinancialMeterAction(payload, lineProgress);
        break;
      case "gavel_verdict":
        drawGavelVerdictAction(payload, lineProgress);
        break;
      case "clock_limitation":
        drawClockLimitationAction(payload, lineProgress);
        break;
      case "property_transfer":
        drawPropertyTransferAction(payload, lineProgress);
        break;
      case "condition_checklist":
        drawConditionChecklistAction(payload, lineProgress);
        break;
      case "lock_security":
        drawLockSecurityAction(payload, lineProgress);
        break;
      case "corporate_board":
        drawCorporateBoardAction(payload, lineProgress);
        break;
      case "notice_dispatch":
        drawNoticeDispatchAction(payload, lineProgress);
        break;
      case "penalty_fine":
        drawPenaltyFineAction(payload, lineProgress);
        break;
      case "waterfall_flow":
        drawWaterfallFlowAction(payload, lineProgress);
        break;
      default:
        drawHandshakeConsentAction(payload, lineProgress);
    }
    ctx.restore();

    // Bottom Action Spoken Subtitle Bar
    drawBottomActionSubtitle(activeLine, activeLineIdx + 1, count, lineProgress);
  }

  function updateLayoutBadge(layout) {
    const badge = document.getElementById("anim_layout_badge");
    if (!badge) return;
    const names = {
      "layout_bilateral_split": "👥 BILATERAL SPLIT",
      "layout_sequential_pipeline": "⚡ PIPELINE FLOW",
      "layout_quadrant_grid": "🧩 4-PILLAR GRID",
      "layout_precedent_parchment": "📜 JUDICIAL RATIO",
      "layout_hero_stage": "🎭 HERO STAGE"
    };
    badge.textContent = names[layout] || "🎭 HERO STAGE";
  }

  function detectLayoutFallback(sc) {
    const t = ((sc.tab_title || "") + " " + (sc.tag || "")).toLowerCase();
    if (t.includes("party") || t.includes("parties") || t.includes("origin") || t.includes("proposal") || t.includes("versus") || t.includes("vs")) {
      return "layout_bilateral_split";
    }
    if (t.includes("ingredient") || t.includes("elements") || t.includes("conditions") || t.includes("matrix")) {
      return "layout_quadrant_grid";
    }
    if (t.includes("precedent") || t.includes("landmark") || t.includes("verdict") || t.includes("judicial") || t.includes("ratio")) {
      return "layout_precedent_parchment";
    }
    if (t.includes("process") || t.includes("lifecycle") || t.includes("timeline") || t.includes("flow") || t.includes("breach &")) {
      return "layout_sequential_pipeline";
    }
    return "layout_hero_stage";
  }

  function detectActionFallback(line) {
    const s = ((line.line_title || "") + " " + (line.sentence || "")).toLowerCase();
    if (s.includes("money") || s.includes("rent") || s.includes("pay") || s.includes("rupee") || s.includes("consideration") || s.includes("advance") || s.includes("deposit")) return "money_transfer";
    if (s.includes("sign") || s.includes("contract") || s.includes("agreement") || s.includes("deed") || s.includes("register") || s.includes("executed")) return "contract_sign";
    if (s.includes("truck") || s.includes("deliver") || s.includes("transport") || s.includes("goods") || s.includes("shipment") || s.includes("cargo")) return "goods_transport";
    if (s.includes("breach") || s.includes("delay") || s.includes("fail") || s.includes("dispute") || s.includes("broken") || s.includes("default")) return "breach_block";
    if (s.includes("scale") || s.includes("balance") || s.includes("ordinary vs") || s.includes("safe harbor") || s.includes("weigh")) return "balance_scale";
    if (s.includes("profit") || s.includes("loss") || s.includes("damage") || s.includes("meter") || s.includes("trend") || s.includes("revenue")) return "financial_meter";
    if (s.includes("court") || s.includes("verdict") || s.includes("judge") || s.includes("gavel") || s.includes("precedent") || s.includes("ruling")) return "gavel_verdict";
    if (s.includes("time") || s.includes("clock") || s.includes("limitation") || s.includes("period") || s.includes("deadline") || s.includes("expire")) return "clock_limitation";
    if (s.includes("property") || s.includes("land") || s.includes("house") || s.includes("villa") || s.includes("conveyance") || s.includes("possession")) return "property_transfer";
    if (s.includes("condition") || s.includes("checklist") || s.includes("ingredient") || s.includes("criteria") || s.includes("test")) return "condition_checklist";
    if (s.includes("lock") || s.includes("security") || s.includes("guarantee") || s.includes("fiduciary") || s.includes("shield")) return "lock_security";
    if (s.includes("board") || s.includes("resolution") || s.includes("vote") || s.includes("meeting") || s.includes("company") || s.includes("corporate")) return "corporate_board";
    if (s.includes("notice") || s.includes("speed post") || s.includes("dispatch") || s.includes("letter") || s.includes("telegram")) return "notice_dispatch";
    if (s.includes("penalty") || s.includes("fine") || s.includes("late fee") || s.includes("challan") || s.includes("punitive")) return "penalty_fine";
    if (s.includes("waterfall") || s.includes("computation") || s.includes("deduct") || s.includes("calculation") || s.includes("quantum")) return "waterfall_flow";
    return "handshake_consent";
  }

  // ============================================================
  // LOTTIE VECTOR ANIMATION OVERLAY MANAGER
  // ============================================================
  let currentLottieAnim = null;
  let currentLottieId = null;

  function updateLottieAnimation(actionType) {
    const overlay = document.getElementById("lottie_overlay");
    if (!overlay || !window.lottie) return;

    const map = {
      "money_transfer": "dollar-sign",
      "contract_sign": "file-text",
      "handshake_consent": "check-circle",
      "goods_transport": "package",
      "breach_block": "alert-triangle",
      "balance_scale": "layers",
      "financial_meter": "trending-down",
      "gavel_verdict": "award",
      "clock_limitation": "clock",
      "property_transfer": "package",
      "condition_checklist": "clipboard",
      "lock_security": "lock",
      "corporate_board": "briefcase",
      "notice_dispatch": "file-text",
      "penalty_fine": "alert-circle",
      "waterfall_flow": "activity"
    };

    const lottieId = map[actionType] || "activity";
    if (currentLottieId === lottieId && currentLottieAnim) {
      return;
    }

    if (currentLottieAnim) {
      try { currentLottieAnim.destroy(); } catch (e) {}
      currentLottieAnim = null;
    }

    currentLottieId = lottieId;
    overlay.innerHTML = `<div id="lottie_badge" style="position:absolute; top:20px; right:35px; width:48px; height:48px; background:rgba(255,255,255,0.95); backdrop-filter:blur(8px); border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.08); border:1.5px solid #E2E8F0; display:flex; align-items:center; justify-content:center; padding:6px; pointer-events:none;"></div>`;

    try {
      const container = document.getElementById("lottie_badge");
      if (container) {
        currentLottieAnim = window.lottie.loadAnimation({
          container: container,
          renderer: 'svg',
          loop: true,
          autoplay: isPlaying,
          path: `/static/assets/lottie/${lottieId}.json`
        });
      }
    } catch (e) {
      console.warn("[LOTTIE] Load error for", lottieId, e);
    }
  }

  // ============================================================
  // SLIDE LAYOUT ARCHETYPE FRAME RENDERERS (5 DISTINCT LAYOUTS)
  // ============================================================
  function drawLayoutFrame(layout, sc, isPhase1, activeLineIdx, progress) {
    ctx.save();
    switch (layout) {
      case "layout_bilateral_split":
        drawBilateralSplitFrame(sc, isPhase1, activeLineIdx, progress);
        break;
      case "layout_sequential_pipeline":
        drawSequentialPipelineFrame(sc, isPhase1, activeLineIdx, progress);
        break;
      case "layout_quadrant_grid":
        drawQuadrantGridFrame(sc, isPhase1, activeLineIdx, progress);
        break;
      case "layout_precedent_parchment":
        drawPrecedentParchmentFrame(sc, isPhase1, activeLineIdx, progress);
        break;
      case "layout_hero_stage":
      default:
        drawHeroStageFrame(sc, isPhase1, activeLineIdx, progress);
    }
    ctx.restore();
  }

  function drawBilateralSplitFrame(sc, isPhase1, activeLineIdx, progress) {
    ctx.save();
    // Left Zone (Party A / Promisor)
    ctx.fillStyle = "rgba(238, 242, 255, 0.45)";
    ctx.beginPath();
    ctx.roundRect(50, 128, 220, 246, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(199, 210, 254, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();

    // Right Zone (Party B / Promisee)
    ctx.fillStyle = "rgba(236, 253, 245, 0.45)";
    ctx.beginPath();
    ctx.roundRect(730, 128, 220, 246, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(167, 243, 208, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Column Header Tags
    ctx.setLineDash([]);
    ctx.fillStyle = "#4338CA";
    ctx.font = "800 10.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("🏛️ PARTY A / PROMISOR", 160, 146);

    ctx.fillStyle = "#047857";
    ctx.font = "800 10.5px JetBrains Mono, monospace";
    ctx.fillText("⚖️ PARTY B / PROMISEE", 840, 146);

    // Center Dynamic Interaction Conduit
    ctx.strokeStyle = "rgba(226, 232, 240, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(270, 250);
    ctx.lineTo(730, 250);
    ctx.stroke();
    ctx.restore();
  }

  function drawSequentialPipelineFrame(sc, isPhase1, activeLineIdx, progress) {
    ctx.save();
    const stages = ["1. Agreement & Terms", "2. Performance / Incident", "3. Statutory Consequence"];
    const startX = 140;
    const segW = 210;
    const gap = 45;
    const y = 138;

    stages.forEach((st, i) => {
      const segX = startX + i * (segW + gap);
      const isCur = i === activeLineIdx || (activeLineIdx >= stages.length && i === stages.length - 1);
      const isPast = i < activeLineIdx;

      // Conduit Pipe Connector
      if (i < stages.length - 1) {
        ctx.strokeStyle = isPast ? "#059669" : "#CBD5E1";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(segX + segW, y);
        ctx.lineTo(segX + segW + gap, y);
        ctx.stroke();

        ctx.fillStyle = isPast ? "#059669" : "#94A3B8";
        ctx.beginPath();
        ctx.moveTo(segX + segW + gap / 2 + 4, y);
        ctx.lineTo(segX + segW + gap / 2 - 4, y - 5);
        ctx.lineTo(segX + segW + gap / 2 - 4, y + 5);
        ctx.fill();
      }

      ctx.fillStyle = isCur ? "#EEF2FF" : (isPast ? "#ECFDF5" : "#F8FAFC");
      ctx.strokeStyle = isCur ? "#4F46E5" : (isPast ? "#059669" : "#E2E8F0");
      ctx.lineWidth = isCur ? 2 : 1.5;
      ctx.beginPath();
      ctx.roundRect(segX, y - 14, segW, 28, 6);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = isCur ? "#4338CA" : (isPast ? "#047857" : "#64748B");
      ctx.font = `800 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(st, segX + segW / 2, y + 4);
    });
    ctx.restore();
  }

  function drawQuadrantGridFrame(sc, isPhase1, activeLineIdx, progress) {
    ctx.save();
    const yTop = 130;
    const h = 244;
    ctx.strokeStyle = "rgba(226, 232, 240, 0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(500, yTop);
    ctx.lineTo(500, yTop + h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(60, yTop + h / 2);
    ctx.lineTo(940, yTop + h / 2);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = "#94A3B8";
    ctx.font = "800 10px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText("PILLAR 1: CAPACITY & CONSENT", 70, yTop + 16);
    ctx.fillText("PILLAR 3: LAWFUL OBJECT", 70, yTop + h / 2 + 16);
    ctx.textAlign = "right";
    ctx.fillText("PILLAR 2: CONSIDERATION", 930, yTop + 16);
    ctx.fillText("PILLAR 4: LEGAL VALIDITY", 930, yTop + h / 2 + 16);
    ctx.restore();
  }

  function drawPrecedentParchmentFrame(sc, isPhase1, activeLineIdx, progress) {
    ctx.save();
    const px = 100, py = 126, pw = 800, ph = 250;
    ctx.fillStyle = "#FFFDF9";
    ctx.strokeStyle = "#D97706";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(180, 83, 9, 0.12)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 10);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    ctx.strokeStyle = "#FDE68A";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(px + 8, py + 8, pw - 16, ph - 16, 6);
    ctx.stroke();

    ctx.fillStyle = "#B45309";
    ctx.font = "800 11px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("⚖️ IN THE HIGH COURT OF JUDICATURE / SUPREME COURT RATIO", 500, py + 26);
    ctx.restore();
  }

  function drawHeroStageFrame(sc, isPhase1, activeLineIdx, progress) {
    ctx.save();
    const radGrd = ctx.createRadialGradient(500, 250, 40, 500, 250, 400);
    radGrd.addColorStop(0, isPhase1 ? "rgba(254, 243, 199, 0.35)" : "rgba(236, 253, 245, 0.35)");
    radGrd.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = radGrd;
    ctx.fillRect(60, 126, 880, 250);
    ctx.restore();
  }

  function drawLineStepperBar(lines, activeLineIdx, lineProgress) {
    const count = lines.length;
    const startX = 60;
    const totalW = 880;
    const gap = 12;
    const segW = Math.floor((totalW - (count - 1) * gap) / count);
    const y = 92;

    lines.forEach((l, i) => {
      const segX = startX + i * (segW + gap);
      const isPast = i < activeLineIdx;
      const isCur = i === activeLineIdx;

      ctx.save();
      // Track
      ctx.fillStyle = isPast ? "#059669" : (isCur ? "#EEF2FF" : "#F1F5F9");
      ctx.strokeStyle = isPast ? "#059669" : (isCur ? "#4F46E5" : "#E2E8F0");
      ctx.lineWidth = isCur ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(segX, y, segW, 28, 6);
      ctx.fill(); ctx.stroke();

      // Progress fill for active line
      if (isCur) {
        ctx.fillStyle = "#C7D2FE";
        ctx.beginPath();
        ctx.roundRect(segX + 2, y + 2, (segW - 4) * lineProgress, 24, 4);
        ctx.fill();
      }

      ctx.fillStyle = isPast ? "#FFFFFF" : (isCur ? "#4338CA" : "#64748B");
      ctx.font = `800 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = "center";
      const iconPill = isPast ? "✓" : `Line ${i + 1}`;
      ctx.fillText(`${iconPill} · ${l.line_title || `Step ${i+1}`}`, segX + segW / 2, y + 18);
      ctx.restore();
    });
  }

  // ============================================================
  // ACTION 1: MONEY / CONSIDERATION TRANSFER (COINS FLYING)
  // ============================================================
  function drawMoneyTransferAction(payload, progress) {
    const fromActor = payload.from_actor || "Tenant (Mr. Murali)";
    const toActor = payload.to_actor || "Landlord (Dr. Susan)";
    const amount = payload.amount || "₹50,000";
    const desc = payload.description || "Lawful Consideration Exchanged";

    const yCenter = 230;
    const xLeft = 180;
    const xRight = 820;

    // Actor A (From / Payer)
    drawActorPillar(xLeft, yCenter, fromActor, payload.from_icon || "user", "#4F46E5", "PAYER");

    // Actor B (To / Receiver)
    const isReceiverGlowing = progress > 0.4;
    drawActorPillar(xRight, yCenter, toActor, payload.to_icon || "store", "#059669", "RECEIVER", isReceiverGlowing);

    // Connecting Bezier Stream Path
    ctx.save();
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(xLeft + 55, yCenter);
    ctx.quadraticCurveTo(500, yCenter - 90, xRight - 55, yCenter);
    ctx.stroke();
    ctx.restore();

    // Animated Flying Coins / Currency Notes along the Bezier curve
    const numCoins = 7;
    for (let c = 0; c < numCoins; c++) {
      const coinOffset = (c / numCoins);
      const coinT = (progress * 1.6 + coinOffset) % 1.0;
      if (progress < 0.1 && coinT > 0.5) continue;

      // Quadratic Bezier Formula: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
      const t = coinT;
      const bx = (1 - t) * (1 - t) * (xLeft + 55) + 2 * (1 - t) * t * 500 + t * t * (xRight - 55);
      const by = (1 - t) * (1 - t) * yCenter + 2 * (1 - t) * t * (yCenter - 90) + t * t * yCenter;

      ctx.save();
      ctx.shadowColor = "rgba(234, 179, 8, 0.6)";
      ctx.shadowBlur = 12;

      // Gold Coin
      ctx.fillStyle = "#EAB308";
      ctx.strokeStyle = "#CA8A04";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(bx, by, 14, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 13px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("₹", bx, by + 4);
      ctx.restore();
    }

    // Center Floating Animated Amount Card
    ctx.save();
    const pillY = yCenter - 95;
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#059669";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(5, 150, 105, 0.25)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(380, pillY, 240, 52, 10);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#047857";
    ctx.font = `800 ${Math.round(17 * fontScale)}px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`💰 ${amount}`, 500, pillY + 28);

    ctx.fillStyle = "#64748B";
    ctx.font = `700 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(desc, 500, pillY + 44);
    ctx.restore();
  }

  // ============================================================
  // ACTION 2: CONTRACT SIGNING & WAX SEAL STAMP IMPACT
  // ============================================================
  function drawContractSignAction(payload, progress) {
    const title = payload.title || "LEGAL CONTRACT AGREEMENT";
    const parties = payload.parties || "Contracting Parties";
    const keyTerm = payload.key_term || "Mutual covenants & lawful object";
    const stampText = payload.stamp_text || "EXECUTED & REGISTERED";

    const cx = 500;
    const cy = 230;
    const w = 440;
    const h = 220;
    const x = cx - w / 2;
    const y = cy - h / 2;

    ctx.save();
    // Parchment with folded corner
    const fold = 24;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w - fold, y);
    ctx.lineTo(x + w, y + fold);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();

    ctx.fillStyle = "#FAFAF9";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(15, 23, 42, 0.12)";
    ctx.shadowBlur = 20;
    ctx.fill(); ctx.stroke();

    // Folded corner flap
    ctx.beginPath();
    ctx.moveTo(x + w - fold, y);
    ctx.lineTo(x + w - fold, y + fold);
    ctx.lineTo(x + w, y + fold);
    ctx.closePath();
    ctx.fillStyle = "#E7E5E4";
    ctx.stroke(); ctx.fill();

    // Document Title Header
    ctx.fillStyle = "#1E293B";
    ctx.font = `800 ${Math.round(14 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`📜 ${title.toUpperCase()}`, cx, y + 36);

    ctx.fillStyle = "#475569";
    ctx.font = `700 ${Math.round(11.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(`Parties: ${parties}`, cx, y + 60);

    // Decorative simulated clause lines
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    for (let l = 0; l < 3; l++) {
      ctx.beginPath();
      ctx.moveTo(x + 40, y + 85 + l * 20);
      ctx.lineTo(x + w - 40, y + 85 + l * 20);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.fillStyle = "#0284C7";
    ctx.font = `600 ${Math.round(11.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(`Key Covenant: ${keyTerm}`, cx, y + 155);

    // Signature Line (Bottom-Left)
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 40, y + h - 35);
    ctx.lineTo(x + 180, y + h - 35);
    ctx.stroke();

    // Animated Pen Signature drawing in real time
    if (progress > 0.25) {
      const signP = Math.min(1.0, (progress - 0.25) / 0.4);
      ctx.strokeStyle = "#1D4ED8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 45, y + h - 45);
      const signEndX = (x + 45) + (125 * signP);
      for (let sx = x + 45; sx < signEndX; sx += 12) {
        ctx.lineTo(sx, (y + h - 45) + Math.sin((sx - x) * 0.4) * 7);
      }
      ctx.stroke();

      ctx.fillStyle = "#1D4ED8";
      ctx.font = `bold 10px JetBrains Mono, monospace`;
      ctx.fillText("✍️ Signed", x + 110, y + h - 18);
    }

    // Wax Seal / Official Stamp Impact (Drops with impact at t > 0.65)
    if (progress > 0.65) {
      const stampP = Math.min(1.0, (progress - 0.65) / 0.25);
      const scaleBounce = 1.5 - (0.5 * stampP); // Bounce from 1.5 down to 1.0
      const stampX = x + w - 90;
      const stampY = y + h - 50;

      ctx.save();
      ctx.translate(stampX, stampY);
      ctx.scale(scaleBounce, scaleBounce);
      ctx.rotate(-0.15);

      // Red Wax Stamp Ring
      ctx.fillStyle = "#DC2626";
      ctx.strokeStyle = "#991B1B";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      // Inner Star & Stamped Text
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "800 8.5px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("OFFICIAL", 0, -8);
      ctx.fillText("SEAL", 0, 4);
      ctx.fillText("REGISTERED", 0, 16);
      ctx.restore();
    }

    ctx.restore();
  }

  // ============================================================
  // ACTION 3: HANDSHAKE CONSENT & VERIFICATION SHIELD
  // ============================================================
  function drawHandshakeConsentAction(payload, progress) {
    const partyA = payload.party_a || "Party A (Promisor)";
    const partyB = payload.party_b || "Party B (Promisee)";
    const rule = payload.consent_rule || "Free Consent (Section 10)";
    const status = payload.status || "Agreement formed with Free Consent";

    const cy = 230;
    // Sliding inward motion from sides to center
    const slideP = Math.min(1.0, progress / 0.5);
    const xA = 120 + (230 * slideP);
    const xB = 880 - (230 * slideP);

    // Left Party A Pillar
    drawActorPillar(xA, cy, partyA, "user", "#4F46E5", "PARTY A");

    // Right Party B Pillar
    drawActorPillar(xB, cy, partyB, "user-check", "#0284C7", "PARTY B");

    // Inward connecting handshake once arrived
    if (slideP > 0.8) {
      const bloomP = Math.min(1.0, (progress - 0.4) / 0.5);
      const cx = 500;

      ctx.save();
      ctx.shadowColor = "rgba(5, 150, 105, 0.4)";
      ctx.shadowBlur = 25 * bloomP;

      // Radiant Shield Circle
      ctx.fillStyle = "#ECFDF5";
      ctx.strokeStyle = "#059669";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 48 * bloomP, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      // Handshake Icon in center
      ctx.fillStyle = "#059669";
      ctx.font = `${Math.round(36 * bloomP)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("🤝", cx, cy + 13);

      // Top Floating Verification Shield Badge
      const badgeY = cy - 85;
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#059669";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx - 140, badgeY, 280, 46, 8);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#065F46";
      ctx.font = `800 ${Math.round(13 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.fillText(`🛡️ ${rule.toUpperCase()}`, cx, badgeY + 22);

      ctx.fillStyle = "#047857";
      ctx.font = `700 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.fillText(status, cx, badgeY + 38);

      ctx.restore();
    }
  }

  // ============================================================
  // ACTION 4: GOODS / CARGO VEHICLE TRANSPORT ANIMATION
  // ============================================================
  function drawGoodsTransportAction(payload, progress) {
    const origin = payload.origin || "Origin Depot";
    const dest = payload.destination || "Destination Facility";
    const cargo = payload.cargo || "Consignment Goods";

    const roadY = 250;
    const xStart = 160;
    const xEnd = 840;

    // Origin Depot (Left)
    drawBuildingDepot(xStart, roadY, origin, "🏭 ORIGIN", "#4F46E5");

    // Destination Warehouse (Right)
    drawBuildingDepot(xEnd, roadY, dest, "🏢 DESTINATION", "#059669");

    // Asphalt Road Highway with center dashed line
    ctx.save();
    ctx.fillStyle = "#334155";
    ctx.fillRect(xStart + 60, roadY - 14, (xEnd - xStart - 120), 40);

    ctx.strokeStyle = "#FDE047";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(xStart + 60, roadY + 6);
    ctx.lineTo(xEnd - 60, roadY + 6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Moving Delivery Truck physically driving across road
    const truckP = Math.min(1.0, progress * 1.1);
    const truckX = (xStart + 80) + (xEnd - xStart - 200) * truckP;
    const truckY = roadY - 8;

    ctx.save();
    // Truck Body
    ctx.fillStyle = "#2563EB";
    ctx.strokeStyle = "#1D4ED8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(truckX, truckY - 26, 75, 34, 4);
    ctx.fill(); ctx.stroke();

    // Truck Cab
    ctx.fillStyle = "#1E40AF";
    ctx.beginPath();
    ctx.roundRect(truckX + 70, truckY - 18, 30, 26, [0, 6, 6, 0]);
    ctx.fill(); ctx.stroke();

    // Window
    ctx.fillStyle = "#BAE6FD";
    ctx.fillRect(truckX + 78, truckY - 14, 16, 12);

    // Wheels
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.arc(truckX + 22, truckY + 10, 8, 0, Math.PI * 2);
    ctx.arc(truckX + 58, truckY + 10, 8, 0, Math.PI * 2);
    ctx.arc(truckX + 88, truckY + 10, 8, 0, Math.PI * 2);
    ctx.fill();

    // Floating Cargo Label above Truck
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#2563EB";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(truckX - 20, truckY - 60, 140, 26, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#1E3A8A";
    ctx.font = `800 ${Math.round(10.5 * fontScale)}px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`📦 ${cargo}`, truckX + 50, truckY - 43);

    ctx.restore();
  }

  // ============================================================
  // ACTION 5: BREACH / DELAY HAZARD ROADBLOCK & IMPACT CRACK
  // ============================================================
  function drawBreachBlockAction(payload, progress) {
    const title = payload.event_title || "BREACH OF CONTRACT";
    const cause = payload.cause || "Default in performance / delay past deadline";
    const consequence = payload.consequence || "Direct financial damage triggered";

    const cx = 500;
    const cy = 230;

    ctx.save();
    // Cracked Pathway
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(180, cy);
    ctx.lineTo(440, cy);
    // Jagged crack
    ctx.lineTo(470, cy - 25);
    ctx.lineTo(500, cy + 25);
    ctx.lineTo(530, cy - 20);
    ctx.lineTo(560, cy);
    ctx.lineTo(820, cy);
    ctx.stroke();

    // Flashing Crimson Hazard Beacon & Expanding Ripples
    const pulseP = (progress * 5) % 1.0;
    ctx.strokeStyle = `rgba(220, 38, 38, ${1 - pulseP})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 30 + pulseP * 50, 0, Math.PI * 2);
    ctx.stroke();

    // Roadblock Barrier in center
    ctx.fillStyle = "#FEF2F2";
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(220, 38, 38, 0.4)";
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.roundRect(cx - 160, cy - 100, 320, 110, 12);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Hazard Stripes Header
    ctx.save();
    ctx.clip();
    ctx.fillStyle = "#DC2626";
    ctx.fillRect(cx - 160, cy - 100, 320, 28);
    ctx.fillStyle = "#FEE2E2";
    for (let hx = cx - 180; hx < cx + 180; hx += 16) {
      ctx.beginPath();
      ctx.moveTo(hx, cy - 100); ctx.lineTo(hx + 8, cy - 100);
      ctx.lineTo(hx + 18, cy - 72); ctx.lineTo(hx + 10, cy - 72);
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 ${Math.round(11 * fontScale)}px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText("⚠️ CRITICAL BREACH / DISPUTE", cx, cy - 81);

    ctx.fillStyle = "#991B1B";
    ctx.font = `800 ${Math.round(14 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(title, cx, cy - 48);

    ctx.fillStyle = "#450A0A";
    ctx.font = `600 ${Math.round(11.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, `${cause} • ${consequence}`, cx, cy - 24, 290, 16);

    ctx.restore();
  }

  // ============================================================
  // ACTION 6: MECHANICAL BALANCE SCALE (REAL PHYSICS TILTING)
  // ============================================================
  function drawBalanceScaleAction(payload, progress) {
    const leftWeight = payload.left_weight || "Ordinary Loss (Direct)";
    const leftAmt = payload.left_amount || "₹1,50,00,000";
    const rightWeight = payload.right_weight || "Remote Loss (Excluded)";
    const rightAmt = payload.right_amount || "₹10,00,000";
    const verdict = payload.verdict || "Scale Tilts: Direct Damages Recoverable";

    const cx = 500;
    const cy = 250;

    // Real dynamic beam tilt with spring damping
    const tiltP = Math.min(1.0, Math.max(0, (progress - 0.25) / 0.5));
    const angle = tiltP * -0.16; // left drops (ordinary loss heavier)

    ctx.save();
    // Central Pillar
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 90); ctx.lineTo(cx, cy + 100);
    ctx.stroke();

    // Fulcrum Base
    ctx.fillStyle = "#1E293B";
    ctx.beginPath();
    ctx.moveTo(cx - 50, cy + 110); ctx.lineTo(cx + 50, cy + 110); ctx.lineTo(cx, cy + 85);
    ctx.closePath(); ctx.fill();

    // Tilting Beam
    ctx.translate(cx, cy - 90);
    ctx.rotate(angle);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-220, 0); ctx.lineTo(220, 0);
    ctx.stroke();

    // Left Pan (Recoverable Natural Loss)
    ctx.save();
    ctx.translate(-220, 0);
    ctx.rotate(-angle);
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-45, 80);
    ctx.moveTo(0, 0); ctx.lineTo(45, 80);
    ctx.stroke();

    ctx.fillStyle = "#ECFDF5";
    ctx.strokeStyle = "#059669";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-90, 80, 180, 68, 8);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#065F46";
    ctx.font = `800 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("✅ " + leftWeight, 0, 102);
    ctx.fillStyle = "#047857";
    ctx.font = `800 ${Math.round(15 * fontScale)}px JetBrains Mono, monospace`;
    ctx.fillText(leftAmt, 0, 130);
    ctx.restore();

    // Right Pan (Remote Disputed Loss)
    ctx.save();
    ctx.translate(220, 0);
    ctx.rotate(-angle);
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-45, 80);
    ctx.moveTo(0, 0); ctx.lineTo(45, 80);
    ctx.stroke();

    ctx.fillStyle = "#FEF2F2";
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-90, 80, 180, 68, 8);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#991B1B";
    ctx.font = `800 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("❌ " + rightWeight, 0, 102);
    ctx.fillStyle = "#DC2626";
    ctx.font = `800 ${Math.round(15 * fontScale)}px JetBrains Mono, monospace`;
    ctx.fillText(rightAmt, 0, 130);
    ctx.restore();

    ctx.restore();

    // Verdict Badge
    if (tiltP > 0.6) {
      ctx.save();
      ctx.fillStyle = "#059669";
      ctx.beginPath();
      ctx.roundRect(cx - 160, cy - 135, 320, 36, 6);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `800 ${Math.round(12 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`⚖️ ${verdict}`, cx, cy - 112);
      ctx.restore();
    }
  }

  // ============================================================
  // ACTION 7: FINANCIAL METER (DYNAMIC CHART DRAWING)
  // ============================================================
  function drawFinancialMeterAction(payload, progress) {
    const metric = payload.metric_name || "Business Financial Performance";
    const dir = payload.direction || "down";
    const val = payload.value || "(-) ₹5,00,000";
    const detail = payload.detail || "Direct financial damage from breach";

    const x = 240;
    const y = 140;
    const w = 520;
    const h = 170;

    ctx.save();
    // Grid Box
    ctx.fillStyle = "#FAFAF9";
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill(); ctx.stroke();

    // Coordinate grid lines
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    for (let gy = y + 30; gy < y + h; gy += 35) {
      ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
    }

    // Dynamic Graph Line
    const graphP = Math.min(1.0, progress * 1.2);
    ctx.strokeStyle = dir === "down" ? "#DC2626" : "#059669";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 20, dir === "down" ? y + 40 : y + h - 30);

    const endX = (x + 20) + (w - 60) * graphP;
    const startY = dir === "down" ? y + 40 : y + h - 30;
    const targetY = dir === "down" ? y + h - 35 : y + 35;
    const curY = startY + (targetY - startY) * graphP;

    ctx.lineTo(endX, curY);
    ctx.stroke();

    // Glowing tip indicator
    ctx.fillStyle = dir === "down" ? "#DC2626" : "#059669";
    ctx.beginPath();
    ctx.arc(endX, curY, 7, 0, Math.PI * 2);
    ctx.fill();

    // Top Header Badge
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = dir === "down" ? "#DC2626" : "#059669";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + w / 2 - 140, y - 40, 280, 48, 8);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = dir === "down" ? "#991B1B" : "#047857";
    ctx.font = `800 ${Math.round(15 * fontScale)}px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`${dir === 'down' ? '📉' : '📈'} ${val}`, x + w / 2, y - 18);

    ctx.fillStyle = "#475569";
    ctx.font = `600 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(detail, x + w / 2, y + h + 22);

    ctx.restore();
  }

  // ============================================================
  // ACTION 8: GAVEL VERDICT & DECREE STRIKE
  // ============================================================
  function drawGavelVerdictAction(payload, progress) {
    const citation = payload.case_citation || "Supreme Court of India / Landmark Precedent";
    const ratio = payload.ratio || "Damages awarded strictly for natural consequences";

    const cx = 500;
    const cy = 200;

    ctx.save();
    // Wooden Soundblock
    ctx.fillStyle = "#78350F";
    ctx.strokeStyle = "#451A03";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cx - 60, cy + 30, 120, 28, 6);
    ctx.fill(); ctx.stroke();

    // Gavel Strike Impact at t > 0.4
    const strikeP = Math.min(1.0, progress / 0.4);
    const gavelAngle = strikeP >= 1.0 ? 0 : (1.0 - strikeP) * -0.7; // swings down through arc

    ctx.save();
    ctx.translate(cx, cy + 30);
    ctx.rotate(gavelAngle);

    // Gavel Handle
    ctx.strokeStyle = "#92400E";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-65, -55);
    ctx.stroke();

    // Gavel Head
    ctx.fillStyle = "#78350F";
    ctx.strokeStyle = "#451A03";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-15, -15, 30, 20, 4);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // Expanding shockwaves upon impact
    if (strikeP >= 1.0) {
      const shockP = (progress * 4) % 1.0;
      ctx.strokeStyle = `rgba(180, 83, 9, ${1 - shockP})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy + 30, 20 + shockP * 45, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Scroll Decree Out Below
    if (progress > 0.4) {
      const decreeP = Math.min(1.0, (progress - 0.4) / 0.4);
      const dy = cy + 70;

      ctx.fillStyle = "#FFFBEB";
      ctx.strokeStyle = "#D97706";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx - 220, dy, 440, 75, 10);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#B45309";
      ctx.font = `800 ${Math.round(12 * fontScale)}px JetBrains Mono, monospace`;
      ctx.textAlign = "center";
      ctx.fillText(`⚖️ ${citation.toUpperCase()}`, cx, dy + 24);

      ctx.fillStyle = "#0F172A";
      ctx.font = `600 ${Math.round(12 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      wrapCanvasText(ctx, ratio, cx, dy + 48, 410, 18);
    }
    ctx.restore();
  }

  // ============================================================
  // ACTION 9: CLOCK LIMITATION / TIME IS OF THE ESSENCE
  // ============================================================
  function drawClockLimitationAction(payload, progress) {
    const title = payload.deadline_title || "Limitation Period / Time of Essence";
    const timeLimit = payload.time_limit || "3 Years from Date of Breach";
    const status = payload.status || "Within Statutory Limitation Period";

    const cx = 500, cy = 215;

    // Clock Outer Metallic Casing
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 4;
    ctx.shadowColor = "rgba(71, 85, 105, 0.25)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // 12 Dial Tick Marks
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x1 = cx + Math.cos(a) * 36;
      const y1 = cy + Math.sin(a) * 36;
      const x2 = cx + Math.cos(a) * 42;
      const y2 = cy + Math.sin(a) * 42;
      ctx.strokeStyle = i % 3 === 0 ? "#0F172A" : "#94A3B8";
      ctx.lineWidth = i % 3 === 0 ? 2.5 : 1.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }

    // Animated Rotating Clock Hands
    const secAngle = -Math.PI / 2 + progress * Math.PI * 6; // Sweeps 3 full rotations
    const minAngle = -Math.PI / 2 + progress * Math.PI * 0.8;

    // Minute Hand (Dark Indigo)
    ctx.strokeStyle = "#1E293B";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(minAngle) * 26, cy + Math.sin(minAngle) * 26);
    ctx.stroke();

    // Second Hand (Crimson Red with Spring Tick Vibration)
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(secAngle) * 34, cy + Math.sin(secAngle) * 34);
    ctx.stroke();

    // Center Gold Pin
    ctx.fillStyle = "#F59E0B";
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();

    // Swinging Brass Pendulum Below Clock
    const pendLen = 50;
    const pendAngle = Math.sin(progress * 18) * 0.32;
    const pendX = cx + Math.sin(pendAngle) * pendLen;
    const pendY = cy + 48 + Math.cos(pendAngle) * pendLen;

    ctx.strokeStyle = "#D97706";
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx, cy + 46); ctx.lineTo(pendX, pendY); ctx.stroke();

    ctx.fillStyle = "#F59E0B";
    ctx.strokeStyle = "#B45309";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(pendX, pendY, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Left Statutory Deadline Card
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(100, cy - 42, 280, 84, 10);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#DC2626";
    ctx.font = `800 11px JetBrains Mono, monospace`;
    ctx.textAlign = "left";
    ctx.fillText("⏳ STATUTORY TIME LIMIT", 118, cy - 18);

    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(13 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(title, 118, cy + 6);

    ctx.fillStyle = "#64748B";
    ctx.font = `600 12px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(timeLimit, 118, cy + 28);

    // Right Compliance / Barred Status Card
    ctx.fillStyle = "#ECFDF5";
    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(620, cy - 42, 280, 84, 10);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#047857";
    ctx.font = `800 11px JetBrains Mono, monospace`;
    ctx.textAlign = "left";
    ctx.fillText("⚖️ LEGAL EFFECT OF TIME", 638, cy - 18);

    ctx.fillStyle = "#065F46";
    ctx.font = `800 ${Math.round(12.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, status, 638, cy + 8, 250, 18, "left", 2);

    ctx.restore();
  }

  // ============================================================
  // ACTION 10: PROPERTY TRANSFER & CONVEYANCE OF PREMISES
  // ============================================================
  function drawPropertyTransferAction(payload, progress) {
    const propName = payload.property_name || "Commercial Land & Building";
    const transferor = payload.transferor || "Owner (Transferor)";
    const transferee = payload.transferee || "Purchaser (Transferee)";
    const status = payload.title_status || "Absolute Title & Possession Conveyed";

    const yCenter = 225;
    const xLeft = 170;
    const xRight = 830;

    // Parties
    drawActorPillar(xLeft, yCenter, transferor, "user", "#4F46E5", "SELLER");
    drawActorPillar(xRight, yCenter, transferee, "user", "#059669", "BUYER", progress > 0.5);

    // Architectural Villa Silhoutte in Center
    ctx.save();
    const vx = 500, vy = yCenter - 15;
    ctx.fillStyle = "#F8FAFC";
    ctx.strokeStyle = "#3B82F6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(vx - 65, vy - 35, 130, 80, 8);
    ctx.fill(); ctx.stroke();

    // Triangular Roof
    ctx.fillStyle = "#EFF6FF";
    ctx.beginPath();
    ctx.moveTo(vx - 75, vy - 35);
    ctx.lineTo(vx, vy - 70);
    ctx.lineTo(vx + 75, vy - 35);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Property Label
    ctx.fillStyle = "#1E40AF";
    ctx.font = "800 10.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("TITLE DEED PREMISES", vx, vy + 2);
    ctx.fillStyle = "#0F172A";
    ctx.font = `700 11px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(propName, vx, vy + 24);

    // Flying Golden Ornate Key from Left to Right
    const keyX = (1 - progress) * (xLeft + 55) + progress * (xRight - 55);
    const keyY = yCenter - 55 - Math.sin(progress * Math.PI) * 45;

    ctx.shadowColor = "rgba(234, 179, 8, 0.6)";
    ctx.shadowBlur = 14;

    // Key Ring
    ctx.strokeStyle = "#CA8A04";
    ctx.fillStyle = "#FDE047";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(keyX - 14, keyY, 10, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Key Shaft & Teeth
    ctx.beginPath();
    ctx.moveTo(keyX - 4, keyY);
    ctx.lineTo(keyX + 22, keyY);
    ctx.lineTo(keyX + 22, keyY + 8);
    ctx.moveTo(keyX + 14, keyY);
    ctx.lineTo(keyX + 14, keyY + 6);
    ctx.stroke();

    // Title Status Badge Below
    ctx.fillStyle = "#ECFDF5";
    ctx.strokeStyle = "#059669";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(vx - 140, vy + 58, 280, 28, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#065F46";
    ctx.font = `800 11px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`🔑 ${status.toUpperCase()}`, vx, vy + 76);

    ctx.restore();
  }

  // ============================================================
  // ACTION 11: STATUTORY CONDITION CHECKLIST BOARD
  // ============================================================
  function drawConditionChecklistAction(payload, progress) {
    const criteria = payload.criteria || [
      "1. Free Consent of Parties (Section 14)",
      "2. Competency of Parties (Section 11)",
      "3. Lawful Consideration & Object (Section 23)",
      "4. Not Expressly Declared Void (Section 24-30)"
    ];
    const status = payload.compliance_status || "All Essential Ingredients Fully Satisfied";

    const bx = 220, by = 138, bw = 560, bh = 196;

    ctx.save();
    // Clipboard Body
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(0, 0, 0, 0.06)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 10);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Top Metallic Clip
    ctx.fillStyle = "#475569";
    ctx.beginPath();
    ctx.roundRect(bx + bw / 2 - 45, by - 10, 90, 18, 4);
    ctx.fill();

    // Header
    ctx.fillStyle = "#4338CA";
    ctx.font = `800 11.5px JetBrains Mono, monospace`;
    ctx.textAlign = "left";
    ctx.fillText("📋 STATUTORY COMPLIANCE CHECKLIST", bx + 24, by + 28);

    // Checklist Rows
    const rowH = 32;
    const count = criteria.length;
    criteria.forEach((crit, i) => {
      const ry = by + 46 + i * rowH;
      const isChecked = progress >= (i + 1) / (count + 0.5);

      // Row Background
      ctx.fillStyle = isChecked ? "#ECFDF5" : "#F8FAFC";
      ctx.strokeStyle = isChecked ? "#A7F3D0" : "#E2E8F0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx + 20, ry, bw - 40, 26, 6);
      ctx.fill(); ctx.stroke();

      // Check Circle Icon
      ctx.fillStyle = isChecked ? "#059669" : "#CBD5E1";
      ctx.beginPath();
      ctx.arc(bx + 38, ry + 13, 8, 0, Math.PI * 2);
      ctx.fill();

      // White Checkmark
      if (isChecked) {
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + 34, ry + 13);
        ctx.lineTo(bx + 37, ry + 16);
        ctx.lineTo(bx + 43, ry + 10);
        ctx.stroke();
      }

      // Criterion Text
      ctx.fillStyle = isChecked ? "#065F46" : "#475569";
      ctx.font = `700 ${Math.round(11.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(crit, bx + 56, ry + 17);
    });

    // Bottom Compliance Pill
    if (progress > 0.8) {
      ctx.fillStyle = "#059669";
      ctx.font = `800 11px JetBrains Mono, monospace`;
      ctx.textAlign = "right";
      ctx.fillText(`✓ ${status.toUpperCase()}`, bx + bw - 24, by + 28);
    }
    ctx.restore();
  }

  // ============================================================
  // ACTION 12: LOCK & STATUTORY FIDUCIARY SECURITY
  // ============================================================
  function drawLockSecurityAction(payload, progress) {
    const title = payload.security_type || "Statutory Bank Guarantee / Non-Disclosure";
    const status = payload.status || "Security Lock Engaged • Valid Protection";
    const scope = payload.protection_scope || "Protects against unauthorized breach or breach of trust";

    const cx = 500, cy = 220;

    ctx.save();
    // Radiant Cyan Fiduciary Shield Ring
    const shieldP = (progress * 2) % 1.0;
    ctx.strokeStyle = `rgba(6, 182, 212, ${0.8 - shieldP * 0.6})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + 5, 55 + shieldP * 30, 0, Math.PI * 2);
    ctx.stroke();

    // Steel Shackle (Arch)
    const isUnlocked = progress > 0.55;
    const shackleOffset = isUnlocked ? -14 : 0;
    ctx.strokeStyle = "#64748B";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(cx, cy - 20 + shackleOffset, 24, Math.PI, 0, false);
    ctx.lineTo(cx + 24, cy - 2);
    if (!isUnlocked) {
      ctx.lineTo(cx - 24, cy - 2);
    }
    ctx.stroke();

    // Lock Body
    ctx.fillStyle = "#0284C7";
    ctx.strokeStyle = "#0369A1";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(2, 132, 199, 0.35)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.roundRect(cx - 40, cy - 8, 80, 64, 10);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Keyhole
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx, cy + 16, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy + 18);
    ctx.lineTo(cx + 3, cy + 18);
    ctx.lineTo(cx + 5, cy + 32);
    ctx.lineTo(cx - 5, cy + 32);
    ctx.closePath();
    ctx.fill();

    // Left Security Detail Card
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#BAE6FD";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(110, cy - 35, 270, 78, 10);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#0284C7";
    ctx.font = "800 11px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText("🛡️ STATUTORY SECURITY", 128, cy - 12);
    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(12.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, title, 128, cy + 10, 235, 16, "left", 2);

    // Right Protection Scope Card
    ctx.fillStyle = "#F0FDF4";
    ctx.strokeStyle = "#86EFAC";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(620, cy - 35, 270, 78, 10);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#15803D";
    ctx.font = "800 11px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText("🔒 FIDUCIARY STATUS", 638, cy - 12);
    ctx.fillStyle = "#166534";
    ctx.font = `700 ${Math.round(11.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, status + ": " + scope, 638, cy + 10, 235, 16, "left", 2);

    ctx.restore();
  }

  // ============================================================
  // ACTION 13: CORPORATE BOARDROOM & SHAREHOLDER RESOLUTION
  // ============================================================
  function drawCorporateBoardAction(payload, progress) {
    const compName = payload.company_name || "Corporate Enterprise Ltd.";
    const resolution = payload.resolution || "Board Resolution / Shareholder Voting";
    const voting = payload.voting_result || "85% Assent (Resolution Carried)";

    const bx = 500, by = 220;

    ctx.save();
    // Executive Boardroom Conference Table (Perspective Oval)
    ctx.fillStyle = "#78350F";
    ctx.strokeStyle = "#451A03";
    ctx.lineWidth = 4;
    ctx.shadowColor = "rgba(69, 26, 3, 0.25)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.ellipse(bx, by, 170, 60, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Table Inner Gloss Ring
    ctx.strokeStyle = "#92400E";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(bx, by, 150, 48, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 6 Attendee Seats around the Table
    for (let s = 0; s < 6; s++) {
      const a = (s / 6) * Math.PI * 2;
      const sx = bx + Math.cos(a) * 195;
      const sy = by + Math.sin(a) * 78;

      ctx.fillStyle = "#1E293B";
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 14, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "800 10px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(`D${s+1}`, sx, sy + 4);
    }

    // Floating Center Holographic Resolution Card
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.strokeStyle = "#4F46E5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx - 140, by - 26, 280, 52, 8);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#4F46E5";
    ctx.font = "800 10.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(compName.toUpperCase(), bx, by - 8);

    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(12 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(resolution, bx, by + 12);

    // Voting Progress Bar Below Table
    const vWidth = 320;
    const vx = bx - vWidth / 2;
    const vy = by + 94;

    ctx.fillStyle = "#F1F5F9";
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(vx, vy, vWidth, 24, 6);
    ctx.fill(); ctx.stroke();

    // Green Assent Fill
    const fillW = (vWidth - 4) * Math.min(1.0, progress * 1.2) * 0.85;
    ctx.fillStyle = "#059669";
    ctx.beginPath();
    ctx.roundRect(vx + 2, vy + 2, fillW, 20, 4);
    ctx.fill();

    ctx.fillStyle = "#065F46";
    ctx.font = `800 11px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`🗳️ ${voting.toUpperCase()}`, bx, vy + 16);

    ctx.restore();
  }

  // ============================================================
  // ACTION 14: LEGAL NOTICE DISPATCH VIA REGISTERED SPEED POST
  // ============================================================
  function drawNoticeDispatchAction(payload, progress) {
    const noticeType = payload.notice_type || "Statutory Legal Notice of Termination";
    const sender = payload.sender || "Sender (Aggrieved Party)";
    const recipient = payload.recipient || "Recipient (Defaulting Party)";
    const status = payload.delivery_status || "Registered Speed Post with AD Delivered";

    const yCenter = 225;
    const xLeft = 170;
    const xRight = 830;

    // Parties
    drawActorPillar(xLeft, yCenter, sender, "user", "#4F46E5", "NOTIFIER");
    drawActorPillar(xRight, yCenter, recipient, "user", "#DC2626", "RECIPIENT", progress > 0.6);

    // Flying Stamped Airmail Envelope
    const envX = (1 - progress) * (xLeft + 55) + progress * (xRight - 55);
    const envY = yCenter - 45 - Math.sin(progress * Math.PI) * 40;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 12;

    // Envelope Body
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#3B82F6";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(envX - 32, envY - 20, 64, 40, 6);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Envelope Flap Lines
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(envX - 32, envY - 20);
    ctx.lineTo(envX, envY + 2);
    ctx.lineTo(envX + 32, envY - 20);
    ctx.stroke();

    // Red Postal Stamp in Top-Right
    ctx.fillStyle = "#DC2626";
    ctx.beginPath();
    ctx.roundRect(envX + 16, envY - 16, 12, 10, 2);
    ctx.fill();

    // Speed Trail Behind Envelope
    ctx.strokeStyle = "rgba(79, 70, 229, 0.4)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xLeft + 55, yCenter);
    ctx.lineTo(envX - 35, envY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Expanding Registered AD Card upon Delivery
    if (progress > 0.45) {
      const adY = yCenter + 52;
      ctx.fillStyle = "#ECFDF5";
      ctx.strokeStyle = "#059669";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(500 - 180, adY, 360, 48, 8);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#047857";
      ctx.font = "800 11px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(`📬 ${status.toUpperCase()}`, 500, adY + 20);

      ctx.fillStyle = "#0F172A";
      ctx.font = `700 ${Math.round(11.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.fillText(noticeType, 500, adY + 38);
    }
    ctx.restore();
  }

  // ============================================================
  // ACTION 15: STATUTORY PENALTY FINE & REVENUE CHALLAN
  // ============================================================
  function drawPenaltyFineAction(payload, progress) {
    const penaltyTitle = payload.penalty_title || "Statutory Penalty / Late Fee Assessment";
    const amount = payload.amount || "₹1,00,000";
    const reason = payload.reason || "Willful Default / Failure to Comply with Section";

    const cx = 500, cy = 220;

    ctx.save();
    // Demand Challan Document
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(220, 38, 38, 0.2)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.roundRect(cx - 200, cy - 80, 400, 160, 10);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Top Red Warning Ribbon
    ctx.fillStyle = "#FEE2E2";
    ctx.strokeStyle = "#F87171";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx - 185, cy - 66, 370, 32, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#991B1B";
    ctx.font = "800 11px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("⚠️ OFFICIAL STATUTORY REVENUE DEMAND NOTICE", cx, cy - 46);

    // Fine Amount Digits (Rolling Counter Simulation)
    ctx.fillStyle = "#DC2626";
    ctx.font = `800 ${Math.round(28 * fontScale)}px JetBrains Mono, monospace`;
    ctx.fillText(amount, cx, cy - 2);

    // Reason Label
    ctx.fillStyle = "#475569";
    ctx.font = `600 ${Math.round(11.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, penaltyTitle + " — " + reason, cx, cy + 26, 360, 16);

    // Red Rubber Stamp of Non-Compliance
    if (progress > 0.4) {
      ctx.save();
      ctx.translate(cx + 80, cy + 30);
      ctx.rotate(-0.16);

      ctx.strokeStyle = "#DC2626";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-80, -18, 160, 36, 6);
      ctx.stroke();

      ctx.fillStyle = "#DC2626";
      ctx.font = "900 12px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("ASSESSED & LEVIED", 0, 5);
      ctx.restore();
    }
    ctx.restore();
  }

  // ============================================================
  // ACTION 16: WATERFALL FLOW DEDUCTION & QUANTUM COMPUTATION
  // ============================================================
  function drawWaterfallFlowAction(payload, progress) {
    const steps = payload.steps || [
      { label: "Agreed Contractual Value", amount: "₹10,00,000" },
      { label: "Less: Mitigated Market Price", amount: "(-) ₹8,50,000" },
      { label: "Net Recoverable Damages", amount: "(=) ₹1,50,000" }
    ];

    const startX = 140;
    const startY = 150;
    const stepW = 210;
    const gap = 38;

    ctx.save();
    steps.forEach((st, i) => {
      const sx = startX + i * (stepW + gap);
      const sy = startY + i * 28;
      const isHighlighted = progress >= (i + 1) / (steps.length + 0.3);

      // Connecting Cascade Flow Arrows
      if (i > 0) {
        ctx.strokeStyle = "#94A3B8";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(sx - gap + 10, sy - 14);
        ctx.lineTo(sx - 10, sy + 18);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Waterfall Step Card
      ctx.fillStyle = i === steps.length - 1 ? "#ECFDF5" : (isHighlighted ? "#EEF2FF" : "#FFFFFF");
      ctx.strokeStyle = i === steps.length - 1 ? "#059669" : (isHighlighted ? "#4F46E5" : "#E2E8F0");
      ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.roundRect(sx, sy, stepW, 68, 8);
      ctx.fill(); ctx.stroke();

      // Step Tag
      ctx.fillStyle = i === steps.length - 1 ? "#047857" : (isHighlighted ? "#4338CA" : "#64748B");
      ctx.font = "800 10.5px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      ctx.fillText(`STEP ${i+1}: ${st.label.toUpperCase()}`, sx + 14, sy + 22);

      // Amount
      ctx.fillStyle = i === steps.length - 1 ? "#065F46" : "#0F172A";
      ctx.font = `800 ${Math.round(16 * fontScale)}px JetBrains Mono, monospace`;
      ctx.fillText(st.amount, sx + 14, sy + 50);
    });
    ctx.restore();
  }

  // Helper: Draw Actor Character Pillar
  function drawActorPillar(x, y, name, iconKey, color, tag, isGlowing = false) {
    ctx.save();
    if (isGlowing) {
      ctx.shadowColor = "rgba(5, 150, 105, 0.45)";
      ctx.shadowBlur = 24;
    }

    // Portrait Circle
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Icon in Center
    if (window.drawColorfulBadgeShape) {
      window.drawColorfulBadgeShape(ctx, iconKey, x, y, 26, "indigo", "circle");
    }

    // Role Tag Pill
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - 45, y + 46, 90, 20, 4);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 9px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(tag, x, y + 60);

    // Name Label
    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(12.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, name, x, y + 84, 150, 16);

    ctx.restore();
  }

  // Helper: Draw Building Depot
  function drawBuildingDepot(x, y, label, tag, color) {
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x - 50, y - 40, 100, 75, 8);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = `800 10px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(tag, x, y - 18);

    ctx.fillStyle = "#0F172A";
    ctx.font = `700 11.5px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, label, x, y + 8, 90, 14);
    ctx.restore();
  }

  // Helper: Draw Bottom Subtitle Bar
  function drawBottomActionSubtitle(line, lineNum, totalLines, progress) {
    const startX = 60;
    const totalW = 880;
    const bottomY = 385;

    ctx.save();
    ctx.fillStyle = "#F8FAFC";
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(startX, bottomY, totalW, 85, 8);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#4F46E5";
    ctx.font = `800 ${Math.round(11 * fontScale)}px JetBrains Mono, monospace`;
    ctx.textAlign = "left";
    ctx.fillText(`▶ LINE ${lineNum} OF ${totalLines}: ${line.line_title ? line.line_title.toUpperCase() : ''}`, startX + 18, bottomY + 26);

    ctx.fillStyle = "#0F172A";
    ctx.font = `600 ${Math.round(13 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, line.sentence || "", startX + 18, bottomY + 52, totalW - 36, 20, "left", 2);
    ctx.restore();

    // Update Narration Box below canvas
    const narrationEl = document.getElementById("anim_narration_text");
    if (narrationEl && activeData?.scenes?.[currentSceneIdx]?.lines) {
      let html = "";
      activeData.scenes[currentSceneIdx].lines.forEach((l, i) => {
        const isCurrent = (i + 1) === lineNum;
        if (isCurrent) {
          html += `<span class="karaoke-active" style="display:inline-block; margin-right:8px; margin-bottom:4px; padding:3px 8px;"><strong>Line ${i+1}:</strong> ${l.sentence}</span> `;
        } else {
          html += `<span style="color:#64748B; margin-right:8px; margin-bottom:4px; display:inline-block;">Line ${i+1}: ${l.sentence}</span> `;
        }
      });
      narrationEl.innerHTML = html;
    }
  }

  function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, align = "center", maxLines = 4) {
    if (!text) return;
    const words = text.split(" ");
    let line = "";
    let curY = y;
    ctx.textAlign = align;

    let lineCount = 0;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, curY);
        line = words[n] + " ";
        curY += lineHeight;
        lineCount++;
        if (lineCount >= maxLines) break;
      } else {
        line = testLine;
      }
    }
    if (lineCount < maxLines) {
      ctx.fillText(line.trim(), x, curY);
    }
  }

  function drawPlaceholder() {
    ctx.fillStyle = "#94A3B8";
    ctx.font = `700 16px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Click 'Preview Kinetic Animation with Text & Shapes' above to start", 500, 240);
  }

  // Public API
  window.PRESENTATION_PLAYER = {
    init: initPlayer,
    loadPresentation: loadPresentation,
    switchScene: switchScene,
    togglePlay: togglePlay,
    setFontScale: setFontScale,
    prevSlide: () => switchScene(Math.max(0, currentSceneIdx - 1)),
    nextSlide: () => activeData?.scenes && switchScene(Math.min(activeData.scenes.length - 1, currentSceneIdx + 1)),
    seekTo: (ms) => {
      currentTimeMs = Number(ms);
    }
  };

  window.addEventListener("DOMContentLoaded", initPlayer);
})();
