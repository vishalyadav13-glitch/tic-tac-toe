const boxes = Array.from(document.querySelectorAll(".box"));
const resetBtn = document.querySelector("#reset-btn");
const newGameBtn = document.querySelector("#new-btn");
const modeScreen = document.querySelector("#mode-screen");
const gameScreen = document.querySelector("#game-screen");
const selfBtn = document.querySelector("#self-btn");
const botBtn = document.querySelector("#bot-btn");
const difficultyOptions = document.querySelector("#difficulty-options");
const difficultyButtons = document.querySelectorAll(".difficulty-btn");
const msgContainer = document.querySelector(".msg-container");
const confettiLayer = document.querySelector(".confetti-layer");
const msg = document.querySelector("#msg");

let currentMode = "self";
let currentDifficulty = "intermediate";
let turnX = true;
let gameOver = false;

const winPatterns = [
  [0, 1, 2],
  [0, 3, 6],
  [0, 4, 8],
  [1, 4, 7],
  [2, 5, 8],
  [2, 4, 6],
  [3, 4, 5],
  [6, 7, 8],
];

const disableBoxes = () => {
  boxes.forEach((box) => {
    box.disabled = true;
  });
};

const enableBoxes = () => {
  boxes.forEach((box) => {
    box.disabled = false;
    box.innerText = "";
  });
};

const clearConfetti = () => {
  confettiLayer.innerHTML = "";
};

const spawnConfetti = () => {
  clearConfetti();

  const colors = ["#ff6b6b", "#ffd93d", "#6bcf7f", "#4ecdc4", "#ff9f1c", "#7b61ff", "#f72585"];

  for (let i = 0; i < 36; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    const angle = (Math.PI * 2 * i) / 36;
    const distance = 140 + Math.random() * 170;

    piece.style.background = colors[i % colors.length];
    piece.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    piece.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
    piece.style.setProperty("--r", `${(Math.random() * 720 - 360).toFixed(0)}deg`);

    confettiLayer.appendChild(piece);
  }
};

const showWinner = (winner) => {
  msg.textContent = `Congratulations, Winner is ${winner}`;
  msgContainer.classList.remove("hide");
  spawnConfetti();
  disableBoxes();
  gameOver = true;
};

const showDraw = () => {
  msg.textContent = "It's a draw!";
  msgContainer.classList.remove("hide");
  disableBoxes();
  gameOver = true;
};

const checkWinner = () => {
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    const pos1Val = boxes[a].innerText;
    const pos2Val = boxes[b].innerText;
    const pos3Val = boxes[c].innerText;

    if (pos1Val !== "" && pos1Val === pos2Val && pos2Val === pos3Val) {
      showWinner(pos1Val);
      return true;
    }
  }

  const isDraw = boxes.every((box) => box.innerText !== "");
  if (isDraw) {
    showDraw();
    return true;
  }

  return false;
};

const getAvailableBoxes = () => boxes.filter((box) => box.innerText === "");

const getWinningMoveFor = (symbol) => {
  for (const pattern of winPatterns) {
    const values = pattern.map((index) => boxes[index].innerText);
    if (values.filter((value) => value === symbol).length === 2 && values.includes("")) {
      const emptyIndex = values.indexOf("");
      return boxes[pattern[emptyIndex]];
    }
  }

  return null;
};

const getBeginnerMove = () => {
  const available = getAvailableBoxes();
  return available[Math.floor(Math.random() * available.length)];
};

const getIntermediateMove = () => {
  const winningMove = getWinningMoveFor("O");
  if (winningMove) return winningMove;

  const blockingMove = getWinningMoveFor("X");
  if (blockingMove) return blockingMove;

  if (boxes[4].innerText === "") return boxes[4];

  const corners = [0, 2, 6, 8].filter((index) => boxes[index].innerText === "");
  if (corners.length > 0) return boxes[corners[Math.floor(Math.random() * corners.length)]];

  return getBeginnerMove();
};

const getWinnerFromBoard = (board) => {
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a];
    }
  }

  return null;
};

const minimax = (board, depth, isMaximizing) => {
  const winner = getWinnerFromBoard(board);

  if (winner === "O") return 10 - depth;
  if (winner === "X") return depth - 10;
  if (board.every((cell) => cell !== "")) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;

    board.forEach((cell, index) => {
      if (cell === "") {
        board[index] = "O";
        const score = minimax(board, depth + 1, false);
        board[index] = "";
        bestScore = Math.max(bestScore, score);
      }
    });

    return bestScore;
  }

  let bestScore = Infinity;

  board.forEach((cell, index) => {
    if (cell === "") {
      board[index] = "X";
      const score = minimax(board, depth + 1, true);
      board[index] = "";
      bestScore = Math.min(bestScore, score);
    }
  });

  return bestScore;
};

const getProMove = () => {
  let bestScore = -Infinity;
  let bestMove = null;
  const board = boxes.map((box) => box.innerText);

  board.forEach((cell, index) => {
    if (cell === "") {
      board[index] = "O";
      const score = minimax(board, 0, false);
      board[index] = "";

      if (score > bestScore) {
        bestScore = score;
        bestMove = index;
      }
    }
  });

  return bestMove !== null ? boxes[bestMove] : getIntermediateMove();
};

const getBotMove = () => {
  if (currentDifficulty === "beginner") return getBeginnerMove();
  if (currentDifficulty === "intermediate") return getIntermediateMove();
  return getProMove();
};

const makeBotMove = () => {
  if (currentMode !== "bot" || turnX || gameOver) return;

  const botMove = getBotMove();
  if (!botMove) return;

  botMove.innerText = "O";
  botMove.disabled = true;

  if (checkWinner()) return;

  turnX = true;
};

const resetBoard = () => {
  turnX = true;
  gameOver = false;
  clearConfetti();
  enableBoxes();
  msgContainer.classList.add("hide");
  msg.textContent = "Winner";
};

const showModeSelection = () => {
  msgContainer.classList.add("hide");
  difficultyOptions.classList.add("hide");
  modeScreen.classList.remove("hide");
  gameScreen.classList.add("hide");
  resetBoard();
};

const startGame = (mode, difficulty = currentDifficulty) => {
  currentMode = mode;
  currentDifficulty = difficulty;
  difficultyOptions.classList.add("hide");
  modeScreen.classList.add("hide");
  gameScreen.classList.remove("hide");
  resetBoard();
};

boxes.forEach((box) => {
  box.addEventListener("click", () => {
    if (box.disabled || box.innerText !== "" || gameOver) return;

    box.innerText = turnX ? "X" : "O";
    box.disabled = true;

    if (checkWinner()) return;

    turnX = !turnX;

    if (currentMode === "bot" && !turnX) {
      setTimeout(makeBotMove, 350);
    }
  });
});

selfBtn.addEventListener("click", () => startGame("self", "intermediate"));
botBtn.addEventListener("click", () => {
  difficultyOptions.classList.remove("hide");
});

for (const button of difficultyButtons) {
  button.addEventListener("click", () => {
    startGame("bot", button.dataset.difficulty);
  });
}

resetBtn.addEventListener("click", resetBoard);
newGameBtn.addEventListener("click", showModeSelection);

showModeSelection();