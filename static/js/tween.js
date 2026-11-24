// -*- coding: utf-8 -*-
// static/js/tween.js
// Statutory Kinetic Studio - Motion, Tweening & Scene Graph System
// Deterministic master clock state S = f(timeMs), 3-phase timing with 35% SETTLE hold, and keyed-actor graph.

(function() {
  const TWEEN = {
    // 1. Math Primitives
    clamp(val, min = 0, max = 1) {
      return Math.min(Math.max(val, min), max);
    },

    lerp(a, b, t) {
      return a + (b - a) * t;
    },

    remap(val, inMin, inMax, outMin, outMax) {
      const t = this.clamp((val - inMin) / (inMax - inMin), 0, 1);
      return outMin + (outMax - outMin) * t;
    },

    stagger(index, total, startDelay = 0.05) {
      return index * startDelay;
    },

    // 2. Easing Library (Cubic, Quartic, Overshoot Back, and Spring physics)
    ease: {
      linear(t) { return t; },

      easeOutCubic(t) {
        const f = t - 1;
        return f * f * f + 1;
      },

      easeInOutQuart(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
      },

      easeOutBack(t, s = 1.70158) {
        // If reduced motion is requested, suppress overshoot
        if (window.THEME && window.THEME.prefersReducedMotion()) {
          return TWEEN.ease.easeOutCubic(t);
        }
        const f = t - 1;
        return f * f * ((s + 1) * f + s) + 1;
      },

      easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      },

      // Critically damped spring simulation: f(t) = 1 - e^(-w*t) * cos(v*t)
      spring(t, stiffness = 12, damping = 0.75) {
        if (window.THEME && window.THEME.prefersReducedMotion()) {
          return TWEEN.ease.easeOutCubic(t);
        }
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        const decay = Math.exp(-stiffness * damping * t);
        const osc = Math.cos(stiffness * Math.sqrt(1 - damping * damping) * t);
        return 1 - decay * osc;
      }
    },

    // 3. Phase Structure (ENTER 0-15%, PERFORM 15-65%, SETTLE 65-100%)
    // Settle is 35% of line duration (1575ms of a 4500ms line = guaranteed >= 1.5s hold)
    getLinePhase(lineProgress) {
      const p = this.clamp(lineProgress, 0, 1);
      const ENTER_END = 0.15;
      const PERFORM_END = 0.65;

      let phase = "perform";
      let enterProgress = 0;
      let performProgress = 0;
      let settleProgress = 0;

      if (p < ENTER_END) {
        phase = "enter";
        enterProgress = this.remap(p, 0, ENTER_END, 0, 1);
      } else if (p < PERFORM_END) {
        phase = "perform";
        enterProgress = 1;
        performProgress = this.remap(p, ENTER_END, PERFORM_END, 0, 1);
      } else {
        phase = "settle";
        enterProgress = 1;
        performProgress = 1;
        settleProgress = this.remap(p, PERFORM_END, 1.0, 0, 1);
      }

      return {
        phase,
        progress: p,
        enterT: this.ease.easeOutCubic(enterProgress),
        performT: this.ease.easeInOutQuart(performProgress),
        settleT: this.ease.easeOutCubic(settleProgress),
        rawEnter: enterProgress,
        rawPerform: performProgress,
        rawSettle: settleProgress
      };
    },

    // Sub-phase helper: Map a sub-interval [subStart, subEnd] within the PERFORM phase (0 to 1)
    getSubPhase(performT, subStart = 0, subEnd = 1) {
      return this.clamp((performT - subStart) / (subEnd - subStart), 0, 1);
    },

    // 4. Slide Transition Crossfade (400ms crossfade + 12px slide)
    getSlideTransition(timeMs, transitionDurationMs = 400) {
      if (timeMs >= transitionDurationMs) {
        return { opacity: 1, offsetY: 0, active: false };
      }
      const t = this.clamp(timeMs / transitionDurationMs, 0, 1);
      const isReduced = window.THEME && window.THEME.prefersReducedMotion();
      return {
        opacity: this.ease.easeOutCubic(t),
        offsetY: isReduced ? 0 : (1 - this.ease.easeOutCubic(t)) * 12,
        active: true
      };
    },

    // 5. Idle Oscillations (respects prefers-reduced-motion)
    // Max 1 idle element per scene, max 4% scale or 2px offset
    getIdleOscillation(timeMs, freq = 0.002, amplitude = 2) {
      if (window.THEME && window.THEME.prefersReducedMotion()) {
        return 0;
      }
      return Math.sin(timeMs * freq) * amplitude;
    }
  };

  /**
   * 6. Keyed-Actor Scene Graph
   * Maintains persistent actor properties across sequential lines in a scene.
   * Shared entities (e.g. party cards, background frames, meters) retain their positions
   * and smoothly tween across lines instead of popping or resetting.
   */
  class KeyedActorSceneGraph {
    constructor() {
      this.actors = new Map(); // key -> { current: {}, previous: {}, lastUpdatedLine: -1 }
      this.currentLineIdx = 0;
    }

    reset() {
      this.actors.clear();
      this.currentLineIdx = 0;
    }

    setLineIndex(lineIdx) {
      if (this.currentLineIdx !== lineIdx) {
        if (lineIdx < this.currentLineIdx) {
          // If scrubbing backward, clear actor cache for scrub-order independence (A -> B -> A)
          this.actors.clear();
        } else {
          // Snapshot current properties into previous for all actors
          this.actors.forEach((data) => {
            data.previous = Object.assign({}, data.current);
          });
        }
        this.currentLineIdx = lineIdx;
      }
    }

    /**
     * Registers or updates an actor for the current line.
     * If actor already existed in previous line, it smoothly tweens between previous and target props.
     */
    resolveActor(key, targetProps, enterT = 1.0) {
      let data = this.actors.get(key);
      if (!data) {
        data = {
          current: Object.assign({}, targetProps),
          previous: Object.assign({}, targetProps),
          lastUpdatedLine: this.currentLineIdx
        };
        this.actors.set(key, data);
        return data.current;
      }

      // If actor persisted from a previous line, interpolate from previous to target
      const resolved = {};
      for (const prop in targetProps) {
        const startVal = data.previous[prop];
        const endVal = targetProps[prop];

        if (typeof startVal === "number" && typeof endVal === "number") {
          resolved[prop] = TWEEN.lerp(startVal, endVal, enterT);
        } else {
          resolved[prop] = enterT > 0.5 ? endVal : startVal;
        }
      }

      data.current = resolved;
      data.lastUpdatedLine = this.currentLineIdx;
      return resolved;
    }

    getActor(key) {
      const data = this.actors.get(key);
      return data ? data.current : null;
    }
  }

  // Expose to window
  window.TWEEN = TWEEN;
  window.KeyedActorSceneGraph = KeyedActorSceneGraph;
})();
