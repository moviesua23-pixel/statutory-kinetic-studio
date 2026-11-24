// -*- coding: utf-8 -*-
// static/js/studio.js
// Universal Line-by-Line 2-Phase Pedagogical Story Generator & Kinetic Animation Preview Controller

let LATEST_STORY_DATA = null;

async function generateTwoPhaseStory() {
  const provisionText = document.getElementById("provision_input").value.trim();
  const topicHint = document.getElementById("topic_input").value.trim();

  if (!provisionText) {
    alert("Please paste a statutory provision or legal rule text first!");
    return;
  }

  const btn = document.getElementById("btn_generate");
  const spinner = document.getElementById("loading_spinner");
  const outputSection = document.getElementById("output_section");
  const animSection = document.getElementById("animation_section");

  btn.disabled = true;
  spinner.style.display = "flex";
  if (animSection) animSection.style.display = "none";

  try {
    const resp = await fetch("/api/generate_story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provision_text: provisionText,
        topic: topicHint
      })
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `Server returned error ${resp.status}`);
    }

    const data = await resp.json();
    LATEST_STORY_DATA = data;
    renderStoryReview(data);

    outputSection.style.display = "flex";
    outputSection.scrollIntoView({ behavior: "smooth" });

  } catch (err) {
    alert("Story Generation Error: " + err.message);
  } finally {
    btn.disabled = false;
    spinner.style.display = "none";
  }
}

function renderStoryReview(data) {
  // Meta Headers
  document.getElementById("detected_act_badge").textContent = `🏛️ ACT: ${data.act_name || "Statutory Law"}`;
  document.getElementById("detected_section_badge").textContent = `📜 ${data.section_code || "Section"}`;
  document.getElementById("core_doctrine_title").textContent = data.core_doctrine || "Core Legal Doctrine";
  document.getElementById("story_summary_text").textContent = `Factual Story Arc: ${data.story_summary || ""}`;

  // Scenes
  const container = document.getElementById("scenes_container");
  container.innerHTML = "";

  const scenes = data.scenes || [];
  scenes.forEach((sc, idx) => {
    const isPhase1 = sc.screenplay_phase && sc.screenplay_phase.includes("PHASE 1");
    const card = document.createElement("div");
    card.style.cssText = `
      background: #FFFFFF;
      border: 1.5px solid ${isPhase1 ? '#FDE68A' : '#A7F3D0'};
      border-left: 5px solid ${isPhase1 ? '#D97706' : '#059669'};
      border-radius: 10px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 1px 4px rgba(15,23,42,0.06);
    `;

    // Top Row: Phase Badge + Scene Title
    const headerRow = document.createElement("div");
    headerRow.style.cssText = "display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;";
    headerRow.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="badge-mono" style="background:${isPhase1 ? '#D97706' : '#059669'}; color:#FFF; font-size:11px; padding:3px 9px;">
          ${isPhase1 ? '📖 PHASE 1: STORY EXPOSITION' : '⚖️ PHASE 2: STATUTORY BREAKDOWN'}
        </span>
        <span style="font-size:14px; font-weight:800; color:#0F172A;">
          Slide ${idx + 1}: ${sc.tab_title || sc.tag || `Slide ${idx+1}`}
        </span>
      </div>
      <span style="font-size:11px; font-weight:700; color:#64748B; background:#F1F5F9; padding:2px 8px; border-radius:4px;">
        ${sc.lines ? `${sc.lines.length} Lines / Beats` : ''}
      </span>
    `;
    card.appendChild(headerRow);

    // Story point reference if in Phase 2
    if (sc.story_point_ref) {
      const refBox = document.createElement("div");
      refBox.style.cssText = "font-size:12px; font-weight:800; color:#B45309; background:#FFFBEB; border:1px solid #FDE68A; padding:6px 12px; border-radius:6px;";
      refBox.textContent = `🎯 ${sc.story_point_ref}`;
      card.appendChild(refBox);
    }

    // Line-by-Line Visual Animation Beats (Every single line has its own distinct shape & text)
    if (sc.lines && sc.lines.length > 0) {
      const linesBox = document.createElement("div");
      linesBox.style.cssText = "display: flex; flex-direction: column; gap: 8px;";
      
      const label = document.createElement("div");
      label.style.cssText = "font-size: 11.5px; font-weight: 800; color: #4F46E5; text-transform: uppercase; letter-spacing: 0.4px;";
      label.textContent = "✨ Line-by-Line Visual Beats (Sentence → Distinct Shape & Text):";
      linesBox.appendChild(label);

      sc.lines.forEach((l, lIdx) => {
        const lineRow = document.createElement("div");
        const thColor = l.theme === 'crimson' ? '#DC2626' : (l.theme === 'emerald' ? '#059669' : (l.theme === 'amber' ? '#D97706' : '#4F46E5'));
        lineRow.style.cssText = `
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-left: 3.5px solid ${thColor};
          border-radius: 6px;
          padding: 8px 12px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        `;
        lineRow.innerHTML = `
          <span style="background:#EEF2FF; color:#4F46E5; font-family:JetBrains Mono, monospace; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px; white-space:nowrap;">
            LINE ${lIdx + 1}
          </span>
          <div style="flex:1;">
            <div style="font-size:12.5px; font-weight:800; color:#0F172A; display:flex; align-items:center; flex-wrap:wrap; gap:6px;">
              <span>🏷️ <strong>${l.line_title || `Line ${lIdx+1}`}</strong></span>
              <span style="font-size:10px; font-weight:800; color:#4338CA; background:#EEF2FF; border:1px solid #C7D2FE; padding:1px 6px; border-radius:4px;">Archetype: ${l.visual_archetype || 'custom'}</span>
              <span style="font-size:10.5px; font-weight:700; color:#64748B; background:#FFF; border:1px solid #CBD5E1; padding:1px 6px; border-radius:4px;">Icon: ${l.shape_icon || 'badge'}</span>
            </div>
            <div style="font-size:12px; font-weight:600; color:#475569; margin-top:2px;">
              ${l.line_detail || ''}
            </div>
            <div style="font-size:11.5px; font-weight:600; color:#64748B; font-style:italic; margin-top:3px;">
              "${l.sentence}"
            </div>
          </div>
        `;
        linesBox.appendChild(lineRow);
      });
      card.appendChild(linesBox);
    }

    // Teacher Narration Dialogue
    if (sc.dialogue) {
      const diaBox = document.createElement("div");
      diaBox.style.cssText = "background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:10px 14px; font-size:12.5px; line-height:1.5; color:#334155; font-weight:600;";
      diaBox.innerHTML = `
        <div style="font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase; margin-bottom:2px;">
          🎙️ Full Teacher Narrative:
        </div>
        ${sc.dialogue}
      `;
      card.appendChild(diaBox);
    }

    container.appendChild(card);
  });
}

function startStoryAnimation() {
  if (!LATEST_STORY_DATA) {
    alert("Please generate a 2-phase story first!");
    return;
  }
  const animSection = document.getElementById("animation_section");
  animSection.style.display = "flex";

  if (window.PRESENTATION_PLAYER) {
    window.PRESENTATION_PLAYER.init();
    window.PRESENTATION_PLAYER.loadPresentation(LATEST_STORY_DATA);
  }

  animSection.scrollIntoView({ behavior: "smooth" });
}

function copyStoryJSON() {
  if (!LATEST_STORY_DATA) return alert("Please generate a story first!");
  navigator.clipboard.writeText(JSON.stringify(LATEST_STORY_DATA, null, 2))
    .then(() => alert("Story Screenplay JSON copied to clipboard!"))
    .catch(err => alert("Copy failed: " + err));
}
