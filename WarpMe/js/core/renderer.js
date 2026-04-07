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
        this.particles = [];
        this.shipScarData = new Map();
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

    // Deterministic seeded pseudo-random for stable per-ship scar geometry (0..1)
    seededRandom(seed) {
        const x = Math.sin(seed * 9301 + 49297) * 233280;
        return x - Math.floor(x);
    }

    // Generate and cache scar mark geometry for a ship (keyed by ship.id)
    getShipScarData(ship) {
        if (!this.shipScarData.has(ship.id)) {
            const hash = ship.id.split('').reduce((acc, ch) => acc * 31 + ch.codePointAt(0), 1);
            const count = 4 + Math.floor(this.seededRandom(hash) * 4);
            const scars = [];
            for (let i = 0; i < count; i++) {
                scars.push({
                    angle:      this.seededRandom(hash + i * 7)  * Math.PI * 2,
                    radius:     0.1 + this.seededRandom(hash + i * 13) * 0.55,
                    length:     0.12 + this.seededRandom(hash + i * 17) * 0.22,
                    perpAngle:  this.seededRandom(hash + i * 19) * Math.PI * 2
                });
            }
            this.shipScarData.set(ship.id, scars);
        }
        return this.shipScarData.get(ship.id);
    }

    // Hull integrity color: green (full) → yellow (mid) → red (critical)
    getHullColor(hullRatio) {
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

    // Add a single particle; opts = { color, size, layer }. Caps total at 600.
    emitParticle(x, y, vx, vy, lifetime, opts) {
        this.particles.push({ x, y, vx, vy, lifetime, maxLifetime: lifetime, ...opts });
        if (this.particles.length > 600) {
            this.particles.splice(0, this.particles.length - 600);
        }
    }

    // Emit smoke (hull < 70%) and fire (hull < 35%) particles for a damaged ship each frame
    emitDamageParticles(ship) {
        const hullRatio = ship.hull / Math.max(1, ship.maxHull);
        if (hullRatio >= 0.7) return;

        const rad = (ship.heading * Math.PI) / 180;
        const spread = ship.size * 0.4;
        const emitX = ship.x - Math.cos(rad) * ship.size * 0.3 + (Math.random() - 0.5) * spread;
        const emitY = ship.y - Math.sin(rad) * ship.size * 0.3 + (Math.random() - 0.5) * spread;
        const severity = 1 - hullRatio / 0.7;

        // Smoke
        if (Math.random() < severity * 0.45) {
            const gray = 70 + Math.floor(Math.random() * 70);
            const alpha = (0.25 + Math.random() * 0.3).toFixed(2);
            this.emitParticle(
                emitX, emitY,
                (Math.random() - 0.5) * 0.4,
                -0.25 - Math.random() * 0.45,
                35 + Math.floor(Math.random() * 25),
                { color: `rgba(${gray},${gray},${gray},${alpha})`, size: 2.5 + Math.random() * 2.5, layer: 'smoke' }
            );
        }

        // Fire (hull < 35%)
        if (hullRatio < 0.35) {
            const fireIntensity = (0.35 - hullRatio) / 0.35;
            if (Math.random() < fireIntensity * 0.55) {
                const fireColors = [
                    'rgba(255,90,0,0.9)',
                    'rgba(255,150,0,0.85)',
                    'rgba(255,210,30,0.8)'
                ];
                this.emitParticle(
                    emitX + (Math.random() - 0.5) * ship.size * 0.35,
                    emitY + (Math.random() - 0.5) * ship.size * 0.35,
                    (Math.random() - 0.5) * 1.2,
                    -0.4 - Math.random() * 0.9,
                    10 + Math.floor(Math.random() * 12),
                    { color: fireColors[Math.floor(Math.random() * fireColors.length)], size: 1.5 + Math.random() * 2, layer: 'fire' }
                );
            }
        }
    }

    // Age and move all particles; remove expired ones
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.lifetime--;
            if (p.lifetime <= 0) this.particles.splice(i, 1);
        }
    }

    // Draw all particles of a given layer (smoke or fire)
    drawParticles(centerX, centerY, scale, layer) {
        this.particles.forEach(p => {
            if (p.layer !== layer) return;
            const pos = this.worldToScreen(p.x, p.y, centerX, centerY, scale);
            if (pos.x < -10 || pos.x > this.width + 10 || pos.y < -10 || pos.y > this.height + 10) return;
            const lifeRatio = p.lifetime / p.maxLifetime;
            const displaySize = Math.max(0.5, (p.size / scale) * (0.4 + lifeRatio * 0.6));
            this.ctx.save();
            this.ctx.globalAlpha = lifeRatio * 0.9;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, displaySize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    // Draw hull and shield status bars above a ship; showBars gates visibility
    drawShipStatusBars(ship, centerX, centerY, scale, showBars) {
        if (!showBars) return;
        const pos = this.worldToScreen(ship.x, ship.y, centerX, centerY, scale);
        const shipSize = ship.size / scale;
        const barWidth = Math.max(22, shipSize * 2.4);
        const barHeight = 3;
        const barX = pos.x - barWidth / 2;
        const hullY = pos.y - shipSize - 15;
        const shieldY = hullY + barHeight + 2;

        const hullRatio   = Math.max(0, Math.min(1, ship.hull / Math.max(1, ship.maxHull)));
        const shieldRatio = Math.max(0, Math.min(1, ship.shieldStrength / Math.max(1, ship.maxShieldStrength)));

        this.ctx.save();
        // Dark track backgrounds
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        this.ctx.fillRect(barX - 1, hullY - 1, barWidth + 2, barHeight + 2);
        this.ctx.fillRect(barX - 1, shieldY - 1, barWidth + 2, barHeight + 2);
        // Hull bar
        if (hullRatio > 0) {
            this.ctx.fillStyle = this.getHullColor(hullRatio);
            this.ctx.fillRect(barX, hullY, barWidth * hullRatio, barHeight);
        }
        // Shield bar (only when shields have power)
        if (shieldRatio > 0 && ship.subsystems.shields.power > 0) {
            this.ctx.fillStyle = 'rgba(80, 180, 255, 0.9)';
            this.ctx.fillRect(barX, shieldY, barWidth * shieldRatio, barHeight);
        }
        this.ctx.restore();
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

        // Shield bubble — color shifts cyan → amber → red with strength; flickers when weak
        if (ship.shieldStrength > 0 && ship.subsystems.shields.power > 0) {
            const shieldRatio = ship.shieldStrength / Math.max(1, ship.maxShieldStrength);
            const time = Date.now() / 1000;
            const pulse = Math.sin(time * 2.5 + ship.x * 0.01) * 0.08 + 0.92;
            const flickerFactor = shieldRatio < 0.3 ? (Math.random() > 0.35 ? 1 : 0.25) : 1;

            // Cyan (healthy) → amber (weakened) → red (critical)
            let sR, sG, sB;
            if (shieldRatio >= 0.5) {
                const t = (1 - shieldRatio) * 2;
                sR = Math.round(100 * t);
                sG = Math.round(200 - 60 * t);
                sB = 255;
            } else {
                const t = shieldRatio * 2;
                sR = 255;
                sG = Math.round(140 * t);
                sB = Math.round(255 * t);
            }

            const baseAlpha = shieldRatio * 0.32 * pulse * flickerFactor;
            const shieldRadius = size + 6;

            const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, shieldRadius);
            grad.addColorStop(0,    `rgba(${sR},${sG},${sB},0)`);
            grad.addColorStop(0.65, `rgba(${sR},${sG},${sB},${(baseAlpha * 0.4).toFixed(3)})`);
            grad.addColorStop(1,    `rgba(${sR},${sG},${sB},${baseAlpha.toFixed(3)})`);
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // Visible boundary arc
            const outlineAlpha = Math.min(0.85, shieldRatio * 0.6 + 0.2) * flickerFactor;
            this.ctx.strokeStyle = `rgba(${sR},${sG},${sB},${outlineAlpha.toFixed(3)})`;
            this.ctx.lineWidth = 1;
            this.ctx.shadowColor = `rgb(${sR},${sG},${sB})`;
            this.ctx.shadowBlur = 4;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
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

        // Hull damage tint overlay — increases toward dark red as hull drops below 80%
        const hullRatio = ship.hull / Math.max(1, ship.maxHull);
        if (hullRatio < 0.8) {
            const damageT = (0.8 - hullRatio) / 0.8;
            const flickerMod = hullRatio < 0.25 && Math.random() > 0.65 ? 0.2 : 1;
            this.ctx.fillStyle = `rgba(180, 30, 0, ${(damageT * 0.45 * flickerMod).toFixed(3)})`;
            this.ctx.beginPath();
            if (isPlayer) {
                this.ctx.moveTo(size, 0);
                this.ctx.lineTo(-size * 0.7, -size * 0.6);
                this.ctx.lineTo(-size * 0.3, 0);
                this.ctx.lineTo(-size * 0.7, size * 0.6);
            } else {
                this.ctx.moveTo(size * 0.8, 0);
                this.ctx.lineTo(-size * 0.5, -size * 0.5);
                this.ctx.lineTo(-size * 0.3, 0);
                this.ctx.lineTo(-size * 0.5, size * 0.5);
            }
            this.ctx.closePath();
            this.ctx.fill();
        }

        // Scar marks — bright irregular lines burned into the hull below 50%
        if (hullRatio < 0.5) {
            const scarAlpha = Math.min(0.75, (0.5 - hullRatio) * 1.5);
            const scars = this.getShipScarData(ship);
            const prevShadowBlur = this.ctx.shadowBlur;
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = `rgba(255, 180, 60, ${scarAlpha.toFixed(3)})`;
            this.ctx.lineWidth = 0.7;
            scars.forEach(scar => {
                const cx = Math.cos(scar.angle) * scar.radius * size;
                const cy = Math.sin(scar.angle) * scar.radius * size;
                const halfLen = scar.length * size;
                const dx = Math.cos(scar.perpAngle) * halfLen;
                const dy = Math.sin(scar.perpAngle) * halfLen;
                this.ctx.beginPath();
                this.ctx.moveTo(cx - dx, cy - dy);
                this.ctx.lineTo(cx + dx, cy + dy);
                this.ctx.stroke();
            });
            this.ctx.shadowBlur = prevShadowBlur;
        }

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

    // Draw a projectile (torpedo, dumbTorpedo, or nuke)
    drawTorpedo(projectile, centerX, centerY, scale) {
        const pos = this.worldToScreen(projectile.x, projectile.y, centerX, centerY, scale);
        const size = projectile.size / scale;

        if (pos.x < -20 || pos.x > this.width + 20 ||
            pos.y < -20 || pos.y > this.height + 20) {
            return;
        }

        const config = {
            torpedo: { color: '#ff6600', trail: 'rgba(255, 100, 0, 0.5)', glow: 15, trailLen: 4 },
            dumbTorpedo: { color: '#00ccff', trail: 'rgba(0, 180, 255, 0.4)', glow: 8, trailLen: 2.5 },
            nuke: { color: '#ff0044', trail: 'rgba(255, 0, 80, 0.6)', glow: 25, trailLen: 6 }
        };
        const cfg = config[projectile.type] || config.torpedo;

        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.rotate((projectile.heading * Math.PI) / 180);

        const pulse = projectile.type === 'nuke' ? Math.sin(Date.now() / 80) * 0.3 + 0.7 : 1;

        this.ctx.shadowColor = cfg.color;
        this.ctx.shadowBlur = cfg.glow * pulse;

        this.ctx.fillStyle = cfg.color;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, size * 1.5, size * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = cfg.trail;
        this.ctx.beginPath();
        this.ctx.moveTo(-size * 1.5, 0);
        this.ctx.lineTo(-size * cfg.trailLen, -size * 0.3);
        this.ctx.lineTo(-size * cfg.trailLen, size * 0.3);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }

    // Draw nuke explosion effect (blast radius circle + expanding shockwave + flash)
    drawExplosion(explosion, centerX, centerY, scale) {
        const pos = this.worldToScreen(explosion.x, explosion.y, centerX, centerY, scale);
        const radiusPx = explosion.radius / scale;
        const maxLifetime = explosion.maxLifetime ?? 60;
        const progress = 1 - explosion.lifetime / maxLifetime;

        if (pos.x < -radiusPx * 2 || pos.x > this.width + radiusPx * 2 ||
            pos.y < -radiusPx * 2 || pos.y > this.height + radiusPx * 2) {
            return;
        }

        this.ctx.save();

        // 1. Blast radius circle (full extent, fades over time) – clear area-of-effect
        const blastAlpha = Math.min(0.35, (explosion.lifetime / maxLifetime) * 0.35);
        this.ctx.strokeStyle = `rgba(255, 100, 50, ${blastAlpha})`;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([8, 6]);
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, radiusPx, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.fillStyle = `rgba(255, 80, 40, ${blastAlpha * 0.25})`;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, radiusPx, 0, Math.PI * 2);
        this.ctx.fill();

        // 2. Expanding shockwave ring
        const ringRadius = radiusPx * progress;
        const ringAlpha = (1 - progress) * 0.85;
        this.ctx.strokeStyle = `rgba(255, 180, 80, ${ringAlpha})`;
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, ringRadius, 0, Math.PI * 2);
        this.ctx.stroke();

        // 3. Inner flash (bright center that fades)
        const flashAlpha = progress < 0.25 ? 1 - progress / 0.25 : 0;
        const gradient = this.ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, ringRadius
        );
        gradient.addColorStop(0, `rgba(255, 255, 220, ${flashAlpha})`);
        gradient.addColorStop(0.2, `rgba(255, 200, 100, ${(1 - progress) * 0.6})`);
        gradient.addColorStop(1, 'rgba(255, 80, 0, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, ringRadius, 0, Math.PI * 2);
        this.ctx.fill();

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

    // Draw ship waypoint marker (with ship's faction color)
    drawShipWaypoint(ship, waypoint, centerX, centerY, scale) {
        const pos = this.worldToScreen(waypoint.x, waypoint.y, centerX, centerY, scale);
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 3) * 0.3 + 0.7;

        // Use friendly color for ship waypoints
        const waypointColor = '#00ff88'; // Friendly green
        const alpha = pulse;

        // Outer ring
        this.ctx.strokeStyle = `rgba(0, 255, 136, ${alpha})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
        this.ctx.stroke();

        // Inner diamond
        this.ctx.fillStyle = `rgba(0, 255, 136, ${alpha * 0.5})`;
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y - 8);
        this.ctx.lineTo(pos.x + 8, pos.y);
        this.ctx.lineTo(pos.x, pos.y + 8);
        this.ctx.lineTo(pos.x - 8, pos.y);
        this.ctx.closePath();
        this.ctx.fill();

        // Ship name label
        this.ctx.fillStyle = `rgba(0, 255, 136, 0.9)`;
        this.ctx.font = '9px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(ship.name, pos.x, pos.y + 28);
    }

    // Draw line from ship to its waypoint
    drawShipWaypointLine(ship, waypoint, centerX, centerY, scale) {
        const shipPos = this.worldToScreen(ship.x, ship.y, centerX, centerY, scale);
        const waypointPos = this.worldToScreen(waypoint.x, waypoint.y, centerX, centerY, scale);

        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([8, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(shipPos.x, shipPos.y);
        this.ctx.lineTo(waypointPos.x, waypointPos.y);
        this.ctx.stroke();
        this.ctx.restore();
    }

    // Draw selection ring around a ship
    drawSelectionRing(ship, centerX, centerY, scale) {
        const pos = this.worldToScreen(ship.x, ship.y, centerX, centerY, scale);
        const size = ship.size / scale;
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 4) * 0.2 + 0.8;

        this.ctx.save();
        this.ctx.strokeStyle = `rgba(0, 240, 255, ${pulse})`;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([8, 4]);
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, size + 15, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
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
            showWaypointLine = false,
            selectedShipId = null,
            showShipWaypoints = false
        } = options;

        this.clear();
        this.drawStars(centerX, centerY, scale);

        // Emit damage particles for every ship, then age the whole pool
        [...gameState.ships, gameState.playerShip].forEach(ship => {
            this.emitDamageParticles(ship);
        });
        this.updateParticles();

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

        // Draw ship waypoints and lines (before ships so lines are behind)
        if (showShipWaypoints) {
            gameState.ships.forEach(ship => {
                if (ship.commandWaypoint) {
                    this.drawShipWaypointLine(ship, ship.commandWaypoint, centerX, centerY, scale);
                }
            });
        }

        // Smoke particles drawn behind ships so beams and hulls appear in front
        this.drawParticles(centerX, centerY, scale, 'smoke');

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
            
            // Draw selection ring if this ship is selected
            if (selectedShipId === ship.id) {
                this.drawSelectionRing(ship, centerX, centerY, scale);
            }
        });

        // Draw player ship
        this.drawShip(gameState.playerShip, centerX, centerY, scale, true, false);

        // Fire particles sit in front of hulls but behind waypoint markers and HUD
        this.drawParticles(centerX, centerY, scale, 'fire');

        // Status bars — shown for player, scanned ships, and the current target
        gameState.ships.forEach(ship => {
            const isTarget = ship.id === gameState.currentTarget;
            const showBars = ship.scanned || ship.faction === 'friendly' || isTarget;
            this.drawShipStatusBars(ship, centerX, centerY, scale, showBars);
        });
        this.drawShipStatusBars(gameState.playerShip, centerX, centerY, scale, true);

        // Draw ship waypoint markers (after ships so they're on top)
        if (showShipWaypoints) {
            gameState.ships.forEach(ship => {
                if (ship.commandWaypoint) {
                    this.drawShipWaypoint(ship, ship.commandWaypoint, centerX, centerY, scale);
                }
            });
        }

        // Update and draw nuke explosions (on top for visibility)
        for (let i = gameState.explosions.length - 1; i >= 0; i--) {
            gameState.explosions[i].lifetime--;
            if (gameState.explosions[i].lifetime <= 0) {
                gameState.explosions.splice(i, 1);
            } else {
                this.drawExplosion(gameState.explosions[i], centerX, centerY, scale);
            }
        }

        if (showHUD) {
            this.drawHUD(scale);
        }
    }
}

// Singleton instance
export const renderer = new Renderer();
