const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const GameState = require('../models/GameState');

// GET all rooms
router.get('/', async (req, res) => {
    try {
        await cleanupInactiveRooms();
        res.set('Cache-Control', 'no-store');
        const rooms = await Room.find({ status: { $ne: 'finished' } }).sort({ createdAt: -1 });
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single room by roomCode
router.get('/:roomCode', async (req, res) => {
    try {
        const room = await Room.findOne({ roomCode: req.params.roomCode });
        if (!room) return res.status(404).json({ error: 'Room not found' });
        if (room.status === 'finished') {
            return res.status(404).json({ error: 'Sala no existe o partida terminada.' });
        }
        res.json(room);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create a new room
router.post('/', async (req, res) => {
    try {
        const maxPlayers = Number(req.body.maxPlayers ?? 4);
        if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 4) {
            return res.status(400).json({ error: 'maxPlayers debe estar entre 2 y 4.' });
        }
        if (!req.body.hostId) {
            return res.status(400).json({ error: 'hostId es requerido.' });
        }

        const requestedPlayers = Array.isArray(req.body.players) ? req.body.players : [];
        const hostPlayer = requestedPlayers.find(player => player.userId === req.body.hostId) ?? {
            userId: req.body.hostId,
            username: req.body.hostUsername ?? req.body.username ?? 'Anfitrion'
        };
        const players = [
            {
                userId: hostPlayer.userId,
                username: hostPlayer.username,
                connected: true
            }
        ];

        const room = new Room({
            ...req.body,
            minPlayers: 2,
            maxPlayers,
            players,
            status: 'waiting'
        });
        await room.save();
        res.status(201).json({ message: 'Room created', roomCode: room.roomCode });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PATCH update room status or players
router.patch('/:roomCode', async (req, res) => {
    try {
        const room = await Room.findOneAndUpdate(
            { roomCode: req.params.roomCode },
            { $set: req.body },
            { new: true }
        );
        if (!room) return res.status(404).json({ error: 'Room not found' });
        res.json(room);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE a room
router.delete('/:roomCode', async (req, res) => {
    try {
        await Room.findOneAndDelete({ roomCode: req.params.roomCode });
        res.json({ message: 'Room deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

async function cleanupInactiveRooms() {
    const staleWaitingCutoff = new Date(Date.now() - 10 * 60 * 1000);
    const staleRooms = await Room.find({
        $or: [
            { status: 'finished' },
            {
                status: 'waiting',
                createdAt: { $lt: staleWaitingCutoff },
                $or: [
                    { players: { $size: 0 } },
                    { 'players.connected': { $ne: true } }
                ]
            }
        ]
    }).select('roomCode');
    const roomCodes = staleRooms.map(room => room.roomCode);
    if (roomCodes.length === 0) return;
    await Room.collection.deleteMany({ roomCode: { $in: roomCodes } });
    await GameState.collection.deleteMany({ roomId: { $in: roomCodes } });
}
