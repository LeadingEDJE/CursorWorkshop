import { describe, expect, it, afterEach } from "vitest";
import { createInput } from "../js/input.js";

function key(type, init) {
  return new KeyboardEvent(type, { bubbles: true, cancelable: true, ...init });
}

function pointerDown(init = {}) {
  return new PointerEvent("pointerdown", {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    ...init,
  });
}

describe("createInput", () => {
  /** @type {HTMLElement[]} */
  const roots = [];

  afterEach(() => {
    for (const root of roots) {
      root.remove();
    }
    roots.length = 0;
  });

  function mount() {
    const shell = document.createElement("div");
    document.body.appendChild(shell);
    roots.push(shell);
    return shell;
  }

  it("registers jump after keyup before consume", () => {
    const root = mount();
    const input = createInput(root);
    document.dispatchEvent(key("keydown", { key: " ", code: "Space" }));
    document.dispatchEvent(key("keyup", { key: " ", code: "Space" }));
    expect(input.consumeJump()).toBe(true);
    input.destroy();
  });

  it("queues jump on primary pointer down", () => {
    const root = mount();
    const input = createInput(root);
    root.dispatchEvent(pointerDown());
    expect(input.consumeJump()).toBe(true);
    expect(input.consumeStart()).toBe(true);
    input.destroy();
  });

  it("ignores pointer down on restart button", () => {
    const root = mount();
    const btn = document.createElement("button");
    btn.id = "restart-btn";
    root.appendChild(btn);
    const input = createInput(root);
    btn.dispatchEvent(pointerDown());
    expect(input.consumeJump()).toBe(false);
    input.destroy();
  });
});
