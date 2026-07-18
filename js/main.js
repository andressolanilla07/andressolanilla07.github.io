import { initMobileNavigation, initNavbarScrollState } from "./navigation.js";
import { initPageEntry } from "./page-transitions.js";
import { initSectionReveals } from "./sections.js";
import { initCurrentYear } from "./interactions.js";

document.documentElement.classList.add("js");

function init() {
  initMobileNavigation();
  initNavbarScrollState();
  initPageEntry();
  initSectionReveals();
  initCurrentYear();
}

init();
