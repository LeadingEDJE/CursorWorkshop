/**
 * Helm Station
 * Ship piloting - throttle, heading, and maneuvering
 */

import { gameState } from '../core/state.js';
import { renderer } from '../core/renderer.js';
import { audio } from '../core/audio.js';

class HelmStation {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.scale = 0.8; // Zoomed in for close navigation
        this.isHeadingDrag = false;
        this.isSteerDrag = false;
    }

    init(container) {
        this.container = container;
        this.render();
        this.setupEventListeners();
    }

    render() {
        const ship = gameState.playerShip;
        
        this.container.innerHTML = `
            <div class="station-layout helm-layout">
                <div class="helm-main">
                    <div class="canvas-container">
                        <canvas id="helm-canvas"></canvas>
                    </div>
                </div>
                <div class="helm-controls">
                    <div class="helm-panel throttle-panel">
                        <h3>THROTTLE</h3>
                        <div class="throttle-control">
                            <input type="range" id="throttle-slider" class="vertical-slider"
                                   min="0" max="100" value="${(ship.velocity / ship.maxVelocity) * 100}"
                                   orient="vertical">
                            <div class="throttle-display">
                                <span id="throttle-value">${Math.round((ship.velocity / ship.maxVelocity) * 100)}%</span>
                                <span id="velocity-value">${ship.velocity.toFixed(1)} km/s</span>
                            </div>
                        </div>
                        <div class="throttle-presets">
                            <button class="btn btn-small" data-throttle="0">STOP</button>
                            <button class="btn btn-small" data-throttle="25">1/4</button>
                            <button class="btn btn-small" data-throttle="50">1/2</button>
                            <button class="btn btn-small" data-throttle="75">3/4</button>
                            <button class="btn btn-small" data-throttle="100">FULL</button>
                        </div>
                    </div>
                    <div class="helm-panel heading-panel">
                        <h3>HEADING</h3>
                        <div class="compass-container">
                            <div class="compass" id="compass">
                                <div class="compass-ring">
                                    <span class="compass-mark n">0°</span>
                                    <span class="compass-mark e">90°</span>
                                    <span class="compass-mark s">180°</span>
                                    <span class="compass-mark w">270°</span>
                                </div>
                                <div class="compass-needle" id="compass-needle"></div>
                                <div class="compass-center">${Math.round(ship.heading)}°</div>
                            </div>
                        </div>
                        <div class="heading-input">
                            <label>SET HEADING:</label>
                            <input type="number" id="heading-input" min="0" max="359" 
                                   value="${Math.round(ship.heading)}">
                            <button id="set-heading" class="btn btn-primary">SET</button>
                        </div>
                        <div class="turn-controls">
                            <button id="turn-left" class="btn btn-large">◄ PORT</button>
                            <button id="turn-right" class="btn btn-large">STARBOARD ►</button>
                        </div>
                    </div>
                    <div class="helm-panel status-panel">
                        <h3>FLIGHT STATUS</h3>
                        <div class="flight-stats">
                            <div class="stat-row">
                                <span>Position X:</span>
                                <span id="pos-x">${Math.round(ship.x)}</span>
                            </div>
                            <div class="stat-row">
                                <span>Position Y:</span>
                                <span id="pos-y">${Math.round(ship.y)}</span>
                            </div>
                            <div class="stat-row">
                                <span>Heading:</span>
                                <span id="current-heading">${Math.round(ship.heading)}°</span>
                            </div>
                            <div class="stat-row">
                                <span>Velocity:</span>
                                <span id="current-velocity">${ship.velocity.toFixed(1)} km/s</span>
                            </div>
                            <div class="stat-row">
                                <span>Engine Status:</span>
                                <span id="engine-status" class="text-green">ONLINE</span>
                            </div>
                        </div>
                        <div class="waypoint-info" id="waypoint-info">
                            ${this.getWaypointInfo()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.canvas = document.getElementById('helm-canvas');
        renderer.init(this.canvas);
    }

    getWaypointInfo() {
        if (!gameState.waypoint) {
            return '<p class="dim">No waypoint set</p>';
        }
        
        const dist = gameState.getWaypointDistance();
        const eta = gameState.getWaypointETA();
        
        return `
            <div class="waypoint-data">
                <div class="stat-row">
                    <span>Waypoint Dist:</span>
                    <span>${Math.round(dist)} km</span>
                </div>
                <div class="stat-row">
                    <span>ETA:</span>
                    <span>${eta ? this.formatETA(eta) : 'N/A'}</span>
                </div>
            </div>
        `;
    }

    formatETA(frames) {
        const seconds = Math.round(frames / 20); // 20 ticks per second
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    }

    setupEventListeners() {
        // Throttle slider
        const throttleSlider = document.getElementById('throttle-slider');
        throttleSlider.addEventListener('input', (e) => {
            this.setThrottle(parseInt(e.target.value));
        });

        // Throttle presets
        document.querySelectorAll('[data-throttle]').forEach(btn => {
            btn.addEventListener('click', () => {
                const value = parseInt(btn.dataset.throttle);
                this.setThrottle(value);
                throttleSlider.value = value;
                audio.playClick();
            });
        });

        // Set heading button
        document.getElementById('set-heading').addEventListener('click', () => {
            const input = document.getElementById('heading-input');
            const heading = parseInt(input.value) || 0;
            this.setHeading(heading);
            audio.playClick();
        });

        // Heading input enter key
        document.getElementById('heading-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const heading = parseInt(e.target.value) || 0;
                this.setHeading(heading);
                audio.playClick();
            }
        });

        // Turn buttons (hold for continuous turn)
        const turnLeft = document.getElementById('turn-left');
        const turnRight = document.getElementById('turn-right');

        let turnInterval = null;

        turnLeft.addEventListener('mousedown', () => {
            this.turn(-5);
            turnInterval = setInterval(() => this.turn(-5), 100);
        });

        turnRight.addEventListener('mousedown', () => {
            this.turn(5);
            turnInterval = setInterval(() => this.turn(5), 100);
        });

        const stopTurn = () => {
            if (turnInterval) {
                clearInterval(turnInterval);
                turnInterval = null;
            }
        };

        turnLeft.addEventListener('mouseup', stopTurn);
        turnLeft.addEventListener('mouseleave', stopTurn);
        turnRight.addEventListener('mouseup', stopTurn);
        turnRight.addEventListener('mouseleave', stopTurn);

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (document.activeElement.tagName === 'INPUT') return;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                    this.setThrottle(Math.min(100, (gameState.playerShip.velocity / gameState.playerShip.maxVelocity) * 100 + 10));
                    break;
                case 'ArrowDown':
                case 's':
                    this.setThrottle(Math.max(0, (gameState.playerShip.velocity / gameState.playerShip.maxVelocity) * 100 - 10));
                    break;
                case 'ArrowLeft':
                case 'a':
                    this.turn(-5);
                    break;
                case 'ArrowRight':
                case 'd':
                    this.turn(5);
                    break;
            }
        });

        // Heading wheel drag-to-set
        const compass = document.getElementById('compass');
        const stopHeadingDrag = () => {
            this.isHeadingDrag = false;
        };

        if (compass) {
            compass.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                this.isHeadingDrag = true;
                this.handleCompassPointer(e);
            });

            compass.addEventListener('pointermove', (e) => {
                if (!this.isHeadingDrag) return;
                this.handleCompassPointer(e);
            });

            compass.addEventListener('pointerup', stopHeadingDrag);
            compass.addEventListener('pointercancel', stopHeadingDrag);
            compass.addEventListener('pointerleave', stopHeadingDrag);
        }

        document.addEventListener('pointerup', stopHeadingDrag);

        // Map drag-to-steer
        const stopSteerDrag = () => {
            this.isSteerDrag = false;
        };

        if (this.canvas) {
            this.canvas.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                this.isSteerDrag = true;
                this.handleMapSteer(e);
            });

            this.canvas.addEventListener('pointermove', (e) => {
                if (!this.isSteerDrag) return;
                this.handleMapSteer(e);
            });

            this.canvas.addEventListener('pointerup', stopSteerDrag);
            this.canvas.addEventListener('pointercancel', stopSteerDrag);
            this.canvas.addEventListener('pointerleave', stopSteerDrag);
        }
    }

    setThrottle(percent) {
        const ship = gameState.playerShip;
        const engineEffectiveness = (ship.subsystems.engines.hp / 100) * (ship.subsystems.engines.power / 100);
        ship.velocity = (percent / 100) * ship.maxVelocity * engineEffectiveness;
        
        this.updateThrottleDisplay();
    }

    setHeading(heading) {
        heading = ((heading % 360) + 360) % 360;
        gameState.playerShip.heading = heading;
        this.updateHeadingDisplay();
    }

    turn(degrees) {
        let heading = gameState.playerShip.heading + degrees;
        heading = ((heading % 360) + 360) % 360;
        gameState.playerShip.heading = heading;
        this.updateHeadingDisplay();
    }

    updateThrottleDisplay() {
        const ship = gameState.playerShip;
        const percent = Math.round((ship.velocity / ship.maxVelocity) * 100);
        
        const throttleValue = document.getElementById('throttle-value');
        const velocityValue = document.getElementById('velocity-value');
        const slider = document.getElementById('throttle-slider');
        
        if (throttleValue) throttleValue.textContent = `${percent}%`;
        if (velocityValue) velocityValue.textContent = `${ship.velocity.toFixed(1)} km/s`;
        if (slider) slider.value = percent;
    }

    updateHeadingDisplay() {
        const ship = gameState.playerShip;
        const heading = Math.round(ship.heading);
        
        const needle = document.getElementById('compass-needle');
        const center = document.querySelector('.compass-center');
        const input = document.getElementById('heading-input');
        const current = document.getElementById('current-heading');
        
        if (needle) needle.style.transform = `rotate(${heading}deg)`;
        if (center) center.textContent = `${heading}°`;
        if (input) input.value = heading;
        if (current) current.textContent = `${heading}°`;
    }

    update(timestamp) {
        const ship = gameState.playerShip;
        
        // Update position display
        const posX = document.getElementById('pos-x');
        const posY = document.getElementById('pos-y');
        const velDisplay = document.getElementById('current-velocity');
        const engineStatus = document.getElementById('engine-status');
        const waypointInfo = document.getElementById('waypoint-info');
        
        if (posX) posX.textContent = Math.round(ship.x);
        if (posY) posY.textContent = Math.round(ship.y);
        if (velDisplay) velDisplay.textContent = `${ship.velocity.toFixed(1)} km/s`;
        
        // Engine status
        const engineHealth = ship.subsystems.engines.hp;
        if (engineStatus) {
            if (engineHealth <= 0) {
                engineStatus.textContent = 'OFFLINE';
                engineStatus.className = 'text-red';
            } else if (engineHealth < 50) {
                engineStatus.textContent = 'DAMAGED';
                engineStatus.className = 'text-yellow';
            } else {
                engineStatus.textContent = 'ONLINE';
                engineStatus.className = 'text-green';
            }
        }

        // Waypoint info
        if (waypointInfo) {
            waypointInfo.innerHTML = this.getWaypointInfo();
        }

        // Update compass
        this.updateHeadingDisplay();
        this.updateThrottleDisplay();

        // Render view
        renderer.renderMap({
            centerX: ship.x,
            centerY: ship.y,
            scale: this.scale,
            showGrid: true,
            showHUD: true,
            showWaypointLine: true
        });
    }

    handleCompassPointer(event) {
        const compass = document.getElementById('compass');
        if (!compass) return;

        const rect = compass.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const heading = this.calculateHeadingFromPoint(event.clientX, event.clientY, centerX, centerY);
        this.setHeading(heading);
    }

    handleMapSteer(event) {
        if (!this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();
        const screenX = event.clientX - rect.left;
        const screenY = event.clientY - rect.top;
        const ship = gameState.playerShip;

        const worldPos = renderer.screenToWorld(screenX, screenY, ship.x, ship.y, this.scale);
        const dx = worldPos.x - ship.x;
        const dy = worldPos.y - ship.y;

        if (Math.abs(dx) + Math.abs(dy) < 0.001) return; // Ignore clicks exactly on the ship

        const heading = this.calculateHeadingFromVector(dx, dy);
        this.setHeading(heading);
    }

    calculateHeadingFromPoint(x, y, centerX, centerY) {
        const dx = x - centerX;
        const dy = y - centerY;
        return this.calculateHeadingFromVector(dx, dy);
    }

    calculateHeadingFromVector(dx, dy) {
        let heading = Math.atan2(dy, dx) * 180 / Math.PI;
        if (heading < 0) heading += 360;
        return heading;
    }

    destroy() {
        // Cleanup
    }
}

export const helmStation = new HelmStation();
