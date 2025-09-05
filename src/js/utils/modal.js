// src/js/utils/modal.js
import { select } from "./helpers.js";

// Dejamos las variables aquí para que sean accesibles en todo el módulo
let overlay, modal, titleEl, contentEl;

/**
 * Muestra el modal con un título y contenido HTML.
 * Acepta un callback opcional que se ejecuta después de renderizar el contenido.
 * @param {string} title
 * @param {string} contentHtml
 * @param {function} onReadyCallback - (Opcional) Se ejecuta cuando el contenido está listo.
 */
export function showModal(title, contentHtml, onReadyCallback) {
  // Si las variables no están inicializadas, las buscamos.
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

  // Si nos pasaron una función de callback, la ejecutamos.
  // Esto es clave para darle vida al contenido que acabamos de insertar.
  if (onReadyCallback && typeof onReadyCallback === "function") {
    onReadyCallback(contentEl);
  }
}

export function hideModal() {
  if (overlay) {
    overlay.classList.add("hidden");
  }
}

// Inicializamos los eventos de cierre una sola vez cuando el DOM está listo
document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = select("#modal-close-btn");
  const overlayEl = select("#app-modal-overlay"); // Usamos una variable local

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
