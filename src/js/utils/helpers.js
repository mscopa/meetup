export function select(selector, scope = document) {
  return scope.querySelector(selector);
}

export function selectAll(selector, scope = document) {
  return scope.querySelectorAll(selector);
}

export function onDOMLoaded(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
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
