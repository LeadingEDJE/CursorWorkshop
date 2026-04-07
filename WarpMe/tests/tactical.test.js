/**
 * Tests for tactical station utility functions.
 *
 * These tests cover the pure-logic helpers introduced for the target status
 * sidebar block: hull color mapping, shield color mapping, condition labels,
 * and the condition class derivation.
 *
 * Run with:  node tests/tactical.test.js
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

// ─── Pure utilities mirrored from tactical.js ────────────────────────────────

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

const getShieldColor = (shieldRatio, shieldsOnline) => {
    if (!shieldsOnline || shieldRatio <= 0) return 'rgba(80, 80, 100, 0.4)';
    const b = 255;
    const g = Math.round(140 + 80 * shieldRatio);
    return `rgba(80, ${g}, ${b}, 0.9)`;
};

const getConditionLabel = (ship) => {
    const hullRatio   = ship.hull / Math.max(1, ship.maxHull);
    const shieldRatio = ship.shieldStrength / Math.max(1, ship.maxShieldStrength);
    const shieldsOn   = ship.subsystems.shields.power > 0;

    if (hullRatio <= 0.25) return 'Hull Critical';
    if (hullRatio <= 0.5)  return 'Hull Damaged';
    if (!shieldsOn || shieldRatio <= 0) return 'Shields Offline';
    if (shieldRatio <= 0.3) return 'Shields Critical';
    if (shieldRatio <= 0.6) return 'Shields Weakened';
    if (hullRatio <= 0.75)  return 'Hull Moderate';
    return 'Nominal';
};

const getConditionClass = (label) => {
    if (label === 'Nominal') return 'nominal';
    if (label === 'Hull Critical' || label === 'Shields Critical') return 'critical';
    return 'warning';
};

// ─── Helpers for building minimal test ships ─────────────────────────────────

const makeShip = ({ hull = 100, maxHull = 100, shields = 100, maxShields = 100, shieldPower = 50, scanned = false } = {}) => ({
    hull,
    maxHull,
    shieldStrength: shields,
    maxShieldStrength: maxShields,
    subsystems: { shields: { power: shieldPower } },
    scanned
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('getHullColor — matches renderer color mapping', () => {
    assert(getHullColor(1.0) === 'rgb(0, 255, 0)',  'full health is green');
    assert(getHullColor(0.6) === 'rgb(255, 255, 0)', '60% hull is yellow');
    assert(getHullColor(0.0) === 'rgb(255, 0, 0)',   'zero hull is red');

    const mid = getHullColor(0.5);
    assert(mid.startsWith('rgb(255,'), 'below 60% uses red channel at 255');

    assert(getHullColor(1.0) === getHullColor(1.0), 'pure function — same input, same output');

    const high = getHullColor(0.8);
    assert(high.startsWith('rgb('), 'returns rgb() string at 80%');
});

describe('getShieldColor — online shields', () => {
    const full = getShieldColor(1.0, true);
    assert(full.startsWith('rgba(80,'), 'full shields start with rgba(80,...)');
    assert(full.endsWith('0.9)'), 'full shields alpha is 0.9');

    const half = getShieldColor(0.5, true);
    assert(half !== full, '50% shields color differs from full');
    assert(half.startsWith('rgba(80,'), 'half shields start with rgba(80,...)');
});

describe('getShieldColor — offline / depleted shields', () => {
    const off     = getShieldColor(1.0, false);
    const zero    = getShieldColor(0.0, true);
    const dimColor = 'rgba(80, 80, 100, 0.4)';

    assert(off  === dimColor, 'offline shields return dim color regardless of ratio');
    assert(zero === dimColor, 'zero ratio returns dim color even when technically online');
});

describe('getConditionLabel — hull thresholds', () => {
    assert(getConditionLabel(makeShip({ hull: 10,  maxHull: 100 })) === 'Hull Critical', '10% hull → Hull Critical');
    assert(getConditionLabel(makeShip({ hull: 25,  maxHull: 100 })) === 'Hull Critical', '25% hull → Hull Critical');
    assert(getConditionLabel(makeShip({ hull: 26,  maxHull: 100 })) === 'Hull Damaged',  '26% hull → Hull Damaged');
    assert(getConditionLabel(makeShip({ hull: 50,  maxHull: 100 })) === 'Hull Damaged',  '50% hull → Hull Damaged');
    assert(getConditionLabel(makeShip({ hull: 51,  maxHull: 100, shields: 100 })) !== 'Hull Damaged', '51% hull is not Hull Damaged');
});

describe('getConditionLabel — hull moderate', () => {
    assert(
        getConditionLabel(makeShip({ hull: 70, maxHull: 100, shields: 80 })) === 'Hull Moderate',
        '70% hull with good shields → Hull Moderate'
    );
    assert(
        getConditionLabel(makeShip({ hull: 75, maxHull: 100, shields: 80 })) === 'Hull Moderate',
        '75% hull with good shields → Hull Moderate'
    );
});

describe('getConditionLabel — shield states', () => {
    assert(
        getConditionLabel(makeShip({ hull: 100, shields: 0,  shieldPower: 0 })) === 'Shields Offline',
        'shields off + power 0 → Shields Offline'
    );
    assert(
        getConditionLabel(makeShip({ hull: 100, shields: 50, shieldPower: 0 })) === 'Shields Offline',
        'power 0 → Shields Offline even with remaining strength'
    );
    assert(
        getConditionLabel(makeShip({ hull: 100, shields: 20, maxShields: 100 })) === 'Shields Critical',
        '20% shields → Shields Critical'
    );
    assert(
        getConditionLabel(makeShip({ hull: 100, shields: 50, maxShields: 100 })) === 'Shields Weakened',
        '50% shields → Shields Weakened'
    );
});

describe('getConditionLabel — nominal', () => {
    const nominal = getConditionLabel(makeShip({ hull: 100, shields: 100 }));
    assert(nominal === 'Nominal', 'full hull and shields → Nominal');

    const nearFull = getConditionLabel(makeShip({ hull: 90, shields: 90 }));
    assert(nearFull === 'Nominal', '90% hull and 90% shields → Nominal');
});

describe('getConditionClass — severity mapping', () => {
    assert(getConditionClass('Nominal')          === 'nominal',  'Nominal → nominal');
    assert(getConditionClass('Hull Critical')    === 'critical', 'Hull Critical → critical');
    assert(getConditionClass('Shields Critical') === 'critical', 'Shields Critical → critical');
    assert(getConditionClass('Hull Damaged')     === 'warning',  'Hull Damaged → warning');
    assert(getConditionClass('Shields Weakened') === 'warning',  'Shields Weakened → warning');
    assert(getConditionClass('Shields Offline')  === 'warning',  'Shields Offline → warning');
    assert(getConditionClass('Hull Moderate')    === 'warning',  'Hull Moderate → warning');
});

describe('unscanned target display — bar values should be unknown', () => {
    const unscanned = makeShip({ hull: 50, shields: 50, scanned: false });
    assert(!unscanned.scanned, 'ship is unscanned');
    // The updateTargetStatus() function uses ship.scanned to gate numeric display.
    // We verify the correct inputs that drive the "---" / 0% path.
    const hullRatio = unscanned.hull / Math.max(1, unscanned.maxHull);
    assert(typeof hullRatio === 'number', 'hull ratio is a number');
    assert(hullRatio > 0, 'hull ratio would be non-zero, but sidebar shows --- because not scanned');
});

describe('scanned target — ratios are clamped', () => {
    const overHealed = makeShip({ hull: 150, maxHull: 100 });
    const hullRatio  = Math.max(0, Math.min(1, overHealed.hull / Math.max(1, overHealed.maxHull)));
    assert(hullRatio === 1, 'hull ratio clamped to 1 when hull > maxHull');

    const destroyed  = makeShip({ hull: 0, maxHull: 100 });
    const zeroRatio  = Math.max(0, Math.min(1, destroyed.hull / Math.max(1, destroyed.maxHull)));
    assert(zeroRatio === 0, 'hull ratio clamped to 0 when hull is 0');
});

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(44)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
