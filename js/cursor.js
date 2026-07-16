/* ==========================================================================
   Cursor — Custom Cursor with Emerald Glow
   Follows mouse with smooth lerp, glows on interactive elements.
   Disabled on touch devices and when prefers-reduced-motion is set.
   ========================================================================== */

import { isTouchDevice, isReducedMotion, lerp } from './utils.js';

/**
 * Initialize custom cursor.
 * @param {object} options - Configuration
 */
export function initCursor(options = {}) {
  if (isTouchDevice() || isReducedMotion()) return;

  const cursor = document.querySelector('.custom-cursor');
  if (!cursor) return;

  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;
  let animationId = null;
  let isVisible = true;
  let isHovering = false;

  const SIZE_DEFAULT = 6;   // Half of 12px default
  const SIZE_HOVER = 16;    // Half of 32px hover size
  const LERP_FACTOR = 0.15;

  const interactives = 'a, button, .card, .skill-item, .contact__social-link, .btn';

  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  function onMouseOver(e) {
    if (e.target.closest(interactives)) {
      isHovering = true;
      cursor.classList.add('custom-cursor--hover');
    }
  }

  function onMouseOut(e) {
    if (e.target.closest(interactives)) {
      isHovering = false;
      cursor.classList.remove('custom-cursor--hover');
    }
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      isVisible = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    } else {
      isVisible = true;
      animate();
    }
  }

  function animate() {
    if (!isVisible) return;

    cursorX = lerp(cursorX, mouseX, LERP_FACTOR);
    cursorY = lerp(cursorY, mouseY, LERP_FACTOR);

    const offset = isHovering ? SIZE_HOVER : SIZE_DEFAULT;
    cursor.style.transform = `translate(${cursorX - offset}px, ${cursorY - offset}px)`;

    animationId = requestAnimationFrame(animate);
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('mouseover', onMouseOver);
  document.addEventListener('mouseout', onMouseOut);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  animate();

  return {
    destroy() {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    },
  };
}
