const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function initPageEntry() {
  const page = document.querySelector("main");
  const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;

  if (!page || prefersReducedMotion || typeof page.animate !== "function") return;

  page.animate(
    [
      { opacity: 0, transform: "translateY(10px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    {
      duration: 450,
      easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
      fill: "both",
    },
  );
}
