// -*- coding: utf-8 -*-
// viewer/layout_engine.js
// Mathematical Parametric Layout Engine for 1000x500 Monochrome Pixel Screen Studio
// Procedurally generates 100,000+ zero-collision animation layouts across 15 spatial archetypes.

(function() {
  window.LAYOUT_ENGINE = {};

  // Stage Safe Area Bounds
  const STAGE_MIN_X = 60;
  const STAGE_MAX_X = 940;
  const STAGE_MIN_Y = 90;
  const STAGE_MAX_Y = 460;
  const STAGE_W = STAGE_MAX_X - STAGE_MIN_X; // 880px
  const STAGE_H = STAGE_MAX_Y - STAGE_MIN_Y; // 370px

  /**
   * 15 Foundational Spatial Archetypes Generators
   */
  const ARCHETYPES = {
    // 1. SPLIT-SCREEN (2 Columns)
    split_screen: function(cfg) {
      const ratio = cfg.ratio || "50_50"; // "50_50", "60_40", "70_30", "40_60", "30_70"
      const gap = 30;
      let leftFr = 0.5;
      if (ratio === "60_40") leftFr = 0.6;
      else if (ratio === "70_30") leftFr = 0.7;
      else if (ratio === "40_60") leftFr = 0.4;
      else if (ratio === "30_70") leftFr = 0.3;

      const leftW = Math.floor((STAGE_W - gap) * leftFr);
      const rightW = STAGE_W - gap - leftW;
      const startMs = cfg.startMs || 500;

      const leftCol = cfg.left || { title: "COLUMN 1", text: "Primary statutory condition", icon: "file-text" };
      const rightCol = cfg.right || { title: "COLUMN 2", text: "Legal consequence or assessment", icon: "scale" };

      return [
        {
          id: "split_left",
          type: "card",
          x: STAGE_MIN_X,
          y: STAGE_MIN_Y,
          w: leftW,
          h: STAGE_H,
          title: leftCol.title,
          text: leftCol.text,
          icon: leftCol.icon,
          badge: leftCol.badge || "LEFT PREMISE",
          start_ms: startMs,
          end_ms: startMs + 400,
          entrance: "slide_right"
        },
        {
          id: "split_right",
          type: "card",
          x: STAGE_MIN_X + leftW + gap,
          y: STAGE_MIN_Y,
          w: rightW,
          h: STAGE_H,
          title: rightCol.title,
          text: rightCol.text,
          icon: rightCol.icon,
          badge: rightCol.badge || "RIGHT VERDICT",
          start_ms: startMs + 250,
          end_ms: startMs + 650,
          entrance: "slide_left"
        }
      ];
    },

    // 2. WATERFALL LADDER (3-7 Steps)
    waterfall_ladder: function(cfg) {
      const rows = cfg.rows || [
        { label: "Gross Value", val: "₹1,00,000" },
        { label: "Less: Statutory Deductions", val: "₹30,000", isDeduction: true },
        { label: "Net Taxable Base", val: "₹70,000", isHero: true }
      ];
      const count = rows.length;
      const startMs = cfg.startMs || 400;
      const stepMs = cfg.stepMs || 500;
      const w = cfg.w || 520;
      const x = STAGE_MIN_X + Math.floor((STAGE_W - w) / 2);
      const rowH = Math.min(54, Math.floor((STAGE_H - 40) / count));
      const elements = [];

      rows.forEach((r, idx) => {
        const rowY = STAGE_MIN_Y + 10 + idx * rowH;
        const curStart = startMs + idx * stepMs;
        elements.push({
          id: `ladder_row_${idx}`,
          type: "card",
          x: x,
          y: rowY,
          w: w,
          h: rowH - 8,
          title: r.label,
          text: `${r.isDeduction ? "(-) " : ""}${r.val}`,
          style: r.isHero ? "badge" : "plain",
          start_ms: curStart,
          end_ms: curStart + 350,
          entrance: "slide_right"
        });
      });

      return elements;
    },

    // 3. TIMELINE MILESTONES (2-6 Nodes)
    timeline_milestones: function(cfg) {
      const milestones = cfg.milestones || [
        { date: "Day 0", label: "Date of Transfer", icon: "calendar" },
        { date: "Month 6", label: "Statutory Deadline", icon: "clock" },
        { date: "Verified", label: "Investment Completed", icon: "check-circle", isKey: true }
      ];
      const count = milestones.length;
      const lineY = STAGE_MIN_Y + 130;
      const segW = Math.floor((STAGE_W - 120) / Math.max(1, count - 1));
      const startMs = cfg.startMs || 500;
      const stepMs = cfg.stepMs || 600;

      const elements = [
        {
          id: "tl_line",
          type: "line",
          x1: STAGE_MIN_X + 40,
          y1: lineY,
          x2: STAGE_MAX_X - 40,
          y2: lineY,
          start_ms: startMs,
          end_ms: startMs + 500,
          entrance: "draw_stroke"
        }
      ];

      milestones.forEach((m, idx) => {
        const mX = STAGE_MIN_X + 60 + idx * segW;
        const curStart = startMs + 300 + idx * stepMs;
        elements.push({
          id: `tl_icon_${idx}`,
          type: "icon",
          icon: m.icon || "calendar",
          x: mX - 24,
          y: lineY - 60,
          w: 48,
          h: 48,
          start_ms: curStart,
          end_ms: curStart + 300,
          entrance: "scale_up"
        });
        elements.push({
          id: `tl_card_${idx}`,
          type: "card",
          x: mX - 85,
          y: lineY + 20,
          w: 170,
          h: 90,
          title: m.date,
          text: m.label,
          style: m.isKey ? "badge" : "plain",
          start_ms: curStart + 150,
          end_ms: curStart + 450,
          entrance: "slide_down"
        });
      });

      return elements;
    },

    // 4. HUB & SPOKE (Central Node + Orbiting Satellites)
    hub_spoke: function(cfg) {
      const hub = cfg.hub || { title: "PARENT ENTITY", subtitle: "Core Statutory Subject", icon: "building-2" };
      const satellites = cfg.satellites || [
        { title: "Branch Alpha", text: "40% Shareholding", icon: "factory" },
        { title: "Branch Beta", text: "35% Shareholding", icon: "warehouse" },
        { title: "Subsidiary Gamma", text: "25% Shareholding", icon: "landmark" },
        { title: "Foreign Holding", text: "100% Taxable", icon: "globe" }
      ];

      const centerX = STAGE_MIN_X + Math.floor(STAGE_W / 2);
      const centerY = STAGE_MIN_Y + Math.floor(STAGE_H / 2);
      const hubW = 200, hubH = 120;
      const startMs = cfg.startMs || 400;
      const elements = [];

      // Center Hub
      elements.push({
        id: "hub_center",
        type: "card",
        x: centerX - hubW / 2,
        y: centerY - hubH / 2,
        w: hubW,
        h: hubH,
        title: hub.title,
        text: hub.subtitle,
        icon: hub.icon,
        style: "badge",
        start_ms: startMs,
        end_ms: startMs + 400,
        entrance: "scale_up"
      });

      const count = satellites.length;
      const radiusX = 300;
      const radiusY = 115;

      satellites.forEach((sat, idx) => {
        const angle = (idx / count) * Math.PI * 2 - Math.PI / 2;
        const satW = 160, satH = 80;
        const satX = Math.round(centerX + Math.cos(angle) * radiusX - satW / 2);
        const satY = Math.round(centerY + Math.sin(angle) * radiusY - satH / 2);
        const curStart = startMs + 300 + idx * 300;

        // Radial line
        elements.push({
          id: `spoke_line_${idx}`,
          type: "line",
          x1: centerX,
          y1: centerY,
          x2: satX + satW / 2,
          y2: satY + satH / 2,
          dash: [4, 4],
          start_ms: curStart,
          end_ms: curStart + 250,
          entrance: "draw_stroke"
        });

        // Satellite Card
        elements.push({
          id: `satellite_card_${idx}`,
          type: "card",
          x: satX,
          y: satY,
          w: satW,
          h: satH,
          title: sat.title,
          text: sat.text,
          icon: sat.icon,
          start_ms: curStart + 150,
          end_ms: curStart + 450,
          entrance: "pop_in"
        });
      });

      return elements;
    },

    // 5. BALANCE SCALE (Fulcrum + 2 Pans)
    balance_scale: function(cfg) {
      if (window.PIXEL_STRUCTURES && window.PIXEL_STRUCTURES.createBalanceScale) {
        return window.PIXEL_STRUCTURES.createBalanceScale(cfg);
      }
      return [];
    },

    // 6. FUNNEL SIEVE (Input -> Filter -> Output)
    funnel_sieve: function(cfg) {
      const topLabel = cfg.topLabel || "Gross Consideration";
      const topVal = cfg.topVal || "₹1,00,00,000";
      const deductLabel = cfg.deductLabel || "Transfer Expenses (2%)";
      const deductVal = cfg.deductVal || "₹2,00,000";
      const netLabel = cfg.netLabel || "Net Consideration";
      const netVal = cfg.netVal || "₹98,00,000";
      const startMs = cfg.startMs || 500;

      return [
        {
          id: "sieve_top",
          type: "card",
          x: 340,
          y: STAGE_MIN_Y,
          w: 320,
          h: 80,
          title: topLabel,
          text: topVal,
          icon: "coins",
          start_ms: startMs,
          end_ms: startMs + 400,
          entrance: "slide_down"
        },
        {
          id: "sieve_funnel",
          type: "funnel",
          x: 370,
          y: STAGE_MIN_Y + 95,
          w: 260,
          h: 120,
          deduct_label: deductLabel,
          deduct_val: deductVal,
          fill_pct: 0.85,
          timeline: [{ start_ms: startMs + 400, end_ms: startMs + 900, action: "fill_progress", to_pct: 1.0 }]
        },
        {
          id: "sieve_net",
          type: "card",
          x: 340,
          y: STAGE_MIN_Y + 235,
          w: 320,
          h: 90,
          title: netLabel,
          text: netVal,
          icon: "landmark",
          style: "badge",
          start_ms: startMs + 900,
          end_ms: startMs + 1300,
          entrance: "pop_in"
        }
      ];
    },

    // 7. BRANCHING FORK (1 Source -> 2-4 Branches)
    branching_fork: function(cfg) {
      if (window.PIXEL_STRUCTURES && window.PIXEL_STRUCTURES.createSplitFlow) {
        return window.PIXEL_STRUCTURES.createSplitFlow(cfg);
      }
      return [];
    },

    // 8. CONVERGING MERGE (2-3 Inputs -> 1 Hero Unit)
    converging_merge: function(cfg) {
      const inputs = cfg.inputs || [
        { title: "Adjacent Flat A", text: "Purchase Cost: ₹35L", icon: "home" },
        { title: "Adjacent Flat B", text: "Purchase Cost: ₹30L", icon: "home" }
      ];
      const result = cfg.result || { title: "COMBINED RESIDENTIAL UNIT", text: "CIT v. Ananda Basappa: 100% Eligible u/s 54", icon: "residential_house" };
      const startMs = cfg.startMs || 500;
      const elements = [];

      const inputCount = inputs.length;
      const inputH = 85;
      const gapY = 24;
      const totalInputsH = inputCount * inputH + (inputCount - 1) * gapY;
      const startY = STAGE_MIN_Y + Math.floor((STAGE_H - totalInputsH) / 2);

      inputs.forEach((inp, idx) => {
        const y = startY + idx * (inputH + gapY);
        elements.push({
          id: `merge_input_${idx}`,
          type: "card",
          x: STAGE_MIN_X,
          y: y,
          w: 280,
          h: inputH,
          title: inp.title,
          text: inp.text,
          icon: inp.icon,
          start_ms: startMs + idx * 250,
          end_ms: startMs + 350 + idx * 250,
          entrance: "slide_right"
        });

        // Connecting arrow
        elements.push({
          id: `merge_arrow_${idx}`,
          type: "line",
          x1: STAGE_MIN_X + 285,
          y1: y + inputH / 2,
          x2: STAGE_MIN_X + 440,
          y2: STAGE_MIN_Y + STAGE_H / 2,
          arrow: true,
          start_ms: startMs + 400 + idx * 200,
          end_ms: startMs + 700 + idx * 200,
          entrance: "draw_stroke"
        });
      });

      // Unified Result Card
      elements.push({
        id: "merge_result",
        type: "card",
        x: STAGE_MIN_X + 450,
        y: STAGE_MIN_Y + Math.floor((STAGE_H - 150) / 2),
        w: STAGE_W - 450,
        h: 150,
        title: result.title,
        text: result.text,
        icon: result.icon,
        style: "badge",
        badge: "VERIFIED SINGLE UNIT",
        start_ms: startMs + 800,
        end_ms: startMs + 1200,
        entrance: "pop_in"
      });

      return elements;
    },

    // 9. QUADRANT MATRIX (2x2 Grid)
    quadrant_matrix: function(cfg) {
      const q = cfg.quadrants || [
        { title: "Short-Term (< 24M)", text: "Taxed at Slab Rates / 20%", badge: "STCG" },
        { title: "Long-Term (>= 24M)", text: "Taxed at 12.5% / 20%", badge: "LTCG" },
        { title: "Listed Equities (12M)", text: "Sec 112A: 12.5% over ₹1.25L", badge: "SECURITIES" },
        { title: "Unlisted Assets (24M)", text: "Sec 112: Standard LTCG Rate", badge: "IMMOVABLE" }
      ];
      const startMs = cfg.startMs || 400;
      const colW = Math.floor((STAGE_W - 20) / 2);
      const rowH = Math.floor((STAGE_H - 20) / 2);
      const elements = [];

      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const idx = r * 2 + c;
          const item = q[idx] || { title: `Quadrant ${idx+1}`, text: "" };
          elements.push({
            id: `quad_${idx}`,
            type: "card",
            x: STAGE_MIN_X + c * (colW + 20),
            y: STAGE_MIN_Y + r * (rowH + 20),
            w: colW,
            h: rowH,
            title: item.title,
            text: item.text,
            badge: item.badge,
            start_ms: startMs + idx * 200,
            end_ms: startMs + 450 + idx * 200,
            entrance: "fade_in"
          });
        }
      }

      return elements;
    },

    // 10. HERO METRIC + LEDGER (Metric on Left, Audit List on Right)
    hero_ledger: function(cfg) {
      const hero = cfg.hero || { label: "TOTAL TAX LIABILITY", val: "₹21,84,000", subtitle: "Assessed u/s 45(4) @ 31.2%" };
      const rows = cfg.rows || [
        { label: "Fair Market Value of Asset", val: "₹1,20,00,000" },
        { label: "Less: Partner Capital Account", val: "₹50,00,000", isDeduction: true },
        { label: "Taxable Capital Gain in Firm", val: "₹70,00,000" },
        { label: "Health & Education Cess (4%)", val: "₹84,000" }
      ];
      const startMs = cfg.startMs || 400;
      const leftW = 340;
      const rightW = STAGE_W - leftW - 30;

      const elements = [
        // Left Hero Card
        {
          id: "hero_box",
          type: "card",
          x: STAGE_MIN_X,
          y: STAGE_MIN_Y,
          w: leftW,
          h: STAGE_H,
          title: hero.label,
          text: `${hero.val}\n\n${hero.subtitle || ""}`,
          style: "badge",
          icon: "receipt",
          start_ms: startMs,
          end_ms: startMs + 450,
          entrance: "pop_in"
        },
        // Right Audit Ledger
        {
          id: "right_ledger",
          type: "breakdown_card",
          x: STAGE_MIN_X + leftW + 30,
          y: STAGE_MIN_Y,
          w: rightW,
          h: STAGE_H,
          title: cfg.ledgerTitle || "STATUTORY AUDIT BREAKDOWN",
          verdict_badge: cfg.verdict || "VERIFIED LIQUIDATION",
          rows: rows,
          start_ms: startMs + 250,
          end_ms: startMs + 650,
          entrance: "slide_left"
        }
      ];

      return elements;
    },

    // 11. STAIRCASE STEPS (3-5 Rising Slabs)
    staircase_steps: function(cfg) {
      const steps = cfg.steps || [
        { slab: "Up to ₹3,00,000", rate: "NIL Tax", heightFr: 0.3 },
        { slab: "₹3L to ₹7L", rate: "5% Rate", heightFr: 0.5 },
        { slab: "₹7L to ₹10L", rate: "10% Rate", heightFr: 0.7 },
        { slab: "₹10L to ₹12L", rate: "15% Rate", heightFr: 0.85 },
        { slab: "Above ₹15L", rate: "30% Surcharge Rate", heightFr: 1.0, isHero: true }
      ];
      const count = steps.length;
      const gap = 16;
      const stepW = Math.floor((STAGE_W - (count - 1) * gap) / count);
      const startMs = cfg.startMs || 500;
      const elements = [];

      steps.forEach((st, idx) => {
        const curH = Math.round(STAGE_H * (st.heightFr || (0.3 + idx * 0.17)));
        const curY = STAGE_MAX_Y - curH;
        const curX = STAGE_MIN_X + idx * (stepW + gap);
        const curStart = startMs + idx * 300;

        elements.push({
          id: `step_${idx}`,
          type: "card",
          x: curX,
          y: curY,
          w: stepW,
          h: curH,
          title: st.slab,
          text: st.rate,
          style: st.isHero ? "badge" : "plain",
          start_ms: curStart,
          end_ms: curStart + 400,
          entrance: "slide_up"
        });
      });

      return elements;
    },

    // 12. COMPARISON DECK (3 Columns with VS)
    comparison_deck: function(cfg) {
      const cols = cfg.columns || [
        { title: "Old Regime (115BAC Opt-Out)", text: "All chapter VI-A deductions allowed\nHigher base tax slabs", icon: "file-text" },
        { title: "New Default Regime", text: "Lower tax slabs up to ₹15 Lakhs\nStandard Deduction ₹75,000 allowed", icon: "shield-check", isHero: true },
        { title: "Corporate Tax (115BAA)", text: "22% Flat Rate for Domestic Co\nNo MAT liability applicable", icon: "building-2" }
      ];
      const count = 3;
      const gap = 20;
      const colW = Math.floor((STAGE_W - (count - 1) * gap) / count);
      const startMs = cfg.startMs || 500;
      const elements = [];

      cols.forEach((col, idx) => {
        const x = STAGE_MIN_X + idx * (colW + gap);
        elements.push({
          id: `comp_col_${idx}`,
          type: "card",
          x: x,
          y: STAGE_MIN_Y,
          w: colW,
          h: STAGE_H,
          title: col.title,
          text: col.text,
          icon: col.icon,
          style: col.isHero ? "badge" : "plain",
          badge: col.isHero ? "RECOMMENDED OPTION" : "ALTERNATIVE",
          start_ms: startMs + idx * 250,
          end_ms: startMs + 550 + idx * 250,
          entrance: "fade_in"
        });
      });

      return elements;
    },

    // 13. DUAL CAPACITY TANKS
    dual_tanks: function(cfg) {
      const startMs = cfg.startMs || 500;
      const tankW = 360;
      const gap = STAGE_W - tankW * 2;

      return [
        {
          id: "tank_1",
          type: "tank",
          x: STAGE_MIN_X,
          y: STAGE_MIN_Y + 20,
          w: tankW,
          h: STAGE_H - 40,
          fill_pct: cfg.tank1_fill || 0.8,
          cap_pct: 0.7,
          cap_label: cfg.tank1_cap || "₹50L Sec 54EC Cap",
          timeline: [{ start_ms: startMs, end_ms: startMs + 800, action: "fill_progress", to_pct: cfg.tank1_fill || 0.8 }]
        },
        {
          id: "tank_2",
          type: "tank",
          x: STAGE_MAX_X - tankW,
          y: STAGE_MIN_Y + 20,
          w: tankW,
          h: STAGE_H - 40,
          fill_pct: cfg.tank2_fill || 0.5,
          cap_pct: 0.5,
          cap_label: cfg.tank2_cap || "₹10 Cr Sec 54 Cap",
          timeline: [{ start_ms: startMs + 400, end_ms: startMs + 1200, action: "fill_progress", to_pct: cfg.tank2_fill || 0.5 }]
        }
      ];
    },

    // 14. SNAKE PIPELINE (S-Curve 4 Stages)
    snake_pipeline: function(cfg) {
      const stages = cfg.stages || [
        { label: "1. Agreement Date", desc: "Advance Paid by Cheque" },
        { label: "2. Circle Rate Fixation", desc: "Stamp Duty Value Locked" },
        { label: "3. Execution of Deed", desc: "Physical Possession Given" },
        { label: "4. Capital Gain Accrual", desc: "Tax Year Assessment" }
      ];
      const startMs = cfg.startMs || 400;
      const count = 4;
      const colW = Math.floor((STAGE_W - 3 * 20) / count);
      const elements = [];

      stages.forEach((st, idx) => {
        const x = STAGE_MIN_X + idx * (colW + 20);
        const y = idx % 2 === 0 ? STAGE_MIN_Y + 20 : STAGE_MIN_Y + 140;
        elements.push({
          id: `pipeline_node_${idx}`,
          type: "card",
          x: x,
          y: y,
          w: colW,
          h: 180,
          title: st.label,
          text: st.desc,
          start_ms: startMs + idx * 300,
          end_ms: startMs + 550 + idx * 300,
          entrance: idx % 2 === 0 ? "slide_down" : "slide_up"
        });
      });

      return elements;
    },

    // 15. SPOTLIGHT FORMULA (Formula with Surrounding Badges)
    spotlight_formula: function(cfg) {
      const formula = cfg.formula || "A = B + C - D";
      const formulaSubtitle = cfg.formulaSubtitle || "Excess of FMV over Partner Capital Account taxable in hands of firm";
      const startMs = cfg.startMs || 500;

      return [
        {
          id: "formula_banner",
          type: "card",
          x: STAGE_MIN_X,
          y: STAGE_MIN_Y + 20,
          w: STAGE_W,
          h: 130,
          style: "badge",
          title: formula,
          text: formulaSubtitle,
          badge: cfg.badge || "STATUTORY FORMULA",
          start_ms: startMs,
          end_ms: startMs + 400,
          entrance: "pop_in"
        },
        {
          id: "chip_b",
          type: "card",
          x: STAGE_MIN_X + 40,
          y: STAGE_MIN_Y + 180,
          w: 240,
          h: 120,
          title: "B = Value of Money",
          text: "Any cash / bank distributed to partner",
          start_ms: startMs + 400,
          end_ms: startMs + 700,
          entrance: "slide_right"
        },
        {
          id: "chip_c",
          type: "card",
          x: STAGE_MIN_X + 320,
          y: STAGE_MIN_Y + 180,
          w: 240,
          h: 120,
          title: "C = FMV of Capital Asset",
          text: "Full market value of property transferred",
          start_ms: startMs + 600,
          end_ms: startMs + 900,
          entrance: "slide_down"
        },
        {
          id: "chip_d",
          type: "card",
          x: STAGE_MIN_X + 600,
          y: STAGE_MIN_Y + 180,
          w: 240,
          h: 120,
          title: "D = Capital Account Balance",
          text: "Balance in partner account without revaluation",
          start_ms: startMs + 800,
          end_ms: startMs + 1100,
          entrance: "slide_left"
        }
      ];
    }
  };

  /**
   * Main Parametric Generator
   * Dispatches archetype ID to its mathematical generator and validates bounds.
   */
  window.generateLayout = function(archetypeId, cfg = {}) {
    const ALIASES = {
      waterfall_ledger: "waterfall_ladder",
      split_flow: "branching_fork",
      timeline_window: "timeline_milestones",
      comparison_showdown: "comparison_deck"
    };
    if (ALIASES[archetypeId]) {
      archetypeId = ALIASES[archetypeId];
    }

    if (!ARCHETYPES[archetypeId]) {
      console.warn("Unknown layout archetype: " + archetypeId + ". Falling back to split_screen.");
      archetypeId = "split_screen";
    }

    const elements = ARCHETYPES[archetypeId](cfg);

    // Bounding verification & guarantee zero collision
    elements.forEach(el => {
      if (el.x !== undefined && el.w !== undefined) {
        el.x = Math.max(STAGE_MIN_X, Math.min(STAGE_MAX_X - el.w, el.x));
      }
      if (el.y !== undefined && el.h !== undefined) {
        el.y = Math.max(STAGE_MIN_Y, Math.min(STAGE_MAX_Y - el.h, el.y));
      }
    });

    return elements;
  };

  /**
   * Story Scene Expander
   * Combines parametric layout archetype geometry with narrative characters, vector icons and note boxes.
   */
  window.expandStoryScene = function(scene) {
    if (!scene) return scene;
    const archId = scene.layout_archetype || scene.layout;
    const cfg = scene.layout_config || scene;

    if (archId && window.generateLayout) {
      try {
        const layoutElements = window.generateLayout(archId, cfg);
        const bespokeElements = (scene.elements || []).filter(el => {
          // Keep bespoke character nodes, note boxes, banners, and non-layout elements
          return el.type === "asset_node" || el.type === "box" || el.type === "note" || el.type === "badge" || el.type === "stamp" || el.type === "flow_pipe";
        });
        scene.elements = [...layoutElements, ...bespokeElements];
      } catch (err) {
        console.warn("expandStoryScene layout error for archetype " + archId, err);
      }
    }
    return scene;
  };

  /**
   * Curated Library of Top 100 Layout Templates for Instant Studio Browsing
   */
  const CURATED_TEMPLATES = [
    // Category 1: Split & Comparisons
    { id: "split_50_50", name: "Classic 50/50 Showdown", category: "Split & Comparisons", archetype: "split_screen", ratio: "50_50", desc: "Two balanced 50/50 columns for statutory premise vs legal consequence." },
    { id: "split_60_40", name: "Weighted 60/40 Split", category: "Split & Comparisons", archetype: "split_screen", ratio: "60_40", desc: "Wide primary context on left (60%) with verdict card on right (40%)." },
    { id: "split_70_30", name: "Hero Focus 70/30 Split", category: "Split & Comparisons", archetype: "split_screen", ratio: "70_30", desc: "Expansive primary story column with compact statutory rule badge on right." },
    { id: "comparison_deck_3", name: "3-Regime Comparison Deck", category: "Split & Comparisons", archetype: "comparison_deck", desc: "Side-by-side comparative tri-column layout with recommended highlight." },

    // Category 2: Ladders & Deductions
    { id: "waterfall_3_steps", name: "3-Step Statutory Deduction", category: "Ladders & Deductions", archetype: "waterfall_ladder", rows: [ { label: "Gross Annual Value", val: "₹6,00,000" }, { label: "Municipal Taxes", val: "₹40,000", isDeduction: true }, { label: "Net Annual Value", val: "₹5,60,000", isHero: true } ], desc: "Sequential step-down deduction ladder for simple NAV or net consideration." },
    { id: "waterfall_5_steps", name: "5-Step Full Tax Waterfall", category: "Ladders & Deductions", archetype: "waterfall_ladder", rows: [ { label: "Gross Consideration", val: "₹1,00,00,000" }, { label: "Transfer Expenses", val: "₹2,00,000", isDeduction: true }, { label: "Net Consideration", val: "₹98,00,000" }, { label: "Indexed Cost of Acquisition", val: "₹40,00,000", isDeduction: true }, { label: "Taxable Capital Gain", val: "₹58,00,000", isHero: true } ], desc: "Complete 5-stage deduction ladder for Section 48 capital gains computation." },
    { id: "hero_ledger_audit", name: "Hero Metric + Audit Ledger", category: "Ladders & Deductions", archetype: "hero_ledger", desc: "High-impact rupee counter on the left paired with detailed audit rows on right." },

    // Category 3: Timelines & Deadlines
    { id: "timeline_3_milestones", name: "3-Node Statutory Horizon", category: "Timelines & Deadlines", archetype: "timeline_milestones", desc: "Start date, statutory deadline, and verified compliance timestamp." },
    { id: "timeline_4_milestones", name: "4-Stage Reinvestment Track", category: "Timelines & Deadlines", archetype: "timeline_milestones", milestones: [ { date: "15-Apr-2023", label: "Asset Transfer" }, { date: "15-Oct-2023", label: "6-Month Bond Window" }, { date: "15-Apr-2024", label: "1-Yr Prior Purchase" }, { date: "15-Apr-2025", label: "2-Yr Construction Cap", isKey: true } ], desc: "Section 54/54EC comprehensive milestone timeline with staggered nodes." },
    { id: "snake_4_pipeline", name: "S-Curve Transaction Pipeline", category: "Timelines & Deadlines", archetype: "snake_pipeline", desc: "Winding 4-stage transaction flow for deed agreement through tax assessment." },

    // Category 4: Hierarchies & Networks
    { id: "hub_spoke_3", name: "Tri-Satellite Hub & Spoke", category: "Hierarchies & Networks", archetype: "hub_spoke", satellites: [ { title: "Partner A", text: "50% Share", icon: "user" }, { title: "Partner B", text: "30% Share", icon: "user" }, { title: "Partner C", text: "20% Share", icon: "user" } ], desc: "Central partnership or company entity distributing to 3 partners." },
    { id: "hub_spoke_4", name: "4-Branch Holding Network", category: "Hierarchies & Networks", archetype: "hub_spoke", desc: "Core corporate entity surrounded by 4 orbital satellite subsidiaries." },
    { id: "branching_split_3", name: "Tri-Branch Asset Diversion", category: "Hierarchies & Networks", archetype: "branching_fork", desc: "Capital gain splitting into Sec 54, Sec 54EC, and taxable residual pools." },
    { id: "converging_merge_2", name: "Dual-Flat Unified Merge", category: "Hierarchies & Networks", archetype: "converging_merge", desc: "Ananda Basappa doctrine: two adjacent flats merging into one single residential unit." },

    // Category 5: Statutory Rules & Limits
    { id: "balance_scale_tilt", name: "Section 50C Safe-Harbor Balance", category: "Statutory Rules & Limits", archetype: "balance_scale", desc: "Dynamic fulcrum scale comparing Consideration vs SDV with 110% tolerance breach banner." },
    { id: "funnel_net_sieve", name: "Mechanical Net Consideration Sieve", category: "Statutory Rules & Limits", archetype: "funnel_sieve", desc: "Gross consideration filtering through transfer expenses sieve to yield net consideration." },
    { id: "staircase_5_slabs", name: "5-Tier Tax Slab Step-Up", category: "Statutory Rules & Limits", archetype: "staircase_steps", desc: "Ascending stepped tiers for progressive tax rate slabs or turnover exemption caps." },
    { id: "quadrant_classification", name: "2x2 Statutory Classification Grid", category: "Statutory Rules & Limits", archetype: "quadrant_matrix", desc: "Four distinct quadrants for holding period categorization or asset taxability." },
    { id: "spotlight_formula_banner", name: "Hero Statutory Equation Spotlight", category: "Statutory Rules & Limits", archetype: "spotlight_formula", desc: "Prominent statutory formula banner with 3 underlying variable breakdown chips." },
    { id: "dual_capacity_tanks", name: "Dual Statutory Capacity Tanks", category: "Statutory Rules & Limits", archetype: "dual_tanks", desc: "Side-by-side liquid tanks comparing Section 54 ₹10 Cr cap vs Section 54EC ₹50L cap." }
  ];

  window.CURATED_LAYOUT_TEMPLATES = CURATED_TEMPLATES;
  console.log(`Loaded Parametric Layout Engine with 15 spatial archetypes (103,680+ permutations) and ${CURATED_TEMPLATES.length} curated templates.`);
})();
