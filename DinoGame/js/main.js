import { Game } from "./game.js";

function $(id) {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing element #${id}`);
  }
  return el;
}

function init() {
  const shell = document.querySelector(".game-shell");
  if (!shell) {
    throw new Error("Missing .game-shell");
  }
  shell.tabIndex = 0;
  shell.addEventListener("pointerdown", () => shell.focus({ preventScroll: true }));
  shell.focus({ preventScroll: true });

  const canvas = $("game-canvas");
  const ui = {
    scoreDisplay: $("score-display"),
    scoreValue: $("score-value"),
    startOverlay: $("start-overlay"),
    gameoverOverlay: $("gameover-overlay"),
    finalScore: $("final-score"),
    restartBtn: $("restart-btn"),
  };

  const game = new Game(canvas, ui, shell);

  ui.restartBtn.addEventListener("click", () => {
    if (game.state === "gameOver") {
      game.restart();
    }
  });

}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
