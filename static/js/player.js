// -*- coding: utf-8 -*-
// static/js/player.js
// Statutory Kinetic Studio - Broadcast-Quality Master Clock & Presentation Player
// HiDPI with devicePixelRatio & ResizeObserver, deterministic renderFrame(slideIdx, timeMs),
// WebM export, PNG snapshot, and keyboard accessibility.

(function() {
  const LOGICAL_WIDTH = 1280;
  const LOGICAL_HEIGHT = 720;
  const DEFAULT_LINE_DURATION_MS = 4500;
  const SLIDE_CROSSFADE_MS = 400;

  class PresentationPlayer {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.data = null;
      this.currentSlideIdx = 0;
      this.currentTimeMs = 0;
      this.isPlaying = false;
      this.playbackSpeed = 1.0;
      this.lastTimestamp = performance.now();
      this.animationFrameId = null;
      this.sceneGraph = new window.KeyedActorSceneGraph();
      this.resizeObserver = null;
      this.isExporting = false;

      // Scrubber tracking
      this.isScrubbing = false;

      // Bound methods
      this.loop = this.loop.bind(this);
      this.handleResize = this.handleResize.bind(this);
    }

    init(canvasId = "stage_canvas") {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext("2d");

      // Setup HiDPI & ResizeObserver
      this.setupHiDPI();
      this.setupKeyboard();
      this.setupScrubber();

      // Ensure fonts are loaded before first frame
      if (window.THEME) {
        window.THEME.ensureFontsLoaded().then(() => {
          this.render();
        });
      }
    }

    /**
     * Requirement 4: HiDPI backing store scaling via devicePixelRatio & ResizeObserver
     */
    setupHiDPI() {
      if (!this.canvas) return;

      const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        const displayWidth = rect.width || 1080;
        const displayHeight = rect.height || (displayWidth * 9 / 16);

        // Scale backing store
        this.canvas.width = Math.round(displayWidth * dpr);
        this.canvas.height = Math.round(displayHeight * dpr);

        // Reset transform and scale to logical 1280x720 space
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(
          (this.canvas.width / LOGICAL_WIDTH),
          (this.canvas.height / LOGICAL_HEIGHT)
        );

        // Re-render current frame
        this.render();
      };

      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => resize());
        this.resizeObserver.observe(this.canvas);
      } else {
        window.addEventListener("resize", resize);
      }

      resize();
    }

    handleResize() {
      this.setupHiDPI();
    }

    setupKeyboard() {
      window.addEventListener("keydown", (e) => {
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;

        if (e.code === "Space") {
          e.preventDefault();
          this.togglePlay();
        } else if (e.code === "ArrowRight") {
          e.preventDefault();
          this.nextSlide();
        } else if (e.code === "ArrowLeft") {
          e.preventDefault();
          this.prevSlide();
        } else if (e.code === "KeyR") {
          e.preventDefault();
          this.seekTo(0);
        } else if (e.code === "KeyM") {
          e.preventDefault();
          this.toggleVoice();
        }
      });
    }

    setupScrubber() {
      const slider = document.getElementById("anim_timeline_slider");
      if (!slider) return;

      slider.addEventListener("mousedown", () => { this.isScrubbing = true; });
      slider.addEventListener("touchstart", () => { this.isScrubbing = true; });
      slider.addEventListener("mouseup", () => { this.isScrubbing = false; });
      slider.addEventListener("touchend", () => { this.isScrubbing = false; });
      slider.addEventListener("input", (e) => {
        this.seekTo(parseFloat(e.target.value));
      });
    }

    loadPresentation(data) {
      this.data = data;
      this.currentSlideIdx = 0;
      this.currentTimeMs = 0;
      this.isPlaying = true;
      this.lastTimestamp = performance.now();
      this.sceneGraph.reset();

      this.renderTabs();
      this.updatePlayBtnState();
      this.updateSlideTimeline();

      if (!this.animationFrameId) {
        this.lastTimestamp = performance.now();
        this.animationFrameId = requestAnimationFrame(this.loop);
      }
    }

    loop(timestamp) {
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      const deltaMs = (timestamp - this.lastTimestamp) * this.playbackSpeed;
      this.lastTimestamp = timestamp;

      if (this.isPlaying && !this.isScrubbing && this.data) {
        const slide = this.getCurrentSlide();
        const maxMs = this.getSlideDurationMs(slide);

        this.currentTimeMs += deltaMs;

        if (this.currentTimeMs >= maxMs) {
          // Advance to next slide automatically
          if (this.currentSlideIdx < this.data.scenes.length - 1) {
            this.switchSlide(this.currentSlideIdx + 1);
          } else {
            this.currentTimeMs = maxMs;
            this.isPlaying = false;
            this.updatePlayBtnState();
          }
        }
        this.updateScrubberUI();
      }

      this.render();
      this.animationFrameId = requestAnimationFrame(this.loop);
    }

    getCurrentSlide() {
      if (!this.data || !this.data.scenes) return null;
      return this.data.scenes[this.currentSlideIdx] || null;
    }

    getSlideDurationMs(slide) {
      if (!slide) return 10000;
      if (slide.lines && slide.lines.length > 0) {
        return slide.lines.reduce((acc, l) => acc + (l.duration_ms || DEFAULT_LINE_DURATION_MS), 0);
      }
      return slide.duration_ms || 10000;
    }

    /**
     * Requirement 5: Deterministic renderFrame(slideIdx, timeMs)
     * Pure function of (slideIdx, timeMs) -> produces identical canvas pixel state.
     */
    renderFrame(slideIdx, timeMs, overrideCtx = null) {
      const ctx = overrideCtx || this.ctx;
      if (!ctx || !this.data || !this.data.scenes) return;

      const slide = this.data.scenes[slideIdx];
      if (!slide) return;

      const themeColors = window.THEME.getThemeColors();
      const lines = slide.lines || [];
      const totalLines = Math.max(1, lines.length);

      // Determine active line and lineProgress based on timeMs
      let lineAccumMs = 0;
      let activeLineIdx = 0;
      let lineStartMs = 0;
      let activeLineDuration = DEFAULT_LINE_DURATION_MS;

      for (let i = 0; i < lines.length; i++) {
        const dur = lines[i].duration_ms || DEFAULT_LINE_DURATION_MS;
        if (timeMs >= lineAccumMs && timeMs < lineAccumMs + dur) {
          activeLineIdx = i;
          lineStartMs = lineAccumMs;
          activeLineDuration = dur;
          break;
        }
        lineAccumMs += dur;
        if (i === lines.length - 1) {
          // Clamped at end
          activeLineIdx = i;
          lineStartMs = lineAccumMs - dur;
          activeLineDuration = dur;
        }
      }

      const lineProgress = window.TWEEN.clamp(
        (timeMs - lineStartMs) / activeLineDuration,
        0,
        1
      );

      const activeLine = lines[activeLineIdx] || {};
      const phaseState = window.TWEEN.getLinePhase(lineProgress);

      // Slide crossfade transition at slide start (0 to 400ms)
      const slideTransition = window.TWEEN.getSlideTransition(timeMs, SLIDE_CROSSFADE_MS);

      // 1. Clear background
      window.SCAFFOLD.drawBackground(ctx, themeColors);

      ctx.save();
      ctx.globalAlpha = slideTransition.opacity;
      ctx.translate(0, slideTransition.offsetY);

      // 2. Render Header Region (x: 48, y: 32, w: 1184, h: 48)
      window.SCAFFOLD.drawHeader(
        ctx,
        {
          act_name: this.data.act_name,
          section_code: this.data.section_code,
          tab_title: slide.tab_title,
          core_doctrine: this.data.core_doctrine
        },
        themeColors,
        activeLineIdx,
        totalLines
      );

      // 3. Render Data-Driven Layout Frame into mainStageRegion (x: 48, y: 96, w: 1184, h: 480)
      const mainStageRect = window.SCAFFOLD.REGIONS.mainStage;
      const archetype = slide.layout_archetype || "layout_hero_stage";
      const layoutPayload = slide.layout_payload || {};

      const actionBounds = window.LAYOUT_FRAMES.render(
        ctx,
        archetype,
        layoutPayload,
        mainStageRect,
        phaseState.enterT,
        themeColors
      );

      // 4. Render Kinetic Action Engine into designated actionBounds
      const actionType = activeLine.action_type || "money_transfer";
      const actionPayload = activeLine.action_payload || {};

      if (window.PILOT_ENGINES && window.PILOT_ENGINES[actionType]) {
        window.PILOT_ENGINES[actionType](
          ctx,
          actionPayload,
          actionBounds || mainStageRect,
          phaseState,
          themeColors,
          this.sceneGraph,
          activeLineIdx
        );
      }

      // 5. Render Caption Region (x: 48, y: 592, w: 1184, h: 96)
      window.SCAFFOLD.drawCaption(
        ctx,
        activeLine.sentence || slide.dialogue,
        activeLine.line_title || `Step ${activeLineIdx + 1}`,
        themeColors
      );

      ctx.restore();

      // Trigger Web Speech synthesis once per sentence change
      if (!overrideCtx && this.isPlaying && !this.isScrubbing) {
        const sentenceKey = `${slideIdx}_${activeLineIdx}`;
        if (this.lastSpokenKey !== sentenceKey) {
          this.lastSpokenKey = sentenceKey;
          if (window.AUDIO_MANAGER) {
            window.AUDIO_MANAGER.speakSentence(activeLine.sentence);
          }
        }
      }
    }

    render() {
      this.renderFrame(this.currentSlideIdx, this.currentTimeMs);
    }

    seekTo(timeMs) {
      const slide = this.getCurrentSlide();
      const maxMs = this.getSlideDurationMs(slide);
      this.currentTimeMs = window.TWEEN.clamp(parseFloat(timeMs), 0, maxMs);
      this.render();
      this.updateScrubberUI();
    }

    togglePlay() {
      this.isPlaying = !this.isPlaying;
      this.lastTimestamp = performance.now();
      this.updatePlayBtnState();
      if (!this.isPlaying && window.AUDIO_MANAGER) {
        window.AUDIO_MANAGER.stop();
      }
    }

    switchSlide(idx) {
      if (!this.data || !this.data.scenes) return;
      if (idx < 0 || idx >= this.data.scenes.length) return;

      this.currentSlideIdx = idx;
      this.currentTimeMs = 0;
      this.lastSpokenKey = null;
      this.sceneGraph.reset();

      this.updateSlideTabsUI();
      this.updateSlideTimeline();
      this.render();
    }

    nextSlide() {
      if (this.currentSlideIdx < (this.data?.scenes?.length || 1) - 1) {
        this.switchSlide(this.currentSlideIdx + 1);
      }
    }

    prevSlide() {
      if (this.currentSlideIdx > 0) {
        this.switchSlide(this.currentSlideIdx - 1);
      }
    }

    setSpeed(speed) {
      this.playbackSpeed = parseFloat(speed) || 1.0;
      document.querySelectorAll(".speed-btn").forEach(btn => {
        btn.classList.toggle("active", parseFloat(btn.dataset.speed) === this.playbackSpeed);
      });
    }

    toggleVoice() {
      if (window.AUDIO_MANAGER) {
        const isMuted = window.AUDIO_MANAGER.toggleMute();
        const btn = document.getElementById("btn_voice_toggle");
        if (btn) {
          btn.textContent = isMuted ? "🔇 Voice: OFF" : "🔊 Voice: ON";
          btn.style.color = isMuted ? "#DC2626" : "#059669";
          btn.style.borderColor = isMuted ? "#FECACA" : "#10B981";
        }
      }
    }

    updatePlayBtnState() {
      const btn = document.getElementById("btn_anim_play_pause");
      if (btn) {
        btn.textContent = this.isPlaying ? "⏸ Pause" : "▶ Play";
      }
    }

    updateSlideTimeline() {
      const slide = this.getCurrentSlide();
      const maxMs = this.getSlideDurationMs(slide);
      const slider = document.getElementById("anim_timeline_slider");
      if (slider) {
        slider.max = maxMs;
        slider.value = this.currentTimeMs;
      }
      this.updateScrubberUI();
    }

    updateScrubberUI() {
      const slider = document.getElementById("anim_timeline_slider");
      const display = document.getElementById("anim_time_display");
      const slide = this.getCurrentSlide();
      const maxMs = this.getSlideDurationMs(slide);

      if (slider && !this.isScrubbing) {
        slider.value = this.currentTimeMs;
      }
      if (display) {
        const curSec = (this.currentTimeMs / 1000).toFixed(1);
        const totalSec = (maxMs / 1000).toFixed(1);
        display.textContent = `${curSec}s / ${totalSec}s`;
      }
    }

    renderTabs() {
      const bar = document.getElementById("anim_scene_tabs");
      if (!bar || !this.data || !this.data.scenes) return;

      bar.innerHTML = "";
      this.data.scenes.forEach((sc, idx) => {
        const btn = document.createElement("button");
        btn.className = `scene-tab-btn ${idx === this.currentSlideIdx ? 'active' : ''}`;
        btn.textContent = sc.tab_title || `Scene ${idx + 1}`;
        btn.onclick = () => this.switchSlide(idx);
        bar.appendChild(btn);
      });
    }

    updateSlideTabsUI() {
      const bar = document.getElementById("anim_scene_tabs");
      if (!bar) return;
      const btns = bar.querySelectorAll(".scene-tab-btn");
      btns.forEach((b, idx) => {
        b.classList.toggle("active", idx === this.currentSlideIdx);
      });
    }

    /**
     * Requirement 4: Export to WebM (Visuals only via MediaRecorder)
     */
    async exportWebM() {
      if (!this.canvas) return;
      if (this.isExporting) return;

      const stream = this.canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `statutory_kinetic_slide_${this.currentSlideIdx + 1}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        this.isExporting = false;
        alert("WebM video exported successfully! (Visual animation stream captured)");
      };

      this.isExporting = true;
      this.seekTo(0);
      this.isPlaying = true;
      recorder.start();

      const slide = this.getCurrentSlide();
      const maxMs = this.getSlideDurationMs(slide);
      setTimeout(() => {
        recorder.stop();
        this.isPlaying = false;
      }, maxMs + 500);
    }

    /**
     * Requirement 4: Export PNG Snapshot of current frame at 2x resolution
     */
    exportSnapshot() {
      if (!this.canvas) return;
      const offCanvas = document.createElement("canvas");
      offCanvas.width = LOGICAL_WIDTH * 2;
      offCanvas.height = LOGICAL_HEIGHT * 2;
      const offCtx = offCanvas.getContext("2d");
      offCtx.scale(2, 2);

      this.renderFrame(this.currentSlideIdx, this.currentTimeMs, offCtx);

      const url = offCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `slide_${this.currentSlideIdx + 1}_snapshot.png`;
      a.click();
    }
  }

  // Singleton instance
  window.PRESENTATION_PLAYER = new PresentationPlayer();
})();
