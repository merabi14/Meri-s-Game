<<<<<<< HEAD
const STORAGE_KEY = "meri-game-state-v2";
const MAX_CARDS = 12;

const cardGrid = document.getElementById("cardGrid");
const nextBtn = document.getElementById("nextBtn");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const scoreEl = document.getElementById("score");
const scoreFillEl = document.getElementById("scoreFill");
const phaseHintEl = document.getElementById("phaseHint");

function createCard() {
  return {
    word: "",
    meaning: "",
    answeredCorrect: false,
    submitted: false,
  };
}

let state = {
  mode: "edit", // edit | play | done
  score: 0,
  cards: [createCard()],
  editIndex: 0,
  playOrder: [],
  playPointer: 0,
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isCardFilled(card) {
  return card.word.trim().length > 0 && card.meaning.trim().length > 0;
}

function canStartGame() {
  return state.cards.length > 0 && state.cards.every(isCardFilled);
}

function currentEditCardFilled() {
  const card = state.cards[state.editIndex];
  return card ? isCardFilled(card) : false;
}

function shuffle(array) {
  const list = [...array];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function updateScore() {
  const total = state.cards.length;
  scoreEl.textContent = `Score: ${state.score} / ${total}`;
  const percent = total > 0 ? (state.score / total) * 100 : 0;
  scoreFillEl.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

function updatePhaseText() {
  if (state.mode === "edit") {
    phaseHintEl.textContent = `Card ${state.editIndex + 1} of ${state.cards.length} (max ${MAX_CARDS}). Fill both sides, then click Next Card or Start Game.`;
    return;
  }

  if (state.mode === "done") {
    phaseHintEl.textContent = `Game finished! Final score: ${state.score} / ${state.cards.length}. Use Reset Game to play again.`;
    return;
  }

  const remaining = state.cards.filter((card) => !card.submitted).length;
  phaseHintEl.textContent = `Play mode: ${remaining} card(s) left. Flip card, then tap ✅ or ❌.`;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.cards) || parsed.cards.length < 1) {
      return;
    }

    state.mode =
      parsed.mode === "play" || parsed.mode === "done" ? parsed.mode : "edit";
    state.score = Number.isInteger(parsed.score) ? parsed.score : 0;
    state.cards = parsed.cards.slice(0, MAX_CARDS).map((card) => ({
      word: String(card.word ?? ""),
      meaning: String(card.meaning ?? ""),
      answeredCorrect: Boolean(card.answeredCorrect),
      submitted: Boolean(card.submitted),
    }));

    state.editIndex = Math.min(
      Math.max(Number(parsed.editIndex) || 0, 0),
      Math.max(state.cards.length - 1, 0)
    );

    state.playOrder = Array.isArray(parsed.playOrder)
      ? parsed.playOrder.filter(
          (idx) => Number.isInteger(idx) && idx >= 0 && idx < state.cards.length
        )
      : [];
    state.playPointer = Number.isInteger(parsed.playPointer)
      ? parsed.playPointer
      : 0;

    if (state.mode !== "edit" && state.playOrder.length === 0) {
      state.mode = "done";
    }
  } catch {
    // Ignore corrupted localStorage data.
  }
}

function renderCards() {
  let idx = state.editIndex;
  if (state.mode !== "edit") {
    idx = state.playOrder[state.playPointer] ?? -1;
  }

  if (idx < 0 || idx >= state.cards.length) {
    cardGrid.innerHTML = "";
    return;
  }

  const card = state.cards[idx];
  const wordSafe = escapeHtml(card.word);
  const meaningSafe = escapeHtml(card.meaning);
  const isReady = state.mode === "edit" && isCardFilled(card);
  const isSubmitted = state.mode !== "edit" && Boolean(card.submitted);
  const isPlayMode = state.mode !== "edit";

  const submittedBadge = isSubmitted
    ? `<p class="submitted-badge ${card.answeredCorrect ? "correct" : "wrong"}">${
        card.answeredCorrect ? "✅ Correct" : "❌ Wrong"
      }</p>`
    : "";

  const frontValue = isPlayMode
    ? `${submittedBadge}<p class="play-value">${wordSafe || "-"}</p>`
    : `<input type="text" class="word-input" data-index="${idx}" value="${wordSafe}" placeholder="Word" maxlength="60" />
       <div class="edit-actions">
         <button type="button" class="flip-edit-btn secondary" data-index="${idx}" data-flip="back">Flip</button>
       </div>`;

  const backValue = isPlayMode
    ? `${submittedBadge}<p class="play-value">${meaningSafe || "-"}</p>
       <div class="play-actions">
         <button type="button" class="ok-btn ok" data-index="${idx}">✅</button>
         <button type="button" class="no-btn no" data-index="${idx}">❌</button>
       </div>`
    : `<input type="text" class="meaning-input" data-index="${idx}" value="${meaningSafe}" placeholder="Meaning" maxlength="120" />
       <div class="edit-actions">
         <button type="button" class="flip-edit-btn secondary" data-index="${idx}" data-flip="front">Flip</button>
       </div>`;
  const removeButton =
    state.mode === "edit" && state.cards.length > 1
      ? `<button type="button" class="remove-card-btn" data-index="${idx}" aria-label="Remove this card">✕</button>`
      : "";

  cardGrid.innerHTML = `
    <article class="card ${isPlayMode ? "playable" : ""} ${isReady ? "ready" : ""} ${isSubmitted ? "submitted" : ""}" data-index="${idx}">
      ${removeButton}
      <div class="card-inner">
        <div class="card-face card-front">
          <p class="card-label">Front</p>
          ${frontValue}
        </div>
        <div class="card-face card-back">
          <p class="card-label">Back</p>
          ${backValue}
        </div>
      </div>
    </article>`;
}

function render() {
  nextBtn.disabled =
    state.mode !== "edit" ||
    !currentEditCardFilled() ||
    state.cards.length >= MAX_CARDS;
  startBtn.disabled = state.mode !== "edit" || !canStartGame();
  updateScore();
  updatePhaseText();
  renderCards();
  saveState();
}

function handleGridInput(event) {
  if (state.mode !== "edit") return;
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  const idx = Number(target.dataset.index);
  if (!Number.isInteger(idx) || idx < 0 || idx >= state.cards.length) return;

  if (target.classList.contains("word-input")) {
    state.cards[idx].word = target.value;
  } else if (target.classList.contains("meaning-input")) {
    state.cards[idx].meaning = target.value;
  } else {
    return;
  }

  const cardEl = target.closest(".card");
  if (cardEl) {
    cardEl.classList.toggle("ready", isCardFilled(state.cards[idx]));
  }

  nextBtn.disabled = !currentEditCardFilled() || state.cards.length >= MAX_CARDS;
  startBtn.disabled = !canStartGame();
  updatePhaseText();
  saveState();
}

function closeCard() {
  const card = cardGrid.querySelector(".card");
  if (card) card.classList.remove("flipped");
}

function handleGridClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const cardEl = target.closest(".card");
  if (!cardEl) return;

  const idx = Number(cardEl.dataset.index);
  if (!Number.isInteger(idx) || idx < 0 || idx >= state.cards.length) return;

  if (state.mode === "edit") {
    const removeBtn = target.closest(".remove-card-btn");
    if (removeBtn) {
      removeCardAtIndex(idx);
      return;
    }

    const editFlipBtn = target.closest(".flip-edit-btn");
    if (!editFlipBtn) return;

    const direction = editFlipBtn.getAttribute("data-flip");
    if (direction === "back") {
      cardEl.classList.add("flipped");
    } else {
      cardEl.classList.remove("flipped");
    }
    return;
  }

  if (state.mode === "done" || state.cards[idx].submitted) return;

  const clickedButton = target.closest("button");
  if (clickedButton?.classList.contains("ok-btn")) {
    state.cards[idx].answeredCorrect = true;
    state.cards[idx].submitted = true;
    state.score += 1;
    moveToNextPlayCard();
    return;
  }

  if (clickedButton?.classList.contains("no-btn")) {
    state.cards[idx].answeredCorrect = false;
    state.cards[idx].submitted = true;
    moveToNextPlayCard();
    return;
  }

  if (!cardEl.classList.contains("flipped")) {
    cardEl.classList.add("flipped");
  } else {
    cardEl.classList.remove("flipped");
  }
}

function removeCardAtIndex(idx) {
  if (state.mode !== "edit") return;
  if (state.cards.length <= 1) return;
  if (!Number.isInteger(idx) || idx < 0 || idx >= state.cards.length) return;

  state.cards.splice(idx, 1);
  state.editIndex = Math.min(idx, state.cards.length - 1);
  render();
}

function goNextCard() {
  if (state.mode !== "edit" || !currentEditCardFilled()) return;
  if (state.cards.length >= MAX_CARDS) return;

  state.cards.push(createCard());
  state.editIndex = state.cards.length - 1;
  render();
}

function startGame() {
  if (!canStartGame()) return;
  closeCard();
  state.mode = "play";
  state.cards = state.cards.filter(isCardFilled).slice(0, MAX_CARDS);
  state.cards.forEach((card) => {
    card.answeredCorrect = false;
    card.submitted = false;
  });
  state.score = 0;
  state.playOrder = shuffle(state.cards.map((_, idx) => idx));
  state.playPointer = 0;
  render();
}

function moveToNextPlayCard() {
  state.playPointer += 1;
  if (state.playPointer >= state.playOrder.length) {
    state.mode = "done";
    state.playOrder = [];
    state.playPointer = 0;
  }
  render();
}

function resetGame() {
  state = {
    mode: "edit",
    score: 0,
    cards: [createCard()],
    editIndex: 0,
    playOrder: [],
    playPointer: 0,
  };
  render();
}

cardGrid.addEventListener("input", handleGridInput);
cardGrid.addEventListener("click", handleGridClick);
nextBtn.addEventListener("click", goNextCard);
startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);

loadState();
render();
=======
const STORAGE_KEY = "flashcard-game-state-v1";
const ALLOWED_COUNTS = [6, 9, 12];

const cardGrid = document.getElementById("cardGrid");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const scoreEl = document.getElementById("score");
const scoreFillEl = document.getElementById("scoreFill");
const phaseHintEl = document.getElementById("phaseHint");
const countBtns = Array.from(document.querySelectorAll(".count-btn"));

function createEmptyCards(count) {
  return Array.from({ length: count }, () => ({
    word: "",
    meaning: "",
    answeredCorrect: false,
    submitted: false,
  }));
}

let state = {
  cardCount: 6,
  mode: "edit", // edit | play
  score: 0,
  cards: createEmptyCards(6),
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function canStartGame() {
  return state.cards.every(
    (card) => card.word.trim().length > 0 && card.meaning.trim().length > 0
  );
}

function updateScore() {
  scoreEl.textContent = `Score: ${state.score} / ${state.cardCount}`;
  const percent = state.cardCount > 0 ? (state.score / state.cardCount) * 100 : 0;
  scoreFillEl.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

function updatePhaseText() {
  if (state.mode === "edit") {
    phaseHintEl.textContent = canStartGame()
      ? "Ready to play: click Start Game."
      : `Phase 1 + 2: Fill word (front) and meaning (back) on all ${state.cardCount} cards.`;
  } else {
    phaseHintEl.textContent =
      "Play mode: flip a card, then tap ✅ if correct or ❌ to close.";
  }
}

function updateCountButtons() {
  countBtns.forEach((btn) => {
    const count = Number(btn.dataset.count);
    const isActive = count === state.cardCount;
    btn.classList.toggle("active", isActive);
    btn.disabled = state.mode === "play";
  });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    const parsedCount = Number(parsed?.cardCount);
    const validCount = ALLOWED_COUNTS.includes(parsedCount) ? parsedCount : 6;
    if (!parsed || !Array.isArray(parsed.cards) || parsed.cards.length !== validCount) {
      return;
    }

    state.cardCount = validCount;
    state.mode = parsed.mode === "play" ? "play" : "edit";
    state.score = Number.isInteger(parsed.score) ? parsed.score : 0;
    state.cards = parsed.cards.map((card) => ({
      word: String(card.word ?? ""),
      meaning: String(card.meaning ?? ""),
      answeredCorrect: Boolean(card.answeredCorrect),
      submitted: Boolean(card.submitted),
    }));
  } catch {
    // Ignore corrupted localStorage data.
  }
}

function renderCards() {
  const isPlayMode = state.mode === "play";
  cardGrid.dataset.count = String(state.cardCount);

  cardGrid.innerHTML = state.cards
    .map((card, idx) => {
      const wordSafe = escapeHtml(card.word);
      const meaningSafe = escapeHtml(card.meaning);
      const isReady =
        state.mode === "edit" &&
        card.word.trim().length > 0 &&
        card.meaning.trim().length > 0;
      const isSubmitted = state.mode === "play" && Boolean(card.submitted);
      const submittedBadge = isSubmitted
        ? `<p class="submitted-badge ${card.answeredCorrect ? "correct" : "wrong"}">${
            card.answeredCorrect ? "✅ Correct" : "❌ Wrong"
          }</p>`
        : "";
      const frontValue = isPlayMode
        ? `${submittedBadge}<p class="play-value">${wordSafe || "-"}</p>`
        : `<input type="text" class="word-input" data-index="${idx}" value="${wordSafe}" placeholder="Word" maxlength="60" />
           <div class="edit-actions">
             <button type="button" class="flip-edit-btn secondary" data-index="${idx}" data-flip="back">Flip</button>
           </div>`;
      const backValue = isPlayMode
        ? `${submittedBadge}<p class="play-value">${meaningSafe || "-"}</p>
           <div class="play-actions">
             <button type="button" class="ok-btn ok" data-index="${idx}">✅</button>
             <button type="button" class="no-btn no" data-index="${idx}">❌</button>
           </div>`
        : `<input type="text" class="meaning-input" data-index="${idx}" value="${meaningSafe}" placeholder="Meaning" maxlength="120" />
           <div class="edit-actions">
             <button type="button" class="flip-edit-btn secondary" data-index="${idx}" data-flip="front">Flip</button>
           </div>`;

      return `
      <article class="card ${isPlayMode ? "playable" : ""} ${isReady ? "ready" : ""} ${isSubmitted ? "submitted" : ""}" data-index="${idx}">
        <div class="card-inner">
          <div class="card-face card-front">
            <p class="card-label">Front</p>
            ${frontValue}
          </div>
          <div class="card-face card-back">
            <p class="card-label">Back</p>
            ${backValue}
          </div>
        </div>
      </article>`;
    })
    .join("");
}

function render() {
  startBtn.disabled = state.mode !== "edit" || !canStartGame();
  updateCountButtons();
  updateScore();
  updatePhaseText();
  renderCards();
  saveState();
}

function handleGridInput(event) {
  if (state.mode !== "edit") return;
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  const idx = Number(target.dataset.index);
  if (!Number.isInteger(idx) || idx < 0 || idx >= state.cards.length) return;

  if (target.classList.contains("word-input")) {
    state.cards[idx].word = target.value;
  } else if (target.classList.contains("meaning-input")) {
    state.cards[idx].meaning = target.value;
  } else {
    return;
  }

  const cardEl = target.closest(".card");
  if (cardEl) {
    const readyNow =
      state.cards[idx].word.trim().length > 0 &&
      state.cards[idx].meaning.trim().length > 0;
    cardEl.classList.toggle("ready", readyNow);
  }

  // Avoid full re-render while typing to preserve focus/cursor position.
  startBtn.disabled = !canStartGame();
  updatePhaseText();
  saveState();
}

function closeAllCards() {
  cardGrid.querySelectorAll(".card.flipped").forEach((card) => {
    card.classList.remove("flipped");
  });
}

function handleGridClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const cardEl = target.closest(".card");
  if (!cardEl) return;

  const idx = Number(cardEl.dataset.index);
  if (!Number.isInteger(idx) || idx < 0 || idx >= state.cards.length) return;

  if (state.mode === "edit") {
    const editFlipBtn = target.closest(".flip-edit-btn");
    if (!editFlipBtn) return;

    const direction = editFlipBtn.getAttribute("data-flip");
    if (direction === "back") {
      cardEl.classList.add("flipped");
    } else {
      cardEl.classList.remove("flipped");
    }
    return;
  }

  if (state.cards[idx].submitted) {
    return;
  }

  const clickedButton = target.closest("button");
  if (clickedButton?.classList.contains("ok-btn")) {
    if (!state.cards[idx].answeredCorrect) {
      state.cards[idx].answeredCorrect = true;
      state.score += 1;
      updateScore();
    }
    state.cards[idx].submitted = true;
    render();
    return;
  }

  if (clickedButton?.classList.contains("no-btn")) {
    state.cards[idx].answeredCorrect = false;
    state.cards[idx].submitted = true;
    render();
    return;
  }

  if (!cardEl.classList.contains("flipped")) {
    closeAllCards();
    cardEl.classList.add("flipped");
  } else {
    cardEl.classList.remove("flipped");
  }
}

function startGame() {
  if (!canStartGame()) return;
  closeAllCards();
  state.mode = "play";
  state.cards.forEach((card) => {
    card.answeredCorrect = false;
    card.submitted = false;
  });
  state.score = 0;
  render();
}

function resetGame() {
  state = {
    cardCount: state.cardCount,
    mode: "edit",
    score: 0,
    cards: createEmptyCards(state.cardCount),
  };
  render();
}

function setCardCount(count) {
  if (!ALLOWED_COUNTS.includes(count) || state.mode !== "edit") return;
  if (state.cardCount === count && state.cards.length === count) return;

  state.cardCount = count;
  state.score = 0;
  state.cards = createEmptyCards(count);
  render();
}

cardGrid.addEventListener("input", handleGridInput);
cardGrid.addEventListener("click", handleGridClick);
startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);
countBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const count = Number(btn.dataset.count);
    setCardCount(count);
  });
});

loadState();
render();
>>>>>>> origin/main
