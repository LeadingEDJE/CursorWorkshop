/**
 * WarpMe Starship Simulator
 * Main Application Entry Point
 */

import { gameState } from './core/state.js';
import { simulation } from './core/simulation.js';
import { audio } from './core/audio.js';
import { initializeScenario } from './core/scenario.js';

// Import stations
import { tacticalStation } from './stations/tactical.js';
import { weaponsStation } from './stations/weapons.js';
import { helmStation } from './stations/helm.js';
import { navigationStation } from './stations/navigation.js';
import { commsStation } from './stations/comms.js';
import { engineeringStation } from './stations/engineering.js';

// Station registry
const stations = {
    tactical: tacticalStation,
    weapons: weaponsStation,
    helm: helmStation,
    navigation: navigationStation,
    comms: commsStation,
    engineering: engineeringStation
};

let currentStation = null;

// Initialize the application
function init() {
    console.log('WarpMe Starship Simulator initializing...');
    
    // Initialize audio on first interaction
    document.addEventListener('click', () => audio.init(), { once: true });
    document.addEventListener('keydown', () => audio.init(), { once: true });
    
    // Initialize the scenario
    initializeScenario();
    
    // Set up tab navigation
    setupTabNavigation();
    
    // Set up top nav controls
    setupTopNav();
    
    // Listen for state changes to update top nav
    setupStateListeners();
    
    // Start with tactical station
    switchStation('tactical');
    
    // Start the simulation
    simulation.start((timestamp) => {
        if (currentStation && currentStation.update) {
            currentStation.update(timestamp);
        }
    });
    
    console.log('WarpMe initialized successfully!');
}

// Set up tab navigation
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('[role="tab"]');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const stationId = button.id.replace('tab-', '');
            switchStation(stationId);
            audio.playClick();
        });
    });
    
    // Keyboard navigation
    const tablist = document.querySelector('[role="tablist"]');
    tablist.addEventListener('keydown', (e) => {
        const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
        const currentIndex = tabs.indexOf(document.activeElement);
        let newIndex;
        
        switch(e.key) {
            case 'ArrowRight':
                newIndex = (currentIndex + 1) % tabs.length;
                break;
            case 'ArrowLeft':
                newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                break;
            case 'Home':
                newIndex = 0;
                break;
            case 'End':
                newIndex = tabs.length - 1;
                break;
            default:
                return;
        }
        
        e.preventDefault();
        tabs[newIndex].focus();
        tabs[newIndex].click();
    });
}

// Switch to a different station
function switchStation(stationId) {
    // Update tab buttons
    document.querySelectorAll('[role="tab"]').forEach(tab => {
        const isSelected = tab.id === `tab-${stationId}`;
        tab.setAttribute('aria-selected', isSelected);
        tab.tabIndex = isSelected ? 0 : -1;
    });
    
    // Update tab panels
    document.querySelectorAll('[role="tabpanel"]').forEach(panel => {
        panel.hidden = panel.id !== `panel-${stationId}`;
    });
    
    // Destroy current station if exists
    if (currentStation && currentStation.destroy) {
        currentStation.destroy();
    }
    
    // Initialize new station
    currentStation = stations[stationId];
    if (currentStation) {
        const container = document.getElementById(`panel-${stationId}`);
        currentStation.init(container);
    }
    
    // Update URL hash
    window.location.hash = stationId;
}

// Set up top nav controls
function setupTopNav() {
    // Mute button
    const muteBtn = document.getElementById('mute-btn');
    updateMuteButton();
    
    muteBtn.addEventListener('click', () => {
        audio.toggleMute();
        updateMuteButton();
    });
}

function updateMuteButton() {
    const muteBtn = document.getElementById('mute-btn');
    if (audio.isMuted()) {
        muteBtn.textContent = '🔇';
        muteBtn.classList.add('muted');
        muteBtn.title = 'Unmute';
    } else {
        muteBtn.textContent = '🔊';
        muteBtn.classList.remove('muted');
        muteBtn.title = 'Mute';
    }
}

// Set up state change listeners for UI updates
function setupStateListeners() {
    // Alert level changes
    gameState.on('alertChanged', (level) => {
        updateAlertIndicator(level);
    });
    
    // Initial alert indicator
    updateAlertIndicator(gameState.alertLevel);
}

function updateAlertIndicator(level) {
    const indicator = document.getElementById('alert-indicator');
    if (!indicator) return;
    
    indicator.className = `alert-indicator ${level}`;
    indicator.textContent = `${level.toUpperCase()} ALERT`;
}

// Handle initial hash route
function handleInitialRoute() {
    const hash = window.location.hash.slice(1);
    const validStations = Object.keys(stations);
    
    if (validStations.includes(hash)) {
        switchStation(hash);
    }
}

// Handle hash changes
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    const validStations = Object.keys(stations);
    
    if (validStations.includes(hash)) {
        switchStation(hash);
        audio.playClick();
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
        handleInitialRoute();
    });
} else {
    init();
    handleInitialRoute();
}
