import { getPuzzleById, startAttempt, completeAttempt } from './ExternalServices.mjs';
import Auth from './Auth.mjs';

export default class CrosswordGame {
    constructor(containerId) {
        this.auth = new Auth();
        this.container = document.getElementById(containerId);
        this.crosswordData = null;
        this.attemptId = null;
        this.grid = [];
        this.intersectionMap = [];
        this.normalizedWords = {};
        this.clues = {};
    }

    async init() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const puzzleId = urlParams.get('id');

            if (!puzzleId) {
                this.container.innerHTML = '<h2>Error: No se ha especificado un puzzle.</h2>';
                return;
            }

            // --> 3. Obtenemos el token desde nuestro módulo Auth.
            const token = this.auth.getToken();

            // --> 4. Llamamos a la función `getPuzzleById` directamente, pasándole el ID y el token.
            // (Nota: Renombré 'getCrosswordData' a 'getPuzzleById' para ser consistente).
            this.crosswordData = await getPuzzleById(puzzleId, token);

            this._renderStartScreen();
        } catch (error) {
            console.error('Error al inicializar el juego:', error);
            this.container.innerHTML = '<p>Lo sentimos, no se pudo cargar el crucigrama. Por favor, intente de nuevo más tarde.</p>';
        }
    }

    _renderStartScreen() {
    this.container.innerHTML = `
        <div class="crossword-game__start-screen">
            <h2>${this.crosswordData.title}</h2>
            <p>${this.crosswordData.description}</p>
            <button id="start-game-btn" class="crossword-game__start-button">Comenzar Juego</button>
        </div>
    `;
    document.getElementById('start-game-btn').addEventListener('click', () => {
        this.container.querySelector('.crossword-game__start-screen').remove();
        this._startGame();
        });
    }

    async _startGame() {
        try {
            const puzzleId = this.crosswordData.id;
            const token = this.auth.getToken();

            // --> 6. Llamamos a la nueva función `startAttempt` que crearemos.
            const response = await startAttempt(puzzleId, token);
            
            this.attemptId = response.attempt_id; // Guardamos el ID que nos devuelve la API.
            this.startTime = new Date();
            this._createGridData();
            this._renderGrid();
            this._addEventListeners();
            this._renderClues();
            const submitButton = document.createElement('button');
            submitButton.textContent = 'Enviar Resultados';
            submitButton.classList.add('crossword-game__submit-button');
            submitButton.addEventListener('click', () => this._submitAttempt());
            // this.container.appendChild(submitButton);
            this.container.parentElement.appendChild(submitButton);

        } catch (error) {
            console.error('Error al iniciar el juego:', error);
            this.container.innerHTML = '<p>Lo sentimos, no se pudo iniciar el juego. Por favor, intente de nuevo más tarde.</p>';
        }
    }
    _createGridData() {
        const gridSize = this.crosswordData.content.gridSize;
        this.grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
        this.intersectionMap = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

        this.crosswordData.content.words.forEach(wordObj => {
            let { word, normalized_word, direction, row, col, word_id } = wordObj;
            
            this.normalizedWords[word_id] = normalized_word || word.replace(/\s/g, '');
            this.clues[word_id] = { word, direction, clue: wordObj.clue, row, col };

            let letterCount = 0;

            for (let i = 0; i < word.length; i++) {
                const char = word[i];

                if (char === ' ') {
                    const r = direction === 'horizontal' ? row : row + i;
                    const c = direction === 'horizontal' ? col + i : col;
                    this.grid[r][c] = null; // Marcar la celda como un espacio vacío
                    continue;
                }

                const r = direction === 'horizontal' ? row : row + i;
                const c = direction === 'horizontal' ? col + i : col;
                
                // Si la celda ya tiene una letra, es una intersección.
                if (this.grid[r][c] !== null) {
                    this.intersectionMap[r][c] = true;
                }
                
                this.grid[r][c] = char;
                letterCount++;
            }
        });
    }

    _renderGrid() {
        this.container.innerHTML = ''; // Limpiar contenedor
        this.container.classList.add('crossword-game__container');
        this.container.style.setProperty('--grid-size', this.crosswordData.content.gridSize);

        for (let r = 0; r < this.crosswordData.content.gridSize; r++) {
            for (let c = 0; c < this.crosswordData.content.gridSize; c++) {
                const cell = document.createElement('div');
                cell.classList.add('crossword-game__cell');

                if (this.grid[r][c] !== null) {
                    // Celda de input
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.maxLength = 1;
                    input.classList.add('crossword-game__input');
                    input.dataset.row = r;
                    input.dataset.col = c;
                    
                    const wordStartsHere = this.crosswordData.content.words.find(wordObj => wordObj.row === r && wordObj.col === c);
                    if (wordStartsHere) {
                        const numberSpan = document.createElement('span');
                        numberSpan.classList.add('crossword-game__number');
                        numberSpan.textContent = wordStartsHere.word_id;
                        cell.appendChild(numberSpan);
                    }
                    
                    cell.appendChild(input);

                    // Poner letra de intersección si es el caso
                    if (this.intersectionMap[r][c]) {
                        input.value = this.grid[r][c];
                        input.disabled = true;
                        cell.classList.add('crossword-game__cell--prefilled');
                    }

                    // Marcar celdas con espacios visuales si aplica
                    this.crosswordData.content.words.forEach(wordObj => {
                        if (wordObj.has_spaces && wordObj.direction === 'horizontal') {
                            const spaceIndex = wordObj.has_spaces.indexOf(c - wordObj.col);
                            if (spaceIndex !== -1 && wordObj.row === r) {
                                cell.classList.add('crossword-game__cell--visual-space');
                            }
                        } else if (wordObj.has_spaces && wordObj.direction === 'vertical') {
                            const spaceIndex = wordObj.has_spaces.indexOf(r - wordObj.row);
                            if (spaceIndex !== -1 && wordObj.col === c) {
                                cell.classList.add('crossword-game__cell--visual-space');
                            }
                        }
                    });

                } else {
                    // Celda vacía
                    cell.classList.add('crossword-game__cell--empty');
                }
                this.container.appendChild(cell);
            }
        }
    }

    _addEventListeners() {
        this.container.addEventListener('input', (event) => {
            const input = event.target;
            const r = parseInt(input.dataset.row);
            const c = parseInt(input.dataset.col);
            const userLetter = input.value.toUpperCase();
            
            // Lógica de validación
            // Puedes ir validando palabras individualmente o el crucigrama completo
            console.log(`User entered '${userLetter}' at [${r}, ${c}]`);
        });
    }

    _renderClues() {
        const cluesContainer = document.createElement('div');
        cluesContainer.classList.add('crossword-clues');
        
        const acrossClues = document.createElement('div');
        acrossClues.classList.add('crossword-clues__list', 'crossword-clues__list--across');
        acrossClues.innerHTML = '<h3>Horizontales</h3>';

        const downClues = document.createElement('div');
        downClues.classList.add('crossword-clues__list', 'crossword-clues__list--down');
        downClues.innerHTML = '<h3>Verticales</h3>';

        const sortedClues = Object.values(this.clues).sort((a, b) => {
            if (a.direction === b.direction) {
                return a.row === b.row ? a.col - b.col : a.row - b.row;
            }
            return a.direction === 'horizontal' ? -1 : 1;
        });

        sortedClues.forEach(clue => {
            const p = document.createElement('p');
            p.textContent = `(${clue.row}, ${clue.col}) - ${clue.clue}`;
            if (clue.direction === 'horizontal') {
                acrossClues.appendChild(p);
            } else {
                downClues.appendChild(p);
            }
        });

        document.querySelector('main').appendChild(cluesContainer);
        cluesContainer.appendChild(acrossClues);
        cluesContainer.appendChild(downClues);
    }

    _validateUserAnswers() {
        let isAllCorrect = true;
        this.crosswordData.content.words.forEach(wordObj => {
            const { word, normalized_word, direction, row, col } = wordObj;
            const correctNormalizedWord = normalized_word || word.replace(/\s/g, '').toUpperCase();
            let userWord = '';
            for (let i = 0; i < word.length; i++) {
                const r = direction === 'horizontal' ? row : row + i;
                const c = direction === 'horizontal' ? col + i : col;
                
                const inputElement = document.querySelector(`input[data-row="${r}"][data-col="${c}"]`);
                
                if (word[i] === ' ') {
                    continue;
                }

                const userLetter = inputElement ? inputElement.value.toUpperCase() : '';
                userWord += userLetter;
            }
            if (userWord !== correctNormalizedWord) {
                isAllCorrect = false;
            }
        });
        return isAllCorrect;
    }

    async _submitAttempt() {

        const isCompleted = this._validateUserAnswers();
        if (!isCompleted) {
            console.log('El crucigrama no está completo o tiene errores.');
            return;
        }
        const endTime = new Date();
        const duration = Math.round((endTime - this.startTime) / 1000);

        const data = {
            attempt_id: this.attemptId,
            duration_seconds: duration,
            is_completed: true
        }
        try {
            // --> 7. Obtenemos el token y lo pasamos a `completeAttempt`.
            const token = this.auth.getToken();
            const response = await completeAttempt(data, token);

            if (response.success) {
                alert('¡Felicidades! Has completado el crucigrama.');
                window.location.href = '/puzzles/'; // O a la página de puzzles de nuevo
            } else {
                alert('Error al enviar los resultados.');
            }
        } catch (error) {
            console.error('Error al enviar resultados:', error);
            alert("Ocurrió un error al enviar tus resultados.");
        }
    }
}