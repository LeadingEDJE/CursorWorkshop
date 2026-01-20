/**
 * Canvas Rendering System
 * Handles all visual rendering for the starship simulator
 */

import { gameState } from './state.js';

class Renderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.stars = [];
        this.starsGenerated = false;
    }

    // Initialize with a canvas element
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        this.generateStars();
        
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Regenerate stars on resize
        this.generateStars();
    }

    generateStars() {
        this.stars = [];
        const starCount = Math.floor((this.width * this.height) / 3000);
        
        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * 10000 - 5000,
                y: Math.random() * 10000 - 5000,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random() * 0.5 + 0.5
            });
        }
        this.starsGenerated = true;
    }

    // Clear the canvas
    clear() {
        this.ctx.fillStyle = '#0a0a12';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Draw star background with parallax
    drawStars(centerX, centerY, scale) {
        const parallax = 0.1; // Stars move slower than ships
        
        this.stars.forEach(star => {
            const screenX = (star.x - centerX * parallax) / scale + this.width / 2;
            const screenY = (star.y - centerY * parallax) / scale + this.height / 2;
            
            // Only draw if on screen
            if (screenX >= -5 && screenX <= this.width + 5 && 
                screenY >= -5 && screenY <= this.height + 5) {
                const alpha = star.brightness * (0.8 + Math.sin(Date.now() / 1000 + star.x) * 0.2);
                this.ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, star.size / scale, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    // Draw grid lines
    drawGrid(centerX, centerY, scale) {
        const gridSize = 200;
        const gridColor = 'rgba(0, 150, 180, 0.1)';
        
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;

        // Calculate visible grid range
        const startX = Math.floor((centerX - this.width * scale / 2) / gridSize) * gridSize;
        const endX = Math.ceil((centerX + this.width * scale / 2) / gridSize) * gridSize;
        const startY = Math.floor((centerY - this.height * scale / 2) / gridSize) * gridSize;
        const endY = Math.ceil((centerY + this.height * scale / 2) / gridSize) * gridSize;

        // Vertical lines
        for (let x = startX; x <= endX; x += gridSize) {
            const screenX = (x - centerX) / scale + this.width / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, 0);
            this.ctx.lineTo(screenX, this.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = startY; y <= endY; y += gridSize) {
            const screenY = (y - centerY) / scale + this.height / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenY);
            this.ctx.lineTo(this.width, screenY);
            this.ctx.stroke();
        }
    }

    // Convert world coordinates to screen coordinates
    worldToScreen(worldX, worldY, centerX, centerY, scale) {
        return {
            x: (worldX - centerX) / scale + this.width / 2,
            y: (worldY - centerY) / scale + this.height / 2
        };
    }

    // Convert screen coordinates to world coordinates
    screenToWorld(screenX, screenY, centerX, centerY, scale) {
        return {
            x: (screenX - this.width / 2) * scale + centerX,
            y: (screenY - this.height / 2) * scale + centerY
        };
    }

    // Draw a ship
    drawShip(ship, centerX, centerY, scale, isPlayer = false, isTarget = false) {
        const pos = this.worldToScreen(ship.x, ship.y, centerX, centerY, scale);
        const size = ship.size / scale;
        
        // Skip if off screen
        if (pos.x < -50 || pos.x > this.width + 50 || 
            pos.y < -50 || pos.y > this.height + 50) {
            return;
        }

        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.rotate((ship.heading * Math.PI) / 180);

        // Faction colors
        const colors = {
            friendly: { main: '#00ff88', glow: 'rgba(0, 255, 136, 0.3)' },
            neutral: { main: '#ffcc00', glow: 'rgba(255, 204, 0, 0.3)' },
            hostile: { main: '#ff3366', glow: 'rgba(255, 51, 102, 0.3)' }
        };
        const color = colors[ship.faction] || colors.neutral;

        // Target indicator
        if (isTarget) {
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size + 10, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // Shield bubble (if shields are up)
        if (ship.shieldStrength > 0 && ship.subsystems.shields.power > 0) {
            const shieldAlpha = (ship.shieldStrength / ship.maxShieldStrength) * 0.3;
            this.ctx.fillStyle = `rgba(100, 200, 255, ${shieldAlpha})`;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size + 5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Glow effect
        this.ctx.shadowColor = color.main;
        this.ctx.shadowBlur = isPlayer ? 20 : 10;

        // Ship body (triangle pointing right)
        this.ctx.fillStyle = color.main;
        this.ctx.beginPath();
        
        if (isPlayer) {
            // Player ship - more detailed
            this.ctx.moveTo(size, 0);
            this.ctx.lineTo(-size * 0.7, -size * 0.6);
            this.ctx.lineTo(-size * 0.3, 0);
            this.ctx.lineTo(-size * 0.7, size * 0.6);
            this.ctx.closePath();
        } else {
            // NPC ships - simpler
            this.ctx.moveTo(size * 0.8, 0);
            this.ctx.lineTo(-size * 0.5, -size * 0.5);
            this.ctx.lineTo(-size * 0.3, 0);
            this.ctx.lineTo(-size * 0.5, size * 0.5);
            this.ctx.closePath();
        }
        
        this.ctx.fill();

        // Engine glow
        if (ship.velocity > 0) {
            const engineGlow = ship.velocity / ship.maxVelocity;
            this.ctx.fillStyle = `rgba(100, 150, 255, ${engineGlow})`;
            this.ctx.beginPath();
            this.ctx.moveTo(-size * 0.3, 0);
            this.ctx.lineTo(-size * (0.5 + engineGlow * 0.5), -size * 0.2);
            this.ctx.lineTo(-size * (0.5 + engineGlow * 0.5), size * 0.2);
            this.ctx.closePath();
            this.ctx.fill();
        }

        this.ctx.shadowBlur = 0;
        this.ctx.restore();

        // Draw ship name if scanned or friendly
        if ((ship.scanned || ship.faction === 'friendly' || isPlayer) && scale < 2) {
            this.ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
            this.ctx.font = '10px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ship.name, pos.x, pos.y + size + 15);
        }
    }

    // Draw a torpedo
    drawTorpedo(projectile, centerX, centerY, scale) {
        const pos = this.worldToScreen(projectile.x, projectile.y, centerX, centerY, scale);
        const size = projectile.size / scale;

        // Skip if off screen
        if (pos.x < -20 || pos.x > this.width + 20 || 
            pos.y < -20 || pos.y > this.height + 20) {
            return;
        }

        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.rotate((projectile.heading * Math.PI) / 180);

        // Torpedo glow
        this.ctx.shadowColor = '#ff6600';
        this.ctx.shadowBlur = 15;

        // Torpedo body
        this.ctx.fillStyle = '#ff6600';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, size * 1.5, size * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Trail
        this.ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
        this.ctx.beginPath();
        this.ctx.moveTo(-size * 1.5, 0);
        this.ctx.lineTo(-size * 4, -size * 0.3);
        this.ctx.lineTo(-size * 4, size * 0.3);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }

    // Draw phaser beam
    drawPhaserBeam(beam, centerX, centerY, scale) {
        const start = this.worldToScreen(beam.x1, beam.y1, centerX, centerY, scale);
        const end = this.worldToScreen(beam.x2, beam.y2, centerX, centerY, scale);

        const alpha = beam.lifetime / 15;
        
        // Outer glow
        this.ctx.strokeStyle = `rgba(255, 100, 100, ${alpha * 0.3})`;
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();

        // Inner beam
        this.ctx.strokeStyle = `rgba(255, 200, 150, ${alpha})`;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();

        // Core
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
    }

    drawWaypointLine(waypoint, centerX, centerY, scale) {
        const ship = gameState.playerShip;
        const start = this.worldToScreen(ship.x, ship.y, centerX, centerY, scale);
        const end = this.worldToScreen(waypoint.x, waypoint.y, centerX, centerY, scale);

        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 200, 255, 0.45)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([6, 6]);
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
        this.ctx.restore();
    }

    // Draw waypoint marker
    drawWaypoint(waypoint, centerX, centerY, scale) {
        const pos = this.worldToScreen(waypoint.x, waypoint.y, centerX, centerY, scale);
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 3) * 0.3 + 0.7;

        // Outer ring
        this.ctx.strokeStyle = `rgba(0, 200, 255, ${pulse})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
        this.ctx.stroke();

        // Inner diamond
        this.ctx.fillStyle = `rgba(0, 200, 255, ${pulse * 0.5})`;
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y - 10);
        this.ctx.lineTo(pos.x + 10, pos.y);
        this.ctx.lineTo(pos.x, pos.y + 10);
        this.ctx.lineTo(pos.x - 10, pos.y);
        this.ctx.closePath();
        this.ctx.fill();

        // Label
        this.ctx.fillStyle = 'rgba(0, 200, 255, 0.9)';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('WAYPOINT', pos.x, pos.y + 35);
    }

    // Draw scan ring effect
    drawScanRing(ship, radius, centerX, centerY, scale) {
        const pos = this.worldToScreen(ship.x, ship.y, centerX, centerY, scale);
        const scaledRadius = radius / scale;

        this.ctx.strokeStyle = 'rgba(0, 255, 200, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, scaledRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    // Draw radar sweep
    drawRadarSweep(centerX, centerY, scale, angle) {
        const screenCenter = { x: this.width / 2, y: this.height / 2 };
        const sweepLength = Math.max(this.width, this.height);

        const gradient = this.ctx.createLinearGradient(
            screenCenter.x,
            screenCenter.y,
            screenCenter.x + Math.cos(angle) * sweepLength,
            screenCenter.y + Math.sin(angle) * sweepLength
        );
        gradient.addColorStop(0, 'rgba(0, 255, 200, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 255, 200, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(screenCenter.x, screenCenter.y);
        this.ctx.arc(screenCenter.x, screenCenter.y, sweepLength, angle - 0.1, angle);
        this.ctx.closePath();
        this.ctx.fill();
    }

    // Draw HUD elements
    drawHUD(scale) {
        const player = gameState.playerShip;
        
        // Scale indicator
        this.ctx.fillStyle = 'rgba(0, 200, 255, 0.7)';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`SCALE: ${scale.toFixed(1)}x`, this.width - 20, 30);

        // Coordinates
        this.ctx.fillText(`X: ${Math.round(player.x)}`, this.width - 20, 50);
        this.ctx.fillText(`Y: ${Math.round(player.y)}`, this.width - 20, 70);
        this.ctx.fillText(`HDG: ${Math.round(player.heading)}°`, this.width - 20, 90);
    }

    // Main render function for map view
    renderMap(options = {}) {
        const {
            centerX = gameState.playerShip.x,
            centerY = gameState.playerShip.y,
            scale = 1,
            showGrid = true,
            showHUD = true,
            showRadar = false,
            radarAngle = 0,
            scanRadius = 0,
            showWaypointLine = false
        } = options;

        this.clear();
        this.drawStars(centerX, centerY, scale);
        
        if (showGrid) {
            this.drawGrid(centerX, centerY, scale);
        }

        if (showRadar) {
            this.drawRadarSweep(centerX, centerY, scale, radarAngle);
        }

        if (scanRadius > 0) {
            this.drawScanRing(gameState.playerShip, scanRadius, centerX, centerY, scale);
        }

        // Draw waypoint
        if (gameState.waypoint) {
            if (showWaypointLine) {
                this.drawWaypointLine(gameState.waypoint, centerX, centerY, scale);
            }
            this.drawWaypoint(gameState.waypoint, centerX, centerY, scale);
        }

        // Draw phaser beams
        gameState.phaserBeams.forEach(beam => {
            this.drawPhaserBeam(beam, centerX, centerY, scale);
        });

        // Draw torpedoes
        gameState.projectiles.forEach(proj => {
            this.drawTorpedo(proj, centerX, centerY, scale);
        });

        // Draw NPC ships
        gameState.ships.forEach(ship => {
            const isTarget = ship.id === gameState.currentTarget;
            this.drawShip(ship, centerX, centerY, scale, false, isTarget);
        });

        // Draw player ship
        this.drawShip(gameState.playerShip, centerX, centerY, scale, true, false);

        if (showHUD) {
            this.drawHUD(scale);
        }
    }
}

// Singleton instance
export const renderer = new Renderer();
