export function initCurrentYear() {
  const yearElements = document.querySelectorAll(".site-footer time");

  if (!yearElements.length) return;

  const year = String(new Date().getFullYear());

  yearElements.forEach((element) => {
    element.textContent = year;
    element.setAttribute("datetime", year);
  });
}

export function initWhatsAppContact() {
  const whatsappUrl = "https://wa.me/573027514244";
  const widget = document.createElement("div");
  widget.className = "whatsapp-contact";
  widget.innerHTML = `
    <section class="whatsapp-panel flow" id="whatsapp-contact-panel" aria-labelledby="whatsapp-contact-title" hidden>
      <h2 id="whatsapp-contact-title">Hablemos</h2>
      <p>Escríbeme por WhatsApp para conversar sobre oportunidades y proyectos.</p>
      <a class="button button--primary" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>
      <a class="text-link" href="mailto:solanilla07@gmail.com">También puedes escribirme por email</a>
    </section>
    <a class="whatsapp-orb" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" aria-label="Abrir chat de WhatsApp con Andrés Solanilla">
      <svg viewBox="0 0 32 32" width="30" height="30" fill="none" aria-hidden="true"><path d="M26 15.5a10.5 10.5 0 0 1-15.7 9.1L5 26l1.4-5.1A10.5 10.5 0 1 1 26 15.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 10.5c-.5-.4-1.6.7-1.6 1.8 0 3.7 5 8.1 8.2 8.1 1.1 0 2.3-1.2 1.9-1.8l-2.3-1.4c-.4-.2-.8.7-1.3.7-1.1-.2-3.2-2.2-3.4-3.2-.1-.5.8-1 .6-1.5Z" fill="currentColor"/></svg>
    </a>`;
  document.body.append(widget);
  const panel = widget.querySelector(".whatsapp-panel");
  const close = () => { panel.hidden = true; };
  widget.addEventListener("mouseenter", () => { panel.hidden = false; });
  widget.addEventListener("mouseleave", close);
  widget.addEventListener("focusin", () => { panel.hidden = false; });
  widget.addEventListener("focusout", (event) => {
    if (!widget.contains(event.relatedTarget)) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  document.addEventListener("click", (event) => {
    if (!widget.contains(event.target)) close();
  });
}
