/* ==========================================================================
   Main — Application Entry Point
   Orchestrates all modules. Initializes on DOM ready.
   ========================================================================== */

import { isReducedMotion } from './utils.js';
import { initNavigation } from './navigation.js';
import { initSections } from './sections.js';
import { initCursor } from './cursor.js';
import { initTypewriter } from './typewriter.js';
import { initScrollProgress } from './scroll-progress.js';
import { createBackground } from './deep-space.js';

// ES modules with type="module" are deferred — DOM is always ready here
const reducedMotion = isReducedMotion();

createBackground();
initNavigation();
initSections({ reducedMotion });
initCursor();

const roleElement = document.querySelector('.hero__role');
if (roleElement) {
  initTypewriter(roleElement, { reducedMotion });
}

initScrollProgress();

// Make skill items keyboard-focusable (WCAG 2.1.1)
// They have hover effects that should also work for keyboard users.
document.querySelectorAll('.skill-item').forEach((item) => {
  item.setAttribute('tabindex', '0');
});
