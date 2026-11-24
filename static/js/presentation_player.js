// -*- coding: utf-8 -*-
// static/js/presentation_player.js
// 100% Dynamic, Provision-Agnostic Kinetic Animation Player for Any Statute

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
      btn.innerHTML = `${prefix} Scene ${idx + 1}: ${sc.tab_title || `Scene ${idx+1}`}`;
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
    if (tagLabel) tagLabel.textContent = (sc.tag || `SCENE ${idx+1}`).toUpperCase();

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

    const slider = document.getElementById("anim_timeline_slider");
    if (slider) {
      slider.max = sc.duration_ms || 10000;
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
  // SMART DYNAMIC ICON MATCHER (UNIVERSAL)
  // ==========================================
  function getSmartIcon(text) {
    if (!text) return "file-text";
    const s = text.toLowerCase();
    if (s.includes("user") || s.includes("person") || s.includes("buyer") || s.includes("seller") || s.includes("party") || s.includes("director") || s.includes("promoter") || s.includes("architect") || s.includes("doctor")) return "user";
    if (s.includes("company") || s.includes("corporate") || s.includes("firm") || s.includes("hospital") || s.includes("factory") || s.includes("enterprise") || s.includes("business")) return "building-2";
    if (s.includes("contract") || s.includes("agreement") || s.includes("deed") || s.includes("clause") || s.includes("terms") || s.includes("policy")) return "file-text";
    if (s.includes("money") || s.includes("price") || s.includes("consideration") || s.includes("amount") || s.includes("payment") || s.includes("profit") || s.includes("fee") || s.includes("crore") || s.includes("lakh")) return "coins";
    if (s.includes("loss") || s.includes("breach") || s.includes("damage") || s.includes("remote") || s.includes("default") || s.includes("dispute") || s.includes("injury")) return "alert-triangle";
    if (s.includes("court") || s.includes("judge") || s.includes("law") || s.includes("section") || s.includes("order") || s.includes("precedent") || s.includes("verdict") || s.includes("judgement")) return "gavel";
    if (s.includes("shield") || s.includes("safe") || s.includes("exemption") || s.includes("remedy") || s.includes("defence") || s.includes("exception")) return "shield-check";
    if (s.includes("time") || s.includes("date") || s.includes("month") || s.includes("year") || s.includes("deadline") || s.includes("delay")) return "clock";
    if (s.includes("goods") || s.includes("delivery") || s.includes("shipment") || s.includes("transport") || s.includes("fleet")) return "truck";
    if (s.includes("land") || s.includes("property") || s.includes("house") || s.includes("building") || s.includes("flat")) return "residential_house";
    if (s.includes("check") || s.includes("valid") || s.includes("condition") || s.includes("approved")) return "badge-check";
    return "scale";
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
      const maxMs = sc?.duration_ms || 10000;
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
    const timeDisplay = document.getElementById("anim_time_display");
    if (timeDisplay) {
      const curSec = (currentTimeMs / 1000).toFixed(1);
      const totalSec = ((sc.duration_ms || 10000) / 1000).toFixed(1);
      timeDisplay.textContent = `00:${curSec.padStart(4, "0")} / 00:${totalSec.padStart(4, "0")}`;
    }

    // Top Header Banner
    drawTopHeaderBanner(sc, isPhase1);

    // Render Dynamic Content
    if (isPhase1) {
      if (currentSceneIdx === 0) {
        drawPhase1Scene1(sc);
      } else {
        drawPhase1Scene2(sc);
      }
    } else {
      drawPhase2StatutoryBreakdown(sc);
    }
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
    ctx.roundRect(50, 20, 320, 32, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = isPhase1 ? "#B45309" : "#047857";
    ctx.font = `bold ${Math.round(11 * fontScale)}px JetBrains Mono, monospace`;
    ctx.fillText(`🏛️ ${actBadgeText} · ${secBadgeText}`, 62, 41);

    // Scene Title
    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(16 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(sc.tab_title || sc.tag || "Scene Analysis", 390, 42);
    ctx.restore();
  }

  // ==========================================
  // PHASE 1 SCENE 1: CHARACTERS & INITIAL DEAL
  // ==========================================
  function drawPhase1Scene1(sc) {
    const chars = sc.characters_or_elements || ["Party A", "Party B", "Agreement"];
    const char1 = chars[0] || "Party A";
    const char2 = chars[1] || "Party B";
    const deal = chars[2] || "Agreement / Transaction";

    const pts = sc.key_points || ["Initial background", "Agreed contractual terms"];

    // Card 1: Left Party
    const p1 = Math.min(1.0, Math.max(0, (currentTimeMs - 300) / 600));
    if (p1 > 0) {
      ctx.save();
      ctx.globalAlpha = p1;
      const x1 = 80; const y1 = 90; const w1 = 340; const h1 = 230;

      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(15,23,42,0.08)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
      ctx.beginPath(); ctx.roundRect(x1, y1, w1, h1, 12); ctx.fill(); ctx.stroke();
      ctx.shadowColor = "transparent";

      // Icon Badge
      const icon1 = getSmartIcon(char1);
      if (window.drawColorfulBadgeShape) {
        window.drawColorfulBadgeShape(ctx, icon1, x1 + w1/2, y1 + 52, 28, "indigo", "circle");
      }

      ctx.fillStyle = "#0F172A";
      ctx.font = `800 ${Math.round(15 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(char1, x1 + w1/2, y1 + 115);

      ctx.fillStyle = "#475569";
      ctx.font = `600 ${Math.round(12 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.fillText(pts[0] || "Initial Contracting Party", x1 + w1/2, y1 + 145);

      ctx.restore();
    }

    // Card 2: Right Party
    const p2 = Math.min(1.0, Math.max(0, (currentTimeMs - 1200) / 600));
    if (p2 > 0) {
      ctx.save();
      ctx.globalAlpha = p2;
      const x2 = 580; const y2 = 90; const w2 = 340; const h2 = 230;

      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(15,23,42,0.08)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
      ctx.beginPath(); ctx.roundRect(x2, y2, w2, h2, 12); ctx.fill(); ctx.stroke();
      ctx.shadowColor = "transparent";

      const icon2 = getSmartIcon(char2);
      if (window.drawColorfulBadgeShape) {
        window.drawColorfulBadgeShape(ctx, icon2, x2 + w2/2, y2 + 52, 28, "sky", "circle");
      }

      ctx.fillStyle = "#0F172A";
      ctx.font = `800 ${Math.round(15 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(char2, x2 + w2/2, y2 + 115);

      ctx.fillStyle = "#475569";
      ctx.font = `600 ${Math.round(12 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.fillText(pts[1] || "Counterparty in Transaction", x2 + w2/2, y2 + 145);

      ctx.restore();
    }

    // Connecting Arrow / Pipe
    const pPipe = Math.min(1.0, Math.max(0, (currentTimeMs - 2200) / 700));
    if (pPipe > 0) {
      ctx.save();
      ctx.strokeStyle = "#4F46E5";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 5]);

      const startX = 420;
      const targetX = 580;
      const curX = startX + (targetX - startX) * pPipe;

      ctx.beginPath();
      ctx.moveTo(startX, 205);
      ctx.lineTo(curX, 205);
      ctx.stroke();

      if (pPipe > 0.4) {
        ctx.fillStyle = "#4F46E5";
        ctx.font = `800 ${Math.round(11 * fontScale)}px JetBrains Mono, monospace`;
        ctx.textAlign = "center";
        ctx.fillText(deal.toUpperCase(), 500, 190);
      }
      ctx.restore();
    }

    // Bottom Story Note Box
    const pNote = Math.min(1.0, Math.max(0, (currentTimeMs - 3400) / 500));
    if (pNote > 0) {
      drawBottomStoryNote(pNote, sc.tag || "THE FACTUAL GENESIS", sc.dialogue);
    }
  }

  // ==========================================
  // PHASE 1 SCENE 2: THE TURNING POINT / BREACH
  // ==========================================
  function drawPhase1Scene2(sc) {
    const chars = sc.characters_or_elements || ["Obligation", "Breach Event", "Resulting Loss"];
    const pts = sc.key_points || ["Contractual expectations", "The turning event", "Dispute arises"];

    // 3 Cards: Left Obligation -> Center Breach Event -> Right Resulting Loss
    const items = [
      { label: chars[0] || "1. Original Terms", text: pts[0] || "Agreed conditions", theme: "sky", startMs: 300, x: 70 },
      { label: chars[1] || "2. The Event / Breach", text: pts[1] || "Triggering dispute", theme: "crimson", startMs: 1600, x: 375 },
      { label: chars[2] || "3. Resulting Damage", text: pts[2] || "Legal consequence", theme: "amber", startMs: 3000, x: 680 }
    ];

    items.forEach(it => {
      const p = Math.min(1.0, Math.max(0, (currentTimeMs - it.startMs) / 600));
      if (p > 0) {
        ctx.save();
        ctx.globalAlpha = p;
        const w = 250; const h = 230; const y = 95;

        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = it.theme === "crimson" ? "#FECACA" : "#CBD5E1";
        ctx.lineWidth = it.theme === "crimson" ? 2.5 : 1.5;
        ctx.shadowColor = "rgba(15,23,42,0.08)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
        ctx.beginPath(); ctx.roundRect(it.x, y, w, h, 12); ctx.fill(); ctx.stroke();
        ctx.shadowColor = "transparent";

        const icon = getSmartIcon(it.label);
        if (window.drawColorfulBadgeShape) {
          window.drawColorfulBadgeShape(ctx, icon, it.x + w/2, y + 52, 28, it.theme, "circle");
        }

        ctx.fillStyle = it.theme === "crimson" ? "#991B1B" : "#0F172A";
        ctx.font = `800 ${Math.round(14 * fontScale)}px Plus Jakarta Sans, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(it.label, it.x + w/2, y + 115);

        ctx.fillStyle = "#475569";
        ctx.font = `600 ${Math.round(11.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
        wrapCanvasText(ctx, it.text, it.x + w/2, y + 145, w - 24, 18);

        ctx.restore();
      }
    });

    const pNote = Math.min(1.0, Math.max(0, (currentTimeMs - 4200) / 500));
    if (pNote > 0) {
      drawBottomStoryNote(pNote, sc.tag || "TURNING POINT & STATUTORY DISPUTE", sc.dialogue);
    }
  }

  // ==========================================
  // PHASE 2: STATUTORY DECONSTRUCTION
  // ==========================================
  function drawPhase2StatutoryBreakdown(sc) {
    // Reference Banner: Story Point Ref
    if (sc.story_point_ref) {
      ctx.save();
      ctx.fillStyle = "#FFFBEB";
      ctx.strokeStyle = "#FDE68A";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(70, 75, 860, 36, 6);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#B45309";
      ctx.font = `800 ${Math.round(12 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(`🎯 ${sc.story_point_ref}`, 85, 98);
      ctx.restore();
    }

    const pts = sc.key_points || ["Statutory condition 1", "Statutory condition 2"];
    const count = Math.min(3, Math.max(2, pts.length));
    const gap = 20;
    const totalW = 860;
    const cardW = Math.floor((totalW - (count - 1) * gap) / count);
    const startY = 125;
    const cardH = 210;

    pts.slice(0, count).forEach((pt, idx) => {
      const stepStartMs = 400 + idx * 1200;
      const p = Math.min(1.0, Math.max(0, (currentTimeMs - stepStartMs) / 500));
      if (p <= 0) return;

      const cardX = 70 + idx * (cardW + gap);

      ctx.save();
      ctx.globalAlpha = p;

      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = idx === 0 ? "#A7F3D0" : "#CBD5E1";
      ctx.lineWidth = idx === 0 ? 2.5 : 1.5;
      ctx.shadowColor = "rgba(15,23,42,0.06)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
      ctx.beginPath(); ctx.roundRect(cardX, startY, cardW, cardH, 10); ctx.fill(); ctx.stroke();
      ctx.shadowColor = "transparent";

      const icon = getSmartIcon(pt);
      const theme = idx === 0 ? "emerald" : (idx === 1 ? "indigo" : "amber");
      if (window.drawColorfulBadgeShape) {
        window.drawColorfulBadgeShape(ctx, icon, cardX + cardW/2, startY + 48, 26, theme, "circle");
      }

      ctx.fillStyle = "#0F172A";
      ctx.font = `800 ${Math.round(13.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`RULE ${idx + 1}`, cardX + cardW/2, startY + 105);

      ctx.fillStyle = "#334155";
      ctx.font = `600 ${Math.round(12 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      wrapCanvasText(ctx, pt, cardX + cardW/2, startY + 135, cardW - 20, 18);

      ctx.restore();
    });

    // Bottom Statutory Takeaway Bar
    const pTakeaway = Math.min(1.0, Math.max(0, (currentTimeMs - 3800) / 500));
    if (pTakeaway > 0) {
      ctx.save();
      ctx.globalAlpha = pTakeaway;
      const y = 355;
      ctx.fillStyle = "#ECFDF5";
      ctx.strokeStyle = "#059669";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(70, y, 860, 80, 8);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#047857";
      ctx.font = `800 ${Math.round(12.5 * fontScale)}px JetBrains Mono, monospace`;
      ctx.textAlign = "left";
      ctx.fillText("⚖️ STATUTORY APPLICATION & LEGAL REMEDY:", 90, y + 28);

      ctx.fillStyle = "#0F172A";
      ctx.font = `600 ${Math.round(12 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      const charTags = (sc.characters_or_elements || []).join("  •  ");
      ctx.fillText(charTags || (sc.key_points ? sc.key_points[0] : ""), 90, y + 54);
      ctx.restore();
    }
  }

  function drawBottomStoryNote(progress, title, dialogue) {
    ctx.save();
    ctx.globalAlpha = progress;
    const x = 70; const y = 345; const w = 860; const h = 95;

    ctx.fillStyle = "#F8FAFC";
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(13 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(title, x + 18, y + 28);

    ctx.fillStyle = "#475569";
    ctx.font = `600 ${Math.round(12 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    const snippet = dialogue ? dialogue.split(".")[0] + "." : "";
    wrapCanvasText(ctx, snippet, x + 18, y + 54, w - 36, 18, "left");

    ctx.restore();
  }

  function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, align = "center") {
    if (!text) return;
    const words = text.split(" ");
    let line = "";
    let curY = y;
    ctx.textAlign = align;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, curY);
        line = words[n] + " ";
        curY += lineHeight;
        if (curY > y + lineHeight * 3) break; // cap to 4 lines
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, curY);
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
