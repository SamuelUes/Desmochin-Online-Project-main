import { CAMBIO_SECONDS, CARD, CLAIM_WINDOW_SECONDS, COLORS, HUMAN_INDEX, PLAYER_NAMES, TURN_SECONDS } from "./constants.js";
import { cardLabel, cardName, createDeck, shuffle, sortCards, sortMeld, withoutCards } from "./cards.js";
import { chooseCambioCard, chooseClaimOption, choosePayCard, shouldClaimCard } from "./ai.js";
import {
    findExtensionTargets,
    findHandMeldOptions,
    findMeldOptions,
    hasForcedClaim,
    isCardUsefulToPlayer,
    isValidMeld,
    isValidStrategyMeld,
    optionMatchesSelection,
    playedCount
} from "./melds.js";

export class DesmocheScene extends Phaser.Scene {
    constructor() {
        super("DesmocheScene");
        this.runId = 0;
    }

    init(data) {
        this.multiplayerData = data?.multiplayer ? data : null;
    }

    create() {
        this.multiplayerData;
        this.bg = this.add.graphics();
        this.cards = this.add.layer();
        this.ui = this.add.layer();
        this.messageText = this.add.text(0, 0, "", {
            fontFamily: "Georgia, serif",
            fontSize: "16px",
            fontStyle: "bold",
            color: "#f0d878",
            align: "center",
            wordWrap: { width: 720 }
        }).setOrigin(0.5).setDepth(1000);
        this.timerText = this.add.text(0, 0, "", {
            fontFamily: "Georgia, serif",
            fontSize: "18px",
            fontStyle: "bold",
            color: "#fff8dc",
            align: "center",
            stroke: "#1d1608",
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(1001).setVisible(false);

        this.input.on("dragstart", (pointer, obj) => {
            if (!obj.getData("payCard") && !obj.getData("cambioCard") && !obj.getData("actionEntry")) return;
            obj.setData("moved", true);
            this.children.bringToTop(obj);
            obj.setScale(1.06);
        });

        this.input.on("drag", (pointer, obj, dragX, dragY) => {
            if (!obj.getData("payCard") && !obj.getData("cambioCard") && !obj.getData("actionEntry")) return;
            obj.x = dragX;
            obj.y = dragY;
        });

        this.input.on("dragend", (pointer, obj) => {
            const actionEntry = obj.getData("actionEntry");
            if (actionEntry && this.isHumanActionPhase()) {
                this.handleActionDrop(actionEntry, pointer.x, pointer.y);
                return;
            }

            const cambioCard = obj.getData("cambioCard");
            if (cambioCard && this.phase === "humanCambio") {
                if (this.pointInsidePlayerDropArea(1, pointer.x, pointer.y)) {
                    this.finishHumanCambio(cambioCard);
                    return;
                }
                this.showMessage("Cambio cancelado. Arrastra una carta hacia Bot Derecha.");
                this.renderAll();
                return;
            }

            const card = obj.getData("payCard");
            if (!card || !this.isHumanPayPhase()) return;
            if (this.pointInsideDiscard(pointer.x, pointer.y)) {
                this.finishHumanPayment(card);
                return;
            }
            this.showMessage("Pago cancelado. Arrastra una carta de tu mano hacia la pila.");
            this.renderAll();
        });

        this.input.on("pointerdown", pointer => {
            if (this.phase === "humanTurn" && this.currentPlayer === HUMAN_INDEX && this.turnCanDraw && !this.hasDrawnThisTurn && this.pointInsideDeck(pointer.x, pointer.y)) {
                this.performHumanDraw();
                return;
            }
            if (this.phase === "claimWindow" && this.claimWindowPlayerIndex === HUMAN_INDEX && this.exposedCard && this.pointInsideDiscard(pointer.x, pointer.y)) {
                this.handleClaimWindowClick();
            }
        });

        this.scale.on("resize", () => this.renderAll());
        document.getElementById("reset-btn").addEventListener("click", () => this.resetGame());
        const storedGameState = localStorage.getItem("desmoche_gameState");
        if (storedGameState) {
            try {
                this.multiplayerData = {
                    gameState: JSON.parse(storedGameState),
                    multiplayer: true
                };
            } catch (error) {
                console.error("Could not load multiplayer state:", error);
            }
        }
        this.resetGame();
    }

    resetGame() {
        // If we came from the lobby with a server game state, use it
        if (this.multiplayerData) {
            this.initMultiplayerGame(this.multiplayerData.gameState);
            return;
        }

        // Single-player 
        this.runId += 1;
        this.deck = shuffle(createDeck());
        this.discardPile = [];
        this.exposedCard = null;
        this.players = PLAYER_NAMES.map((name, index) => ({
            name,
            isHuman: index === HUMAN_INDEX,
            hand: [],
            melds: []
        }));
        this.currentPlayer = Phaser.Math.Between(0, 3);
        this.firstUnclaimedDraw = true;
        this.phase = "dealing";
        this.dealing = true;
        this.gameActive = true;
        this.cambioCards = [];
        this.actionStaged = [];
        this.selectedCambioCard = null;
        this.selectedPayCard = null;
        this.selectedActionCards = [];
        this.selectedMeldEntries = [];
        this.pendingHumanResolve = null;
        this.pendingPayResolve = null;
        this.pendingClaimResolve = null;
        this.timerSessionId = 0;
        this.activeTimerKind = null;
        this.turnDeadlineMs = null;
        this.turnCanDraw = false;
        this.hasDrawnThisTurn = false;
        this.pendingPaidCardRotation = false;
        this.paidCardOriginIndex = null;
        this.claimWindowPlayerIndex = -1;
        this.lastDrawerIndex = -1;
        this.clearAllTimers();
        document.getElementById("reset-btn").classList.remove("visible");
        this.renderAll();
        this.startRound(this.runId);
    }

    initMultiplayerGame(gameState) {
        this.runId += 1;

        this.discardPile = [];
        this.exposedCard = null;

        // Map server players to the local player format
        // The human player (us) is always index 0
        const myUserId = localStorage.getItem('desmoche_userId');
        const myIndex = Math.max(0, gameState.players.findIndex(p => p.userId === myUserId));
        const myHand = sortCards((gameState.myHand ?? []).filter(Boolean));
        const usedCardIds = new Set(myHand.map(card => card.id));
        const localDeck = shuffle(createDeck().filter(card => !usedCardIds.has(card.id)));

        // Reorder so the human is always at index 0 (bottom of screen)
        const reordered = [
            ...gameState.players.slice(myIndex),
            ...gameState.players.slice(0, myIndex)
        ];

        this.players = reordered.map((p, index) => ({
            name: p.username,
            isHuman: index === 0,
            hand: index === 0
                ? myHand
                : sortCards(Array.from({ length: p.cardCount ?? 9 }, () => localDeck.pop()).filter(Boolean)),
            melds: [],
            userId: p.userId
        }));

        this.deck = localDeck;
        this.currentPlayer = Math.max(0, this.players.findIndex(player => player.userId === gameState.currentTurn));
        this.firstUnclaimedDraw = true;
        this.phase = 'humanCambio';
        this.dealing = false;
        this.gameActive = true;
        this.cambioCards = [];
        this.actionStaged = [];
        this.selectedCambioCard = null;
        this.selectedPayCard = null;
        this.selectedActionCards = [];
        this.selectedMeldEntries = [];
        this.pendingHumanResolve = null;
        this.pendingPayResolve = null;
        this.pendingClaimResolve = null;
        this.timerSessionId = 0;
        this.activeTimerKind = null;
        this.turnDeadlineMs = null;
        this.turnCanDraw = false;
        this.hasDrawnThisTurn = false;
        this.pendingPaidCardRotation = false;
        this.paidCardOriginIndex = null;
        this.claimWindowPlayerIndex = -1;
        this.lastDrawerIndex = -1;

        this.clearAllTimers();
        document.getElementById('reset-btn').classList.remove('visible');

        this.listenToSocket();
        this.renderAll();
        this.showMessage('Partida iniciada. Realizando cambio...');
        this.startMultiplayerRound(this.runId);
    }

    async startMultiplayerRound(runId) {
        await this.runCambio(runId);
        if (!this.isCurrentRun(runId)) return;
        this.phase = "thinking";
        this.renderAll();
        this.showMessage(`${this.players[this.currentPlayer].name} empieza la mano.`);
        await this.sleep(1300);
        this.playLoop(runId);
    }

    listenToSocket() {
        import('./socketClient.js').then(({ default: socket }) => {
            this.socket = socket;
            const roomCode = localStorage.getItem('desmoche_roomCode');
            const userId = localStorage.getItem('desmoche_userId');
            const username = localStorage.getItem('desmoche_username');
            const joinCurrentRoom = () => {
                if (roomCode && userId && username) {
                    socket.emit('joinRoom', { roomCode, userId, username });
                }
            };

            if (socket.connected) {
                joinCurrentRoom();
            } else {
                socket.on('connect', joinCurrentRoom);
            }

            socket.on('cardPlayed', ({ userId, card, gameState }) => {
                // Find which local player index this userId maps to
                const playerIndex = this.players.findIndex(p => p.userId === userId);
                if (playerIndex < 0 || playerIndex === HUMAN_INDEX) return;

                // Remove card from that player's hand representation
                this.players[playerIndex].hand = this.players[playerIndex].hand
                    .slice(0, Math.max(0, this.players[playerIndex].hand.length - 1));

                this.renderAll();
            });

            socket.on('roomUpdated', ({ players }) => {
                // Update connected status on local player list
                players.forEach(serverPlayer => {
                    const local = this.players.find(p => p.userId === serverPlayer.userId);
                    if (local) local.connected = serverPlayer.connected;
                });
                this.renderAll();
            });
        });
    }

    async startRound(runId) {
        this.showMessage("Repartiendo cartas...");
        await this.dealCards(runId);
        if (!this.isCurrentRun(runId)) return;
        this.dealing = false;
        await this.runCambio(runId);
        if (!this.isCurrentRun(runId)) return;
        this.phase = "thinking";
        this.renderAll();
        this.showMessage(`${this.players[this.currentPlayer].name} empieza la mano.`);
        await this.sleep(1300);
        this.playLoop(runId);
    }

    async dealCards(runId) {
        for (let round = 0; round < 9; round += 1) {
            for (let playerIndex = 0; playerIndex < 4; playerIndex += 1) {
                if (!this.isCurrentRun(runId)) return;
                const card = this.deck.pop();
                this.players[playerIndex].hand.push(card);
                await this.animateDealCard(playerIndex, this.players[playerIndex].hand.length - 1);
                this.renderAll();
            }
        }
    }

    async runCambio(runId) {
        this.cambioCards = this.players.map((player, index) => {
            if (index === HUMAN_INDEX) return null;
            return chooseCambioCard(player);
        });
        this.phase = "humanCambio";
        this.selectedCambioCard = null;
        this.renderAll();
        this.showMessage("Cambio: selecciona una carta y presiona Cambio.");
        const humanCard = await this.waitForHumanCambio(CAMBIO_SECONDS);
        this.clearAllTimers();
        if (!this.isCurrentRun(runId) || !humanCard) return;
        this.cambioCards[HUMAN_INDEX] = humanCard;

        const outgoing = [...this.cambioCards];
        for (let i = 0; i < this.players.length; i += 1) {
            this.players[i].hand = withoutCards(this.players[i].hand, [outgoing[i]]);
        }
        for (let i = 0; i < this.players.length; i += 1) {
            this.players[this.playerToRight(i)].hand.push(outgoing[i]);
            this.players[this.playerToRight(i)].hand = sortCards(this.players[this.playerToRight(i)].hand);
        }

        this.cambioCards = [];
        this.phase = "thinking";
        this.renderAll();
        this.showMessage("Cambio realizado. Todos recibieron una carta.");
        await this.sleep(1300);
    }

    async playLoop(runId) {
        while (this.isCurrentRun(runId) && this.gameActive && this.deck.length > 0) {
            await this.processDeckTurn(this.currentPlayer, runId);
        }
        if (this.isCurrentRun(runId) && this.gameActive) {
            this.endGame(null, "El mazo se agotó. No hubo ganador y se revelan las manos.");
        }
    }

    async processDeckTurn(playerIndex, runId) {
        this.currentPlayer = playerIndex;
        this.lastDrawerIndex = playerIndex;
        await this.runCombinedTurn(playerIndex, runId, { canDraw: true });
        if (!this.isCurrentRun(runId) || !this.gameActive) return;

        await this.handlePostTurnExposure(playerIndex, runId);
    }

    async handlePostTurnExposure(drawerIndex, runId) {
        if (!this.isCurrentRun(runId) || !this.gameActive) return;

        if (this.exposedCard) {
            const card = this.exposedCard;
            const isPaidCardExposure = this.pendingPaidCardRotation;
            const originIndex = isPaidCardExposure ? this.paidCardOriginIndex : drawerIndex;
            this.pendingPaidCardRotation = false;

            const claimed = await this.runClaimRotation(card, originIndex, false, runId);
            if (!this.isCurrentRun(runId) || !this.gameActive) return;

            if (!claimed) {
                this.discardPile.unshift(card);
                this.exposedCard = null;
                this.renderAll();
                this.showMessage(`${cardLabel(card)} no le sirvió a nadie.`);
                await this.sleep(1050);

                if (this.firstUnclaimedDraw && this.deck.length > 0 && !isPaidCardExposure && originIndex === drawerIndex) {
                    this.firstUnclaimedDraw = false;
                    this.showMessage(`${this.players[drawerIndex].name} saca una segunda carta.`);
                    await this.sleep(900);
                    await this.processDeckTurn(drawerIndex, runId);
                    return;
                }

                this.firstUnclaimedDraw = false;
                this.currentPlayer = this.playerToRight(originIndex);
            }
            return;
        }

        if (!this.exposedCard) {
            this.currentPlayer = this.playerToRight(drawerIndex);
            return;
        }
    }

    async runCombinedTurn(playerIndex, runId, options = {}) {
        const { canDraw = true } = options;
        this.currentPlayer = playerIndex;
        this.turnCanDraw = canDraw;
        this.hasDrawnThisTurn = false;
        this.actionStaged = [];

        if (playerIndex === HUMAN_INDEX) {
            await this.runHumanCombinedTurn(playerIndex, runId);
            return;
        }

        await this.runBotCombinedTurn(playerIndex, runId, { canDraw });
    }

    async runHumanCombinedTurn(playerIndex, runId) {
        this.selectedActionCards = [];
        this.selectedMeldEntries = [];
        this.phase = "humanTurn";
        this.renderAll();
        this.showMessage(this.turnCanDraw ? "Tu turno — 25s" : "Reclama la carta — 25s");

        const turnSession = this.beginTimerSession("turn");
        this.startTurnTimer(TURN_SECONDS, turnSession, () => {
            if (this.timerSessionId !== turnSession) return;
            this.onHumanTurnTimeout();
        });

        await new Promise(resolve => {
            this.pendingHumanResolve = resolve;
        });

        this.cancelTimerSession(turnSession);
        if (this.gameActive) {
            this.phase = "thinking";
            this.renderAll();
        }
    }

    async runBotCombinedTurn(playerIndex, runId, { canDraw }) {
        const player = this.players[playerIndex];
        this.phase = "botTurn";
        this.renderAll();
        await this.sleep(750);

        if (canDraw && this.deck.length > 0) {
            const drawn = this.deck.pop();
            this.exposedCard = drawn;
            this.hasDrawnThisTurn = true;
            this.renderAll();
            this.showMessage(`${player.name} sacó ${cardName(drawn)}.`);
            await this.sleep(900);

            if (shouldClaimCard(player, drawn)) {
                const option = chooseClaimOption(player, drawn);
                if (option) {
                    await this.executeBotDesmochar(playerIndex, drawn, option, runId);
                    if (!this.isCurrentRun(runId) || !this.gameActive) return;
                }
            }
        } else if (this.exposedCard && shouldClaimCard(player, this.exposedCard)) {
            const option = chooseClaimOption(player, this.exposedCard);
            if (option) {
                await this.executeBotDesmochar(playerIndex, this.exposedCard, option, runId);
                if (!this.isCurrentRun(runId) || !this.gameActive) return;
            }
        }

        await this.runBotActionWindow(playerIndex, runId);
        this.phase = "thinking";
        this.renderAll();
    }

    async executeBotDesmochar(playerIndex, card, option, runId) {
        const player = this.players[playerIndex];
        this.removeExposedFromDiscard(card);
        this.applyMeld(playerIndex, card, option);
        this.exposedCard = null;
        this.renderAll();
        this.showMessage(`${player.name} jugó ${option.label}.`);
        await this.sleep(1100);

        if (playedCount(player) === 10) {
            this.endGame(playerIndex, `${player.name} llegó a 10 cartas jugadas.`);
            return;
        }

        const payCard = choosePayCard(player);
        if (!payCard) return;
        await this.payCardDuringTurn(playerIndex, payCard, runId);
    }

    async runClaimRotation(card, originIndex, includeOrigin, runId, skipThroughIndex = -1) {
        let order = this.priorityOrder(originIndex, includeOrigin);
        if (skipThroughIndex >= 0) {
            const skipAt = order.indexOf(skipThroughIndex);
            if (skipAt >= 0) order = order.slice(skipAt + 1);
        }

        for (const playerIndex of order) {
            if (!this.isCurrentRun(runId) || !this.gameActive) return false;

            const player = this.players[playerIndex];
            const options = findMeldOptions(player, card);
            if (options.length === 0) continue;

            const forced = hasForcedClaim(options);
            this.claimWindowPlayerIndex = playerIndex;
            this.phase = "claimWindow";
            this.renderAll();

            if (player.isHuman) {
                this.showMessage(forced
                    ? `Debes tomar ${cardLabel(card)} (${CLAIM_WINDOW_SECONDS}s).`
                    : `${player.name}: haz clic en la carta si te sirve (${CLAIM_WINDOW_SECONDS}s).`);
                const result = await this.waitForClaimWindow(playerIndex, card, forced, runId);
                if (result === "claim" || result === "forced") {
                    await this.runClaimTurn(playerIndex, card, runId);
                    return true;
                }
            } else {
                this.showMessage(`${player.name} revisa la carta (${CLAIM_WINDOW_SECONDS}s)...`);
                await this.sleep(CLAIM_WINDOW_SECONDS * 1000);
                if (!this.isCurrentRun(runId) || !this.gameActive) return false;
                if (forced || shouldClaimCard(player, card)) {
                    await this.runClaimTurn(playerIndex, card, runId);
                    return true;
                }
            }
        }

        this.claimWindowPlayerIndex = -1;
        this.phase = "thinking";
        return false;
    }

    async runClaimTurn(playerIndex, card, runId) {
        this.claimWindowPlayerIndex = -1;
        this.firstUnclaimedDraw = false;
        await this.runCombinedTurn(playerIndex, runId, { canDraw: false });

        if (!this.isCurrentRun(runId) || !this.gameActive) return;

        if (this.exposedCard?.id === card.id) {
            const claimed = await this.runClaimRotation(card, this.paidCardOriginIndex ?? playerIndex, false, runId, playerIndex);
            if (!this.isCurrentRun(runId) || !this.gameActive) return;
            if (!claimed) {
                this.discardPile.unshift(card);
                this.exposedCard = null;
                this.renderAll();
                this.showMessage(`${cardLabel(card)} no le sirvió a nadie.`);
                await this.sleep(900);
                this.currentPlayer = this.playerToRight(playerIndex);
            }
            return;
        }

        if (this.exposedCard && this.pendingPaidCardRotation) {
            const payCard = this.exposedCard;
            const payerIndex = this.paidCardOriginIndex ?? playerIndex;
            this.pendingPaidCardRotation = false;

            const claimed = await this.runClaimRotation(payCard, payerIndex, false, runId);
            if (!this.isCurrentRun(runId) || !this.gameActive) return;

            if (!claimed) {
                this.discardPile.unshift(payCard);
                this.exposedCard = null;
                this.renderAll();
                this.showMessage(`${cardLabel(payCard)} quedó en la pila.`);
                await this.sleep(900);
                this.currentPlayer = this.playerToRight(payerIndex);
            }
            return;
        }

        this.currentPlayer = this.playerToRight(playerIndex);
    }

    waitForClaimWindow(playerIndex, card, forced, runId) {
        return new Promise(resolve => {
            this.pendingClaimResolve = resolve;
            const claimSession = this.beginTimerSession("claim");
            this.startPromptTimer(CLAIM_WINDOW_SECONDS, claimSession, () => {
                if (this.timerSessionId !== claimSession) return;
                this.resolveClaimWindow(forced ? "forced" : "pass");
            });
        });
    }

    handleClaimWindowClick() {
        if (this.phase !== "claimWindow" || this.claimWindowPlayerIndex !== HUMAN_INDEX) return;
        const player = this.players[HUMAN_INDEX];
        if (!this.exposedCard) return;

        if (!isCardUsefulToPlayer(player, this.exposedCard)) {
            this.showMessage("Esta carta no te sirve.");
            return;
        }

        this.resolveClaimWindow("claim");
    }

    resolveClaimWindow(value) {
        if (!this.pendingClaimResolve) return;
        const resolve = this.pendingClaimResolve;
        this.pendingClaimResolve = null;
        this.clearPromptTimer();
        resolve(value);
    }

    performHumanDraw() {
        if (this.phase !== "humanTurn" || !this.turnCanDraw || this.hasDrawnThisTurn || this.deck.length === 0) return;

        const drawn = this.deck.pop();
        this.exposedCard = drawn;
        this.hasDrawnThisTurn = true;
        this.selectedActionCards = [];
        this.selectedMeldEntries = [];
        this.renderAll();
        this.showMessage(`Sacaste ${cardName(drawn)}.`);
    }

    onHumanTurnTimeout() {
        this.clearHumanSelections();
        this.selectedPayCard = null;
        if (this.pendingPayResolve) {
            const resolve = this.pendingPayResolve;
            this.pendingPayResolve = null;
            resolve(this.randomHandCard(HUMAN_INDEX));
        }
        this.finishHumanTurn();
    }

    finishHumanTurn() {
        if (this.pendingHumanResolve) {
            this.resolveHumanPrompt("done");
        }
    }

    finishHumanActionWindow() {
        if (this.isHumanActionPhase() && this.pendingHumanResolve) {
            this.finishHumanTurn();
        }
    }

    async runBotActionWindow(playerIndex, runId) {
        const player = this.players[playerIndex];
        let playedSomething = true;
        while (playedSomething && this.isCurrentRun(runId) && this.gameActive) {
            playedSomething = false;
            const extension = player.hand.flatMap(card => findExtensionTargets(player, card))[0];
            if (extension) {
                if (!this.applyFreeAction(playerIndex, extension)) break;
                this.renderAll();
                this.showMessage(`${player.name} agregó ${cardLabel(extension.cardsFromHand[0])} a una jugada.`);
                await this.sleep(900);
                playedSomething = true;
                continue;
            }

            const bajarse = findHandMeldOptions(player)[0];
            if (bajarse) {
                if (!this.applyFreeAction(playerIndex, bajarse)) break;
                this.renderAll();
                this.showMessage(`${player.name} se bajó con una jugada.`);
                await this.sleep(900);
                playedSomething = true;
            }
        }
    }

    applyMeld(playerIndex, candidate, option) {
        const player = this.players[playerIndex];
        player.hand = withoutCards(player.hand, option.cardsFromHand);
        if (option.borrowedCards?.length) {
            for (const borrowed of option.borrowedCards) {
                const meld = player.melds[borrowed.meldIndex];
                meld.cards = sortMeld(withoutCards(meld.cards, [borrowed.card]));
            }
        }
        if (option.type === "extend") {
            const meld = player.melds[option.meldIndex];
            meld.cards = sortMeld([...meld.cards, candidate]);
            return;
        }
        player.melds.push({ cards: sortMeld(option.resultCards) });
    }

    async payCardDuringTurn(playerIndex, payCard, runId) {
        const player = this.players[playerIndex];
        player.hand = withoutCards(player.hand, [payCard]);
        this.discardPile.unshift(payCard);
        this.exposedCard = payCard;
        this.pendingPaidCardRotation = true;
        this.paidCardOriginIndex = playerIndex;
        if (playerIndex === HUMAN_INDEX && this.socket) {
            this.socket.emit('playCard', {
                roomCode: localStorage.getItem('desmoche_roomCode'),
                userId: localStorage.getItem('desmoche_userId'),
                card: payCard
            });
        }
        this.renderAll();
        this.showMessage(`${player.name} pagó con ${cardName(payCard)}.`);
        await this.sleep(900);
    }

    async executeHumanDesmochar(option) {
        const card = this.exposedCard;
        if (!card || !option) return;

        this.removeExposedFromDiscard(card);
        this.applyMeld(HUMAN_INDEX, card, option);
        this.exposedCard = null;
        this.selectedActionCards = [];
        this.selectedMeldEntries = [];
        this.renderAll();
        this.showMessage(`Jugaste ${option.label}.`);

        if (playedCount(this.players[HUMAN_INDEX]) === 10) {
            this.endGame(HUMAN_INDEX, "Llegaste a 10 cartas jugadas.");
            this.finishHumanTurn();
            return;
        }

        const payCard = await this.waitForHumanPaymentInline(HUMAN_INDEX);
        if (payCard && this.gameActive) {
            await this.payCardDuringTurn(HUMAN_INDEX, payCard, this.runId);
            this.phase = "humanTurn";
            this.renderAll();
        } else if (this.gameActive) {
            this.phase = "humanTurn";
            this.renderAll();
        }
    }

    waitForHumanPaymentInline(playerIndex) {
        this.phase = "humanPay";
        this.selectedPayCard = null;
        this.renderAll();
        this.showMessage("Selecciona una carta y presiona Pagar.");
        return new Promise(resolve => {
            this.pendingPayResolve = resolve;
        });
    }

    findMatchingDesmocharOption() {
        if (!this.exposedCard) return null;
        const options = findMeldOptions(this.players[HUMAN_INDEX], this.exposedCard);
        return options.find(option => this.desmocharSelectionMatches(option)) ?? null;
    }

    desmocharSelectionMatches(option) {
        if (!optionMatchesSelection(option, this.selectedActionCards)) return false;
        const borrowed = option.borrowedCards ?? [];
        if (borrowed.length !== this.selectedMeldEntries.length) return false;
        return borrowed.every(borrowedEntry =>
            this.selectedMeldEntries.some(entry =>
                entry.card.id === borrowedEntry.card.id && entry.meldIndex === borrowedEntry.meldIndex
            )
        );
    }

    canCommitDesmochar() {
        if (!this.exposedCard || !this.isHumanActionPhase()) return false;
        return !!this.findMatchingDesmocharOption();
    }

    commitDesmocharSelection() {
        const option = this.findMatchingDesmocharOption();
        if (!option) {
            this.showMessage("Selecciona cartas válidas para desmochar.");
            return;
        }
        this.executeHumanDesmochar(option);
    }

    isHumanActionPhase() {
        return this.phase === "humanTurn";
    }

    isHumanPayPhase() {
        return this.phase === "humanPay";
    }

    resolveClaimWindow(value) {
        if (!this.pendingClaimResolve) return;
        const resolve = this.pendingClaimResolve;
        this.pendingClaimResolve = null;
        this.cancelTimerSession(this.timerSessionId);
        resolve(value);
    }

    beginTimerSession(kind) {
        this.clearAllTimers();
        this.timerSessionId += 1;
        this.activeTimerKind = kind;
        return this.timerSessionId;
    }

    cancelTimerSession(sessionId) {
        if (this.timerSessionId !== sessionId) return;
        this.clearAllTimers();
    }

    clearAllTimers() {
        this.turnTimerEvent?.remove(false);
        this.turnCountdownEvent?.remove(false);
        this.pendingTimerEvent?.remove(false);
        this.pendingCountdownEvent?.remove(false);
        this.turnTimerEvent = null;
        this.turnCountdownEvent = null;
        this.pendingTimerEvent = null;
        this.pendingCountdownEvent = null;
        this.turnDeadlineMs = null;
        this.turnTimeoutCallback = null;
        this.activeTimerKind = null;
        this.timerText?.setVisible(false);
    }

    updateTimerDisplay(remaining, kind) {
        if (remaining <= 0) return;
        const prefix = kind === "turn" ? "Turno" : kind === "claim" ? "Reclamar" : "";
        this.timerText.setText(prefix ? `${prefix}: ${remaining}s` : `${remaining}s`);
        this.timerText.setVisible(true);
    }

    startTurnTimer(seconds, sessionId, onTimeout) {
        this.turnDeadlineMs = this.time.now + seconds * 1000;

        const tick = () => {
            if (this.timerSessionId !== sessionId || this.activeTimerKind !== "turn") return;
            const remaining = this.getRemainingTurnSeconds();
            this.updateTimerDisplay(remaining, "turn");
        };
        tick();
        this.turnCountdownEvent = this.time.addEvent({
            delay: 1000,
            repeat: seconds - 1,
            callback: tick
        });
        this.turnTimerEvent = this.time.delayedCall(seconds * 1000, () => {
            if (this.timerSessionId !== sessionId || this.activeTimerKind !== "turn") return;
            this.turnDeadlineMs = null;
            this.turnTimerEvent = null;
            this.turnCountdownEvent?.remove(false);
            this.turnCountdownEvent = null;
            onTimeout();
        });
    }

    getRemainingTurnSeconds() {
        if (!this.turnDeadlineMs) return 0;
        return Math.max(0, Math.ceil((this.turnDeadlineMs - this.time.now) / 1000));
    }

    finishHumanPayment(card) {
        if (this.pendingPayResolve) {
            this.selectedPayCard = null;
            const resolve = this.pendingPayResolve;
            this.pendingPayResolve = null;
            resolve(card);
            return;
        }
    }

    waitForHumanCambio(seconds = CAMBIO_SECONDS) {
        return new Promise(resolve => {
            this.pendingHumanResolve = resolve;
            const cambioSession = this.beginTimerSession("cambio");
            this.startPromptTimer(seconds, cambioSession, () => {
                if (this.timerSessionId !== cambioSession) return;
                this.showMessage("Tiempo agotado. Se eligió una carta al azar para el cambio.");
                this.resolveHumanPrompt(this.randomHandCard(HUMAN_INDEX));
            });
        });
    }

    finishHumanCambio(card) {
        if (this.phase !== "humanCambio" || !this.pendingHumanResolve) return;
        this.selectedCambioCard = null;
        this.resolveHumanPrompt(card);
    }

    resolveHumanPrompt(value) {
        if (!this.pendingHumanResolve) return;
        const resolve = this.pendingHumanResolve;
        this.pendingHumanResolve = null;
        resolve(value);
    }

    startPromptTimer(seconds, sessionId, onTimeout) {
        let remaining = seconds;
        const tick = () => {
            if (this.timerSessionId !== sessionId) return;
            this.updateTimerDisplay(remaining, this.activeTimerKind);
            remaining -= 1;
        };
        tick();
        this.pendingCountdownEvent = this.time.addEvent({
            delay: 1000,
            repeat: seconds - 1,
            callback: tick
        });
        this.pendingTimerEvent = this.time.delayedCall(seconds * 1000, () => {
            if (this.timerSessionId !== sessionId) return;
            this.pendingTimerEvent = null;
            this.pendingCountdownEvent?.remove(false);
            this.pendingCountdownEvent = null;
            onTimeout();
        });
    }

    randomHandCard(playerIndex) {
        const hand = this.players[playerIndex].hand;
        if (hand.length === 0) return null;
        return hand[Phaser.Math.Between(0, hand.length - 1)];
    }

    endGame(winnerIndex, message) {
        this.gameActive = false;
        this.phase = "gameOver";
        this.currentPlayer = winnerIndex ?? -1;
        this.exposedCard = null;
        this.clearAllTimers();
        if (this.pendingHumanResolve) this.resolveHumanPrompt("done");
        if (this.pendingPayResolve) {
            const resolve = this.pendingPayResolve;
            this.pendingPayResolve = null;
            resolve(null);
        }
        if (this.pendingClaimResolve) this.resolveClaimWindow("pass");
        this.renderAll();
        document.getElementById("reset-btn").classList.add("visible");
        this.showMessage(winnerIndex === null ? message : `Ganó ${this.players[winnerIndex].name}: ${message}`);
    }

    renderAll() {
        if (!this.bg || !this.cards || !this.ui) return;
        this.bg.clear();
        this.cards.removeAll(true);
        this.ui.removeAll(true);
        this.drawTable();
        this.renderDeck();
        this.renderDiscard();
        this.renderPlayers();
        this.renderActionPanel();
        this.renderCommandButtons();
        this.messageText.setPosition(this.scale.width / 2, this.scale.height / 2 + 106);
        this.timerText.setPosition(this.scale.width / 2, this.scale.height / 2 + 148);
    }

    drawTable() {
        const { width, height } = this.scale;
        this.bg.fillStyle(COLORS.railDark, 1).fillRect(0, 0, width, height);
        this.bg.fillStyle(COLORS.rail, 1).fillRoundedRect(12, 12, width - 24, height - 24, 14);
        this.bg.fillStyle(COLORS.greenDeep, 1).fillRoundedRect(30, 30, width - 60, height - 60, 8);
        this.bg.fillStyle(COLORS.green, 1).fillEllipse(width / 2, height / 2, width - 110, height - 96);
        this.bg.lineStyle(2, 0xffffff, 0.05).strokeEllipse(width / 2, height / 2, width - 150, height - 136);
    }

    renderDeck() {
        const pos = this.deckPosition();
        const active = this.phase === "humanTurn" && this.currentPlayer === HUMAN_INDEX &&
            this.turnCanDraw && !this.hasDrawnThisTurn && this.deck.length > 0;
        const deck = this.add.container(pos.x, pos.y);
        const shadow = this.add.rectangle(4, 6, CARD.deckW, CARD.deckH, 0x000000, 0.3).setOrigin(0.5);
        const back = this.add.rectangle(0, 0, CARD.deckW, CARD.deckH, COLORS.blueBack, 1).setOrigin(0.5);
        back.setStrokeStyle(active ? 4 : 3, active ? COLORS.gold : 0xffffff, 1);
        const inset = this.add.rectangle(0, 0, CARD.deckW - 14, CARD.deckH - 14, 0xffffff, 0.04).setOrigin(0.5);
        inset.setStrokeStyle(2, 0xffffff, 0.35);
        const count = this.add.text(0, 0, String(this.deck.length), {
            fontFamily: "Georgia, serif",
            fontSize: "26px",
            fontStyle: "bold",
            color: "#ffffff"
        }).setOrigin(0.5);
        deck.add([shadow, back, inset, count]);
        deck.setSize(CARD.deckW, CARD.deckH);
        if (active) {
            deck.setInteractive(new Phaser.Geom.Rectangle(0, 0, CARD.deckW, CARD.deckH), Phaser.Geom.Rectangle.Contains);
            deck.on("pointerdown", () => this.performHumanDraw());
            this.tweens.add({ targets: deck, scale: 1.05, yoyo: true, repeat: -1, duration: 650 });
        }
        this.cards.add(deck);
    }

    renderDiscard() {
        const pos = this.discardPosition();
        const card = this.exposedCard ?? this.discardPile[0] ?? null;
        if (card) {
            const claimActive = this.phase === "claimWindow" && this.claimWindowPlayerIndex === HUMAN_INDEX && !!this.exposedCard;
            const canDesmochar = this.phase === "humanTurn" && !!this.exposedCard;
            this.cards.add(this.createCardView(card, pos.x, pos.y, CARD.deckW, CARD.deckH, {
                faceUp: true,
                highlight: !!this.exposedCard && (claimActive || canDesmochar),
                softHighlight: claimActive,
                onClick: claimActive ? () => this.handleClaimWindowClick() : null
            }));
            return;
        }
        const pile = this.add.container(pos.x, pos.y);
        const body = this.add.rectangle(0, 0, CARD.deckW, CARD.deckH, 0xffffff, 0.12).setOrigin(0.5);
        body.setStrokeStyle(2, COLORS.gold, 0.4);
        const label = this.add.text(0, 0, "Pila", {
            fontFamily: "Georgia, serif",
            fontSize: "13px",
            color: "#d8c98a"
        }).setOrigin(0.5);
        pile.add([body, label]);
        this.cards.add(pile);
    }

    renderPlayers() {
        for (let i = 0; i < this.players.length; i += 1) {
            this.renderPlayer(i);
        }
    }

    renderPlayer(playerIndex) {
        const player = this.players[playerIndex];
        const labelPos = this.labelPosition(playerIndex);
        const isActive = (this.currentPlayer === playerIndex && this.phase !== "gameOver" && !this.dealing) ||
            (this.phase === "claimWindow" && this.claimWindowPlayerIndex === playerIndex);
        const label = this.add.text(labelPos.x, labelPos.y, player.name, {
            fontFamily: "Georgia, serif",
            fontSize: playerIndex === HUMAN_INDEX ? "15px" : "13px",
            fontStyle: "bold",
            color: isActive ? "#ffffff" : "#f0d878"
        }).setOrigin(0.5);
        if (isActive) {
            label.setShadow(0, 0, "#f0d878", 12);
        }
        this.ui.add(label);
        this.renderHand(playerIndex);
        this.renderMelds(playerIndex);
    }

    renderHand(playerIndex) {
        const player = this.players[playerIndex];
        const faceUp = player.isHuman || this.phase === "gameOver";
        const selectedIds = this.currentHumanSelectionIds();
        player.hand.forEach((card, index) => {
            const pos = { ...this.handCardPosition(playerIndex, index, player.hand.length) };
            const isPayCard = this.isHumanPayPhase() && player.isHuman;
            const isCambioCard = this.phase === "humanCambio" && player.isHuman;
            const isActionCard = this.isHumanActionPhase() && player.isHuman;
            const isSelectable = isPayCard || isCambioCard || isActionCard;
            if (player.isHuman && selectedIds.has(card.id)) pos.y -= 24;
            const view = this.createCardView(card, pos.x, pos.y, pos.w, pos.h, {
                faceUp,
                small: playerIndex !== HUMAN_INDEX,
                highlight: selectedIds.has(card.id),
                softHighlight: isSelectable,
                draggable: isActionCard,
                actionEntry: isActionCard ? { card, source: "hand" } : null,
                payCard: isPayCard ? card : null,
                cambioCard: isCambioCard ? card : null,
                onClick: isSelectable ? () => this.selectHumanHandCard(card) : null
            });
            if (isPayCard && player.isHuman) {
                this.input.setDraggable(view);
            }
            if (isCambioCard && player.isHuman) {
                this.input.setDraggable(view);
            }
            this.cards.add(view);
        });
    }

    renderMelds(playerIndex) {
        const player = this.players[playerIndex];
        const layout = this.meldLayoutFor(playerIndex);
        const selectedMeldIds = this.isHumanActionPhase()
            ? new Set(this.selectedMeldEntries.map(entry => entry.card.id))
            : new Set();

        if (playerIndex === HUMAN_INDEX || playerIndex === 2) {
            this.renderMeldsHorizontal(playerIndex, player, layout, selectedMeldIds);
            return;
        }

        this.renderMeldsVertical(playerIndex, player, layout);
    }

    meldLayoutFor(playerIndex) {
        if (playerIndex === HUMAN_INDEX) {
            return { w: CARD.meldW, h: CARD.meldH, step: CARD.meldW * CARD.meldOverlap, meld: true };
        }
        if (playerIndex === 2) {
            return { w: CARD.botMeldW, h: CARD.botMeldH, step: CARD.botMeldW * CARD.meldOverlap, meld: true };
        }
        return { w: CARD.sideMeldW, h: CARD.sideMeldH, step: CARD.sideMeldW * CARD.meldOverlap, meld: true };
    }

    meldCardsSpan(cardCount, layout) {
        return layout.w + Math.max(0, cardCount - 1) * layout.step;
    }

    meldGroupWidth(cardCount, layout) {
        return this.meldCardsSpan(cardCount, layout) + CARD.meldPanelPad * 2;
    }

    meldPanelHeight(layout) {
        return layout.h + CARD.meldPanelPad * 2;
    }

    meldCardCenterX(groupCenterX, cardIndex, cardCount, layout) {
        const span = this.meldCardsSpan(cardCount, layout);
        const firstCenter = groupCenterX - span / 2 + layout.w / 2;
        return firstCenter + cardIndex * layout.step;
    }

    drawMeldPanel(x, y, width, height) {
        const shadow = this.add.rectangle(x + 2, y + 3, width, height, 0x000000, 0.38).setOrigin(0.5);
        shadow.setDepth(-2);
        this.cards.add(shadow);
        const bg = this.add.rectangle(x, y, width, height, 0x0a4d28, 0.88).setOrigin(0.5);
        bg.setStrokeStyle(2, COLORS.gold, 0.78);
        bg.setDepth(-1);
        this.cards.add(bg);
    }

    renderMeldsHorizontal(playerIndex, player, layout, selectedMeldIds) {
        const base = this.meldPosition(playerIndex);
        const gap = 28;
        const panelH = this.meldPanelHeight(layout);
        const widths = player.melds.map(meld => this.meldGroupWidth(meld.cards.length, layout));
        const totalWidth = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, widths.length - 1) * gap;
        let cursorX = this.scale.width / 2 - totalWidth / 2;

        for (const [meldIndex, meld] of player.melds.entries()) {
            const groupW = widths[meldIndex];
            const centerX = cursorX + groupW / 2;
            const rowY = base.y;
            this.drawMeldPanel(centerX, rowY, groupW, panelH);
            meld.cards.forEach((card, cardIndex) => {
                const isActionCard = playerIndex === HUMAN_INDEX && this.isHumanActionPhase();
                this.cards.add(this.createCardView(
                    card,
                    this.meldCardCenterX(centerX, cardIndex, meld.cards.length, layout),
                    rowY,
                    layout.w,
                    layout.h,
                    {
                        faceUp: true,
                        meld: layout.meld,
                        highlight: selectedMeldIds.has(card.id),
                        softHighlight: isActionCard,
                        draggable: isActionCard,
                        actionEntry: isActionCard ? { card, source: "meld", meldIndex, sourceMeld: meld } : null,
                        onClick: isActionCard ? () => this.selectHumanMeldCard(card, meldIndex, meld) : null
                    }
                ));
            });
            cursorX += groupW + gap;
        }

        this.renderPlayedCount(playerIndex, {
            x: this.scale.width / 2,
            y: base.y - panelH / 2 - 30
        }, player);
    }

    renderMeldsVertical(playerIndex, player, layout) {
        const base = this.meldPosition(playerIndex);
        const rowGap = 94;
        const panelH = this.meldPanelHeight(layout);
        const centerX = playerIndex === 1 ? base.x - 8 : base.x + 8;

        for (const [meldIndex, meld] of player.melds.entries()) {
            const rowY = base.y + meldIndex * rowGap;
            const groupW = this.meldGroupWidth(meld.cards.length, layout);
            this.drawMeldPanel(centerX, rowY, groupW, panelH);
            meld.cards.forEach((card, cardIndex) => {
                this.cards.add(this.createCardView(
                    card,
                    this.meldCardCenterX(centerX, cardIndex, meld.cards.length, layout),
                    rowY,
                    layout.w,
                    layout.h,
                    { faceUp: true, meld: layout.meld }
                ));
            });
        }

        this.renderPlayedCount(playerIndex, {
            x: centerX,
            y: base.y - panelH / 2 - 30
        }, player);
    }

    renderPlayedCount(playerIndex, position, player) {
        if (playedCount(player) === 0) return;

        const label = `${playedCount(player)}/10`;
        const badge = this.add.container(position.x, position.y);
        const text = this.add.text(0, 0, label, {
            fontFamily: "Georgia, serif",
            fontSize: "14px",
            fontStyle: "bold",
            color: "#fff8dc"
        }).setOrigin(0.5);
        const padX = 12;
        const padY = 5;
        const bg = this.add.rectangle(0, 0, text.width + padX * 2, text.height + padY * 2, 0x1a1208, 0.92)
            .setOrigin(0.5)
            .setStrokeStyle(2, COLORS.gold, 0.9);
        badge.add([bg, text]);
        badge.setDepth(1002);
        this.ui.add(badge);
    }

    renderActionPanel() {
        if (!this.isHumanActionPhase() && !this.isHumanPayPhase()) return;
        const { width, height } = this.scale;
        const panel = this.add.container(width / 2, height / 2 - 128);
        const bg = this.add.rectangle(0, 0, 430, 82, 0x050505, 0.76).setOrigin(0.5);
        bg.setStrokeStyle(1, COLORS.gold, 0.45);
        const title = this.add.text(0, -24, this.isHumanPayPhase() ? "Pago" : "Acciones", {
            fontFamily: "Georgia, serif",
            fontSize: "14px",
            fontStyle: "bold",
            color: "#f0d878"
        }).setOrigin(0.5);
        const selected = [
            ...(this.exposedCard && this.isHumanActionPhase() ? [this.exposedCard] : []),
            ...this.selectedActionCards,
            ...this.selectedMeldEntries.map(entry => entry.card)
        ];
        const staged = selected.length > 0
            ? selected.map(cardLabel).join(" ")
            : this.isHumanPayPhase()
                ? "Selecciona una carta para pagar"
                : "Selecciona cartas de tu mano o de tus jugadas";
        const stagedText = this.add.text(0, -4, staged, {
            fontFamily: "Georgia, serif",
            fontSize: "12px",
            color: "#fff3bf",
            align: "center",
            wordWrap: { width: 390 }
        }).setOrigin(0.5);
        panel.add([bg, title, stagedText]);
        this.ui.add(panel);
    }

    renderCommandButtons() {
        const { width, height } = this.scale;
        const x = width - 102;
        let y = this.isHumanActionPhase() ? height - 342 : height - 178;
        const buttons = [];

        if (this.phase === "humanCambio") {
            buttons.push(["Cambio", () => this.confirmCambioSelection(), !!this.selectedCambioCard]);
        }
        if (this.isHumanPayPhase()) {
            buttons.push(["Pagar", () => this.confirmPaySelection(), !!this.selectedPayCard]);
        }
        if (this.isHumanActionPhase()) {
            buttons.push(["Desmochar", () => this.commitDesmocharSelection(), this.canCommitDesmochar()]);
            buttons.push(["Bajarse", () => this.commitBajarseSelection(), this.canCommitBajarse()]);
            buttons.push(["Trasmochar", () => this.commitTrasmocharSelection(), this.canCommitTrasmochar()]);
            buttons.push(["Agregar", () => this.commitAgregarSelection(), this.canCommitAgregar()]);
            buttons.push(["Terminar", () => this.finishHumanActionWindow(), true]);
        }

        for (const [label, callback, enabled] of buttons) {
            const button = this.createButton(x, y, label, enabled ? callback : () => this.showMessage("Selecciona cartas válidas para esa acción."), 128, 32, enabled);
            this.ui.add(button);
            y += 40;
        }
    }

    currentHumanSelectionIds() {
        if (this.phase === "humanCambio") {
            return new Set([this.selectedCambioCard?.id].filter(Boolean));
        }
        if (this.isHumanPayPhase()) {
            return new Set([this.selectedPayCard?.id].filter(Boolean));
        }
        if (this.isHumanActionPhase()) {
            return new Set(this.selectedActionCards.map(card => card.id));
        }
        return new Set();
    }

    clearHumanSelections(options = {}) {
        const {
            keepCambio = false,
            keepPay = false,
            keepActions = false
        } = options;
        if (!keepCambio) this.selectedCambioCard = null;
        if (!keepPay) this.selectedPayCard = null;
        if (!keepActions) {
            this.selectedActionCards = [];
            this.selectedMeldEntries = [];
            this.actionStaged = [];
        }
    }

    confirmCambioSelection() {
        if (!this.selectedCambioCard) {
            this.showMessage("Selecciona una carta para el cambio.");
            return;
        }
        this.finishHumanCambio(this.selectedCambioCard);
    }

    confirmPaySelection() {
        if (!this.selectedPayCard) {
            this.showMessage("Selecciona una carta para pagar.");
            return;
        }
        this.finishHumanPayment(this.selectedPayCard);
    }

    selectHumanHandCard(card) {
        if (this.phase === "humanCambio") {
            this.selectedCambioCard = this.selectedCambioCard?.id === card.id ? null : card;
            this.renderAll();
            return;
        }
        if (this.isHumanPayPhase()) {
            this.selectedPayCard = this.selectedPayCard?.id === card.id ? null : card;
            this.renderAll();
            return;
        }
        if (this.isHumanActionPhase()) {
            const exists = this.selectedActionCards.some(selected => selected.id === card.id);
            this.selectedActionCards = exists
                ? this.selectedActionCards.filter(selected => selected.id !== card.id)
                : [...this.selectedActionCards, card];
            this.renderAll();
        }
    }

    selectHumanMeldCard(card, meldIndex, meld) {
        if (!this.isHumanActionPhase()) return;
        const exists = this.selectedMeldEntries.some(entry => entry.card.id === card.id);
        this.selectedMeldEntries = exists
            ? this.selectedMeldEntries.filter(entry => entry.card.id !== card.id)
            : [...this.selectedMeldEntries, { card, source: "meld", meldIndex, sourceMeld: meld }];
        this.renderAll();
    }

    canCommitBajarse() {
        return this.selectedActionCards.length >= 3 &&
            this.selectedMeldEntries.length === 0 &&
            isValidMeld(this.selectedActionCards) &&
            playedCount(this.players[HUMAN_INDEX]) + this.selectedActionCards.length <= 10;
    }

    commitBajarseSelection() {
        if (!this.canCommitBajarse()) {
            this.showMessage("Selecciona una jugada válida para bajarte.");
            return;
        }
        this.actionStaged = this.selectedActionCards.map(card => ({ card, source: "hand" }));
        this.applyStagedAction(HUMAN_INDEX);
    }

    canCommitTrasmochar() {
        if (this.selectedMeldEntries.length === 0) return false;
        const staged = [
            ...this.selectedActionCards.map(card => ({ card, source: "hand" })),
            ...this.selectedMeldEntries
        ];
        const addedCards = this.selectedActionCards.length;
        return staged.length >= 3 &&
            isValidStrategyMeld(staged) &&
            playedCount(this.players[HUMAN_INDEX]) + addedCards <= 10;
    }

    commitTrasmocharSelection() {
        if (!this.canCommitTrasmochar()) {
            this.showMessage("Selecciona cartas válidas para trasmochar.");
            return;
        }
        this.actionStaged = [
            ...this.selectedActionCards.map(card => ({ card, source: "hand" })),
            ...this.selectedMeldEntries
        ];
        this.applyStagedAction(HUMAN_INDEX);
    }

    canCommitAgregar() {
        if (this.selectedActionCards.length !== 1 || this.selectedMeldEntries.length !== 1) return false;
        const targetMeldIndex = this.selectedMeldEntries[0].meldIndex;
        return findExtensionTargets(this.players[HUMAN_INDEX], this.selectedActionCards[0])
            .some(option => option.meldIndex === targetMeldIndex && playedCount(this.players[HUMAN_INDEX]) + 1 <= 10);
    }

    commitAgregarSelection() {
        if (!this.canCommitAgregar()) {
            this.showMessage("Selecciona una carta de tu mano y una jugada compatible.");
            return;
        }
        const targetMeldIndex = this.selectedMeldEntries[0].meldIndex;
        const extension = findExtensionTargets(this.players[HUMAN_INDEX], this.selectedActionCards[0])
            .find(option => option.meldIndex === targetMeldIndex);
        if (!extension || !this.applyFreeAction(HUMAN_INDEX, extension)) {
            this.showMessage("No se pudo agregar esa carta.");
            return;
        }
        this.selectedActionCards = [];
        this.selectedMeldEntries = [];
        this.renderAll();
        this.showMessage(`Tú agregaste ${cardLabel(extension.cardsFromHand[0])} a una jugada.`);
    }

    handleActionDrop(entry, x, y) {
        if (entry.source === "hand") {
            const targetMeldIndex = this.meldIndexAtPoint(HUMAN_INDEX, x, y);
            if (targetMeldIndex !== null) {
                const extension = findExtensionTargets(this.players[HUMAN_INDEX], entry.card)
                    .find(option => option.meldIndex === targetMeldIndex);
                if (extension) {
                    if (!this.applyFreeAction(HUMAN_INDEX, extension)) {
                        this.showMessage("Esa jugada pasa de 10 cartas jugadas.");
                        this.renderAll();
                        return;
                    }
                    this.renderAll();
                    this.showMessage(`Tú agregaste ${cardLabel(entry.card)} a una jugada.`);
                    return;
                }
            }
        }

        if (this.pointInsideStrategyDropArea(x, y)) {
            this.stageActionCard(entry);
            return;
        }

        this.showMessage("Acción cancelada. Arrastra cartas a tu zona de jugadas.");
        this.renderAll();
    }

    stageActionCard(entry) {
        const exists = this.actionStaged.some(staged => staged.card.id === entry.card.id);
        if (!exists) this.actionStaged.push(entry);

        if (isValidStrategyMeld(this.actionStaged.map(staged => ({
            ...staged,
            sourceMeld: staged.source === "meld" ? this.players[HUMAN_INDEX].melds[staged.meldIndex] : null
        })))) {
            const addedCards = this.actionStaged.filter(staged => staged.source === "hand").length;
            if (playedCount(this.players[HUMAN_INDEX]) + addedCards > 10) {
                this.actionStaged = [];
                this.showMessage("Esa jugada pasa de 10 cartas jugadas.");
                this.renderAll();
                return;
            }
            this.applyStagedAction(HUMAN_INDEX);
            return;
        }

        const stagedCards = this.actionStaged.map(staged => staged.card);
        if (stagedCards.length >= 3 && !isValidMeld(stagedCards)) {
            this.actionStaged = [];
            this.showMessage("Esa jugada no es válida.");
        }
        this.renderAll();
    }

    applyStagedAction(playerIndex) {
        const player = this.players[playerIndex];
        const handCards = this.actionStaged.filter(entry => entry.source === "hand").map(entry => entry.card);
        const borrowed = this.actionStaged.filter(entry => entry.source === "meld");
        player.hand = withoutCards(player.hand, handCards);

        for (const entry of borrowed) {
            const meld = player.melds[entry.meldIndex];
            meld.cards = sortMeld(withoutCards(meld.cards, [entry.card]));
        }

        const resultCards = sortMeld(this.actionStaged.map(entry => entry.card));
        player.melds.push({ cards: resultCards });
        const usedBorrowedCards = borrowed.length > 0;
        this.actionStaged = [];
        this.selectedActionCards = [];
        this.selectedMeldEntries = [];
        this.renderAll();
        this.showMessage(usedBorrowedCards
            ? `${player.name} trasmochó con ${resultCards.map(cardLabel).join(" ")}.`
            : `${player.name} se bajó con ${resultCards.map(cardLabel).join(" ")}.`);
        this.checkWinnerAfterFreeAction(playerIndex);
    }

    applyFreeAction(playerIndex, option) {
        const player = this.players[playerIndex];
        const addedCards = option.type === "addCard" ? 1 : option.cardsFromHand.length;
        if (playedCount(player) + addedCards > 10) return false;
        player.hand = withoutCards(player.hand, option.cardsFromHand);
        if (option.type === "addCard") {
            const meld = player.melds[option.meldIndex];
            meld.cards = sortMeld(option.resultCards);
            this.checkWinnerAfterFreeAction(playerIndex);
            return true;
        }
        player.melds.push({ cards: sortMeld(option.resultCards) });
        this.checkWinnerAfterFreeAction(playerIndex);
        return true;
    }

    checkWinnerAfterFreeAction(playerIndex) {
        if (playedCount(this.players[playerIndex]) === 10) {
            this.endGame(playerIndex, `${this.players[playerIndex].name} llegó a 10 cartas jugadas.`);
            this.finishHumanTurn();
        }
    }

    createButton(x, y, label, callback, width = 140, height = 34, active = false) {
        const button = this.add.container(x, y);
        const body = this.add.rectangle(0, 0, width, height, active ? COLORS.gold : 0x1f2937, 0.96).setOrigin(0.5);
        body.setStrokeStyle(1, active ? 0xffffff : COLORS.gold, active ? 0.9 : 0.55);
        const text = this.add.text(0, 0, label, {
            fontFamily: "Georgia, serif",
            fontSize: "11px",
            fontStyle: "bold",
            color: active ? "#1d1608" : "#f8e8a8",
            align: "center",
            wordWrap: { width: width - 12 }
        }).setOrigin(0.5);
        button.add([body, text]);
        button.setSize(width, height);
        button.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
        button.on("pointerdown", callback);
        return button;
    }

    createCardView(card, x, y, w, h, options = {}) {
        const {
            faceUp = true,
            small = false,
            meld = false,
            highlight = false,
            softHighlight = false,
            draggable = false,
            payCard = null,
            cambioCard = null,
            actionEntry = null,
            onClick = null
        } = options;
        const c = this.add.container(x, y);
        const shadow = this.add.rectangle(3, 5, w, h, 0x000000, meld ? 0.42 : 0.35).setOrigin(0.5);
        const bodyColor = faceUp ? COLORS.cream : COLORS.redBack;
        const body = this.add.rectangle(0, 0, w, h, bodyColor, 1).setOrigin(0.5);
        body.setStrokeStyle(
            highlight ? 4 : softHighlight ? 3 : meld ? 2 : 2,
            highlight ? COLORS.gold : softHighlight ? 0xffffff : meld ? 0x1f2937 : 0xe8d7ad,
            highlight || softHighlight ? 1 : meld ? 0.55 : 0.9
        );
        c.add([shadow, body]);

        if (faceUp) {
            const color = card.color === "red" ? "#c41e3a" : "#141826";
            const cornerSize = meld ? "11px" : small ? "9px" : "13px";
            const suitSize = meld ? "24px" : small ? "20px" : "31px";
            c.add(this.add.text(-w / 2 + 7, -h / 2 + 5, `${card.label}\n${card.suitSymbol}`, {
                fontFamily: "Georgia, serif",
                fontSize: cornerSize,
                fontStyle: "bold",
                color,
                align: "center",
                lineSpacing: -2
            }).setOrigin(0, 0));
            c.add(this.add.text(0, 0, card.suitSymbol, {
                fontFamily: "Georgia, serif",
                fontSize: suitSize,
                color
            }).setOrigin(0.5));
            c.add(this.add.text(w / 2 - 7, h / 2 - 5, `${card.label}\n${card.suitSymbol}`, {
                fontFamily: "Georgia, serif",
                fontSize: cornerSize,
                fontStyle: "bold",
                color,
                align: "center",
                lineSpacing: -2
            }).setOrigin(1, 1));
        } else {
            const inset = this.add.rectangle(0, 0, w - 12, h - 12, 0xffffff, 0.05).setOrigin(0.5);
            inset.setStrokeStyle(2, 0xf5d69b, 0.45);
            const mark = this.add.text(0, 0, "✦", {
                fontFamily: "Georgia, serif",
                fontSize: small ? "14px" : "22px",
                color: "#e7c985"
            }).setOrigin(0.5);
            c.add([inset, mark]);
        }

        c.setSize(w, h);
        if (onClick || draggable) {
            c.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
        }
        if (onClick) c.on("pointerdown", onClick);
        if (draggable) {
            c.setData("payCard", payCard);
            c.setData("cambioCard", cambioCard);
            c.setData("actionEntry", actionEntry);
            this.input.setDraggable(c);
        }
        return c;
    }

    async animateDealCard(playerIndex, cardIndex) {
        const from = this.deckPosition();
        const target = this.handCardPosition(playerIndex, cardIndex, this.players[playerIndex].hand.length);
        const fly = this.createCardView(null, from.x, from.y, CARD.humanW, CARD.humanH, { faceUp: false });
        this.cards.add(fly);
        await new Promise(resolve => {
            this.tweens.add({
                targets: fly,
                x: target.x,
                y: target.y,
                scaleX: target.w / CARD.humanW,
                scaleY: target.h / CARD.humanH,
                duration: 170,
                ease: "Sine.easeOut",
                onComplete: () => {
                    fly.destroy();
                    resolve();
                }
            });
        });
    }

    showMessage(message) {
        this.messageText.setText(message);
        this.messageText.setVisible(true);
    }

    sleep(ms) {
        return new Promise(resolve => this.time.delayedCall(ms, resolve));
    }

    isCurrentRun(runId) {
        return this.runId === runId;
    }

    playerToRight(playerIndex) {
        return (playerIndex + 1) % 4;
    }

    priorityOrder(originIndex, includeOrigin) {
        const order = [];
        const start = includeOrigin ? originIndex : this.playerToRight(originIndex);
        for (let i = 0; i < 4; i += 1) {
            const index = (start + i) % 4;
            if (!includeOrigin && index === originIndex) continue;
            order.push(index);
        }
        return order;
    }

    removeExposedFromDiscard(card) {
        if (this.discardPile[0]?.id === card.id) {
            this.discardPile.shift();
        }
    }

    pointInsideDiscard(x, y) {
        const pos = this.discardPosition();
        return x >= pos.x - CARD.deckW / 2 &&
            x <= pos.x + CARD.deckW / 2 &&
            y >= pos.y - CARD.deckH / 2 &&
            y <= pos.y + CARD.deckH / 2;
    }

    pointInsideDeck(x, y) {
        const pos = this.deckPosition();
        return x >= pos.x - CARD.deckW / 2 &&
            x <= pos.x + CARD.deckW / 2 &&
            y >= pos.y - CARD.deckH / 2 &&
            y <= pos.y + CARD.deckH / 2;
    }

    pointInsidePlayerDropArea(playerIndex, x, y) {
        const area = this.playerDropArea(playerIndex);
        return x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h;
    }

    pointInsideStrategyDropArea(x, y) {
        const area = this.strategyDropArea();
        return x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h;
    }

    strategyDropArea() {
        const { width, height } = this.scale;
        return { x: width / 2 - 280, y: height - 286, w: 560, h: 106 };
    }

    meldIndexAtPoint(playerIndex, x, y) {
        const player = this.players[playerIndex];
        if (playerIndex !== HUMAN_INDEX) return null;

        const layout = this.meldLayoutFor(playerIndex);
        const base = this.meldPosition(playerIndex);
        const gap = 28;
        const panelH = this.meldPanelHeight(layout);
        const widths = player.melds.map(meld => this.meldGroupWidth(meld.cards.length, layout));
        const totalWidth = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, widths.length - 1) * gap;
        let cursorX = this.scale.width / 2 - totalWidth / 2;

        for (let meldIndex = 0; meldIndex < player.melds.length; meldIndex += 1) {
            const groupW = widths[meldIndex];
            const left = cursorX;
            const top = base.y - panelH / 2;
            if (x >= left && x <= left + groupW && y >= top && y <= top + panelH) {
                return meldIndex;
            }
            cursorX += groupW + gap;
        }
        return null;
    }

    playerDropArea(playerIndex) {
        const { width, height } = this.scale;
        if (playerIndex === 1) return { x: width - 138, y: height / 2 - 200, w: 132, h: 400 };
        if (playerIndex === 2) return { x: width / 2 - 220, y: 20, w: 440, h: 128 };
        if (playerIndex === 3) return { x: 6, y: height / 2 - 200, w: 132, h: 400 };
        return { x: width / 2 - 260, y: height - 152, w: 520, h: 146 };
    }

    deckPosition() {
        return { x: this.scale.width / 2 - 62, y: this.scale.height / 2 - 10 };
    }

    discardPosition() {
        return { x: this.scale.width / 2 + 62, y: this.scale.height / 2 - 10 };
    }

    labelPosition(playerIndex) {
        const { width, height } = this.scale;
        const positions = [
            { x: width / 2, y: height - 166 },
            { x: width - 72, y: height / 2 - 156 },
            { x: width / 2, y: 36 },
            { x: 72, y: height / 2 - 156 }
        ];
        return positions[playerIndex];
    }

    handCardPosition(playerIndex, index, total) {
        const { width, height } = this.scale;
        if (playerIndex === 0) {
            const gap = 48;
            const start = width / 2 - ((total - 1) * gap) / 2;
            return { x: start + index * gap, y: height - 82, w: CARD.humanW, h: CARD.humanH };
        }
        if (playerIndex === 2) {
            const gap = 32;
            const start = width / 2 - ((total - 1) * gap) / 2;
            return { x: start + index * gap, y: 78, w: CARD.botW, h: CARD.botH };
        }
        const gap = 31;
        const start = height / 2 - ((total - 1) * gap) / 2;
        const x = playerIndex === 1 ? width - 52 : 52;
        return { x, y: start + index * gap, w: CARD.botW, h: CARD.botH };
    }

    meldPosition(playerIndex) {
        const { width, height } = this.scale;
        const positions = [
            { x: width / 2 - 92, y: height - 228 },
            { x: width - 210, y: height / 2 - 86 },
            { x: width / 2 - 92, y: 162 },
            { x: 168, y: height / 2 - 86 }
        ];
        return positions[playerIndex];
    }
}
