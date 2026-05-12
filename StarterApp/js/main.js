import { createCounter, formatGreeting } from "./appState.js";

function $(id) {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing element #${id}`);
  }
  return el;
}

function init() {
  const nameInput = $("builder-name");
  const greetBtn = $("greet-btn");
  const greetingOut = $("greeting-out");

  const countOut = $("count-out");
  const incBtn = $("increment-btn");
  const resetBtn = $("reset-btn");

  const counter = createCounter(0);

  function renderGreeting() {
    greetingOut.textContent = formatGreeting(nameInput.value);
  }

  function renderCount() {
    countOut.textContent = String(counter.value);
  }

  greetBtn.addEventListener("click", () => {
    renderGreeting();
  });

  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      renderGreeting();
    }
  });

  incBtn.addEventListener("click", () => {
    counter.increment(1);
    renderCount();
  });

  resetBtn.addEventListener("click", () => {
    counter.reset(0);
    renderCount();
  });

  // Initial paint
  renderGreeting();
  renderCount();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
