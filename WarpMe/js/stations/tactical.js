/**
 * Tactical Station
 * Long-range sensors, ship identification, and scanning
 */

import { gameState } from '../core/state.js';
import { renderer } from '../core/renderer.js';
import { audio } from '../core/audio.js';

// Pure helpers — exported so tests can import them without a DOM or canvas context.

/**
 * Maps a hull integrity ratio (0–1) to a CSS rgb color.
 * green (full) → yellow (mid) → red (critical), matching renderer.getHullColor().
 * @param {number} hullRatio - value in [0, 1]
 * @returns {string} CSS color string
 */
export function getHullColor(hullRatio) {
    let r, g;
    if (hullRatio > 0.6) {
        r = Math.round(255 * (1 - hullRatio) / 0.4);
        g = 255;
    } else {
        r = 255;
        g = Math.round(255 * hullRatio / 0.6);
    }
    return `rgb(${r}, ${g}, 0)`;
}

/**
 * Maps a shield strength ratio (0–1) to a CSS color.
 * Full shields → cyan; zero or offline → dim gray.
 * @param {number} shieldRatio - value in [0, 1]
 * @param {boolean} shieldsOnline - false when shield subsystem power is 0
 * @returns {string} CSS color string
 */
export function getShieldColor(shieldRatio, shieldsOnline) {
    if (!shieldsOnline || shieldRatio <= 0) return 'rgba(80, 80, 100, 0.4)';
    const b = 255;
    const g = Math.round(140 + 80 * shieldRatio);
    return `rgba(80, ${g}, ${b}, 0.9)`;
}

/**
 * Returns a short human-readable condition label for a scanned ship.
 * @param {object} ship - ship object with hull, maxHull, shieldStrength, maxShieldStrength, subsystems
 * @returns {string} condition label
 */
export function getConditionLabel(ship) {
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
}

/**
 * Returns a CSS class suffix for the condition label styling.
 * @param {string} label - result of getConditionLabel()
 * @returns {string} one of 'nominal' | 'warning' | 'critical'
 */
export function getConditionClass(label) {
    if (label === 'Nominal') return 'nominal';
    if (label === 'Hull Critical' || label === 'Shields Critical') return 'critical';
    return 'warning';
}

class TacticalStation {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.scale = 3; // Zoomed out for long range
        this.radarAngle = 0;
        this.scanRadius = 0;
        this.scanning = false;
        this.selectedShip = null;
    }

    init(container) {
        this.container = container;
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="station-layout tactical-layout">
                <div class="tactical-sidebar">
                    <div class="panel">
                        <h3>SENSOR CONTACTS</h3>
                        <div id="contact-list" class="contact-list"></div>
                    </div>
                    <div class="panel">
                        <h3>SCAN TARGET</h3>
                        <div id="scan-info" class="scan-info">
                            <p class="dim">No target selected</p>
                        </div>
                        <div id="target-status" class="target-status" aria-live="polite" aria-label="Target combat status"></div>
                        <button id="scan-btn" class="btn btn-primary" disabled>
                            <span class="btn-icon">◎</span> SCAN
                        </button>
                    </div>
                    <div class="panel">
                        <h3>SENSOR RANGE</h3>
                        <div class="range-control">
                            <button id="zoom-in" class="btn btn-small">+</button>
                            <span id="range-display">3000 km</span>
                            <button id="zoom-out" class="btn btn-small">−</button>
                        </div>
                    </div>
                    <div class="panel">
                        <h3>ALERT STATUS</h3>
                        <div class="alert-buttons">
                            <button class="btn btn-alert ${gameState.alertLevel === 'normal' ? 'active' : ''}" data-alert="normal">NORMAL</button>
                            <button class="btn btn-alert btn-yellow ${gameState.alertLevel === 'yellow' ? 'active' : ''}" data-alert="yellow">YELLOW</button>
                            <button class="btn btn-alert btn-red ${gameState.alertLevel === 'red' ? 'active' : ''}" data-alert="red">RED</button>
                        </div>
                    </div>
                </div>
                <div class="tactical-main">
                    <div class="canvas-container">
                        <canvas id="tactical-canvas"></canvas>
                    </div>
                </div>
            </div>
        `;

        this.canvas = document.getElementById('tactical-canvas');
        renderer.init(this.canvas);
        this.updateContactList();
    }

    setupEventListeners() {
        // Scan button
        document.getElementById('scan-btn').addEventListener('click', () => {
            this.performScan();
        });

        // Zoom controls
        document.getElementById('zoom-in').addEventListener('click', () => {
            this.scale = Math.max(1, this.scale - 0.5);
            this.updateRangeDisplay();
            audio.playClick();
        });

        document.getElementById('zoom-out').addEventListener('click', () => {
            this.scale = Math.min(10, this.scale + 0.5);
            this.updateRangeDisplay();
            audio.playClick();
        });

        // Canvas click for target selection
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });

        // Listen for state changes
        gameState.on('shipAdded', () => this.updateContactList());
        gameState.on('shipDestroyed', () => this.updateContactList());
        gameState.on('targetChanged', () => this.updateContactList());
        gameState.on('alertChanged', () => this.updateAlertButtons());

        // Alert buttons
        this.container.querySelectorAll('[data-alert]').forEach(btn => {
            btn.addEventListener('click', () => {
                gameState.setAlertLevel(btn.dataset.alert);
                this.updateAlertButtons();

                if (btn.dataset.alert === 'red') {
                    audio.playRedAlert();
                } else if (btn.dataset.alert === 'yellow') {
                    audio.playYellowAlert();
                } else {
                    audio.playClick();
                }
            });
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
        let closestDist = 50 * this.scale; // Click tolerance

        gameState.ships.forEach(ship => {
            const dist = Math.hypot(ship.x - worldPos.x, ship.y - worldPos.y);
            if (dist < closestDist) {
                closestDist = dist;
                closestShip = ship;
            }
        });

        if (closestShip) {
            this.selectedShip = closestShip;
            gameState.setTarget(closestShip.id);
            this.updateScanInfo();
            audio.playTargetLock();
        }
    }

    performScan() {
        if (!this.selectedShip || this.scanning) return;

        this.scanning = true;
        this.scanRadius = 0;
        audio.playScan();

        const scanInterval = setInterval(() => {
            this.scanRadius += 50;
            if (this.scanRadius > 500) {
                clearInterval(scanInterval);
                this.scanning = false;
                this.scanRadius = 0;
                
                // Mark ship as scanned
                this.selectedShip.scanned = true;
                this.updateScanInfo();
                this.updateContactList();
                
                gameState.addCommsMessage('SENSORS', 
                    `Scan complete: ${this.selectedShip.name}`, 'info');
            }
        }, 50);
    }

    updateContactList() {
        const list = document.getElementById('contact-list');
        if (!list) return;

        const ships = gameState.ships.slice().sort((a, b) => {
            const distA = Math.hypot(a.x - gameState.playerShip.x, a.y - gameState.playerShip.y);
            const distB = Math.hypot(b.x - gameState.playerShip.x, b.y - gameState.playerShip.y);
            return distA - distB;
        });

        list.innerHTML = ships.map(ship => {
            const dist = Math.hypot(
                ship.x - gameState.playerShip.x,
                ship.y - gameState.playerShip.y
            );
            const isTarget = ship.id === gameState.currentTarget;
            const factionClass = `faction-${ship.faction}`;
            
            return `
                <div class="contact-item ${isTarget ? 'selected' : ''} ${factionClass}" 
                     data-ship-id="${ship.id}">
                    <span class="contact-icon">◆</span>
                    <span class="contact-name">${ship.scanned ? ship.name : 'Unknown'}</span>
                    <span class="contact-dist">${Math.round(dist)} km</span>
                </div>
            `;
        }).join('');

        // Add click handlers
        list.querySelectorAll('.contact-item').forEach(item => {
            item.addEventListener('click', () => {
                const shipId = item.dataset.shipId;
                this.selectedShip = gameState.getShip(shipId);
                gameState.setTarget(shipId);
                this.updateScanInfo();
                audio.playClick();
            });
        });
    }

    updateScanInfo() {
        const info = document.getElementById('scan-info');
        const btn = document.getElementById('scan-btn');
        if (!info || !btn) return;

        if (!this.selectedShip) {
            info.innerHTML = '<p class="dim">No target selected</p>';
            btn.disabled = true;
            this.updateTargetStatus();
            return;
        }

        btn.disabled = this.selectedShip.scanned;
        const ship = this.selectedShip;
        const dist = Math.hypot(
            ship.x - gameState.playerShip.x,
            ship.y - gameState.playerShip.y
        );

        if (ship.scanned) {
            info.innerHTML = `
                <div class="scan-detail">
                    <div class="scan-row">
                        <span>Name:</span>
                        <span>${ship.name}</span>
                    </div>
                    <div class="scan-row">
                        <span>Type:</span>
                        <span>${ship.type}</span>
                    </div>
                    <div class="scan-row">
                        <span>Faction:</span>
                        <span class="faction-${ship.faction}">${ship.faction.toUpperCase()}</span>
                    </div>
                    <div class="scan-row">
                        <span>Distance:</span>
                        <span>${Math.round(dist)} km</span>
                    </div>
                </div>
            `;
        } else {
            info.innerHTML = `
                <div class="scan-detail">
                    <div class="scan-row">
                        <span>Name:</span>
                        <span class="dim">UNKNOWN</span>
                    </div>
                    <div class="scan-row">
                        <span>Distance:</span>
                        <span>${Math.round(dist)} km</span>
                    </div>
                    <div class="scan-row">
                        <span>Faction:</span>
                        <span class="faction-${ship.faction}">${ship.faction.toUpperCase()}</span>
                    </div>
                </div>
            `;
        }

        this.updateTargetStatus();
    }

    updateTargetStatus() {
        const statusEl = document.getElementById('target-status');
        if (!statusEl) return;

        if (!this.selectedShip) {
            statusEl.innerHTML = '';
            return;
        }

        const ship = this.selectedShip;
        const hullRatio   = Math.max(0, Math.min(1, ship.hull / Math.max(1, ship.maxHull)));
        const shieldsOn   = ship.subsystems.shields.power > 0;
        const shieldRatio = Math.max(0, Math.min(1, ship.shieldStrength / Math.max(1, ship.maxShieldStrength)));

        if (ship.scanned) {
            const hullPct    = Math.round(hullRatio * 100);
            const shieldPct  = Math.round(shieldRatio * 100);
            const hullColor  = getHullColor(hullRatio);
            const condition  = getConditionLabel(ship);
            const condClass  = getConditionClass(condition);

            const shieldBarClass = shieldsOn && shieldRatio > 0 ? 'shield-fill' : 'shield-offline';
            const shieldWidth    = shieldsOn ? `${shieldRatio * 100}%` : '0%';
            const shieldLabel    = shieldsOn ? `${shieldPct}%` : 'OFF';

            statusEl.innerHTML = `
                <div class="target-status-row">
                    <span class="target-status-label">Hull</span>
                    <div class="target-status-bar"
                         role="progressbar"
                         aria-label="Target hull integrity"
                         aria-valuenow="${hullPct}"
                         aria-valuemin="0"
                         aria-valuemax="100">
                        <div class="target-status-fill"
                             style="width:${hullRatio * 100}%;background:${hullColor}"></div>
                    </div>
                    <span class="target-status-value">${hullPct}%</span>
                </div>
                <div class="target-status-row">
                    <span class="target-status-label">Shields</span>
                    <div class="target-status-bar"
                         role="progressbar"
                         aria-label="Target shield strength"
                         aria-valuenow="${shieldsOn ? shieldPct : 0}"
                         aria-valuemin="0"
                         aria-valuemax="100">
                        <div class="target-status-fill ${shieldBarClass}"
                             style="width:${shieldWidth}"></div>
                    </div>
                    <span class="target-status-value">${shieldLabel}</span>
                </div>
                <p class="target-status-condition condition-${condClass}">${condition}</p>
            `;
        } else {
            statusEl.innerHTML = `
                <div class="target-status-row">
                    <span class="target-status-label">Hull</span>
                    <div class="target-status-bar"
                         role="progressbar"
                         aria-label="Target hull integrity unknown"
                         aria-valuenow="0"
                         aria-valuemin="0"
                         aria-valuemax="100">
                        <div class="target-status-fill" style="width:0%"></div>
                    </div>
                    <span class="target-status-value dim">---</span>
                </div>
                <div class="target-status-row">
                    <span class="target-status-label">Shields</span>
                    <div class="target-status-bar"
                         role="progressbar"
                         aria-label="Target shield strength unknown"
                         aria-valuenow="0"
                         aria-valuemin="0"
                         aria-valuemax="100">
                        <div class="target-status-fill" style="width:0%"></div>
                    </div>
                    <span class="target-status-value dim">---</span>
                </div>
                <p class="target-status-unknown">Scan target for details</p>
            `;
        }
    }

    updateRangeDisplay() {
        const display = document.getElementById('range-display');
        if (display) {
            display.textContent = `${Math.round(this.scale * 1000)} km`;
        }
    }

    updateAlertButtons() {
        this.container.querySelectorAll('[data-alert]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.alert === gameState.alertLevel);
        });
    }

    update(timestamp) {
        // Update radar sweep
        this.radarAngle += 0.02;
        if (this.radarAngle > Math.PI * 2) {
            this.radarAngle -= Math.PI * 2;
        }

        // Render the tactical view
        renderer.renderMap({
            centerX: gameState.playerShip.x,
            centerY: gameState.playerShip.y,
            scale: this.scale,
            showGrid: true,
            showHUD: true,
            showRadar: true,
            radarAngle: this.radarAngle,
            scanRadius: this.scanRadius,
            showShipWaypoints: true
        });

        // Update scan info periodically
        if (this.selectedShip) {
            this.updateScanInfo();
        }
    }

    destroy() {
        // Cleanup listeners if needed
    }
}

export const tacticalStation = new TacticalStation();
