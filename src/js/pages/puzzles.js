import ExternalServices from "../services/ExternalServices.mjs";
import AuthState from "../services/AuthState.mjs"; // Importamos AuthState
import { select, onDOMLoaded } from "../utils/helpers.js";

async function initPuzzlesPage() {
  const puzzleListContainer = select("#puzzle-list");
  try {
    // Verificamos los permisos del usuario UNA SOLA VEZ al cargar la página
    const isCounselor = await AuthState.hasAbility("toggle-puzzles");

    const response = await ExternalServices.getPuzzles();
    const puzzles = response.data; // Ya no necesitamos filtrar aquí

    if (puzzles.length === 0) {
      puzzleListContainer.innerHTML =
        "<p>No hay puzzles disponibles en este momento.</p>";
      return;
    }

    puzzleListContainer.innerHTML = puzzles
      .map((puzzle) => createPuzzleCard(puzzle, isCounselor))
      .join("");

    // Si es consejero, añadimos la interactividad a los interruptores
    if (isCounselor) {
      addToggleInteractivity();
    }
  } catch (error) {
    console.error("Error al cargar los puzzles:", error);
    puzzleListContainer.innerHTML =
      "<p>No se pudieron cargar los puzzles. Intentá de nuevo.</p>";
  }
}

function createPuzzleCard(puzzle, isCounselor) {
  // El HTML del interruptor que solo se mostrará si isCounselor es true
  const toggleHtml = `
    <div class="puzzle-card__toggle">
      <span>${puzzle.is_enabled ? "Activado" : "Desactivado"}</span>
      <label class="toggle-switch">
        <input class="toggle-switch__input" type="checkbox" data-puzzle-id="${puzzle.id}" ${puzzle.is_enabled ? "checked" : ""}>
        <span class="toggle-switch__slider"></span>
      </label>
    </div>
  `;

  return `
    <a href="/puzzles/${puzzle.id}/" class="puzzle-card ${!puzzle.is_enabled ? "puzzle-card--disabled" : ""}">
      <div class="puzzle-card__header">
        <h2 class="puzzle-card__title">${puzzle.title}</h2>
        ${isCounselor ? toggleHtml : `<span class="puzzle-card__type">${puzzle.type}</span>`}
      </div>
      <p class="puzzle-card__description">${puzzle.description}</p>
    </a>
  `;
}

function addToggleInteractivity() {
  const puzzleList = select("#puzzle-list");
  puzzleList.addEventListener("change", async (e) => {
    if (e.target.matches(".toggle-switch__input")) {
      const puzzleId = e.target.dataset.puzzleId;
      const isEnabled = e.target.checked;

      try {
        // Bloqueamos el enlace para no navegar al hacer clic en el toggle
        e.target
          .closest("a")
          .addEventListener("click", (ev) => ev.preventDefault(), {
            once: true,
          });

        await ExternalServices.togglePuzzleStatus(puzzleId, isEnabled);

        // Actualizamos el texto "Activado/Desactivado"
        const label = e.target
          .closest(".puzzle-card__toggle")
          .querySelector("span");
        label.textContent = isEnabled ? "Activado" : "Desactivado";
      } catch (error) {
        console.error("Error al cambiar el estado del puzzle:", error);
        alert("No se pudo cambiar el estado del puzzle.");
        // Revertimos el checkbox si falla la API
        e.target.checked = !isEnabled;
      }
    }
  });
}

onDOMLoaded(initPuzzlesPage);
