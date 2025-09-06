// src/js/pages/schedule.js
import ExternalServices from "../services/ExternalServices.mjs";
import { select, selectAll } from "../utils/helpers.js";

// Función principal que se ejecuta al cargar la página
async function initSchedule() {
  const container = select("#schedule-container");

  try {
    const response = await ExternalServices.getSchedule();
    const activities = response.data;

    if (!activities || activities.length === 0) {
      container.innerHTML = "<p>No hay actividades programadas.</p>";
      return;
    }

    // Limpiamos el mensaje de "Cargando..."
    container.innerHTML = "";

    // "Dibujamos" cada actividad en el DOM
    activities.forEach((activity) => {
      const activityElement = createActivityElement(activity);
      container.appendChild(activityElement);
    });

    // Añadimos la funcionalidad de acordeón a todos los items
    addAccordionFunctionality();

    updateAllStatuses();
    setInterval(updateAllStatuses, 30000);
  } catch (error) {
    console.error("Error al cargar el cronograma:", error);
    container.innerHTML =
      "<p>Hubo un problema al cargar el cronograma. Por favor, intentá de nuevo.</p>";
  }
}

// Función que crea el elemento HTML para una sola actividad
function createActivityElement(activity) {
  const item = document.createElement("div");
  item.className = "schedule-item";

  // --- NUEVO: Guardamos las fechas en el elemento para poder revisarlas después ---
  item.dataset.startDate = activity.start_date;
  item.dataset.endDate = activity.end_date;

  const startDate = new Date(activity.start_date);
  const endDate = new Date(activity.end_date);
  const timeString = `${formatTime(startDate)} - ${formatTime(endDate)}`;

  item.innerHTML = `
    <div class="schedule-item__header">
      <div class="schedule-item__time">${timeString}</div>
      <div class="schedule-item__title">${activity.title}</div>
    </div>
    <div class="schedule-item__details">
      ${generateDetailsHTML(activity.activityDetails)}
    </div>
  `;
  return item;
}

// --- NUEVO: Función para actualizar los estados de TODAS las actividades ---
function updateAllStatuses() {
  console.log("Actualizando estados..."); // Podés ver esto en la consola cada 30 seg
  const now = new Date();
  selectAll(".schedule-item").forEach((item) => {
    const startDate = new Date(item.dataset.startDate);
    const endDate = new Date(item.dataset.endDate);

    // Limpiamos clases de estado previas
    item.classList.remove(
      "schedule-item--upcoming",
      "schedule-item--in-progress",
      "schedule-item--finished",
    );

    // Aplicamos la clase correcta
    if (now > endDate) {
      item.classList.add("schedule-item--finished");
    } else if (now >= startDate && now <= endDate) {
      item.classList.add("schedule-item--in-progress");
    } else {
      item.classList.add("schedule-item--upcoming");
    }
  });
}

// --- MEJORADO: Función de formato de hora para que sea consistente ---
function formatTime(date) {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? "P. M." : "A. M.";

  hours = hours % 12;
  hours = hours ? hours : 12; // La hora 0 debe ser 12

  minutes = minutes < 10 ? "0" + minutes : minutes; // Añadir cero inicial a los minutos
  hours = hours < 10 ? "0" + hours : hours; // Añadir cero inicial a la hora

  return `${hours}:${minutes} ${ampm}`;
}

// Función que genera el HTML para los detalles de una actividad
function generateDetailsHTML(details) {
  if (!details || details.length === 0) {
    return "<div><p>No hay detalles para esta actividad.</p></div>";
  }

  // Envolvemos toda la salida en un único <div> para que el CSS Grid funcione
  const innerHtml = details
    .map(
      (detail) => `
    <div class="detail-section">
      <h4 class="detail-section__title">${detail.detail_type}</h4>
      <ul class="detail-section__list">
        ${detail.activityDetailContents.map((content) => `<li>${content.detail_content}</li>`).join("")}
      </ul>
    </div>
  `,
    )
    .join("");

  return `<div>${innerHtml}</div>`;
}

// Función que añade el evento de click a cada item para el efecto acordeón
function addAccordionFunctionality() {
  const items = selectAll(".schedule-item");
  items.forEach((item) => {
    item.addEventListener("click", () => {
      // Opcional: Cerrar otros items al abrir uno nuevo
      // items.forEach(otherItem => {
      //   if (otherItem !== item) otherItem.classList.remove('schedule-item--active');
      // });
      item.classList.toggle("schedule-item--active");
    });
  });
}

// Iniciar todo
initSchedule();
