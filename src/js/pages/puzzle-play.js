import ExternalServices from "../services/ExternalServices.mjs";
import { select, selectAll, onDOMLoaded, debounce } from "../utils/helpers.js";

// --- FUNCIONES ESPECÍFICAS DEL CRUCIGRAMA ---

function renderCrossword(puzzleData) {
  const gameBoard = select("#game-board");

  // 1. Crear el layout del juego (grilla, pistas, botón)
  gameBoard.innerHTML = `
    <div class="crossword-layout">
      <div id="crossword-grid" class="crossword-grid"></div>
      <div class="crossword-clues">
        <h3>Horizontales</h3>
        <ul id="clues-across"></ul>
        <br>
        <h3>Verticales</h3>
        <ul id="clues-down"></ul>
      </div>
    </div>
    <div class="crossword-actions">
      <button id="validate-btn" class="btn btn--primary">Validar Letras</button>
    </div>
  `;

  // 2. Renderizar la grilla y las pistas con los datos de la API
  renderGrid(puzzleData);
  renderClues(puzzleData.clues);
  setupValidation(puzzleData);
}

function renderGrid(data) {
  const gridContainer = select("#crossword-grid");
  const { rows, cols } = data.grid_dimensions;

  // Usamos variables CSS para hacer la grilla dinámica
  gridContainer.style.setProperty("--grid-cols", cols);

  data.grid.flat().forEach((cellData) => {
    const cell = document.createElement("div");
    cell.className = "crossword-grid__cell";

    if (cellData.is_blank) {
      cell.classList.add("crossword-grid__cell--blank");
    } else {
      // Si no es una celda en blanco, es jugable
      if (cellData.number) {
        const numberSpan = document.createElement("span");
        numberSpan.className = "crossword-grid__cell__number";
        numberSpan.textContent = cellData.number;
        cell.appendChild(numberSpan);
      }

      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 1;
      input.className = "crossword-grid__cell__input";
      input.dataset.answer = cellData.char.toUpperCase(); // Guardamos la respuesta correcta

      if (cellData.is_help) {
        cell.classList.add("crossword-grid__cell--help");
        input.value = cellData.char;
        input.readOnly = true;
      }
      cell.appendChild(input);
    }
    gridContainer.appendChild(cell);
  });
}

function renderClues(clues) {
  const acrossList = select("#clues-across");
  const downList = select("#clues-down");

  acrossList.innerHTML = clues.across
    .map((c) => `<li><strong>${c.number}.</strong> ${c.clue}</li>`)
    .join("");
  downList.innerHTML = clues.down
    .map((c) => `<li><strong>${c.number}.</strong> ${c.clue}</li>`)
    .join("");
}

function setupValidation() {
  const validateBtn = select("#validate-btn");
  validateBtn.addEventListener("click", () => {
    const allInputs = document.querySelectorAll(".crossword-grid__cell__input");

    allInputs.forEach((input) => {
      if (input.readOnly || !input.value) {
        // No validamos celdas de ayuda o vacías
        input.parentElement.classList.remove(
          "crossword-grid__cell--correct",
          "crossword-grid__cell--incorrect",
        );
        return;
      }

      const isCorrect = input.value.toUpperCase() === input.dataset.answer;
      input.parentElement.classList.toggle(
        "crossword-grid__cell--correct",
        isCorrect,
      );
      input.parentElement.classList.toggle(
        "crossword-grid__cell--incorrect",
        !isCorrect,
      );
    });
  });
}

function initWordSearch(puzzleData) {
  const gameBoard = select("#game-board");

  // 1. Crear el layout del juego
  gameBoard.innerHTML = `
    <div class="wordsearch-layout">
      <div class="wordsearch-grid-wrapper">
        <div id="wordsearch-grid" class="wordsearch-grid"></div>
        <svg id="pipe-overlay" class="pipe-overlay"></svg>
      </div>
      <ul id="word-list" class="word-list"></ul>
    </div>
  `;

  // 2. Renderizar la grilla, la lista y configurar la interacción
  renderWordSearchGrid(puzzleData.grid);
  renderWordsToFind(puzzleData.words_to_find);
  setupWordSearchInteraction(puzzleData.solution);
}

function renderWordSearchGrid(gridData) {
  const gridContainer = select("#wordsearch-grid");
  gridContainer.style.setProperty("--grid-cols", gridData[0].length);

  gridData.forEach((row, rowIndex) => {
    row.forEach((char, colIndex) => {
      const cell = document.createElement("div");
      cell.className = "wordsearch-grid__cell";
      cell.textContent = char;
      // Guardamos su posición para saber qué celda es
      cell.dataset.row = rowIndex;
      cell.dataset.col = colIndex;
      gridContainer.appendChild(cell);
    });
  });
}

function renderWordsToFind(words) {
  const wordListContainer = select("#word-list");
  // Usamos un Set para eliminar duplicados de la lista visual
  const uniqueWords = [...new Set(words)];
  wordListContainer.innerHTML = uniqueWords
    .map((word) => `<li class="word-list__item" id="word-${word}">${word}</li>`)
    .join("");
}

function setupWordSearchInteraction(solution) {
  const gridContainer = select("#wordsearch-grid");
  let isSelecting = false;
  let startCell = null;
  const foundSolutions = [];

  const getCellFromEvent = (e) => {
    let target;
    if (e.touches && e.touches.length > 0) {
      // Es un evento táctil, obtenemos el elemento bajo el dedo
      const touch = e.touches[0];
      target = document.elementFromPoint(touch.clientX, touch.clientY);
    } else {
      // Es un evento de mouse
      target = e.target;
    }
    const cellElement = target
      ? target.closest(".wordsearch-grid__cell")
      : null;
    return cellElement
      ? {
          row: parseInt(cellElement.dataset.row),
          col: parseInt(cellElement.dataset.col),
          element: cellElement,
        }
      : null;
  };

  // --- HANDLERS PARA ABRIR, MOVER Y CERRAR SELECCIÓN ---
  const handleSelectionStart = (e) => {
    startCell = getCellFromEvent(e);
    if (startCell) {
      isSelecting = true;
      startCell.element.classList.add("wordsearch-grid__cell--selected");
    }
  };

  const handleSelectionMove = (e) => {
    // Prevenimos que la página haga scroll en el celular mientras se arrastra
    if (isSelecting) e.preventDefault();
  };

  const handleSelectionEnd = (e) => {
    if (!isSelecting || !startCell) return;

    // Para touchend, el evento no tiene un target directo, así que lo calculamos
    let endCell;
    if (e.changedTouches && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const endTarget = document.elementFromPoint(touch.clientX, touch.clientY);
      const cellElement = endTarget
        ? endTarget.closest(".wordsearch-grid__cell")
        : null;
      if (cellElement) {
        endCell = {
          row: parseInt(cellElement.dataset.row),
          col: parseInt(cellElement.dataset.col),
          element: cellElement,
        };
      }
    } else {
      endCell = getCellFromEvent(e);
    }

    isSelecting = false;
    selectAll(".wordsearch-grid__cell--selected").forEach((c) =>
      c.classList.remove("wordsearch-grid__cell--selected"),
    );

    if (endCell) {
      checkForWordMatch(startCell, endCell, solution, foundSolutions);
    }
  };

  // --- AÑADIMOS LOS EVENT LISTENERS PARA AMBOS "IDIOMAS" ---
  // Idioma Ratón
  gridContainer.addEventListener("mousedown", handleSelectionStart);
  gridContainer.addEventListener("mousemove", handleSelectionMove);
  gridContainer.addEventListener("mouseup", handleSelectionEnd);
  // Dejamos este por si el mouse se sale del grid y se suelta
  gridContainer.addEventListener("mouseleave", handleSelectionEnd);

  // Idioma Dedo
  gridContainer.addEventListener("touchstart", handleSelectionStart);
  gridContainer.addEventListener("touchmove", handleSelectionMove);
  gridContainer.addEventListener("touchend", handleSelectionEnd);

  // --- NUEVO: Lógica para redibujar al cambiar tamaño de ventana ---
  const redrawAllPipes = () => {
    const svg = select("#pipe-overlay");
    svg.innerHTML = ""; // Limpiamos el lienzo
    foundSolutions.forEach((sol) => drawPipe(sol)); // Redibujamos cada tubería
  };

  // Usamos el debounce para que no se ejecute frenéticamente
  window.addEventListener("resize", debounce(redrawAllPipes, 200));
}

function checkForWordMatch(start, end, solution, foundSolutions) {
  const userSelection = {
    start_row: start.row,
    start_col: start.col,
    end_row: end.row,
    end_col: end.col,
  };

  const foundSolution = solution.find((sol) => {
    if (foundSolutions.some((found) => found.word === sol.word)) return false;
    const forwardMatch =
      sol.start_row === userSelection.start_row &&
      sol.start_col === userSelection.start_col &&
      sol.end_row === userSelection.end_row &&
      sol.end_col === userSelection.end_col;
    const reverseMatch =
      sol.start_row === userSelection.end_row &&
      sol.start_col === userSelection.end_col &&
      sol.end_row === userSelection.start_row &&
      sol.end_col === userSelection.start_col;
    return forwardMatch || reverseMatch;
  });

  if (foundSolution) {
    // ¡Palabra encontrada!
    foundSolutions.push(foundSolution);
    drawPipe(foundSolution);
    markWordAsFound(foundSolution.word);
  }
}

function drawPipe(solutionEntry) {
  const grid = select("#wordsearch-grid");
  const svg = select("#pipe-overlay");
  // Buscamos los elementos de celda de inicio y fin
  const startCellEl = grid.querySelector(
    `[data-row='${solutionEntry.start_row}'][data-col='${solutionEntry.start_col}']`,
  );
  const endCellEl = grid.querySelector(
    `[data-row='${solutionEntry.end_row}'][data-col='${solutionEntry.end_col}']`,
  );

  if (!startCellEl || !endCellEl) return;

  // 1. Obtenemos las coordenadas "GPS" del lienzo SVG y de las celdas
  const svgRect = svg.getBoundingClientRect();
  const startCellRect = startCellEl.getBoundingClientRect();
  const endCellRect = endCellEl.getBoundingClientRect();

  // 2. Calculamos la posición del centro de cada celda RELATIVA al lienzo SVG
  const startX = startCellRect.left - svgRect.left + startCellRect.width / 2;
  const startY = startCellRect.top - svgRect.top + startCellRect.height / 2;
  const endX = endCellRect.left - svgRect.left + endCellRect.width / 2;
  const endY = endCellRect.top - svgRect.top + endCellRect.height / 2;

  // 3. El resto del código es el mismo: creamos y añadimos la línea
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", startX);
  line.setAttribute("y1", startY);
  line.setAttribute("x2", endX);
  line.setAttribute("y2", endY);
  line.setAttribute("class", "pipe-line");

  svg.appendChild(line);
}

function markWordAsFound(word) {
  const listItem = select(`#word-${word}`);
  if (listItem) {
    listItem.classList.add("word-list__item--found");
  }
}

// --- FUNCIÓN PRINCIPAL DE LA PÁGINA ---

async function initPuzzlePage() {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const puzzleId = pathParts[1];

  if (!puzzleId) {
    select("#game-container").innerHTML =
      "<h1>Error: No se especificó un puzzle.</h1>";
    return;
  }

  try {
    const response = await ExternalServices.getPuzzleDetails(puzzleId);
    select("#puzzle-title").textContent = response.title;

    if (response.grid && response.clues) {
      renderCrossword(response);
    } else if (response.grid && response.words_to_find) {
      // AQUÍ CONECTAMOS LA LÓGICA DE LA SOPA DE LETRAS
      initWordSearch(response);
    }
  } catch (error) {
    console.error("Error al cargar el puzzle:", error);
    select("#game-container").innerHTML = "<h1>Error al cargar el puzzle.</h1>";
  }
}

onDOMLoaded(initPuzzlePage);
