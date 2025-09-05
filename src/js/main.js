import AuthState from "./services/AuthState.mjs";
import { loadHeader, loadFooter } from "./utils/dom-loader.js";

document.addEventListener("DOMContentLoaded", () => {
  const publicRoutes = ["/login/", "/register/"];

  const currentPath = window.location.pathname;
  if (!publicRoutes.includes(currentPath) && !AuthState.isAuthenticated()) {
    window.location.href = "/login/";
    return;
  }

  if (AuthState.isAuthenticated()) {
    loadHeader(); // Esta función podría usar ExternalServices.getProfileHeader() para poner el nombre del usuario
    loadFooter();
  }

  // Lógica para cargar el JS específico de cada página
  // Podrías tener una lógica más avanzada aquí (un "router" simple)
  if (currentPath === "/") {
    import("./pages/home.js");
  } else if (currentPath.startsWith("/announcements")) {
    import("./pages/announcements.js");
  } else if (currentPath.startsWith("/schedule")) {
    import("./pages/schedule.js");
  } else if (currentPath.startsWith("/store")) {
    import("./pages/store.js");
  } else if (/^\/puzzles\/\d+/.test(currentPath)) {
    // REGLA ESPECÍFICA PRIMERO
    import("./pages/puzzle-play.js");
  } else if (currentPath.startsWith("/puzzles")) {
    // REGLA GENERAL DESPUÉS
    import("./pages/puzzles.js");
  } else if (currentPath.startsWith("/company")) {
    import("./pages/company.js");
  } else if (currentPath.startsWith("/login")) {
    import("./pages/login.js");
  }
});
