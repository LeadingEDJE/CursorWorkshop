import { describe, expect, it } from "vitest";
import { Dino, getGroundY } from "../js/entities.js";

describe("Dino", () => {
  it("rises above the ground after jump", () => {
    const groundY = getGroundY(600);
    const dino = new Dino(80, groundY);
    const floorY = groundY - dino.height;
    expect(dino.y).toBe(floorY);

    dino.jump();
    dino.update(0.1);

    expect(dino.grounded).toBe(false);
    expect(dino.y).toBeLessThan(floorY);
  });
});
