/**
 * Engineering Station
 * Power distribution, damage control, and system management
 */

import { gameState } from '../core/state.js';
import { audio } from '../core/audio.js';

class EngineeringStation {
    constructor() {
        this.container = null;
    }

    init(container) {
        this.container = container;
        this.render();
        this.setupEventListeners();
    }

    render() {
        const ship = gameState.playerShip;
        const systems = ship.subsystems;
        
        this.container.innerHTML = `
            <div class="station-layout engineering-layout">
                <div class="engineering-main">
                    <div class="ship-diagram-panel panel">
                        <h3>SHIP STATUS</h3>
                        <div class="ship-diagram">
                            <svg viewBox="0 0 400 200" class="ship-svg">
                                <!-- Ship outline -->
                                <polygon points="350,100 50,50 80,100 50,150" 
                                         fill="none" stroke="#00f0ff" stroke-width="2"/>
                                <!-- Nacelles -->
                                <rect x="100" y="30" width="80" height="15" 
                                      fill="none" stroke="#00f0ff" stroke-width="1"/>
                                <rect x="100" y="155" width="80" height="15" 
                                      fill="none" stroke="#00f0ff" stroke-width="1"/>
                                      
                                <!-- System labels -->
                                <text x="280" y="95" class="system-label">WEAPONS</text>
                                <circle cx="300" cy="100" r="8" id="svg-weapons" class="system-indicator"/>
                                
                                <text x="140" y="20" class="system-label">SENSORS</text>
                                <circle cx="140" cy="37" r="8" id="svg-sensors" class="system-indicator"/>
                                
                                <text x="60" y="95" class="system-label">SHIELDS</text>
                                <circle cx="80" cy="100" r="8" id="svg-shields" class="system-indicator"/>
                                
                                <text x="140" y="190" class="system-label">ENGINES</text>
                                <circle cx="140" cy="162" r="8" id="svg-engines" class="system-indicator"/>
                            </svg>
                        </div>
                        <div class="hull-status">
                            <h4>HULL INTEGRITY</h4>
                            <div class="progress-bar large">
                                <div id="hull-bar" class="progress-fill hull-fill" 
                                     style="width: ${ship.hull}%"></div>
                            </div>
                            <span id="hull-pct">${Math.round(ship.hull)}%</span>
                        </div>
                        <div class="shield-status">
                            <h4>SHIELD STRENGTH</h4>
                            <div class="progress-bar large">
                                <div id="shield-bar" class="progress-fill shield-fill" 
                                     style="width: ${ship.shieldStrength}%"></div>
                            </div>
                            <span id="shield-pct">${Math.round(ship.shieldStrength)}%</span>
                        </div>
                    </div>
                </div>
                <div class="engineering-sidebar">
                    <div class="panel power-panel">
                        <h3>POWER DISTRIBUTION</h3>
                        <p class="power-note">Total power budget: 200%</p>
                        <p id="power-used" class="power-used">Used: ${this.getTotalPower()}%</p>
                        
                        ${this.renderPowerSlider('engines', systems.engines)}
                        ${this.renderPowerSlider('weapons', systems.weapons)}
                        ${this.renderPowerSlider('shields', systems.shields)}
                        ${this.renderPowerSlider('sensors', systems.sensors)}
                        
                        <div class="power-presets">
                            <button class="btn btn-small" data-preset="balanced">BALANCED</button>
                            <button class="btn btn-small" data-preset="combat">COMBAT</button>
                            <button class="btn btn-small" data-preset="defensive">DEFENSIVE</button>
                            <button class="btn btn-small" data-preset="speed">SPEED</button>
                        </div>
                    </div>
                    <div class="panel repair-panel">
                        <h3>DAMAGE CONTROL</h3>
                        ${this.renderRepairControls()}
                    </div>
                    <div class="panel alerts-panel">
                        <h3>ALERT STATUS</h3>
                        <div class="alert-buttons">
                            <button class="btn btn-alert ${gameState.alertLevel === 'normal' ? 'active' : ''}" 
                                    data-alert="normal">NORMAL</button>
                            <button class="btn btn-alert btn-yellow ${gameState.alertLevel === 'yellow' ? 'active' : ''}" 
                                    data-alert="yellow">YELLOW</button>
                            <button class="btn btn-alert btn-red ${gameState.alertLevel === 'red' ? 'active' : ''}" 
                                    data-alert="red">RED</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPowerSlider(name, system) {
        const healthClass = system.hp > 70 ? 'text-green' : system.hp > 30 ? 'text-yellow' : 'text-red';
        return `
            <div class="power-control" data-system="${name}">
                <div class="power-header">
                    <span class="power-name">${name.toUpperCase()}</span>
                    <span class="power-health ${healthClass}">${Math.round(system.hp)}% HP</span>
                </div>
                <div class="power-slider-row">
                    <input type="range" class="power-slider" id="power-${name}" 
                           min="0" max="100" value="${system.power}">
                    <span class="power-value" id="power-${name}-value">${system.power}%</span>
                </div>
            </div>
        `;
    }

    renderRepairControls() {
        const systems = ['engines', 'weapons', 'shields', 'sensors'];
        return systems.map(name => {
            const system = gameState.playerShip.subsystems[name];
            const cooldown = gameState.repairCooldowns[name] || 0;
            const canRepair = system.hp < system.maxHp && cooldown === 0;
            const needsRepair = system.hp < system.maxHp;
            
            return `
                <div class="repair-row">
                    <span class="repair-name">${name.toUpperCase()}</span>
                    <div class="repair-bar-container">
                        <div class="progress-bar small">
                            <div class="progress-fill ${this.getHealthClass(system.hp)}" 
                                 style="width: ${system.hp}%"></div>
                        </div>
                    </div>
                    <button class="btn btn-small btn-repair" 
                            data-repair="${name}"
                            ${canRepair ? '' : 'disabled'}>
                        ${cooldown > 0 ? `${Math.ceil(cooldown / 20)}s` : needsRepair ? 'REPAIR' : 'OK'}
                    </button>
                </div>
            `;
        }).join('');
    }

    getHealthClass(hp) {
        if (hp > 70) return 'health-good';
        if (hp > 30) return 'health-warning';
        return 'health-critical';
    }

    getTotalPower() {
        const systems = gameState.playerShip.subsystems;
        return systems.engines.power + systems.weapons.power + 
               systems.shields.power + systems.sensors.power;
    }

    setupEventListeners() {
        // Power sliders
        document.querySelectorAll('.power-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const system = e.target.id.replace('power-', '');
                const value = parseInt(e.target.value);
                gameState.setPower(system, value);
                this.updatePowerDisplay();
            });
        });

        // Power presets
        document.querySelectorAll('[data-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyPreset(btn.dataset.preset);
                audio.playClick();
            });
        });

        // Repair buttons
        document.querySelectorAll('[data-repair]').forEach(btn => {
            btn.addEventListener('click', () => {
                const system = btn.dataset.repair;
                if (gameState.repairSubsystem(system)) {
                    audio.playBeep();
                } else {
                    audio.playError();
                }
            });
        });

        // Alert buttons (scoped to this station)
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

        // State change listeners
        gameState.on('powerChanged', () => this.updatePowerDisplay());
        gameState.on('alertChanged', () => this.updateAlertButtons());
        gameState.on('repairStarted', () => this.updateRepairButtons());
    }

    applyPreset(preset) {
        const presets = {
            balanced: { engines: 50, weapons: 50, shields: 50, sensors: 50 },
            combat: { engines: 30, weapons: 80, shields: 60, sensors: 30 },
            defensive: { engines: 20, weapons: 30, shields: 100, sensors: 50 },
            speed: { engines: 100, weapons: 30, shields: 40, sensors: 30 }
        };

        const config = presets[preset];
        if (config) {
            Object.keys(config).forEach(system => {
                gameState.setPower(system, config[system]);
            });
            this.updatePowerDisplay();
        }
    }

    updatePowerDisplay() {
        const systems = gameState.playerShip.subsystems;
        
        Object.keys(systems).forEach(name => {
            const slider = document.getElementById(`power-${name}`);
            const value = document.getElementById(`power-${name}-value`);
            
            if (slider) slider.value = systems[name].power;
            if (value) value.textContent = `${systems[name].power}%`;
        });

        const powerUsed = document.getElementById('power-used');
        if (powerUsed) {
            const total = this.getTotalPower();
            powerUsed.textContent = `Used: ${total}%`;
            powerUsed.className = total > 200 ? 'power-used text-red' : 'power-used';
        }
    }

    updateAlertButtons() {
        this.container.querySelectorAll('[data-alert]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.alert === gameState.alertLevel);
        });
    }

    updateRepairButtons() {
        const repairPanel = document.querySelector('.repair-panel');
        if (repairPanel) {
            repairPanel.innerHTML = `<h3>DAMAGE CONTROL</h3>${this.renderRepairControls()}`;
            
            // Re-attach listeners
            document.querySelectorAll('[data-repair]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const system = btn.dataset.repair;
                    if (gameState.repairSubsystem(system)) {
                        audio.playBeep();
                    } else {
                        audio.playError();
                    }
                });
            });
        }
    }

    updateSystemIndicators() {
        const systems = gameState.playerShip.subsystems;
        
        Object.keys(systems).forEach(name => {
            const indicator = document.getElementById(`svg-${name}`);
            if (indicator) {
                const hp = systems[name].hp;
                let color;
                if (hp > 70) color = '#00ff88';
                else if (hp > 30) color = '#ffcc00';
                else if (hp > 0) color = '#ff3366';
                else color = '#333333';
                
                indicator.setAttribute('fill', color);
            }
        });
    }

    update(timestamp) {
        const ship = gameState.playerShip;
        
        // Update hull bar
        const hullBar = document.getElementById('hull-bar');
        const hullPct = document.getElementById('hull-pct');
        if (hullBar) hullBar.style.width = `${ship.hull}%`;
        if (hullPct) hullPct.textContent = `${Math.round(ship.hull)}%`;
        
        // Update shield bar
        const shieldBar = document.getElementById('shield-bar');
        const shieldPct = document.getElementById('shield-pct');
        if (shieldBar) shieldBar.style.width = `${ship.shieldStrength}%`;
        if (shieldPct) shieldPct.textContent = `${Math.round(ship.shieldStrength)}%`;
        
        // Update system indicators on diagram
        this.updateSystemIndicators();
        
        // Update repair buttons (for cooldowns)
        if (Math.floor(timestamp / 500) % 2 === 0) {
            this.updateRepairButtons();
        }
        
        // Update power health displays
        Object.keys(ship.subsystems).forEach(name => {
            const healthEl = document.querySelector(`.power-control[data-system="${name}"] .power-health`);
            if (healthEl) {
                const hp = ship.subsystems[name].hp;
                healthEl.textContent = `${Math.round(hp)}% HP`;
                healthEl.className = `power-health ${hp > 70 ? 'text-green' : hp > 30 ? 'text-yellow' : 'text-red'}`;
            }
        });
    }

    destroy() {
        // Cleanup
    }
}

export const engineeringStation = new EngineeringStation();
