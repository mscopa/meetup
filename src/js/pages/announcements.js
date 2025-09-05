import ExternalServices from "../services/ExternalServices.mjs";
import { select } from "../utils/helpers.js";
import { onDOMLoaded } from "../utils/helpers.js";

async function initAnnouncementsPage() {
  const container = select("#announcements-container");
  try {
    const response = await ExternalServices.getAnnouncements();
    const announcements = response.data;

    if (!announcements || announcements.length === 0) {
      container.innerHTML = "<p>No hay anuncios por el momento.</p>";
      return;
    }

    // "Marcamos como leído" guardando el ID del anuncio más nuevo
    localStorage.setItem("lastReadAnnouncementId", announcements[0].id);

    // Renderizamos los anuncios
    container.innerHTML = announcements.map(createAnnouncementCard).join("");
  } catch (error) {
    console.error("Error al cargar anuncios:", error);
    container.innerHTML = "<p>No se pudieron cargar los anuncios.</p>";
  }
}

function createAnnouncementCard(announcement) {
  const date = new Date(announcement.created_at);
  const formattedDate = date.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <div class="announcement-card">
      <h2 class="announcement-card__title">${announcement.title}</h2>
      <p class="announcement-card__meta">Publicado el ${formattedDate}</p>
      <p class="announcement-card__message">${announcement.message}</p>
    </div>
  `;
}

onDOMLoaded(initAnnouncementsPage);
