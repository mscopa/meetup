import ExternalServices from "../services/ExternalServices.mjs";
import { select, onDOMLoaded } from "../utils/helpers.js";

async function initRankingPage() {
  const container = select("#ranking-list");
  try {
    const response = await ExternalServices.getRanking();
    const companies = response.data;

    if (!companies || companies.length === 0) {
      container.innerHTML = "<p>El ranking no está disponible.</p>";
      return;
    }

    container.innerHTML = companies
      .map((company, index) => {
        const position = index + 1; // El index es 0, la posición es 1
        return createRankingItem(company, position);
      })
      .join("");
  } catch (error) {
    console.error("Error al cargar el ranking:", error);
    container.innerHTML = "<p>No se pudo cargar el ranking.</p>";
  }
}

function createRankingItem(company, position) {
  let positionHtml = `<div class="ranking-item__position">#${position}</div>`;
  let modifierClass = "";

  // Iconos y estilos especiales para el Top 3
  if (position === 1) {
    modifierClass = "ranking-item--first";
    positionHtml = `<div class="ranking-item__icon"><img src="/assets/images/first-place-icon.png" alt="1er Puesto"></div>`;
  } else if (position === 2) {
    modifierClass = "ranking-item--second";
    // Para el 2do puesto, podríamos usar una moneda plateada o un hongo
    positionHtml = `<div class="ranking-item__icon"><img src="/assets/images/second-place-icon.webp" alt="2do Puesto"></div>`;
  } else if (position === 3) {
    modifierClass = "ranking-item--third";
    positionHtml = `<div class="ranking-item__icon"><img src="/assets/images/third-place-icon.webp" alt="3er Puesto"></div>`;
  }

  return `
    <div class="ranking-item ${modifierClass}">
      ${positionHtml}
      <div class="ranking-item__details">
        <div class="ranking-item__name">${company.number}. ${company.name}</div>
        <div class="ranking-item__stats">
          <span><strong>Puntaje:</strong> ${company.score}</span>
          <span><strong>Monedas:</strong> ${company.coins}</span>
        </div>
      </div>
    </div>
  `;
}

onDOMLoaded(initRankingPage);
