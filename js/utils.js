/* ==========================================================================
   Utils — Shared Helper Functions
   Single responsibility: reusable utility functions for all modules.
   ========================================================================== */

/**
 * Throttle function execution to once per `delay` ms.
 * @param {Function} fn - Function to throttle
 * @param {number} delay - Minimum ms between calls
 * @returns {Function} Throttled function
 */
export function throttle(fn, delay) {
  let lastCall = 0;
  let timeoutId = null;

  return function (...args) {
    const now = Date.now();
    const remaining = delay - (now - lastCall);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Linear interpolation between two values.
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} factor - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

/**
 * Check if user prefers reduced motion. Cached after first call.
 * @returns {boolean} True if reduced motion is preferred
 */
export function isReducedMotion() {
  isReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return isReducedMotion();
}

/**
 * Check if device supports touch. Cached after first call.
 * @returns {boolean} True if touch device
 */
export function isTouchDevice() {
  isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return isTouchDevice();
}
