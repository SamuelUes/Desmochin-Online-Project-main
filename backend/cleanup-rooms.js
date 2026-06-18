const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:5001/pharonsdb';

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

const Room = mongoose.model('Room', roomSchema);

async function cleanupRooms() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Conectado a MongoDB');

        const roomsToCleanup = [
            'DES-PCG1S',
            'DES-8SIIU',
        ];

        const result = await Room.updateMany(
            { roomCode: { $in: roomsToCleanup } },
            { $set: { status: 'finished' } }
        );

        console.log(`✓ Salas actualizadas: ${result.modifiedCount}`);
        console.log(`  - Salas marcadas como finalizadas: ${roomsToCleanup.join(', ')}`);

        await mongoose.connection.close();
        console.log('✓ Conexión cerrada');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

cleanupRooms();
