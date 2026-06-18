function toPersonalSnapshot(state, userId) {
    const myPlayer = state.players.find(player => player.userId === userId);
    const currentPlayer = state.players[state.currentPlayerIndex];
    const canAct = state.phase !== 'gameOver' && (
        state.phase === 'cambio'
            ? !!myPlayer && !myPlayer.cambioCard
            : currentPlayer?.userId === userId || state.pending?.userId === userId
    );

    return {
        roomCode: state.roomId,
        phase: state.phase,
        players: state.players.map(player => ({
            userId: player.userId,
            username: player.username,
            connected: player.connected,
            seat: player.seat,
            cardCount: player.hand.length,
            hand: state.phase === 'gameOver' ? player.hand : undefined,
            melds: player.melds ?? [],
            cambioReady: !!player.cambioCard
        })),
        myHand: myPlayer?.hand ?? [],
        deckCount: state.deck?.length ?? state.mainDeck?.length ?? 0,
        mainDeck: state.deck?.length ?? state.mainDeck?.length ?? 0,
        discardPile: state.discardPile ?? [],
        exposedCard: state.exposedCard ?? null,
        currentTurn: state.currentTurn,
        currentPlayerIndex: state.currentPlayerIndex,
        turnCanDraw: !!state.turnCanDraw,
        hasDrawnThisTurn: !!state.hasDrawnThisTurn,
        pending: state.pending
            ? {
                type: state.pending.type,
                userId: state.pending.userId,
                deadlineAt: state.pending.deadlineAt
            }
            : null,
        canAct,
        winnerUserId: state.winnerUserId,
        message: state.message,
        version: state.version
    };
}

function toRoomSnapshot(room) {
    return {
        hostId: room.hostId,
        maxPlayers: room.maxPlayers,
        minPlayers: room.minPlayers ?? 2,
        players: room.players,
        roomCode: room.roomCode,
        status: room.status
    };
}

module.exports = {
    toPersonalSnapshot,
    toRoomSnapshot
};
