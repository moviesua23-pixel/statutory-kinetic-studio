// -*- coding: utf-8 -*-
// static/js/studio.js
// Step 1: Universal 2-Phase Pedagogical Story Generator & Review Console

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

  btn.disabled = true;
  spinner.style.display = "flex";

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
      gap: 10px;
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
          Scene ${idx + 1}: ${sc.tab_title || sc.tag || `Scene ${idx+1}`}
        </span>
      </div>
      <span style="font-size:11px; font-weight:700; color:#64748B; background:#F1F5F9; padding:2px 8px; border-radius:4px;">
        ${sc.tag || ''}
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

    // Teacher Narration Dialogue
    if (sc.dialogue) {
      const diaBox = document.createElement("div");
      diaBox.style.cssText = "background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:12px 14px; font-size:13.5px; line-height:1.6; color:#0F172A; font-weight:600;";
      diaBox.innerHTML = `
        <div style="font-size:11px; font-weight:800; color:#4F46E5; text-transform:uppercase; margin-bottom:4px;">
          🎙️ Teacher Script (Malayalam Explanation + English Legal Terms):
        </div>
        ${sc.dialogue}
      `;
      card.appendChild(diaBox);
    }

    // Key Takeaway Points
    if (sc.key_points && sc.key_points.length > 0) {
      const ptsList = document.createElement("ul");
      ptsList.style.cssText = "margin-left: 20px; font-size: 12.5px; color: #334155; font-weight: 600; line-height: 1.5;";
      sc.key_points.forEach(pt => {
        const li = document.createElement("li");
        li.textContent = pt;
        ptsList.appendChild(li);
      });
      card.appendChild(ptsList);
    }

    // Characters / Elements Chips
    if (sc.characters_or_elements && sc.characters_or_elements.length > 0) {
      const chipRow = document.createElement("div");
      chipRow.style.cssText = "display: flex; gap: 6px; flex-wrap: wrap; margin-top: 2px;";
      sc.characters_or_elements.forEach(c => {
        const chip = document.createElement("span");
        chip.style.cssText = "font-size:11px; font-weight:700; color:#475569; background:#F1F5F9; border:1px solid #E2E8F0; padding:2px 8px; border-radius:4px;";
        chip.textContent = `🏷️ ${c}`;
        chipRow.appendChild(chip);
      });
      card.appendChild(chipRow);
    }

    container.appendChild(card);
  });
}

function copyStoryJSON() {
  if (!LATEST_STORY_DATA) return alert("Please generate a story first!");
  navigator.clipboard.writeText(JSON.stringify(LATEST_STORY_DATA, null, 2))
    .then(() => alert("Story Screenplay JSON copied to clipboard!"))
    .catch(err => alert("Copy failed: " + err));
}
