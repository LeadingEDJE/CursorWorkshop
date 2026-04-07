/**
 * Tests for renderer utility functions.
 *
 * These tests cover the pure-logic helpers introduced for the ship status
 * visual system (particle system, hull color, damage thresholds).
 *
 * Run with:  node tests/renderer.test.js
 */

let passed = 0;
let failed = 0;

const assert = (condition, message) => {
    if (condition) {
        console.log(`  PASS  ${message}`);
        passed++;
    } else {
        console.error(`  FAIL  ${message}`);
        failed++;
    }
};

const describe = (name, fn) => {
    console.log(`\n${name}`);
    fn();
};

// ─── Pure utilities mirrored from renderer.js ────────────────────────────────

const seededRandom = (seed) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
};

const getHullColor = (hullRatio) => {
    let r, g;
    if (hullRatio > 0.6) {
        r = Math.round(255 * (1 - hullRatio) / 0.4);
        g = 255;
    } else {
        r = 255;
        g = Math.round(255 * hullRatio / 0.6);
    }
    return `rgb(${r}, ${g}, 0)`;
};

const shouldEmitSmoke = (hullRatio) => hullRatio < 0.7;
const shouldEmitFire  = (hullRatio) => hullRatio < 0.35;

const getDamageSeverity = (hullRatio) => {
    if (hullRatio >= 0.7) return 0;
    return 1 - hullRatio / 0.7;
};

// Minimal particle update loop (mirrors updateParticles logic)
const runParticleTick = (particles) => {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.lifetime--;
        if (p.lifetime <= 0) particles.splice(i, 1);
    }
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('seededRandom', () => {
    assert(seededRandom(42) >= 0 && seededRandom(42) <= 1, 'returns value in [0, 1]');
    assert(seededRandom(42) === seededRandom(42),           'same seed always returns same value');
    assert(seededRandom(1)  !== seededRandom(2),            'different seeds produce different values');
    assert(seededRandom(0)  !== seededRandom(100),          'seed 0 and seed 100 differ');
});

describe('getHullColor', () => {
    const full = getHullColor(1.0);
    assert(full.startsWith('rgb('),  'returns rgb() string');
    assert(full === getHullColor(1.0), 'pure function — same input, same output');
    assert(full === 'rgb(0, 255, 0)',  'full health is green');

    assert(getHullColor(0.6) === 'rgb(255, 255, 0)', '60% hull is yellow');
    assert(getHullColor(0.0) === 'rgb(255, 0, 0)',    'zero hull is red');

    const mid = getHullColor(0.5);
    assert(mid !== full,             'mid health differs from full health');
    assert(mid.startsWith('rgb(255,'), 'below 60% uses red channel at 255');
});

describe('smoke threshold (hull < 70%)', () => {
    assert(!shouldEmitSmoke(1.0),  'no smoke at 100% hull');
    assert(!shouldEmitSmoke(0.75), 'no smoke at 75% hull');
    assert(!shouldEmitSmoke(0.7),  'no smoke exactly at 70% hull');
    assert(shouldEmitSmoke(0.69),  'smoke starts below 70%');
    assert(shouldEmitSmoke(0.5),   'smoke at 50% hull');
    assert(shouldEmitSmoke(0.1),   'smoke at 10% hull');
    assert(shouldEmitSmoke(0.0),   'smoke at 0% hull');
});

describe('fire threshold (hull < 35%)', () => {
    assert(!shouldEmitFire(1.0),  'no fire at 100% hull');
    assert(!shouldEmitFire(0.5),  'no fire at 50% hull');
    assert(!shouldEmitFire(0.35), 'no fire exactly at 35% hull');
    assert(shouldEmitFire(0.34),  'fire starts below 35%');
    assert(shouldEmitFire(0.1),   'fire at 10% hull');
    assert(shouldEmitFire(0.0),   'fire at 0% hull');
});

describe('getDamageSeverity', () => {
    assert(getDamageSeverity(1.0) === 0, 'severity 0 at full health');
    assert(getDamageSeverity(0.7) === 0, 'severity 0 at 70% hull (threshold)');

    const half = getDamageSeverity(0.35);
    assert(half > 0 && half < 1,        'mid-damage severity is between 0 and 1');
    assert(Math.abs(half - 0.5) < 0.01, '35% hull ≈ 0.5 severity');

    assert(getDamageSeverity(0.0) === 1, 'severity 1 at 0% hull');
});

describe('particle aging and movement', () => {
    const particles = [
        { x: 0, y: 0, vx: 1, vy: -1, lifetime: 3, maxLifetime: 3, color: 'gray', size: 2, layer: 'smoke' },
        { x: 5, y: 5, vx: 0, vy:  0, lifetime: 1, maxLifetime: 5, color: 'orange', size: 1, layer: 'fire'  }
    ];

    runParticleTick(particles);

    assert(particles.length === 1,             'particle with lifetime 1 is removed after one tick');
    assert(particles[0].layer === 'smoke',     'surviving particle is the smoke one');
    assert(particles[0].x === 1,              'particle moved by vx=1');
    assert(particles[0].y === -1,             'particle moved by vy=-1');
    assert(particles[0].lifetime === 2,       'lifetime decremented from 3 to 2');
});

describe('particle cap (performance guard)', () => {
    const particles = [];
    const MAX = 600;
    for (let i = 0; i < MAX + 50; i++) {
        particles.push({ x: i, y: 0, vx: 0, vy: 0, lifetime: 10, maxLifetime: 10, color: 'gray', size: 1, layer: 'smoke' });
        if (particles.length > MAX) particles.splice(0, particles.length - MAX);
    }
    assert(particles.length === MAX, `particle pool does not exceed ${MAX}`);
});

describe('scar hash stability (deterministic from string)', () => {
    const hashFn = (id) => id.split('').reduce((acc, ch) => acc * 31 + ch.codePointAt(0), 1);
    const h1 = hashFn('player');
    const h2 = hashFn('player');
    const h3 = hashFn('other-ship');
    assert(h1 === h2,  'same id always produces same hash');
    assert(h1 !== h3,  'different ids produce different hashes');
    assert(Number.isInteger(h1), 'hash is an integer');
});

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(44)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
