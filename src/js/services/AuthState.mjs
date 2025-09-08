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

    async hasAbility(ability) {
        if (!this.isAuthenticated()) {
        return false;
        }

        let abilities = JSON.parse(sessionStorage.getItem(this.abilitiesKey));

        if (!Array.isArray(abilities)) {
        abilities = null;
        }

        if (!abilities) {
        try {
            const me = await ExternalServices.getSelf();
            let apiAbilities = me.meta.abilities || [];

            if (!Array.isArray(apiAbilities)) {
                apiAbilities = [];
            }
            
            abilities = apiAbilities;
            sessionStorage.setItem(this.abilitiesKey, JSON.stringify(abilities));
        } catch (e) {
            console.error("No se pudieron obtener los permisos del usuario", e);
            abilities = [];
        }
        }
        
        return abilities.includes(ability) || abilities.includes('*');
    }

    isAdmin() {
        const user = this.getUser();
        return !!user?.administrator;
    }

    clear() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        sessionStorage.removeItem(this.abilitiesKey);
    }
}

export default new AuthState();