// -*- coding: utf-8 -*-
// static/js/presentation_player.js
// 100% Dynamic Line-by-Line Kinetic Animation Player
// Every single line (sentence) has its own dedicated visual shape & text card!

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
      btn.innerHTML = `${prefix} Slide ${idx + 1}: ${sc.tab_title || `Scene ${idx+1}`}`;
      btn.onclick = () => switchScene(idx);
      tabsContainer.appendChild(btn);
    });
  }

  function switchScene(idx) {
    if (!activeData || !activeData.scenes || !activeData.scenes[idx]) return;
    currentSceneIdx = idx;
    currentTimeMs = 0;

    // Update Tab active classes
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

    const narrationEl = document.getElementById("anim_narration_text");
    if (narrationEl) {
      narrationEl.textContent = sc.dialogue || "";
    }

    const linesCount = sc.lines ? sc.lines.length : 3;
    const maxMs = linesCount * 2800 + 1000;
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
  // SMART DYNAMIC ICON MATCHER (FALLBACK)
  // ==========================================
  function getSmartIcon(text, fallback = "file-text") {
    if (!text) return fallback;
    const s = text.toLowerCase();
    if (s.includes("user") || s.includes("person") || s.includes("buyer") || s.includes("seller") || s.includes("party") || s.includes("director") || s.includes("promoter") || s.includes("mill") || s.includes("contractor") || s.includes("architect")) return "user";
    if (s.includes("company") || s.includes("corporate") || s.includes("firm") || s.includes("hospital") || s.includes("factory") || s.includes("enterprise") || s.includes("business") || s.includes("boutique")) return "building-2";
    if (s.includes("contract") || s.includes("agreement") || s.includes("deed") || s.includes("clause") || s.includes("terms") || s.includes("notice")) return "file-text";
    if (s.includes("money") || s.includes("price") || s.includes("consideration") || s.includes("amount") || s.includes("payment") || s.includes("profit") || s.includes("fee") || s.includes("rupee") || s.includes("lakh")) return "coins";
    if (s.includes("loss") || s.includes("breach") || s.includes("damage") || s.includes("remote") || s.includes("default") || s.includes("dispute") || s.includes("injury")) return "alert-triangle";
    if (s.includes("court") || s.includes("judge") || s.includes("law") || s.includes("section") || s.includes("order") || s.includes("precedent") || s.includes("verdict")) return "gavel";
    if (s.includes("shield") || s.includes("safe") || s.includes("exemption") || s.includes("remedy") || s.includes("defence") || s.includes("exception")) return "shield-check";
    if (s.includes("time") || s.includes("date") || s.includes("month") || s.includes("year") || s.includes("deadline") || s.includes("delay")) return "clock";
    if (s.includes("goods") || s.includes("delivery") || s.includes("shipment") || s.includes("transport") || s.includes("machinery") || s.includes("truck")) return "truck";
    if (s.includes("land") || s.includes("property") || s.includes("house") || s.includes("building") || s.includes("flat")) return "residential_house";
    if (s.includes("valid") || s.includes("condition") || s.includes("rule") || s.includes("approved")) return "badge-check";
    return fallback;
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
      const maxMs = linesCount * 2800 + 1000;
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

    // Background & subtle grid
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
    const isPhase1 = sc.screenplay_phase && sc.screenplay_phase.includes("PHASE 1");

    // Update time indicator
    const linesCount = sc.lines?.length || 3;
    const maxMs = linesCount * 2800 + 1000;
    const timeDisplay = document.getElementById("anim_time_display");
    if (timeDisplay) {
      const curSec = (currentTimeMs / 1000).toFixed(1);
      const totalSec = (maxMs / 1000).toFixed(1);
      timeDisplay.textContent = `00:${curSec.padStart(4, "0")} / 00:${totalSec.padStart(4, "0")}`;
    }

    // Top Header Banner
    drawTopHeaderBanner(sc, isPhase1);

    // Render Line-by-Line Animation
    drawLineByLineScene(sc, isPhase1);
  }

  function drawTopHeaderBanner(sc, isPhase1) {
    ctx.save();
    // Act & Section Badge
    const actBadgeText = (activeData.act_name || "STATUTE").toUpperCase();
    const secBadgeText = (activeData.section_code || "PROVISION").toUpperCase();
    
    // Act Pill
    ctx.fillStyle = isPhase1 ? "#FFFBEB" : "#ECFDF5";
    ctx.strokeStyle = isPhase1 ? "#FDE68A" : "#A7F3D0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(50, 18, 330, 32, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = isPhase1 ? "#B45309" : "#047857";
    ctx.font = `bold ${Math.round(11 * fontScale)}px JetBrains Mono, monospace`;
    ctx.fillText(`🏛️ ${actBadgeText} · ${secBadgeText}`, 62, 39);

    // Slide Title
    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(16 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(sc.tab_title || sc.tag || "Scene Analysis", 400, 40);
    ctx.restore();
  }

  // ============================================================
  // LINE-BY-LINE DYNAMIC SCENE RENDERER (EVERY SENTENCE IS SHOWN)
  // ============================================================
  function drawLineByLineScene(sc, isPhase1) {
    let lines = sc.lines;
    // Fallback if legacy JSON without lines
    if (!lines || lines.length === 0) {
      const sentences = (sc.dialogue || "").split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
      lines = sentences.map((sent, i) => ({
        line_num: i + 1,
        sentence: sent + ".",
        line_title: sc.characters_or_elements?.[i] || sc.key_points?.[i] || `Fact / Rule ${i+1}`,
        line_detail: sc.key_points?.[i] || sent,
        shape_icon: getSmartIcon(sent),
        theme: i === 0 ? "indigo" : (i === 1 ? "sky" : (i === 2 ? "amber" : "emerald"))
      }));
    }

    const count = lines.length;
    const startY = sc.story_point_ref ? 115 : 95;
    const cardH = 225;
    const totalW = 880;
    const gap = 18;
    const cardW = Math.floor((totalW - (count - 1) * gap) / count);
    const startX = 60;
    const stepDurationMs = 2800;

    // If Phase 2, render Reference Banner
    if (sc.story_point_ref) {
      ctx.save();
      ctx.fillStyle = "#FFFBEB";
      ctx.strokeStyle = "#FDE68A";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(startX, 65, totalW, 34, 6);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#B45309";
      ctx.font = `800 ${Math.round(11.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(`🎯 ${sc.story_point_ref}`, startX + 16, 87);
      ctx.restore();
    }

    let activeLineSentence = "";
    let activeLineNum = 1;

    lines.forEach((line, idx) => {
      const stepStartMs = 300 + idx * stepDurationMs;
      const p = Math.min(1.0, Math.max(0, (currentTimeMs - stepStartMs) / 500));
      if (p <= 0) return;

      const isCurrentActive = (currentTimeMs >= stepStartMs && currentTimeMs < stepStartMs + stepDurationMs) || (idx === count - 1 && currentTimeMs >= stepStartMs);
      if (isCurrentActive) {
        activeLineSentence = line.sentence || "";
        activeLineNum = idx + 1;
      }

      const cardX = startX + idx * (cardW + gap);

      ctx.save();
      ctx.globalAlpha = p;

      // Card Background & Shadow
      ctx.fillStyle = "#FFFFFF";
      const th = line.theme || (idx === 0 ? "indigo" : (idx === 1 ? "sky" : (idx === 2 ? "amber" : "emerald")));
      
      if (isCurrentActive) {
        ctx.strokeStyle = th === "crimson" ? "#DC2626" : "#4F46E5";
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(79, 70, 229, 0.22)";
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 6;
      } else {
        ctx.strokeStyle = "#CBD5E1";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "rgba(15, 23, 42, 0.05)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;
      }

      ctx.beginPath();
      ctx.roundRect(cardX, startY, cardW, cardH, 12);
      ctx.fill(); ctx.stroke();
      ctx.shadowColor = "transparent";

      // Line Number Pill (Top-Left of Card)
      ctx.fillStyle = isCurrentActive ? "#4F46E5" : "#F1F5F9";
      ctx.beginPath();
      ctx.roundRect(cardX + 12, startY + 12, 60, 22, 4);
      ctx.fill();

      ctx.fillStyle = isCurrentActive ? "#FFFFFF" : "#64748B";
      ctx.font = `800 ${Math.round(10 * fontScale)}px JetBrains Mono, monospace`;
      ctx.textAlign = "center";
      ctx.fillText(`LINE ${idx + 1}`, cardX + 42, startY + 27);

      // Distinct Vector Badge Shape for this specific Line
      const shapeIcon = line.shape_icon || getSmartIcon(line.line_title + " " + line.line_detail);
      const iconCenterX = cardX + cardW / 2;
      const iconCenterY = startY + 54;
      if (window.drawColorfulBadgeShape) {
        window.drawColorfulBadgeShape(ctx, shapeIcon, iconCenterX, iconCenterY, 26, th, "circle");
      }

      // Line Title (Explaining what this line is about)
      ctx.fillStyle = isCurrentActive ? "#0F172A" : "#334155";
      ctx.font = `800 ${Math.round(13.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = "center";
      wrapCanvasText(ctx, line.line_title || `Line ${idx + 1}`, iconCenterX, startY + 110, cardW - 20, 18, "center", 2);

      // Line Detail (Statutory fact or condition)
      ctx.fillStyle = "#64748B";
      ctx.font = `600 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      wrapCanvasText(ctx, line.line_detail || line.sentence || "", iconCenterX, startY + 155, cardW - 22, 16, "center", 3);

      ctx.restore();

      // Connecting kinetic animated line between card[i] and card[i+1]
      if (idx < count - 1 && p > 0.8) {
        ctx.save();
        ctx.strokeStyle = "#C7D2FE";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        const arrowStartX = cardX + cardW;
        const arrowEndX = cardX + cardW + gap;
        ctx.moveTo(arrowStartX, startY + cardH / 2);
        ctx.lineTo(arrowEndX, startY + cardH / 2);
        ctx.stroke();
        ctx.restore();
      }
    });

    // Bottom Subtitle Box: Synchronized Current Spoken Line
    const bottomY = startY + cardH + 16;
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
    ctx.fillText(`▶ LINE ${activeLineNum} OF ${count} IN THIS SLIDE:`, startX + 18, bottomY + 26);

    ctx.fillStyle = "#0F172A";
    ctx.font = `600 ${Math.round(12.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, activeLineSentence || sc.dialogue || "", startX + 18, bottomY + 50, totalW - 36, 18, "left", 2);
    ctx.restore();

    // Update Narration Box below canvas
    const narrationEl = document.getElementById("anim_narration_text");
    if (narrationEl && sc.lines) {
      let html = "";
      sc.lines.forEach((l, i) => {
        const isCurrent = (i + 1) === activeLineNum;
        if (isCurrent) {
          html += `<span class="karaoke-active" style="display:inline-block; margin-right:6px; margin-bottom:4px; padding:3px 7px;"><strong>Line ${i+1}:</strong> ${l.sentence}</span> `;
        } else {
          html += `<span style="color:#64748B; margin-right:6px; margin-bottom:4px; display:inline-block;">Line ${i+1}: ${l.sentence}</span> `;
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
