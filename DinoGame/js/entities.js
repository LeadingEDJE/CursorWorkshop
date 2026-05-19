/**
 * Game entities: dino, obstacles, scenery.
 */

const DINO_EMOJI = "🦖";
const GROUND_EMOJI = "🌵";
const AIR_EMOJI = "🦅";

const GRAVITY = 1800;
const JUMP_VELOCITY = -600;
const DINO_FONT_SIZE = 48;
const OBSTACLE_FONT_SIZE = 40;

export function getGroundY(canvasHeight) {
  return canvasHeight * 0.85;
}

export class Dino {
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
      height: this.height - pad * 2,
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
    // Emoji faces left by default; flip so the dino runs to the right.
    ctx.translate(drawX + DINO_FONT_SIZE, drawY);
    ctx.scale(-1, 1);
    ctx.fillText(DINO_EMOJI, 0, 0);
    ctx.restore();
  }
}

export class Obstacle {
  constructor(type, x, groundY, canvasHeight) {
    this.type = type;
    this.x = x;
    this.emoji = type === "ground" ? GROUND_EMOJI : AIR_EMOJI;
    this.width = 32;
    this.height = type === "ground" ? 40 : 36;

    if (type === "ground") {
      this.y = groundY - this.height;
    } else {
      // Mid-jump height (~60% of max jump arc)
      const jumpHeight = (JUMP_VELOCITY * JUMP_VELOCITY) / (2 * GRAVITY);
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
      height: this.height - pad * 2,
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
}

/** Procedural star field for synthwave sky. */
export function createStars(count, width, height) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height * 0.55,
      radius: Math.random() < 0.3 ? 2 : 1,
      color: Math.random() < 0.5 ? "#b537f2" : "#ffd319",
      twinkle: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

export function drawBackground(ctx, width, height, stars, time) {
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
    const x = (i / spokes) * width;
    ctx.beginPath();
    ctx.moveTo(vanishX, horizonY);
    ctx.lineTo(x, groundY + 40);
    ctx.stroke();
  }
}

export function drawGround(ctx, width, groundY) {
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
