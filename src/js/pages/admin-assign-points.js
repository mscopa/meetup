import ExternalServices from "../services/ExternalServices.mjs";
import { select, onDOMLoaded } from "../utils/helpers.js";
import { showModal } from "../utils/modal.js";
import { loadHeader } from "../utils/dom-loader.js";

// --- Selectores ---
const form = select("#assign-points-form");
const companySelect = select("#company-select");
const reasonInput = select("#reason");
const scoreInput = select("#score-amount");
const coinInput = select("#coin-amount");
const historyList = select("#earnings-list");
const paginationControls = select("#pagination-controls");

// --- Lógica de Renderizado ---
function populateCompanySelect(companies) {
  companySelect.innerHTML =
    '<option value="">-- Elegir una compañía --</option>';
  companies.forEach((company) => {
    const option = document.createElement("option");
    option.value = company.id;
    option.textContent = `${company.number}. ${company.name}`;
    companySelect.appendChild(option);
  });
}

function renderHistory(earnings) {
  if (earnings.length === 0) {
    historyList.innerHTML = "<p>No hay asignaciones registradas.</p>";
    return;
  }
  historyList.innerHTML = earnings.map(createEarningItem).join("");
}

function createEarningItem(earning) {
  return `
    <div class="earning-item">
      <p class="earning-item__reason">${earning.reason}</p>
      <p class="earning-item__meta">
        Para: <strong>${earning.company.name}</strong> | 
        Por: <strong>${earning.administrator.first_name} ${earning.administrator.last_name}</strong>
      </p>
      <div class="earning-item__details">
        <span class="earning-item__value earning-item__value--score">Puntos: ${earning.score_amount}</span>
        <span class="earning-item__value earning-item__value--coins">Monedas: ${earning.coin_amount}</span>
      </div>
    </div>
  `;
}

function renderPagination(meta, links) {
  paginationControls.innerHTML = meta.links
    .map((link) => {
      if (!link.url) {
        return `<span class="pagination__link pagination__link--disabled">${link.label}</span>`;
      }
      const isActive = link.active ? "pagination__link--active" : "";
      return `<button class="pagination__link ${isActive}" data-url="${link.url}">${link.label}</button>`;
    })
    .join("");
}

// --- Lógica Principal ---
async function loadHistory(url = "/earnings") {
  try {
    historyList.innerHTML = "<p>Cargando historial...</p>"; // Mostrar carga
    const response = await ExternalServices.getEarningsHistory(url);
    renderHistory(response.data);
    renderPagination(response.meta, response.links); // Conectamos la paginación
  } catch (error) {
    console.error("Error al cargar historial:", error);
    historyList.innerHTML = "<p>No se pudo cargar el historial.</p>";
  }
}

async function initPage() {
  try {
    const [companiesResponse] = await Promise.all([
      ExternalServices.getCompanyList(),
      loadHistory(),
    ]);
    populateCompanySelect(companiesResponse);
  } catch (error) {
    console.error("Error al inicializar la página:", error);
  }
}

function setupFormListener() {
  // Verificamos que el formulario exista antes de agregar el listener
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = select("#submit-btn");

    // 1. Recolectamos los datos del formulario
    const data = {
      company_id: companySelect.value,
      reason: reasonInput.value.trim(),
      score_amount: parseInt(scoreInput.value) || 0,
      coin_amount: parseInt(coinInput.value) || 0,
    };

    // 2. Validación simple en el frontend
    if (!data.company_id || !data.reason) {
      showModal(
        "Error de Validación",
        "<p>Por favor, seleccioná una compañía y escribí una razón.</p>",
      );
      return;
    }

    if (data.score_amount === 0 && data.coin_amount === 0) {
      showModal(
        "Error de Validación",
        "<p>Debes asignar al menos 1 punto o 1 moneda.</p>",
      );
      return;
    }

    // 3. Deshabilitamos el botón para evitar envíos múltiples
    submitBtn.disabled = true;
    submitBtn.textContent = "Asignando...";

    // 4. Usamos try/catch/finally para manejar la llamada a la API
    try {
      const response = await ExternalServices.createEarning(data);
      showModal("¡Éxito!", `<p>${response.message}</p>`);

      form.reset(); // Limpiamos el formulario
      loadHistory(); // Recargamos el historial para ver el nuevo registro al instante
      loadHeader(); // Recargamos el header para actualizar las monedas de todos
    } catch (error) {
      console.error("Error al asignar puntos:", error);
      showModal(
        "Error",
        "<p>No se pudieron asignar los puntos. Revisá los datos e intentá de nuevo.</p>",
      );
    } finally {
      // 5. Se ejecuta siempre, haya éxito o error
      submitBtn.disabled = false;
      submitBtn.textContent = "Asignar";
    }
  });

  // La lógica de paginación se mantiene igual
  paginationControls.addEventListener("click", (e) => {
    const target = e.target.closest("[data-url]");
    if (!target) return;
    const fullUrl = target.dataset.url;
    const endpoint = new URL(fullUrl).pathname + new URL(fullUrl).search;
    loadHistory(endpoint);
  });

  paginationControls.addEventListener("click", (e) => {
    const target = e.target.closest("[data-url]");
    if (!target) return;
    const fullUrl = target.dataset.url;
    const endpoint = new URL(fullUrl).pathname + new URL(fullUrl).search;
    loadHistory(endpoint); // Llamamos a loadHistory con la nueva URL
  });
}

onDOMLoaded(() => {
  initPage();
  setupFormListener();
});
