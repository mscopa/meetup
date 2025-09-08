import { select } from "./helpers.js";
import ExternalServices from "../services/ExternalServices.mjs";
import AuthState from "../services/AuthState.mjs";
import { showModal, hideModal } from "./modal.js";

async function loadHTML(url, containerSelector) {
  const container = select(containerSelector);
  if (!container) {
    console.error(`Contenedor "${containerSelector}" no encontrado.`);
    return;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
    const html = await response.text();
    container.innerHTML = html;
  } catch (error) {
    console.error("Error cargando HTML parcial:", error);
  }
}

export async function loadHeader() {
  await loadHTML("/partials/header.html", "header");

  const menuToggleBtn = select("#menu-toggle-btn");
  const menuCloseBtn = select("#menu-close-btn");
  const sideMenu = select("#side-menu");
  const overlay = select("#overlay");

  const openMenu = () => {
    sideMenu.classList.add("side-menu--open");
    overlay.classList.remove("hidden");
  };

  const closeMenu = () => {
    sideMenu.classList.remove("side-menu--open");
    overlay.classList.add("hidden");
  };

  menuToggleBtn.addEventListener("click", openMenu);
  menuCloseBtn.addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);

  if (AuthState.isAdmin()) {
    const sideMenuContent = select(".side-menu__content");

    select("#company-header").classList.add("hidden");

    const adminMenuHtml = `
      <div class="admin-menu-header">
        <p><strong>Usuario:</strong> ${AuthState.getUser().administrator.first_name}</p>
        <p><strong>Rol:</strong> ${AuthState.getUser().administrator.role}</p>
      </div>
      <a href="/admin/" class="btn btn--secondary">Panel de Admin</a>
      <a href="#" id="logout-button" class="btn btn--primary">Salir</a>
    `;
    sideMenuContent.innerHTML = adminMenuHtml;

    addLogoutFunctionality();
  } else if (AuthState.isAuthenticated()) {
    try {
      const response = await ExternalServices.getProfileHeader();
      const { type, company } = response.data;

      if (type === "company" && company) {
        select("#company-number").textContent = company.number;
        select("#company-name").textContent = company.name;
        select("#company-room").textContent = company.room;
        select("#company-score").textContent = company.score;
        select("#company-coins-value-menu").textContent = `x${company.coins}`;
        select("#company-war-cry").textContent = `"${company.war_cry}"`;

        select("#header-coins-value").textContent = `x${company.coins}`;
        select("#header-coin-display").classList.remove("hidden");

        select("#company-header").classList.remove("hidden");
        document.body.dataset.userCoins = company.coins;

        const logoutButton = select("#logout-button");
        if (logoutButton) {
          logoutButton.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
              await ExternalServices.logout();
              alert("Sesión cerrada correctamente.");
            } catch (error) {
              console.error("Error al cerrar sesión en el servidor:", error);
            } finally {
              AuthState.clear();
              window.location.href = "/login/";
            }
          });
        }
      }
    } catch (error) {
      console.error("No se pudieron cargar los datos del header:", error);
    }
  }

  try {
    const response = await ExternalServices.getAnnouncements();
    const announcements = response.data;

    if (announcements && announcements.length > 0) {
      const latestId = announcements[0].id;
      const lastReadId = localStorage.getItem("lastReadAnnouncementId");

      if (latestId > lastReadId) {
        const notificationDot = select(".notification-dot");
        if (notificationDot) {
          notificationDot.classList.remove("hidden");
        }
      }
    }
  } catch (error) {
    console.error(
      "No se pudieron cargar los anuncios para las notificaciones:",
      error,
    );
  }
}

function addLogoutFunctionality() {
  const logoutButton = select("#logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await ExternalServices.logout();
      } catch (error) {
        console.error("Error al cerrar sesión en el servidor:", error);
      } finally {
        AuthState.clear();
        window.location.href = "/login/";
      }
    });
  }
}

export async function loadFooter() {
  await loadHTML("/partials/footer.html", "footer");

  const counselorLoginLink = select("#counselor-login-link");

  if (counselorLoginLink) {
    counselorLoginLink.addEventListener("click", (e) => {
      e.preventDefault();

      const formHtml = `
        <form id="pin-form" class="modal-form">
          <div class="form-field">
            <label for="pin-input" class="form-field__label">Ingresá tu PIN:</label>
            <input type="password" id="pin-input" class="form-field__input" required>
          </div>
          <button type="submit" class="btn btn--primary">Identificarse</button>
        </form>
      `;

      showModal("Identificación de Consejero", formHtml, () => {
        const pinForm = select("#pin-form");
        if (pinForm) {
          pinForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const pin = select("#pin-input").value;
            try {
              const response = await ExternalServices.identifyCounselor(pin);
              AuthState.setToken(response.token);
              hideModal();
              showModal(
                "¡Éxito!",
                `<p>¡Hola, ${response.counselor_name}!</p><p>La página se recargará para aplicar tus nuevos permisos.</p>`,
              );
              setTimeout(() => window.location.reload(), 2000);
            } catch (error) {
              hideModal();
              showModal(
                "Error",
                "<p>El PIN ingresado es incorrecto. Por favor, intentá de nuevo.</p>",
              );
            }
          });
        }
      });
    });
  }
}
