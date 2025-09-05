// src/js/pages/company.js
import ExternalServices from "../services/ExternalServices.mjs";
import AuthState from "../services/AuthState.mjs"; // <-- IMPORTANTE: Añadimos AuthState
import { select } from "../utils/helpers.js";
import { onDOMLoaded } from "../utils/helpers.js";

async function initCompanyPage() {
  // YA NO LEEMOS LA URL. Obtenemos el usuario del estado.
  const user = AuthState.getUser();

  if (!user || !user.company || !user.company.id) {
    document.body.innerHTML =
      "<h1>Error: No se pudieron encontrar los datos de tu compañía.</h1>";
    return;
  }

  const companyId = user.company.id; // Obtenemos el ID desde el usuario logueado
  const companyInfoContainer = select("#company-info");
  const memberListContainer = select("#member-list");

  // El resto del código es casi idéntico...
  try {
    const response = await ExternalServices.getCompanyDetails(companyId);
    const companyData = response.data;
    renderCompanyInfo(companyData, companyInfoContainer);
    renderMemberList(companyData, memberListContainer);
  } catch (error) {
    console.error("Error al cargar los detalles de la compañía:", error);
    memberListContainer.innerHTML = "<p>Hubo un error al cargar los datos.</p>";
  }
}

function renderCompanyInfo(data, container) {
  container.innerHTML = `
    <h1 class="company-info__name">${data.name} (Nº ${data.number})</h1>
    <div class="company-info__stats">
      <span><strong>Puntaje:</strong> ${data.score}</span>
      <span><strong>Monedas:</strong> ${data.coins}</span>
    </div>
  `;
}

function renderMemberList(data, container) {
  // Combinamos participantes y consejeros en un solo array
  const participants = data.participants.map((p) => ({
    ...p,
    role: "Participant",
  }));
  const counselors = data.counselors.map((c) => ({ ...c, role: "Counselor" }));
  const allMembers = [...participants, ...counselors];

  // Ordenamos el array alfabéticamente por apellido
  allMembers.sort((a, b) => a.last_name.localeCompare(b.last_name));

  if (allMembers.length === 0) {
    container.innerHTML = "<p>Esta compañía aún no tiene miembros.</p>";
    return;
  }

  // Limpiamos el contenedor y generamos el HTML
  container.innerHTML = allMembers
    .map((member) => createMemberCard(member))
    .join("");
}

function createMemberCard(member) {
  const fullName = `${member.last_name}, ${member.first_name}`;

  let badgeLetter = "";
  let badgeClass = "";

  if (member.role === "Participant") {
    badgeLetter = "P";
    badgeClass = "participant";
  } else if (member.role === "Counselor") {
    // Manejamos los tipos de consejero
    if (member.type === "Consejero Auxiliar") {
      badgeLetter = "C.A";
      badgeClass = "auxiliary";
    } else {
      badgeLetter = "C";
      badgeClass = "counselor";
    }
  }

  return `
    <div class="member-card" data-attended="${member.attended}">
      <span class="member-card__badge member-card__badge--${badgeClass}">${badgeLetter}</span>
      <p class="member-card__name">${fullName}</p>
    </div>
  `;
}

onDOMLoaded(initCompanyPage);
