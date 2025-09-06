// src/js/pages/admin.js
import AuthState from "../services/AuthState.mjs";
import { select, onDOMLoaded } from "../utils/helpers.js";

// Definimos todos los botones posibles del panel de admin
const adminMenuItems = [
  {
    label: "Check-in de Participantes",
    href: "/admin/checkin/",
    ability: "perform-check-in",
  },
  {
    label: "Crear Anuncio",
    href: "/admin/announcements/create/",
    ability: "create-announcement",
  },
  {
    label: "Asignar Puntos/Monedas",
    href: "/admin/assign-points/",
    ability: "assign-points",
  },
  {
    label: "Control de Canjes",
    href: "/admin/redeem-codes/",
    ability: "manage-store",
  },
];

async function initAdminPage() {
  const menuContainer = select(".admin-menu");
  if (!menuContainer) return;

  menuContainer.innerHTML = ""; // Limpiamos el contenedor

  // Recorremos la lista de botones y verificamos si tenemos permiso para cada uno
  for (const item of adminMenuItems) {
    if (await AuthState.hasAbility(item.ability)) {
      // Si tenemos permiso, creamos el botón y lo añadimos
      const button = document.createElement("a");
      button.href = item.href;
      button.className = "btn btn--secondary"; // Reutilizamos nuestro estilo de botón
      button.textContent = item.label;
      menuContainer.appendChild(button);
    }
  }
}

onDOMLoaded(initAdminPage);
