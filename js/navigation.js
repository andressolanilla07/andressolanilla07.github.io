const MOBILE_QUERY = "(max-width: 56rem)";

function addMenuIcon(toggle) {
  const label = toggle.querySelector("span");

  if (!label) return;

  label.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" focusable="false">
      <path d="M3 6h16M3 11h16M3 16h16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"/>
    </svg>`;
  toggle.setAttribute("aria-label", "Abrir menú");
}

export function initMobileNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const navigation = document.querySelector("#site-navigation");
  const header = document.querySelector(".site-header");

  if (!toggle || !navigation) return;

  const mobileQuery = window.matchMedia(MOBILE_QUERY);
  let isOpen = false;

  const closeMenu = ({ restoreFocus = false } = {}) => {
    isOpen = false;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
    navigation.hidden = mobileQuery.matches;
    header?.classList.remove("is-menu-open");

    if (restoreFocus && mobileQuery.matches) toggle.focus();
  };

  const openMenu = () => {
    isOpen = true;
    navigation.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Cerrar menú");
    header?.classList.add("is-menu-open");
  };

  const syncViewport = () => {
    isOpen = false;
    toggle.hidden = !mobileQuery.matches;
    toggle.style.display = mobileQuery.matches ? "grid" : "";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
    navigation.hidden = mobileQuery.matches;
    header?.classList.remove("is-menu-open");
  };

  addMenuIcon(toggle);
  syncViewport();

  toggle.addEventListener("click", () => {
    if (isOpen) closeMenu({ restoreFocus: true });
    else openMenu();
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a[href]") && mobileQuery.matches) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) closeMenu({ restoreFocus: true });
  });

  mobileQuery.addEventListener("change", syncViewport);
}

export function initNavbarScrollState() {
  const header = document.querySelector(".site-header");

  if (!header) return;

  let ticking = false;

  const update = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 16);
    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
}
