/* ==========================================================================
   Typewriter — Hero Text Typing Effect
   Cycles through multiple roles with typing and deleting animation.
   Accessibility: announces completed roles via aria-live region, not
   intermediate characters.
   ========================================================================== */

const ROLES = [
  'Java Developer',
  'Spring Boot Developer',
  'Backend Engineer',
  'Full Stack Developer',
  'Software Developer',
];

const TYPING_SPEED = 80;
const DELETING_SPEED = 40;
const PAUSE_AFTER_TYPE = 2000;
const PAUSE_AFTER_DELETE = 400;

/**
 * Initialize typewriter effect on the hero role element.
 * @param {HTMLElement} element - The element to type into
 * @param {object} options - Configuration
 */
export function initTypewriter(element, options = {}) {
  if (!element) return;

  const roles = options.roles || ROLES;
  const reducedMotion = options.reducedMotion || false;

  // Live region for screen reader announcements (visually hidden)
  const announceEl = document.getElementById('typewriter-announce');

  // Remove existing cursor from DOM
  const existingCursor = element.querySelector('.hero__role-cursor');
  if (existingCursor) existingCursor.remove();

  // Clear element and build structure
  element.textContent = '';

  // Create text node (avoids DOM thrashing on every character)
  const textNode = document.createTextNode('');
  element.appendChild(textNode);

  // Create cursor
  const cursorEl = document.createElement('span');
  cursorEl.className = 'hero__role-cursor';
  cursorEl.setAttribute('aria-hidden', 'true');
  element.appendChild(cursorEl);

  // Reduced motion: show first role immediately, no animation
  if (reducedMotion) {
    textNode.nodeValue = roles[0];
    if (announceEl) announceEl.textContent = roles[0];
    return { destroy() {} };
  }

  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let timeoutId = null;

  function type() {
    const currentRole = roles[roleIndex];

    if (isDeleting) {
      charIndex--;
    } else {
      charIndex++;
    }

    textNode.nodeValue = currentRole.substring(0, charIndex);

    // Announce completed role to screen readers (WCAG 4.1.3)
    if (!isDeleting && charIndex === currentRole.length && announceEl) {
      announceEl.textContent = currentRole;
    }

    let nextDelay = isDeleting ? DELETING_SPEED : TYPING_SPEED;

    if (!isDeleting && charIndex === currentRole.length) {
      nextDelay = PAUSE_AFTER_TYPE;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      nextDelay = PAUSE_AFTER_DELETE;
    }

    timeoutId = setTimeout(type, nextDelay);
  }

  timeoutId = setTimeout(type, 800);

  return {
    destroy() {
      if (timeoutId) clearTimeout(timeoutId);
    },
  };
}
