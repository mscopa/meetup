import AuthState from "../services/AuthState.mjs";
import ExternalServices from "../services/ExternalServices.mjs";
import { select } from "../utils/helpers.js";

if (AuthState.isAuthenticated()) {
  window.location.href = "/";
}

const loginForm = select("#login-form");
const usernameInput = select("#username");
const passwordInput = select("#password");
const errorElement = select("#error-message");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorElement.textContent = "";

  const username = usernameInput.value;
  const password = passwordInput.value;

  try {
    const response = await ExternalServices.login(username, password);

    AuthState.setToken(response.token);
    AuthState.setUser(response.user);

    window.location.href = "/";
  } catch (error) {
    console.error("Login failed:", error);
    errorElement.textContent =
      "Las credenciales son incorrectas. Por favor, intentá de nuevo.";
  }
});
