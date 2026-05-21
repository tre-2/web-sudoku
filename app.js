const difficultySettings = {
  easy: 36,
  medium: 46,
  hard: 54,
};

const boardElement = document.getElementById("board");
const difficultyLabel = document.getElementById("difficultyLabel");
const statusLabel = document.getElementById("statusLabel");
const mistakeLabel = document.getElementById("mistakeLabel");
const notesToggle = document.getElementById("notesToggle");
const conflictToggle = document.getElementById("conflictToggle");
const newGameButton = document.getElementById("newGameButton");
const hintButton = document.getElementById("hintButton");
const checkButton = document.getElementById("checkButton");
const solveButton = document.getElementById("solveButton");
const resetButton = document.getElementById("resetButton");
const clearButton = document.getElementById("clearButton");
const difficultyButtons = [...document.querySelectorAll(".difficulty-button")];
const numberPad = document.getElementById("numberPad");

let selectedCell = 0;
let difficulty = "easy";
let solution = [];
let givens = [];
let values = Array(81).fill(0);
let notes = Array.from({ length: 81 }, () => new Set());
let hintIndex = null;
let mistakeCount = 0;

function createBoard() {
  for (let index = 0; index < 81; index += 1) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    cell.dataset.index = String(index);
    cell.setAttribute("aria-label", `Cell ${index + 1}`);

    if (Math.floor(index / 9) % 3 === 2) {
      cell.classList.add("box-end");
    }

    if (Math.floor(index / 9) === 8) {
      cell.classList.add("row-end");
    }

    cell.addEventListener("click", () => {
      selectedCell = index;
      renderBoard();
    });

    boardElement.appendChild(cell);
  }
}

function shuffle(list) {
  const array = [...list];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function rowOf(index) {
  return Math.floor(index / 9);
}

function colOf(index) {
  return index % 9;
}

function boxOf(index) {
  return Math.floor(rowOf(index) / 3) * 3 + Math.floor(colOf(index) / 3);
}

function indicesForHouse(type, number) {
  const cells = [];
  for (let index = 0; index < 81; index += 1) {
    if (
      (type === "row" && rowOf(index) === number) ||
      (type === "col" && colOf(index) === number) ||
      (type === "box" && boxOf(index) === number)
    ) {
      cells.push(index);
    }
  }
  return cells;
}

function isPlacementValid(grid, index, value) {
  for (const peer of indicesForHouse("row", rowOf(index))) {
    if (peer !== index && grid[peer] === value) return false;
  }

  for (const peer of indicesForHouse("col", colOf(index))) {
    if (peer !== index && grid[peer] === value) return false;
  }

  for (const peer of indicesForHouse("box", boxOf(index))) {
    if (peer !== index && grid[peer] === value) return false;
  }

  return true;
}

function solveGrid(grid) {
  const nextIndex = grid.indexOf(0);
  if (nextIndex === -1) return [...grid];

  for (const value of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (!isPlacementValid(grid, nextIndex, value)) continue;
    grid[nextIndex] = value;
    const solved = solveGrid(grid);
    if (solved) return solved;
  }

  grid[nextIndex] = 0;
  return null;
}

function countSolutions(grid, limit = 2) {
  const nextIndex = grid.indexOf(0);
  if (nextIndex === -1) return 1;

  let count = 0;
  for (let value = 1; value <= 9; value += 1) {
    if (!isPlacementValid(grid, nextIndex, value)) continue;
    grid[nextIndex] = value;
    count += countSolutions(grid, limit);
    if (count >= limit) break;
  }
  grid[nextIndex] = 0;
  return count;
}

function generateSolvedBoard() {
  return solveGrid(Array(81).fill(0));
}

function generatePuzzle(removedCount) {
  const solved = generateSolvedBoard();
  const puzzle = [...solved];
  const indices = shuffle([...Array(81).keys()]);

  let removed = 0;
  for (const index of indices) {
    if (removed >= removedCount) break;
    const snapshot = puzzle[index];
    puzzle[index] = 0;

    if (countSolutions([...puzzle], 2) !== 1) {
      puzzle[index] = snapshot;
      continue;
    }

    removed += 1;
  }

  return { puzzle, solved };
}

function getCandidates(index) {
  if (values[index] !== 0) return [];
  const candidates = [];
  for (let value = 1; value <= 9; value += 1) {
    if (isPlacementValid(values, index, value)) {
      candidates.push(value);
    }
  }
  return candidates;
}

function getConflictIndices() {
  if (!conflictToggle.checked) return new Set();
  const conflicts = new Set();

  for (let index = 0; index < 81; index += 1) {
    const value = values[index];
    if (value === 0) continue;
    if (!isPlacementValid(values, index, value)) {
      conflicts.add(index);
    }
  }

  return conflicts;
}

function relatedToSelected(index) {
  if (selectedCell == null) return false;
  return (
    rowOf(index) === rowOf(selectedCell) ||
    colOf(index) === colOf(selectedCell) ||
    boxOf(index) === boxOf(selectedCell)
  );
}

function renderBoard() {
  const conflicts = getConflictIndices();
  const complete = values.every((value) => value !== 0);
  const solved = complete && values.every((value, index) => value === solution[index]);

  if (solved) {
    statusLabel.textContent = "Solved";
    statusLabel.style.color = "var(--success)";
  } else {
    statusLabel.textContent = notesToggle.checked ? "Notes mode" : "In progress";
    statusLabel.style.color = "";
  }

  [...boardElement.children].forEach((cell, index) => {
    cell.className = "cell";
    const value = values[index];
    const fixed = givens[index] !== 0;
    const noteValues = [...notes[index]].sort((a, b) => a - b);

    if (Math.floor(index / 9) % 3 === 2) {
      cell.classList.add("box-end");
    }
    if (Math.floor(index / 9) === 8) {
      cell.classList.add("row-end");
    }
    if (fixed) {
      cell.classList.add("fixed");
    }
    if (!fixed && value !== 0) {
      cell.classList.add("user-value");
    }
    if (selectedCell === index) {
      cell.classList.add("selected");
    } else if (relatedToSelected(index)) {
      cell.classList.add("related");
    }
    if (conflicts.has(index)) {
      cell.classList.add("conflict");
    }
    if (hintIndex === index) {
      cell.classList.add("hint");
    }

    if (value !== 0) {
      cell.innerHTML = `<span class="value">${value}</span>`;
    } else {
      const noteMarkup = Array.from({ length: 9 }, (_, noteIndex) => {
        const noteValue = noteIndex + 1;
        return `<span class="note">${noteValues.includes(noteValue) ? noteValue : ""}</span>`;
      }).join("");
      cell.innerHTML = `<div class="notes">${noteMarkup}</div>`;
    }
  });
}

function setDifficulty(nextDifficulty) {
  difficulty = nextDifficulty;
  difficultyLabel.textContent = nextDifficulty.charAt(0).toUpperCase() + nextDifficulty.slice(1);
  difficultyButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.difficulty === nextDifficulty);
  });
}

function startNewGame() {
  const { puzzle, solved } = generatePuzzle(difficultySettings[difficulty]);
  solution = solved;
  givens = puzzle;
  values = [...puzzle];
  notes = Array.from({ length: 81 }, () => new Set());
  hintIndex = null;
  mistakeCount = 0;
  mistakeLabel.textContent = "0";
  selectedCell = values.findIndex((value) => value === 0);
  statusLabel.textContent = "Ready";
  statusLabel.style.color = "";
  renderBoard();
}

function clearCell(index) {
  if (index == null || givens[index] !== 0) return;
  values[index] = 0;
  notes[index].clear();
  hintIndex = null;
  renderBoard();
}

function placeValue(index, value) {
  if (index == null || givens[index] !== 0) return;

  if (notesToggle.checked) {
    if (values[index] !== 0) values[index] = 0;
    if (notes[index].has(value)) {
      notes[index].delete(value);
    } else {
      notes[index].add(value);
    }
    renderBoard();
    return;
  }

  values[index] = value;
  notes[index].clear();
  hintIndex = null;

  if (value !== solution[index]) {
    mistakeCount += 1;
    mistakeLabel.textContent = String(mistakeCount);
  }

  renderBoard();
}

function requestHint() {
  const emptyCells = values
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => value === 0);

  if (emptyCells.length === 0) {
    statusLabel.textContent = "Nothing to hint";
    return;
  }

  const target = emptyCells.reduce((best, cell) => {
    const candidateCount = getCandidates(cell.index).length;
    if (!best || candidateCount < best.candidateCount) {
      return { ...cell, candidateCount };
    }
    return best;
  }, null);

  values[target.index] = solution[target.index];
  notes[target.index].clear();
  hintIndex = target.index;
  statusLabel.textContent = "Hint used";
  renderBoard();
}

function checkBoard() {
  const wrongCells = values.filter((value, index) => value !== 0 && value !== solution[index]).length;
  if (wrongCells === 0) {
    statusLabel.textContent = "No mistakes found";
    statusLabel.style.color = "var(--success)";
  } else {
    statusLabel.textContent = `${wrongCells} mistake${wrongCells === 1 ? "" : "s"} found`;
    statusLabel.style.color = "var(--danger)";
  }
}

function solveCurrentBoard() {
  values = [...solution];
  notes = Array.from({ length: 81 }, () => new Set());
  hintIndex = null;
  renderBoard();
}

function resetBoard() {
  values = [...givens];
  notes = Array.from({ length: 81 }, () => new Set());
  hintIndex = null;
  mistakeCount = 0;
  mistakeLabel.textContent = "0";
  statusLabel.textContent = "Reset";
  statusLabel.style.color = "";
  renderBoard();
}

function handleKeydown(event) {
  if (selectedCell == null) return;

  if (event.key >= "1" && event.key <= "9") {
    placeValue(selectedCell, Number(event.key));
    return;
  }

  if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
    clearCell(selectedCell);
    return;
  }

  if (event.key === "ArrowUp") {
    selectedCell = (selectedCell + 72) % 81;
    renderBoard();
  } else if (event.key === "ArrowDown") {
    selectedCell = (selectedCell + 9) % 81;
    renderBoard();
  } else if (event.key === "ArrowLeft") {
    selectedCell = rowOf(selectedCell) * 9 + ((colOf(selectedCell) + 8) % 9);
    renderBoard();
  } else if (event.key === "ArrowRight") {
    selectedCell = rowOf(selectedCell) * 9 + ((colOf(selectedCell) + 1) % 9);
    renderBoard();
  }
}

createBoard();
setDifficulty("easy");
startNewGame();

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => setDifficulty(button.dataset.difficulty));
});

newGameButton.addEventListener("click", startNewGame);
hintButton.addEventListener("click", requestHint);
checkButton.addEventListener("click", checkBoard);
solveButton.addEventListener("click", solveCurrentBoard);
resetButton.addEventListener("click", resetBoard);
clearButton.addEventListener("click", () => clearCell(selectedCell));
notesToggle.addEventListener("change", renderBoard);
conflictToggle.addEventListener("change", renderBoard);
numberPad.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-value]");
  if (!button) return;
  placeValue(selectedCell, Number(button.dataset.value));
});

window.addEventListener("keydown", handleKeydown);
