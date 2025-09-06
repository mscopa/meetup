import { select } from "./helpers.js";
import ExternalServices from "../services/ExternalServices.mjs";
import AuthState from "../services/AuthState.mjs";
import { showModal, hideModal } from "./modal.js";

/**
 * Carga contenido HTML desde un archivo y lo inserta en un contenedor.
 * @param {string} url - La ruta al archivo .html (ej: '/src/views/partials/header.html').
 * @param {string} containerSelector - El selector del elemento donde se insertará el HTML.
 * @returns {Promise<void>}
 */
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

/**
 * Carga el header y lo llena con datos del perfil.
 */
export async function loadHeader() {
  // 1. Cargar el HTML del header y el menú lateral
  await loadHTML("/partials/header.html", "header");

  // 2. Seleccionar los elementos del DOM que controlarán el menú
  const menuToggleBtn = select("#menu-toggle-btn");
  const menuCloseBtn = select("#menu-close-btn");
  const sideMenu = select("#side-menu");
  const overlay = select("#overlay");

  // 3. Crear funciones para abrir y cerrar el menú
  const openMenu = () => {
    sideMenu.classList.add("side-menu--open");
    overlay.classList.remove("hidden");
  };

  const closeMenu = () => {
    sideMenu.classList.remove("side-menu--open");
    overlay.classList.add("hidden");
  };

  // 4. Asignar los eventos a los botones y al overlay
  menuToggleBtn.addEventListener("click", openMenu);
  menuCloseBtn.addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);

  // Verificamos el tipo de usuario
  if (AuthState.isAdmin()) {
    // Es un administrador
    const sideMenuContent = select(".side-menu__content");

    // Ocultamos el div de la compañía y creamos el menú de admin
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

    // Le damos funcionalidad al nuevo botón de Salir
    addLogoutFunctionality();
  } else if (AuthState.isAuthenticated()) {
    // 5. Cargar los datos dinámicos del usuario y ponerlos en el menú
    try {
      const response = await ExternalServices.getProfileHeader();
      const { type, company } = response.data;

      if (type === "company" && company) {
        // Poblar el menú lateral
        select("#company-number").textContent = company.number;
        select("#company-name").textContent = company.name;
        select("#company-room").textContent = company.room;
        select("#company-score").textContent = company.score;
        select("#company-coins-value-menu").textContent = `x${company.coins}`;
        select("#company-war-cry").textContent = `"${company.war_cry}"`;

        // Poblar el indicador de monedas en el header
        select("#header-coins-value").textContent = `x${company.coins}`;
        select("#header-coin-display").classList.remove("hidden");

        // Mostrar el contenedor de la compañía dentro del menú
        select("#company-header").classList.remove("hidden");
        document.body.dataset.userCoins = company.coins;

        // Funcionalidad de Logout
        const logoutButton = select("#logout-button");
        if (logoutButton) {
          logoutButton.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
              await ExternalServices.logout();
              alert("Sesión cerrada correctamente.");
            } catch (error) {
              console.error("Error al cerrar sesión en el servidor:", error);
              // Aún si falla la API, forzamos el logout en el frontend
            } finally {
              AuthState.clear();
              window.location.href = "/login/";
            }
          });
        }
      }
      // ... aquí iría el 'else if' para el administrador
    } catch (error) {
      console.error("No se pudieron cargar los datos del header:", error);
    }
  }

  try {
    const response = await ExternalServices.getAnnouncements();
    const announcements = response.data; // Asumiendo que la respuesta es el array directamente

    if (announcements && announcements.length > 0) {
      const latestId = announcements[0].id; // El endpoint devuelve los más nuevos primero
      const lastReadId = localStorage.getItem("lastReadAnnouncementId");

      if (latestId > lastReadId) {
        // Hay un anuncio nuevo que no hemos visto
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

// Creamos una función reutilizable para el logout para no repetir código
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

/**
 * Carga el footer.
 */
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

      // Llamamos a showModal y le pasamos una función callback
      showModal("Identificación de Consejero", formHtml, () => {
        // Este código solo se ejecuta DESPUÉS de que el formulario esté en el DOM.
        const pinForm = select("#pin-form");
        if (pinForm) {
          pinForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const pin = select("#pin-input").value;
            try {
              const response = await ExternalServices.identifyCounselor(pin);
              AuthState.setToken(response.token);
              hideModal();
              // Usamos un modal de éxito en lugar de alert
              showModal(
                "¡Éxito!",
                `<p>¡Hola, ${response.counselor_name}!</p><p>La página se recargará para aplicar tus nuevos permisos.</p>`,
              );
              setTimeout(() => window.location.reload(), 2000); // Recargamos después de 2 segundos
            } catch (error) {
              // También podemos mostrar el error en un modal
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
