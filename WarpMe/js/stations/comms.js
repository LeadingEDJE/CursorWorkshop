/**
 * Communications Station
 * Hailing, message log, and frequency management
 */

import { gameState } from '../core/state.js';
import { audio } from '../core/audio.js';

class CommsStation {
    constructor() {
        this.container = null;
        this.selectedFrequency = 'all';
        this.unreadCount = 0;
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
                        <h3>HAIL TARGET</h3>
                        <select id="hail-target" class="select-input">
                            <option value="">-- Select Target --</option>
                        </select>
                        <button id="hail-btn" class="btn btn-primary btn-large">
                            <span class="btn-icon">📡</span> OPEN HAILING FREQUENCIES
                        </button>
                    </div>
                    <div class="panel">
                        <h3>FREQUENCY FILTER</h3>
                        <div class="frequency-buttons">
                            <button class="btn btn-freq active" data-freq="all">ALL</button>
                            <button class="btn btn-freq" data-freq="hail">HAILS</button>
                            <button class="btn btn-freq" data-freq="alert">ALERTS</button>
                            <button class="btn btn-freq" data-freq="info">SYSTEM</button>
                        </div>
                    </div>
                    <div class="panel">
                        <h3>QUICK MESSAGES</h3>
                        <div class="quick-messages">
                            <button class="btn btn-secondary btn-small" data-msg="Acknowledged.">
                                ACKNOWLEDGE
                            </button>
                            <button class="btn btn-secondary btn-small" data-msg="Request assistance.">
                                REQUEST HELP
                            </button>
                            <button class="btn btn-secondary btn-small" data-msg="Standing by.">
                                STANDING BY
                            </button>
                            <button class="btn btn-secondary btn-small" data-msg="Breaking off engagement.">
                                WITHDRAW
                            </button>
                        </div>
                    </div>
                    <div class="panel">
                        <h3>BROADCAST</h3>
                        <textarea id="broadcast-input" class="broadcast-input" 
                                  placeholder="Enter message..." rows="3"></textarea>
                        <button id="broadcast-btn" class="btn btn-primary">
                            BROADCAST
                        </button>
                    </div>
                </div>
                <div class="comms-main">
                    <div class="panel comms-log-panel">
                        <h3>COMMUNICATIONS LOG <span id="unread-badge" class="badge hidden">0</span></h3>
                        <div id="comms-log" class="comms-log"></div>
                    </div>
                </div>
            </div>
        `;

        this.updateHailTargets();
        this.updateCommsLog();
    }

    setupEventListeners() {
        // Hail button
        document.getElementById('hail-btn').addEventListener('click', () => {
            const target = document.getElementById('hail-target').value;
            if (target) {
                gameState.hailShip(target);
                audio.playHail();
            } else {
                gameState.addCommsMessage('COMMS', 'Select a target to hail.', 'alert');
                audio.playError();
            }
        });

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

        // Quick messages
        document.querySelectorAll('[data-msg]').forEach(btn => {
            btn.addEventListener('click', () => {
                const msg = btn.dataset.msg;
                gameState.addCommsMessage('USS ENDEAVOUR', msg, 'normal');
                audio.playBeep();
            });
        });

        // Broadcast button
        document.getElementById('broadcast-btn').addEventListener('click', () => {
            const input = document.getElementById('broadcast-input');
            const msg = input.value.trim();
            if (msg) {
                gameState.addCommsMessage('USS ENDEAVOUR', msg, 'normal');
                input.value = '';
                audio.playBeep();
            }
        });

        // Broadcast enter key (shift+enter for newline)
        document.getElementById('broadcast-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.getElementById('broadcast-btn').click();
            }
        });

        // Listen for new messages
        gameState.on('commsMessage', (msg) => {
            this.updateCommsLog();
            if (msg.type === 'hail') {
                audio.playHail();
            } else if (msg.type === 'alert') {
                audio.playError();
            }
        });

        // Update targets when ships change
        gameState.on('shipAdded', () => this.updateHailTargets());
        gameState.on('shipDestroyed', () => this.updateHailTargets());
    }

    updateHailTargets() {
        const select = document.getElementById('hail-target');
        if (!select) return;

        select.innerHTML = '<option value="">-- Select Target --</option>' +
            gameState.ships.map(ship => {
                const name = ship.scanned ? ship.name : `Unknown (${ship.faction})`;
                return `<option value="${ship.id}">${name}</option>`;
            }).join('');
    }

    updateCommsLog() {
        const log = document.getElementById('comms-log');
        if (!log) return;

        let messages = gameState.commsLog;
        
        // Filter by frequency
        if (this.selectedFrequency !== 'all') {
            messages = messages.filter(msg => msg.type === this.selectedFrequency);
        }

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

        // Update unread badge
        this.updateUnreadBadge();
    }

    updateUnreadBadge() {
        const badge = document.getElementById('unread-badge');
        if (!badge) return;

        const unread = gameState.commsLog.filter(m => !m.read).length;
        
        if (unread > 0) {
            badge.textContent = unread;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    formatTime(gameTime) {
        const totalSeconds = Math.floor(gameTime / 20); // 20 ticks per second
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    update(timestamp) {
        // Periodically update hail targets (in case new ships appear)
        if (Math.floor(timestamp / 1000) % 5 === 0) {
            this.updateHailTargets();
        }
    }

    destroy() {
        // Cleanup
    }
}

export const commsStation = new CommsStation();
