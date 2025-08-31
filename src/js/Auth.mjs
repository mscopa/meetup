// Creando el nuevo archivo Auth.mjs

import { loginRequest } from './ExternalServices.mjs';
import { getLocalStorage, setLocalStorage } from './utils.mjs';

// Una clase para manejar toda la lógica de autenticación
export default class Auth {
    constructor() {
        // Al crear una instancia, intentamos cargar el token y el usuario desde localStorage
        this.token = getLocalStorage('authToken');
        this.user = getLocalStorage('user');
    }

    async login(credentials) {
        try {
            // Llamamos al servicio externo para hacer el login
            const data = await loginRequest(credentials);
            
            // Si tiene éxito, guardamos el token y los datos del usuario
            this.token = data.token;
            this.user = data.user;
            setLocalStorage('authToken', this.token);
            setLocalStorage('user', this.user);
            
            return { success: true, user: this.user };
        } catch (error) {
            console.error('Login fallido:', error);
            // Si falla, nos aseguramos de que no quede nada guardado
            this.logout();
            return { success: false, message: error.message };
        }
    }

    logout() {
        // Limpiamos las propiedades y el localStorage
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    isLoggedIn() {
        // Un método simple para saber si el usuario está logueado
        return !!this.token;
    }

    getToken() {
        return this.token;
    }

    getUser() {
        return this.user;
    }
}