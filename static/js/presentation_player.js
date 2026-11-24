// -*- coding: utf-8 -*-
// static/js/presentation_player.js
// 100% Dynamic, Semantically Relevant Line-by-Line Kinetic Animation Player
// Every single line has a UNIQUE PHYSICAL SHAPE ARCHETYPE matching its legal content!

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
    const maxMs = linesCount * 2800 + 1000;
    const timeDisplay = document.getElementById("anim_time_display");
    if (timeDisplay) {
      const curSec = (currentTimeMs / 1000).toFixed(1);
      const totalSec = (maxMs / 1000).toFixed(1);
      timeDisplay.textContent = `00:${curSec.padStart(4, "0")} / 00:${totalSec.padStart(4, "0")}`;
    }

    // Top Header Banner
    drawTopHeaderBanner(sc, isPhase1);

    // Render Line-by-Line with Distinct Visual Archetypes
    drawLineByLineScene(sc, isPhase1);
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
  // LINE-BY-LINE DYNAMIC RENDERER: DIVERSE PHYSICAL SHAPES
  // ============================================================
  function drawLineByLineScene(sc, isPhase1) {
    const lines = sc.lines || [];
    const count = Math.max(1, lines.length);
    const startY = sc.story_point_ref ? 110 : 90;
    const cardH = 235;
    const totalW = 880;
    const gap = 18;
    const cardW = Math.floor((totalW - (count - 1) * gap) / count);
    const startX = 60;
    const stepDurationMs = 2800;

    // Phase 2 Reference Banner
    if (sc.story_point_ref) {
      ctx.save();
      ctx.fillStyle = "#FFFBEB";
      ctx.strokeStyle = "#FDE68A";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(startX, 62, totalW, 34, 6);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#B45309";
      ctx.font = `800 ${Math.round(11.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(`🎯 ${sc.story_point_ref}`, startX + 16, 84);
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
      const archetype = line.visual_archetype || detectArchetypeFallback(line);

      // Render Distinct Physical Shape Archetype
      switch(archetype) {
        case "character_entity":
          drawCharacterEntityCard(line, cardX, startY, cardW, cardH, p, isCurrentActive, idx + 1);
          break;
        case "document_contract":
          drawDocumentContractCard(line, cardX, startY, cardW, cardH, p, isCurrentActive, idx + 1);
          break;
        case "breach_alert":
          drawBreachAlertCard(line, cardX, startY, cardW, cardH, p, isCurrentActive, idx + 1);
          break;
        case "financial_quantum":
          drawFinancialQuantumCard(line, cardX, startY, cardW, cardH, p, isCurrentActive, idx + 1);
          break;
        case "legal_verdict":
          drawLegalVerdictCard(line, cardX, startY, cardW, cardH, p, isCurrentActive, idx + 1);
          break;
        case "timeline_deadline":
          drawTimelineDeadlineCard(line, cardX, startY, cardW, cardH, p, isCurrentActive, idx + 1);
          break;
        default:
          drawCharacterEntityCard(line, cardX, startY, cardW, cardH, p, isCurrentActive, idx + 1);
      }

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

  function detectArchetypeFallback(line) {
    const s = ((line.line_title || "") + " " + (line.line_detail || "")).toLowerCase();
    if (s.includes("breach") || s.includes("fail") || s.includes("delay") || s.includes("loss") || s.includes("dispute") || s.includes("damage")) return "breach_alert";
    if (s.includes("contract") || s.includes("agreement") || s.includes("deed") || s.includes("terms") || s.includes("clause")) return "document_contract";
    if (s.includes("money") || s.includes("rupee") || s.includes("amount") || s.includes("price") || s.includes("compensation") || s.includes("consideration")) return "financial_quantum";
    if (s.includes("court") || s.includes("judge") || s.includes("verdict") || s.includes("precedent") || s.includes("rule") || s.includes("section")) return "legal_verdict";
    if (s.includes("date") || s.includes("time") || s.includes("month") || s.includes("deadline")) return "timeline_deadline";
    return "character_entity";
  }

  // ============================================================
  // SHAPE ARCHETYPE 1: CHARACTER / ENTITY PROFILE CARD
  // ============================================================
  function drawCharacterEntityCard(line, x, y, w, h, p, isCurrentActive, lineNum) {
    ctx.save();
    ctx.globalAlpha = p;

    // Elevated Profile Card with Top Header Band
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = isCurrentActive ? "#4F46E5" : "#CBD5E1";
    ctx.lineWidth = isCurrentActive ? 3 : 1.5;
    if (isCurrentActive) {
      ctx.shadowColor = "rgba(79, 70, 229, 0.25)";
      ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    }
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Top Header Banner
    ctx.fillStyle = isCurrentActive ? "#EEF2FF" : "#F8FAFC";
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, w - 4, 46, [12, 12, 0, 0]);
    ctx.fill();

    // Line Badge
    ctx.fillStyle = isCurrentActive ? "#4F46E5" : "#64748B";
    ctx.font = `800 ${Math.round(10 * fontScale)}px JetBrains Mono, monospace`;
    ctx.textAlign = "left";
    ctx.fillText(`👤 ENTITY · LINE ${lineNum}`, x + 14, y + 28);

    // Large Avatar Frame
    const iconKey = line.shape_icon || "user";
    if (window.drawColorfulBadgeShape) {
      window.drawColorfulBadgeShape(ctx, iconKey, x + w / 2, y + 68, 28, isCurrentActive ? "indigo" : "sky", "circle");
    }

    // Entity Title
    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(13.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "center";
    wrapCanvasText(ctx, line.line_title || "Entity Name", x + w / 2, y + 125, w - 18, 18, "center", 2);

    // Role / Entity Description
    ctx.fillStyle = "#475569";
    ctx.font = `600 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, line.line_detail || "", x + w / 2, y + 165, w - 20, 16, "center", 3);

    ctx.restore();
  }

  // ============================================================
  // SHAPE ARCHETYPE 2: DOCUMENT / CONTRACT PARCHMENT (FOLDED CORNER)
  // ============================================================
  function drawDocumentContractCard(line, x, y, w, h, p, isCurrentActive, lineNum) {
    ctx.save();
    ctx.globalAlpha = p;

    const fold = 24; // 45-degree folded corner size

    // Parchment Polygon Path with Top-Right Fold
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w - fold, y);
    ctx.lineTo(x + w, y + fold);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();

    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = isCurrentActive ? "#0284C7" : "#CBD5E1";
    ctx.lineWidth = isCurrentActive ? 3 : 1.5;
    if (isCurrentActive) {
      ctx.shadowColor = "rgba(2, 132, 199, 0.25)";
      ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    }
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Folded Triangle Geometry
    ctx.beginPath();
    ctx.moveTo(x + w - fold, y);
    ctx.lineTo(x + w - fold, y + fold);
    ctx.lineTo(x + w, y + fold);
    ctx.closePath();
    ctx.fillStyle = isCurrentActive ? "#BAE6FD" : "#E2E8F0";
    ctx.strokeStyle = isCurrentActive ? "#0284C7" : "#CBD5E1";
    ctx.lineWidth = 1.5;
    ctx.fill(); ctx.stroke();

    // Top Header
    ctx.fillStyle = isCurrentActive ? "#0284C7" : "#64748B";
    ctx.font = `800 ${Math.round(10 * fontScale)}px JetBrains Mono, monospace`;
    ctx.textAlign = "left";
    ctx.fillText(`📜 CONTRACT · LINE ${lineNum}`, x + 14, y + 26);

    // Contract Stamp/Seal Shape
    const iconKey = line.shape_icon || "contract";
    if (window.drawColorfulBadgeShape) {
      window.drawColorfulBadgeShape(ctx, iconKey, x + w / 2, y + 62, 26, "sky", "squircle");
    }

    // Title
    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${Math.round(13.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "center";
    wrapCanvasText(ctx, line.line_title || "Contract Clause", x + w / 2, y + 118, w - 20, 18, "center", 2);

    // Terms detail
    ctx.fillStyle = "#334155";
    ctx.font = `600 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, line.line_detail || "", x + w / 2, y + 160, w - 20, 16, "center", 3);

    // Simulated bottom signature line
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 20, y + h - 16);
    ctx.lineTo(x + w - 20, y + h - 16);
    ctx.stroke();

    ctx.restore();
  }

  // ============================================================
  // SHAPE ARCHETYPE 3: BREACH / DISPUTE ALERT CARD (WARNING ACCENT)
  // ============================================================
  function drawBreachAlertCard(line, x, y, w, h, p, isCurrentActive, lineNum) {
    ctx.save();
    ctx.globalAlpha = p;

    // Chamfered Octagonal Warning Card
    const chamfer = 12;
    ctx.beginPath();
    ctx.moveTo(x + chamfer, y);
    ctx.lineTo(x + w - chamfer, y);
    ctx.lineTo(x + w, y + chamfer);
    ctx.lineTo(x + w, y + h - chamfer);
    ctx.lineTo(x + w - chamfer, y + h);
    ctx.lineTo(x + chamfer, y + h);
    ctx.lineTo(x, y + h - chamfer);
    ctx.lineTo(x, y + chamfer);
    ctx.closePath();

    ctx.fillStyle = isCurrentActive ? "#FFF5F5" : "#FFFFFF";
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = isCurrentActive ? 3.5 : 2;
    if (isCurrentActive) {
      ctx.shadowColor = "rgba(220, 38, 38, 0.35)";
      ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
    }
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Hazard Stripes Top Accent Bar
    ctx.save();
    ctx.clip();
    ctx.fillStyle = "#DC2626";
    ctx.fillRect(x, y, w, 32);
    ctx.fillStyle = "#FEE2E2";
    for (let hx = x - 20; hx < x + w + 20; hx += 16) {
      ctx.beginPath();
      ctx.moveTo(hx, y);
      ctx.lineTo(hx + 8, y);
      ctx.lineTo(hx + 18, y + 32);
      ctx.lineTo(hx + 10, y + 32);
      ctx.fill();
    }
    ctx.restore();

    // Header Label on Hazard Bar
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 ${Math.round(10.5 * fontScale)}px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`⚠️ BREACH / DISPUTE · LINE ${lineNum}`, x + w / 2, y + 21);

    // Alert Triangle / Flame Icon Shape
    const iconKey = line.shape_icon || "alert-triangle";
    if (window.drawColorfulBadgeShape) {
      window.drawColorfulBadgeShape(ctx, iconKey, x + w / 2, y + 68, 27, "crimson", "circle");
    }

    // Breach Title
    ctx.fillStyle = "#991B1B";
    ctx.font = `800 ${Math.round(13.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "center";
    wrapCanvasText(ctx, line.line_title || "Breach of Contract", x + w / 2, y + 125, w - 18, 18, "center", 2);

    // Loss Description
    ctx.fillStyle = "#450A0A";
    ctx.font = `600 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, line.line_detail || "", x + w / 2, y + 165, w - 20, 16, "center", 3);

    ctx.restore();
  }

  // ============================================================
  // SHAPE ARCHETYPE 4: FINANCIAL QUANTUM / CONSIDERATION LEDGER
  // ============================================================
  function drawFinancialQuantumCard(line, x, y, w, h, p, isCurrentActive, lineNum) {
    ctx.save();
    ctx.globalAlpha = p;

    // Financial Ledger with Double Border
    ctx.fillStyle = isCurrentActive ? "#F0FDF4" : "#FFFFFF";
    ctx.strokeStyle = "#059669";
    ctx.lineWidth = isCurrentActive ? 3 : 1.5;
    if (isCurrentActive) {
      ctx.shadowColor = "rgba(5, 150, 105, 0.25)";
      ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    }
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Inner Ledger Border
    ctx.strokeStyle = "#A7F3D0";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);

    // Top Currency Header
    ctx.fillStyle = "#059669";
    ctx.font = `800 ${Math.round(10 * fontScale)}px JetBrains Mono, monospace`;
    ctx.textAlign = "left";
    ctx.fillText(`💰 QUANTUM / PRICE · LINE ${lineNum}`, x + 14, y + 26);

    // Coins / Cash Shape
    const iconKey = line.shape_icon || "coins";
    if (window.drawColorfulBadgeShape) {
      window.drawColorfulBadgeShape(ctx, iconKey, x + w / 2, y + 60, 26, "emerald", "circle");
    }

    // Title
    ctx.fillStyle = "#065F46";
    ctx.font = `800 ${Math.round(13.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "center";
    wrapCanvasText(ctx, line.line_title || "Financial Consideration", x + w / 2, y + 115, w - 18, 18, "center", 2);

    // Amount / Measure Detail
    ctx.fillStyle = "#047857";
    ctx.font = `700 ${Math.round(11.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, line.line_detail || "", x + w / 2, y + 155, w - 20, 16, "center", 3);

    ctx.restore();
  }

  // ============================================================
  // SHAPE ARCHETYPE 5: LEGAL VERDICT / JUDICIAL DECREE
  // ============================================================
  function drawLegalVerdictCard(line, x, y, w, h, p, isCurrentActive, lineNum) {
    ctx.save();
    ctx.globalAlpha = p;

    // Judicial Pedestal Card
    ctx.fillStyle = isCurrentActive ? "#FAF5FF" : "#FFFFFF";
    ctx.strokeStyle = isCurrentActive ? "#7E22CE" : "#CBD5E1";
    ctx.lineWidth = isCurrentActive ? 3 : 1.5;
    if (isCurrentActive) {
      ctx.shadowColor = "rgba(126, 34, 206, 0.25)";
      ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    }
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Top Purple Ribbon
    ctx.fillStyle = "#7E22CE";
    ctx.beginPath();
    ctx.roundRect(x + 12, y + 10, w - 24, 24, 4);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 ${Math.round(10 * fontScale)}px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`⚖️ JUDICIAL RULE · LINE ${lineNum}`, x + w / 2, y + 26);

    // Gavel / Scale Shape
    const iconKey = line.shape_icon || "gavel";
    if (window.drawColorfulBadgeShape) {
      window.drawColorfulBadgeShape(ctx, iconKey, x + w / 2, y + 64, 26, "purple", "squircle");
    }

    // Legal Ratio Title
    ctx.fillStyle = "#581C87";
    ctx.font = `800 ${Math.round(13.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "center";
    wrapCanvasText(ctx, line.line_title || "Statutory Principle", x + w / 2, y + 120, w - 18, 18, "center", 2);

    // Rule Ratio Description
    ctx.fillStyle = "#3B0764";
    ctx.font = `600 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, line.line_detail || "", x + w / 2, y + 160, w - 20, 16, "center", 3);

    ctx.restore();
  }

  // ============================================================
  // SHAPE ARCHETYPE 6: TIMELINE / DEADLINE CALENDAR BINDER
  // ============================================================
  function drawTimelineDeadlineCard(line, x, y, w, h, p, isCurrentActive, lineNum) {
    ctx.save();
    ctx.globalAlpha = p;

    // Calendar Card Body
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = isCurrentActive ? "#D97706" : "#CBD5E1";
    ctx.lineWidth = isCurrentActive ? 3 : 1.5;
    if (isCurrentActive) {
      ctx.shadowColor = "rgba(217, 119, 6, 0.25)";
      ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    }
    ctx.beginPath();
    ctx.roundRect(x, y + 8, w, h - 8, 12);
    ctx.fill(); ctx.stroke();
    ctx.shadowColor = "transparent";

    // Calendar Spiral Binder Rings (at top)
    const ringSpacing = w / 4;
    ctx.fillStyle = "#64748B";
    for (let r = 1; r <= 3; r++) {
      ctx.beginPath();
      ctx.roundRect(x + r * ringSpacing - 4, y, 8, 16, 4);
      ctx.fill();
    }

    // Top Amber Bar
    ctx.fillStyle = "#FEF3C7";
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 16, w - 4, 30, [8, 8, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#B45309";
    ctx.font = `800 ${Math.round(10 * fontScale)}px JetBrains Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`⏱️ DEADLINE · LINE ${lineNum}`, x + w / 2, y + 36);

    // Clock/Calendar Icon Shape
    const iconKey = line.shape_icon || "clock";
    if (window.drawColorfulBadgeShape) {
      window.drawColorfulBadgeShape(ctx, iconKey, x + w / 2, y + 74, 26, "amber", "circle");
    }

    // Deadline Title
    ctx.fillStyle = "#92400E";
    ctx.font = `800 ${Math.round(13.5 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    ctx.textAlign = "center";
    wrapCanvasText(ctx, line.line_title || "Statutory Window", x + w / 2, y + 130, w - 18, 18, "center", 2);

    // Detail
    ctx.fillStyle = "#451A03";
    ctx.font = `600 ${Math.round(11 * fontScale)}px Plus Jakarta Sans, sans-serif`;
    wrapCanvasText(ctx, line.line_detail || "", x + w / 2, y + 170, w - 20, 16, "center", 3);

    ctx.restore();
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
