import Auth from './Auth.mjs';
import { getPuzzles } from './ExternalServices.mjs'; // Asumiendo que esta función existe
import { qs, renderListWithTemplate } from './utils.mjs';

function puzzleTemplate(puzzle) {
    // La URL debe llevar el ID del puzzle para saber cuál cargar
    const puzzleUrl = `/puzzles/crosswords.html?id=${puzzle.id}`;
    return `
        <li class="menu__item">
            <a href="${puzzleUrl}" class="menu__link">${puzzle.title}</a>
        </li>
    `;
}

async function loadPuzzles() {
    const auth = new Auth();
    const token = auth.getToken();
    const puzzleListElement = qs('#puzzle-list');

    try {
        const puzzles = await getPuzzles(token);
        if (puzzles.length === 0) {
            puzzleListElement.innerHTML = '<p>No hay puzzles disponibles para tu compañía en este momento.</p>';
        } else {
            renderListWithTemplate(puzzleTemplate, puzzleListElement, puzzles);
        }
    } catch (error) {
        console.error("Error al cargar puzzles:", error);
    }
}

loadPuzzles();