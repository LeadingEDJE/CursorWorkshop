/**
 * Communications Station
 * Fleet command interface with tactical map and waypoint assignment
 */

import { gameState } from '../core/state.js';
import { renderer } from '../core/renderer.js';
import { audio } from '../core/audio.js';

class CommsStation {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.selectedShipId = null;
        this.selectedFrequency = 'all';
        this.scale = 3; // Zoomed out for tactical view
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
            <div class="station-layout comms-layout">
                <div class="comms-sidebar">
                    <div class="panel">
                        <h3>FLEET STATUS</h3>
                        <div id="fleet-list" class="fleet-list"></div>
                    </div>
                    <div class="panel">
                        <h3>SELECTED SHIP</h3>
                        <div id="selected-ship-info" class="selected-ship-info">
                            <p class="dim">Click a ship to select</p>
                        </div>
                    </div>
                    <div class="panel">
                        <h3>COMMANDS</h3>
                        <div class="command-controls">
                            <button id="hail-selected-btn" class="btn btn-primary" disabled>
                                <span class="btn-icon">📡</span> HAIL
                            </button>
                            <button id="clear-waypoint-btn" class="btn btn-secondary" disabled>
                                CLEAR WAYPOINT
                            </button>
                        </div>
                    </div>
                    <div class="panel">
                        <h3>COMMUNICATIONS LOG</h3>
                        <div class="frequency-buttons">
                            <button class="btn btn-freq active" data-freq="all">ALL</button>
                            <button class="btn btn-freq" data-freq="hail">HAILS</button>
                            <button class="btn btn-freq" data-freq="alert">ALERTS</button>
                            <button class="btn btn-freq" data-freq="info">SYSTEM</button>
                        </div>
                        <div id="comms-log" class="comms-log"></div>
                    </div>
                </div>
                <div class="comms-main">
                    <div class="canvas-container comms-map-container">
                        <canvas id="comms-canvas"></canvas>
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

        // Use requestAnimationFrame to ensure DOM is ready and container has dimensions
        requestAnimationFrame(() => {
            this.canvas = document.getElementById('comms-canvas');
            if (this.canvas) {
                renderer.init(this.canvas);
                this.updateFleetList();
                this.updateCommsLog();
            }
        });
    }

    setupEventListeners() {
        // Hail selected ship button
        const hailBtn = document.getElementById('hail-selected-btn');
        if (hailBtn) {
            hailBtn.addEventListener('click', () => {
                if (this.selectedShipId && this.selectedShipId !== 'player') {
                    gameState.hailShip(this.selectedShipId);
                    audio.playHail();
                }
            });
        }

        // Clear waypoint button
        const clearBtn = document.getElementById('clear-waypoint-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (this.selectedShipId) {
                    gameState.clearShipWaypoint(this.selectedShipId);
                    this.updateSelectedShipInfo();
                    audio.playClick();
                }
            });
        }

        // Frequency filter buttons
        document.querySelectorAll('.btn-freq').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-freq').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedFrequency = btn.dataset.freq;
                this.updateCommsLog();
                audio.playClick();
            });
        });

        // Canvas interactions - wait for canvas to be ready
        requestAnimationFrame(() => {
            if (this.canvas) {
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
                        this.scale = Math.min(10, this.scale + 0.5);
                    } else {
                        this.scale = Math.max(1, this.scale - 0.5);
                    }
                });
            }
        });

        // State change listeners
        gameState.on('commsMessage', (msg) => {
            this.updateCommsLog();
            if (msg.type === 'hail') {
                audio.playHail();
            } else if (msg.type === 'alert') {
                audio.playError();
            }
        });

        gameState.on('shipAdded', () => {
            this.updateFleetList();
        });

        gameState.on('shipDestroyed', () => {
            this.updateFleetList();
            if (this.selectedShipId && !gameState.getShip(this.selectedShipId)) {
                this.selectedShipId = null;
                this.updateSelectedShipInfo();
            }
        });

        gameState.on('shipWaypointSet', () => {
            this.updateFleetList();
            this.updateSelectedShipInfo();
        });

        gameState.on('shipWaypointCleared', () => {
            this.updateFleetList();
            this.updateSelectedShipInfo();
        });
    }

    handleCanvasClick(e) {
        if (!this.canvas) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        const centerX = gameState.playerShip.x + this.viewOffsetX;
        const centerY = gameState.playerShip.y + this.viewOffsetY;
        
        const worldPos = renderer.screenToWorld(screenX, screenY, centerX, centerY, this.scale);
        
        // Check if click is on any ship
        const clickedShip = this.findShipAtPosition(worldPos.x, worldPos.y);
        
        if (clickedShip) {
            // Select the ship (any faction)
            this.selectShip(clickedShip.id);
            audio.playClick();
        } else if (this.selectedShipId) {
            // Set waypoint for selected ship (only if friendly)
            const ship = gameState.getShip(this.selectedShipId);
            if (ship && ship.faction === 'friendly') {
                gameState.setShipWaypoint(this.selectedShipId, worldPos.x, worldPos.y);
                audio.playBeep();
            }
        } else {
            // Click on empty space with no selection - deselect
            this.selectedShipId = null;
            this.updateFleetList();
            this.updateSelectedShipInfo();
        }
    }

    findShipAtPosition(x, y) {
        // Check all ships (including player) for click detection
        const allShips = [gameState.playerShip, ...gameState.ships];
        
        for (const ship of allShips) {
            const dist = Math.hypot(ship.x - x, ship.y - y);
            if (dist < ship.size + 10) { // Click tolerance
                return ship;
            }
        }
        return null;
    }

    selectShip(shipId) {
        this.selectedShipId = shipId;
        this.updateFleetList();
        this.updateSelectedShipInfo();
    }

    updateFleetList() {
        const list = document.getElementById('fleet-list');
        if (!list) return;

        const friendlyShips = gameState.ships.filter(ship => ship.faction === 'friendly');
        
        if (friendlyShips.length === 0) {
            list.innerHTML = '<p class="dim">No friendly ships in sector</p>';
            return;
        }

        list.innerHTML = friendlyShips.map(ship => {
            const isSelected = ship.id === this.selectedShipId;
            const hasWaypoint = ship.commandWaypoint !== null;
            const selectedClass = isSelected ? 'selected' : '';
            
            return `
                <div class="ship-item ${selectedClass}" data-ship-id="${ship.id}">
                    <div class="ship-item-header">
                        <span class="ship-name">${ship.name}</span>
                        ${hasWaypoint ? '<span class="waypoint-indicator">📍</span>' : ''}
                    </div>
                    <div class="ship-item-details">
                        <span>Hull: ${Math.round(ship.hull)}%</span>
                        <span>Dist: ${Math.round(Math.hypot(ship.x - gameState.playerShip.x, ship.y - gameState.playerShip.y))} km</span>
                    </div>
                </div>
            `;
        }).join('');

        // Add click listeners to ship items
        list.querySelectorAll('.ship-item').forEach(item => {
            item.addEventListener('click', () => {
                const shipId = item.dataset.shipId;
                this.selectShip(shipId);
                audio.playClick();
            });
        });
    }

    updateSelectedShipInfo() {
        const info = document.getElementById('selected-ship-info');
        const clearBtn = document.getElementById('clear-waypoint-btn');
        const hailBtn = document.getElementById('hail-selected-btn');
        if (!info) return;

        if (!this.selectedShipId) {
            info.innerHTML = '<p class="dim">Click a ship to select</p>';
            if (clearBtn) clearBtn.disabled = true;
            if (hailBtn) hailBtn.disabled = true;
            return;
        }

        const ship = gameState.getShip(this.selectedShipId);
        if (!ship) {
            this.selectedShipId = null;
            info.innerHTML = '<p class="dim">Click a ship to select</p>';
            if (clearBtn) clearBtn.disabled = true;
            if (hailBtn) hailBtn.disabled = true;
            return;
        }

        // Show ship details
        const shipDetails = `
            <div class="ship-detail">
                <div class="stat-row">
                    <span>Name:</span>
                    <span>${ship.scanned ? ship.name : 'Unknown'}</span>
                </div>
                <div class="stat-row">
                    <span>Faction:</span>
                    <span class="faction-${ship.faction}">${ship.faction.toUpperCase()}</span>
                </div>
                <div class="stat-row">
                    <span>Position:</span>
                    <span>(${Math.round(ship.x)}, ${Math.round(ship.y)})</span>
                </div>
                <div class="stat-row">
                    <span>Hull:</span>
                    <span>${Math.round(ship.hull)}%</span>
                </div>
                <div class="stat-row">
                    <span>Shields:</span>
                    <span>${Math.round(ship.shieldStrength)}%</span>
                </div>
            </div>
        `;

        // Show waypoint section only for friendly ships
        if (ship.faction === 'friendly') {
            const waypointInfo = ship.commandWaypoint ? `
                <div class="waypoint-data">
                    <div class="stat-row">
                        <span>Waypoint X:</span>
                        <span>${Math.round(ship.commandWaypoint.x)}</span>
                    </div>
                    <div class="stat-row">
                        <span>Waypoint Y:</span>
                        <span>${Math.round(ship.commandWaypoint.y)}</span>
                    </div>
                    <div class="stat-row">
                        <span>Distance:</span>
                        <span>${Math.round(Math.hypot(ship.commandWaypoint.x - ship.x, ship.commandWaypoint.y - ship.y))} km</span>
                    </div>
                </div>
            ` : '<p class="dim">Click on map to set waypoint</p>';

            info.innerHTML = shipDetails + `
                <div class="waypoint-section">
                    <h4>COMMAND WAYPOINT</h4>
                    ${waypointInfo}
                </div>
            `;

            if (clearBtn) {
                clearBtn.disabled = !ship.commandWaypoint;
            }
            if (hailBtn) {
                hailBtn.disabled = true; // Don't hail friendly ships from here
            }
        } else {
            // Non-friendly ships - show hail option
            info.innerHTML = shipDetails;
            if (clearBtn) {
                clearBtn.disabled = true;
            }
            if (hailBtn) {
                hailBtn.disabled = false;
            }
        }
    }

    updateCommsLog() {
        const log = document.getElementById('comms-log');
        if (!log) return;

        let messages = gameState.commsLog;
        
        // Filter by frequency
        if (this.selectedFrequency !== 'all') {
            messages = messages.filter(msg => msg.type === this.selectedFrequency);
        }

        // Limit to last 10 messages for compact display
        messages = messages.slice(0, 10);

        log.innerHTML = messages.map(msg => {
            const timeStr = this.formatTime(msg.timestamp);
            const typeClass = `msg-${msg.type}`;
            const unreadClass = msg.read ? '' : 'unread';
            
            // Mark as read
            msg.read = true;
            
            return `
                <div class="comms-message ${typeClass} ${unreadClass}">
                    <div class="msg-header">
                        <span class="msg-sender">${msg.sender}</span>
                        <span class="msg-time">${timeStr}</span>
                    </div>
                    <div class="msg-body">${msg.message}</div>
                </div>
            `;
        }).join('');

        // Scroll to top (newest messages)
        log.scrollTop = 0;
    }

    formatTime(gameTime) {
        const totalSeconds = Math.floor(gameTime / 20); // 20 ticks per second
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    update(timestamp) {
        // Update fleet list periodically
        if (Math.floor(timestamp / 1000) % 5 === 0) {
            this.updateFleetList();
        }

        // Render map
        if (this.canvas && renderer.canvas) {
            const centerX = gameState.playerShip.x + this.viewOffsetX;
            const centerY = gameState.playerShip.y + this.viewOffsetY;

            renderer.renderMap({
                centerX: centerX,
                centerY: centerY,
                scale: this.scale,
                showGrid: true,
                showHUD: false,
                selectedShipId: this.selectedShipId,
                showShipWaypoints: true
            });
        }
    }

    destroy() {
        // Cleanup
    }
}

export const commsStation = new CommsStation();
