// ExternalServices.mjs

// Usamos la variable de entorno de Vite para la URL base de tu API de Laravel
const baseURL = import.meta.env.VITE_SERVER_URL;

// Esta función auxiliar es perfecta, la mantenemos.
// Convierte la respuesta del fetch a JSON y maneja errores de red.
async function convertToJson(res) {
    const jsonResponse = await res.json();
    if (res.ok) {
        return jsonResponse;
    } else {
        // Si la API devuelve un error (ej: 401, 404, 500), lo lanzamos para que el .catch() lo atrape
        throw { name: "servicesError", message: jsonResponse };
    }
}

/**
 * Envía las credenciales del usuario para obtener un token de autenticación.
 * Esta es la función que usará tu Auth.mjs.
 * @param {object} credentials - Un objeto con { email: "...", password: "..." }
 */
export async function loginRequest(credentials) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
    };
    // No necesita token, porque justamente estamos pidiendo uno.
    const response = await fetch(`${baseURL}/login`, options);
    return await convertToJson(response);
}

export async function getProfileHeaderData(token) {
    const options = {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    };
    const response = await fetch(`${baseURL}/profile-header`, options);
    return await convertToJson(response);
}

/**
 * Obtiene una lista de todos los puzzles.
 * ¡Esta es una función de ejemplo para que pruebes tu conexión!
 * @param {string} token - El token de autenticación del usuario.
 */
export async function getPuzzles(token) {
    const options = {
        method: "GET",
        headers: {
            // ¡Clave! Así es como nos identificamos en las rutas protegidas.
            "Authorization": `Bearer ${token}`
        }
    };
    const response = await fetch(`${baseURL}/puzzles`, options);
    return await convertToJson(response);
}


/**
 * Obtiene los detalles de un solo puzzle por su ID.
 * @param {string} id - El ID del puzzle que quieres obtener.
 * @param {string} token - El token de autenticación del usuario.
 */
export async function getPuzzleById(id, token) {
    const options = {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    };
    const response = await fetch(`${baseURL}/puzzles/${id}`, options);
    return await convertToJson(response);
}

/**
 * Registra el inicio de un intento de puzzle para el usuario actual.
 * @param {string} puzzleId - El ID del puzzle que se está iniciando.
 * @param {string} token - El token de autenticación.
 */
export async function startAttempt(puzzleId, token) {
    const options = {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    };
    // Esta será la nueva ruta que crearemos en Laravel
    const response = await fetch(`${baseURL}/puzzles/${puzzleId}/attempts`, options);
    return await convertToJson(response);
}

// Mantenemos tu función, pero la convertimos a una función exportada normal
// para mantener la consistencia del archivo.
export async function completeAttempt(attemptData, token) {
    const attemptId = attemptData.attempt_id; 

    const response = await fetch(`${baseURL}/attempts/${attemptId}`, { // --> URL actualizada
        method: "PATCH", // --> Usamos PATCH para actualizar
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(attemptData),
    });
    return await convertToJson(response);
}