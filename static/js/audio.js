// -*- coding: utf-8 -*-
// static/js/audio.js
// Statutory Kinetic Studio - Voice & Speech Narration Engine
// Web Speech synthesis with ml-IN detection, fallback notice, and sentence-level synchronization.

(function() {
  class StudioAudioManager {
    constructor() {
      this.enabled = true;
      this.isMuted = false;
      this.currentUtterance = null;
      this.selectedVoice = null;
      this.hasMalayalamVoice = false;
      this.voicesLoaded = false;
      this.voiceNoticeShown = false;

      this.initVoices();
    }

    initVoices() {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        console.warn("[AUDIO] Web Speech API not supported in this browser.");
        return;
      }

      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return;

        this.voicesLoaded = true;

        // Search for Malayalam voice (ml-IN or language code starting with 'ml')
        const mlVoice = voices.find(v => v.lang && (v.lang === "ml-IN" || v.lang.startsWith("ml")));
        // Search for Indian English fallback (en-IN)
        const enInVoice = voices.find(v => v.lang && v.lang === "en-IN");
        // General English fallback
        const enVoice = voices.find(v => v.lang && v.lang.startsWith("en"));

        if (mlVoice) {
          this.selectedVoice = mlVoice;
          this.hasMalayalamVoice = true;
          this.hideVoiceNotice();
        } else {
          this.selectedVoice = enInVoice || enVoice || voices[0];
          this.hasMalayalamVoice = false;
          this.showVoiceNotice();
        }
      };

      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
      updateVoices();
    }

    showVoiceNotice() {
      if (this.voiceNoticeShown) return;
      this.voiceNoticeShown = true;

      let banner = document.getElementById("voice_notice_banner");
      if (!banner) {
        banner = document.createElement("div");
        banner.id = "voice_notice_banner";
        banner.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-left: 4px solid #3B82F6;
          border-radius: 6px;
          padding: 8px 14px;
          margin: 8px 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #1E40AF;
        `;
        const canvasWrapper = document.querySelector(".canvas-wrapper");
        if (canvasWrapper && canvasWrapper.parentNode) {
          canvasWrapper.parentNode.insertBefore(banner, canvasWrapper);
        }
      }

      banner.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:14px;">ℹ️</span>
          <span>System Voice: Malayalam voice (ml-IN) not detected on this browser/OS. Using Indian English (en-IN) fallback for spoken teacher narration.</span>
        </div>
        <button onclick="this.parentElement.style.display='none'" style="background:none; border:none; color:#1E40AF; font-size:14px; cursor:pointer; padding:0 4px;" title="Dismiss">✕</button>
      `;
      banner.style.display = "flex";
    }

    hideVoiceNotice() {
      const banner = document.getElementById("voice_notice_banner");
      if (banner) banner.style.display = "none";
    }

    speakSentence(text, options = {}) {
      if (!this.enabled || this.isMuted) return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      if (!text || !text.trim()) return;

      this.stop();

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.voice = this.selectedVoice;
      utterance.lang = this.hasMalayalamVoice ? "ml-IN" : "en-IN";
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;

      utterance.onend = () => {
        this.currentUtterance = null;
        if (options.onEnd) options.onEnd();
      };

      utterance.onerror = (e) => {
        console.warn("[AUDIO] Speech synthesis warning:", e.error);
        this.currentUtterance = null;
        if (options.onEnd) options.onEnd();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    }

    stop() {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      this.currentUtterance = null;
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.isMuted) {
        this.stop();
      }
      return this.isMuted;
    }

    setMuted(muted) {
      this.isMuted = !!muted;
      if (this.isMuted) {
        this.stop();
      }
    }
  }

  // Expose singleton to window
  window.AUDIO_MANAGER = new StudioAudioManager();
})();
