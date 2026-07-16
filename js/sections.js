/* ==========================================================================
   Sections — Scroll Reveal Animations
   Uses Intersection Observer to add .reveal--visible on scroll.
   ========================================================================== */

/**
 * Initialize scroll reveal for all sections.
 * @param {object} options - Configuration
 */
export function initSections(options = {}) {
  const revealElements = document.querySelectorAll('.reveal');
  if (!revealElements.length) return;

  if (options.reducedMotion) {
    revealElements.forEach((el) => el.classList.add('reveal--visible'));
    return { destroy() {} };
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.1,
    }
  );

  revealElements.forEach((el) => observer.observe(el));

  return {
    destroy() {
      observer.disconnect();
    },
  };
}
