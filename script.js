const STORAGE_KEY = "meri-game-state-v3";
const MAX_CARDS = 12;

const cardGrid = document.getElementById("cardGrid");
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
let lastHintText = "";
let lastHintState = "";

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
  let nextStateClass = "is-edit";
  let nextText = "";
  if (state.mode === "edit") {
    nextStateClass = "is-edit";
    const readyCount = state.cards.filter(isCardFilled).length;
    if (canStartGame()) {
      nextText = `✅ All cards ready (${readyCount}/${state.cards.length}). You can tap Start Game now.`;
    } else {
      nextText = `✍️ ${readyCount}/${state.cards.length} cards ready. Start Game is locked until every card has both front and back filled.`;
    }
  } else if (state.mode === "done") {
    nextStateClass = "is-done";
    nextText = `🎉 Finished! Your score is ${state.score} / ${state.cards.length}. Tap Reset Game to play again.`;
  } else {
    nextStateClass = "is-play";
    const remaining = state.cards.filter((card) => !card.submitted).length;
    nextText = `🎯 Game started! ${remaining} card(s) left. Flip the card, then tap ✅ or ❌.`;
  }

  phaseHintEl.classList.remove("is-edit", "is-play", "is-done");
  phaseHintEl.classList.add(nextStateClass);
  phaseHintEl.textContent = nextText;

  if (nextText !== lastHintText || nextStateClass !== lastHintState) {
    animatePhaseHint();
    lastHintText = nextText;
    lastHintState = nextStateClass;
  }
}

function animatePhaseHint() {
  phaseHintEl.classList.remove("pulse-in");
  // Trigger reflow so animation restarts every message update.
  void phaseHintEl.offsetWidth;
  phaseHintEl.classList.add("pulse-in");
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.cards) || parsed.cards.length < 1) return;

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

  const canGoNext =
    state.mode === "edit" && isCardFilled(card) && state.cards.length < MAX_CARDS;
  const nextAttr = canGoNext ? "" : "disabled";

  const backValue = isPlayMode
    ? `${submittedBadge}<p class="play-value">${meaningSafe || "-"}</p>
       <div class="play-actions">
         <button type="button" class="ok-btn ok" data-index="${idx}">✅</button>
         <button type="button" class="no-btn no" data-index="${idx}">❌</button>
       </div>`
    : `<input type="text" class="meaning-input" data-index="${idx}" value="${meaningSafe}" placeholder="Meaning" maxlength="120" />
       <div class="edit-actions">
         <button type="button" class="flip-edit-btn secondary" data-index="${idx}" data-flip="front">Flip</button>
         <button type="button" class="next-card-btn secondary" data-index="${idx}" ${nextAttr} aria-label="Next card">+ Next</button>
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
    const isReady = isCardFilled(state.cards[idx]);
    cardEl.classList.toggle("ready", isReady);
    const nextBtnEl = cardEl.querySelector(".next-card-btn");
    if (nextBtnEl) {
      nextBtnEl.disabled = !isReady || state.cards.length >= MAX_CARDS;
    }
  }

  startBtn.disabled = !canStartGame();
  updatePhaseText();
  saveState();
}

function closeCard() {
  const card = cardGrid.querySelector(".card");
  if (card) card.classList.remove("flipped");
}

function removeCardAtIndex(idx) {
  if (state.mode !== "edit") return;
  if (state.cards.length <= 1) return;
  if (!Number.isInteger(idx) || idx < 0 || idx >= state.cards.length) return;

  state.cards.splice(idx, 1);
  state.editIndex = Math.min(idx, state.cards.length - 1);
  render();
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
    const nextCardBtn = target.closest(".next-card-btn");
    if (nextCardBtn) {
      goNextCard();
      return;
    }

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
startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);

loadState();
render();
