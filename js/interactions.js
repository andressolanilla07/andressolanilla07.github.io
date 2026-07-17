export function initCurrentYear() {
  const yearElements = document.querySelectorAll(".site-footer time");

  if (!yearElements.length) return;

  const year = String(new Date().getFullYear());

  yearElements.forEach((element) => {
    element.textContent = year;
    element.setAttribute("datetime", year);
  });
}
