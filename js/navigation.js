const MOBILE_QUERY = "(max-width: 47.99rem)";

function getMenuToggle(header, navigation) {
  const existingToggle = header?.querySelector(".nav-toggle");

  if (existingToggle) return existingToggle;

  const toggle = document.createElement("button");
  toggle.className = "nav-toggle";
  toggle.type = "button";
  toggle.innerHTML = "<span>Menú</span>";
  navigation.before(toggle);
  return toggle;
}

function getMenuBackdrop() {
  const existingBackdrop = document.querySelector(".nav-backdrop");

  if (existingBackdrop) return existingBackdrop;

  const backdrop = document.createElement("button");
  backdrop.className = "nav-backdrop";
  backdrop.type = "button";
  backdrop.hidden = true;
  backdrop.tabIndex = -1;
  backdrop.setAttribute("aria-label", "Cerrar menú");
  document.body.append(backdrop);
  return backdrop;
}

function setScrollLock(isLocked) {
  document.documentElement.classList.toggle("is-menu-open", isLocked);
  document.body.classList.toggle("is-menu-open", isLocked);
}

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
  const header = document.querySelector(".site-header");
  const navigation = header?.querySelector(".site-nav");

  if (!header || !navigation) return;

  if (!navigation.id) navigation.id = "site-navigation";

  const toggle = getMenuToggle(header, navigation);
  const backdrop = getMenuBackdrop();

  const mobileQuery = window.matchMedia(MOBILE_QUERY);
  let isOpen = false;

  toggle.setAttribute("aria-controls", navigation.id);

  const closeMenu = ({ restoreFocus = false } = {}) => {
    isOpen = false;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
    navigation.hidden = mobileQuery.matches;
    backdrop.hidden = true;
    header?.classList.remove("is-menu-open");
    setScrollLock(false);

    if (restoreFocus && mobileQuery.matches) toggle.focus();
  };

  const openMenu = () => {
    isOpen = true;
    navigation.hidden = false;
    backdrop.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Cerrar menú");
    header?.classList.add("is-menu-open");
    setScrollLock(true);
  };

  const syncViewport = () => {
    isOpen = false;
    toggle.hidden = !mobileQuery.matches;
    toggle.style.display = mobileQuery.matches ? "grid" : "";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
    navigation.hidden = mobileQuery.matches;
    backdrop.hidden = true;
    header?.classList.remove("is-menu-open");
    setScrollLock(false);
  };

  addMenuIcon(toggle);
  syncViewport();

  toggle.addEventListener("click", () => {
    if (isOpen) closeMenu({ restoreFocus: true });
    else openMenu();
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a[href]") && mobileQuery.matches) {
      closeMenu({ restoreFocus: true });
    }
  });

  backdrop.addEventListener("click", () => closeMenu({ restoreFocus: true }));

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
