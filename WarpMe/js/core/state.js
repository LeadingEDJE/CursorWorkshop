/**
 * Central Game State Management
 * Holds all shared state for the starship simulator
 */

// Subsystem template
function createSubsystems() {
    return {
        engines: { hp: 100, maxHp: 100, power: 50 },
        weapons: { hp: 100, maxHp: 100, power: 50 },
        shields: { hp: 100, maxHp: 100, power: 50 },
        sensors: { hp: 100, maxHp: 100, power: 50 }
    };
}

// Ship factory
function createShip(config) {
    return {
        id: config.id || crypto.randomUUID(),
        name: config.name || 'Unknown Vessel',
        type: config.type || 'frigate',
        faction: config.faction || 'neutral', // 'friendly', 'neutral', 'hostile'
        x: config.x || 0,
        y: config.y || 0,
        heading: config.heading || 0, // degrees, 0 = right, 90 = down
        velocity: config.velocity || 0,
        maxVelocity: config.maxVelocity || 5,
        turnRate: config.turnRate || 3,
        subsystems: config.subsystems || createSubsystems(),
        hull: config.hull || 100,
        maxHull: config.maxHull || 100,
        shieldStrength: config.shieldStrength || 100,
        maxShieldStrength: config.maxShieldStrength || 100,
        // AI state (for NPCs)
        aiState: config.aiState || 'patrol',
        patrolPoints: config.patrolPoints || [],
        patrolIndex: config.patrolIndex || 0,
        target: config.target || null,
        // Visual
        size: config.size || 20,
        scanned: config.scanned || false
    };
}

// Projectile factory
function createProjectile(config) {
    return {
        id: crypto.randomUUID(),
        type: config.type || 'phaser', // 'phaser', 'torpedo'
        x: config.x,
        y: config.y,
        heading: config.heading,
        velocity: config.type === 'torpedo' ? 12 : 50,
        damage: config.type === 'torpedo' ? 30 : 10,
        sourceId: config.sourceId,
        targetId: config.targetId || null,
        lifetime: config.type === 'torpedo' ? 300 : 20, // frames
        size: config.type === 'torpedo' ? 8 : 3
    };
}

// Main game state
class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        // Player ship
        this.playerShip = createShip({
            id: 'player',
            name: 'USS Endeavour',
            type: 'cruiser',
            faction: 'friendly',
            x: 0,
            y: 0,
            heading: 0,
            velocity: 0,
            maxVelocity: 8,
            size: 25,
            scanned: true
        });

        // NPC ships
        this.ships = [];

        // Projectiles in flight
        this.projectiles = [];

        // Phaser beams (visual only, instant damage)
        this.phaserBeams = [];

        // Communication log
        this.commsLog = [];

        // Current target (for weapons/comms)
        this.currentTarget = null;

        // Alert level: 'normal', 'yellow', 'red'
        this.alertLevel = 'normal';
        // Auto-alert permanently disabled (manual control only)
        this.autoAlertEnabled = false;

        // Waypoint for navigation
        this.waypoint = null;

        // Game time
        this.gameTime = 0;
        this.isPaused = false;

        // Repair cooldowns (subsystem name -> cooldown remaining)
        this.repairCooldowns = {};

        // Event listeners
        this.listeners = new Map();
    }

    // Event system for state changes
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) callbacks.splice(index, 1);
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(cb => cb(data));
        }
    }

    // Add a ship to the game
    addShip(config) {
        const ship = createShip(config);
        this.ships.push(ship);
        this.emit('shipAdded', ship);
        return ship;
    }

    // Remove a ship
    removeShip(shipId) {
        const index = this.ships.findIndex(s => s.id === shipId);
        if (index > -1) {
            const ship = this.ships.splice(index, 1)[0];
            this.emit('shipDestroyed', ship);
            if (this.currentTarget === shipId) {
                this.currentTarget = null;
            }
        }
    }

    // Get a ship by ID
    getShip(shipId) {
        if (shipId === 'player') return this.playerShip;
        return this.ships.find(s => s.id === shipId);
    }

    // Fire a weapon
    fireWeapon(type, targetId = null) {
        const ship = this.playerShip;
        const weapons = ship.subsystems.weapons;
        
        // Check if weapons are functional
        if (weapons.hp <= 0 || weapons.power <= 0) {
            this.addCommsMessage('SYSTEM', 'Weapons offline!', 'alert');
            return false;
        }

        const effectiveness = (weapons.hp / 100) * (weapons.power / 100);
        
        if (type === 'phaser') {
            // Phaser is instant beam
            const target = this.getShip(targetId || this.currentTarget);
            if (!target) {
                this.addCommsMessage('SYSTEM', 'No target locked!', 'alert');
                return false;
            }
            
            const distance = Math.hypot(target.x - ship.x, target.y - ship.y);
            if (distance > 500) {
                this.addCommsMessage('SYSTEM', 'Target out of phaser range!', 'alert');
                return false;
            }

            // Add visual beam
            this.phaserBeams.push({
                x1: ship.x,
                y1: ship.y,
                x2: target.x,
                y2: target.y,
                lifetime: 15
            });

            // Apply damage
            const damage = 15 * effectiveness;
            this.damageShip(target, damage);
            this.emit('weaponFired', { type: 'phaser', target });
            return true;
        } else if (type === 'torpedo') {
            // Torpedo is a projectile
            const projectile = createProjectile({
                type: 'torpedo',
                x: ship.x,
                y: ship.y,
                heading: ship.heading,
                sourceId: 'player',
                targetId: targetId || this.currentTarget
            });
            projectile.damage *= effectiveness;
            this.projectiles.push(projectile);
            this.emit('weaponFired', { type: 'torpedo' });
            return true;
        }
        return false;
    }

    // Damage a ship
    damageShip(ship, damage) {
        // Shields absorb damage first
        const shieldEffectiveness = ship.subsystems.shields.power / 100;
        const shieldAbsorb = Math.min(ship.shieldStrength, damage * shieldEffectiveness * 0.8);
        ship.shieldStrength -= shieldAbsorb;
        
        const hullDamage = damage - shieldAbsorb;
        ship.hull -= hullDamage;

        // Random subsystem damage
        if (hullDamage > 5 && Math.random() < 0.3) {
            const systems = ['engines', 'weapons', 'shields', 'sensors'];
            const system = systems[Math.floor(Math.random() * systems.length)];
            ship.subsystems[system].hp = Math.max(0, ship.subsystems[system].hp - hullDamage * 0.5);
            
            if (ship.id === 'player') {
                this.addCommsMessage('DAMAGE CONTROL', `${system.toUpperCase()} damaged!`, 'alert');
            }
        }

        this.emit('shipDamaged', { ship, damage });

        // Check for destruction
        if (ship.hull <= 0) {
            ship.hull = 0;
            if (ship.id !== 'player') {
                this.removeShip(ship.id);
                this.addCommsMessage('TACTICAL', `${ship.name} destroyed!`, 'info');
            } else {
                this.emit('playerDestroyed', ship);
                this.addCommsMessage('SYSTEM', 'HULL BREACH! ALL HANDS ABANDON SHIP!', 'alert');
            }
        }
    }

    // Add a communication message
    addCommsMessage(sender, message, type = 'normal') {
        const msg = {
            id: crypto.randomUUID(),
            sender,
            message,
            type, // 'normal', 'alert', 'hail', 'info'
            timestamp: this.gameTime,
            read: false
        };
        this.commsLog.unshift(msg);
        // Keep only last 50 messages
        if (this.commsLog.length > 50) {
            this.commsLog.pop();
        }
        this.emit('commsMessage', msg);
        return msg;
    }

    // Set current target
    setTarget(shipId) {
        this.currentTarget = shipId;
        this.emit('targetChanged', shipId);
    }

    // Set alert level
    setAlertLevel(level) {
        if (this.alertLevel !== level) {
            this.alertLevel = level;
            this.emit('alertChanged', level);
            this.addCommsMessage('BRIDGE', `${level.toUpperCase()} ALERT`, level === 'red' ? 'alert' : 'info');
        }
    }

    // Enable/disable auto alert control by simulation
    setAutoAlertEnabled(enabled) {
        if (this.autoAlertEnabled !== enabled) {
            this.autoAlertEnabled = enabled;
            this.emit('autoAlertChanged', enabled);
            this.addCommsMessage('BRIDGE', enabled ? 'Auto alert enabled' : 'Auto alert disabled', 'info');
        }
    }

    // Set waypoint
    setWaypoint(x, y) {
        this.waypoint = { x, y };
        this.emit('waypointSet', this.waypoint);
    }

    // Clear waypoint
    clearWaypoint() {
        this.waypoint = null;
        this.emit('waypointCleared');
    }

    // Repair a subsystem
    repairSubsystem(systemName) {
        if (this.repairCooldowns[systemName] > 0) {
            return false;
        }
        
        const system = this.playerShip.subsystems[systemName];
        if (system.hp >= system.maxHp) {
            return false;
        }

        // Repair 25 HP over time (instant for demo)
        system.hp = Math.min(system.maxHp, system.hp + 25);
        this.repairCooldowns[systemName] = 300; // 5 second cooldown at 60fps
        
        this.addCommsMessage('ENGINEERING', `Repairing ${systemName}...`, 'info');
        this.emit('repairStarted', systemName);
        return true;
    }

    // Set power allocation
    setPower(systemName, power) {
        const system = this.playerShip.subsystems[systemName];
        if (system) {
            system.power = Math.max(0, Math.min(100, power));
            this.emit('powerChanged', { system: systemName, power: system.power });
        }
    }

    // Hail a ship
    hailShip(shipId) {
        const ship = this.getShip(shipId);
        if (!ship) return;

        this.addCommsMessage('COMMS', `Hailing ${ship.name}...`, 'hail');
        
        // Simulate response after delay
        setTimeout(() => {
            const responses = {
                friendly: [
                    `${ship.name} here. Good to see you, Endeavour!`,
                    `Greetings, Endeavour. How can we assist?`,
                    `${ship.name} acknowledging. Standing by.`
                ],
                neutral: [
                    `This is ${ship.name}. State your business.`,
                    `${ship.name} responding. We're on a trade route.`,
                    `Acknowledged, Endeavour. Safe travels.`
                ],
                hostile: [
                    `${ship.name} to Federation vessel: Leave this sector!`,
                    `You dare hail us? Prepare to be destroyed!`,
                    `No response... jamming frequencies detected.`
                ]
            };
            
            const options = responses[ship.faction] || responses.neutral;
            const response = options[Math.floor(Math.random() * options.length)];
            this.addCommsMessage(ship.name.toUpperCase(), response, 'hail');
        }, 1000);
    }

    // Get distance to waypoint
    getWaypointDistance() {
        if (!this.waypoint) return null;
        return Math.hypot(
            this.waypoint.x - this.playerShip.x,
            this.waypoint.y - this.playerShip.y
        );
    }

    // Get ETA to waypoint
    getWaypointETA() {
        const distance = this.getWaypointDistance();
        if (!distance || this.playerShip.velocity <= 0) return null;
        return distance / this.playerShip.velocity;
    }
}

// Singleton instance
export const gameState = new GameState();
export { createShip, createProjectile, createSubsystems };
