
const ROWS = 8;
const COLS = 8;
const TYPES = 5;

// HTML öğeleri
const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const movesElement = document.getElementById("moves");
const chainElement = document.getElementById("chain");
const messageElement = document.getElementById("message");
const popupElement = document.getElementById("math-popup");
const expressionElement = document.getElementById("math-expression");
const newGameButton = document.getElementById("new-game");

const langTrButton = document.getElementById("lang-tr");
const langEnButton = document.getElementById("lang-en");

const gameOverPopup = document.getElementById("game-over-popup");
const gameOverTitle = document.getElementById("game-over-title");
const gameOverMessage = document.getElementById("game-over-message");
const finalScoreElement = document.getElementById("final-score");
const finalScoreLabel = document.getElementById("final-score-label");
const shuffleButton = document.getElementById("shuffle-button");
const restartButton = document.getElementById("restart-button");

// Dil metinleri
let currentLanguage = "tr";

const translations = {
    tr: {
        title: "Sayı Patlat",
pageTitle: "Sayı Patlat",
        subtitle: "Aynı sayıları eşleştir, toplamlarını keşfet!",
gameInstruction: "Aynı sayılı en az 3 şekli eşleştir!",
        newGame: "Yeni Oyun",
        noMatch: "Eşleşme olmadı. Başka bir hamle dene!",
        matched: "Harika! Eşleşmeler bulundu.",
        falling: "Şekerler düşüyor...",
        gameOver: "Oyun Bitti",
        noMoves: "Hamle kalmadı!",
        shuffle: "Karıştır",
        shuffleEarned: "Karıştırma hakkı kazandın!",
        shuffleMessage: "Karıştırma hakkını kullanıp devam edebilirsin.",
        noMovesMessage: "Yapılabilecek hamle kalmadı.",
        continueMessage: "Tahta karıştırıldı. Devam edebilirsin!",
        startMessage: "Aynı sayılı en az 3 şekli eşleştir!",
        shuffleFailed: "Tahta karıştırılamadı. Tekrar deneyebilirsin.",
        scoreLabel: "Puanın:",
        chain: "zincir eşleşmesi!",
        chainContinue: "zincir eşleşmesi! Devam et!",
        nextMatch: "Güzel! Yeni bir eşleşme ara.",
                candy: "Şeker",
        scoreTitle: "PUAN",
        movesTitle: "HAMLE",
        chainTitle: "ZİNCİR",
        boardLabel: "Oyun alanı",
        footer1: "Yatay veya dikey en az 3 aynı sayıyı eşleştir.",
        footer2: "Eşleşmelerin toplamını gör ve puan kazan!"
    },
    en: {
        title: "Number Blast",
pageTitle: "Number Blast",
        subtitle: "Match the same numbers and discover their sum!",
gameInstruction: "Match at least 3 numbers of the same value!",
        newGame: "New Game",
        noMatch: "No match. Try another move!",
        matched: "Great! Matches found.",
        falling: "Numbers are falling...",
        gameOver: "Game Over",
        noMoves: "No More Moves!",
        shuffle: "Shuffle",
        shuffleEarned: "You earned a shuffle!",
        shuffleMessage: "Use your shuffle to keep playing.",
        noMovesMessage: "There are no more possible moves.",
        continueMessage: "Board shuffled. Keep playing!",
        startMessage: "Match at least 3 numbers!",
        shuffleFailed: "Could not shuffle the board. Try again.",
        scoreLabel: "Your Score:",
        chain: "chain match!",
        chainContinue: "chain matches! Keep going!",
        nextMatch: "Great! Find another match.",
                candy: "Number",
        scoreTitle: "SCORE",
        movesTitle: "MOVES",
        chainTitle: "CHAIN",
        boardLabel: "Game board",
        footer1: "Match at least 3 identical numbers horizontally or vertically.",
        footer2: "See the sum of your matches and earn points!"
    }
};

// Oyun durumu
let board = [];
let selectedIndex = null;
let score = 0;
let moves = 0;
let chain = 0;
let busy = false;
let matchedCells = new Set();
let animateFall = false;
let previousBoard = [];
let fallOffsets = Array(ROWS * COLS).fill(0);
let gameRunId = 0;

let shuffleAvailable = false;
let nextShuffleMilestone = 1000;

const sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

// Dil değiştirme
function setLanguage(language) {
    currentLanguage = language;

    langTrButton.classList.toggle("active", language === "tr");
    langEnButton.classList.toggle("active", language === "en");

    document.documentElement.lang = language;
document.title = translations[language].pageTitle;
    document.getElementById("score-label").textContent =
        translations[language].scoreTitle;

    document.getElementById("moves-label").textContent =
        translations[language].movesTitle;

    document.getElementById("chain-label").textContent =
        translations[language].chainTitle;

    document.getElementById("board").setAttribute(
        "aria-label",
        translations[language].boardLabel
    );

    const footer = document.querySelector("footer");
    footer.childNodes[0].textContent =
        translations[language].footer1;

    footer.childNodes[2].textContent =
        translations[language].footer2;
    document.querySelector(".game-header h1").textContent =
        translations[language].title;

    document.querySelector(".game-header p").textContent =
        translations[language].subtitle;

    newGameButton.textContent = translations[language].newGame;
messageElement.textContent =
    translations[language].gameInstruction;

    shuffleButton.textContent =
        "🔀 " + translations[language].shuffle;

    restartButton.textContent =
        "↻ " + translations[language].newGame;

    gameOverTitle.textContent = shuffleAvailable
        ? translations[language].noMoves
        : translations[language].gameOver;

    gameOverMessage.textContent = shuffleAvailable
        ? translations[language].shuffleMessage
        : translations[language].noMovesMessage;

    if (finalScoreLabel) {
        finalScoreLabel.textContent =
            translations[language].scoreLabel;
    }

    // Tahtadaki erişilebilir adları güncelle.
    boardElement.querySelectorAll(".candy").forEach(candy => {
        if (!candy.classList.contains("empty")) {
            candy.setAttribute(
                "aria-label",
                `${translations[language].candy} ${candy.textContent}`
            );
        }
    });
}

langTrButton.addEventListener("click", () => setLanguage("tr"));
langEnButton.addEventListener("click", () => setLanguage("en"));

function indexOf(row, col) {
    return row * COLS + col;
}

function randomCandy() {
    const availableTypes = Math.min(
        9,
        TYPES + Math.floor(moves / 10)
    );

    return Math.floor(Math.random() * availableTypes) + 1;
}


function createBoard() {
    board = [];

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            let value;

            do {
                value = randomCandy();
            } while (
                (
                    col >= 2 &&
                    board[indexOf(row, col - 1)] === value &&
                    board[indexOf(row, col - 2)] === value
                ) ||
                (
                    row >= 2 &&
                    board[indexOf(row - 1, col)] === value &&
                    board[indexOf(row - 2, col)] === value
                )
            );

            board.push(value);
        }
    }
}


function renderBoard() {
    const firstCandy = boardElement.querySelector(".candy");
    const rowGap =
        parseFloat(getComputedStyle(boardElement).rowGap) || 0;

    const cellPitch = firstCandy
        ? firstCandy.getBoundingClientRect().height + rowGap
        : 50;

    boardElement.innerHTML = "";

    board.forEach((value, index) => {
        const candy = document.createElement("button");

        candy.type = "button";
        candy.className = "candy";

        if (value === null) {
            candy.classList.add("empty");
            candy.textContent = "";
            candy.disabled = true;
        } else {
            candy.textContent = value;
            candy.classList.add(`color-${value}`);

            candy.setAttribute(
                "aria-label",
                `${translations[currentLanguage].candy} ${value}`
            );

            if (animateFall && fallOffsets[index] !== 0) {
                candy.classList.add("falling");

                candy.style.setProperty(
                    "--fall-distance",
                    `${fallOffsets[index] * cellPitch}px`
                );
            }

            if (matchedCells.has(index)) {
                candy.classList.add("matched");
            }

            if (selectedIndex === index && !busy) {
                candy.classList.add("selected");
            }

            candy.disabled = busy;
            candy.addEventListener(
                "click",
                () => handleCandyClick(index)
            );
        }

        boardElement.appendChild(candy);
    });
}

function updateStats() {
    scoreElement.textContent = score;
    movesElement.textContent = moves;
    chainElement.textContent = chain;
}

function hidePopup() {
    popupElement.classList.remove("show");
    expressionElement.textContent = "";
}

async function showMath(group, runId) {
    const values = group.map(index => board[index]);
    const total = values.reduce((sum, value) => sum + value, 0);

    expressionElement.textContent =
        `${values.join(" + ")} = ${total}`;

    popupElement.classList.add("show");

    score += total;

    // Her 1000 puanda bir karıştırma hakkı ver.
    // Kullanılmamış haklar birikmez.
    while (score >= nextShuffleMilestone) {
        if (!shuffleAvailable) {
            shuffleAvailable = true;

            messageElement.textContent =
                `${nextShuffleMilestone} ${
                    currentLanguage === "tr" ? "puana ulaştın!" : "points reached!"
                } ${translations[currentLanguage].shuffleEarned}`;
        }

        nextShuffleMilestone += 1000;
    }

    updateStats();

    await sleep(850);

    if (runId !== gameRunId) {
        return;
    }

    hidePopup();
    await sleep(120);
}

function findMatches() {
    const candidates = [];

    // Yatay eşleşmeleri bul.
    for (let row = 0; row < ROWS; row++) {
        let col = 0;

        while (col < COLS) {
            const value = board[indexOf(row, col)];

            if (value === null) {
                col++;
                continue;
            }

            const group = [indexOf(row, col)];
            let nextCol = col + 1;

            while (
                nextCol < COLS &&
                board[indexOf(row, nextCol)] === value
            ) {
                group.push(indexOf(row, nextCol));
                nextCol++;
            }

            if (group.length >= 3) {
                candidates.push(group);
            }

            col = nextCol;
        }
    }

    // Dikey eşleşmeleri bul.
    for (let col = 0; col < COLS; col++) {
        let row = 0;

        while (row < ROWS) {
            const value = board[indexOf(row, col)];

            if (value === null) {
                row++;
                continue;
            }

            const group = [indexOf(row, col)];
            let nextRow = row + 1;

            while (
                nextRow < ROWS &&
                board[indexOf(nextRow, col)] === value
            ) {
                group.push(indexOf(nextRow, col));
                nextRow++;
            }

            if (group.length >= 3) {
                candidates.push(group);
            }

            row = nextRow;
        }
    }

    // Kesişen eşleşmeleri birleştir.
    const matched = new Set();

    for (const group of candidates) {
        for (const index of group) {
            matched.add(index);
        }
    }

    const groups = [];
    const visited = new Set();

    for (const start of matched) {
        if (visited.has(start)) {
            continue;
        }

        const value = board[start];
        const group = [];
        const stack = [start];

        visited.add(start);

        while (stack.length > 0) {
            const current = stack.pop();
            group.push(current);

            const row = Math.floor(current / COLS);
            const col = current % COLS;

            const neighbors = [
                [row - 1, col],
                [row + 1, col],
                [row, col - 1],
                [row, col + 1]
            ];

            for (const [nextRow, nextCol] of neighbors) {
                if (
                    nextRow < 0 ||
                    nextRow >= ROWS ||
                    nextCol < 0 ||
                    nextCol >= COLS
                ) {
                    continue;
                }

                const nextIndex = indexOf(nextRow, nextCol);

                if (
                    matched.has(nextIndex) &&
                    !visited.has(nextIndex) &&
                    board[nextIndex] === value
                ) {
                    visited.add(nextIndex);
                    stack.push(nextIndex);
                }
            }
        }

        groups.push(group);
    }

    return groups;
}

function areAdjacent(first, second) {
    const row1 = Math.floor(first / COLS);
    const col1 = first % COLS;
    const row2 = Math.floor(second / COLS);
    const col2 = second % COLS;

    return (
        Math.abs(row1 - row2) +
        Math.abs(col1 - col2) === 1
    );
}

function hasLegalMove() {
    for (let index = 0; index < board.length; index++) {
        if (board[index] === null) {
            continue;
        }

        const row = Math.floor(index / COLS);
        const col = index % COLS;
        const neighbors = [];

        if (col < COLS - 1) {
            neighbors.push(index + 1);
        }

        if (row < ROWS - 1) {
            neighbors.push(index + COLS);
        }

        for (const neighbor of neighbors) {
            if (board[neighbor] === null) {
                continue;
            }

            [board[index], board[neighbor]] =
                [board[neighbor], board[index]];

            const createsMatch = findMatches().length > 0;

            [board[index], board[neighbor]] =
                [board[neighbor], board[index]];

            if (createsMatch) {
                return true;
            }
        }
    }

    return false;
}

function showGameOver() {
    gameOverTitle.textContent = shuffleAvailable
        ? translations[currentLanguage].noMoves
        : translations[currentLanguage].gameOver;

    gameOverMessage.textContent = shuffleAvailable
        ? translations[currentLanguage].shuffleMessage
        : translations[currentLanguage].noMovesMessage;

    finalScoreElement.textContent = score;

    if (finalScoreLabel) {
        finalScoreLabel.textContent =
            translations[currentLanguage].scoreLabel;
    }

    shuffleButton.hidden = !shuffleAvailable;
    restartButton.hidden = shuffleAvailable;

    gameOverPopup.classList.add("show");
}

function shuffleToPlayableBoard() {
    const values = [...board];

    // Mevcut şekerleri karıştırmayı dene.
    for (let attempt = 0; attempt < 1000; attempt++) {
        for (let i = values.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [values[i], values[j]] =
                [values[j], values[i]];
        }

        board = [...values];

        if (findMatches().length === 0 && hasLegalMove()) {
            return true;
        }
    }

    // Gerekirse yeni bir tahta oluştur.
    for (let attempt = 0; attempt < 1000; attempt++) {
        createBoard();

        if (findMatches().length === 0 && hasLegalMove()) {
            return true;
        }
    }

    return false;
}

function useShuffle() {
    if (busy || !shuffleAvailable) {
        return;
    }

    if (!shuffleToPlayableBoard()) {
        messageElement.textContent =
            translations[currentLanguage].shuffleFailed;
        return;
    }

    // Hak yalnızca başarılı karıştırmadan sonra tüketilir.
    shuffleAvailable = false;
    gameOverPopup.classList.remove("show");

    selectedIndex = null;
    renderBoard();

    messageElement.textContent =
        translations[currentLanguage].continueMessage;
}

shuffleButton.addEventListener("click", useShuffle);
restartButton.addEventListener("click", newGame);

async function handleCandyClick(index) {
    if (busy || board[index] === null) {
        return;
    }

    if (selectedIndex === null) {
        selectedIndex = index;
        renderBoard();
        return;
    }

    if (selectedIndex === index) {
        selectedIndex = null;
        renderBoard();
        return;
    }

    if (!areAdjacent(selectedIndex, index)) {
        selectedIndex = index;
        renderBoard();
        return;
    }

    const first = selectedIndex;
    const second = index;

    selectedIndex = null;

    [board[first], board[second]] =
        [board[second], board[first]];

    renderBoard();

    const groups = findMatches();

    if (groups.length === 0) {
        await sleep(150);

        [board[first], board[second]] =
            [board[second], board[first]];

        renderBoard();

        messageElement.textContent =
            translations[currentLanguage].noMatch;

        return;
    }

    moves++;
    chain = 0;
    updateStats();

    messageElement.textContent =
        translations[currentLanguage].matched;

    // Eşleşmeyi çöz, şekerleri düşür ve zincirleri kontrol et.
    await resolveBoard();
}

function applyGravity() {
    previousBoard = [...board];
    fallOffsets = Array(ROWS * COLS).fill(0);

    for (let col = 0; col < COLS; col++) {
        const remaining = [];

        // Mevcut şekerleri alttan yukarı kaydet.
        for (let row = ROWS - 1; row >= 0; row--) {
            const index = indexOf(row, col);
            const value = board[index];

            if (value !== null) {
                remaining.push({
                    value: value,
                    oldRow: row
                });
            }
        }

        // Şekerleri yeni konumlarına yerleştir.
        for (let row = ROWS - 1; row >= 0; row--) {
            const index = indexOf(row, col);
            const item = remaining[ROWS - 1 - row];

            if (item) {
                board[index] = item.value;
                fallOffsets[index] = item.oldRow - row;
            } else {
                board[index] = randomCandy();
                fallOffsets[index] = -(row + 1);
            }
        }
    }
}

async function resolveBoard() {
    busy = true;
    const runId = gameRunId;
    let cascade = 0;

    try {
        while (runId === gameRunId) {
            const groups = findMatches();

            if (groups.length === 0) {
                break;
            }

            cascade++;
            chain = cascade;
            updateStats();

            matchedCells = new Set(
                groups.flatMap(group => group)
            );

            renderBoard();

            // Eşleşmelerin toplamlarını sırayla göster.
            for (const group of groups) {
                if (runId !== gameRunId) {
                    return;
                }

                await showMath(group, runId);
            }

            if (runId !== gameRunId) {
                return;
            }

            // Eşleşen şekerleri kaldır.
            for (const index of matchedCells) {
                board[index] = null;
            }

            matchedCells.clear();

            // Şekerleri düşür ve boşlukları doldur.
            applyGravity();

            animateFall = true;
            renderBoard();
            animateFall = false;

            messageElement.textContent = cascade > 1
                ? `${cascade}. ${translations[currentLanguage].chain}`
                : translations[currentLanguage].falling;

            await sleep(600);
        }

        if (runId === gameRunId) {
            messageElement.textContent = cascade > 1
                ? `${cascade} ${translations[currentLanguage].chainContinue}`
                : translations[currentLanguage].nextMatch;
        }
    } finally {
        if (runId === gameRunId) {
            matchedCells.clear();
            selectedIndex = null;
            busy = false;

            hidePopup();
            renderBoard();
            updateStats();

            // Tahta durulduğunda geçerli hamle ara.
            if (!hasLegalMove()) {
                showGameOver();
            }
        }
    }
}

function newGame() {
    gameRunId++;

    busy = false;
    selectedIndex = null;
    matchedCells.clear();

    score = 0;
    moves = 0;
    chain = 0;

    shuffleAvailable = false;
    nextShuffleMilestone = 1000;

    gameOverPopup.classList.remove("show");

    hidePopup();
    createBoard();
    updateStats();
    renderBoard();

    messageElement.textContent =
        translations[currentLanguage].startMessage;
}

newGameButton.addEventListener("click", newGame);

// Başlangıç dili ve yeni oyun
setLanguage(currentLanguage);
newGame();
