import ExternalServices from "../services/ExternalServices.mjs";
import { select, onDOMLoaded, debounce } from "../utils/helpers.js";
import { showModal, hideModal } from "../utils/modal.js";

// --- Selectores y Estado Global ---
const listContainer = select("#participant-list");
const searchInput = select("#search-input");
const addParticipantBtn = select("#add-participant-btn");
let allParticipants = [];
let allCompanies = []; // Guardaremos las compañías aquí

// --- Lógica de Renderizado ---
function renderList(participantsToShow) {
  if (participantsToShow.length === 0) {
    listContainer.innerHTML = "<p>No se encontraron participantes.</p>";
    return;
  }
  listContainer.innerHTML = participantsToShow
    .map(createParticipantCard)
    .join("");
}

function createParticipantCard(participant) {
  const isCheckedIn = participant.attended && participant.kit_delivered;
  const cardClass = isCheckedIn ? "participant-card--checked-in" : "";

  return `
    <div class="participant-card ${cardClass}" data-participant-id="${participant.id}">
      <div class="participant-card__info">
        <p class="participant-card__name">${participant.full_name}</p>
        <p class="participant-card__company">
          ${participant.company_display} | Talle: <strong>${participant.tshirt_size}</strong>
        </p>
      </div>
      <div class="participant-card__controls">
        <label class="checkbox-control">
          Asistió
          <input type="checkbox" class="checkin-checkbox" data-type="attended" ${participant.attended ? "checked" : ""}>
        </label>
        <label class="checkbox-control">
          Kit
          <input type="checkbox" class="checkin-checkbox" data-type="kit_delivered" ${participant.kit_delivered ? "checked" : ""}>
        </label>
      </div>
    </div>
  `;
}

// --- Lógica de Interacción ---
function setupSearch() {
  searchInput.addEventListener(
    "input",
    debounce(() => {
      const searchTerm = searchInput.value.toLowerCase();

      const filteredParticipants = allParticipants.filter((p) => {
        // Nos aseguramos de que los campos existan antes de buscar
        const nameMatch =
          p.full_name && p.full_name.toLowerCase().includes(searchTerm);
        // AQUÍ ESTÁ EL CAMBIO: usamos 'company_display' en lugar de 'company_name'
        const companyMatch =
          p.company_display &&
          p.company_display.toLowerCase().includes(searchTerm);

        return nameMatch || companyMatch;
      });

      renderList(filteredParticipants);
    }, 300),
  );
}

function setupCheckinControls() {
  listContainer.addEventListener("change", async (e) => {
    if (!e.target.matches(".checkin-checkbox")) return;

    const card = e.target.closest(".participant-card");
    const participantId = card.dataset.participantId;

    // Obtenemos el estado de AMBOS checkboxes
    const attendedCheckbox = card.querySelector('[data-type="attended"]');
    const kitCheckbox = card.querySelector('[data-type="kit_delivered"]');

    const attended = attendedCheckbox.checked;
    const kitDelivered = kitCheckbox.checked;

    try {
      await ExternalServices.updateCheckinStatus(
        participantId,
        attended,
        kitDelivered,
      );

      // Actualizamos la tarjeta en la lista local para que la búsqueda siga funcionando bien
      const participantInList = allParticipants.find(
        (p) => p.id == participantId,
      );
      participantInList.attended = attended;
      participantInList.kit_delivered = kitDelivered;

      // Actualizamos el estilo visual
      card.classList.toggle(
        "participant-card--checked-in",
        attended && kitDelivered,
      );
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      alert("No se pudo actualizar el estado. Intentá de nuevo.");
      // Revertimos el cambio visual si falla la API
      e.target.checked = !e.target.checked;
    }
  });
}

function setupAddParticipantButton() {
  addParticipantBtn.addEventListener("click", () => {
    // Creamos el HTML del formulario para el modal
    const companyOptions = allCompanies
      .map((c) => `<option value="${c.id}">${c.number}. ${c.name}</option>`)
      .join("");

    const formHtml = `
      <form id="add-participant-form" class="modal-form">
        <div class="form-field">
          <label for="first_name">Nombre</label>
          <input type="text" id="first_name" required class="form-field__input">
        </div>
        <div class="form-field">
          <label for="last_name">Apellido</label>
          <input type="text" id="last_name" required class="form-field__input">
        </div>
        <div class="form-field">
          <label for="tshirt_size">Talle de Remera</label>
          <input type="text" id="tshirt_size" required class="form-field__input">
        </div>
        <div class="form-field">
          <label for="company_id">Compañía</label>
          <select id="company_id" required class="form-field__input">
            <option value="">-- Seleccionar --</option>
            ${companyOptions}
          </select>
        </div>
        <button type="submit" class="btn btn--primary">Registrar y Hacer Check-in</button>
      </form>
    `;

    showModal("Registrar Nuevo Participante", formHtml, () => {
      const form = select("#add-participant-form");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = {
          first_name: select("#first_name").value,
          last_name: select("#last_name").value,
          company_id: select("#company_id").value,
          tshirt_size: select("#tshirt_size").value,
        };

        try {
          const newParticipant = await ExternalServices.createParticipant(data);
          allParticipants.push(newParticipant.data); // Añadimos al final de nuestra lista local
          allParticipants.sort((a, b) =>
            a.full_name.localeCompare(b.full_name),
          ); // Re-ordenamos
          renderList(allParticipants); // Re-dibujamos la lista con el nuevo integrante
          hideModal();
        } catch (error) {
          console.error("Error al crear participante:", error);
          showModal("Error", "<p>No se pudo registrar al participante.</p>");
        }
      });
    });
  });
}

// --- Función de Inicio ---
async function initPage() {
  try {
    const [participantsResponse, companiesResponse] = await Promise.all([
      ExternalServices.getCheckinList(),
      ExternalServices.getCompanyList(),
    ]);

    allParticipants = participantsResponse.data;
    allCompanies = companiesResponse; // Guardamos la lista de compañías

    renderList(allParticipants);
    setupSearch();
    setupCheckinControls();
    setupAddParticipantButton(); // Activamos nuestro nuevo botón
  } catch (error) {
    console.error("Error al cargar la lista de check-in:", error);
    listContainer.innerHTML =
      "<p>No se pudo cargar la lista de participantes.</p>";
  }
}

onDOMLoaded(initPage);
