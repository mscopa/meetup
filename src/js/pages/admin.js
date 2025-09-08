// src/js/pages/admin.js
import AuthState from "../services/AuthState.mjs";
import { select, onDOMLoaded } from "../utils/helpers.js";

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

  menuContainer.innerHTML = "";

  for (const item of adminMenuItems) {
    if (await AuthState.hasAbility(item.ability)) {
      const button = document.createElement("a");
      button.href = item.href;
      button.className = "btn btn--secondary";
      button.textContent = item.label;
      menuContainer.appendChild(button);
    }
  }
}

onDOMLoaded(initAdminPage);
