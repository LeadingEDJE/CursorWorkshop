/**
 * Weapons Station
 * Target lock, phaser and torpedo controls
 */

import { gameState } from '../core/state.js';
import { renderer } from '../core/renderer.js';
import { audio } from '../core/audio.js';

const ORDNANCE_CONFIG = {
    torpedo: { maxAmmo: 15, cooldown: 60, label: 'Homing', btnClass: 'btn-warning' },
    dumbTorpedo: { maxAmmo: 8, cooldown: 45, label: 'Dumb', btnClass: 'btn-info' },
    nuke: { maxAmmo: 6, cooldown: 120, label: 'Nuke', btnClass: 'btn-nuke' }
};

class WeaponsStation {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.scale = 1.5;
        this.phaserCharge = 100;
        this.phaserCooldown = 0;
        this.selectedOrdnanceType = 'torpedo';
        this.torpedoCount = 15;
        this.dumbTorpedoCount = 8;
        this.nukeCount = 6;
        this.torpedoCooldown = 0;
        this.dumbTorpedoCooldown = 0;
        this.nukeCooldown = 0;
    }

    init(container) {
        this.container = container;
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="station-layout weapons-layout">
                <div class="weapons-main">
                    <div class="canvas-container">
                        <canvas id="weapons-canvas"></canvas>
                        <div class="targeting-overlay">
                            <div class="targeting-reticle"></div>
                        </div>
                    </div>
                </div>
                <div class="weapons-sidebar">
                    <div class="panel">
                        <h3>TARGET</h3>
                        <div id="target-info" class="target-info">
                            <p class="dim">No target locked</p>
                        </div>
                        <select id="target-select" class="select-input">
                            <option value="">-- Select Target --</option>
                        </select>
                    </div>
                    <div class="panel">
                        <h3>PHASERS</h3>
                        <div class="weapon-status">
                            <div class="progress-bar">
                                <div id="phaser-charge" class="progress-fill phaser-fill" style="width: 100%"></div>
                            </div>
                            <span id="phaser-pct">100%</span>
                        </div>
                        <button id="fire-phaser" class="btn btn-danger btn-large">
                            <span class="btn-icon">⚡</span> FIRE PHASERS
                        </button>
                    </div>
                    <div class="panel">
                        <h3>ORDNANCE</h3>
                        <div class="weapon-type-selector" role="tablist">
                            <button type="button" role="tab" class="weapon-type-btn active" data-type="torpedo" aria-selected="true">Homing</button>
                            <button type="button" role="tab" class="weapon-type-btn" data-type="dumbTorpedo" aria-selected="false">Dumb</button>
                            <button type="button" role="tab" class="weapon-type-btn" data-type="nuke" aria-selected="false">Nuke</button>
                        </div>
                        <div class="ordnance-display">
                            <div class="torpedo-count">
                                <span id="ordnance-count">15</span> / <span id="ordnance-max">15</span>
                            </div>
                            <div class="torpedo-tubes">
                                <div class="torpedo-tube" data-tube="1">●</div>
                                <div class="torpedo-tube" data-tube="2">●</div>
                                <div class="torpedo-tube" data-tube="3">●</div>
                                <div class="torpedo-tube" data-tube="4">●</div>
                                <div class="torpedo-tube" data-tube="5">●</div>
                            </div>
                            <button id="fire-ordnance" class="btn btn-warning btn-large" aria-label="Fire selected ordnance">
                                <span class="btn-icon">◉</span> <span id="fire-ordnance-label">FIRE TORPEDO</span>
                            </button>
                        </div>
                    </div>
                    <div class="panel">
                        <h3>WEAPON STATUS</h3>
                        <div class="system-status">
                            <div class="status-row">
                                <span>System Health:</span>
                                <span id="weapon-health">100%</span>
                            </div>
                            <div class="status-row">
                                <span>Power Level:</span>
                                <span id="weapon-power">50%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.canvas = document.getElementById('weapons-canvas');
        renderer.init(this.canvas);
        this.updateTargetSelect();
        this.updateTargetInfo();
        this.updateOrdnanceDisplay();
    }

    setupEventListeners() {
        // Fire phaser
        document.getElementById('fire-phaser').addEventListener('click', () => {
            this.firePhaser();
        });

        // Fire ordnance
        document.getElementById('fire-ordnance').addEventListener('click', () => {
            this.fireOrdnance();
        });

        // Weapon type selector
        document.querySelectorAll('.weapon-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                if (type) {
                    this.selectedOrdnanceType = type;
                    document.querySelectorAll('.weapon-type-btn').forEach(b => {
                        b.classList.toggle('active', b.dataset.type === type);
                        b.setAttribute('aria-selected', b.dataset.type === type);
                    });
                    this.updateOrdnanceDisplay();
                }
            });
        });

        // Target select
        document.getElementById('target-select').addEventListener('change', (e) => {
            if (e.target.value) {
                gameState.setTarget(e.target.value);
                audio.playTargetLock();
            } else {
                gameState.setTarget(null);
            }
            this.updateTargetInfo();
        });

        // Canvas click for targeting
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });

        // Listen for target changes
        gameState.on('targetChanged', () => {
            this.updateTargetSelect();
            this.updateTargetInfo();
        });

        gameState.on('shipDestroyed', () => {
            this.updateTargetSelect();
            this.updateTargetInfo();
        });
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        const worldPos = renderer.screenToWorld(
            screenX, screenY,
            gameState.playerShip.x,
            gameState.playerShip.y,
            this.scale
        );

        // Find closest ship to click
        let closestShip = null;
        let closestDist = 40 * this.scale;

        gameState.ships.forEach(ship => {
            const dist = Math.hypot(ship.x - worldPos.x, ship.y - worldPos.y);
            if (dist < closestDist) {
                closestDist = dist;
                closestShip = ship;
            }
        });

        if (closestShip) {
            gameState.setTarget(closestShip.id);
            audio.playTargetLock();
        }
    }

    firePhaser() {
        if (this.phaserCooldown > 0 || this.phaserCharge < 20) {
            audio.playError();
            return;
        }

        if (!gameState.currentTarget) {
            gameState.addCommsMessage('WEAPONS', 'No target locked!', 'alert');
            audio.playError();
            return;
        }

        if (gameState.fireWeapon('phaser', gameState.currentTarget)) {
            audio.playPhaser();
            this.phaserCharge -= 20;
            this.phaserCooldown = 30; // 0.5 second cooldown
        }
    }

    fireOrdnance() {
        const type = this.selectedOrdnanceType;
        const cfg = ORDNANCE_CONFIG[type];
        const ammo = this.getOrdnanceCount(type);
        const cooldown = this.getOrdnanceCooldown(type);

        if (cooldown > 0 || ammo <= 0) {
            audio.playError();
            return;
        }

        if (gameState.fireWeapon(type, gameState.currentTarget)) {
            if (type === 'nuke') {
                audio.playNukeLaunch();
            } else {
                audio.playTorpedo();
            }
            this.decrementOrdnance(type);
            this.setOrdnanceCooldown(type, cfg.cooldown);
            this.updateOrdnanceDisplay();
        }
    }

    getOrdnanceCount(type) {
        const counts = { torpedo: this.torpedoCount, dumbTorpedo: this.dumbTorpedoCount, nuke: this.nukeCount };
        return counts[type] ?? this.torpedoCount;
    }

    getOrdnanceCooldown(type) {
        const cooldowns = { torpedo: this.torpedoCooldown, dumbTorpedo: this.dumbTorpedoCooldown, nuke: this.nukeCooldown };
        return cooldowns[type] ?? this.torpedoCooldown;
    }

    setOrdnanceCooldown(type, value) {
        if (type === 'torpedo') this.torpedoCooldown = value;
        else if (type === 'dumbTorpedo') this.dumbTorpedoCooldown = value;
        else this.nukeCooldown = value;
    }

    decrementOrdnance(type) {
        if (type === 'torpedo') this.torpedoCount--;
        else if (type === 'dumbTorpedo') this.dumbTorpedoCount--;
        else this.nukeCount--;
    }

    updateTargetSelect() {
        const select = document.getElementById('target-select');
        if (!select) return;

        const currentValue = select.value;
        
        select.innerHTML = '<option value="">-- Select Target --</option>' +
            gameState.ships.map(ship => {
                const dist = Math.hypot(
                    ship.x - gameState.playerShip.x,
                    ship.y - gameState.playerShip.y
                );
                const name = ship.scanned ? ship.name : 'Unknown Contact';
                const selected = ship.id === gameState.currentTarget ? 'selected' : '';
                return `<option value="${ship.id}" ${selected}>${name} (${Math.round(dist)} km)</option>`;
            }).join('');
    }

    updateTargetInfo() {
        const info = document.getElementById('target-info');
        if (!info) return;

        const target = gameState.getShip(gameState.currentTarget);
        
        if (!target) {
            info.innerHTML = '<p class="dim">No target locked</p>';
            return;
        }

        const dist = Math.hypot(
            target.x - gameState.playerShip.x,
            target.y - gameState.playerShip.y
        );

        const inPhaserRange = dist <= 500;
        const inTorpedoRange = dist <= 1500;

        info.innerHTML = `
            <div class="target-detail">
                <div class="target-name faction-${target.faction}">
                    ${target.scanned ? target.name : 'UNKNOWN'}
                </div>
                <div class="target-stats">
                    <div class="stat-row">
                        <span>Distance:</span>
                        <span>${Math.round(dist)} km</span>
                    </div>
                    <div class="stat-row">
                        <span>Bearing:</span>
                        <span>${this.getBearing(target)}°</span>
                    </div>
                    <div class="stat-row">
                        <span>Phaser Range:</span>
                        <span class="${inPhaserRange ? 'text-green' : 'text-red'}">
                            ${inPhaserRange ? 'IN RANGE' : 'OUT OF RANGE'}
                        </span>
                    </div>
                    <div class="stat-row">
                        <span>Ordnance Range:</span>
                        <span class="${inTorpedoRange ? 'text-green' : 'text-red'}">
                            ${inTorpedoRange ? 'IN RANGE' : 'OUT OF RANGE'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    getBearing(target) {
        const dx = target.x - gameState.playerShip.x;
        const dy = target.y - gameState.playerShip.y;
        let angle = Math.atan2(dy, dx) * 180 / Math.PI;
        if (angle < 0) angle += 360;
        return Math.round(angle);
    }

    updateOrdnanceDisplay() {
        const type = this.selectedOrdnanceType;
        const cfg = ORDNANCE_CONFIG[type];
        const ammo = this.getOrdnanceCount(type);

        const countEl = document.getElementById('ordnance-count');
        const maxEl = document.getElementById('ordnance-max');
        if (countEl) countEl.textContent = ammo;
        if (maxEl) maxEl.textContent = cfg.maxAmmo;

        const tubes = document.querySelectorAll('.torpedo-tube');
        tubes.forEach((tube, i) => {
            const loaded = i < ammo;
            tube.classList.toggle('loaded', loaded);
            tube.classList.toggle('empty', !loaded);
        });

        const fireBtn = document.getElementById('fire-ordnance');
        const fireLabel = document.getElementById('fire-ordnance-label');
        if (fireBtn) {
            fireBtn.className = `btn btn-large ${cfg.btnClass}`;
            fireBtn.disabled = ammo <= 0 || this.getOrdnanceCooldown(type) > 0;
        }
        if (fireLabel) {
            fireLabel.textContent = type === 'nuke' ? 'FIRE NUKE' : 'FIRE TORPEDO';
        }
    }

    update(timestamp) {
        // Recharge phasers
        const weaponSys = gameState.playerShip.subsystems.weapons;
        const rechargeRate = (weaponSys.hp / 100) * (weaponSys.power / 100) * 0.5;
        this.phaserCharge = Math.min(100, this.phaserCharge + rechargeRate);

        // Reduce cooldowns
        if (this.phaserCooldown > 0) this.phaserCooldown--;
        if (this.torpedoCooldown > 0) this.torpedoCooldown--;
        if (this.dumbTorpedoCooldown > 0) this.dumbTorpedoCooldown--;
        if (this.nukeCooldown > 0) this.nukeCooldown--;

        // Update UI
        const chargeEl = document.getElementById('phaser-charge');
        const pctEl = document.getElementById('phaser-pct');
        if (chargeEl) chargeEl.style.width = `${this.phaserCharge}%`;
        if (pctEl) pctEl.textContent = `${Math.round(this.phaserCharge)}%`;

        const healthEl = document.getElementById('weapon-health');
        const powerEl = document.getElementById('weapon-power');
        if (healthEl) healthEl.textContent = `${Math.round(weaponSys.hp)}%`;
        if (powerEl) powerEl.textContent = `${Math.round(weaponSys.power)}%`;

        this.updateOrdnanceDisplay();

        // Render view
        renderer.renderMap({
            centerX: gameState.playerShip.x,
            centerY: gameState.playerShip.y,
            scale: this.scale,
            showGrid: false,
            showHUD: true
        });

        // Update target info periodically
        this.updateTargetInfo();
    }

    destroy() {
        // Cleanup
    }
}

export const weaponsStation = new WeaponsStation();
