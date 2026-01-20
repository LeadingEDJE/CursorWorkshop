/**
 * Initial Scenario Setup
 * Spawns ships and sets up the starting game state
 */

import { gameState } from './state.js';

// Ship name generators
const friendlyNames = [
    'USS Valor', 'USS Horizon', 'USS Discovery', 'USS Pathfinder',
    'USS Sentinel', 'USS Pioneer', 'USS Defiant', 'USS Resolute'
];

const neutralNames = [
    'SS Aurora', 'SS Merchant Star', 'SS Free Spirit', 'SS Wanderer',
    'SS Fortune', 'SS Nebula Trader', 'SS Cargo King', 'SS Silent Runner'
];

const hostileNames = [
    'IKS Vengeance', 'IKS Bloodwing', 'IKS Ravager', 'IKS Death Strike',
    'IKS Shadow Hunter', 'IKS Wrath', 'IKS Destroyer', 'IKS Predator'
];

// Generate patrol points around a position
function generatePatrolPoints(centerX, centerY, radius, count = 4) {
    const points = [];
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        points.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
        });
    }
    return points;
}

// Random position in a ring around origin
function randomRingPosition(minRadius, maxRadius) {
    const angle = Math.random() * Math.PI * 2;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
    };
}

// Initialize the starting scenario
export function initializeScenario() {
    // Reset game state
    gameState.reset();

    // ===== FRIENDLY SHIPS (2 near player) =====
    
    // Escort 1 - close by
    const escort1Pos = randomRingPosition(100, 200);
    gameState.addShip({
        name: friendlyNames[0],
        type: 'escort',
        faction: 'friendly',
        x: escort1Pos.x,
        y: escort1Pos.y,
        heading: Math.random() * 360,
        velocity: 0,
        maxVelocity: 6,
        size: 18,
        patrolPoints: generatePatrolPoints(0, 0, 300, 4),
        scanned: true
    });

    // Escort 2 - nearby
    const escort2Pos = randomRingPosition(150, 300);
    gameState.addShip({
        name: friendlyNames[1],
        type: 'frigate',
        faction: 'friendly',
        x: escort2Pos.x,
        y: escort2Pos.y,
        heading: Math.random() * 360,
        velocity: 0,
        maxVelocity: 5,
        size: 20,
        patrolPoints: generatePatrolPoints(escort2Pos.x, escort2Pos.y, 200, 3),
        scanned: true
    });

    // ===== NEUTRAL SHIPS (3 traders at mid-range) =====
    
    for (let i = 0; i < 3; i++) {
        const pos = randomRingPosition(800, 1500);
        const patrolCenter = randomRingPosition(600, 1200);
        
        gameState.addShip({
            name: neutralNames[i],
            type: 'freighter',
            faction: 'neutral',
            x: pos.x,
            y: pos.y,
            heading: Math.random() * 360,
            velocity: 0,
            maxVelocity: 3,
            size: 22,
            patrolPoints: generatePatrolPoints(patrolCenter.x, patrolCenter.y, 400, 4),
            scanned: false
        });
    }

    // ===== HOSTILE SHIPS (4 warships at far range) =====
    
    // Hostiles spawn far from player but not all in same area
    const hostileZones = [
        { minR: 2000, maxR: 2500, angle: 0 },
        { minR: 2200, maxR: 2800, angle: Math.PI / 2 },
        { minR: 1800, maxR: 2400, angle: Math.PI },
        { minR: 2000, maxR: 2600, angle: -Math.PI / 2 }
    ];

    for (let i = 0; i < 4; i++) {
        const zone = hostileZones[i];
        const radius = zone.minR + Math.random() * (zone.maxR - zone.minR);
        const angleVar = (Math.random() - 0.5) * 0.5;
        const x = Math.cos(zone.angle + angleVar) * radius;
        const y = Math.sin(zone.angle + angleVar) * radius;
        
        gameState.addShip({
            name: hostileNames[i],
            type: i === 0 ? 'battlecruiser' : 'warbird',
            faction: 'hostile',
            x: x,
            y: y,
            heading: Math.random() * 360,
            velocity: 0,
            maxVelocity: 7,
            turnRate: 2,
            size: i === 0 ? 28 : 22,
            hull: i === 0 ? 150 : 100,
            maxHull: i === 0 ? 150 : 100,
            patrolPoints: generatePatrolPoints(x, y, 300, 3),
            scanned: false
        });
    }

    // ===== INITIAL COMMS MESSAGES =====
    
    gameState.addCommsMessage('STARFLEET COMMAND', 
        'USS Endeavour, you are cleared for patrol. Report any hostile activity.', 
        'hail'
    );
    
    setTimeout(() => {
        gameState.addCommsMessage(friendlyNames[0].toUpperCase(), 
            'Endeavour, we have your wing. Standing by.', 
            'hail'
        );
    }, 2000);

    setTimeout(() => {
        gameState.addCommsMessage('SENSORS', 
            'Detecting multiple contacts at long range. Recommend scanning sector.', 
            'info'
        );
    }, 4000);

    console.log('Scenario initialized:', {
        friendly: gameState.ships.filter(s => s.faction === 'friendly').length,
        neutral: gameState.ships.filter(s => s.faction === 'neutral').length,
        hostile: gameState.ships.filter(s => s.faction === 'hostile').length
    });
}
