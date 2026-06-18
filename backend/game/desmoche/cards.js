const SUITS = [
    { key: 'S', symbol: '\u2660', name: 'picas', color: 'black' },
    { key: 'H', symbol: '\u2665', name: 'corazones', color: 'red' },
    { key: 'D', symbol: '\u2666', name: 'diamantes', color: 'red' },
    { key: 'C', symbol: '\u2663', name: 'treboles', color: 'black' }
];

const RANKS = [
    { key: 'A', value: 1, label: 'A', name: 'As' },
    { key: '2', value: 2, label: '2', name: '2' },
    { key: '3', value: 3, label: '3', name: '3' },
    { key: '4', value: 4, label: '4', name: '4' },
    { key: '5', value: 5, label: '5', name: '5' },
    { key: '6', value: 6, label: '6', name: '6' },
    { key: '7', value: 7, label: '7', name: '7' },
    { key: '8', value: 8, label: '8', name: '8' },
    { key: '9', value: 9, label: '9', name: '9' },
    { key: '10', value: 10, label: '10', name: '10' },
    { key: 'J', value: 11, label: 'J', name: 'J' },
    { key: 'Q', value: 12, label: 'Q', name: 'Q' },
    { key: 'K', value: 13, label: 'K', name: 'K' }
];

function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({
                id: `${rank.key}${suit.key}`,
                rank: rank.key,
                value: rank.value,
                label: rank.label,
                rankName: rank.name,
                suit: suit.key,
                suitSymbol: suit.symbol,
                suitName: suit.name,
                color: suit.color
            });
        }
    }
    return deck;
}

function shuffle(cards) {
    const copy = [...cards];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function sortCards(cards) {
    return [...cards].sort((a, b) => {
        if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
        return a.value - b.value;
    });
}

function sortMeld(cards) {
    if (cards.length === 0) return [];
    const sameRank = cards.every(card => card.rank === cards[0].rank);
    if (sameRank) {
        return [...cards].sort((a, b) => {
            const colorOrder = { black: 0, red: 1 };
            if (colorOrder[a.color] !== colorOrder[b.color]) {
                return colorOrder[a.color] - colorOrder[b.color];
            }
            return a.suit.localeCompare(b.suit);
        });
    }
    return [...cards].sort((a, b) => a.value - b.value);
}

function withoutCards(cards, cardsToRemove) {
    const removeIds = new Set(cardsToRemove.map(card => card.id));
    return cards.filter(card => !removeIds.has(card.id));
}

function sameCardSet(a, b) {
    if (a.length !== b.length) return false;
    const ids = new Set(a.map(card => card.id));
    return b.every(card => ids.has(card.id));
}

function takeCardsByIds(hand, cardIds) {
    const wanted = new Set(cardIds);
    const cards = hand.filter(card => wanted.has(card.id));
    if (cards.length !== wanted.size) {
        throw new Error('Una o mas cartas no estan en tu mano.');
    }
    return cards;
}

module.exports = {
    createDeck,
    sameCardSet,
    shuffle,
    sortCards,
    sortMeld,
    takeCardsByIds,
    withoutCards
};
