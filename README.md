# Meri`s Game

A lightweight browser-based flashcard game built with plain HTML, CSS, and vanilla JavaScript.

Players create word/meaning cards, start the game, flip cards, and mark whether they knew the answer to earn points.

## Features

- No backend, no database, no frameworks
- Runs fully in browser
- Card count picker: `6`, `9`, or `12`
- 3-phase flow:
  - Edit cards (write words and meanings)
  - Start game (inputs locked)
  - Play mode (flip + submit answer)
- Score panel with progress bar
- Card states:
  - Ready cards highlighted in edit mode
  - Submitted cards gray in play mode
  - Submitted result badge (`✅ Correct` / `❌ Wrong`)
- Reset game button
- Local storage support (state persists across refresh)
- Responsive layout for desktop and mobile

## Tech Stack

- `index.html`
- `style.css`
- `script.js`

## Project Structure

```text
flashcard-game/
│
├── index.html
├── style.css
├── script.js
└── README.md
```

## How To Run

### Option 1 (quickest)

Open `index.html` directly in your browser.

### Option 2 (local static server)

Use any static server (VS Code Live Server, Python, Nginx, Apache, etc.).

Example with Python:

```bash
python -m http.server 8080
```

Then open:

`http://localhost:8080`

## Game Flow

1. Choose card amount (`6`, `9`, or `12`)
2. Fill **Front** and **Back** for each card
3. Click **Start Game**
4. In play mode:
   - Click card to flip
   - Press `✅` if correct (adds score)
   - Press `❌` if not (no score)
5. Card becomes submitted (gray) and shows what you chose
6. Use **Reset Game** to clear and start over

## Notes

- Card count can only be changed in edit mode (before starting the game).
- Start button is enabled only when all cards are fully filled.
- Game data is stored in browser local storage.

## Deployment

This project is ready for static hosting:

- GitHub Pages
- Netlify
- Vercel (static)
- Nginx / Apache

No server-side code is required.
