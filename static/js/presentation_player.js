// -*- coding: utf-8 -*-
// static/js/presentation_player.js
// Kinetic Presentation Player with Audio-Sync, Prominent Typography & Animated Countdowns

(function() {
  window.PRESENTATION_PLAYER = {};

  let canvas, ctx;
  let activeData = null;
  let currentSceneIdx = 0;
  let currentTimeMs = 0;
  let isPlaying = false;
  let fontScale = 1.15; // Prominent default (+15%)
  let audioPlayer = null;
  let autoAdvance = true;
  let voiceSync = true;
  let lastFrameTime = performance.now();

  function formatRupees(num) {
    if (typeof num !== "number") return num;
    return "₹" + num.toLocaleString("en-IN");
  }

  function getAnimatedAmount(targetNum, elapsedMs, triggerMs = 0, durationMs = 1200) {
    if (typeof targetNum !== "number" || targetNum <= 0) return targetNum;
    if (elapsedMs < triggerMs) return "₹0";
    const progress = Math.min(1.0, Math.max(0, (elapsedMs - triggerMs) / durationMs));
    // Ease-out cubic formula
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentVal = Math.floor(targetNum * easeProgress);
    return formatRupees(currentVal);
  }

  function initPlayer() {
    canvas = document.getElementById("stage_canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    audioPlayer = document.getElementById("voice_audio_player");

    if (audioPlayer) {
      audioPlayer.addEventListener("timeupdate", onAudioTimeUpdate);
      audioPlayer.addEventListener("ended", onAudioEnded);
    }

    requestAnimationFrame(renderLoop);
  }

  function loadPresentation(data) {
    activeData = data;
    currentSceneIdx = 0;
    currentTimeMs = 0;
    renderTabs();
    switchScene(0);
  }

  function renderTabs() {
    const tabsContainer = document.getElementById("scene_tabs");
    if (!tabsContainer || !activeData || !activeData.scenes) return;

    tabsContainer.innerHTML = "";
    activeData.scenes.forEach((sc, idx) => {
      const btn = document.createElement("button");
      btn.className = `scene-tab-btn ${idx === currentSceneIdx ? "active" : ""} ${sc.screenplay_phase && sc.screenplay_phase.includes("STORY") ? "phase-story" : "phase-statute"}`;
      const prefix = sc.screenplay_phase && sc.screenplay_phase.includes("STORY") ? "📖" : "⚖️";
      btn.innerHTML = `${prefix} Slide ${idx + 1}: ${sc.tab_title || sc.tag || `Scene ${idx+1}`}`;
      btn.onclick = () => switchScene(idx);
      tabsContainer.appendChild(btn);
    });
  }

  function switchScene(idx) {
    if (!activeData || !activeData.scenes || !activeData.scenes[idx]) return;
    currentSceneIdx = idx;
    currentTimeMs = 0;

    // Update Tab active classes
    const tabs = document.querySelectorAll(".scene-tab-btn");
    tabs.forEach((t, i) => t.classList.toggle("active", i === idx));

    const sc = activeData.scenes[idx];

    // Narration Meta
    const phaseBadge = document.getElementById("scene_phase_badge");
    if (phaseBadge) {
      const isStory = sc.screenplay_phase && sc.screenplay_phase.includes("STORY");
      phaseBadge.textContent = isStory ? "📖 PHASE 1: STORY EXPOSITION" : "⚖️ PHASE 2: STATUTORY BREAKDOWN";
      phaseBadge.style.background = isStory ? "#D97706" : "#059669";
    }

    const tagLabel = document.getElementById("scene_tag_label");
    if (tagLabel) tagLabel.textContent = (sc.tag || `SCENE ${idx+1}`).toUpperCase();

    const storyRef = document.getElementById("scene_story_ref");
    if (storyRef) {
      if (sc.story_point_ref) {
        storyRef.style.display = "block";
        storyRef.textContent = `🎯 ${sc.story_point_ref}`;
      } else {
        storyRef.style.display = "none";
      }
    }

    // Audio setup
    if (audioPlayer && sc.audio_url) {
      audioPlayer.src = sc.audio_url;
      audioPlayer.currentTime = 0;
      if (isPlaying) {
        audioPlayer.play().catch(e => console.warn("Audio autoplay:", e));
      }
    }

    // Slider setup
    const slider = document.getElementById("timeline_slider");
    if (slider) {
      slider.max = sc.duration_ms || 12000;
      slider.value = 0;
    }

    updateNarrationText(sc, 0);
  }

  function onAudioTimeUpdate() {
    if (voiceSync && audioPlayer && !audioPlayer.paused) {
      currentTimeMs = audioPlayer.currentTime * 1000;
      const slider = document.getElementById("timeline_slider");
      if (slider) slider.value = currentTimeMs;
    }
  }

  function onAudioEnded() {
    if (autoAdvance && activeData && currentSceneIdx < activeData.scenes.length - 1) {
      setTimeout(() => switchScene(currentSceneIdx + 1), 600);
    } else {
      isPlaying = false;
      updatePlayBtnState();
    }
  }

  function updateNarrationText(sc, timeMs) {
    const el = document.getElementById("narration_text");
    if (!el) return;

    if (!sc.sentences || sc.sentences.length === 0) {
      el.textContent = sc.dialogue || "";
      return;
    }

    // Real-Time Karaoke Highlight
    let html = "";
    sc.sentences.forEach(s => {
      const isCurrent = timeMs >= s.start_ms && timeMs <= s.end_ms;
      if (isCurrent) {
        html += `<span class="karaoke-active">${s.text}</span> `;
      } else {
        html += `<span>${s.text}</span> `;
      }
    });
    el.innerHTML = html;
  }

  function togglePlay() {
    isPlaying = !isPlaying;
    if (audioPlayer) {
      if (isPlaying) audioPlayer.play().catch(e => console.warn(e));
      else audioPlayer.pause();
    }
    updatePlayBtnState();
  }

  function updatePlayBtnState() {
    const btn = document.getElementById("btn_play_pause");
    if (btn) btn.innerHTML = isPlaying ? "⏸ Pause" : "▶ Play Animation";
  }

  function setFontScale(scale, btnEl) {
    fontScale = scale;
    document.querySelectorAll(".font-zoom-btn").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
  }

  // ==========================================
  // RENDER LOOP & CANVAS DRAWING
  // ==========================================
  function renderLoop(now) {
    const dt = now - lastFrameTime;
    lastFrameTime = now;

    if (isPlaying && (!audioPlayer || audioPlayer.paused)) {
      currentTimeMs += dt;
      const sc = activeData?.scenes?.[currentSceneIdx];
      const maxMs = sc?.duration_ms || 12000;
      if (currentTimeMs >= maxMs) {
        if (autoAdvance && activeData && currentSceneIdx < activeData.scenes.length - 1) {
          switchScene(currentSceneIdx + 1);
        } else {
          isPlaying = false;
          updatePlayBtnState();
        }
      }
      const slider = document.getElementById("timeline_slider");
      if (slider) slider.value = currentTimeMs;
    }

    drawScene();
    requestAnimationFrame(renderLoop);
  }

  function drawScene() {
    if (!ctx) return;
    ctx.clearRect(0, 0, 1000, 500);

    // Subtle background grid
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 1000, 500);
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
    updateNarrationText(sc, currentTimeMs);

    // Update time indicator
    const timeDisplay = document.getElementById("time_display");
    if (timeDisplay) {
      const curSec = (currentTimeMs / 1000).toFixed(1);
      const totalSec = ((sc.duration_ms || 10000) / 1000).toFixed(1);
      timeDisplay.textContent = `00:${curSec.padStart(4, "0")} / 00:${totalSec.padStart(4, "0")}`;
    }

    // Top Header Banner
    drawSceneHeader(sc);

    // Draw Elements based on Archetype
    const archetype = sc.layout_archetype || "split_screen";
    if (archetype === "waterfall_ledger" || archetype === "hero_ledger") {
      drawWaterfallLadder(sc);
    } else if (archetype === "balance_scale") {
      drawBalanceScale(sc);
    } else {
      drawGenericSceneElements(sc);
    }
  }

  function drawSceneHeader(sc) {
    ctx.save();
    // Section Code Badge
    ctx.fillStyle = "#EEF2FF";
    ctx.strokeStyle = "#C7D2FE";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(50, 24, 150, 32, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#4F46E5";
    ctx.font = `bold ${Math.round(11.5 * fontScale)}px JetBrains Mono, monospace`;
    ctx.fillText(activeData.section_code || "INCOME TAX ACT", 62, 45);

    // Slide Title
    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(16 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(sc.tab_title || sc.tag || "Statutory Analysis", 215, 46);
    ctx.restore();
  }

  function drawGenericSceneElements(sc) {
    const elements = sc.elements || [];
    elements.forEach(el => {
      const startMs = el.start_ms || 0;
      if (currentTimeMs < startMs) return;

      const progress = Math.min(1.0, (currentTimeMs - startMs) / 500);

      if (el.type === "asset_node" || el.type === "card") {
        drawNodeCard(el, progress);
      } else if (el.type === "flow_pipe") {
        drawFlowPipe(el, progress);
      } else if (el.type === "box") {
        drawNoteBox(el, progress);
      }
    });
  }

  function drawNodeCard(el, progress) {
    ctx.save();
    ctx.globalAlpha = progress;

    const x = el.x;
    const y = el.y;
    const w = el.w;
    const h = el.h;

    // Card background
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill(); ctx.stroke();

    ctx.shadowColor = "transparent";

    // Icon Badge (Prominent)
    const iconName = el.icon || "file-text";
    const badgeR = 30;
    const badgeX = x + w / 2;
    const badgeY = y + 54;
    if (window.drawColorfulBadgeShape) {
      window.drawColorfulBadgeShape(ctx, iconName, badgeX, badgeY, badgeR, "indigo", "circle");
    }

    // Label
    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(15 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(el.label || el.title || "", badgeX, y + 115);

    // Subtitle
    ctx.fillStyle = "#64748B";
    ctx.font = `600 ${Math.round(12 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(el.subtitle || el.text || "", badgeX, y + 140);

    // Prominent Full Amount with Animated Countdown
    if (el.amount_val) {
      const animAmount = getAnimatedAmount(el.amount_val, currentTimeMs, el.countdown_trigger_ms || el.start_ms);
      ctx.fillStyle = "#059669";
      ctx.font = `800 ${Math.round(16 * fontScale)}px JetBrains Mono, monospace`;
      ctx.fillText(animAmount, badgeX, y + 180);
    }

    ctx.restore();
  }

  function drawFlowPipe(el, progress) {
    ctx.save();
    ctx.strokeStyle = "#4F46E5";
    ctx.lineWidth = 3.5;
    ctx.setLineDash([8, 5]);

    const curX2 = el.x1 + (el.x2 - el.x1) * progress;
    const curY2 = el.y1 + (el.y2 - el.y1) * progress;

    ctx.beginPath();
    ctx.moveTo(el.x1, el.y1);
    ctx.lineTo(curX2, curY2);
    ctx.stroke();

    if (progress > 0.5 && el.label) {
      ctx.fillStyle = "#4F46E5";
      ctx.font = `800 ${Math.round(11 * fontScale)}px JetBrains Mono, monospace`;
      ctx.textAlign = "center";
      ctx.fillText(el.label, (el.x1 + el.x2) / 2, el.y1 - 10);
    }
    ctx.restore();
  }

  function drawNoteBox(el, progress) {
    ctx.save();
    ctx.globalAlpha = progress;
    ctx.fillStyle = "#F8FAFC";
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(el.x, el.y, el.w, el.h, 8);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(13 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(el.title || "", el.x + 16, el.y + 30);

    ctx.fillStyle = "#475569";
    ctx.font = `600 ${Math.round(12 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.fillText(el.subtitle || "", el.x + 16, el.y + 54);
    ctx.restore();
  }

  // ==========================================
  // WATERFALL LADDER (Deductions with Countdown)
  // ==========================================
  function drawWaterfallLadder(sc) {
    const rows = [
      { label: "Full Value of Consideration (Sec 50C Deemed SDV)", amount: 12500000, isDeduction: false },
      { label: "Less: Transfer & Stamp Duty Expenses", amount: 500000, isDeduction: true },
      { label: "Net Consideration", amount: 12000000, isDeduction: false },
      { label: "Less: Indexed Cost of Acquisition (COA)", amount: 3000000, isDeduction: true },
      { label: "Gross Long-Term Capital Gains (LTCG)", amount: 9000000, isDeduction: false },
      { label: "Less: Section 54EC REC Capital Gain Bonds", amount: 5000000, isDeduction: true },
      { label: "Net Taxable Long-Term Capital Gains", amount: 4000000, isHero: true }
    ];

    const count = rows.length;
    const startY = 80;
    const rowH = 48;
    const w = 780;
    const x = 110;
    const stepDurationMs = 1400;

    rows.forEach((r, idx) => {
      const stepStartMs = 400 + idx * stepDurationMs;
      if (currentTimeMs < stepStartMs) return;

      const progress = Math.min(1.0, (currentTimeMs - stepStartMs) / 450);
      const y = startY + idx * (rowH + 6);

      ctx.save();
      ctx.globalAlpha = progress;

      // Card row
      if (r.isHero) {
        ctx.fillStyle = "#ECFDF5";
        ctx.strokeStyle = "#059669";
        ctx.lineWidth = 2.5;
      } else if (r.isDeduction) {
        ctx.fillStyle = "#FEF2F2";
        ctx.strokeStyle = "#FECACA";
        ctx.lineWidth = 1.5;
      } else {
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#E2E8F0";
        ctx.lineWidth = 1.5;
      }

      ctx.beginPath();
      ctx.roundRect(x, y, w, rowH, 8);
      ctx.fill(); ctx.stroke();

      // Label (Prominent)
      ctx.fillStyle = r.isHero ? "#065F46" : "#0F172A";
      ctx.font = `700 ${Math.round(13.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText((r.isDeduction ? "(-)  " : "") + r.label, x + 20, y + 29);

      // Amount with Animated Countdown
      const animVal = getAnimatedAmount(r.amount, currentTimeMs, stepStartMs + 100, 1000);
      ctx.fillStyle = r.isHero ? "#047857" : (r.isDeduction ? "#DC2626" : "#0F172A");
      ctx.font = `800 ${Math.round(15.5 * fontScale)}px JetBrains Mono, monospace`;
      ctx.textAlign = "right";
      ctx.fillText(animVal, x + w - 24, y + 29);

      ctx.restore();
    });
  }

  // ==========================================
  // BALANCE SCALE (Safe Harbor 110% Comparison)
  // ==========================================
  function drawBalanceScale(sc) {
    const cx = 500;
    const cy = 250;

    // Animate scale tilt after 2.5s
    const tiltMs = 2500;
    const tiltProgress = Math.min(1.0, Math.max(0, (currentTimeMs - tiltMs) / 1200));
    const angle = tiltProgress * 0.16; // tilt down on SDV side

    ctx.save();
    // Central Pillar
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 80);
    ctx.lineTo(cx, cy + 120);
    ctx.stroke();

    // Fulcrum base
    ctx.fillStyle = "#1E293B";
    ctx.beginPath();
    ctx.moveTo(cx - 50, cy + 130);
    ctx.lineTo(cx + 50, cy + 130);
    ctx.lineTo(cx, cy + 100);
    ctx.closePath();
    ctx.fill();

    // Tilting Beam
    ctx.translate(cx, cy - 80);
    ctx.rotate(angle);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-220, 0);
    ctx.lineTo(220, 0);
    ctx.stroke();

    // Left Pan (Agreed Value: ₹1,00,00,000)
    ctx.save();
    ctx.translate(-220, 0);
    ctx.rotate(-angle);
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-45, 90);
    ctx.moveTo(0, 0); ctx.lineTo(45, 90);
    ctx.stroke();

    ctx.fillStyle = "#EEF2FF";
    ctx.strokeStyle = "#4F46E5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-90, 90, 180, 75, 10);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#1E1B4B";
    ctx.font = `800 ${Math.round(12.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("AGREED VALUE", 0, 115);
    ctx.fillStyle = "#4F46E5";
    ctx.font = `800 ${Math.round(15 * fontScale)}px JetBrains Mono, monospace`;
    ctx.fillText("₹1,00,00,000", 0, 142);
    ctx.restore();

    // Right Pan (Stamp Duty Value: ₹1,25,00,000)
    ctx.save();
    ctx.translate(220, 0);
    ctx.rotate(-angle);
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-45, 90);
    ctx.moveTo(0, 0); ctx.lineTo(45, 90);
    ctx.stroke();

    ctx.fillStyle = "#FEF2F2";
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-90, 90, 180, 75, 10);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#7F1D1D";
    ctx.font = `800 ${Math.round(12.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("STAMP DUTY (SDV)", 0, 115);
    ctx.fillStyle = "#DC2626";
    ctx.font = `800 ${Math.round(15 * fontScale)}px JetBrains Mono, monospace`;
    ctx.fillText("₹1,25,00,000", 0, 142);
    ctx.restore();

    ctx.restore();

    // Safe Harbor Breach Indicator (Pops up when scale tilts)
    if (tiltProgress > 0.4) {
      ctx.save();
      ctx.globalAlpha = tiltProgress;
      ctx.fillStyle = "#DC2626";
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(380, 70, 240, 42, 8);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `800 ${Math.round(12 * fontScale)}px JetBrains Mono, monospace`;
      ctx.textAlign = "center";
      ctx.fillText("⚠️ 110% SAFE HARBOR BREACHED", 500, 96);
      ctx.restore();
    }
  }

  function drawPlaceholder() {
    ctx.fillStyle = "#94A3B8";
    ctx.font = `700 16px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Paste a statutory provision above and click 'Generate Presentation'", 500, 240);
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
      currentTimeMs = ms;
      if (audioPlayer) audioPlayer.currentTime = ms / 1000;
    }
  };

  window.addEventListener("DOMContentLoaded", initPlayer);
})();
