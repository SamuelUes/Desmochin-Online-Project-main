import { RANKS, SUITS } from "./constants.js";

export function createDeck() {
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

export function shuffle(cards) {
    const copy = [...cards];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export function cardLabel(card) {
    return `${card.label}${card.suitSymbol}`;
}

export function cardName(card) {
    return `${card.rankName} de ${card.suitName}`;
}

export function sortCards(cards) {
    return [...cards].sort((a, b) => {
        if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
        return a.value - b.value;
    });
}

export function sortMeld(cards) {
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

export function withoutCards(cards, cardsToRemove) {
    const removeIds = new Set(cardsToRemove.map(card => card.id));
    return cards.filter(card => !removeIds.has(card.id));
}

export function sameCardSet(a, b) {
    if (a.length !== b.length) return false;
    const ids = new Set(a.map(card => card.id));
    return b.every(card => ids.has(card.id));
}
