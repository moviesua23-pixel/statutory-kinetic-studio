// -*- coding: utf-8 -*-
// static/js/studio.js
// Studio UI Controller, Presets, and Multi-Step Generation Workflow Tracker

let PRESET_DATA = {};

async function loadPresetsCatalog() {
  try {
    const res = await fetch("/static/data/preset_provisions.json");
    if (res.ok) {
      PRESET_DATA = await res.json();
    }
  } catch (e) {
    console.warn("Could not load presets catalog:", e);
  }
}

function selectPreset(key) {
  const p = PRESET_DATA[key];
  if (!p) return;
  document.getElementById("provision_input").value = p.text;
  document.getElementById("topic_input").value = p.title;
}

function updateStepper(stepIndex) {
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`step_${i}`);
    if (!el) continue;
    if (i < stepIndex) {
      el.className = "step-item completed";
      el.querySelector(".step-icon").textContent = "✓";
    } else if (i === stepIndex) {
      el.className = "step-item active";
      el.querySelector(".step-icon").textContent = "⏳";
    } else {
      el.className = "step-item";
      el.querySelector(".step-icon").textContent = "○";
    }
  }
}

async function triggerPresentationGeneration() {
  const provisionText = document.getElementById("provision_input").value.trim();
  const topicTitle = document.getElementById("topic_input").value.trim();
  const voiceName = document.getElementById("voice_select").value;

  if (!provisionText) {
    alert("Please paste a statutory provision or choose a preset!");
    return;
  }

  const btn = document.getElementById("btn_generate");
  btn.disabled = true;
  btn.innerHTML = `<span>⏳</span> Generating 2-Phase Presentation...`;

  try {
    // Step 1: Start Screenplay Story Choreography
    updateStepper(1);
    
    // Simulate step advances for user feedback
    const stepTimer2 = setTimeout(() => updateStepper(2), 3500);
    const stepTimer3 = setTimeout(() => updateStepper(3), 8500);
    const stepTimer4 = setTimeout(() => updateStepper(4), 13500);

    const resp = await fetch("/api/generate_presentation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provision_text: provisionText,
        topic: topicTitle,
        voice: voiceName
      })
    });

    clearTimeout(stepTimer2);
    clearTimeout(stepTimer3);
    clearTimeout(stepTimer4);

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned error ${resp.status}`);
    }

    const presentationData = await resp.json();

    // Step 5: Completed
    updateStepper(5);
    const step5 = document.getElementById("step_5");
    if (step5) {
      step5.className = "step-item completed";
      step5.querySelector(".step-icon").textContent = "✓";
    }

    // Load into Presentation Player
    window.PRESENTATION_PLAYER.loadPresentation(presentationData);

    // Smooth scroll to Presentation Output Section
    const outSection = document.getElementById("output_section");
    if (outSection) {
      outSection.scrollIntoView({ behavior: "smooth" });
    }

  } catch (err) {
    alert("Generation failed: " + err.message);
    updateStepper(1);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>⚡</span> Generate 2-Phase Presentation`;
  }
}

function downloadPresentationJSON() {
  const data = window.ACTIVE_PRESENTATION_DATA;
  if (!data) return alert("Please generate a presentation first!");
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kinetic_presentation_${Date.now()}.json`;
  a.click();
}

// Initial setup
window.addEventListener("DOMContentLoaded", async () => {
  await loadPresetsCatalog();
  // Load default preset into fields
  selectPreset("50c_sdv");
});
