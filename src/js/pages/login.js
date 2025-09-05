import AuthState from "../services/AuthState.mjs";
import ExternalServices from "../services/ExternalServices.mjs";
import { select } from "../utils/helpers.js"; // Asumo que en helpers.js tenés un selector de DOM

// Si el usuario ya está logueado, lo redirigimos a la página principal.
if (AuthState.isAuthenticated()) {
  window.location.href = "/";
}

const loginForm = select("#login-form"); // El ID de tu formulario en login/index.html
const usernameInput = select("#username");
const passwordInput = select("#password");
const errorElement = select("#error-message"); // Un div para mostrar errores

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorElement.textContent = ""; // Limpia errores previos

  const username = usernameInput.value;
  const password = passwordInput.value;

  try {
    const response = await ExternalServices.login(username, password);

    // La respuesta de tu API de login debería devolver el token y los datos del usuario.
    // Ej: { token: '...', user: { id: 1, name: '...' } }
    AuthState.setToken(response.token);
    AuthState.setUser(response.user);

    // ¡Éxito! Redirigir al dashboard o página principal.
    window.location.href = "/"; // O a donde corresponda
  } catch (error) {
    // Si la API devuelve un error (ej. credenciales inválidas), lo mostramos.
    console.error("Login failed:", error);
    errorElement.textContent =
      "Las credenciales son incorrectas. Por favor, intentá de nuevo.";
  }
});
