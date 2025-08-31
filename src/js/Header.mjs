// js/header.js

import Auth from './Auth.mjs';
import { getProfileHeaderData } from './ExternalServices.mjs';
import { qs } from './utils.mjs';

const auth = new Auth();

// Plantilla para un bloque de información del header
function infoTemplate(label, value) {
    return `
        <span class="header-info">
            <span class="label">${label}:</span>
            <span class="value">${value}</span>
        </span>
    `;
}

export async function loadHeader() {
    const headerElement = qs('.main-header');
    if (!headerElement) return;

    if (!auth.isLoggedIn()) {
        // Si por alguna razón llega aquí sin estar logueado, no hacemos nada
        headerElement.innerHTML = '<p>Por favor, inicie sesión</p>';
        return;
    }

    try {
        const token = auth.getToken();
        const data = await getProfileHeaderData(token);

        // Construimos el HTML dinámicamente
        const leftSection = `
            <div class="main-header__left-section">
                ${infoTemplate('Nombre', data.userName)}
                ${data.companyName ? infoTemplate('Compañía', data.companyName) : ''}
                ${data.score !== undefined ? infoTemplate('Puntuación', data.score) : ''}
            </div>`;

        const centerSection = `
            <div class="main-header__center-section">
                <h1 class="header-title">MeetUp 2025</h1>
            </div>`;

        const rightSection = `
            <div class="main-header__right-section">
                ${data.announcements !== undefined ? infoTemplate('Anuncios', data.announcements) : ''}
                ${data.sessionName ? infoTemplate('Sesión', data.sessionName) : ''}
                ${data.coins !== undefined ? infoTemplate('Monedas', data.coins) : ''}
                ${data.currentActivity ? infoTemplate('Actividad', data.currentActivity) : ''}
            </div>`;

        const mobileMenu = `
            <div class="mobile-menu">
                <a href="#" class="mobile-menu__icon mobile-menu__icon--mushroom"><img src="/images/menu-icon.png" alt="Menú"></a>
                <a href="#" class="mobile-menu__icon mobile-menu__icon--announcements"><img src="/images/announcements-icon.png" alt="Anuncios"></a>
            </div>`;

        headerElement.innerHTML = leftSection + centerSection + rightSection + mobileMenu;

    } catch (error) {
        console.error("Error al cargar el header:", error);
        headerElement.innerHTML = '<p>Error al cargar datos del perfil.</p>';
        if (error.status === 401) { // Si el token expiró, por ejemplo
            auth.logout();
            window.location.replace('/login/');
        }
    }
}