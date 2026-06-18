const {
    createDeck,
    shuffle,
    sortCards,
    sortMeld,
    takeCardsByIds,
    withoutCards
} = require('./cards');
const {
    findExtensionTargets,
    findMeldOptions,
    isValidMeld,
    isValidStrategyMeld,
    optionMatchesSelection,
    playedCount
} = require('./melds');

const CARDS_PER_PLAYER = 9;
const TURN_SECONDS = 25;
const CAMBIO_SECONDS = 30;

function createInitialState(room) {
    const players = room.players.filter(player => player.connected !== false);
    if (players.length < 2) {
        throw new Error('Se necesitan al menos 2 jugadores para iniciar.');
    }
    if (players.length > 4) {
        throw new Error('Desmoche permite maximo 4 jugadores.');
    }

    const deck = shuffle(createDeck());
    const gamePlayers = players.map((player, seat) => ({
        userId: player.userId,
        username: player.username,
        connected: player.connected,
        seat,
        hand: [],
        melds: [],
        cambioCard: null
    }));

    for (let round = 0; round < CARDS_PER_PLAYER; round += 1) {
        for (const player of gamePlayers) {
            player.hand.push(deck.pop());
        }
    }

    gamePlayers.forEach(player => {
        player.hand = sortCards(player.hand);
    });

    const startingPlayerIndex = Math.floor(Math.random() * gamePlayers.length);

    return {
        roomId: room.roomCode,
        players: gamePlayers,
        deck,
        mainDeck: deck,
        discardPile: [],
        cards: [],
        exposedCard: null,
        exposedOriginIndex: null,
        claimPasses: 0,
        currentPlayerIndex: startingPlayerIndex,
        currentTurn: gamePlayers[startingPlayerIndex].userId,
        phase: 'cambio',
        turnCanDraw: false,
        hasDrawnThisTurn: false,
        timer: CAMBIO_SECONDS,
        pending: {
            type: 'cambio',
            deadlineAt: deadline(CAMBIO_SECONDS)
        },
        score: Object.fromEntries(gamePlayers.map(player => [player.userId, 0])),
        winnerUserId: null,
        message: 'Selecciona una carta para el cambio.',
        version: 1,
        updatedAt: new Date()
    };
}

function selectCambio(state, userId, cardId) {
    requirePhase(state, 'cambio');
    const player = getPlayer(state, userId);
    const card = player.hand.find(item => item.id === cardId);
    if (!card) throw new Error('La carta de cambio no esta en tu mano.');
    player.cambioCard = card;
    state.message = `${player.username} eligio carta de cambio.`;

    if (state.players.every(item => item.cambioCard)) {
        const outgoing = state.players.map(item => item.cambioCard);
        state.players.forEach((item, index) => {
            item.hand = withoutCards(item.hand, [outgoing[index]]);
        });
        state.players.forEach((item, index) => {
            const receiver = state.players[rightOf(index, state.players.length)];
            receiver.hand = sortCards([...receiver.hand, outgoing[index]]);
            item.cambioCard = null;
        });
        state.phase = 'turn';
        state.turnCanDraw = true;
        state.hasDrawnThisTurn = false;
        state.pending = {
            type: 'turn',
            userId: currentPlayer(state).userId,
            deadlineAt: deadline(TURN_SECONDS)
        };
        state.timer = TURN_SECONDS;
        state.message = `${currentPlayer(state).username} empieza la mano.`;
    }

    touch(state);
}

function drawCard(state, userId) {
    requirePhase(state, 'turn');
    requireCurrentPlayer(state, userId);
    if (!state.turnCanDraw || state.hasDrawnThisTurn) {
        throw new Error('No puedes robar en este momento.');
    }
    if (state.deck.length === 0) {
        endGame(state, null, 'El mazo se agoto.');
        return;
    }

    if (state.exposedCard && state.discardPile[0]?.id !== state.exposedCard.id) {
        state.discardPile.unshift(state.exposedCard);
    }
    const card = state.deck.pop();
    state.mainDeck = state.deck;
    state.exposedCard = card;
    state.exposedOriginIndex = state.currentPlayerIndex;
    state.claimPasses = 0;
    state.turnCanDraw = false;
    state.hasDrawnThisTurn = true;
    state.message = `${currentPlayer(state).username} saco una carta.`;
    touch(state);
}

function submitAction(state, userId, action) {
    requirePhase(state, 'turn');
    requireCurrentPlayer(state, userId);
    const player = currentPlayer(state);

    if (action.type === 'desmochar') {
        submitDesmochar(state, player, action);
    } else if (action.type === 'bajarse') {
        submitBajarse(state, player, action);
    } else if (action.type === 'trasmochar') {
        submitTrasmochar(state, player, action);
    } else if (action.type === 'agregar') {
        submitAgregar(state, player, action);
    } else {
        throw new Error('Accion no soportada.');
    }

    if (playedCount(player) === 10) {
        endGame(state, player.userId, `${player.username} llego a 10 cartas jugadas.`);
        return;
    }

    touch(state);
}

function payCard(state, userId, cardId) {
    requirePhase(state, 'pay');
    const player = getPlayer(state, userId);
    if (state.pending?.userId !== userId) {
        throw new Error('No te toca pagar.');
    }
    const [card] = takeCardsByIds(player.hand, [cardId]);
    player.hand = withoutCards(player.hand, [card]);
    state.discardPile.unshift(card);
    state.cards.push({ ...card, playedBy: userId });
    state.exposedCard = card;
    state.exposedOriginIndex = state.players.findIndex(item => item.userId === userId);
    state.claimPasses = 0;
    state.currentPlayerIndex = rightOf(state.exposedOriginIndex, state.players.length);
    state.currentTurn = currentPlayer(state).userId;
    state.phase = 'turn';
    state.turnCanDraw = true;
    state.hasDrawnThisTurn = false;
    state.pending = {
        type: 'respondOrDraw',
        userId: state.currentTurn,
        deadlineAt: deadline(TURN_SECONDS)
    };
    state.message = `${player.username} pago una carta.`;
    touch(state);
}

function endTurn(state, userId) {
    requirePhase(state, 'turn');
    requireCurrentPlayer(state, userId);
    if (!state.hasDrawnThisTurn) {
        throw new Error('Debes sacar una carta antes de terminar.');
    }

    if (state.exposedCard && state.exposedOriginIndex !== null && state.exposedOriginIndex !== undefined) {
        const isOriginEnding = state.currentPlayerIndex === state.exposedOriginIndex;
        if (!isOriginEnding) {
            state.claimPasses = (state.claimPasses ?? 0) + 1;
        }
        const requiredPasses = state.players.length - 1;
        if (state.claimPasses >= requiredPasses) {
            if (state.discardPile[0]?.id !== state.exposedCard.id) {
                state.discardPile.unshift(state.exposedCard);
            }
            state.exposedCard = null;
            state.exposedOriginIndex = null;
            state.claimPasses = 0;
            state.currentPlayerIndex = rightOf(state.currentPlayerIndex, state.players.length);
            state.turnCanDraw = true;
        } else {
            state.currentPlayerIndex = rightOf(state.currentPlayerIndex, state.players.length);
            state.turnCanDraw = true;
        }
    } else {
        state.currentPlayerIndex = rightOf(state.currentPlayerIndex, state.players.length);
        state.turnCanDraw = true;
    }

    if (state.deck.length === 0) {
        endGame(state, null, 'El mazo se agoto.');
        return;
    }

    state.currentTurn = currentPlayer(state).userId;
    state.hasDrawnThisTurn = false;
    state.phase = 'turn';
    state.pending = {
        type: state.exposedCard ? 'respondOrDraw' : 'turn',
        userId: state.currentTurn,
        deadlineAt: deadline(TURN_SECONDS)
    };
    state.message = `Turno de ${currentPlayer(state).username}.`;
    touch(state);
}

function markConnection(state, userId, connected) {
    const player = state.players?.find(item => item.userId === userId);
    if (player) {
        player.connected = connected;
        touch(state);
    }
}

function submitDesmochar(state, player, action) {
    if (!state.exposedCard) throw new Error('No hay carta para desmochar.');
    const handCards = takeCardsByIds(player.hand, action.cardIds ?? []);
    const selectedMeldEntries = hydrateMeldEntries(player, action.meldCards ?? []);
    const options = findMeldOptions(player, state.exposedCard);
    const option = options.find(item => optionMatchesSelection(item, handCards, selectedMeldEntries));
    if (!option) throw new Error('La jugada de desmoche no es valida.');

    removeExposedFromDiscard(state, state.exposedCard);
    applyMeld(player, state.exposedCard, option);
    state.exposedCard = null;
    state.exposedOriginIndex = null;
    state.claimPasses = 0;
    state.phase = 'pay';
    state.pending = {
        type: 'pay',
        userId: player.userId,
        deadlineAt: deadline(TURN_SECONDS)
    };
    state.message = `${player.username} desmocho.`;
}

function submitBajarse(state, player, action) {
    const cards = takeCardsByIds(player.hand, action.cardIds ?? []);
    if (!isValidMeld(cards)) throw new Error('La jugada para bajarse no es valida.');
    if (playedCount(player) + cards.length > 10) throw new Error('Esa jugada pasa de 10 cartas jugadas.');
    player.hand = withoutCards(player.hand, cards);
    player.melds.push({ cards: sortMeld(cards) });
    state.message = `${player.username} se bajo.`;
}

function submitTrasmochar(state, player, action) {
    const handCards = takeCardsByIds(player.hand, action.cardIds ?? []);
    const meldEntries = hydrateMeldEntries(player, action.meldCards ?? []);
    const staged = [
        ...handCards.map(card => ({ card, source: 'hand' })),
        ...meldEntries
    ];
    if (staged.length < 3 || !isValidStrategyMeld(staged)) {
        throw new Error('La jugada para trasmochar no es valida.');
    }
    if (playedCount(player) + handCards.length > 10) {
        throw new Error('Esa jugada pasa de 10 cartas jugadas.');
    }
    player.hand = withoutCards(player.hand, handCards);
    for (const entry of meldEntries) {
        const meld = player.melds[entry.meldIndex];
        meld.cards = sortMeld(withoutCards(meld.cards, [entry.card]));
    }
    player.melds.push({ cards: sortMeld(staged.map(entry => entry.card)) });
    state.message = `${player.username} trasmocho.`;
}

function submitAgregar(state, player, action) {
    const [card] = takeCardsByIds(player.hand, action.cardIds ?? []);
    const target = findExtensionTargets(player, card)
        .find(option => option.meldIndex === action.meldIndex);
    if (!target) throw new Error('Esa carta no se puede agregar a esa jugada.');
    if (playedCount(player) + 1 > 10) throw new Error('Esa jugada pasa de 10 cartas jugadas.');
    player.hand = withoutCards(player.hand, [card]);
    player.melds[action.meldIndex].cards = sortMeld(target.resultCards);
    state.message = `${player.username} agrego una carta.`;
}

function applyMeld(player, candidate, option) {
    player.hand = withoutCards(player.hand, option.cardsFromHand);
    if (option.borrowedCards?.length) {
        for (const borrowed of option.borrowedCards) {
            const meld = player.melds[borrowed.meldIndex];
            meld.cards = sortMeld(withoutCards(meld.cards, [borrowed.card]));
        }
    }
    if (option.type === 'extend') {
        const meld = player.melds[option.meldIndex];
        meld.cards = sortMeld([...meld.cards, candidate]);
        return;
    }
    player.melds.push({ cards: sortMeld(option.resultCards) });
}

function hydrateMeldEntries(player, entries) {
    return entries.map(entry => {
        const meld = player.melds[entry.meldIndex];
        if (!meld) throw new Error('La jugada indicada no existe.');
        const card = meld.cards.find(item => item.id === entry.cardId);
        if (!card) throw new Error('La carta indicada no esta en esa jugada.');
        return {
            card,
            source: 'meld',
            meldIndex: entry.meldIndex,
            sourceMeld: meld
        };
    });
}

function removeExposedFromDiscard(state, card) {
    if (state.discardPile[0]?.id === card.id) {
        state.discardPile.shift();
    }
}

function endGame(state, winnerUserId, message) {
    state.phase = 'gameOver';
    state.winnerUserId = winnerUserId;
    state.currentTurn = winnerUserId;
    state.pending = null;
    state.turnCanDraw = false;
    state.hasDrawnThisTurn = false;
    state.message = winnerUserId ? message : `Empate. ${message}`;
    touch(state);
}

function getPlayer(state, userId) {
    const player = state.players.find(item => item.userId === userId);
    if (!player) throw new Error('Jugador no encontrado en la partida.');
    return player;
}

function currentPlayer(state) {
    return state.players[state.currentPlayerIndex];
}

function requireCurrentPlayer(state, userId) {
    if (currentPlayer(state)?.userId !== userId) {
        throw new Error('No es tu turno.');
    }
}

function requirePhase(state, phase) {
    if (state.phase !== phase) {
        throw new Error('La partida no esta en la fase correcta.');
    }
}

function rightOf(index, playerCount) {
    return (index + 1) % playerCount;
}

function deadline(seconds) {
    return new Date(Date.now() + seconds * 1000);
}

function touch(state) {
    state.mainDeck = state.deck;
    state.version = (state.version ?? 0) + 1;
    state.updatedAt = new Date();
}

module.exports = {
    createInitialState,
    drawCard,
    endTurn,
    markConnection,
    payCard,
    selectCambio,
    submitAction
};
