import socket from './socketClient.js';

export class LobbyScene extends Phaser.Scene {
    constructor() {
        super('LobbyScene');
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;
        const cy = height / 2;

        // Background
        this.add.rectangle(cx, cy, width, height, 0x211105);

        // Title
        this.add.text(cx, cy - 180, 'Desmoche Nicaragüense', {
            fontFamily: 'Georgia, serif',
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#e7ca72'
        }).setOrigin(0.5);

        // Name input
        this.add.text(cx, cy - 100, 'Tu nombre:', {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#fffbef'
        }).setOrigin(0.5);

        this.nameInput = this.createInput(cx, cy - 68, 'Ej: Carlos');

        // Room code input
        this.add.text(cx, cy, 'Código de sala:', {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#fffbef'
        }).setOrigin(0.5);

        this.roomInput = this.createInput(cx, cy + 32, 'Ej: SALA01');

        // Status message
        this.statusText = this.add.text(cx, cy + 100, '', {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: '#f0d878',
            align: 'center'
        }).setOrigin(0.5);

        // Join button
        this.createButton(cx, cy + 148, 'Unirse a sala', () => this.joinRoom());

        // Socket listeners
        socket.on('roomUpdated', ({ players }) => {
            const names = players.map(p => p.username).join(', ');
            this.statusText.setText(`En sala: ${names}\nEsperando jugadores... (${players.length}/4)`);
        });

        socket.on('gameStart', ({ gameState }) => {
            socket.off('roomUpdated');
            socket.off('gameStart');
            this.scene.start('DesmocheScene', { multiplayer: true, gameState });
        });
    }

    joinRoom() {
        const username = this.nameInput.value.trim();
        const roomCode = this.roomInput.value.trim().toUpperCase();

        if (!username) {
            this.statusText.setText('Por favor escribe tu nombre.');
            return;
        }
        if (!roomCode) {
            this.statusText.setText('Por favor escribe un código de sala.');
            return;
        }

        const userId = `${username}_${Date.now()}`;
        localStorage.setItem('desmoche_userId', userId);
        localStorage.setItem('desmoche_username', username);
        localStorage.setItem('desmoche_roomCode', roomCode);

        this.statusText.setText('Conectando...');
        socket.emit('joinRoom', { roomCode, userId, username });
    }

    createInput(x, y, placeholder) {
        const el = document.createElement('input');
        el.type = 'text';
        el.placeholder = placeholder;
        el.style.cssText = `
            position: absolute;
            width: 240px;
            padding: 8px 12px;
            font-family: Georgia, serif;
            font-size: 15px;
            background: #1a0e05;
            color: #fffbef;
            border: 1px solid #b98520;
            border-radius: 4px;
            outline: none;
            text-align: center;
        `;
        document.getElementById('game-shell').appendChild(el);

        // Position it over the Phaser canvas
        this.positionInput(el, x, y);
        this.scale.on('resize', () => this.positionInput(el, x, y));

        // Remove input when scene shuts down
        this.events.on('shutdown', () => el.remove());

        return el;
    }

    positionInput(el, x, y) {
        const canvas = this.sys.game.canvas;
        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width / this.scale.width;
        const scaleY = rect.height / this.scale.height;
        el.style.left = `${rect.left + (x - 120) * scaleX}px`;
        el.style.top = `${rect.top + (y - 18) * scaleY}px`;
        el.style.width = `${240 * scaleX}px`;
    }

    createButton(x, y, label, callback) {
        const btn = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 200, 40, 0xb98520, 1).setOrigin(0.5);
        bg.setStrokeStyle(2, 0xffffff, 0.6);
        const text = this.add.text(0, 0, label, {
            fontFamily: 'Georgia, serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#1d1608'
        }).setOrigin(0.5);
        btn.add([bg, text]);
        btn.setSize(200, 40);
        btn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 200, 40), Phaser.Geom.Rectangle.Contains);
        btn.on('pointerdown', callback);
        btn.on('pointerover', () => bg.setFillStyle(0xe7ca72));
        btn.on('pointerout', () => bg.setFillStyle(0xb98520));
        return btn;
    }
}