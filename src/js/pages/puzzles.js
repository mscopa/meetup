// src/js/pages/puzzles.js
import ExternalServices from "../services/ExternalServices.mjs";
import { select } from "../utils/helpers.js";
import { onDOMLoaded } from "../utils/helpers.js";

async function initPuzzlesPage() {
  const puzzleListContainer = select("#puzzle-list");
  try {
    const response = await ExternalServices.getPuzzles();

    // Filtramos para mostrar solo los puzzles habilitados
    const enabledPuzzles = response.data.filter((puzzle) => puzzle.is_enabled);

    if (enabledPuzzles.length === 0) {
      puzzleListContainer.innerHTML =
        "<p>No hay puzzles disponibles en este momento.</p>";
      return;
    }

    // Limpiamos el mensaje de carga y renderizamos las tarjetas
    puzzleListContainer.innerHTML = enabledPuzzles
      .map((puzzle) => createPuzzleCard(puzzle))
      .join("");
  } catch (error) {
    console.error("Error al cargar los puzzles:", error);
    puzzleListContainer.innerHTML =
      "<p>No se pudieron cargar los puzzles. Intentá de nuevo.</p>";
  }
}

function createPuzzleCard(puzzle) {
  // Creamos un enlace 'a' para que cada tarjeta sea navegable
  return `
    <a href="/puzzles/${puzzle.id}/" class="puzzle-card">
      <div class="puzzle-card__header">
        <h2 class="puzzle-card__title">${puzzle.title}</h2>
        <span class="puzzle-card__type">${puzzle.type}</span>
      </div>
      <p class="puzzle-card__description">${puzzle.description}</p>
    </a>
  `;
}

onDOMLoaded(initPuzzlesPage);
