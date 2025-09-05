/**
 * Un atajo para document.querySelector.
 * @param {string} selector - El selector CSS.
 * @param {Element} [scope=document] - El elemento desde donde buscar.
 * @returns {Element|null}
 */
export function select(selector, scope = document) {
  return scope.querySelector(selector);
}

/**
 * Un atajo para document.querySelectorAll.
 * @param {string} selector - El selector CSS.
 * @param {Element} [scope=document] - El elemento desde donde buscar.
 * @returns {NodeListOf<Element>}
 */
export function selectAll(selector, scope = document) {
  return scope.querySelectorAll(selector);
}

/**
 * Ejecuta una función de forma segura cuando el DOM está listo,
 * evitando la condición de carrera de DOMContentLoaded.
 * @param {function} fn La función a ejecutar.
 */
export function onDOMLoaded(fn) {
  if (document.readyState === "loading") {
    // El documento todavía está cargando, esperamos el evento.
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    // El DOM ya está listo, ejecutamos la función inmediatamente.
    fn();
  }
}

export function debounce(func, delay = 250) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// Podrías agregar más helpers a futuro, como:
// export function formatDate(date) { ... }
// export function truncateText(text, length) { ... }
