/**
 * Simulation Engine
 * Handles game loop, physics, AI, and collision detection
 */

import { gameState } from './state.js';
import { audio } from './audio.js';

class Simulation {
    constructor() {
        this.lastTick = 0;
        this.tickLength = 50; // 20Hz simulation rate
        this.animationId = null;
        this.running = false;
        this.onRender = null; // Callback for rendering
    }

    // Start the simulation loop
    start(renderCallback) {
        if (this.running) return;
        
        this.running = true;
        this.onRender = renderCallback;
        this.lastTick = performance.now();
        this.loop(this.lastTick);
    }

    // Stop the simulation loop
    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    // Main loop
    loop(timestamp) {
        if (!this.running) return;
        
        this.animationId = requestAnimationFrame((t) => this.loop(t));

        // Calculate ticks needed
        const elapsed = timestamp - this.lastTick;
        const ticksNeeded = Math.floor(elapsed / this.tickLength);

        // Run fixed timestep updates
        for (let i = 0; i < Math.min(ticksNeeded, 5); i++) { // Cap at 5 to prevent spiral
            this.lastTick += this.tickLength;
            if (!gameState.isPaused) {
                this.update();
            }
        }

        // Render at screen refresh rate
        if (this.onRender) {
            this.onRender(timestamp);
        }
    }

    // Fixed timestep update
    update() {
        gameState.gameTime++;
        
        this.updatePlayerShip();
        this.updateNPCShips();
        this.updateProjectiles();
        this.updatePhaserBeams();
        this.updateRepairCooldowns();
        this.checkAlertLevel();
        this.regenerateShields();
    }

    // Update player ship movement
    updatePlayerShip() {
        const ship = gameState.playerShip;
        
        // Engine effectiveness
        const engineEffectiveness = this.getSystemEffectiveness(ship, 'engines');
        
        // Apply velocity based on heading
        const radians = (ship.heading * Math.PI) / 180;
        const effectiveVelocity = ship.velocity * engineEffectiveness;
        
        ship.x += Math.cos(radians) * effectiveVelocity;
        ship.y += Math.sin(radians) * effectiveVelocity;

        // Auto-navigate to waypoint if set
        if (gameState.waypoint && ship.velocity > 0) {
            const dx = gameState.waypoint.x - ship.x;
            const dy = gameState.waypoint.y - ship.y;
            const distance = Math.hypot(dx, dy);
            
            if (distance < 20) {
                // Reached waypoint
                gameState.addCommsMessage('NAVIGATION', 'Waypoint reached.', 'info');
                gameState.clearWaypoint();
            }
        }
    }

    // Update NPC ships
    updateNPCShips() {
        gameState.ships.forEach(ship => {
            this.updateNPCAI(ship);
            this.moveNPCShip(ship);
        });
    }

    // NPC AI state machine
    updateNPCAI(ship) {
        const player = gameState.playerShip;
        const distToPlayer = Math.hypot(player.x - ship.x, player.y - ship.y);

        switch (ship.faction) {
            case 'friendly':
                // Friendly ships patrol near player
                if (distToPlayer > 500) {
                    ship.aiState = 'approach';
                    ship.target = 'player';
                } else {
                    ship.aiState = 'patrol';
                }
                break;

            case 'neutral':
                // Neutral ships just patrol
                ship.aiState = 'patrol';
                break;

            case 'hostile':
                // Hostile ships attack if close, flee if damaged
                const hullPercent = ship.hull / ship.maxHull;
                
                if (hullPercent < 0.3) {
                    ship.aiState = 'flee';
                } else if (distToPlayer < 800) {
                    ship.aiState = 'attack';
                    ship.target = 'player';
                } else if (distToPlayer < 1500) {
                    ship.aiState = 'approach';
                    ship.target = 'player';
                } else {
                    ship.aiState = 'patrol';
                }
                break;
        }
    }

    // Move NPC ship based on AI state
    moveNPCShip(ship) {
        const engineEffectiveness = this.getSystemEffectiveness(ship, 'engines');
        let targetX, targetY;

        switch (ship.aiState) {
            case 'patrol':
                // Move between patrol points
                if (ship.patrolPoints.length > 0) {
                    const point = ship.patrolPoints[ship.patrolIndex];
                    targetX = point.x;
                    targetY = point.y;
                    
                    const dist = Math.hypot(targetX - ship.x, targetY - ship.y);
                    if (dist < 30) {
                        ship.patrolIndex = (ship.patrolIndex + 1) % ship.patrolPoints.length;
                    }
                    
                    ship.velocity = ship.maxVelocity * 0.5 * engineEffectiveness;
                } else {
                    ship.velocity = 0;
                }
                break;

            case 'approach':
                const approachTarget = ship.target === 'player' ? gameState.playerShip : null;
                if (approachTarget) {
                    targetX = approachTarget.x;
                    targetY = approachTarget.y;
                    ship.velocity = ship.maxVelocity * 0.8 * engineEffectiveness;
                }
                break;

            case 'attack':
                const attackTarget = ship.target === 'player' ? gameState.playerShip : null;
                if (attackTarget) {
                    targetX = attackTarget.x;
                    targetY = attackTarget.y;
                    ship.velocity = ship.maxVelocity * engineEffectiveness;
                    
                    // Fire at player occasionally
                    const dist = Math.hypot(targetX - ship.x, targetY - ship.y);
                    if (dist < 400 && Math.random() < 0.02) {
                        this.npcFireAtPlayer(ship);
                    }
                }
                break;

            case 'flee':
                const fleeFrom = gameState.playerShip;
                const angle = Math.atan2(ship.y - fleeFrom.y, ship.x - fleeFrom.x);
                targetX = ship.x + Math.cos(angle) * 500;
                targetY = ship.y + Math.sin(angle) * 500;
                ship.velocity = ship.maxVelocity * engineEffectiveness;
                break;
        }

        // Turn towards target
        if (targetX !== undefined && targetY !== undefined) {
            const targetAngle = Math.atan2(targetY - ship.y, targetX - ship.x) * 180 / Math.PI;
            let angleDiff = targetAngle - ship.heading;
            
            // Normalize to -180 to 180
            while (angleDiff > 180) angleDiff -= 360;
            while (angleDiff < -180) angleDiff += 360;
            
            // Turn towards target
            const turnSpeed = ship.turnRate * engineEffectiveness;
            if (Math.abs(angleDiff) < turnSpeed) {
                ship.heading = targetAngle;
            } else {
                ship.heading += angleDiff > 0 ? turnSpeed : -turnSpeed;
            }
            
            // Normalize heading
            while (ship.heading < 0) ship.heading += 360;
            while (ship.heading >= 360) ship.heading -= 360;
        }

        // Apply movement
        const radians = (ship.heading * Math.PI) / 180;
        ship.x += Math.cos(radians) * ship.velocity;
        ship.y += Math.sin(radians) * ship.velocity;
    }

    // NPC fires at player
    npcFireAtPlayer(ship) {
        const weaponEffectiveness = this.getSystemEffectiveness(ship, 'weapons');
        if (weaponEffectiveness <= 0) return;

        const player = gameState.playerShip;
        const angle = Math.atan2(player.y - ship.y, player.x - ship.x) * 180 / Math.PI;

        // Phaser attack (instant)
        const distance = Math.hypot(player.x - ship.x, player.y - ship.y);
        if (distance < 400) {
            gameState.phaserBeams.push({
                x1: ship.x,
                y1: ship.y,
                x2: player.x,
                y2: player.y,
                lifetime: 15
            });

            const damage = 10 * weaponEffectiveness;
            gameState.damageShip(player, damage);
            audio.playHullHit();
        }
    }

    // Update projectiles
    updateProjectiles() {
        for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
            const proj = gameState.projectiles[i];
            
            // Move projectile
            const radians = (proj.heading * Math.PI) / 180;
            proj.x += Math.cos(radians) * proj.velocity;
            proj.y += Math.sin(radians) * proj.velocity;
            
            proj.lifetime--;

            // Check for collisions
            let hit = false;
            
            // Check against ships
            const targets = proj.sourceId === 'player' ? gameState.ships : [gameState.playerShip];
            
            for (const target of targets) {
                const dist = Math.hypot(target.x - proj.x, target.y - proj.y);
                if (dist < target.size + proj.size) {
                    gameState.damageShip(target, proj.damage);
                    audio.playExplosion();
                    hit = true;
                    break;
                }
            }

            // Remove if hit or expired
            if (hit || proj.lifetime <= 0) {
                gameState.projectiles.splice(i, 1);
            }
        }
    }

    // Update phaser beam visuals
    updatePhaserBeams() {
        for (let i = gameState.phaserBeams.length - 1; i >= 0; i--) {
            gameState.phaserBeams[i].lifetime--;
            if (gameState.phaserBeams[i].lifetime <= 0) {
                gameState.phaserBeams.splice(i, 1);
            }
        }
    }

    // Update repair cooldowns
    updateRepairCooldowns() {
        for (const system in gameState.repairCooldowns) {
            if (gameState.repairCooldowns[system] > 0) {
                gameState.repairCooldowns[system]--;
                if (gameState.repairCooldowns[system] === 0) {
                    audio.playRepairComplete();
                }
            }
        }
    }

    // Check and update alert level
    checkAlertLevel() {
        // Respect manual override
        if (!gameState.autoAlertEnabled) return;

        const player = gameState.playerShip;
        let nearestHostileDistance = Infinity;

        gameState.ships.forEach(ship => {
            if (ship.faction === 'hostile') {
                const dist = Math.hypot(ship.x - player.x, ship.y - player.y);
                nearestHostileDistance = Math.min(nearestHostileDistance, dist);
            }
        });

        // Auto alert levels based on proximity
        if (nearestHostileDistance < 500) {
            if (gameState.alertLevel !== 'red') {
                gameState.setAlertLevel('red');
                audio.playRedAlert();
            }
        } else if (nearestHostileDistance < 1000) {
            if (gameState.alertLevel !== 'yellow' && gameState.alertLevel !== 'red') {
                gameState.setAlertLevel('yellow');
                audio.playYellowAlert();
            }
        } else if (gameState.alertLevel !== 'normal' && nearestHostileDistance > 1500) {
            gameState.setAlertLevel('normal');
        }
    }

    // Regenerate shields over time
    regenerateShields() {
        gameState.ships.concat([gameState.playerShip]).forEach(ship => {
            const shieldPower = ship.subsystems.shields.power / 100;
            const shieldHealth = ship.subsystems.shields.hp / 100;
            
            if (shieldPower > 0 && shieldHealth > 0 && ship.shieldStrength < ship.maxShieldStrength) {
                ship.shieldStrength += 0.1 * shieldPower * shieldHealth;
                ship.shieldStrength = Math.min(ship.shieldStrength, ship.maxShieldStrength);
            }
        });
    }

    // Get system effectiveness (0-1)
    getSystemEffectiveness(ship, system) {
        const sys = ship.subsystems[system];
        return (sys.hp / 100) * (sys.power / 100);
    }
}

// Singleton instance
export const simulation = new Simulation();
