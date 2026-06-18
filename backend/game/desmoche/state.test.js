const assert = require('node:assert/strict');
const test = require('node:test');

const {
    createInitialState,
    drawCard,
    endTurn,
    payCard,
    selectCambio,
    submitAction
} = require('./state');

function room(playerCount = 2) {
    return {
        roomCode: 'TEST',
        players: Array.from({ length: playerCount }, (_, index) => ({
            userId: `u${index + 1}`,
            username: `Jugador ${index + 1}`,
            connected: true
        }))
    };
}

test('creates a Desmoche state for 2 to 4 players', () => {
    for (const count of [2, 3, 4]) {
        const state = createInitialState(room(count));
        assert.equal(state.players.length, count);
        assert.equal(state.phase, 'cambio');
        assert.equal(state.deck.length, 52 - count * 9);
        state.players.forEach(player => {
            assert.equal(player.hand.length, 9);
            assert.deepEqual(player.melds, []);
        });
    }
});

test('rejects games with fewer than 2 players', () => {
    assert.throws(() => createInitialState(room(1)), /al menos 2/);
});

test('resolves cambio after every player selects a card', () => {
    const state = createInitialState(room(2));
    const firstCard = state.players[0].hand[0];
    const secondCard = state.players[1].hand[0];

    selectCambio(state, 'u1', firstCard.id);
    assert.equal(state.phase, 'cambio');

    selectCambio(state, 'u2', secondCard.id);
    assert.equal(state.phase, 'turn');
    assert.equal(state.players[1].hand.some(card => card.id === firstCard.id), true);
    assert.equal(state.players[0].hand.some(card => card.id === secondCard.id), true);
});

test('only the current player can draw', () => {
    const state = createInitialState(room(2));
    state.phase = 'turn';
    state.turnCanDraw = true;
    state.currentPlayerIndex = 0;
    state.currentTurn = 'u1';

    assert.throws(() => drawCard(state, 'u2'), /No es tu turno/);
    drawCard(state, 'u1');

    assert.equal(state.exposedCard !== null, true);
    assert.equal(state.hasDrawnThisTurn, true);
    assert.equal(state.turnCanDraw, false);
});

test('endTurn advances the turn and keeps a drawn exposed card for the rival', () => {
    const state = createInitialState(room(2));
    state.phase = 'turn';
    state.turnCanDraw = true;
    state.currentPlayerIndex = 0;
    state.currentTurn = 'u1';

    drawCard(state, 'u1');
    const exposedId = state.exposedCard.id;
    endTurn(state, 'u1');

    assert.equal(state.currentTurn, 'u2');
    assert.equal(state.exposedCard.id, exposedId);
    assert.equal(state.discardPile.length, 0);
    assert.equal(state.turnCanDraw, true);
});

test('endTurn is rejected before drawing a card', () => {
    const state = createInitialState(room(2));
    state.phase = 'turn';
    state.turnCanDraw = true;
    state.currentPlayerIndex = 0;
    state.currentTurn = 'u1';

    assert.throws(() => endTurn(state, 'u1'), /Debes sacar/);
});

test('paying a card exposes it and lets the rival desmochar or draw', () => {
    const state = createInitialState(room(2));
    state.phase = 'pay';
    state.currentPlayerIndex = 0;
    state.currentTurn = 'u1';
    state.pending = { type: 'pay', userId: 'u1' };
    const payCardId = state.players[0].hand[0].id;

    payCard(state, 'u1', payCardId);

    assert.equal(state.currentTurn, 'u2');
    assert.equal(state.exposedCard.id, payCardId);
    assert.equal(state.turnCanDraw, true);
    assert.equal(state.pending.type, 'respondOrDraw');
});

test('a rival can draw instead of using the exposed card', () => {
    const state = createInitialState(room(2));
    state.phase = 'turn';
    state.turnCanDraw = true;
    state.currentPlayerIndex = 0;
    state.currentTurn = 'u1';

    drawCard(state, 'u1');
    const firstExposedId = state.exposedCard.id;
    endTurn(state, 'u1');
    drawCard(state, 'u2');

    assert.equal(state.discardPile[0].id, firstExposedId);
    assert.equal(state.currentTurn, 'u2');
    assert.equal(state.hasDrawnThisTurn, true);
    assert.equal(state.turnCanDraw, false);
});

test('single-card playMatch is no longer a supported action', () => {
    const state = createInitialState(room(2));
    state.phase = 'turn';
    state.turnCanDraw = true;
    state.currentPlayerIndex = 0;
    state.currentTurn = 'u1';

    assert.throws(() => submitAction(state, 'u1', {
        type: 'playMatch',
        cardIds: [state.players[0].hand[0].id]
    }), /Accion no soportada/);
});
