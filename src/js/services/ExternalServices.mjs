import AuthState from './AuthState.mjs';

const API_URL = import.meta.env.VITE_API_URL;

class ExternalServices {
  constructor() {
    this.apiUrl = API_URL;
  }

  async request(endpoint, method = 'GET', data = null, requiresAuth = true) {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requiresAuth) {
      const token = AuthState.getToken();
      if (!token) {
        window.location.href = '/login/';
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
        AuthState.clear();
        window.location.href = '/login/';
        return Promise.reject('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      if (response.status === 204) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  login(username, password) {
    const credentials = { username, password };
    return this.request('/login', 'POST', credentials, false);
  }

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

  purchaseProducts(items) {
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
    return this.request('/logout', 'POST');
  }
}

export default new ExternalServices();