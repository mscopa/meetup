import ExternalServices from "../services/ExternalServices.mjs";
import { select, onDOMLoaded } from "../utils/helpers.js";
import { showModal } from "../utils/modal.js";

const form = select("#verify-form");
const codeInput = select("#code-input");
const detailsContainer = select("#transaction-details");

function renderTransactionDetails(transaction) {
  const statusClass = `status-badge--${transaction.status}`;
  const statusText =
    transaction.status === "pending" ? "PENDIENTE DE ENTREGA" : "YA CANJEADO";

  const redeemButtonHtml =
    transaction.status === "pending"
      ? `<button class="btn btn--primary" id="redeem-btn" data-code="${transaction.retrieval_code}">Confirmar Entrega y Canjear</button>`
      : "";

  detailsContainer.innerHTML = `
    <div class="card">
      <div class="transaction-details__content">
        <p><strong>Compañía:</strong> ${transaction.counselor.company.name}</p>
        <p><strong>Consejero:</strong> ${transaction.counselor.first_name} ${transaction.counselor.last_name}</p>
        <p><strong>Producto:</strong> ${transaction.quantity}x ${transaction.product.name}</p>
        <p><strong>Estado:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
      </div>
      <div class="transaction-details__actions">
        ${redeemButtonHtml}
      </div>
    </div>
  `;
  detailsContainer.classList.remove("hidden");
}

function renderError(message) {
  detailsContainer.innerHTML = `
    <div class="card">
      <p><span class="status-badge status-badge--not-found">ERROR</span> ${message}</p>
    </div>
  `;
  detailsContainer.classList.remove("hidden");
}

async function handleVerification(e) {
  e.preventDefault();
  const code = codeInput.value.trim();
  if (!code) return;

  try {
    const transaction = await ExternalServices.verifyTransaction(code);
    renderTransactionDetails(transaction);
  } catch (error) {
    renderError(error.message || "Código no encontrado.");
  }
}

async function handleRedemption(e) {
  if (!e.target.matches("#redeem-btn")) return;

  const code = e.target.dataset.code;
  e.target.disabled = true;
  e.target.textContent = "Canjeando...";

  try {
    const response = await ExternalServices.redeemTransaction(code);
    showModal("¡Éxito!", `<p>${response.message}</p>`);
    const updatedTransaction = await ExternalServices.verifyTransaction(code);
    renderTransactionDetails(updatedTransaction);
  } catch (error) {
    showModal(
      "Error",
      `<p>${error.message || "No se pudo canjear el código."}</p>`,
    );
    e.target.disabled = false;
    e.target.textContent = "Confirmar Entrega y Canjear";
  }
}

function initPage() {
  form.addEventListener("submit", handleVerification);
  detailsContainer.addEventListener("click", handleRedemption);
}

onDOMLoaded(initPage);
