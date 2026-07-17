const REVEAL_SELECTOR = "[data-reveal], .reveal";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function initSectionReveals() {
  const elements = [...document.querySelectorAll(REVEAL_SELECTOR)];
  const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;

  if (!elements.length || prefersReducedMotion || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.animate(
          [
            { opacity: 0, transform: "translateY(12px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: 500,
            easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
            fill: "both",
          },
        );
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8%", threshold: 0.12 },
  );

  elements.forEach((element) => observer.observe(element));
}
