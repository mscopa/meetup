import ExternalServices from "../services/ExternalServices.mjs";
import { select, onDOMLoaded } from "../utils/helpers.js";
import { showModal } from "../utils/modal.js";

function initCreateAnnouncementForm() {
  const form = select("#create-announcement-form");
  const submitBtn = select("#submit-btn");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = select("#title").value.trim();
    const message = select("#message").value.trim();

    if (!title || !message) {
      showModal("Error", "<p>Por favor, completá todos los campos.</p>");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Publicando...";

    try {
      await ExternalServices.createAnnouncement(title, message);

      showModal("¡Éxito!", "<p>El anuncio fue publicado correctamente.</p>");

      setTimeout(() => {
        window.location.href = "/admin/";
      }, 2000);
    } catch (error) {
      console.error("Error al crear anuncio:", error);
      showModal(
        "Error",
        `<p>No se pudo publicar el anuncio. ${error.message || ""}</p>`,
      );
      submitBtn.disabled = false;
      submitBtn.textContent = "Publicar Anuncio";
    }
  });
}

onDOMLoaded(initCreateAnnouncementForm);
