const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomCode: { type: String, required: true, unique: true },
    game: { type: String, default: 'Desmoche' },
    hostId: { type: String, required: true },
    players: [{
        userId: String,
        username: String,
        connected: { type: Boolean, default: false }
    }],
    status: { type: String, default: 'waiting' },
    minPlayers: { type: Number, default: 2 },
    maxPlayers: { type: Number, default: 4 },
    createdAt: { type: Date, default: Date.now }
}, { collection: 'rooms' });

module.exports = mongoose.model('Room', roomSchema);
