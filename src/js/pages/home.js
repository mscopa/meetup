// src/js/pages/home.js
import AuthState from "../services/AuthState.mjs";
import { select } from "../utils/helpers.js";

function setupHomePage() {
  const companyLink = select("#company-link");
  const user = AuthState.getUser();

  if (companyLink) {
    companyLink.href = "/company/";
  }
}

setupHomePage();
