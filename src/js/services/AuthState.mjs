import ExternalServices from './ExternalServices.mjs';
/**
 * Manages authentication state using localStorage.
 * Provides methods to store, retrieve, and clear authentication tokens and user data.
 */
class AuthState {
    constructor() {
        this.tokenKey = 'authToken';
        this.userKey = 'userData';
        this.abilitiesKey = 'userAbilities';
    }

    /**
    * Store token authentication
    * @param {string} token
    */
    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    /**
    * Get token authentication.
    * @returns {string|null}
    */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
    * Store user logged data.
    * @param {object} user
    */
    setUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    /**
    * Get user data.
    * @returns {object|null}
    */
    getUser() {
        const user = localStorage.getItem(this.userKey);
        return user ? JSON.parse(user) : null;
    }

    /**
    * Verify if user is authenticated.
    * @returns {boolean}
    */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Verifica si el usuario actual tiene una habilidad específica.
     * Usa sessionStorage para cachear los permisos y no llamar a la API constantemente.
     * @param {string} ability El nombre de la habilidad a verificar (ej: 'purchase-products').
     * @returns {Promise<boolean>}
     */
    async hasAbility(ability) {
        if (!this.isAuthenticated()) {
        return false;
        }

        let abilities = JSON.parse(sessionStorage.getItem(this.abilitiesKey));

        // --- NUEVA VERIFICACIÓN DE SEGURIDAD ---
        // Si lo que sacamos de sessionStorage no es un array, lo ignoramos.
        if (!Array.isArray(abilities)) {
        abilities = null; // Lo forzamos a null para que llame a la API.
        }

        if (!abilities) {
        try {
            const me = await ExternalServices.getSelf();
            let apiAbilities = me.meta.abilities || [];
            
            // --- OTRA VERIFICACIÓN DE SEGURIDAD ---
            // Nos aseguramos de que la respuesta de la API sea un array.
            if (!Array.isArray(apiAbilities)) {
                apiAbilities = [];
            }
            
            abilities = apiAbilities;
            sessionStorage.setItem(this.abilitiesKey, JSON.stringify(abilities));
        } catch (e) {
            console.error("No se pudieron obtener los permisos del usuario", e);
            abilities = []; // En caso de error, devolvemos un array vacío.
        }
        }
        
        // Ahora estamos 100% seguros de que 'abilities' es un array.
        return abilities.includes(ability) || abilities.includes('*');
    }

    /**
     * Verifica si el usuario logueado es un administrador.
     * Lo hace revisando si el objeto de usuario guardado tiene la relación 'administrator'.
     * @returns {boolean}
     */
    isAdmin() {
        const user = this.getUser();
        // El '?' es optional chaining: si user es null, no da error, solo devuelve undefined.
        // El '!!' convierte el resultado en un booleano estricto (true/false).
        return !!user?.administrator;
    }

    // No te olvides de modificar el método clear() para limpiar los permisos también
    clear() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        sessionStorage.removeItem(this.abilitiesKey); // Limpiar caché de permisos
    }
}

export default new AuthState();