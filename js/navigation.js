/* ==========================================================================
   Navigation — Navbar, Mobile Menu, Smooth Scroll, Scroll Spy
   Accessibility: focus trap, inert background, keyboard detection.
   ========================================================================== */

/**
 * Initialize navigation behaviors.
 * @param {object} options - Configuration
 */
export function initNavigation(options = {}) {
  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-menu__link');
  const navLinks = document.querySelectorAll('.navbar__link');
  const sections = document.querySelectorAll('section[id]');
  const scrollIndicator = document.querySelector('.hero__scroll');
  const backToTop = document.querySelector('.footer__back-to-top');

  if (!navbar) return;

  // ── Background elements to make inert when mobile menu is open ─────────
  // Note: navbar is NOT included because it contains the hamburger button
  // which must remain focusable to close the menu.
  const mainEl = document.querySelector('main');
  const footerEl = document.querySelector('footer');
  const backgroundElements = [mainEl, footerEl].filter(Boolean);

  // ── Scroll: Navbar glass effect + scroll indicator fade + scroll spy ───
  let scrollTicking = false;

  function handleScroll() {
    const scrollY = window.scrollY;

    // Navbar glass effect
    if (scrollY > 50) {
      navbar.classList.add('navbar--scrolled');
    } else {
      navbar.classList.remove('navbar--scrolled');
    }

    // Fade scroll indicator
    if (scrollIndicator) {
      if (scrollY > 100) {
        scrollIndicator.classList.remove('hero__scroll--visible');
      } else {
        scrollIndicator.classList.add('hero__scroll--visible');
      }
    }

    // Scroll spy
    const scrollPos = scrollY + navbar.offsetHeight + 100;
    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach((link) => {
          link.classList.remove('navbar__link--active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('navbar__link--active');
          }
        });
      }
    });
  }

  function onScroll() {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        handleScroll();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }

  // ── Mobile Menu: open / close / trap ───────────────────────────────────
  let previousFocus = null;

  function openMobileMenu() {
    previousFocus = document.activeElement;

    mobileMenu.classList.add('mobile-menu--open');
    hamburger.classList.add('hamburger--active');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';

    // Make background inert (WCAG 2.4.3 — prevent focus escaping)
    backgroundElements.forEach((el) => el.setAttribute('inert', ''));

    // Focus first focusable element inside the menu
    const closeBtn = mobileMenu.querySelector('.mobile-menu__close');
    if (closeBtn) closeBtn.focus();
  }

  function closeMobileMenu() {
    mobileMenu.classList.remove('mobile-menu--open');
    hamburger.classList.remove('hamburger--active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';

    // Remove inert from background
    backgroundElements.forEach((el) => el.removeAttribute('inert'));

    // Restore focus to the element that opened the menu (WCAG 2.4.3)
    if (previousFocus && previousFocus.focus) {
      previousFocus.focus();
    }
  }

  function toggleMobileMenu() {
    if (mobileMenu.classList.contains('mobile-menu--open')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  // ── Focus trap: keep Tab inside mobile menu when open ──────────────────
  function handleFocusTrap(e) {
    if (!mobileMenu.classList.contains('mobile-menu--open')) return;
    if (e.key !== 'Tab') return;

    const focusable = mobileMenu.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function handleEscapeKey(e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('mobile-menu--open')) {
      closeMobileMenu();
    }
  }

  // ── Smooth Scroll ───────────────────────────────────────────────────────
  function scrollToSection(e) {
    // Allow Ctrl+click / middle-click to open in new tab (WCAG 2.1.1)
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;

    e.preventDefault();
    const targetId = e.currentTarget.getAttribute('href');
    const target = document.querySelector(targetId);
    if (target) {
      const offset = navbar.offsetHeight;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  // ── Back to top ─────────────────────────────────────────────────────────
  function handleBackToTop(e) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Keyboard navigation detection ──────────────────────────────────────
  // When user tabs/clicks, add/remove class on body so CSS can hide
  // the custom cursor during keyboard navigation (WCAG 2.4.7).
  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      document.body.classList.add('has-keyboard-focus');
    }
  }

  function handleMouseDown() {
    document.body.classList.remove('has-keyboard-focus');
  }

  // ── Bind all event listeners ────────────────────────────────────────────
  window.addEventListener('scroll', onScroll, { passive: true });
  handleScroll();

  if (hamburger) {
    hamburger.addEventListener('click', toggleMobileMenu);
  }

  if (mobileMenu) {
    const closeBtn = mobileMenu.querySelector('.mobile-menu__close');
    if (closeBtn) closeBtn.addEventListener('click', closeMobileMenu);
  }

  mobileLinks.forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
    link.addEventListener('click', scrollToSection);
  });

  navLinks.forEach((link) => link.addEventListener('click', scrollToSection));

  document.addEventListener('keydown', handleEscapeKey);
  document.addEventListener('keydown', handleFocusTrap);

  if (backToTop) {
    backToTop.addEventListener('click', handleBackToTop);
  }

  // Keyboard detection
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('mousedown', handleMouseDown);

  return {
    destroy() {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('keydown', handleFocusTrap);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);

      // Remove inert if menu was open
      backgroundElements.forEach((el) => el.removeAttribute('inert'));

      if (hamburger) {
        hamburger.removeEventListener('click', toggleMobileMenu);
      }

      if (mobileMenu) {
        const closeBtn = mobileMenu.querySelector('.mobile-menu__close');
        if (closeBtn) closeBtn.removeEventListener('click', closeMobileMenu);
      }

      mobileLinks.forEach((link) => {
        link.removeEventListener('click', closeMobileMenu);
        link.removeEventListener('click', scrollToSection);
      });

      navLinks.forEach((link) => link.removeEventListener('click', scrollToSection));

      if (backToTop) {
        backToTop.removeEventListener('click', handleBackToTop);
      }
    },
  };
}
