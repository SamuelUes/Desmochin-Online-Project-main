const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash: { 
        type: String, 
        required: true,
        select: false
    },
    avatar: { type: String, default: 'avatar_default.png' },
    coins: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    inventory: { type: Array, default: [] },
    stats: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        matchesPlayed: { type: Number, default: 0 }
    },
    lastLogin: { type: Date, default: null }
}, { 
    collection: 'users',
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);