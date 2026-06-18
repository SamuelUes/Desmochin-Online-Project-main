const mongoose = require('mongoose');

const gameStateSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    players: [{
        userId: String,
        username: String,
        connected: { type: Boolean, default: false },
        seat: Number,
        deck: { type: Array, default: [] },
        hand: { type: Array, default: [] },
        melds: { type: Array, default: [] },
        cambioCard: { type: Object, default: null }
    }],
    deck: { type: Array, default: [] },
    mainDeck: { type: Array, default: [] },
    discardPile: { type: Array, default: [] },
    exposedCard: { type: Object, default: null },
    exposedOriginIndex: { type: Number, default: null },
    claimPasses: { type: Number, default: 0 },
    currentPlayerIndex: { type: Number, default: 0 },
    currentTurn: { type: String, default: null },
    cards: { type: Array, default: [] },
    score: { type: Object, default: {} },
    timer: { type: Number, default: 30 },
    phase: { type: String, default: 'waiting' },
    turnCanDraw: { type: Boolean, default: false },
    hasDrawnThisTurn: { type: Boolean, default: false },
    pending: { type: Object, default: null },
    winnerUserId: { type: String, default: null },
    message: { type: String, default: '' },
    version: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
}, { collection: 'gameStates', versionKey: false });

module.exports = mongoose.model('GameState', gameStateSchema);
