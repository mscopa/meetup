import ExternalServices from "../services/ExternalServices.mjs";
import { select, onDOMLoaded } from "../utils/helpers.js";
import AuthState from "../services/AuthState.mjs";
import { loadHeader } from "../utils/dom-loader.js";
import { showModal } from "../utils/modal.js";

const productGrid = select("#product-grid");
const paginationControls = select("#pagination-controls");
const historyContainer = select("#transaction-history");

let currentPageUrl = "/products";

// Función principal que carga una página de productos
async function loadProductsPage(url = "/products") {
  currentPageUrl = url;
  productGrid.innerHTML = "<p>Cargando productos...</p>";
  paginationControls.innerHTML = ""; // Limpiamos controles viejos

  try {
    const response = await ExternalServices.getProducts(url);
    await renderProducts(response.data); // <--- AWAIT AÑADIDO
    renderPagination(response.meta, response.links);
  } catch (error) {
    console.error("Error al cargar productos:", error);
    productGrid.innerHTML = "<p>No se pudieron cargar los productos.</p>";
  }
}

async function renderProducts(products) {
  if (products.length === 0) {
    productGrid.innerHTML =
      "<p>No hay productos disponibles en esta categoría.</p>";
    return;
  }
  const canPurchase = await AuthState.hasAbility("purchase-products");
  productGrid.innerHTML = products
    .map((product) => createProductCard(product, canPurchase))
    .join("");
}

function createProductCard(product, canPurchase) {
  const isOutOfStock = product.stock <= 0;
  // Creamos el HTML para los controles del consejero (si tiene permiso)
  const counselorControls = `
    <div class="quantity-selector">
      <button class="quantity-selector__btn quantity-selector__btn--decrease" data-product-id="${product.id}">-</button>
      <span class="quantity-selector__value" id="quantity-${product.id}">0</span>
      <button class="quantity-selector__btn quantity-selector__btn--increase" data-product-id="${product.id}">+</button>
    </div>
    <button class="btn product-card__buy-btn" data-product-id="${product.id}" ${isOutOfStock ? "disabled" : ""}>Comprar</button>
  `;

  return `
    <div class="product-card ${isOutOfStock ? "product-card--out-of-stock" : ""}">
      <img src="${product.image_url}" alt="${product.name}" class="product-card__image">
      <h2 class="product-card__name">${product.name}</h2>
      <div class="product-card__info">
        <span class="product-card__price">
          <img src="../assets/images/mario-coin.png" alt="Moneda">
          x${product.price}
        </span>
        <span class="product-card__stock">Stock: ${product.stock}</span>
      </div>
      ${canPurchase ? counselorControls : ""}
    </div>
  `;
}

function addStoreInteractivity() {
  // Usaremos un solo event listener para todo
  productGrid.addEventListener("click", async (e) => {
    const target = e.target;

    // Lógica para los botones +/-
    if (target.matches(".quantity-selector__btn")) {
      const productId = target.dataset.productId;
      if (!productId) return;

      const quantitySpan = select(`#quantity-${productId}`);
      let quantity = parseInt(quantitySpan.textContent);

      if (target.matches(".quantity-selector__btn--increase")) {
        quantity++;
      }
      if (target.matches(".quantity-selector__btn--decrease") && quantity > 0) {
        quantity--;
      }

      quantitySpan.textContent = quantity;
      // Después de cada cambio de cantidad, actualizamos el estado
      updatePurchaseState();
    }

    // Lógica para el botón Comprar
    if (target.matches(".product-card__buy-btn")) {
      const productId = target.dataset.productId;
      if (!productId) return;

      const quantitySpan = select(`#quantity-${productId}`);
      const quantity = parseInt(quantitySpan.textContent);

      if (quantity <= 0) {
        alert("Debes seleccionar al menos 1 producto para comprar.");
        return;
      }

      target.disabled = true;
      target.textContent = "Procesando...";

      try {
        const itemsToPurchase = [{ product_id: productId, quantity: quantity }];
        const response =
          await ExternalServices.purchaseProducts(itemsToPurchase);

        const successHtml = `
          <p>${response.message}</p>
          <p>Presentá este código en la tienda para retirar tus productos:</p>
          <h3 style="text-align:center; font-size: 2rem; letter-spacing: 3px; background: #eee; padding: 10px; border-radius: 5px;">
            ${response.retrieval_code}
          </h3>
        `;
        showModal("¡Compra Exitosa!", successHtml);

        await loadProductsPage(currentPageUrl);
        await loadHeader();
      } catch (error) {
        console.error("Error en la compra:", error);
        if (error.errors) {
          const firstErrorKey = Object.keys(error.errors)[0];
          const errorMessage = error.errors[firstErrorKey][0];
          alert(`Error: ${errorMessage}`);
        } else {
          alert("Ocurrió un error inesperado al procesar la compra.");
        }
      } finally {
        target.disabled = false;
        target.textContent = "Comprar";
        // Actualizamos el estado de la compra al finalizar
        updatePurchaseState();
      }
    }
  });
}

function updatePurchaseState() {
  const userCoins = parseInt(document.body.dataset.userCoins || 0);
  let totalCost = 0;

  // Calculamos el costo total de todos los productos seleccionados
  const quantitySpans = document.querySelectorAll(".quantity-selector__value");
  quantitySpans.forEach((span) => {
    const quantity = parseInt(span.textContent);
    if (quantity > 0) {
      const card = span.closest(".product-card");
      const priceSpan = card.querySelector(".product-card__price");
      // Extraemos el número del precio (ej: "x3" -> 3)
      const price = parseInt(priceSpan.textContent.replace("x", ""));
      totalCost += price * quantity;
    }
  });

  const warningDiv = select("#store-warning");
  const buyButtons = document.querySelectorAll(".product-card__buy-btn");

  if (totalCost > userCoins) {
    warningDiv.textContent = `No tenés suficientes monedas. Costo total: ${totalCost}, tenés: ${userCoins}.`;
    buyButtons.forEach((btn) => (btn.disabled = true));
  } else {
    warningDiv.textContent = ""; // Limpiamos la advertencia
    buyButtons.forEach((btn) => {
      // Habilitamos el botón solo si no está agotado
      const card = btn.closest(".product-card");
      if (!card.classList.contains("product-card--out-of-stock")) {
        btn.disabled = false;
      }
    });
  }
}

function renderPagination(meta, links) {
  // Usamos el array `links` del meta de Laravel que es más completo
  paginationControls.innerHTML = meta.links
    .map((link) => {
      // Si la URL es null, es un link deshabilitado (ej. "Previous" en la pág 1)
      if (!link.url) {
        return `<span class="pagination__link pagination__link--disabled">${link.label}</span>`;
      }
      // Si es la página activa, le añadimos la clase --active
      const isActive = link.active ? "pagination__link--active" : "";
      // Guardamos la URL de la API en un data-attribute
      return `<button class="pagination__link ${isActive}" data-url="${link.url}">${link.label}</button>`;
    })
    .join("");

  // Usamos delegación de eventos para manejar los clics
  paginationControls.addEventListener("click", (e) => {
    const target = e.target.closest("[data-url]");
    if (!target) return;

    // Obtenemos la URL de la API completa (ej. http://.../api/products?page=2)
    const fullUrl = target.dataset.url;
    // Extraemos solo el endpoint (ej. /products?page=2)
    const endpoint = new URL(fullUrl).pathname + new URL(fullUrl).search;

    loadProductsPage(endpoint);
  });
}

async function loadAndRenderHistory() {
  try {
    const response = await ExternalServices.getMyTransactions();
    const transactions = response.data;

    if (transactions.length > 0) {
      historyContainer.innerHTML = `
        <h2 class="history-title">Mi Historial de Compras</h2>
        ${transactions.map(createHistoryItem).join("")}
      `;
    } else {
      historyContainer.innerHTML = `
        <h2 class="history-title">Mi Historial de Compras</h2>
        <p style="text-align: center; color: white;">Aún no has realizado ninguna compra.</p>
      `;
    }
  } catch (error) {
    console.error("Error al cargar el historial:", error);
    historyContainer.innerHTML = "<p>No se pudo cargar el historial.</p>";
  }
}

function createHistoryItem(transaction) {
  const statusClass = `history-item__status--${transaction.status}`; // 'pending' o 'retrieved'
  const statusText =
    transaction.status === "pending" ? "Pendiente" : "Canjeado";

  return `
    <div class="history-item">
      <p class="history-item__product">${transaction.quantity}x ${transaction.product_name}</p>
      <p class="history-item__code">${transaction.retrieval_code}</p>
      <span class="history-item__status ${statusClass}">${statusText}</span>
    </div>
  `;
}

// --- FUNCIÓN DE INICIO UNIFICADA ---
async function initStorePage() {
  loadProductsPage(); // Carga los productos para todos
  addStoreInteractivity();

  // Verificamos si es consejero para cargar el historial
  if (await AuthState.hasAbility("view-history")) {
    loadAndRenderHistory();
  }
}

onDOMLoaded(initStorePage);
