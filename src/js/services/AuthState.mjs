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

        if (!abilities) {
            try {
            const me = await ExternalServices.getSelf(); // Llamamos a /api/me
            abilities = me.meta.abilities || [];
            sessionStorage.setItem(this.abilitiesKey, JSON.stringify(abilities));
            } catch (e) {
            console.error("No se pudieron obtener los permisos del usuario", e);
            return false;
            }
        }

        // El usuario tiene el permiso si está en la lista o si tiene el comodín "*"
        return abilities.includes(ability) || abilities.includes('*');
    }

    // No te olvides de modificar el método clear() para limpiar los permisos también
    clear() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        sessionStorage.removeItem(this.abilitiesKey); // Limpiar caché de permisos
    }
}

export default new AuthState();