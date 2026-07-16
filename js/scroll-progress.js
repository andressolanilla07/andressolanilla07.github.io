/* ==========================================================================
   ScrollProgress — Top-of-page progress bar
   Shows how far the user has scrolled through the page.
   ========================================================================== */

/**
 * Initialize the scroll progress indicator.
 * @param {object} options - Configuration
 */
export function initScrollProgress(options = {}) {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;

  let ticking = false;

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.transform = `scaleX(${progress / 100})`;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  updateProgress();

  return {
    destroy() {
      window.removeEventListener('scroll', onScroll);
    },
  };
}
