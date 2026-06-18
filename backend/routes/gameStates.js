const express = require('express');
const router = express.Router();
const GameState = require('../models/GameState');

// GET game state by roomId
router.get('/:roomId', async (req, res) => {
    try {
        const state = await GameState.findOne({ roomId: req.params.roomId });
        if (!state) return res.status(404).json({ error: 'Game state not found' });
        res.json(state);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create a new game state
router.post('/', async (req, res) => {
    try {
        const state = new GameState(req.body);
        await state.save();
        res.status(201).json({ message: 'Game state created', roomId: state.roomId });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PATCH update game state (used during active gameplay)
router.patch('/:roomId', async (req, res) => {
    try {
        const state = await GameState.findOneAndUpdate(
            { roomId: req.params.roomId },
            { $set: { ...req.body, updatedAt: new Date() } },
            { new: true }
        );
        if (!state) return res.status(404).json({ error: 'Game state not found' });
        res.json(state);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE game state when match ends
router.delete('/:roomId', async (req, res) => {
    try {
        await GameState.findOneAndDelete({ roomId: req.params.roomId });
        res.json({ message: 'Game state deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;