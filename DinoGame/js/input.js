/**
 * Keyboard and pointer input for jump and game flow (start / restart).
 */

const JUMP_KEYS = new Set([" ", "Space", "ArrowUp"]);

function isJumpKey(e) {
  return JUMP_KEYS.has(e.key) || e.code === "Space" || e.code === "ArrowUp";
}

function isSpaceKey(e) {
  return e.key === " " || e.key === "Space" || e.code === "Space";
}

function isPrimaryPointer(e) {
  return e.isPrimary !== false && e.button === 0;
}

/**
 * @param {HTMLElement} root Game shell — receives pointer events (including over overlays).
 */
export function createInput(root) {
  let jumpQueued = false;
  let startPressed = false;
  let restartPressed = false;

  function queueJump() {
    jumpQueued = true;
  }

  function queueStart() {
    startPressed = true;
  }

  function queueRestart() {
    restartPressed = true;
  }

  /** Left click / primary tap: same as Space (jump, start, restart). */
  function queuePrimaryAction() {
    queueJump();
    queueStart();
    queueRestart();
  }

  function onKeyDown(e) {
    if (isJumpKey(e)) {
      e.preventDefault();
      queueJump();
      if (isSpaceKey(e)) {
        queueStart();
        queueRestart();
      }
      if (e.key === "ArrowUp" || e.code === "ArrowUp") {
        queueStart();
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      queueStart();
      queueRestart();
    }
  }

  function onPointerDown(e) {
    if (!isPrimaryPointer(e)) {
      return;
    }
    if (e.target instanceof Element && e.target.closest("#restart-btn")) {
      return;
    }
    e.preventDefault();
    root.focus({ preventScroll: true });
    queuePrimaryAction();
  }

  const capture = { capture: true };
  root.addEventListener("pointerdown", onPointerDown, capture);
  document.addEventListener("keydown", onKeyDown, capture);

  return {
    consumeJump() {
      if (jumpQueued) {
        jumpQueued = false;
        return true;
      }
      return false;
    },
    consumeStart() {
      if (startPressed) {
        startPressed = false;
        return true;
      }
      return false;
    },
    consumeRestart() {
      if (restartPressed) {
        restartPressed = false;
        return true;
      }
      return false;
    },
    destroy() {
      root.removeEventListener("pointerdown", onPointerDown, capture);
      document.removeEventListener("keydown", onKeyDown, capture);
    },
  };
}
