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
  const widget = document.createElement("div");
  widget.className = "whatsapp-contact";
  widget.innerHTML = `
    <section class="whatsapp-panel flow" id="whatsapp-contact-panel" aria-labelledby="whatsapp-contact-title" hidden>
      <h2 id="whatsapp-contact-title">Hablemos</h2>
      <p>Encuéntrame en WhatsApp como <strong>@andressolanilla07</strong>.</p>
      <p>El enlace directo aún está pendiente de verificación.</p>
      <button class="button button--primary" type="button" data-copy-username>Copiar usuario</button>
      <a class="text-link" href="mailto:solanilla07@gmail.com">También puedes escribirme por email</a>
      <p class="whatsapp-status" role="status" aria-live="polite"></p>
    </section>
    <button class="whatsapp-orb" type="button" aria-expanded="false" aria-controls="whatsapp-contact-panel" aria-label="Contacto por WhatsApp">
      <svg viewBox="0 0 32 32" width="30" height="30" fill="none" aria-hidden="true"><path d="M26 15.5a10.5 10.5 0 0 1-15.7 9.1L5 26l1.4-5.1A10.5 10.5 0 1 1 26 15.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 10.5c-.5-.4-1.6.7-1.6 1.8 0 3.7 5 8.1 8.2 8.1 1.1 0 2.3-1.2 1.9-1.8l-2.3-1.4c-.4-.2-.8.7-1.3.7-1.1-.2-3.2-2.2-3.4-3.2-.1-.5.8-1 .6-1.5Z" fill="currentColor"/></svg>
    </button>`;
  document.body.append(widget);
  const toggle = widget.querySelector(".whatsapp-orb");
  const panel = widget.querySelector(".whatsapp-panel");
  const copy = widget.querySelector("[data-copy-username]");
  const status = widget.querySelector(".whatsapp-status");
  const close = (restoreFocus = false) => {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    if (restoreFocus) toggle.focus();
  };
  toggle.addEventListener("click", () => {
    if (!panel.hidden) return close();
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    copy.focus();
  });
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("@andressolanilla07");
      status.textContent = "Usuario copiado.";
    } catch {
      status.textContent = "Puedes seleccionar y copiar el usuario de arriba.";
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) close(true);
  });
  document.addEventListener("click", (event) => {
    if (!widget.contains(event.target)) close();
  });
  widget.addEventListener("focusout", (event) => {
    if (!widget.contains(event.relatedTarget)) close();
  });
}
