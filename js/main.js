import { initMobileNavigation, initNavbarScrollState } from "./navigation.js";
import { initPageEntry } from "./page-transitions.js";
import { initSectionReveals } from "./sections.js";
import { initCurrentYear } from "./interactions.js";

function init() {
  initMobileNavigation();
  initNavbarScrollState();
  initPageEntry();
  initSectionReveals();
  initCurrentYear();
}

init();
