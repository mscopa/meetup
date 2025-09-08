import { select } from "./helpers.js";

let overlay, modal, titleEl, contentEl;

export function showModal(title, contentHtml, onReadyCallback) {
  if (!overlay) {
    overlay = select("#app-modal-overlay");
    modal = select("#app-modal");
    titleEl = select("#modal-title");
    contentEl = select("#modal-content");
  }

  if (!overlay) {
    console.error("El HTML del modal no se encuentra en esta página.");
    return;
  }

  titleEl.textContent = title;
  contentEl.innerHTML = contentHtml;
  overlay.classList.remove("hidden");

  if (onReadyCallback && typeof onReadyCallback === "function") {
    onReadyCallback(contentEl);
  }
}

export function hideModal() {
  if (overlay) {
    overlay.classList.add("hidden");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = select("#modal-close-btn");
  const overlayEl = select("#app-modal-overlay");

  if (closeBtn) {
    closeBtn.addEventListener("click", hideModal);
  }
  if (overlayEl) {
    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl) {
        hideModal();
      }
    });
  }
});
