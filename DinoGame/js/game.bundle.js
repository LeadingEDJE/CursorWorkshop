(() => {
  // js/gameUtils.js
  function formatScore(seconds) {
    const s = Math.max(0, Number(seconds) || 0);
    return `${s.toFixed(1)}s`;
  }
  function boxesOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }
  function getScrollSpeed(elapsedSeconds, baseSpeed = 300, cap = 800) {
    const t = Math.max(0, Number(elapsedSeconds) || 0);
    const bonus = Math.floor(t / 5) * 10;
    return Math.min(cap, baseSpeed + bonus);
  }
  function getSpawnInterval(elapsedSeconds, baseInterval = 1800, minInterval = 700) {
    const t = Math.max(0, Number(elapsedSeconds) || 0);
    const reduction = Math.floor(t / 6) * 110;
    return Math.max(minInterval, baseInterval - reduction);
  }
  function getSpawnJitterMultiplier(elapsedSeconds, random = Math.random()) {
    const t = Math.max(0, Number(elapsedSeconds) || 0);
    if (t >= 20 && t < 40) {
      return 0.8 + random * 0.5;
    }
    return 0.7 + random * 0.6;
  }
  function pickObstacleType(random = Math.random()) {
    return random < 0.6 ? "ground" : "air";
  }

  // js/entities.js
  var DINO_EMOJI = "\u{1F996}";
  var GROUND_EMOJI = "\u{1F335}";
  var AIR_EMOJI = "\u{1F985}";
  var GRAVITY = 1800;
  var JUMP_VELOCITY = -600;
  var DINO_FONT_SIZE = 48;
  var OBSTACLE_FONT_SIZE = 40;
  function getGroundY(canvasHeight) {
    return canvasHeight * 0.85;
  }
  var Dino = class {
    constructor(x, groundY) {
      this.x = x;
      this.groundY = groundY;
      this.width = 36;
      this.height = 42;
      this.vy = 0;
      this.grounded = true;
      this.y = groundY - this.height;
    }
    setGroundY(groundY) {
      this.groundY = groundY;
      if (this.grounded) {
        this.y = groundY - this.height;
      }
    }
    get y() {
      return this._y ?? this.groundY - this.height;
    }
    set y(value) {
      this._y = value;
    }
    get hitbox() {
      const pad = 6;
      return {
        x: this.x + pad,
        y: this.y + pad,
        width: this.width - pad * 2,
        height: this.height - pad * 2
      };
    }
    jump() {
      if (this.grounded) {
        this.vy = JUMP_VELOCITY;
        this.grounded = false;
      }
    }
    update(dt) {
      if (!this.grounded) {
        this.vy += GRAVITY * dt;
        this.y += this.vy * dt;
        const floor = this.groundY - this.height;
        if (this.y >= floor) {
          this.y = floor;
          this.vy = 0;
          this.grounded = true;
        }
      } else {
        this.y = this.groundY - this.height;
      }
    }
    draw(ctx) {
      const drawX = this.x - 4;
      const drawY = this.y + this.height + 4;
      ctx.save();
      ctx.font = `${DINO_FONT_SIZE}px serif`;
      ctx.textBaseline = "bottom";
      ctx.translate(drawX + DINO_FONT_SIZE, drawY);
      ctx.scale(-1, 1);
      ctx.fillText(DINO_EMOJI, 0, 0);
      ctx.restore();
    }
  };
  var Obstacle = class {
    constructor(type, x, groundY, canvasHeight) {
      this.type = type;
      this.x = x;
      this.emoji = type === "ground" ? GROUND_EMOJI : AIR_EMOJI;
      this.width = 32;
      this.height = type === "ground" ? 40 : 36;
      if (type === "ground") {
        this.y = groundY - this.height;
      } else {
        const jumpHeight = JUMP_VELOCITY * JUMP_VELOCITY / (2 * GRAVITY);
        const airY = groundY - jumpHeight * 0.6 - this.height;
        this.y = Math.max(canvasHeight * 0.35, airY);
      }
    }
    get hitbox() {
      const pad = 4;
      return {
        x: this.x + pad,
        y: this.y + pad,
        width: this.width - pad * 2,
        height: this.height - pad * 2
      };
    }
    update(dt, scrollSpeed) {
      this.x -= scrollSpeed * dt;
    }
    isOffScreen() {
      return this.x + this.width < 0;
    }
    draw(ctx, groundY) {
      ctx.font = `${OBSTACLE_FONT_SIZE}px serif`;
      ctx.textBaseline = "bottom";
      const drawY = this.type === "ground" ? groundY + 4 : this.y + this.height;
      ctx.fillText(this.emoji, this.x, drawY);
    }
  };
  function createStars(count, width, height) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.55,
        radius: Math.random() < 0.3 ? 2 : 1,
        color: Math.random() < 0.5 ? "#b537f2" : "#ffd319",
        twinkle: Math.random() * Math.PI * 2
      });
    }
    return stars;
  }
  function drawBackground(ctx, width, height, stars, time) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#0d0221");
    grad.addColorStop(1, "#1a1a2e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    for (const star of stars) {
      const alpha = 0.4 + 0.6 * Math.abs(Math.sin(time * 2 + star.twinkle));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawHorizonGrid(ctx, width, height);
  }
  function drawHorizonGrid(ctx, width, height) {
    const groundY = getGroundY(height);
    const horizonY = groundY - 20;
    const vanishX = width * 0.5;
    ctx.strokeStyle = "rgba(181, 55, 242, 0.25)";
    ctx.lineWidth = 1;
    const lines = 8;
    for (let i = 0; i < lines; i++) {
      const t = (i + 1) / lines;
      const y = horizonY + (groundY - horizonY) * t * t;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    const spokes = 12;
    for (let i = 0; i <= spokes; i++) {
      const x = i / spokes * width;
      ctx.beginPath();
      ctx.moveTo(vanishX, horizonY);
      ctx.lineTo(x, groundY + 40);
      ctx.stroke();
    }
  }
  function drawGround(ctx, width, groundY) {
    ctx.save();
    ctx.strokeStyle = "#ff2975";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#ff2975";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();
    ctx.restore();
  }

  // js/input.js
  var JUMP_KEYS = /* @__PURE__ */ new Set([" ", "Space", "ArrowUp"]);
  function isJumpKey(e) {
    return JUMP_KEYS.has(e.key) || e.code === "Space" || e.code === "ArrowUp";
  }
  function isSpaceKey(e) {
    return e.key === " " || e.key === "Space" || e.code === "Space";
  }
  function isPrimaryPointer(e) {
    return e.isPrimary !== false && e.button === 0;
  }
  function createInput(root) {
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
      }
    };
  }

  // js/game.js
  var DINO_X_RATIO = 0.15;
  var MAX_DT = 0.05;
  var Game = class {
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
      const dt = Math.min(MAX_DT, (timestamp - this.lastTime) / 1e3);
      this.lastTime = timestamp;
      if (this.state === "idle") {
        this.tryStart();
      } else if (this.state === "gameOver") {
        this.tryRestart();
      } else if (this.state === "running") {
        this.update(dt);
      }
      this.render(timestamp / 1e3);
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
      this.spawnTimer -= dt * 1e3;
      if (this.spawnTimer <= 0) {
        const type = pickObstacleType();
        this.obstacles.push(
          new Obstacle(type, this.width + 20, this.groundY, this.height)
        );
        this.spawnTimer = getSpawnInterval(this.elapsed) * getSpawnJitterMultiplier(this.elapsed);
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
  };

  // js/main.js
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
      restartBtn: $("restart-btn")
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
})();
