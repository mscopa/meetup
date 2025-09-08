import ExternalServices from "../services/ExternalServices.mjs";
import { select, selectAll } from "../utils/helpers.js";

async function initSchedule() {
  const container = select("#schedule-container");

  try {
    const response = await ExternalServices.getSchedule();
    const activities = response.data;

    if (!activities || activities.length === 0) {
      container.innerHTML = "<p>No hay actividades programadas.</p>";
      return;
    }

    container.innerHTML = "";

    activities.forEach((activity) => {
      const activityElement = createActivityElement(activity);
      container.appendChild(activityElement);
    });

    addAccordionFunctionality();

    updateAllStatuses();
    setInterval(updateAllStatuses, 30000);
  } catch (error) {
    console.error("Error al cargar el cronograma:", error);
    container.innerHTML =
      "<p>Hubo un problema al cargar el cronograma. Por favor, intentá de nuevo.</p>";
  }
}

function createActivityElement(activity) {
  const item = document.createElement("div");
  item.className = "schedule-item";

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

function updateAllStatuses() {
  console.log("Actualizando estados...");
  const now = new Date();
  selectAll(".schedule-item").forEach((item) => {
    const startDate = new Date(item.dataset.startDate);
    const endDate = new Date(item.dataset.endDate);

    item.classList.remove(
      "schedule-item--upcoming",
      "schedule-item--in-progress",
      "schedule-item--finished",
    );

    if (now > endDate) {
      item.classList.add("schedule-item--finished");
    } else if (now >= startDate && now <= endDate) {
      item.classList.add("schedule-item--in-progress");
    } else {
      item.classList.add("schedule-item--upcoming");
    }
  });
}

function formatTime(date) {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? "P. M." : "A. M.";

  hours = hours % 12;
  hours = hours ? hours : 12; 

  minutes = minutes < 10 ? "0" + minutes : minutes;
  hours = hours < 10 ? "0" + hours : hours;

  return `${hours}:${minutes} ${ampm}`;
}

function generateDetailsHTML(details) {
  if (!details || details.length === 0) {
    return "<div><p>No hay detalles para esta actividad.</p></div>";
  }

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

function addAccordionFunctionality() {
  const items = selectAll(".schedule-item");
  items.forEach((item) => {
    item.addEventListener("click", () => {
      item.classList.toggle("schedule-item--active");
    });
  });
}

initSchedule();
