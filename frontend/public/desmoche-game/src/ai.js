import { findMeldOptions, hasForcedClaim } from "./melds.js";

export function chooseBestMeldOption(options) {
    return options[0] ?? null;
}

export function shouldClaimCard(player, card) {
    const options = findMeldOptions(player, card);
    return options.length > 0;
}

export function chooseClaimOption(player, card) {
    const options = findMeldOptions(player, card);
    if (hasForcedClaim(options)) {
        return options.find(option => option.forced) ?? options[0];
    }
    return chooseBestMeldOption(options);
}

export function choosePayCard(player) {
    if (player.hand.length === 0) return null;
    return [...player.hand]
        .map(card => ({ card, score: cardUsefulness(player.hand, card) }))
        .sort((a, b) => a.score - b.score || a.card.value - b.card.value)[0].card;
}

export function chooseCambioCard(player) {
    return choosePayCard(player);
}

function cardUsefulness(hand, target) {
    let score = 0;
    for (const card of hand) {
        if (card.id === target.id) continue;
        if (card.rank === target.rank) score += 4;
        if (card.suit === target.suit && Math.abs(card.value - target.value) <= 2) score += 3;
        if (card.suit === target.suit && Math.abs(card.value - target.value) === 1) score += 3;
    }
    return score;
}
