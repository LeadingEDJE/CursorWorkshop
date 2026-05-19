import {
  boxesOverlap,
  formatScore,
  getScrollSpeed,
  getSpawnInterval,
  getSpawnJitterMultiplier,
  pickObstacleType,
} from "./gameUtils.js";
import {
  createStars,
  Dino,
  drawBackground,
  drawGround,
  getGroundY,
  Obstacle,
} from "./entities.js";
import { createInput } from "./input.js";

const DINO_X_RATIO = 0.15;
const MAX_DT = 0.05;

export class Game {
  constructor(canvas, ui, inputRoot) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = ui;
    this.input = createInput(inputRoot);
    this.state = "idle";
    this.obstacles = [];
    this.stars = [];
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.rafId = null;
    this.lastTime = 0;

    this.resize = this.resize.bind(this);
    window.addEventListener("resize", this.resize);
    this.resize();
    this.resetWorld();
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = w;
    this.height = h;
    this.groundY = getGroundY(h);
    this.stars = createStars(60, w, h);
    if (this.dino) {
      this.dino.setGroundY(this.groundY);
    }
  }

  resetWorld() {
    const dinoX = this.width * DINO_X_RATIO;
    this.dino = new Dino(dinoX, this.groundY);
    this.obstacles = [];
    this.elapsed = 0;
    this.spawnTimer = 0;
  }

  startRun() {
    this.resetWorld();
    this.state = "running";
    this.ui.startOverlay.hidden = true;
    this.ui.gameoverOverlay.hidden = true;
    this.ui.scoreDisplay.hidden = false;
    this.lastTime = performance.now();
  }

  gameOver() {
    this.state = "gameOver";
    this.ui.finalScore.textContent = formatScore(this.elapsed);
    this.ui.gameoverOverlay.hidden = false;
  }

  restart() {
    this.startRun();
  }

  tryStart() {
    if (this.state === "idle" && this.input.consumeStart()) {
      this.startRun();
    }
  }

  tryRestart() {
    if (this.state === "gameOver" && this.input.consumeRestart()) {
      this.restart();
    }
  }

  loop(timestamp) {
    const dt = Math.min(MAX_DT, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    if (this.state === "idle") {
      this.tryStart();
    } else if (this.state === "gameOver") {
      this.tryRestart();
    } else if (this.state === "running") {
      this.update(dt);
    }

    this.render(timestamp / 1000);
    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.elapsed += dt;
    this.ui.scoreValue.textContent = formatScore(this.elapsed);

    if (this.input.consumeJump()) {
      this.dino.jump();
    }

    this.dino.update(dt);
    const scrollSpeed = getScrollSpeed(this.elapsed);

    this.spawnTimer -= dt * 1000;
    if (this.spawnTimer <= 0) {
      const type = pickObstacleType();
      this.obstacles.push(
        new Obstacle(type, this.width + 20, this.groundY, this.height),
      );
      this.spawnTimer =
        getSpawnInterval(this.elapsed) * getSpawnJitterMultiplier(this.elapsed);
    }

    for (const obs of this.obstacles) {
      obs.update(dt, scrollSpeed);
    }
    this.obstacles = this.obstacles.filter((o) => !o.isOffScreen());

    const dinoBox = this.dino.hitbox;
    for (const obs of this.obstacles) {
      if (boxesOverlap(dinoBox, obs.hitbox)) {
        this.gameOver();
        return;
      }
    }
  }

  render(time) {
    const { ctx, width, height } = this;
    drawBackground(ctx, width, height, this.stars, time);
    drawGround(ctx, width, this.groundY);

    if (this.dino) {
      this.dino.draw(ctx);
    }

    for (const obs of this.obstacles) {
      obs.draw(ctx, this.groundY);
    }
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    window.removeEventListener("resize", this.resize);
    this.input.destroy();
  }
}
