/**
 * Tests for helm station utility functions.
 *
 * These tests cover the pure-logic helpers used by the helm compass:
 * heading-from-vector calculation, needle rotation formula, and heading
 * normalization.
 *
 * Run with:  node tests/helm.test.js
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

// ─── Pure utilities mirrored from helm.js ───────────────────────────────────

const calculateHeadingFromVector = (dx, dy) => {
    let heading = Math.atan2(dy, dx) * 180 / Math.PI;
    if (heading < 0) heading += 360;
    return heading;
};

const normalizeHeading = (heading) => ((heading % 360) + 360) % 360;

// Game convention: 0° = right, 90° = down.
// CSS rotate(0deg) = up (12 o'clock). Offset of +90° aligns them.
const compassNeedleRotation = (heading) => heading + 90;

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('calculateHeadingFromVector — cardinal directions', () => {
    assert(calculateHeadingFromVector(1, 0) === 0,   'right (+x) → 0°');
    assert(calculateHeadingFromVector(0, 1) === 90,   'down (+y) → 90°');
    assert(calculateHeadingFromVector(-1, 0) === 180, 'left (-x) → 180°');
    assert(calculateHeadingFromVector(0, -1) === 270, 'up (-y) → 270°');
});

describe('calculateHeadingFromVector — intercardinal directions', () => {
    const h45 = calculateHeadingFromVector(1, 1);
    assert(Math.abs(h45 - 45) < 0.01, 'down-right → 45°');

    const h135 = calculateHeadingFromVector(-1, 1);
    assert(Math.abs(h135 - 135) < 0.01, 'down-left → 135°');

    const h225 = calculateHeadingFromVector(-1, -1);
    assert(Math.abs(h225 - 225) < 0.01, 'up-left → 225°');

    const h315 = calculateHeadingFromVector(1, -1);
    assert(Math.abs(h315 - 315) < 0.01, 'up-right → 315°');
});

describe('calculateHeadingFromVector — always returns [0, 360)', () => {
    for (let angle = 0; angle < 360; angle += 15) {
        const rad = angle * Math.PI / 180;
        const h = calculateHeadingFromVector(Math.cos(rad), Math.sin(rad));
        assert(h >= 0 && h < 360, `angle ${angle}° → result ${h.toFixed(2)} in [0, 360)`);
    }
});

describe('compassNeedleRotation — offset maps game heading to CSS rotation', () => {
    assert(compassNeedleRotation(0) === 90,    'heading 0° (right) → CSS 90° (3 o\'clock)');
    assert(compassNeedleRotation(90) === 180,   'heading 90° (down) → CSS 180° (6 o\'clock)');
    assert(compassNeedleRotation(180) === 270,  'heading 180° (left) → CSS 270° (9 o\'clock)');
    assert(compassNeedleRotation(270) === 360,  'heading 270° (up) → CSS 360° (12 o\'clock)');
});

describe('compassNeedleRotation — screenshot regression (heading 231°)', () => {
    const rotation = compassNeedleRotation(231);
    assert(rotation === 321, 'heading 231° → CSS 321° (upper-left quadrant)');
});

describe('normalizeHeading — wraps values into [0, 360)', () => {
    assert(normalizeHeading(0) === 0,     '0 stays 0');
    assert(normalizeHeading(359) === 359, '359 stays 359');
    assert(normalizeHeading(360) === 0,   '360 wraps to 0');
    assert(normalizeHeading(720) === 0,   '720 wraps to 0');
    assert(normalizeHeading(-1) === 359,  '-1 wraps to 359');
    assert(normalizeHeading(-90) === 270, '-90 wraps to 270');
    assert(normalizeHeading(-360) === 0,  '-360 wraps to 0');
    assert(normalizeHeading(450) === 90,  '450 wraps to 90');
});

// ─── Summary ────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(44)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
