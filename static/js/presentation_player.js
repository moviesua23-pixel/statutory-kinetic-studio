// -*- coding: utf-8 -*-
// static/js/presentation_player.js
// Universal Action-Driven Kinetic Animation Player
// What the sentence describes physically animates on the canvas!
// (e.g. money traveling, contracts being signed, trucks driving, scales tilting, gavels striking)

// Universal Polyfill for roundRect across all browsers
if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii = 0) {
    if (typeof radii === "number") radii = [radii, radii, radii, radii];
    else if (!Array.isArray(radii)) radii = [0, 0, 0, 0];
    const [tl, tr, br, bl] = radii.length === 4 ? radii : [radii[0]||0, radii[0]||0, radii[0]||0, radii[0]||0];
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + tr);
    this.lineTo(x + w, y + h - br);
    this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    this.lineTo(x + bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - bl);
    this.lineTo(x, y + tl);
    this.quadraticCurveTo(x, y, x + tl, y);
    this.closePath();
    return this;
  };
}

(function() {
  window.PRESENTATION_PLAYER = {};

  const LINE_DURATION_MS = 4500; // 4.5s gives ample time to absorb text & kinetic action
  const SLIDE_TRANSITION_HOLD_MS = 1200; // 1.2s pause on completed slide before advancing

  let canvas, ctx;
  let activeData = null;
  let currentSceneIdx = 0;
  let currentTimeMs = 0;
  let isPlaying = true;
  let fontScale = 1.15; // Prominent default (+15%)
  let playbackSpeed = 1.0;
  let lastFrameTime = performance.now();
  let animationFrameId = null;
  let isUserScrubbing = false;

  // Voice Narration
  let voiceNarrationEnabled = true;
  let lastSpokenKey = null;

  function initPlayer() {
    canvas = document.getElementById("stage_canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    setupScrubberEvents();
    setupKeyboardShortcuts();
    updateVoiceBtnState();
  }

  function setupScrubberEvents() {
    const slider = document.getElementById("anim_timeline_slider");
    if (!slider) return;
    slider.addEventListener("mousedown", () => { isUserScrubbing = true; });
    slider.addEventListener("touchstart", () => { isUserScrubbing = true; });
    slider.addEventListener("mouseup", () => { isUserScrubbing = false; });
    slider.addEventListener("touchend", () => { isUserScrubbing = false; });
    slider.addEventListener("input", (e) => {
      seekTo(e.target.value);
    });
  }

  function setupKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        nextSlide();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      } else if (e.code === "KeyR") {
        e.preventDefault();
        seekTo(0);
      }
    });
  }

  function loadPresentation(data) {
    activeData = data;
    currentSceneIdx = 0;
    currentTimeMs = 0;
    isPlaying = true;
    lastSpokenKey = null;
    lastFrameTime = performance.now();
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
    lastFrameTime = performance.now();
    lastSpokenKey = null;

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

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
    const maxMs = linesCount * LINE_DURATION_MS;
    const slider = document.getElementById("anim_timeline_slider");
    if (slider) {
      slider.max = maxMs;
      slider.value = 0;
    }

    updatePlayBtnState();
  }

  function togglePlay() {
    if (!activeData || !activeData.scenes) return;
    const sc = activeData.scenes[currentSceneIdx];
    const linesCount = sc?.lines?.length || 3;
    const maxMs = linesCount * LINE_DURATION_MS;

    if (!isPlaying) {
      // If at end of entire presentation, replay from slide 0!
      if (currentSceneIdx === (activeData.scenes.length - 1) && currentTimeMs >= maxMs) {
        switchScene(0);
      } else if (currentTimeMs >= maxMs) {
        // If at end of current slide, advance or restart
        if (currentSceneIdx < activeData.scenes.length - 1) {
          switchScene(currentSceneIdx + 1);
        } else {
          currentTimeMs = 0;
        }
      }
      lastFrameTime = performance.now();
      isPlaying = true;
    } else {
      isPlaying = false;
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
    updatePlayBtnState();
  }

  function updatePlayBtnState() {
    const btn = document.getElementById("btn_anim_play_pause");
    if (!btn) return;
    const sc = activeData?.scenes?.[currentSceneIdx];
    const linesCount = sc?.lines?.length || 3;
    const maxMs = linesCount * LINE_DURATION_MS;
    const isAtPresentationEnd = currentSceneIdx === ((activeData?.scenes?.length || 1) - 1) && currentTimeMs >= maxMs;

    if (isAtPresentationEnd) {
      btn.innerHTML = "↺ Replay All";
    } else if (isPlaying) {
      btn.innerHTML = "⏸ Pause";
    } else {
      btn.innerHTML = "▶ Play";
    }
  }

  function setFontScale(scale, btnEl) {
    fontScale = scale;
    document.querySelectorAll(".font-zoom-btn").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
  }

  function setSpeed(spd) {
    playbackSpeed = spd;
    document.querySelectorAll(".speed-btn").forEach(b => {
      b.classList.toggle("active", parseFloat(b.dataset.speed) === spd);
    });
  }

  function toggleVoice() {
    voiceNarrationEnabled = !voiceNarrationEnabled;
    if (!voiceNarrationEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    updateVoiceBtnState();
  }

  function updateVoiceBtnState() {
    const btn = document.getElementById("btn_voice_toggle");
    if (btn) {
      btn.innerHTML = voiceNarrationEnabled ? "🔊 Voice: ON" : "🔇 Voice: OFF";
      btn.style.color = voiceNarrationEnabled ? "#059669" : "#64748B";
      btn.style.borderColor = voiceNarrationEnabled ? "#10B981" : "#CBD5E1";
    }
  }

  function speakLine(sentence, lineIdx) {
    if (!voiceNarrationEnabled || !window.speechSynthesis || !sentence) return;
    const key = `${currentSceneIdx}_${lineIdx}`;
    if (lastSpokenKey === key) return;
    lastSpokenKey = key;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = Math.max(0.85, Math.min(1.2, playbackSpeed * 0.95));
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech error:", e);
    }
  }

  function prevSlide() {
    if (currentSceneIdx > 0) {
      switchScene(currentSceneIdx - 1);
    }
  }

  function nextSlide() {
    if (activeData?.scenes && currentSceneIdx < activeData.scenes.length - 1) {
      switchScene(currentSceneIdx + 1);
    }
  }

  function seekTo(ms) {
    currentTimeMs = Math.max(0, Number(ms));
    lastSpokenKey = null; // Re-trigger speech if scrubbed to a different line
    if (!isPlaying) {
      drawScene();
    }
  }

  // ==========================================
  // ANIMATION LOOP & CANVAS RENDERER
  // ==========================================
  function renderLoop(now) {
    const dt = (now - lastFrameTime) * playbackSpeed;
    lastFrameTime = now;

    if (isPlaying && activeData && activeData.scenes) {
      currentTimeMs += dt;
      const sc = activeData.scenes[currentSceneIdx];
      const linesCount = sc?.lines?.length || 3;
      const maxMs = linesCount * LINE_DURATION_MS;
      const totalSlideMs = maxMs + SLIDE_TRANSITION_HOLD_MS;

      // Check if current slide has completed (including transition hold)
      if (currentTimeMs >= totalSlideMs) {
        if (currentSceneIdx < activeData.scenes.length - 1) {
          // Auto-advance to next slide!
          switchScene(currentSceneIdx + 1);
        } else {
          // Presentation finished
          currentTimeMs = maxMs;
          isPlaying = false;
          updatePlayBtnState();
        }
      }

      if (!isUserScrubbing) {
        const slider = document.getElementById("anim_timeline_slider");
        if (slider) slider.value = Math.min(maxMs, currentTimeMs);
      }
    }

    drawScene();
    animationFrameId = requestAnimationFrame(renderLoop);
  }

  function drawScene() {
    if (!ctx) return;
    ctx.clearRect(0, 0, 1000, 500);

    const sc = activeData?.scenes?.[currentSceneIdx];
    const isPhase1 = sc?.screenplay_phase && sc.screenplay_phase.includes("PHASE 1");

    // Studio Background: Subtle Executive Gradient
    const bgGrd = ctx.createLinearGradient(0, 0, 0, 500);
    bgGrd.addColorStop(0, "#FFFFFF");
    bgGrd.addColorStop(1, "#F8FAFC");
    ctx.fillStyle = bgGrd;
    ctx.fillRect(0, 0, 1000, 500);

    // Architectural Precision Dot-Matrix Grid (Modern Keynote / Stripe Style)
    ctx.fillStyle = "#E2E8F0";
    for (let x = 24; x < 1000; x += 24) {
      for (let y = 24; y < 500; y += 24) {
        ctx.fillRect(x, y, 1.2, 1.2);
      }
    }

    // Ambient Radial Center Glow behind action stage
    const centerGlow = ctx.createRadialGradient(500, 240, 40, 500, 240, 380);
    centerGlow.addColorStop(0, isPhase1 ? "rgba(251, 191, 36, 0.08)" : "rgba(99, 102, 241, 0.07)");
    centerGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, 1000, 500);

    // Subtle Outer Bezel Inset Border
    ctx.strokeStyle = "rgba(226, 232, 240, 0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(8, 8, 984, 484, 10);
    ctx.stroke();

    if (!activeData || !activeData.scenes || !activeData.scenes[currentSceneIdx]) {
      drawPlaceholder();
      return;
    }

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
    
    // Act & Section Eyebrow Pill with Dual-Tone Gradient & Soft Shadow
    const pillGrd = ctx.createLinearGradient(50, 16, 50, 48);
    if (isPhase1) {
      pillGrd.addColorStop(0, "#451A03");
      pillGrd.addColorStop(1, "#78350F");
    } else {
      pillGrd.addColorStop(0, "#064E3B");
      pillGrd.addColorStop(1, "#047857");
    }

    ctx.shadowColor = isPhase1 ? "rgba(120, 53, 15, 0.25)" : "rgba(4, 120, 87, 0.25)";
    ctx.shadowBlur = 10;
    ctx.fillStyle = pillGrd;
    ctx.beginPath();
    ctx.roundRect(50, 16, 350, 32, 8);
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.strokeStyle = isPhase1 ? "#F59E0B" : "#10B981";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Eyebrow Text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 ${Math.round(11 * fontScale)}px JetBrains Mono, monospace`;
    ctx.textAlign = "left";
    ctx.fillText(`🏛️ ${actBadgeText} · ${secBadgeText}`, 64, 36);

    // Slide Headline Title with Rich High-Contrast Typography
    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(16.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(sc.tab_title || sc.tag || "Scene Analysis", 425, 37);
    ctx.restore();
  }

  // ============================================================
  // MASTER ACTION-DRIVEN SCENE CHOREOGRAPHER
  // ============================================================
  function drawActionScene(sc, isPhase1) {
    const lines = sc.lines || [];
    const count = Math.max(1, lines.length);
    const lineDurationMs = LINE_DURATION_MS;

    // Determine currently playing line index
    const activeLineIdx = Math.min(count - 1, Math.floor(currentTimeMs / lineDurationMs));
    const activeLine = lines[activeLineIdx] || {};
    const lineElapsedMs = currentTimeMs - (activeLineIdx * lineDurationMs);
    const lineProgress = Math.min(1.0, Math.max(0, lineElapsedMs / lineDurationMs));

    // Synthesize Teacher Speech for Active Sentence
    if (activeLine && activeLine.sentence) {
      speakLine(activeLine.sentence, activeLineIdx);
    }

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
    if (currentLottieId === lottieId) {
      return;
    }
    currentLottieId = lottieId;

    if (currentLottieAnim) {
      try { currentLottieAnim.destroy(); } catch (e) {}
      currentLottieAnim = null;
    }

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
    // Left Zone (Party A / Promisor) - Frosted Glassmorphic Panel
    const leftGrd = ctx.createLinearGradient(50, 128, 50, 374);
    leftGrd.addColorStop(0, "rgba(248, 250, 252, 0.85)");
    leftGrd.addColorStop(1, "rgba(238, 242, 255, 0.55)");
    ctx.fillStyle = leftGrd;
    ctx.shadowColor = "rgba(79, 70, 229, 0.08)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.roundRect(50, 128, 220, 246, 12);
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.strokeStyle = "rgba(199, 210, 254, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Left Column Header Badge
    ctx.fillStyle = "#EEF2FF";
    ctx.strokeStyle = "#C7D2FE";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(62, 138, 196, 26, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#4338CA";
    ctx.font = "800 10.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("🏛️ PARTY A · PROMISOR", 160, 155);

    // Right Zone (Party B / Promisee) - Frosted Glassmorphic Panel
    const rightGrd = ctx.createLinearGradient(730, 128, 730, 374);
    rightGrd.addColorStop(0, "rgba(248, 250, 252, 0.85)");
    rightGrd.addColorStop(1, "rgba(236, 253, 245, 0.55)");
    ctx.fillStyle = rightGrd;
    ctx.shadowColor = "rgba(16, 185, 129, 0.08)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.roundRect(730, 128, 220, 246, 12);
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.strokeStyle = "rgba(167, 243, 208, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Right Column Header Badge
    ctx.fillStyle = "#ECFDF5";
    ctx.strokeStyle = "#A7F3D0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(742, 138, 196, 26, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#047857";
    ctx.font = "800 10.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("⚖️ PARTY B · PROMISEE", 840, 155);

    // Center Dynamic Interaction Conduit Bridge
    ctx.save();
    ctx.strokeStyle = "rgba(203, 213, 225, 0.7)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(270, 250);
    ctx.lineTo(730, 250);
    ctx.stroke();
    ctx.setLineDash([]);

    // Travelling Energy Pulse Dot along the Conduit
    const pulseX = 270 + ((progress * 1.5) % 1.0) * 460;
    ctx.shadowColor = "rgba(79, 70, 229, 0.7)";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#4F46E5";
    ctx.beginPath();
    ctx.arc(pulseX, 250, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  function drawSequentialPipelineFrame(sc, isPhase1, activeLineIdx, progress) {
    ctx.save();
    const stages = ["1. Offer & Covenants", "2. Performance / Incident", "3. Statutory Consequence"];
    const startX = 130;
    const segW = 220;
    const gap = 40;
    const y = 138;

    stages.forEach((st, i) => {
      const segX = startX + i * (segW + gap);
      const isCur = i === activeLineIdx || (activeLineIdx >= stages.length && i === stages.length - 1);
      const isPast = i < activeLineIdx;

      // Conduit Pipe Connector with Arrowhead & Energy Dot
      if (i < stages.length - 1) {
        ctx.strokeStyle = isPast ? "#10B981" : "#CBD5E1";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(segX + segW, y);
        ctx.lineTo(segX + segW + gap, y);
        ctx.stroke();

        ctx.fillStyle = isPast ? "#10B981" : "#94A3B8";
        ctx.beginPath();
        ctx.moveTo(segX + segW + gap / 2 + 5, y);
        ctx.lineTo(segX + segW + gap / 2 - 4, y - 5);
        ctx.lineTo(segX + segW + gap / 2 - 4, y + 5);
        ctx.fill();
      }

      // Step Capsule Card
      if (isCur) {
        ctx.shadowColor = "rgba(79, 70, 229, 0.25)";
        ctx.shadowBlur = 14;
      }
      ctx.fillStyle = isCur ? "#EEF2FF" : (isPast ? "#ECFDF5" : "#FFFFFF");
      ctx.strokeStyle = isCur ? "#4F46E5" : (isPast ? "#10B981" : "#E2E8F0");
      ctx.lineWidth = isCur ? 2 : 1.2;
      ctx.beginPath();
      ctx.roundRect(segX, y - 15, segW, 30, 8);
      ctx.fill(); ctx.stroke();
      ctx.shadowColor = "transparent";

      // Status Indicator Dot / Check
      const dotX = segX + 16;
      ctx.fillStyle = isPast ? "#059669" : (isCur ? "#4F46E5" : "#CBD5E1");
      ctx.beginPath();
      ctx.arc(dotX, y, 6, 0, Math.PI * 2);
      ctx.fill();
      if (isPast) {
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 8.5px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText("✓", dotX, y + 3);
      }

      ctx.fillStyle = isCur ? "#312E81" : (isPast ? "#065F46" : "#64748B");
      ctx.font = `800 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(st, segX + segW / 2 + 6, y + 4.5);
    });
    ctx.restore();
  }

  function drawQuadrantGridFrame(sc, isPhase1, activeLineIdx, progress) {
    ctx.save();
    const quadrants = [
      { x: 60, y: 130, w: 420, h: 115, title: "PILLAR 1: CAPACITY & FREE CONSENT", color: "#4F46E5", bg: "rgba(238, 242, 255, 0.35)", icon: "👥" },
      { x: 520, y: 130, w: 420, h: 115, title: "PILLAR 2: LAWFUL CONSIDERATION", color: "#059669", bg: "rgba(236, 253, 245, 0.35)", icon: "💰" },
      { x: 60, y: 255, w: 420, h: 115, title: "PILLAR 3: LAWFUL OBJECT & PURPOSE", color: "#D97706", bg: "rgba(254, 243, 199, 0.35)", icon: "📜" },
      { x: 520, y: 255, w: 420, h: 115, title: "PILLAR 4: LEGAL VALIDITY & ENFORCEABILITY", color: "#2563EB", bg: "rgba(239, 246, 255, 0.35)", icon: "⚖️" }
    ];

    quadrants.forEach((q, idx) => {
      // Glassmorphic Quadrant Card
      ctx.fillStyle = q.bg;
      ctx.strokeStyle = "rgba(226, 232, 240, 0.9)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(q.x, q.y, q.w, q.h, 10);
      ctx.fill(); ctx.stroke();

      // Pillar Header Ribbon
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = q.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(q.x + 12, q.y + 10, q.w - 24, 24, 5);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = q.color;
      ctx.font = "800 10.5px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${q.icon} ${q.title}`, q.x + 22, q.y + 26);
    });
    ctx.restore();
  }

  function drawPrecedentParchmentFrame(sc, isPhase1, activeLineIdx, progress) {
    ctx.save();
    const px = 90, py = 126, pw = 820, ph = 248;

    // Ivory Parchment Body
    const parchGrd = ctx.createLinearGradient(px, py, px, py + ph);
    parchGrd.addColorStop(0, "#FFFEFC");
    parchGrd.addColorStop(1, "#FAF6ED");
    ctx.fillStyle = parchGrd;
    ctx.strokeStyle = "#D97706";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(180, 83, 9, 0.14)";
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 12);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Inner Gold Inset Margin
    ctx.strokeStyle = "#FDE68A";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(px + 8, py + 8, pw - 16, ph - 16, 8);
    ctx.stroke();

    // 4 Corner Gold Filigree Brackets
    const bLen = 16;
    ctx.strokeStyle = "#D97706";
    ctx.lineWidth = 2;
    // Top-Left
    ctx.beginPath(); ctx.moveTo(px + 14, py + 14 + bLen); ctx.lineTo(px + 14, py + 14); ctx.lineTo(px + 14 + bLen, py + 14); ctx.stroke();
    // Top-Right
    ctx.beginPath(); ctx.moveTo(px + pw - 14 - bLen, py + 14); ctx.lineTo(px + pw - 14, py + 14); ctx.lineTo(px + pw - 14, py + 14 + bLen); ctx.stroke();
    // Bottom-Left
    ctx.beginPath(); ctx.moveTo(px + 14, py + ph - 14 - bLen); ctx.lineTo(px + 14, py + ph - 14); ctx.lineTo(px + 14 + bLen, py + ph - 14); ctx.stroke();
    // Bottom-Right
    ctx.beginPath(); ctx.moveTo(px + pw - 14 - bLen, py + ph - 14); ctx.lineTo(px + pw - 14, py + ph - 14); ctx.lineTo(px + pw - 14, py + ph - 14 - bLen); ctx.stroke();

    // Watermark Scales of Justice in center background
    ctx.strokeStyle = "rgba(217, 119, 6, 0.08)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(500, py + ph / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Header Ratio Banner
    ctx.fillStyle = "#FFFBEB";
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(px + 40, py + 16, pw - 80, 28, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#B45309";
    ctx.font = "800 11.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("⚖️ IN THE HIGH COURT OF JUDICATURE / SUPREME COURT RATIO DECIDENDI", 500, py + 34);
    ctx.restore();
  }

  function drawHeroStageFrame(sc, isPhase1, activeLineIdx, progress) {
    ctx.save();
    // Multi-tiered Radial Pedestal Spotlight
    const radGrd = ctx.createRadialGradient(500, 245, 30, 500, 245, 380);
    radGrd.addColorStop(0, isPhase1 ? "rgba(254, 243, 199, 0.45)" : "rgba(236, 253, 245, 0.45)");
    radGrd.addColorStop(0.5, isPhase1 ? "rgba(254, 243, 199, 0.15)" : "rgba(236, 253, 245, 0.15)");
    radGrd.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = radGrd;
    ctx.fillRect(60, 126, 880, 250);

    // Subtle Ground Pedestal Oval
    ctx.fillStyle = "rgba(241, 245, 249, 0.6)";
    ctx.beginPath();
    ctx.ellipse(500, 310, 340, 40, 0, 0, Math.PI * 2);
    ctx.fill();
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
      // Track Card
      if (isCur) {
        ctx.shadowColor = "rgba(79, 70, 229, 0.22)";
        ctx.shadowBlur = 12;
      }

      ctx.fillStyle = isPast ? "#ECFDF5" : (isCur ? "#EEF2FF" : "#F8FAFC");
      ctx.strokeStyle = isPast ? "#10B981" : (isCur ? "#4F46E5" : "#E2E8F0");
      ctx.lineWidth = isCur ? 2 : 1.2;
      ctx.beginPath();
      ctx.roundRect(segX, y, segW, 28, 7);
      ctx.fill(); ctx.stroke();
      ctx.shadowColor = "transparent";

      // Smooth Animated Gradient Progress Fill for Active Line
      if (isCur) {
        const fillW = Math.max(4, (segW - 4) * lineProgress);
        const fillGrd = ctx.createLinearGradient(segX, y, segX + fillW, y);
        fillGrd.addColorStop(0, "#4F46E5");
        fillGrd.addColorStop(1, "#6366F1");
        ctx.fillStyle = fillGrd;
        ctx.beginPath();
        ctx.roundRect(segX + 2, y + 2, fillW, 24, 5);
        ctx.fill();

        // Glowing Leading Cap Indicator
        ctx.fillStyle = "#A5B4FC";
        ctx.fillRect(segX + fillW - 2, y + 2, 2, 24);
      }

      // Typography
      if (isCur) {
        ctx.fillStyle = lineProgress > 0.4 ? "#FFFFFF" : "#312E81";
      } else {
        ctx.fillStyle = isPast ? "#047857" : "#64748B";
      }

      ctx.font = `800 ${Math.round(10.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = "center";
      const iconPill = isPast ? "✓" : `Line ${i + 1}`;
      ctx.fillText(`${iconPill} · ${l.line_title || `Step ${i+1}`}`, segX + segW / 2, y + 18);
      ctx.restore();
    });
  }

  // ============================================================
  // ACTION 1: MONEY / CONSIDERATION TRANSFER (3D MINTED COINS & VAULT)
  // ============================================================
  function drawMoneyTransferAction(payload, progress) {
    const fromActor = payload.from_actor || "Tenant (Mr. Murali)";
    const toActor = payload.to_actor || "Landlord (Dr. Susan)";
    const amount = payload.amount || "₹50,000";
    const desc = payload.description || "Lawful Consideration Exchanged";

    const yCenter = 230;
    const xLeft = 170;
    const xRight = 830;

    // Actor A (Payer) & Actor B (Receiver)
    drawActorPillar(xLeft, yCenter, fromActor, payload.from_icon || "user", "#4F46E5", "PAYER");
    const isReceiverGlowing = progress > 0.45;
    drawActorPillar(xRight, yCenter, toActor, payload.to_icon || "store", "#059669", "RECEIVER", isReceiverGlowing);

    // Connecting Bezier Stream Conduit
    ctx.save();
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(xLeft + 72, yCenter);
    ctx.quadraticCurveTo(500, yCenter - 100, xRight - 72, yCenter);
    ctx.stroke();
    ctx.restore();

    // 3D Minted Gold Coins Flying along Bezier Curve with Perspective Tumble
    const numCoins = 7;
    for (let c = 0; c < numCoins; c++) {
      const coinOffset = (c / numCoins);
      const coinT = (progress * 1.5 + coinOffset) % 1.0;
      if (progress < 0.08 && coinT > 0.5) continue;

      // Quadratic Bezier interpolation
      const t = coinT;
      const bx = (1 - t) * (1 - t) * (xLeft + 72) + 2 * (1 - t) * t * 500 + t * t * (xRight - 72);
      const by = (1 - t) * (1 - t) * yCenter + 2 * (1 - t) * t * (yCenter - 100) + t * t * yCenter;

      ctx.save();
      ctx.translate(bx, by);

      // Realistic 3D perspective spin/tumble
      const tumbleScale = Math.cos((coinT * 6 + c * 1.2) * Math.PI);
      ctx.scale(1, Math.max(0.2, Math.abs(tumbleScale)));

      // Specular Glow
      ctx.shadowColor = "rgba(234, 179, 8, 0.45)";
      ctx.shadowBlur = 14;

      // Outer Minted Rim with Metallic Radial Gradient
      const coinGrd = ctx.createRadialGradient(-3, -3, 2, 0, 0, 16);
      coinGrd.addColorStop(0, "#FEF08A");
      coinGrd.addColorStop(0.5, "#EAB308");
      coinGrd.addColorStop(1, "#A16207");
      ctx.fillStyle = coinGrd;
      ctx.strokeStyle = "#78350F";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.shadowColor = "transparent";

      // Inner Milled Ring
      ctx.strokeStyle = "#CA8A04";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.stroke();

      // Embossed Currency Symbol
      if (Math.abs(tumbleScale) > 0.4) {
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 12.5px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText("₹", 0, 4.5);
      }
      ctx.restore();
    }

    // Floating Sparkle Particles off the Coin Path
    for (let sp = 0; sp < 6; sp++) {
      const pT = (progress * 1.8 + sp * 0.16) % 1.0;
      const px = (1 - pT) * (1 - pT) * (xLeft + 72) + 2 * (1 - pT) * pT * 500 + pT * pT * (xRight - 72);
      const py = (1 - pT) * (1 - pT) * yCenter + 2 * (1 - pT) * pT * (yCenter - 100) + pT * pT * yCenter + (Math.sin(sp * 4) * 16);
      ctx.fillStyle = `rgba(250, 204, 21, ${0.7 - pT * 0.6})`;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center Floating Glassmorphic Amount Card
    ctx.save();
    const pillY = yCenter - 105;
    const cardGrd = ctx.createLinearGradient(370, pillY, 370, pillY + 56);
    cardGrd.addColorStop(0, "#FFFFFF");
    cardGrd.addColorStop(1, "#F0FDF4");
    ctx.fillStyle = cardGrd;
    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(16, 185, 129, 0.22)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.roundRect(370, pillY, 260, 56, 12);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    ctx.fillStyle = "#047857";
    ctx.font = `800 ${Math.round(18 * fontScale)}px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`💰 ${amount}`, 500, pillY + 28);

    ctx.fillStyle = "#475569";
    ctx.font = `700 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(desc, 500, pillY + 46);
    ctx.restore();
  }

  // ============================================================
  // ACTION 2: CONTRACT SIGNING & WAX SEAL STAMP IMPACT
  // ============================================================
  function drawContractSignAction(payload, progress) {
    const title = payload.title || "COMMERCIAL CONTRACT AGREEMENT";
    const parties = payload.parties || "Contracting Parties";
    const keyTerm = payload.key_term || "Mutual covenants & lawful consideration";
    const stampText = payload.stamp_text || "EXECUTED & REGISTERED";

    const cx = 500, cy = 230;
    const w = 460, h = 226;
    const x = cx - w / 2, y = cy - h / 2;

    ctx.save();
    // High-End Parchment Document with Folded Corner
    const fold = 24;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w - fold, y);
    ctx.lineTo(x + w, y + fold);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();

    const parchmentGrd = ctx.createLinearGradient(x, y, x, y + h);
    parchmentGrd.addColorStop(0, "#FFFDF8");
    parchmentGrd.addColorStop(1, "#FAF6EC");
    ctx.fillStyle = parchmentGrd;
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(15, 23, 42, 0.10)";
    ctx.shadowBlur = 22;
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Folded Corner Flap with Cast Shadow
    ctx.beginPath();
    ctx.moveTo(x + w - fold, y);
    ctx.lineTo(x + w - fold, y + fold);
    ctx.lineTo(x + w, y + fold);
    ctx.closePath();
    ctx.fillStyle = "#E7E5E4";
    ctx.stroke(); ctx.fill();

    // Inner Delicate Gold Margin Inset
    ctx.strokeStyle = "#FDE68A";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 10, w - 20, h - 20, 6);
    ctx.stroke();

    // Document Title Header with Legal Crest
    ctx.fillStyle = "#1E293B";
    ctx.font = `800 ${Math.round(13.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`⚖️ ${title.toUpperCase()}`, cx, y + 36);

    ctx.fillStyle = "#64748B";
    ctx.font = `700 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(`Parties: ${parties}`, cx, y + 58);

    // Simulated Legal Contract Clauses (Watermark lines)
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    for (let l = 0; l < 3; l++) {
      ctx.beginPath();
      ctx.moveTo(x + 40, y + 84 + l * 20);
      ctx.lineTo(x + w - 40, y + 84 + l * 20);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.fillStyle = "#0284C7";
    ctx.font = `700 ${Math.round(11.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(`Key Covenant: ${keyTerm}`, cx, y + 152);

    // Signature Line (Bottom-Left)
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 40, y + h - 35);
    ctx.lineTo(x + 190, y + h - 35);
    ctx.stroke();

    // Animated Fountain Pen Drawing Flowing Cursive Ink
    if (progress > 0.20) {
      const signP = Math.min(1.0, (progress - 0.20) / 0.45);
      const signStartX = x + 45;
      const signLength = 135 * signP;

      ctx.strokeStyle = "#1D4ED8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(signStartX, y + h - 45);
      for (let sx = signStartX; sx < signStartX + signLength; sx += 8) {
        ctx.lineTo(sx, (y + h - 45) + Math.sin((sx - signStartX) * 0.45) * 6.5);
      }
      ctx.stroke();

      // Fountain Pen Graphic at the leading signature tip
      const penX = signStartX + signLength;
      const penY = (y + h - 45) + Math.sin(signLength * 0.45) * 6.5;

      ctx.save();
      ctx.translate(penX, penY);
      ctx.rotate(-0.65);

      // Gold Nib
      ctx.fillStyle = "#F59E0B";
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(-4, -10); ctx.lineTo(4, -10); ctx.closePath();
      ctx.fill();

      // Black Pen Barrel
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(-3.5, -34, 7, 24);

      // Gold Trim Ring
      ctx.fillStyle = "#F59E0B";
      ctx.fillRect(-4, -36, 8, 2);
      ctx.restore();

      ctx.fillStyle = "#1D4ED8";
      ctx.font = `800 10px JetBrains Mono, monospace`;
      ctx.fillText("✍️ Signature Executed", x + 115, y + h - 18);
    }

    // 3D Red Wax Seal with Ribbon Streamers Landing with Damped Spring Bounce
    if (progress > 0.60) {
      const stampP = Math.min(1.0, (progress - 0.60) / 0.25);
      // Damped harmonic bounce
      const bounce = 1.0 + Math.sin(stampP * Math.PI * 2.5) * Math.exp(-stampP * 4) * 0.35;
      const stampX = x + w - 95;
      const stampY = y + h - 50;

      ctx.save();
      ctx.translate(stampX, stampY);
      ctx.scale(bounce, bounce);
      ctx.rotate(-0.12);

      // Red Hanging Ribbons Below Seal
      ctx.fillStyle = "#991B1B";
      ctx.beginPath();
      ctx.moveTo(-10, 20); ctx.lineTo(-18, 48); ctx.lineTo(-8, 42); ctx.lineTo(0, 48); ctx.lineTo(-4, 20);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(4, 20); ctx.lineTo(0, 48); ctx.lineTo(8, 42); ctx.lineTo(18, 48); ctx.lineTo(10, 20);
      ctx.fill();

      // Scalloped Molten Wax Outer Seal
      ctx.fillStyle = "#DC2626";
      ctx.strokeStyle = "#991B1B";
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(220, 38, 38, 0.4)";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.shadowColor = "transparent";

      // Embossed Inner Gold Circle
      ctx.strokeStyle = "#FDE047";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.stroke();

      // Relief Text
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
  // ACTION 3: HANDSHAKE CONSENT & BILATERAL VERIFICATION CREST
  // ============================================================
  function drawHandshakeConsentAction(payload, progress) {
    const partyA = payload.party_a || "Party A (Promisor)";
    const partyB = payload.party_b || "Party B (Promisee)";
    const rule = payload.consent_rule || "Free Consent (Section 10)";
    const status = payload.status || "Agreement formed with Valid Mutual Consent";

    const cy = 230;
    // Cubic Bezier Easing for smooth inward approach
    const t = Math.min(1.0, progress / 0.45);
    const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const xA = 130 + (220 * easeT);
    const xB = 870 - (220 * easeT);

    // Left & Right Executive Character Cards
    drawActorPillar(xA, cy, partyA, "user", "#4F46E5", "PROMISOR");
    drawActorPillar(xB, cy, partyB, "user-check", "#0284C7", "PROMISEE");

    // Once Arrived: Clasping Vector Hands & Radiant Emerald Crest
    if (easeT > 0.75) {
      const bloomP = Math.min(1.0, (progress - 0.35) / 0.5);
      const cx = 500;

      ctx.save();
      // Concentric Expanding Energy Waves
      const ripple = (progress * 3) % 1.0;
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.8 - ripple * 0.7})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 40 + ripple * 45, 0, Math.PI * 2);
      ctx.stroke();

      // Radiant Emerald Crest Body
      ctx.shadowColor = "rgba(16, 185, 129, 0.4)";
      ctx.shadowBlur = 24 * bloomP;
      ctx.fillStyle = "#ECFDF5";
      ctx.strokeStyle = "#059669";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 46 * bloomP, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.shadowColor = "transparent";

      // Clasping Hands Vector Detail
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(bloomP, bloomP);

      // Navy Promisor Sleeve & Cuff (Left)
      ctx.fillStyle = "#312E81";
      ctx.fillRect(-32, -8, 20, 16);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(-14, -8, 4, 16);

      // Teal Promisee Sleeve & Cuff (Right)
      ctx.fillStyle = "#0284C7";
      ctx.fillRect(12, -8, 20, 16);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(10, -8, 4, 16);

      // Clasping Hands (Center)
      ctx.fillStyle = "#F59E0B";
      ctx.beginPath();
      ctx.arc(-4, 0, 9, 0, Math.PI * 2);
      ctx.arc(4, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Floating Golden Sparkles around the Handshake
      for (let s = 0; s < 5; s++) {
        const sa = (progress * 4 + s * 1.25);
        const sx = cx + Math.cos(sa) * (55 + s * 3);
        const sy = cy + Math.sin(sa) * (55 + s * 3);
        ctx.fillStyle = "#F59E0B";
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Verification Badge Below
      const badgeY = cy + 68;
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#059669";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(5, 150, 105, 0.2)";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.roundRect(cx - 180, badgeY, 360, 48, 10);
      ctx.fill(); ctx.stroke();
      ctx.shadowColor = "transparent";

      ctx.fillStyle = "#047857";
      ctx.font = `800 ${Math.round(11.5 * fontScale)}px JetBrains Mono, monospace`;
      ctx.textAlign = "center";
      ctx.fillText(`✓ ${rule.toUpperCase()}`, cx, badgeY + 20);

      ctx.fillStyle = "#0F172A";
      ctx.font = `700 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.fillText(status, cx, badgeY + 38);

      ctx.restore();
    }
  }

  // ============================================================
  // ACTION 4: AERODYNAMIC CARGO HAULER & PARALLAX HIGHWAY
  // ============================================================
  function drawGoodsTransportAction(payload, progress) {
    const origin = payload.origin || "Origin Depot";
    const dest = payload.destination || "Destination Hub";
    const cargo = payload.cargo || "Consignment Goods";

    const roadY = 250;
    const xStart = 160;
    const xEnd = 840;

    // Origin Depot & Destination Hub
    drawBuildingDepot(xStart, roadY, origin, "🏭 ORIGIN", "#4F46E5");
    drawBuildingDepot(xEnd, roadY, dest, "🏢 DESTINATION", "#059669");

    // Highway Asphalt Surface with Curbs
    ctx.save();
    ctx.fillStyle = "#1E293B";
    ctx.beginPath();
    ctx.roundRect(xStart + 60, roadY - 14, (xEnd - xStart - 120), 40, 4);
    ctx.fill();

    // Road Curbs (Yellow/Black striped markers on top and bottom edges)
    ctx.fillStyle = "#334155";
    ctx.fillRect(xStart + 60, roadY - 14, (xEnd - xStart - 120), 4);
    ctx.fillRect(xStart + 60, roadY + 22, (xEnd - xStart - 120), 4);

    // Parallax Scrolling Dashed Centerline
    ctx.strokeStyle = "#FDE047";
    ctx.lineWidth = 2.5;
    const dashOffset = (progress * 480) % 24;
    ctx.setLineDash([12, 12]);
    ctx.lineDashOffset = -dashOffset;
    ctx.beginPath();
    ctx.moveTo(xStart + 60, roadY + 6);
    ctx.lineTo(xEnd - 60, roadY + 6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Modern Commercial Logistics Carrier
    const truckP = Math.min(1.0, progress * 1.1);
    const truckX = (xStart + 80) + (xEnd - xStart - 220) * truckP;
    const truckY = roadY - 8;

    ctx.save();
    // Headlights Beam Projection on Road ahead of Truck
    const lightGrd = ctx.createLinearGradient(truckX + 110, truckY, truckX + 210, truckY);
    lightGrd.addColorStop(0, "rgba(254, 240, 138, 0.45)");
    lightGrd.addColorStop(1, "rgba(254, 240, 138, 0)");
    ctx.fillStyle = lightGrd;
    ctx.beginPath();
    ctx.moveTo(truckX + 105, truckY - 4);
    ctx.lineTo(truckX + 200, truckY - 20);
    ctx.lineTo(truckX + 200, truckY + 24);
    ctx.lineTo(truckX + 105, truckY + 12);
    ctx.closePath();
    ctx.fill();

    // Cargo Trailer Body (Deep Navy with Corrugated Panels)
    ctx.fillStyle = "#1E3A8A";
    ctx.strokeStyle = "#172554";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(truckX, truckY - 30, 84, 38, 4);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Trailer Corrugation Panel Stripes
    ctx.strokeStyle = "#2563EB";
    ctx.lineWidth = 1;
    for (let cp = truckX + 12; cp < truckX + 76; cp += 10) {
      ctx.beginPath(); ctx.moveTo(cp, truckY - 26); ctx.lineTo(cp, truckY + 4); ctx.stroke();
    }

    // Aerodynamic Truck Cab (Front)
    ctx.fillStyle = "#3B82F6";
    ctx.beginPath();
    ctx.roundRect(truckX + 80, truckY - 22, 32, 30, [0, 8, 8, 0]);
    ctx.fill(); ctx.stroke();

    // Tinted Windshield with Specular Glare
    ctx.fillStyle = "#0284C7";
    ctx.fillRect(truckX + 88, truckY - 18, 18, 14);
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.moveTo(truckX + 90, truckY - 18); ctx.lineTo(truckX + 94, truckY - 18); ctx.lineTo(truckX + 88, truckY - 6); ctx.fill();

    // Alloy Wheels with Brake Discs & Continuous Distance Rotation
    const wheelAngle = (truckX / 10) * Math.PI * 2;
    [truckX + 22, truckX + 65, truckX + 98].forEach(wx => {
      ctx.save();
      ctx.translate(wx, truckY + 12);
      ctx.rotate(wheelAngle);

      // Rubber Tire
      ctx.fillStyle = "#0F172A";
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();

      // Silver Alloy Rim
      ctx.fillStyle = "#CBD5E1";
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#475569"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.stroke();
      ctx.restore();
    });

    // Floating Cargo Consignment Pill Above Truck
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#2563EB";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "rgba(37, 99, 235, 0.2)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(truckX - 10, truckY - 64, 130, 26, 6);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    ctx.fillStyle = "#1E40AF";
    ctx.font = "800 10px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`📦 ${cargo.toUpperCase()}`, truckX + 55, truckY - 47);
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
    // 1. Realistic Roadway Asphalt with Branching Depth Fissure
    ctx.fillStyle = "#1E293B";
    ctx.beginPath();
    ctx.roundRect(120, cy - 14, 760, 42, 6);
    ctx.fill();

    // Jagged Deep Fracture Abyss
    ctx.strokeStyle = "#450A0A";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(140, cy + 6);
    ctx.lineTo(380, cy + 6);
    ctx.lineTo(410, cy - 14);
    ctx.lineTo(450, cy + 22);
    ctx.lineTo(490, cy - 10);
    ctx.lineTo(520, cy + 20);
    ctx.lineTo(560, cy - 8);
    ctx.lineTo(600, cy + 8);
    ctx.lineTo(860, cy + 6);
    ctx.stroke();

    // Glowing Crimson Fault Line Inside the Abyss
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(239, 68, 68, 0.7)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(380, cy + 6);
    ctx.lineTo(410, cy - 14);
    ctx.lineTo(450, cy + 22);
    ctx.lineTo(490, cy - 10);
    ctx.lineTo(520, cy + 20);
    ctx.lineTo(560, cy - 8);
    ctx.lineTo(600, cy + 8);
    ctx.stroke();
    ctx.shadowColor = "transparent";

    // Branching Micro-Cracks
    ctx.strokeStyle = "rgba(220, 38, 38, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(410, cy - 14); ctx.lineTo(395, cy - 26);
    ctx.moveTo(450, cy + 22); ctx.lineTo(465, cy + 34);
    ctx.moveTo(520, cy + 20); ctx.lineTo(538, cy + 32);
    ctx.moveTo(560, cy - 8); ctx.lineTo(575, cy - 22);
    ctx.stroke();

    // 2. 3D Industrial Hazard Barrier
    const bW = 260, bH = 50;
    const bx = cx - bW / 2, by = cy - 26;

    // Metallic A-Frame Stanchions (Legs)
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 4;
    // Left Leg
    ctx.beginPath(); ctx.moveTo(bx + 20, by + bH); ctx.lineTo(bx + 10, by + bH + 28); ctx.lineTo(bx + 35, by + bH + 28); ctx.stroke();
    // Right Leg
    ctx.beginPath(); ctx.moveTo(bx + bW - 20, by + bH); ctx.lineTo(bx + bW - 10, by + bH + 28); ctx.lineTo(bx + bW - 35, by + bH + 28); ctx.stroke();

    // Heavy Barrier Plank
    ctx.save();
    ctx.fillStyle = "#0F172A";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(bx, by, bW, bH, 6);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // High-Visibility 45° Safety Chevrons (Yellow & Slate)
    ctx.clip();
    ctx.fillStyle = "#F59E0B";
    for (let sx = bx - 60; sx < bx + bW + 60; sx += 32) {
      ctx.beginPath();
      ctx.moveTo(sx, by);
      ctx.lineTo(sx + 16, by);
      ctx.lineTo(sx + 36, by + bH);
      ctx.lineTo(sx + 20, by + bH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 3. Dual Alternating Emergency Strobe LED Beacons
    const beaconY = by - 12;
    const isLeftStrobe = Math.sin(progress * 24) > 0;

    // Left Beacon (Flashing Red)
    ctx.save();
    ctx.fillStyle = isLeftStrobe ? "#EF4444" : "#7F1D1D";
    ctx.strokeStyle = "#991B1B";
    ctx.lineWidth = 1.5;
    if (isLeftStrobe) {
      const strobeGrd = ctx.createRadialGradient(bx + 26, beaconY, 2, bx + 26, beaconY, 32);
      strobeGrd.addColorStop(0, "rgba(239, 68, 68, 0.8)");
      strobeGrd.addColorStop(1, "rgba(239, 68, 68, 0)");
      ctx.fillStyle = strobeGrd;
      ctx.beginPath(); ctx.arc(bx + 26, beaconY, 32, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#FCA5A5";
    }
    ctx.beginPath(); ctx.arc(bx + 26, beaconY, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();

    // Right Beacon (Flashing Amber)
    ctx.save();
    const isRightStrobe = !isLeftStrobe;
    ctx.fillStyle = isRightStrobe ? "#F59E0B" : "#78350F";
    ctx.strokeStyle = "#B45309";
    ctx.lineWidth = 1.5;
    if (isRightStrobe) {
      const strobeGrd = ctx.createRadialGradient(bx + bW - 26, beaconY, 2, bx + bW - 26, beaconY, 32);
      strobeGrd.addColorStop(0, "rgba(245, 158, 11, 0.8)");
      strobeGrd.addColorStop(1, "rgba(245, 158, 11, 0)");
      ctx.fillStyle = strobeGrd;
      ctx.beginPath(); ctx.arc(bx + bW - 26, beaconY, 32, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#FEF08A";
    }
    ctx.beginPath(); ctx.arc(bx + bW - 26, beaconY, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();

    // 4. Center Executive Breach Alert Card Above Barrier
    const cardY = cy - 106;
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(220, 38, 38, 0.25)";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(cx - 180, cardY, 360, 68, 10);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Top Warning Badge Ribbon
    ctx.fillStyle = "#FEE2E2";
    ctx.strokeStyle = "#FCA5A5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx - 160, cardY + 8, 320, 22, 5);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#991B1B";
    ctx.font = `800 ${Math.round(10.5 * fontScale)}px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText("⚠️ STATUTORY BREACH · NON-PERFORMANCE", cx, cardY + 23);

    // Title & Cause
    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(13.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(title, cx, cardY + 46);

    ctx.fillStyle = "#475569";
    ctx.font = `600 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(cause, cx, cardY + 61);

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
    const cy = 246;

    // Real Dynamic Harmonic Spring Physics Oscillation
    const t = Math.min(1.0, progress * 1.8);
    const spring = Math.sin(t * Math.PI * 4) * Math.exp(-t * 3.8);
    const tiltAngle = -0.17 * (1 - spring); // Left pan drops down smoothly

    ctx.save();
    // 1. Classical Stepped Brass Fulcrum Pedestal
    const baseGrd = ctx.createLinearGradient(cx - 60, cy + 90, cx + 60, cy + 90);
    baseGrd.addColorStop(0, "#78350F");
    baseGrd.addColorStop(0.5, "#FDE047");
    baseGrd.addColorStop(1, "#78350F");
    ctx.fillStyle = baseGrd;
    ctx.strokeStyle = "#451A03";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - 60, cy + 92, 120, 16, 4);
    ctx.fill(); ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 40, cy + 92);
    ctx.lineTo(cx + 40, cy + 92);
    ctx.lineTo(cx + 14, cy + 50);
    ctx.lineTo(cx - 14, cy + 50);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // 2. Classical Fluted Brass Pillar
    const pillarGrd = ctx.createLinearGradient(cx - 10, cy, cx + 10, cy);
    pillarGrd.addColorStop(0, "#92400E");
    pillarGrd.addColorStop(0.5, "#FDE047");
    pillarGrd.addColorStop(1, "#92400E");
    ctx.fillStyle = pillarGrd;
    ctx.strokeStyle = "#451A03";
    ctx.lineWidth = 1.8;
    ctx.fillRect(cx - 6, cy - 95, 12, 146);
    ctx.strokeRect(cx - 6, cy - 95, 12, 146);

    // Pillar Rings & Acorn Finial Jewel
    ctx.fillStyle = "#F59E0B";
    ctx.beginPath(); ctx.arc(cx, cy - 102, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath(); ctx.arc(cx, cy - 102, 4, 0, Math.PI * 2); ctx.fill();

    // 3. Tilting Beam with Rotational Transform
    ctx.save();
    ctx.translate(cx, cy - 95);
    ctx.rotate(tiltAngle);

    // Brass Beam
    const beamGrd = ctx.createLinearGradient(0, -6, 0, 6);
    beamGrd.addColorStop(0, "#FDE047");
    beamGrd.addColorStop(1, "#B45309");
    ctx.fillStyle = beamGrd;
    ctx.strokeStyle = "#451A03";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-230, -5, 460, 10, 4);
    ctx.fill(); ctx.stroke();

    // Left Pivot Pin
    ctx.fillStyle = "#451A03";
    ctx.beginPath(); ctx.arc(-220, 0, 4, 0, Math.PI * 2); ctx.fill();
    // Right Pivot Pin
    ctx.beginPath(); ctx.arc(220, 0, 4, 0, Math.PI * 2); ctx.fill();

    // 4. Left Brass Pan (Direct / Recoverable Loss - Heavy Side)
    ctx.save();
    ctx.translate(-220, 0);
    ctx.rotate(-tiltAngle); // Keep pan level against gravity

    // 3 Delicate Suspension Chain Cords
    ctx.strokeStyle = "#B45309";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-44, 75);
    ctx.moveTo(0, 0); ctx.lineTo(0, 75);
    ctx.moveTo(0, 0); ctx.lineTo(44, 75);
    ctx.stroke();

    // 3D Curved Brass Pan Dish
    const panGrd = ctx.createLinearGradient(-48, 75, 48, 90);
    panGrd.addColorStop(0, "#D97706");
    panGrd.addColorStop(0.5, "#FEF08A");
    panGrd.addColorStop(1, "#92400E");
    ctx.fillStyle = panGrd;
    ctx.strokeStyle = "#78350F";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 78, 50, 14, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Stacked Gold Weights on Dish
    ctx.fillStyle = "#CA8A04";
    ctx.strokeStyle = "#78350F";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(-18, 64, 36, 14, 3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-12, 54, 24, 11, 2); ctx.fill(); ctx.stroke();

    // Summary Card Below Pan
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#059669";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(5, 150, 105, 0.22)";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(-95, 96, 190, 60, 8);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    ctx.fillStyle = "#047857";
    ctx.font = `800 ${Math.round(10.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("✅ " + leftWeight, 0, 116);
    ctx.fillStyle = "#065F46";
    ctx.font = `800 ${Math.round(15 * fontScale)}px JetBrains Mono, monospace`;
    ctx.fillText(leftAmt, 0, 142);
    ctx.restore();

    // 5. Right Brass Pan (Remote Loss - Elevated Light Side)
    ctx.save();
    ctx.translate(220, 0);
    ctx.rotate(-tiltAngle);

    // 3 Suspension Chain Cords
    ctx.strokeStyle = "#B45309";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-44, 75);
    ctx.moveTo(0, 0); ctx.lineTo(0, 75);
    ctx.moveTo(0, 0); ctx.lineTo(44, 75);
    ctx.stroke();

    // 3D Curved Brass Pan Dish
    ctx.fillStyle = panGrd;
    ctx.strokeStyle = "#78350F";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 78, 50, 14, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Empty/Exclusion Hollow Token
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 70, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, 64); ctx.lineTo(6, 76); ctx.stroke();

    // Summary Card Below Pan
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(220, 38, 38, 0.18)";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(-95, 96, 190, 60, 8);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    ctx.fillStyle = "#991B1B";
    ctx.font = `800 ${Math.round(10.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("❌ " + rightWeight, 0, 116);
    ctx.fillStyle = "#DC2626";
    ctx.font = `800 ${Math.round(15 * fontScale)}px JetBrains Mono, monospace`;
    ctx.fillText(rightAmt, 0, 142);
    ctx.restore();

    ctx.restore(); // end tilting beam

    // 6. Floating Judicial Verdict Pill Above Fulcrum
    ctx.save();
    const pillY = cy - 138;
    ctx.fillStyle = "#047857";
    ctx.shadowColor = "rgba(4, 120, 87, 0.35)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(cx - 170, pillY, 340, 34, 8);
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 ${Math.round(11.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`⚖️ ${verdict.toUpperCase()}`, cx, pillY + 22);
    ctx.restore();

    ctx.restore();
  }

  // ============================================================
  // ACTION 7: FINANCIAL METER (BLOOMBERG / TRADINGVIEW STUDIO CHART)
  // ============================================================
  function drawFinancialMeterAction(payload, progress) {
    const metric = payload.metric_name || "Business Financial Performance";
    const dir = payload.direction || "down";
    const val = payload.value || "(-) ₹5,00,000";
    const detail = payload.detail || "Direct financial damage from breach";

    const x = 200;
    const y = 142;
    const w = 600;
    const h = 180;

    ctx.save();
    // 1. Executive Chart Card Container
    const bgGrd = ctx.createLinearGradient(x, y, x, y + h);
    bgGrd.addColorStop(0, "#FFFFFF");
    bgGrd.addColorStop(1, "#F8FAFC");
    ctx.fillStyle = bgGrd;
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // 2. Subtle Gridlines with Value Labels
    ctx.strokeStyle = "rgba(226, 232, 240, 0.8)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    const gridY = [y + 35, y + 75, y + 115, y + 155];
    const gridLabels = ["100%", "75%", "50%", "25%"];
    gridY.forEach((gy, i) => {
      ctx.beginPath(); ctx.moveTo(x + 48, gy); ctx.lineTo(x + w - 20, gy); ctx.stroke();
      ctx.fillStyle = "#94A3B8";
      ctx.font = "800 9px JetBrains Mono, monospace";
      ctx.textAlign = "right";
      ctx.fillText(gridLabels[i], x + 42, gy + 3);
    });
    ctx.setLineDash([]);

    // 3. Dynamic Curved Spline Data Line
    const graphP = Math.min(1.0, progress * 1.25);
    const chartLeft = x + 55;
    const chartRight = x + w - 25;
    const chartW = chartRight - chartLeft;

    // Define 5 control points for a realistic market curve
    const ptsDown = [
      { x: chartLeft, y: y + 42 },
      { x: chartLeft + chartW * 0.25, y: y + 55 },
      { x: chartLeft + chartW * 0.50, y: y + 90 },
      { x: chartLeft + chartW * 0.75, y: y + 130 },
      { x: chartRight, y: y + 158 }
    ];
    const ptsUp = [
      { x: chartLeft, y: y + 158 },
      { x: chartLeft + chartW * 0.25, y: y + 135 },
      { x: chartLeft + chartW * 0.50, y: y + 95 },
      { x: chartLeft + chartW * 0.75, y: y + 65 },
      { x: chartRight, y: y + 42 }
    ];
    const pts = dir === "down" ? ptsDown : ptsUp;

    // Calculate current live head point along the spline
    const curIdx = Math.min(pts.length - 2, Math.floor(graphP * (pts.length - 1)));
    const segT = (graphP * (pts.length - 1)) - curIdx;
    const pA = pts[curIdx];
    const pB = pts[curIdx + 1];
    const curX = pA.x + (pB.x - pA.x) * segT;
    const curY = pA.y + (pB.y - pA.y) * segT;

    // Area Gradient Beneath the Curve
    const areaGrd = ctx.createLinearGradient(0, y + 30, 0, y + h);
    if (dir === "down") {
      areaGrd.addColorStop(0, "rgba(239, 68, 68, 0.35)");
      areaGrd.addColorStop(1, "rgba(239, 68, 68, 0.0)");
    } else {
      areaGrd.addColorStop(0, "rgba(16, 185, 129, 0.35)");
      areaGrd.addColorStop(1, "rgba(16, 185, 129, 0.0)");
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, y + h - 15);
    ctx.lineTo(pts[0].x, pts[0].y);
    for (let i = 1; i <= curIdx; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.lineTo(curX, curY);
    ctx.lineTo(curX, y + h - 15);
    ctx.closePath();
    ctx.fillStyle = areaGrd;
    ctx.fill();

    // Glowing Spline Plot Line
    ctx.strokeStyle = dir === "down" ? "#DC2626" : "#059669";
    ctx.lineWidth = 3.5;
    ctx.shadowColor = dir === "down" ? "rgba(220, 38, 38, 0.5)" : "rgba(5, 150, 105, 0.5)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i <= curIdx; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.lineTo(curX, curY);
    ctx.stroke();
    ctx.shadowColor = "transparent";

    // 4. Live Pulsing Radar Cursor Dot at leading edge
    const radar = (progress * 4) % 1.0;
    ctx.strokeStyle = dir === "down" ? `rgba(239, 68, 68, ${1 - radar})` : `rgba(16, 185, 129, ${1 - radar})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(curX, curY, 6 + radar * 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = dir === "down" ? "#DC2626" : "#059669";
    ctx.beginPath();
    ctx.arc(curX, curY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(curX, curY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. Executive Top KPI Header Pill
    const kpiY = y - 36;
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = dir === "down" ? "#DC2626" : "#059669";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(x + w / 2 - 160, kpiY, 320, 48, 8);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    ctx.fillStyle = dir === "down" ? "#991B1B" : "#065F46";
    ctx.font = `800 ${Math.round(16 * fontScale)}px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`${dir === 'down' ? '📉' : '📈'} ${val}`, x + w / 2, kpiY + 28);

    ctx.fillStyle = "#475569";
    ctx.font = `700 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(metric.toUpperCase() + " · " + detail, x + w / 2, y + h + 22);

    ctx.restore();
  }

  // ============================================================
  // ACTION 8: GAVEL VERDICT & AUTHORITATIVE DECREE IMPACT
  // ============================================================
  function drawGavelVerdictAction(payload, progress) {
    const citation = payload.case_citation || "Supreme Court of India / Landmark Precedent";
    const ratio = payload.ratio || "Damages awarded strictly for natural consequences";

    const cx = 500;
    const cy = 195;

    ctx.save();
    // 1. Classical Circular Mahogany Soundblock
    const sbY = cy + 32;
    // Felt Base Rim
    ctx.fillStyle = "#1E293B";
    ctx.beginPath();
    ctx.ellipse(cx, sbY + 14, 65, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Turned Mahogany Block with Polished Bevel
    const sbGrd = ctx.createLinearGradient(cx - 60, sbY, cx + 60, sbY);
    sbGrd.addColorStop(0, "#451A03");
    sbGrd.addColorStop(0.5, "#9A3412");
    sbGrd.addColorStop(1, "#451A03");
    ctx.fillStyle = sbGrd;
    ctx.strokeStyle = "#290D01";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, sbY, 60, 16, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Soundblock 24k Gold Inlay Ring
    ctx.strokeStyle = "#FDE047";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(cx, sbY, 48, 12, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Physics-Based Gavel Swing Animation
    // Anticipation wind-up (0..0.25) -> High-speed strike (0.25..0.38) -> Damped vibration (0.38..1.0)
    let gavelAngle = 0;
    const strikeTime = 0.38;
    if (progress < 0.22) {
      gavelAngle = -0.65 - (progress / 0.22) * 0.15; // wind up back
    } else if (progress < strikeTime) {
      const strikeT = (progress - 0.22) / (strikeTime - 0.22);
      gavelAngle = -0.8 + strikeT * 0.8; // accelerate down
    } else {
      const postT = (progress - strikeTime) * 16;
      gavelAngle = Math.sin(postT) * Math.exp(-postT * 0.35) * 0.08; // damped impact vibration
    }

    ctx.save();
    ctx.translate(cx, sbY);
    ctx.rotate(gavelAngle);

    // Ergonomic Hand-Turned Handle
    const handleGrd = ctx.createLinearGradient(-100, -60, 0, 0);
    handleGrd.addColorStop(0, "#78350F");
    handleGrd.addColorStop(0.5, "#B45309");
    handleGrd.addColorStop(1, "#451A03");
    ctx.strokeStyle = handleGrd;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-80, -68);
    ctx.stroke();

    // Gavel Head (Turned Mahogany Cylinder)
    ctx.save();
    ctx.translate(0, -6);
    const headGrd = ctx.createLinearGradient(-18, -16, 18, 16);
    headGrd.addColorStop(0, "#451A03");
    headGrd.addColorStop(0.5, "#9A3412");
    headGrd.addColorStop(1, "#451A03");
    ctx.fillStyle = headGrd;
    ctx.strokeStyle = "#290D01";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-16, -18, 32, 24, 4);
    ctx.fill(); ctx.stroke();

    // Dual 24k Gold Accent Rings on Gavel Head
    ctx.fillStyle = "#FDE047";
    ctx.fillRect(-14, -18, 3, 24);
    ctx.fillRect(11, -18, 3, 24);
    ctx.restore();

    ctx.restore(); // end gavel transform

    // 3. Impact Shockwaves & Dust Particles on Strike
    if (progress >= strikeTime) {
      const impactT = ((progress - strikeTime) * 3) % 1.0;
      // Dual Expanding Golden Shockwave Rings
      ctx.strokeStyle = `rgba(245, 158, 11, ${1 - impactT})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, sbY, 30 + impactT * 60, 10 + impactT * 20, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Spark Particles
      for (let sp = 0; sp < 6; sp++) {
        const sa = sp * (Math.PI / 3);
        const sx = cx + Math.cos(sa) * (20 + impactT * 40);
        const sy = sbY - 8 + Math.sin(sa) * (10 + impactT * 18);
        ctx.fillStyle = `rgba(253, 224, 71, ${0.9 - impactT})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Unrolling Authoritative Precedent Decree Scroll
    if (progress > 0.32) {
      const scrollP = Math.min(1.0, (progress - 0.32) / 0.35);
      const dy = cy + 62;
      const sw = 480 * scrollP;
      const sx = cx - sw / 2;

      ctx.save();
      // Ivory Scroll Body with Soft Shadow
      const scrollGrd = ctx.createLinearGradient(sx, dy, sx, dy + 76);
      scrollGrd.addColorStop(0, "#FFFBEB");
      scrollGrd.addColorStop(1, "#FEF3C7");
      ctx.fillStyle = scrollGrd;
      ctx.strokeStyle = "#D97706";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(180, 83, 9, 0.2)";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.roundRect(sx, dy, sw, 76, 10);
      ctx.fill(); ctx.stroke();
      ctx.shadowColor = "transparent";

      if (scrollP > 0.7) {
        // Red Wax Seal Badge on Left of Scroll
        ctx.fillStyle = "#DC2626";
        ctx.strokeStyle = "#991B1B";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx + 34, dy + 38, 18, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = "#FDE047";
        ctx.font = "800 8.5px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText("LEX", sx + 34, dy + 41);

        // Precedent Citation
        ctx.fillStyle = "#B45309";
        ctx.font = `800 ${Math.round(11.5 * fontScale)}px JetBrains Mono, monospace`;
        ctx.textAlign = "center";
        ctx.fillText(`⚖️ ${citation.toUpperCase()}`, cx + 15, dy + 25);

        // Authoritative Ratio
        ctx.fillStyle = "#0F172A";
        ctx.font = `700 ${Math.round(11.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
        wrapCanvasText(ctx, ratio, cx + 15, dy + 47, sw - 90, 17);
      }
      ctx.restore();
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

    const cx = 500, cy = 212;

    ctx.save();
    // 1. Swiss Master Chronometer Case
    // Outer Stainless Steel Bezel
    const bezelGrd = ctx.createRadialGradient(cx, cy, 38, cx, cy, 56);
    bezelGrd.addColorStop(0, "#F8FAFC");
    bezelGrd.addColorStop(0.7, "#CBD5E1");
    bezelGrd.addColorStop(1, "#64748B");
    ctx.fillStyle = bezelGrd;
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(15, 23, 42, 0.18)";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, 54, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // 4 Corner Hex Bezel Screws
    [[-42, -42], [42, -42], [-42, 42], [42, 42]].forEach(([sx, sy]) => {
      ctx.fillStyle = "#94A3B8";
      ctx.beginPath(); ctx.arc(cx + sx, cy + sy, 2.5, 0, Math.PI * 2); ctx.fill();
    });

    // Ivory Watch Dial Face
    const dialGrd = ctx.createRadialGradient(cx, cy, 5, cx, cy, 46);
    dialGrd.addColorStop(0, "#FFFFFF");
    dialGrd.addColorStop(1, "#FAF6EE");
    ctx.fillStyle = dialGrd;
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, 46, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // 60 Dial Tick Marks & Roman Quarter Markers
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const isQuarter = i % 3 === 0;
      const r1 = isQuarter ? 32 : 36;
      const r2 = 42;
      ctx.strokeStyle = isQuarter ? "#0F172A" : "#94A3B8";
      ctx.lineWidth = isQuarter ? 2.5 : 1.2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }

    // 2. Dynamic Rotating Chronometer Hands
    const secAngle = -Math.PI / 2 + progress * Math.PI * 8; // Smooth sweep
    const minAngle = -Math.PI / 2 + progress * Math.PI * 1.2;

    // Blued Steel Minute Hand
    ctx.strokeStyle = "#1E3A8A";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(minAngle) * 28, cy + Math.sin(minAngle) * 28);
    ctx.stroke();

    // Sweeping Crimson Second Hand with Diamond Counterweight
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(secAngle) * 10, cy - Math.sin(secAngle) * 10);
    ctx.lineTo(cx + Math.cos(secAngle) * 36, cy + Math.sin(secAngle) * 36);
    ctx.stroke();

    // Center Gold Pin Jewel
    ctx.fillStyle = "#F59E0B";
    ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#FEF08A";
    ctx.beginPath(); ctx.arc(cx, cy, 1.8, 0, Math.PI * 2); ctx.fill();

    // 3. Harmonic Brass Pendulum Below
    const pendLen = 52;
    const pendAngle = Math.sin(progress * 20) * 0.28;
    const pendX = cx + Math.sin(pendAngle) * pendLen;
    const pendY = cy + 54 + Math.cos(pendAngle) * pendLen;

    ctx.strokeStyle = "#B45309";
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx, cy + 52); ctx.lineTo(pendX, pendY); ctx.stroke();

    const bobGrd = ctx.createRadialGradient(pendX - 2, pendY - 2, 2, pendX, pendY, 10);
    bobGrd.addColorStop(0, "#FEF08A");
    bobGrd.addColorStop(0.5, "#F59E0B");
    bobGrd.addColorStop(1, "#92400E");
    ctx.fillStyle = bobGrd;
    ctx.strokeStyle = "#78350F";
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(pendX, pendY, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // 4. Left Statutory Deadline Card
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(85, cy - 44, 290, 88, 12);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    ctx.fillStyle = "#DC2626";
    ctx.font = `800 11px JetBrains Mono, monospace`;
    ctx.textAlign = "left";
    ctx.fillText("⏳ STATUTORY TIME LIMIT", 105, cy - 18);

    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(13.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(title, 105, cy + 7);

    ctx.fillStyle = "#64748B";
    ctx.font = `700 12px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(timeLimit, 105, cy + 28);

    // 5. Right Legal Effect Status Card
    ctx.fillStyle = "#ECFDF5";
    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(16, 185, 129, 0.15)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(625, cy - 44, 290, 88, 12);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    ctx.fillStyle = "#047857";
    ctx.font = `800 11px JetBrains Mono, monospace`;
    ctx.textAlign = "left";
    ctx.fillText("⚖️ LEGAL EFFECT OF TIME", 645, cy - 18);

    ctx.fillStyle = "#065F46";
    ctx.font = `800 ${Math.round(13 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, status, 645, cy + 8, 250, 18, "left", 2);

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

    // 1. Center Architectural Villa Silhouette
    ctx.save();
    const vx = 500, vy = yCenter - 15;

    // Main Villa Structure
    const villaGrd = ctx.createLinearGradient(vx - 70, vy - 40, vx + 70, vy + 45);
    villaGrd.addColorStop(0, "#FFFFFF");
    villaGrd.addColorStop(1, "#F1F5F9");
    ctx.fillStyle = villaGrd;
    ctx.strokeStyle = "#3B82F6";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(59, 130, 246, 0.2)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.roundRect(vx - 70, vy - 35, 140, 80, 8);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Cantilevered Modern Roof
    ctx.fillStyle = "#1E40AF";
    ctx.beginPath();
    ctx.roundRect(vx - 78, vy - 44, 156, 12, 4);
    ctx.fill();

    // Illuminated Tinted Windows
    ctx.fillStyle = "#93C5FD";
    ctx.fillRect(vx - 54, vy - 20, 28, 22);
    ctx.fillRect(vx + 26, vy - 20, 28, 22);
    // Window Glare Lines
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.beginPath(); ctx.moveTo(vx - 50, vy - 20); ctx.lineTo(vx - 40, vy - 20); ctx.lineTo(vx - 54, vy - 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(vx + 30, vy - 20); ctx.lineTo(vx + 40, vy - 20); ctx.lineTo(vx + 26, vy - 4); ctx.fill();

    // Entrance Portico Door
    ctx.fillStyle = "#334155";
    ctx.roundRect(vx - 14, vy + 10, 28, 35, [4, 4, 0, 0]);
    ctx.fill();

    // Property Label Badge
    ctx.fillStyle = "#1E40AF";
    ctx.font = "800 10px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("TITLE DEED PREMISES", vx, vy - 5);

    ctx.fillStyle = "#0F172A";
    ctx.font = `700 11px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(propName, vx, vy + 6);

    // 2. Flying 24k Minted Gold Key with 3D Perspective Spin
    const keyP = Math.min(1.0, progress * 1.15);
    const keyX = (1 - keyP) * (xLeft + 65) + keyP * (xRight - 65);
    const keyY = yCenter - 65 - Math.sin(keyP * Math.PI) * 60; // Parabolic trajectory

    ctx.save();
    ctx.translate(keyX, keyY);
    // Perspective Tumble
    const keyTumble = Math.cos(keyP * 5 * Math.PI);
    ctx.scale(1, Math.max(0.3, Math.abs(keyTumble)));

    ctx.shadowColor = "rgba(234, 179, 8, 0.7)";
    ctx.shadowBlur = 18;

    // Ornate Key Bow (Ring)
    const keyGrd = ctx.createRadialGradient(-14, 0, 2, -14, 0, 14);
    keyGrd.addColorStop(0, "#FEF08A");
    keyGrd.addColorStop(0.5, "#EAB308");
    keyGrd.addColorStop(1, "#A16207");
    ctx.fillStyle = keyGrd;
    ctx.strokeStyle = "#78350F";
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(-14, 0, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Inner Keyhole cutout in Bow
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath(); ctx.arc(-14, 0, 5, 0, Math.PI * 2); ctx.fill();

    // Cylindrical Shaft & Precision Teeth
    ctx.strokeStyle = keyGrd;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-2, 0); ctx.lineTo(26, 0);
    ctx.lineTo(26, 9);
    ctx.moveTo(16, 0); ctx.lineTo(16, 7);
    ctx.stroke();

    ctx.restore();

    // Sparkling Stardust Particles along Flight Path
    for (let sp = 0; sp < 6; sp++) {
      const pT = (keyP + sp * 0.12) % 1.0;
      const px = (1 - pT) * (xLeft + 65) + pT * (xRight - 65);
      const py = yCenter - 65 - Math.sin(pT * Math.PI) * 60 + Math.sin(sp * 3) * 12;
      ctx.fillStyle = `rgba(250, 204, 21, ${0.8 - pT * 0.7})`;
      ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    // 3. Absolute Title Status Badge Below
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#059669";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(5, 150, 105, 0.2)";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(vx - 160, vy + 62, 320, 32, 8);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    ctx.fillStyle = "#047857";
    ctx.font = `800 11.5px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`🔑 ${status.toUpperCase()}`, vx, vy + 82);

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

    const bx = 200, by = 135, bw = 600, bh = 205;

    ctx.save();
    // 1. Executive Brushed Aluminum Clipboard Body
    const boardGrd = ctx.createLinearGradient(bx, by, bx, by + bh);
    boardGrd.addColorStop(0, "#FFFFFF");
    boardGrd.addColorStop(1, "#F8FAFC");
    ctx.fillStyle = boardGrd;
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(15, 23, 42, 0.10)";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 12);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Chrome Spring Clamp with Fastener Rivets
    const clipGrd = ctx.createLinearGradient(bx + bw / 2 - 55, by - 14, bx + bw / 2 + 55, by - 14);
    clipGrd.addColorStop(0, "#64748B");
    clipGrd.addColorStop(0.5, "#E2E8F0");
    clipGrd.addColorStop(1, "#64748B");
    ctx.fillStyle = clipGrd;
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(bx + bw / 2 - 55, by - 12, 110, 22, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#334155";
    ctx.beginPath(); ctx.arc(bx + bw / 2, by - 1, 4, 0, Math.PI * 2); ctx.fill();

    // 2. Header Title with Icon
    ctx.fillStyle = "#4338CA";
    ctx.font = `800 12px JetBrains Mono, monospace`;
    ctx.textAlign = "left";
    ctx.fillText("📋 STATUTORY COMPLIANCE CHECKLIST · INGREDIENTS", bx + 24, by + 30);

    // 3. Animated Criteria Rows
    const rowH = 34;
    const count = criteria.length;
    criteria.forEach((crit, i) => {
      const ry = by + 46 + i * rowH;
      const isChecked = progress >= (i + 1) / (count + 0.4);

      // Row Container with Emerald Wash when Checked
      ctx.fillStyle = isChecked ? "#ECFDF5" : "#FFFFFF";
      ctx.strokeStyle = isChecked ? "#10B981" : "#E2E8F0";
      ctx.lineWidth = isChecked ? 1.8 : 1.2;
      ctx.beginPath();
      ctx.roundRect(bx + 20, ry, bw - 40, 28, 6);
      ctx.fill(); ctx.stroke();

      // Circular Checkmark Badge
      const chkX = bx + 38;
      const chkY = ry + 14;
      ctx.fillStyle = isChecked ? "#059669" : "#CBD5E1";
      ctx.beginPath(); ctx.arc(chkX, chkY, 9, 0, Math.PI * 2); ctx.fill();

      if (isChecked) {
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(chkX - 4, chkY);
        ctx.lineTo(chkX - 1, chkY + 3.5);
        ctx.lineTo(chkX + 5, chkY - 3.5);
        ctx.stroke();
      }

      // Criterion Text
      ctx.fillStyle = isChecked ? "#065F46" : "#475569";
      ctx.font = `700 ${Math.round(12 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(crit, bx + 58, ry + 18.5);
    });

    // 4. Bottom Authoritative Validation Seal
    if (progress > 0.8) {
      ctx.fillStyle = "#059669";
      ctx.font = `800 11px JetBrains Mono, monospace`;
      ctx.textAlign = "right";
      ctx.fillText(`✓ ${status.toUpperCase()}`, bx + bw - 24, by + 30);
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

    const cx = 500, cy = 216;

    ctx.save();
    // 1. Concentric Cyan Fiduciary Shield Radar Waves
    const shieldP = (progress * 2.5) % 1.0;
    ctx.strokeStyle = `rgba(6, 182, 212, ${0.8 - shieldP * 0.7})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy + 12, 60 + shieldP * 36, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Hardened Steel Padlock Shackle with Realistic Unlock Pivot
    const isUnlocked = progress > 0.52;
    ctx.save();
    ctx.translate(cx, cy - 8);

    if (isUnlocked) {
      // Shackle rises 14px and pivots 26° open
      ctx.translate(24, -14);
      ctx.rotate(0.35);
      ctx.translate(-24, 14);
    }

    const shackleGrd = ctx.createLinearGradient(-30, -45, 30, 0);
    shackleGrd.addColorStop(0, "#F1F5F9");
    shackleGrd.addColorStop(0.5, "#94A3B8");
    shackleGrd.addColorStop(1, "#475569");
    ctx.strokeStyle = shackleGrd;
    ctx.lineWidth = 7.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, -22, 24, Math.PI, 0, false);
    ctx.lineTo(24, 0);
    if (!isUnlocked) {
      ctx.lineTo(-24, 0);
    }
    ctx.stroke();
    ctx.restore();

    // 3. Solid Brushed Brass/Steel Lock Body
    const bodyGrd = ctx.createLinearGradient(cx - 42, cy - 8, cx + 42, cy + 64);
    bodyGrd.addColorStop(0, "#0284C7");
    bodyGrd.addColorStop(0.5, "#0369A1");
    bodyGrd.addColorStop(1, "#075985");
    ctx.fillStyle = bodyGrd;
    ctx.strokeStyle = "#0C4A6E";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(2, 132, 199, 0.35)";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(cx - 42, cy - 6, 84, 68, 12);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Fiduciary Shield Emblem Engraved on Body
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 10);
    ctx.lineTo(cx + 16, cy + 18);
    ctx.lineTo(cx, cy + 42);
    ctx.lineTo(cx - 16, cy + 18);
    ctx.closePath();
    ctx.stroke();

    // Keyhole
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath(); ctx.arc(cx, cy + 22, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 2.5, cy + 24); ctx.lineTo(cx + 2.5, cy + 24);
    ctx.lineTo(cx + 4.5, cy + 36); ctx.lineTo(cx - 4.5, cy + 36);
    ctx.closePath(); ctx.fill();

    // 4. Left Statutory Security Detail Card
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#BAE6FD";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(90, cy - 38, 280, 84, 12);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    ctx.fillStyle = "#0284C7";
    ctx.font = "800 11px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText("🛡️ STATUTORY SECURITY", 110, cy - 14);

    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(13 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, title, 110, cy + 10, 245, 17, "left", 2);

    // 5. Right Protection Scope Card
    ctx.fillStyle = "#F0FDF4";
    ctx.strokeStyle = "#86EFAC";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(21, 128, 61, 0.12)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(630, cy - 38, 280, 84, 12);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    ctx.fillStyle = "#15803D";
    ctx.font = "800 11px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText("🔒 FIDUCIARY STATUS", 650, cy - 14);

    ctx.fillStyle = "#166534";
    ctx.font = `700 ${Math.round(12 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, status + ": " + scope, 650, cy + 10, 245, 17, "left", 2);

    ctx.restore();
  }

  // ============================================================
  // ACTION 13: CORPORATE BOARDROOM & SHAREHOLDER RESOLUTION
  // ============================================================
  function drawCorporateBoardAction(payload, progress) {
    const compName = payload.company_name || "Corporate Enterprise Ltd.";
    const resolution = payload.resolution || "Board Resolution / Shareholder Voting";
    const voting = payload.voting_result || "85% Assent (Resolution Carried)";

    const bx = 500, by = 216;

    ctx.save();
    // 1. Executive Boardroom Conference Table (Perspective Oval with Lacquer Finish)
    const tableGrd = ctx.createRadialGradient(bx, by - 10, 20, bx, by, 180);
    tableGrd.addColorStop(0, "#9A3412");
    tableGrd.addColorStop(0.5, "#78350F");
    tableGrd.addColorStop(1, "#451A03");
    ctx.fillStyle = tableGrd;
    ctx.strokeStyle = "#290D01";
    ctx.lineWidth = 3.5;
    ctx.shadowColor = "rgba(41, 13, 1, 0.3)";
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.ellipse(bx, by, 175, 62, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Tabletop Gloss Reflection
    const glossGrd = ctx.createLinearGradient(bx - 120, by - 30, bx + 120, by + 30);
    glossGrd.addColorStop(0, "rgba(255, 255, 255, 0.22)");
    glossGrd.addColorStop(0.5, "rgba(255, 255, 255, 0.05)");
    glossGrd.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glossGrd;
    ctx.beginPath();
    ctx.ellipse(bx, by - 6, 150, 44, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. 6 Executive Director Seats around the Table
    for (let s = 0; s < 6; s++) {
      const a = (s / 6) * Math.PI * 2;
      const sx = bx + Math.cos(a) * 200;
      const sy = by + Math.sin(a) * 82;

      // Chair Base
      ctx.fillStyle = "#0F172A";
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Glowing Quorum LED Dot
      ctx.fillStyle = progress > 0.4 ? "#10B981" : "#38BDF8";
      ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();

      // Label
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "800 8.5px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(`D${s+1}`, sx, sy + 3);
    }

    // 3. Floating Center Holographic Resolution Display
    ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
    ctx.strokeStyle = "#4F46E5";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(79, 70, 229, 0.25)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.roundRect(bx - 150, by - 30, 300, 60, 10);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    ctx.fillStyle = "#4338CA";
    ctx.font = "800 11px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`🏛️ ${compName.toUpperCase()}`, bx, by - 10);

    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(12.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(resolution, bx, by + 14);

    // 4. Voting Progress Meter Below Table
    const vWidth = 340;
    const vx = bx - vWidth / 2;
    const vy = by + 94;

    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1.8;
    ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(vx, vy, vWidth, 28, 7);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Animated Assent Fill Bar
    const assentP = Math.min(1.0, progress * 1.25) * 0.85;
    const fillW = (vWidth - 4) * assentP;
    const assentGrd = ctx.createLinearGradient(vx, vy, vx + fillW, vy);
    assentGrd.addColorStop(0, "#059669");
    assentGrd.addColorStop(1, "#10B981");
    ctx.fillStyle = assentGrd;
    ctx.beginPath();
    ctx.roundRect(vx + 2, vy + 2, fillW, 24, 5);
    ctx.fill();

    ctx.fillStyle = assentP > 0.4 ? "#FFFFFF" : "#065F46";
    ctx.font = `800 11px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`🗳️ ${voting.toUpperCase()}`, bx, vy + 18);

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

    // 1. Detailed Registered Airmail Envelope
    const envP = Math.min(1.0, progress * 1.15);
    const envX = (1 - envP) * (xLeft + 65) + envP * (xRight - 65);
    const envY = yCenter - 50 - Math.sin(envP * Math.PI) * 55;

    ctx.save();
    ctx.translate(envX, envY);

    // Dynamic Tilt Angle along flight trajectory
    const flightAngle = Math.cos(envP * Math.PI) * -0.22;
    ctx.rotate(flightAngle);

    ctx.shadowColor = "rgba(15, 23, 42, 0.2)";
    ctx.shadowBlur = 18;

    // Envelope Body
    const ew = 72, eh = 46;
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#3B82F6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-ew / 2, -eh / 2, ew, eh, 6);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Diagonal Red & Blue Chevron Airmail Piping on Border
    ctx.save();
    ctx.clip();
    for (let c = -ew / 2 - 10; c < ew / 2 + 10; c += 12) {
      ctx.fillStyle = "#DC2626";
      ctx.fillRect(c, -eh / 2, 5, 4);
      ctx.fillRect(c, eh / 2 - 4, 5, 4);
      ctx.fillStyle = "#2563EB";
      ctx.fillRect(c + 6, -eh / 2, 5, 4);
      ctx.fillRect(c + 6, eh / 2 - 4, 5, 4);
    }
    ctx.restore();

    // Envelope Flap Lines
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-ew / 2, -eh / 2); ctx.lineTo(0, 4); ctx.lineTo(ew / 2, -eh / 2);
    ctx.stroke();

    // Official Red Postal Franking Stamp in Top-Right
    ctx.fillStyle = "#DC2626";
    ctx.beginPath(); ctx.roundRect(ew / 2 - 20, -eh / 2 + 5, 15, 12, 2); ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 6.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("SPEED", ew / 2 - 12.5, -eh / 2 + 13);

    ctx.restore();

    // 2. High-Velocity Supersonic Motion Trails
    ctx.strokeStyle = "rgba(79, 70, 229, 0.55)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(xLeft + 65, yCenter);
    ctx.quadraticCurveTo(500, yCenter - 105, envX - 40, envY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Stamped Registered AD (Acknowledgment Due) Receipt upon Delivery
    if (progress > 0.48) {
      const adY = yCenter + 56;
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#059669";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(5, 150, 105, 0.22)";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.roundRect(500 - 190, adY, 380, 52, 8);
      ctx.fill(); ctx.stroke();
      ctx.shadowColor = "transparent";

      ctx.fillStyle = "#047857";
      ctx.font = "800 11px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(`📬 ${status.toUpperCase()}`, 500, adY + 22);

      ctx.fillStyle = "#0F172A";
      ctx.font = `700 ${Math.round(11.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.fillText(noticeType, 500, adY + 41);
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

    const cx = 500, cy = 216;

    ctx.save();
    // 1. Official Government Demand Challan Document
    const cW = 440, cH = 176;
    const cX = cx - cW / 2, cY = cy - cH / 2;

    const docGrd = ctx.createLinearGradient(cX, cY, cX, cY + cH);
    docGrd.addColorStop(0, "#FFFDF9");
    docGrd.addColorStop(1, "#FAF5EE");
    ctx.fillStyle = docGrd;
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(220, 38, 38, 0.22)";
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.roundRect(cX, cY, cW, cH, 12);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // High-Security Inner Guilloche Margin
    ctx.strokeStyle = "#FCA5A5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cX + 8, cY + 8, cW - 16, cH - 16, 8);
    ctx.stroke();

    // Top Red Warning Header Ribbon
    ctx.fillStyle = "#FEE2E2";
    ctx.strokeStyle = "#F87171";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(cX + 16, cY + 14, cW - 32, 32, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#991B1B";
    ctx.font = "800 11px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("⚠️ OFFICIAL STATUTORY REVENUE DEMAND NOTICE", cx, cY + 34);

    // 2. Rolling Digital Fine Amount Display (JetBrains Mono)
    ctx.fillStyle = "#DC2626";
    ctx.font = `800 ${Math.round(28 * fontScale)}px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(amount, cx, cY + 84);

    // Reason Label
    ctx.fillStyle = "#475569";
    ctx.font = `600 ${Math.round(11.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, penaltyTitle + " — " + reason, cx, cY + 116, cW - 48, 17);

    // 3. Red Rubber Stamp of Non-Compliance Impact with Damped Landing
    if (progress > 0.38) {
      const stampP = Math.min(1.0, (progress - 0.38) / 0.18);
      const stampScale = 1.0 + (1.0 - stampP) * 0.45;

      ctx.save();
      ctx.translate(cx + 95, cy + 32);
      ctx.scale(stampScale, stampScale);
      ctx.rotate(-0.16);

      ctx.strokeStyle = "#DC2626";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(-85, -18, 170, 36, 6);
      ctx.stroke();

      // Inner stamp border
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-80, -14, 160, 28, 4);
      ctx.stroke();

      ctx.fillStyle = "#DC2626";
      ctx.font = "900 12.5px JetBrains Mono, monospace";
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

    const startX = 120;
    const startY = 145;
    const stepW = 224;
    const gap = 38;

    ctx.save();
    steps.forEach((st, i) => {
      const sx = startX + i * (stepW + gap);
      const sy = startY + i * 30;
      const isHighlighted = progress >= (i + 1) / (steps.length + 0.3);
      const isFinal = i === steps.length - 1;

      // 1. Cascading Flow Conduits with Moving Fluid Energy Particles
      if (i > 0) {
        ctx.strokeStyle = "#CBD5E1";
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(sx - gap + 10, sy - 16);
        ctx.lineTo(sx - 8, sy + 20);
        ctx.stroke();
        ctx.setLineDash([]);

        // Flowing fluid droplet
        const dropT = (progress * 3 + i * 0.33) % 1.0;
        const dx = (sx - gap + 10) + (18) * dropT;
        const dy = (sy - 16) + (36) * dropT;
        ctx.fillStyle = isHighlighted ? "#4F46E5" : "#94A3B8";
        ctx.beginPath(); ctx.arc(dx, dy, 3.5, 0, Math.PI * 2); ctx.fill();
      }

      // 2. Waterfall Tier Card
      ctx.fillStyle = isFinal ? "#FFFFFF" : (isHighlighted ? "#FFFFFF" : "#F8FAFC");
      ctx.strokeStyle = isFinal ? "#059669" : (isHighlighted ? "#4F46E5" : "#CBD5E1");
      ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
      if (isHighlighted) {
        ctx.shadowColor = isFinal ? "rgba(5, 150, 105, 0.25)" : "rgba(79, 70, 229, 0.22)";
        ctx.shadowBlur = 18;
      }
      ctx.beginPath();
      ctx.roundRect(sx, sy, stepW, 72, 10);
      ctx.fill(); ctx.stroke();
      ctx.shadowColor = "transparent";

      // Step Tag Ribbon
      ctx.fillStyle = isFinal ? "#ECFDF5" : (isHighlighted ? "#EEF2FF" : "#F1F5F9");
      ctx.beginPath();
      ctx.roundRect(sx + 10, sy + 8, stepW - 20, 22, 5);
      ctx.fill();

      ctx.fillStyle = isFinal ? "#047857" : (isHighlighted ? "#4338CA" : "#64748B");
      ctx.font = "800 10px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      ctx.fillText(`STEP ${i+1} · ${st.label.toUpperCase()}`, sx + 18, sy + 23);

      // Amount with Dynamic Value Highlight
      ctx.fillStyle = isFinal ? "#065F46" : (isHighlighted ? "#0F172A" : "#475569");
      ctx.font = `800 ${Math.round(16 * fontScale)}px JetBrains Mono, monospace`;
      ctx.fillText(st.amount, sx + 18, sy + 54);
    });
    ctx.restore();
  }

  // Helper: Draw Executive Actor Character Pillar Card
  function drawActorPillar(x, y, name, iconKey, color, tag, isGlowing = false) {
    ctx.save();
    
    // Glassmorphic Card Container
    const cw = 144, ch = 168;
    const cx = x - cw / 2, cy = y - 58;

    if (isGlowing) {
      ctx.shadowColor = "rgba(16, 185, 129, 0.35)";
      ctx.shadowBlur = 20;
    } else {
      ctx.shadowColor = "rgba(15, 23, 42, 0.06)";
      ctx.shadowBlur = 14;
    }

    const cardGrd = ctx.createLinearGradient(cx, cy, cx, cy + ch);
    cardGrd.addColorStop(0, "#FFFFFF");
    cardGrd.addColorStop(1, "#F8FAFC");
    ctx.fillStyle = cardGrd;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cw, ch, 12);
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.strokeStyle = isGlowing ? "#10B981" : (color || "#E2E8F0");
    ctx.lineWidth = isGlowing ? 2.5 : 1.5;
    ctx.stroke();

    // Portrait Avatar Circle
    const avatarY = cy + 42;
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, avatarY, 28, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Icon or Silhouette inside Avatar
    if (window.drawColorfulBadgeShape) {
      window.drawColorfulBadgeShape(ctx, iconKey, x, avatarY, 18, "indigo", "circle");
    } else {
      ctx.fillStyle = color;
      ctx.font = "800 16px Plus Jakarta Sans, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(name.charAt(0) || "P", x, avatarY + 6);
    }

    // Role Tag Pill
    const tagGrd = ctx.createLinearGradient(x - 52, cy + 78, x + 52, cy + 78);
    tagGrd.addColorStop(0, color);
    tagGrd.addColorStop(1, color);
    ctx.fillStyle = tagGrd;
    ctx.beginPath();
    ctx.roundRect(x - 52, cy + 78, 104, 20, 5);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 9.5px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(tag.toUpperCase(), x, cy + 92);

    // Name Label with High Contrast
    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(12 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, name, x, cy + 118, 126, 16);

    ctx.restore();
  }

  // Helper: Draw Modern Logistics Depot Hub
  function drawBuildingDepot(x, y, label, tag, color) {
    ctx.save();
    const w = 120, h = 90;
    const bx = x - w / 2, by = y - h / 2 - 10;

    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(bx, by, w, h, 10);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Roof Line
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(bx, by, w, 6, [10, 10, 0, 0]);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.font = `800 10.5px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(tag, x, by + 24);

    ctx.fillStyle = "#0F172A";
    ctx.font = `700 11.5px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, label, x, by + 46, 104, 15);
    ctx.restore();
  }

  // Helper: Draw Executive Bottom Subtitle Bar
  function drawBottomActionSubtitle(line, lineNum, totalLines, progress) {
    const startX = 60;
    const totalW = 880;
    const bottomY = 385;

    ctx.save();
    // Glassmorphic Subtitle Card
    const cardGrd = ctx.createLinearGradient(startX, bottomY, startX, bottomY + 86);
    cardGrd.addColorStop(0, "#FFFFFF");
    cardGrd.addColorStop(1, "#F8FAFC");
    ctx.fillStyle = cardGrd;
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "rgba(15, 23, 42, 0.06)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(startX, bottomY, totalW, 86, 10);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Header Row: Teacher Mic Eyebrow + Line Counter
    ctx.fillStyle = "#4338CA";
    ctx.font = `800 ${Math.round(11 * fontScale)}px JetBrains Mono, monospace`;
    ctx.textAlign = "left";
    ctx.fillText(`🎙️ PROFESSOR'S STATUTORY EXPLANATION · ${line.line_title ? line.line_title.toUpperCase() : ''}`, startX + 20, bottomY + 26);

    // Step Pill Badge on Right
    ctx.fillStyle = "#EEF2FF";
    ctx.strokeStyle = "#C7D2FE";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(startX + totalW - 130, bottomY + 12, 110, 22, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#4338CA";
    ctx.font = `800 10px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`SENTENCE ${lineNum}/${totalLines}`, startX + totalW - 75, bottomY + 27);

    // Sentence Narrative Spoken Text
    ctx.fillStyle = "#0F172A";
    ctx.font = `700 ${Math.round(13.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, line.sentence || "", startX + 20, bottomY + 54, totalW - 40, 21, "left", 2);
    ctx.restore();

    // Update Narration Box below canvas
    const narrationEl = document.getElementById("anim_narration_text");
    if (narrationEl && activeData?.scenes?.[currentSceneIdx]?.lines) {
      let html = "";
      activeData.scenes[currentSceneIdx].lines.forEach((l, i) => {
        const isCurrent = (i + 1) === lineNum;
        if (isCurrent) {
          html += `<span class="karaoke-active" style="display:inline-block; margin-right:8px; margin-bottom:4px; padding:4px 10px; border-radius:6px;"><strong>Line ${i+1}:</strong> ${l.sentence}</span> `;
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
    setSpeed: setSpeed,
    toggleVoice: toggleVoice,
    prevSlide: prevSlide,
    nextSlide: nextSlide,
    seekTo: seekTo
  };

  window.addEventListener("DOMContentLoaded", initPlayer);
})();
