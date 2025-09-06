import AuthState from './AuthState.mjs';

const API_URL = import.meta.env.VITE_API_URL;

class ExternalServices {
  constructor() {
    this.apiUrl = API_URL;
  }

  /**
   * Método genérico para realizar peticiones a la API.
   * @param {string} endpoint - El endpoint al que se llamará (ej: '/login').
   * @param {string} method - Método HTTP (GET, POST, PATCH, etc.).
   * @param {object} [data=null] - El cuerpo de la petición para POST, PATCH, etc.
   * @param {boolean} [requiresAuth=true] - Indica si el endpoint requiere autenticación.
   * @returns {Promise<any>}
   */
  async request(endpoint, method = 'GET', data = null, requiresAuth = true) {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requiresAuth) {
      const token = AuthState.getToken();
      if (!token) {
        // Si se requiere token y no existe, redirigimos al login.
        window.location.href = '/login/'; // Asumiendo que tu login está en /login/
        return Promise.reject('No authentication token found.');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method: method,
      headers: headers,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Token inválido o expirado. Limpiamos y redirigimos al login.
        AuthState.clear();
        window.location.href = '/login/';
        return Promise.reject('Unauthorized');
      }

      if (!response.ok) {
        // Captura otros errores (404, 500, etc.)
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Si la respuesta no tiene contenido (ej: un 204 No Content), devolvemos null.
      if (response.status === 204) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error; // Relanzamos el error para que la lógica de la página pueda manejarlo.
    }
  }

  // --- Métodos específicos para cada endpoint ---

  /**
   * Inicia sesión de un usuario.
   * @param {string} username
   * @param {string} password
   */
  login(username, password) {
    const credentials = { username, password };
    return this.request('/login', 'POST', credentials, false); // El login no requiere autenticación previa
  }

  /**
   * Obtiene los datos del header del perfil.
   */
  getProfileHeader() {
    return this.request('/profile-header');
  }

  getAnnouncements() {
    return this.request('/announcements');
  }

  createAnnouncement(title, message) {
    return this.request('/announcements', 'POST', { title, message });
  }

  getSelf() {
    return this.request('/me');
  }

  /**
   * Obtiene la agenda.
   */
  getSchedule() {
    return this.request('/schedule');
  }

  getCompanyDetails(id) {
    return this.request(`/companies/${id}`);
  }

  updateCompany(companyId, data) {
    return this.request(`/companies/${companyId}`, 'PATCH', data);
  }

  getProducts(url = '/products') {
    return this.request(url);
  }

  /**
   * Envía una orden de compra al backend.
   * @param {array} items - Un array de objetos, ej: [{ product_id: 1, quantity: 2 }]
   */
  purchaseProducts(items) {
    // El backend espera un objeto con una clave "items" que contiene el array.
    const payload = { items };
    return this.request('/purchase', 'POST', payload);
  }

  getMyTransactions() {
    return this.request('/my-transactions');
  }

  verifyTransaction(code) {
    return this.request(`/transactions/verify/${code}`);
  }
  redeemTransaction(code) {
    return this.request(`/transactions/redeem/${code}`, 'POST');
  }
  
  getRanking() {
    return this.request('/ranking');
  }

  getCheckinList() {
    return this.request('/checkin/participants');
  }

  createParticipant(data) {
  return this.request('/checkin/participants', 'POST', data);
}

  updateCheckinStatus(participantId, attended, kitDelivered) {
    const payload = {
      attended: attended,
      kit_delivered: kitDelivered
    };
    return this.request(`/checkin/participants/${participantId}`, 'PATCH', payload);
  }
  
  /**
   * Obtiene la lista de puzzles.
   */
  getPuzzles() {
    return this.request('/puzzles');
  }

  getPuzzleDetails(id) {
    return this.request(`/puzzles/${id}`);
  }

  togglePuzzleStatus(puzzleId, isEnabled) {
    const payload = { is_enabled: isEnabled };
    return this.request(`/puzzles/${puzzleId}/toggle-status`, 'PATCH', payload);
  }

  getCompanyList() {
    return this.request('/company-list');
  }
  getEarningsHistory(url = '/earnings') {
    return this.request(url);
  }
  createEarning(data) {
    return this.request('/earnings', 'POST', data);
  }

  identifyCounselor(pin) {
    return this.request('/counselor/identify', 'POST', { pin });
  }

  logout() {
    // El logout cambia el estado, por eso usamos 'POST'.
    return this.request('/logout', 'POST');
  }

  // ... y así sucesivamente para todos tus endpoints (getProducts, purchaseProduct, etc.)
}

export default new ExternalServices();