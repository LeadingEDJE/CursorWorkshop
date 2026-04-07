// game.js — Canvas rendering, rAF loop, and keyboard input for Breakout.
// All game logic lives in C#. This module is a "dumb renderer" that executes
// draw commands returned by the C# GameEngine via DotNet.invokeMethodAsync.

let canvas = null;
let ctx = null;
let dotNetRef = null;
let rafId = null;
let lastTimestamp = null;
let dpr = 1;

// ── Input state ───────────────────────────────────────────────────────────────

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    KeyA: false,
    KeyD: false,
    Space: false,
};
let spaceJustPressed = false;
let spaceWasDown = false;

const GAME_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space']);

function onKeyDown(e) {
    const key = e.code;
    if (!GAME_KEYS.has(key)) return;
    e.preventDefault();
    keys[key] = true;
    if (key === 'Space' && !spaceWasDown) {
        spaceJustPressed = true;
        spaceWasDown = true;
    }
}

function onKeyUp(e) {
    const key = e.code;
    if (!GAME_KEYS.has(key)) return;
    e.preventDefault();
    keys[key] = false;
    if (key === 'Space') spaceWasDown = false;
}

function buildInputState() {
    return {
        leftPressed: keys['ArrowLeft'] || keys['KeyA'],
        rightPressed: keys['ArrowRight'] || keys['KeyD'],
        spacePressed: keys['Space'],
        spaceJustPressed: spaceJustPressed,
    };
}

// ── rAF Loop ──────────────────────────────────────────────────────────────────

async function loop(timestamp) {
    if (!dotNetRef || !ctx) return;

    const dt = lastTimestamp === null ? 0 : (timestamp - lastTimestamp) / 1000.0;
    lastTimestamp = timestamp;

    const input = buildInputState();
    spaceJustPressed = false; // consume after one frame

    let commandsJson;
    try {
        commandsJson = await dotNetRef.invokeMethodAsync('Tick', dt, input);
    } catch (err) {
        console.error('GameEngine.Tick error:', err);
        return;
    }

    const commands = JSON.parse(commandsJson);
    executeCommands(commands);

    rafId = requestAnimationFrame(loop);
}

// ── Draw command executor ─────────────────────────────────────────────────────

function executeCommands(commands) {
    for (const cmd of commands) {
        switch (cmd.type) {
            case 'clear':
                ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
                break;

            case 'rect':
                drawRect(cmd);
                break;

            case 'gradientRect':
                drawGradientRect(cmd);
                break;

            case 'circle':
                drawCircle(cmd);
                break;

            case 'text':
                drawText(cmd);
                break;

            case 'particle':
                drawParticle(cmd);
                break;

            case 'overlay':
                drawOverlay(cmd);
                break;
        }
    }
}

function drawRect(cmd) {
    ctx.save();
    ctx.globalAlpha = cmd.alpha ?? 1.0;
    if (cmd.glowColor && cmd.glowBlur > 0) {
        ctx.shadowColor = cmd.glowColor;
        ctx.shadowBlur = cmd.glowBlur;
    }
    ctx.fillStyle = cmd.color;
    if (cmd.cornerRadius > 0) {
        roundedRect(ctx, cmd.x, cmd.y, cmd.width, cmd.height, cmd.cornerRadius);
        ctx.fill();
    } else {
        ctx.fillRect(cmd.x, cmd.y, cmd.width, cmd.height);
    }
    ctx.restore();
}

function drawGradientRect(cmd) {
    ctx.save();
    if (cmd.glowColor && cmd.glowBlur > 0) {
        ctx.shadowColor = cmd.glowColor;
        ctx.shadowBlur = cmd.glowBlur;
    }
    const grad = ctx.createLinearGradient(cmd.x, cmd.y, cmd.x, cmd.y + cmd.height);
    grad.addColorStop(0, cmd.color1);
    grad.addColorStop(1, cmd.color2);
    ctx.fillStyle = grad;
    if (cmd.cornerRadius > 0) {
        roundedRect(ctx, cmd.x, cmd.y, cmd.width, cmd.height, cmd.cornerRadius);
        ctx.fill();
    } else {
        ctx.fillRect(cmd.x, cmd.y, cmd.width, cmd.height);
    }
    ctx.restore();
}

function drawCircle(cmd) {
    ctx.save();
    if (cmd.glowColor && cmd.glowBlur > 0) {
        ctx.shadowColor = cmd.glowColor;
        ctx.shadowBlur = cmd.glowBlur;
    }
    ctx.fillStyle = cmd.color;
    ctx.beginPath();
    ctx.arc(cmd.x, cmd.y, cmd.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawText(cmd) {
    ctx.save();
    if (cmd.shadowColor && cmd.shadowBlur > 0) {
        ctx.shadowColor = cmd.shadowColor;
        ctx.shadowBlur = cmd.shadowBlur;
    }
    ctx.fillStyle = cmd.color;
    ctx.font = cmd.font;
    ctx.textAlign = cmd.align ?? 'left';
    ctx.textBaseline = cmd.baseline ?? 'top';
    ctx.fillText(cmd.text, cmd.x, cmd.y);
    ctx.restore();
}

function drawParticle(cmd) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, cmd.alpha));
    ctx.fillStyle = cmd.color;
    ctx.beginPath();
    ctx.arc(cmd.x, cmd.y, cmd.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawOverlay(cmd) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, cmd.alpha));
    ctx.fillStyle = cmd.color;
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.restore();
}

// ── Canvas helper ─────────────────────────────────────────────────────────────

function roundedRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function setupCanvas(canvasEl) {
    dpr = window.devicePixelRatio || 1;
    const logicalW = 800;
    const logicalH = 600;

    canvasEl.width = logicalW * dpr;
    canvasEl.height = logicalH * dpr;
    canvasEl.style.width = logicalW + 'px';
    canvasEl.style.height = logicalH + 'px';

    const context = canvasEl.getContext('2d');
    context.scale(dpr, dpr);
    return context;
}

// ── Public exports ────────────────────────────────────────────────────────────

export function startLoop(canvasId, ref) {
    canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error('Canvas not found:', canvasId);
        return;
    }
    ctx = setupCanvas(canvas);
    dotNetRef = ref;
    lastTimestamp = null;

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    rafId = requestAnimationFrame(loop);
}

export function stopLoop() {
    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    dotNetRef = null;
    lastTimestamp = null;
}
