const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find({}, { passwordHash: 0 }); // never send passwords
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single user by username
router.get('/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }, { passwordHash: 0 });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create new user
router.post('/', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json({ message: 'User created', username: user.username });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;