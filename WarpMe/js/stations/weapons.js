/**
 * Weapons Station
 * Target lock, phaser and torpedo controls
 */

import { gameState } from '../core/state.js';
import { renderer } from '../core/renderer.js';
import { audio } from '../core/audio.js';

class WeaponsStation {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.scale = 1.5;
        this.phaserCharge = 100;
        this.torpedoCount = 10;
        this.phaserCooldown = 0;
        this.torpedoCooldown = 0;
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
                        <h3>TORPEDOES</h3>
                        <div class="torpedo-count">
                            <span id="torpedo-count">10</span> / 10
                        </div>
                        <div class="torpedo-tubes">
                            <div class="torpedo-tube" data-tube="1">●</div>
                            <div class="torpedo-tube" data-tube="2">●</div>
                            <div class="torpedo-tube" data-tube="3">●</div>
                            <div class="torpedo-tube" data-tube="4">●</div>
                            <div class="torpedo-tube" data-tube="5">●</div>
                        </div>
                        <button id="fire-torpedo" class="btn btn-warning btn-large">
                            <span class="btn-icon">◉</span> FIRE TORPEDO
                        </button>
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
    }

    setupEventListeners() {
        // Fire phaser
        document.getElementById('fire-phaser').addEventListener('click', () => {
            this.firePhaser();
        });

        // Fire torpedo
        document.getElementById('fire-torpedo').addEventListener('click', () => {
            this.fireTorpedo();
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

    fireTorpedo() {
        if (this.torpedoCooldown > 0 || this.torpedoCount <= 0) {
            audio.playError();
            return;
        }

        if (gameState.fireWeapon('torpedo', gameState.currentTarget)) {
            audio.playTorpedo();
            this.torpedoCount--;
            this.torpedoCooldown = 60; // 1 second cooldown
            this.updateTorpedoDisplay();
        }
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
                        <span>Torpedo Range:</span>
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

    updateTorpedoDisplay() {
        const countEl = document.getElementById('torpedo-count');
        if (countEl) {
            countEl.textContent = this.torpedoCount;
        }

        const tubes = document.querySelectorAll('.torpedo-tube');
        tubes.forEach((tube, i) => {
            if (i < this.torpedoCount) {
                tube.classList.add('loaded');
                tube.classList.remove('empty');
            } else {
                tube.classList.remove('loaded');
                tube.classList.add('empty');
            }
        });
    }

    update(timestamp) {
        // Recharge phasers
        const weaponSys = gameState.playerShip.subsystems.weapons;
        const rechargeRate = (weaponSys.hp / 100) * (weaponSys.power / 100) * 0.5;
        this.phaserCharge = Math.min(100, this.phaserCharge + rechargeRate);

        // Reduce cooldowns
        if (this.phaserCooldown > 0) this.phaserCooldown--;
        if (this.torpedoCooldown > 0) this.torpedoCooldown--;

        // Update UI
        const chargeEl = document.getElementById('phaser-charge');
        const pctEl = document.getElementById('phaser-pct');
        if (chargeEl) chargeEl.style.width = `${this.phaserCharge}%`;
        if (pctEl) pctEl.textContent = `${Math.round(this.phaserCharge)}%`;

        const healthEl = document.getElementById('weapon-health');
        const powerEl = document.getElementById('weapon-power');
        if (healthEl) healthEl.textContent = `${Math.round(weaponSys.hp)}%`;
        if (powerEl) powerEl.textContent = `${Math.round(weaponSys.power)}%`;

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
