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
    loadHeader();
    loadFooter();
  }

  if (currentPath === "/") {
    import("./pages/home.js");
  } else if (currentPath.startsWith("/admin/announcements/create")) {
    import("./pages/admin-announcement-form.js");
  } else if (currentPath.startsWith("/admin/checkin")) {
    import("./pages/admin-checkin.js");
  } else if (currentPath.startsWith("/admin/assign-points")) {
    import("./pages/admin-assign-points.js");
  } else if (currentPath.startsWith("/admin/redeem-codes")) {
    import("./pages/admin-redeem-codes.js");
  } else if (currentPath.startsWith("/admin")) {
    import("./pages/admin.js");
  } else if (currentPath.startsWith("/announcements")) {
    import("./pages/announcements.js");
  } else if (currentPath.startsWith("/schedule")) {
    import("./pages/schedule.js");
  } else if (currentPath.startsWith("/store")) {
    import("./pages/store.js");
  } else if (currentPath.startsWith("/ranking")) {
    import("./pages/ranking.js");
  } else if (/^\/puzzles\/\d+/.test(currentPath)) {
    import("./pages/puzzle-play.js");
  } else if (currentPath.startsWith("/puzzles")) {
    import("./pages/puzzles.js");
  } else if (currentPath.startsWith("/company")) {
    import("./pages/company.js");
  } else if (currentPath.startsWith("/login")) {
    import("./pages/login.js");
  }
});
