const Room = require('../models/Room');
const GameState = require('../models/GameState');
const {
    createInitialState,
    drawCard,
    endTurn,
    markConnection,
    payCard,
    selectCambio,
    submitAction
} = require('../game/desmoche/state');
const { toPersonalSnapshot, toRoomSnapshot } = require('../game/desmoche/snapshots');

const roomQueues = new Map();

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`Player connected: ${socket.id}`);

        socket.on('joinRoom', async ({ roomCode, userId, username }) => {
            try {
                const room = await joinRoom({ socket, roomCode, userId, username });
                io.to(room.roomCode).emit('roomUpdated', toRoomSnapshot(room));

                await enqueueRoom(room.roomCode, async () => {
                    const state = await GameState.findOne({ roomId: room.roomCode });
                    if (state) {
                        markConnection(state, userId, true);
                        markGameModified(state);
                        await state.save();
                        await emitGameSnapshots(io, room.roomCode, state);
                        socket.emit('gameStarted', { roomCode: room.roomCode });
                    }
                });

                if (room.status === 'waiting' && room.players.length >= room.maxPlayers) {
                    await enqueueRoom(room.roomCode, async () => {
                        const freshRoom = await Room.findOne({ roomCode: room.roomCode });
                        if (freshRoom) await startGame(io, freshRoom, freshRoom.hostId);
                    });
                }
            } catch (err) {
                socket.emit('gameError', { message: err.message });
                socket.emit('error', { message: err.message });
            }
        });

        socket.on('room:startGame', async ({ roomCode, userId }) => {
            try {
                await enqueueRoom(roomCode, async () => {
                    const room = await Room.findOne({ roomCode });
                    if (!room) throw new Error('Sala no encontrada.');
                    await startGame(io, room, userId);
                });
            } catch (err) {
                socket.emit('gameError', { message: err.message });
            }
        });

        socket.on('game:getSnapshot', async ({ roomCode }) => {
            try {
                const state = await GameState.findOne({ roomId: roomCode });
                if (!state) return;
                await emitGameSnapshots(io, roomCode, state);
            } catch (err) {
                socket.emit('gameError', { message: err.message });
            }
        });

        socket.on('game:selectCambio', async ({ roomCode, userId, cardId }) => {
            await mutateGame(io, socket, roomCode, state => selectCambio(state, userId, cardId));
        });

        socket.on('game:draw', async ({ roomCode, userId }) => {
            await mutateGame(io, socket, roomCode, state => drawCard(state, userId));
        });

        socket.on('game:submitAction', async ({ roomCode, userId, action }) => {
            await mutateGame(io, socket, roomCode, state => submitAction(state, userId, action));
        });

        socket.on('game:pay', async ({ roomCode, userId, cardId }) => {
            await mutateGame(io, socket, roomCode, state => payCard(state, userId, cardId));
        });

        socket.on('game:endTurn', async ({ roomCode, userId }) => {
            await mutateGame(io, socket, roomCode, state => endTurn(state, userId));
        });

        socket.on('disconnect', async () => {
            const { roomCode, userId } = socket.data;
            if (!roomCode || !userId) return;

            try {
                const room = await Room.findOne({ roomCode });
                if (room) {
                    room.players = room.players.map(player =>
                        player.userId === userId
                            ? { ...player.toObject(), connected: false }
                            : player
                    );
                    await room.save();
                    io.to(roomCode).emit('roomUpdated', toRoomSnapshot(room));
                }

                await enqueueRoom(roomCode, async () => {
                    const state = await GameState.findOne({ roomId: roomCode });
                    if (state) {
                        markConnection(state, userId, false);
                        markGameModified(state);
                        await state.save();
                        await emitGameSnapshots(io, roomCode, state);
                    }
                });
            } catch (err) {
                console.error('Disconnect error:', err.message);
            }
        });
    });
};

async function joinRoom({ socket, roomCode, userId, username }) {
    if (!roomCode || !userId || !username) {
        throw new Error('Faltan datos para unirse a la sala.');
    }

    let room = await Room.findOne({ roomCode });
    if (!room) {
        room = new Room({
            roomCode,
            hostId: userId,
            game: 'Desmoche',
            players: [],
            status: 'waiting',
            minPlayers: 2,
            maxPlayers: 4
        });
    }

    if (room.status === 'finished') {
        throw new Error('Sala no existe o partida terminada.');
    }

    if (room.status === 'playing' && !room.players.some(player => player.userId === userId)) {
        throw new Error('La partida ya esta en curso.');
    }

    const alreadyIn = room.players.some(player => player.userId === userId);
    if (!alreadyIn) {
        if (room.players.length >= room.maxPlayers) {
            throw new Error('La sala esta llena.');
        }
        room.players.push({ userId, username, connected: true });
    } else {
        room.players = room.players.map(player =>
            player.userId === userId
                ? { ...player.toObject(), username, connected: true }
                : player
        );
    }

    await room.save();
    socket.join(room.roomCode);
    socket.data.roomCode = room.roomCode;
    socket.data.userId = userId;
    return room;
}

async function startGame(io, room, userId) {
    if (room.status === 'playing') {
        const state = await GameState.findOne({ roomId: room.roomCode });
        if (state) await emitGameSnapshots(io, room.roomCode, state);
        return;
    }
    if (room.hostId !== userId) {
        throw new Error('Solo el anfitrion puede iniciar la partida.');
    }
    if (room.players.length < (room.minPlayers ?? 2)) {
        throw new Error('Se necesitan al menos 2 jugadores.');
    }

    room.status = 'playing';
    await room.save();
    await GameState.findOneAndDelete({ roomId: room.roomCode });

    const state = new GameState(createInitialState(room));
    await state.save();

    io.to(room.roomCode).emit('roomUpdated', toRoomSnapshot(room));
    io.to(room.roomCode).emit('gameStarted', { roomCode: room.roomCode });
    await emitGameSnapshots(io, room.roomCode, state);
    console.log(`Game started in room ${room.roomCode}`);
}

async function mutateGame(io, socket, roomCode, mutator) {
    try {
        await enqueueRoom(roomCode, async () => {
            const state = await GameState.findOne({ roomId: roomCode });
            if (!state) throw new Error('No hay partida activa en esta sala.');
            mutator(state);
            markGameModified(state);
            await state.save();
            if (state.phase === 'gameOver') {
                await emitGameSnapshots(io, roomCode, state);
                await deleteRoomAfterGameOver(io, roomCode);
                return;
            }
            await emitGameSnapshots(io, roomCode, state);
        });
    } catch (err) {
        socket.emit('gameError', { message: err.message });
    }
}

async function deleteRoomAfterGameOver(io, roomCode) {
    await Room.findOneAndDelete({ roomCode });
    await GameState.findOneAndDelete({ roomId: roomCode });
    io.to(roomCode).emit('roomDeleted', {
        roomCode,
        message: 'La partida termino y la sala fue eliminada.'
    });

    const sockets = await io.in(roomCode).fetchSockets();
    sockets.forEach(target => {
        target.leave(roomCode);
        if (target.data.roomCode === roomCode) {
            target.data.roomCode = null;
        }
    });
}

function enqueueRoom(roomCode, task) {
    const previous = roomQueues.get(roomCode) ?? Promise.resolve();
    const next = previous
        .catch(() => undefined)
        .then(task)
        .finally(() => {
            if (roomQueues.get(roomCode) === next) {
                roomQueues.delete(roomCode);
            }
        });
    roomQueues.set(roomCode, next);
    return next;
}

function markGameModified(state) {
    [
        'players',
        'deck',
        'mainDeck',
        'discardPile',
        'cards',
        'exposedCard',
        'pending',
        'score'
    ].forEach(path => state.markModified(path));
}

async function emitGameSnapshots(io, roomCode, state) {
    const sockets = await io.in(roomCode).fetchSockets();
    await Promise.all(sockets.map(async target => {
        const userId = target.data.userId;
        if (!userId) return;
        target.emit('gameSnapshot', {
            gameState: toPersonalSnapshot(state, userId)
        });
    }));
}
