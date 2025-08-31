import Auth from './Auth.mjs'; // Asegúrate de que la ruta sea correcta
import { qs } from './utils.mjs';

const auth = new Auth();

// Función para determinar el estado de una actividad
function getActivityStatus(startTimeStr, endTimeStr) {
    const now = new Date();
    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);

    if (now > endTime) {
        return 'finished'; // Rojo
    } else if (now >= startTime && now <= endTime) {
        return 'inprogress'; // Verde
    } else {
        return 'upcoming'; // Negro
    }
}

// Plantilla para un ítem del cronograma
function scheduleItemTemplate(activity) {
    const status = getActivityStatus(activity.start_time, activity.end_time);

    // Formateamos la hora para mostrar solo HH:MM
    const timeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
    const startTime = new Date(activity.start_time).toLocaleTimeString('es-AR', timeFormatOptions);

    return `
        <div class="schedule-item schedule-item--${status}">
            <span class="schedule-item__time">${startTime}</span>
            <span class="schedule-item__title">${activity.title}</span>
        </div>
    `;
}

async function loadSchedule() {
    const container = qs('#schedule-container');
    if (!container) return;

    const token = auth.getToken();
    if (!token) {
        container.innerHTML = '<p>Necesitas iniciar sesión para ver el cronograma.</p>';
        return;
    }

    try {
        const response = await fetch('https://mistyrose-dragonfly-332968.hostingersite.com/api/schedule', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('No se pudo cargar el cronograma.');
        }

        const payload = await response.json();
        const activities = payload.data;

        if (activities.length === 0) {
            container.innerHTML = '<p>No hay actividades programadas.</p>';
            return;
        }

        // Generamos el HTML para todas las actividades y lo insertamos de una vez
        container.innerHTML = activities.map(scheduleItemTemplate).join('');

    } catch (error) {
        console.error("Error al cargar el cronograma:", error);
        container.innerHTML = `<p>${error.message}</p>`;
    }
}

// Ejecutamos la función al cargar la página
loadSchedule();