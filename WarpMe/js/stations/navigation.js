/**
 * Navigation Station
 * Zoomed-out star map and waypoint plotting
 */

import { gameState } from '../core/state.js';
import { renderer } from '../core/renderer.js';
import { audio } from '../core/audio.js';

class NavigationStation {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.scale = 5; // Very zoomed out for strategic view
        this.isDragging = false;
        this.dragMoved = false;
        this.viewOffsetX = 0;
        this.viewOffsetY = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.dragStartX = 0;
        this.dragStartY = 0;
    }

    init(container) {
        this.container = container;
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="station-layout navigation-layout">
                <div class="navigation-sidebar">
                    <div class="panel">
                        <h3>CURRENT POSITION</h3>
                        <div class="position-info">
                            <div class="coord-display">
                                <span class="coord-label">X:</span>
                                <span id="nav-pos-x" class="coord-value">0</span>
                            </div>
                            <div class="coord-display">
                                <span class="coord-label">Y:</span>
                                <span id="nav-pos-y" class="coord-value">0</span>
                            </div>
                            <div class="coord-display">
                                <span class="coord-label">HDG:</span>
                                <span id="nav-heading" class="coord-value">0°</span>
                            </div>
                        </div>
                    </div>
                    <div class="panel">
                        <h3>WAYPOINT</h3>
                        <div id="waypoint-status" class="waypoint-status">
                            <p class="dim">Click map to set waypoint</p>
                        </div>
                        <div class="waypoint-controls">
                            <button id="clear-waypoint" class="btn btn-secondary" disabled>
                                CLEAR WAYPOINT
                            </button>
                            <button id="auto-navigate" class="btn btn-primary" disabled>
                                AUTO-NAVIGATE
                            </button>
                        </div>
                    </div>
                    <div class="panel">
                        <h3>MAP SCALE</h3>
                        <div class="scale-controls">
                            <button id="nav-zoom-in" class="btn btn-small">+</button>
                            <span id="nav-scale-display">5000 km</span>
                            <button id="nav-zoom-out" class="btn btn-small">−</button>
                        </div>
                        <button id="center-on-ship" class="btn btn-secondary">
                            CENTER ON SHIP
                        </button>
                    </div>
                    <div class="panel">
                        <h3>SECTOR INFO</h3>
                        <div class="sector-info">
                            <div class="stat-row">
                                <span>Friendly:</span>
                                <span id="friendly-count" class="text-green">0</span>
                            </div>
                            <div class="stat-row">
                                <span>Neutral:</span>
                                <span id="neutral-count" class="text-yellow">0</span>
                            </div>
                            <div class="stat-row">
                                <span>Hostile:</span>
                                <span id="hostile-count" class="text-red">0</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="navigation-main">
                    <div class="canvas-container">
                        <canvas id="navigation-canvas"></canvas>
                        <div class="map-legend">
                            <span class="legend-item"><span class="legend-dot friendly"></span> Friendly</span>
                            <span class="legend-item"><span class="legend-dot neutral"></span> Neutral</span>
                            <span class="legend-item"><span class="legend-dot hostile"></span> Hostile</span>
                            <span class="legend-item"><span class="legend-dot waypoint"></span> Waypoint</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.canvas = document.getElementById('navigation-canvas');
        renderer.init(this.canvas);
        this.updateShipCounts();
    }

    setupEventListeners() {
        // Zoom controls
        document.getElementById('nav-zoom-in').addEventListener('click', () => {
            this.scale = Math.max(2, this.scale - 1);
            this.updateScaleDisplay();
            audio.playClick();
        });

        document.getElementById('nav-zoom-out').addEventListener('click', () => {
            this.scale = Math.min(15, this.scale + 1);
            this.updateScaleDisplay();
            audio.playClick();
        });

        // Center on ship
        document.getElementById('center-on-ship').addEventListener('click', () => {
            this.viewOffsetX = 0;
            this.viewOffsetY = 0;
            audio.playClick();
        });

        // Clear waypoint
        document.getElementById('clear-waypoint').addEventListener('click', () => {
            gameState.clearWaypoint();
            this.updateWaypointStatus();
            audio.playClick();
        });

        // Auto-navigate
        document.getElementById('auto-navigate').addEventListener('click', () => {
            if (gameState.waypoint) {
                this.autoNavigateToWaypoint();
                audio.playBeep();
            }
        });

        // Canvas interactions
        this.canvas.addEventListener('click', (e) => {
            if (!this.isDragging && !this.dragMoved) {
                this.handleCanvasClick(e);
            }
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.isDragging = true;
                this.dragMoved = false;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                this.viewOffsetX -= dx * this.scale;
                this.viewOffsetY -= dy * this.scale;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                if (!this.dragMoved) {
                    const totalMovement = Math.abs(e.clientX - this.dragStartX) + Math.abs(e.clientY - this.dragStartY);
                    if (totalMovement > 3) this.dragMoved = true;
                }
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });

        // Mouse wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY > 0) {
                this.scale = Math.min(15, this.scale + 0.5);
            } else {
                this.scale = Math.max(2, this.scale - 0.5);
            }
            this.updateScaleDisplay();
        });

        // State change listeners
        gameState.on('waypointSet', () => this.updateWaypointStatus());
        gameState.on('waypointCleared', () => this.updateWaypointStatus());
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        const centerX = gameState.playerShip.x + this.viewOffsetX;
        const centerY = gameState.playerShip.y + this.viewOffsetY;
        
        const worldPos = renderer.screenToWorld(screenX, screenY, centerX, centerY, this.scale);
        
        gameState.setWaypoint(worldPos.x, worldPos.y);
        this.updateWaypointStatus();
        audio.playBeep();
        
        gameState.addCommsMessage('NAVIGATION', 
            `Waypoint set at coordinates (${Math.round(worldPos.x)}, ${Math.round(worldPos.y)})`, 
            'info'
        );
    }

    autoNavigateToWaypoint() {
        if (!gameState.waypoint) return;

        const ship = gameState.playerShip;
        const dx = gameState.waypoint.x - ship.x;
        const dy = gameState.waypoint.y - ship.y;
        
        // Calculate heading to waypoint
        let heading = Math.atan2(dy, dx) * 180 / Math.PI;
        if (heading < 0) heading += 360;
        
        ship.heading = heading;
        
        // Set velocity to 75%
        const engineEffectiveness = (ship.subsystems.engines.hp / 100) * (ship.subsystems.engines.power / 100);
        ship.velocity = ship.maxVelocity * 0.75 * engineEffectiveness;
        
        gameState.addCommsMessage('NAVIGATION', 
            `Course set to waypoint. Heading ${Math.round(heading)}°, speed ${ship.velocity.toFixed(1)} km/s`, 
            'info'
        );
    }

    updateWaypointStatus() {
        const status = document.getElementById('waypoint-status');
        const clearBtn = document.getElementById('clear-waypoint');
        const navBtn = document.getElementById('auto-navigate');
        
        if (!status) return;

        if (gameState.waypoint) {
            const dist = gameState.getWaypointDistance();
            const eta = gameState.getWaypointETA();
            
            status.innerHTML = `
                <div class="waypoint-data">
                    <div class="stat-row">
                        <span>Target X:</span>
                        <span>${Math.round(gameState.waypoint.x)}</span>
                    </div>
                    <div class="stat-row">
                        <span>Target Y:</span>
                        <span>${Math.round(gameState.waypoint.y)}</span>
                    </div>
                    <div class="stat-row">
                        <span>Distance:</span>
                        <span>${Math.round(dist)} km</span>
                    </div>
                    <div class="stat-row">
                        <span>ETA:</span>
                        <span>${eta ? this.formatETA(eta) : 'Stopped'}</span>
                    </div>
                </div>
            `;
            
            if (clearBtn) clearBtn.disabled = false;
            if (navBtn) navBtn.disabled = false;
        } else {
            status.innerHTML = '<p class="dim">Click map to set waypoint</p>';
            if (clearBtn) clearBtn.disabled = true;
            if (navBtn) navBtn.disabled = true;
        }
    }

    formatETA(frames) {
        const seconds = Math.round(frames / 20);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    }

    updateScaleDisplay() {
        const display = document.getElementById('nav-scale-display');
        if (display) {
            display.textContent = `${Math.round(this.scale * 1000)} km`;
        }
    }

    updateShipCounts() {
        const friendly = document.getElementById('friendly-count');
        const neutral = document.getElementById('neutral-count');
        const hostile = document.getElementById('hostile-count');
        
        const counts = { friendly: 0, neutral: 0, hostile: 0 };
        gameState.ships.forEach(ship => {
            counts[ship.faction]++;
        });
        
        if (friendly) friendly.textContent = counts.friendly;
        if (neutral) neutral.textContent = counts.neutral;
        if (hostile) hostile.textContent = counts.hostile;
    }

    update(timestamp) {
        const ship = gameState.playerShip;
        
        // Update position display
        const posX = document.getElementById('nav-pos-x');
        const posY = document.getElementById('nav-pos-y');
        const heading = document.getElementById('nav-heading');
        
        if (posX) posX.textContent = Math.round(ship.x);
        if (posY) posY.textContent = Math.round(ship.y);
        if (heading) heading.textContent = `${Math.round(ship.heading)}°`;

        // Update waypoint status
        this.updateWaypointStatus();
        
        // Update ship counts
        this.updateShipCounts();

        // Render with view offset
        const centerX = ship.x + this.viewOffsetX;
        const centerY = ship.y + this.viewOffsetY;

        renderer.renderMap({
            centerX: centerX,
            centerY: centerY,
            scale: this.scale,
            showGrid: true,
            showHUD: true
        });
    }

    destroy() {
        // Cleanup
    }
}

export const navigationStation = new NavigationStation();
