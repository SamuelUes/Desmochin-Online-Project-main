const { sameCardSet, sortMeld } = require('./cards');

function playedCount(player) {
    return (player.melds ?? []).reduce((total, meld) => total + meld.cards.length, 0);
}

function isValidSet(cards) {
    if (cards.length < 3 || cards.length > 4) return false;
    if (!cards.every(card => card.rank === cards[0].rank)) return false;
    return new Set(cards.map(card => card.suit)).size === cards.length;
}

function isValidRun(cards) {
    if (cards.length < 3 || cards.length > 10) return false;
    if (!cards.every(card => card.suit === cards[0].suit)) return false;
    const values = [...new Set(cards.map(card => card.value))].sort((a, b) => a - b);
    if (values.length !== cards.length) return false;
    for (let i = 1; i < values.length; i += 1) {
        if (values[i] !== values[i - 1] + 1) return false;
    }
    return true;
}

function isValidMeld(cards) {
    return isValidSet(cards) || isValidRun(cards);
}

function optionMatchesSelection(option, selectedCards, selectedMeldEntries = []) {
    if (!sameCardSet(option.cardsFromHand, selectedCards)) return false;
    const borrowed = option.borrowedCards ?? [];
    if (borrowed.length !== selectedMeldEntries.length) return false;
    return borrowed.every(borrowedEntry =>
        selectedMeldEntries.some(entry =>
            entry.card.id === borrowedEntry.card.id && entry.meldIndex === borrowedEntry.meldIndex
        )
    );
}

function findMeldOptions(player, candidate) {
    const options = [];
    addExtensionOptions(options, player, candidate);
    addSetOptions(options, player, candidate);
    addRunOptions(options, player, candidate);
    addTrasmocharOptions(options, player, candidate);
    return filterAndSortOptions(player, dedupeOptions(options));
}

function findHandMeldOptions(player) {
    const options = [];
    for (const group of cardCombinations(player.hand, 3, Math.min(6, player.hand.length))) {
        if (!isValidMeld(group)) continue;
        const resultCards = sortMeld(group);
        options.push({
            type: 'bajarse',
            cardsFromHand: resultCards,
            resultCards,
            score: 40 + resultCards.length
        });
    }
    return dedupeOptions(options).sort((a, b) => b.score - a.score);
}

function findExtensionTargets(player, card) {
    return (player.melds ?? [])
        .map((meld, meldIndex) => {
            const resultCards = sortMeld([...meld.cards, card]);
            if (!isValidMeld(resultCards)) return null;
            return {
                type: 'addCard',
                meldIndex,
                cardsFromHand: [card],
                resultCards,
                score: 70 + resultCards.length
            };
        })
        .filter(Boolean);
}

function canRemoveFromMeld(meld, cardsToRemove) {
    const removeIds = new Set(cardsToRemove.map(card => card.id));
    const remaining = meld.cards.filter(card => !removeIds.has(card.id));
    return remaining.length >= 3 && isValidMeld(remaining);
}

function isValidStrategyMeld(stagedCards) {
    const cards = stagedCards.map(entry => entry.card ?? entry);
    if (!isValidMeld(cards)) return false;
    const byMeld = borrowedByMeld(stagedCards);
    for (const [meldIndex, cardsFromMeld] of byMeld) {
        const sourceMeld = stagedCards.find(entry => entry.meldIndex === meldIndex)?.sourceMeld;
        if (!sourceMeld || !canRemoveFromMeld(sourceMeld, cardsFromMeld)) return false;
    }
    return true;
}

function addExtensionOptions(options, player, candidate) {
    (player.melds ?? []).forEach((meld, meldIndex) => {
        const resultCards = sortMeld([...meld.cards, candidate]);
        if (!isValidMeld(resultCards)) return;
        options.push({
            type: 'extend',
            meldIndex,
            cardsFromHand: [],
            resultCards,
            forced: true,
            score: 80 + resultCards.length
        });
    });
}

function addSetOptions(options, player, candidate) {
    const matching = player.hand.filter(card => card.rank === candidate.rank);
    if (matching.length < 2) return;
    for (let size = 2; size <= Math.min(3, matching.length); size += 1) {
        const handCards = matching.slice(0, size);
        const resultCards = sortMeld([candidate, ...handCards]);
        if (!isValidSet(resultCards)) continue;
        options.push({
            type: 'new',
            meldKind: 'set',
            cardsFromHand: handCards,
            resultCards,
            score: 50 + resultCards.length
        });
    }
}

function addRunOptions(options, player, candidate) {
    const byValue = new Map();
    for (const card of player.hand) {
        if (card.suit !== candidate.suit) continue;
        byValue.set(card.value, card);
    }
    for (let start = 1; start <= 11; start += 1) {
        for (let end = start + 2; end <= Math.min(13, start + 9); end += 1) {
            if (candidate.value < start || candidate.value > end) continue;
            const handCards = [];
            let complete = true;
            for (let value = start; value <= end; value += 1) {
                if (value === candidate.value) continue;
                const card = byValue.get(value);
                if (!card) {
                    complete = false;
                    break;
                }
                handCards.push(card);
            }
            if (!complete) continue;
            const resultCards = sortMeld([candidate, ...handCards]);
            if (!isValidRun(resultCards)) continue;
            options.push({
                type: 'new',
                meldKind: 'run',
                cardsFromHand: handCards,
                resultCards,
                score: 60 + resultCards.length * 2
            });
        }
    }
}

function addTrasmocharOptions(options, player, candidate) {
    const borrowable = [];
    (player.melds ?? []).forEach((meld, meldIndex) => {
        meld.cards.forEach(card => {
            if (!canRemoveFromMeld(meld, [card])) return;
            borrowable.push({ card, meldIndex });
        });
    });
    if (borrowable.length === 0) return;
    const pool = [
        ...player.hand.map(card => ({ card, source: 'hand' })),
        ...borrowable.map(entry => ({ ...entry, source: 'meld' }))
    ];
    for (const group of entryCombinations(pool, 2, Math.min(5, pool.length))) {
        if (!group.some(entry => entry.source === 'meld')) continue;
        const cards = [candidate, ...group.map(entry => entry.card)];
        if (!isValidMeld(cards)) continue;
        if (!borrowedGroupsRemainValid(player, group)) continue;
        const handCards = group.filter(entry => entry.source === 'hand').map(entry => entry.card);
        const borrowedCards = group.filter(entry => entry.source === 'meld').map(entry => ({
            card: entry.card,
            meldIndex: entry.meldIndex
        }));
        const resultCards = sortMeld(cards);
        options.push({
            type: 'trasmochar',
            cardsFromHand: handCards,
            borrowedCards,
            resultCards,
            score: 75 + resultCards.length * 2
        });
    }
}

function filterAndSortOptions(player, options) {
    return options
        .filter(option => {
            const newPlayedCards = option.type === 'extend' ? 1 : option.cardsFromHand.length + 1;
            const projectedPlayed = playedCount(player) + newPlayedCards;
            const remainingHand = player.hand.length - option.cardsFromHand.length;
            if (projectedPlayed > 10) return false;
            return projectedPlayed === 10 || remainingHand > 0;
        })
        .sort((a, b) => b.score - a.score);
}

function dedupeOptions(options) {
    const seen = new Set();
    const unique = [];
    for (const option of options) {
        const ids = option.cardsFromHand.map(card => card.id).sort().join('-');
        const borrowed = (option.borrowedCards ?? []).map(entry => `${entry.card.id}@${entry.meldIndex}`).sort().join('-');
        const result = (option.resultCards ?? []).map(card => card.id).sort().join('-');
        const key = `${option.type}-${option.meldIndex ?? 'new'}-${ids}-${borrowed}-${result}`;
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(option);
    }
    return unique;
}

function cardCombinations(cards, minSize, maxSize) {
    return entryCombinations(cards.map(card => ({ card })), minSize, maxSize)
        .map(group => group.map(entry => entry.card));
}

function entryCombinations(entries, minSize, maxSize) {
    const result = [];
    const walk = (start, group) => {
        if (group.length >= minSize) result.push([...group]);
        if (group.length === maxSize) return;
        for (let i = start; i < entries.length; i += 1) {
            group.push(entries[i]);
            walk(i + 1, group);
            group.pop();
        }
    };
    walk(0, []);
    return result;
}

function borrowedByMeld(stagedCards) {
    const byMeld = new Map();
    stagedCards
        .filter(entry => entry.source === 'meld')
        .forEach(entry => {
            const current = byMeld.get(entry.meldIndex) ?? [];
            current.push(entry.card);
            byMeld.set(entry.meldIndex, current);
        });
    return byMeld;
}

function borrowedGroupsRemainValid(player, entries) {
    const byMeld = new Map();
    entries
        .filter(entry => entry.source === 'meld')
        .forEach(entry => {
            const current = byMeld.get(entry.meldIndex) ?? [];
            current.push(entry.card);
            byMeld.set(entry.meldIndex, current);
        });
    for (const [meldIndex, cards] of byMeld) {
        if (!canRemoveFromMeld(player.melds[meldIndex], cards)) return false;
    }
    return true;
}

module.exports = {
    findExtensionTargets,
    findHandMeldOptions,
    findMeldOptions,
    isValidMeld,
    isValidStrategyMeld,
    optionMatchesSelection,
    playedCount
};
