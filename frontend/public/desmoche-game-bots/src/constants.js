export const SUITS = [
    { key: "S", symbol: "♠", name: "picas", color: "black" },
    { key: "H", symbol: "♥", name: "corazones", color: "red" },
    { key: "D", symbol: "♦", name: "diamantes", color: "red" },
    { key: "C", symbol: "♣", name: "tréboles", color: "black" }
];

export const RANKS = [
    { key: "A", value: 1, label: "A", name: "As" },
    { key: "2", value: 2, label: "2", name: "2" },
    { key: "3", value: 3, label: "3", name: "3" },
    { key: "4", value: 4, label: "4", name: "4" },
    { key: "5", value: 5, label: "5", name: "5" },
    { key: "6", value: 6, label: "6", name: "6" },
    { key: "7", value: 7, label: "7", name: "7" },
    { key: "8", value: 8, label: "8", name: "8" },
    { key: "9", value: 9, label: "9", name: "9" },
    { key: "10", value: 10, label: "10", name: "10" },
    { key: "J", value: 11, label: "J", name: "J" },
    { key: "Q", value: 12, label: "Q", name: "Q" },
    { key: "K", value: 13, label: "K", name: "K" }
];

export const PLAYER_NAMES = ["Tú", "Bot Derecha", "Bot Arriba", "Bot Izquierda"];
export const HUMAN_INDEX = 0;

export const TURN_SECONDS = 25;
export const CLAIM_WINDOW_SECONDS = 5;
export const CAMBIO_SECONDS = 30;

export const COLORS = {
    red: 0xc41e3a,
    black: 0x141826,
    cream: 0xfffbef,
    gold: 0xe7ca72,
    goldDeep: 0xb98520,
    green: 0x166534,
    greenDeep: 0x0b3f20,
    rail: 0x58330f,
    railDark: 0x261306,
    shadow: 0x000000,
    blueBack: 0x174a8b,
    redBack: 0x8d1f1f
};

export const CARD = {
    humanW: 72,
    humanH: 104,
    botW: 46,
    botH: 66,
    deckW: 82,
    deckH: 118,
    meldW: 54,
    meldH: 76,
    botMeldW: 50,
    botMeldH: 72,
    sideMeldW: 48,
    sideMeldH: 68,
    meldOverlap: 0.62,
    meldPanelPad: 12
};
