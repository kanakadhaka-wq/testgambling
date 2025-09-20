// Blackjack Game with 0.5% House Edge
class BlackjackGame {
    constructor() {
        this.balance = 1000;
        this.currentBet = 0;
        this.deck = [];
        this.playerHand = [];
        this.dealerHand = [];
        this.gameState = 'betting'; // betting, playing, dealer, finished
        this.dealerHoleCard = null;
        this.freshDeal = false;
        this.sideBets = { bet21: 0, betPairs: 0, betBust: 0 };
        this.sideBetWins = { win21: 0, winPairs: 0, winBust: 0 };
        this.prevChipBets = { main: 0, bet21: 0, betPairs: 0, betBust: 0 };
        
        // Game history
        this.gameHistory = [];
        this.maxHistoryItems = 50; // Maximum number of history items to keep
        
        // Split hands tracking
        this.splitHands = [];
        this.currentHandIndex = 0;
        this.isSplit = false;
        
        // Statistics
        this.stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            totalWagered: 0,
            netProfit: 0,
            currentWinStreak: 0,
            maxWinStreak: 0,
            currentLoseStreak: 0,
            maxLoseStreak: 0
        };
        
        // House edge adjustment (0.5%)
        this.houseEdgeMultiplier = 0.995; // 99.5% RTP
        
        this.initializeGame();
        this.loadStats();
    }
    
    initializeGame() {
        this.createDeck();
        this.shuffleDeck();
        this.bindEvents();
        this.updateDisplay();
        this.updateStats();
    }
    
    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        this.deck = [];
        for (let suit of suits) {
            for (let rank of ranks) {
                this.deck.push({
                    rank: rank,
                    suit: suit,
                    value: this.getCardValue(rank),
                    color: (suit === '♥' || suit === '♦') ? 'red' : 'black'
                });
            }
        }
    }
    
    getCardValue(rank) {
        if (rank === 'A') return 11;
        if (['J', 'Q', 'K'].includes(rank)) return 10;
        return parseInt(rank);
    }
    
    shuffleDeck() {
        // Fisher-Yates shuffle
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    
    dealCard() {
        if (this.deck.length < 10) {
            this.createDeck();
            this.shuffleDeck();
        }
        return this.deck.pop();
    }
    
    calculateHandValue(hand) {
        let value = 0;
        let aces = 0;
        
        for (let card of hand) {
            if (card.rank === 'A') {
                aces++;
                value += 11;
            } else {
                value += card.value;
            }
        }
        
        // Adjust for aces
        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }
        
        return value;
    }
    
    bindEvents() {
        // Typed bet inputs
        const mainBetInput = document.getElementById('mainBetInput');
        const bet21Input = document.getElementById('bet21');
        const betPairsInput = document.getElementById('betPairs');
        const betBustInput = document.getElementById('betBust');
        const totalWagerDisplay = document.getElementById('totalWagerDisplay');
        const dealBtn = document.getElementById('dealBtn');
        
        // Clear history button
        const clearHistoryBtn = document.getElementById('clearHistory');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearGameHistory();
                this.showMessage('Game history cleared');
            });
        }
        const updateTotals = () => {
            this.currentBet = this.parsePositiveInt(mainBetInput.value);
            this.sideBets.bet21 = this.parsePositiveInt(bet21Input.value);
            this.sideBets.betPairs = this.parsePositiveInt(betPairsInput.value);
            this.sideBets.betBust = this.parsePositiveInt(betBustInput.value);
            const total = this.currentBet + this.sideBets.bet21 + this.sideBets.betPairs + this.sideBets.betBust;
            totalWagerDisplay.textContent = `$${total.toFixed(2)}`;
            this.updateDisplay();
            this.updateChipRail();
            this.animateChipStackIfIncreased();
            // Enable/disable Deal based on validity
            const canDeal = total > 0 && total <= this.balance && this.gameState === 'betting';
            if (dealBtn) dealBtn.disabled = !canDeal;
            // Play shuffle sound when placing bet
            if (total > 0 && total !== this.lastTotal) {
                this.playSound('shuffle');
            }
            this.lastTotal = total;
        };
        [mainBetInput, bet21Input, betPairsInput, betBustInput].forEach(el => {
            el?.addEventListener('input', updateTotals);
        });
        // Enter key to Deal from main bet input
        mainBetInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                updateTotals();
                if (!dealBtn?.disabled) {
                    this.startNewRound();
                }
            }
        });
        document.getElementById('betMin')?.addEventListener('click', () => {
            mainBetInput.value = '1';
            updateTotals();
        });
        document.getElementById('betMax')?.addEventListener('click', () => {
            mainBetInput.value = Math.max(0, Math.floor(this.balance)).toString();
            updateTotals();
        });
        document.getElementById('clearBet')?.addEventListener('click', () => {
            mainBetInput.value = '';
            bet21Input.value = '';
            betPairsInput.value = '';
            betBustInput.value = '';
            updateTotals();
        });
        
        // Action buttons
        // Clear bet handled above
        document.getElementById('dealBtn').addEventListener('click', () => this.startNewRound());
        document.getElementById('hitBtn').addEventListener('click', () => this.hit());
        document.getElementById('standBtn').addEventListener('click', () => this.stand());
        document.getElementById('doubleBtn').addEventListener('click', () => this.doubleDown());
        document.getElementById('splitBtn').addEventListener('click', () => this.split());
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        
        // Stats toggle
        document.getElementById('statsToggle').addEventListener('click', () => {
            const content = document.getElementById('statsContent');
            content.classList.toggle('open');
        });

        // Deposit modal
        const depositBtn = document.getElementById('depositBtn');
        const depositModal = document.getElementById('depositModal');
        const depositClose = document.getElementById('depositClose');
        const copyBtn = document.getElementById('copyAddress');
        const simulateBtn = document.getElementById('simulateCredit');
        const simulateAmount = document.getElementById('simulateAmount');
        const addressInput = document.getElementById('depositAddress');

        if (depositBtn && depositModal) {
            depositBtn.addEventListener('click', () => {
                depositModal.style.display = 'flex';
            });
        }
        if (depositClose && depositModal) {
            depositClose.addEventListener('click', () => {
                depositModal.style.display = 'none';
            });
        }
        if (depositModal) {
            depositModal.addEventListener('click', (e) => {
                if (e.target === depositModal) depositModal.style.display = 'none';
            });
        }
        // Provider selection
        document.querySelectorAll('.provider-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.provider-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                const coin = card.getAttribute('data-coin');
                const label = coin === 'USDT' ? 'USDT (TRC20)' : coin === 'BTC' ? 'Bitcoin' : 'Ethereum';
                document.getElementById('selectedAsset').textContent = label;
                // Demo addresses
                const addr = coin === 'USDT' ? 'TRX-TEST-ADDRESS-1234-ABCD' : coin === 'BTC' ? 'bc1q-demo-btc-addr-xyz' : '0xDEMOETHADDRESS1234';
                addressInput.value = addr;
            });
        });
        // Copy address
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                addressInput.select();
                document.execCommand('copy');
                copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => (copyBtn.innerHTML = '<i class="fas fa-copy"></i>'), 1000);
            });
        }
        // Simulate credit
        if (simulateBtn) {
            simulateBtn.addEventListener('click', () => {
                const amt = parseFloat(simulateAmount.value || '0');
                if (!isFinite(amt) || amt <= 0) return;
                this.balance += Math.floor(amt);
                this.saveStats();
                this.updateDisplay();
                this.showMessage('Deposit credited. Good luck!');
                depositModal.style.display = 'none';
                // Re-evaluate Deal enablement
                if (typeof updateTotals === 'function') updateTotals();
            });
        }

        // Make stats panel draggable
        this.initDraggableStats();

        // Initialize totals once on load
        updateTotals();
    }
    
    placeBet(amount) {
        if (this.gameState !== 'betting') return;
        if (amount > this.balance) amount = this.balance;
        
        this.currentBet = Math.min(this.currentBet + amount, this.balance);
        this.playSound('chip');
        this.updateDisplay();
        
        // Add chip animation
        const betAmount = document.getElementById('currentBet');
        betAmount.classList.add('chip-animation');
        setTimeout(() => betAmount.classList.remove('chip-animation'), 300);
    }
    
    clearBet() {
        if (this.gameState !== 'betting') return;
        const mainBetInput = document.getElementById('mainBetInput');
        const bet21Input = document.getElementById('bet21');
        const betPairsInput = document.getElementById('betPairs');
        const betBustInput = document.getElementById('betBust');
        if (mainBetInput) mainBetInput.value = '';
        if (bet21Input) bet21Input.value = '';
        if (betPairsInput) betPairsInput.value = '';
        if (betBustInput) betBustInput.value = '';
        this.currentBet = 0;
        this.sideBets = { bet21: 0, betPairs: 0, betBust: 0 };
        const totalWagerDisplay = document.getElementById('totalWagerDisplay');
        if (totalWagerDisplay) totalWagerDisplay.textContent = '$0.00';
        this.updateDisplay();
        this.updateChipRail();
    }
    
    startNewRound() {
        // Read inputs before starting
        const mainBetInput = document.getElementById('mainBetInput');
        const bet21Input = document.getElementById('bet21');
        const betPairsInput = document.getElementById('betPairs');
        const betBustInput = document.getElementById('betBust');
        this.currentBet = this.parsePositiveInt(mainBetInput?.value);
        this.sideBets.bet21 = this.parsePositiveInt(bet21Input?.value);
        this.sideBets.betPairs = this.parsePositiveInt(betPairsInput?.value);
        this.sideBets.betBust = this.parsePositiveInt(betBustInput?.value);
        const totalToWager = this.currentBet + this.sideBets.bet21 + this.sideBets.betPairs + this.sideBets.betBust;

        if (this.gameState !== 'betting') return;
        if (this.currentBet === 0) {
            this.showMessage('Enter a main bet to start the hand.');
            return;
        }
        if (totalToWager <= 0) {
            this.showMessage('Please enter a valid bet amount.');
            return;
        }
        if (totalToWager > this.balance) {
            this.showMessage('Insufficient balance!');
            return;
        }
        
        this.balance -= totalToWager;
        this.stats.totalWagered += totalToWager;
        this.gameState = 'playing';
        this.freshDeal = true;
        
        // Clear hands
        this.playerHand = [];
        this.dealerHand = [];
        this.dealerHoleCard = null;
        
        // Deal initial cards
        this.playerHand.push(this.dealCard());
        this.dealerHand.push(this.dealCard());
        this.playerHand.push(this.dealCard());
        this.dealerHoleCard = this.dealCard(); // Hidden card
        
        this.updateDisplay();
        this.renderCards({ forceFullRender: true, withAnimation: true });
        this.freshDeal = false;
        
        // Check for blackjack
        if (this.calculateHandValue(this.playerHand) === 21) {
            this.checkForBlackjack();
        } else {
            this.showGameControls();
        }
        
        // Evaluate side bets that settle on deal (21+3 and Pairs)
        this.evaluateSideBetsOnDeal();
        this.updateChipRail();

        this.playSound('card');
    }
    
    hit() {
        if (this.gameState !== 'playing') return;
        
        if (this.isSplit) {
            const currentHand = this.splitHands[this.currentHandIndex];
            currentHand.push(this.dealCard());
            this.renderSplitHands();
            this.playSound('card');
            
            const handValue = this.calculateHandValue(currentHand);
            if (handValue > 21) {
                this.showMessage(`Hand ${this.currentHandIndex + 1} busts!`);
                this.nextSplitHand();
            } else {
                this.updateDisplay();
            }
        } else {
            this.playerHand.push(this.dealCard());
            this.renderCards({ appendOnly: true, withAnimation: true });
            this.playSound('card');
            
            const playerValue = this.calculateHandValue(this.playerHand);
            if (playerValue > 21) {
                this.bust();
            } else {
                this.updateDisplay();
            }
        }
    }
    
    stand() {
        if (this.gameState !== 'playing') return;
        
        if (this.isSplit) {
            this.nextSplitHand();
        } else {
            this.gameState = 'dealer';
            this.dealerHand.push(this.dealerHoleCard);
            this.dealerHoleCard = null;
            
            this.hideGameControls();
            // Reveal hole card without re-animating whole row
            this.renderDealerCards({ forceFullRender: true, withAnimation: false });
            
            // Dealer plays
            setTimeout(() => this.dealerPlay(), 1000);
        }
    }
    
    doubleDown() {
        if (this.gameState !== 'playing') return;
        if (this.currentBet > this.balance) {
            this.showMessage('Insufficient balance to double down!');
            return;
        }
        
        this.balance -= this.currentBet;
        this.stats.totalWagered += this.currentBet;
        this.currentBet *= 2;
        
        if (this.isSplit) {
            const currentHand = this.splitHands[this.currentHandIndex];
            if (currentHand.length !== 2) return;
            
            currentHand.push(this.dealCard());
            this.renderSplitHands();
            this.playSound('card');
            
            const handValue = this.calculateHandValue(currentHand);
            if (handValue > 21) {
                this.showMessage(`Hand ${this.currentHandIndex + 1} busts!`);
            }
            this.nextSplitHand();
        } else {
            if (this.playerHand.length !== 2) return;
            
            this.playerHand.push(this.dealCard());
            this.renderCards({ appendOnly: true, withAnimation: true });
            this.playSound('card');
            
            const playerValue = this.calculateHandValue(this.playerHand);
            if (playerValue > 21) {
                this.bust();
            } else {
                this.stand();
            }
        }
        
        this.updateDisplay();
    }
    
    split() {
        if (this.gameState !== 'playing' || this.playerHand.length !== 2) return;
        if (this.playerHand[0].rank !== this.playerHand[1].rank) return;
        if (this.currentBet > this.balance) {
            this.showMessage('Insufficient balance to split!');
            return;
        }
        
        // Deduct additional bet for split
        this.balance -= this.currentBet;
        this.stats.totalWagered += this.currentBet;
        
        // Create split hands
        this.isSplit = true;
        this.splitHands = [
            [this.playerHand[0]],
            [this.playerHand[1]]
        ];
        this.currentHandIndex = 0;
        
        // Deal one card to each split hand
        this.splitHands[0].push(this.dealCard());
        this.splitHands[1].push(this.dealCard());
        
        this.playSound('card');
        this.renderSplitHands();
        this.updateDisplay();
        this.showMessage(`Playing split hand 1 of 2`);
    }
    
    dealerPlay() {
        const dealerValue = this.calculateHandValue(this.dealerHand);
        
        if (dealerValue < 17) {
            this.dealerHand.push(this.dealCard());
            this.renderDealerCards({ appendOnly: true, withAnimation: true });
            this.playSound('card');
            this.updateDisplay();
            setTimeout(() => this.dealerPlay(), 1000);
        } else {
            this.determineWinner();
        }
    }
    
    bust() {
        this.stats.netProfit -= this.currentBet;
        this.endRound('Bust! You lose.');
    }
    
    checkForBlackjack() {
        const playerBlackjack = this.calculateHandValue(this.playerHand) === 21;
        
        // Reveal dealer's hole card to check for blackjack
        this.dealerHand.push(this.dealerHoleCard);
        this.dealerHoleCard = null;
        this.renderDealerCards({ forceFullRender: true, withAnimation: false });
        
        const dealerBlackjack = this.calculateHandValue(this.dealerHand) === 21;
        
        if (playerBlackjack && dealerBlackjack) {
            this.balance += this.currentBet; // Push
            this.endRound('Both have Blackjack! Push.');
        } else if (playerBlackjack) {
            // Apply house edge to blackjack payout (1.5x becomes ~1.49x)
            const payout = Math.floor(this.currentBet * 2.5 * this.houseEdgeMultiplier);
            this.balance += payout;
            this.stats.netProfit += (payout - this.currentBet);
            this.stats.gamesWon++;
            this.endRound('Blackjack! You win!', true);
            this.animateChipPayout(payout - this.currentBet, 'chipMain', 'black');
            this.playSound('win');
        } else if (dealerBlackjack) {
            this.stats.netProfit -= this.currentBet;
            this.endRound('Dealer has Blackjack! You lose.');
        } else {
            // No blackjack, continue game: restore hole card UI
            const revealed = this.dealerHand.pop();
            this.dealerHoleCard = revealed;
            this.renderDealerCards({ forceFullRender: true, withAnimation: false });
            this.showGameControls();
        }
    }
    
    determineWinner() {
        const dealerValue = this.calculateHandValue(this.dealerHand);
        
        if (this.isSplit) {
            this.determineSplitWinners(dealerValue);
        } else {
            const playerValue = this.calculateHandValue(this.playerHand);
            
            if (dealerValue > 21) {
                // Apply house edge to win payout
                const payout = Math.floor(this.currentBet * 2 * this.houseEdgeMultiplier);
                this.balance += payout;
                this.stats.netProfit += (payout - this.currentBet);
                this.stats.gamesWon++;
                this.endRound('Dealer busts! You win!', true);
                // Evaluate Bust It side bet after dealer bust
                this.evaluateBustItPayout();
                // Animate main bet payout to main chip
                this.animateChipPayout(payout - this.currentBet, 'chipMain', 'black');
                this.playSound('win');
            } else if (playerValue > dealerValue) {
                // Apply house edge to win payout
                const payout = Math.floor(this.currentBet * 2 * this.houseEdgeMultiplier);
                this.balance += payout;
                this.stats.netProfit += (payout - this.currentBet);
                this.stats.gamesWon++;
                this.endRound('You win!', true);
                this.animateChipPayout(payout - this.currentBet, 'chipMain', 'black');
                this.playSound('win');
            } else if (playerValue < dealerValue) {
                this.stats.netProfit -= this.currentBet;
                this.endRound('Dealer wins! You lose.');
            } else {
                this.balance += this.currentBet; // Push
                this.endRound('Push! It\'s a tie.');
            }
        }
    }
    
    determineSplitWinners(dealerValue) {
        let wins = 0;
        let losses = 0;
        let pushes = 0;
        let totalPayout = 0;
        
        this.splitHands.forEach((hand, index) => {
            const handValue = this.calculateHandValue(hand);
            const betAmount = this.currentBet / 2; // Each split hand gets half the doubled bet
            
            if (handValue > 21) {
                // Hand busted
                losses++;
                this.stats.netProfit -= betAmount;
            } else if (dealerValue > 21 || handValue > dealerValue) {
                // Hand wins
                wins++;
                const payout = Math.floor(betAmount * 2 * this.houseEdgeMultiplier);
                this.balance += payout;
                this.stats.netProfit += (payout - betAmount);
                totalPayout += (payout - betAmount);
            } else if (handValue < dealerValue) {
                // Hand loses
                losses++;
                this.stats.netProfit -= betAmount;
            } else {
                // Push
                pushes++;
                this.balance += betAmount;
            }
        });
        
        if (dealerValue > 21) {
            this.evaluateBustItPayout();
        }
        
        let message = `Split Results: ${wins} wins, ${losses} losses`;
        if (pushes > 0) message += `, ${pushes} pushes`;
        
        if (totalPayout > 0) {
            this.animateChipPayout(totalPayout, 'chipMain', 'black');
            this.playSound('win');
        }
        
        if (wins > losses) {
            this.stats.gamesWon++;
        }
        
        this.endRound(message, wins > 0);
    }
    
    addToHistory(result, amount, isWin) {
        const historyItem = {
            id: Date.now(),
            result: result,
            amount: amount,
            isWin: isWin,
            timestamp: new Date(),
            playerHand: [...this.playerHand],
            dealerHand: [...this.dealerHand],
            isSplit: this.isSplit,
            splitHands: this.isSplit ? [...this.splitHands] : []
        };
        
        // Add to beginning of array to show newest first
        this.gameHistory.unshift(historyItem);
        
        // Keep only the most recent items
        if (this.gameHistory.length > this.maxHistoryItems) {
            this.gameHistory = this.gameHistory.slice(0, this.maxHistoryItems);
        }
        
        this.renderGameHistory();
    }
    
    renderGameHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;
        
        if (this.gameHistory.length === 0) {
            historyList.innerHTML = '<div class="history-empty">No games played yet</div>';
            return;
        }
        
        historyList.innerHTML = '';
        
        this.gameHistory.forEach((game, index) => {
            const gameEl = document.createElement('div');
            gameEl.className = `history-item ${game.isWin ? 'win' : 'loss'}`;
            
            const resultText = game.isWin ? 'Win' : 'Loss';
            const amountClass = game.isWin ? 'win' : 'loss';
            const amountSign = game.isWin ? '+' : '-';
            
            gameEl.innerHTML = `
                <div class="history-details">
                    <span class="history-result">${game.result}</span>
                    <span class="history-time">${this.formatTime(game.timestamp)}</span>
                </div>
                <div class="history-amount ${amountClass}">
                    ${amountSign}$${Math.abs(game.amount).toFixed(2)}
                </div>
            `;
            
            historyList.appendChild(gameEl);
        });
    }
    
    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    clearHistory() {
        this.gameHistory = [];
        this.renderGameHistory();
    }
    
    endRound(message, isWin = false) {
        this.gameState = 'finished';
        this.stats.gamesPlayed++;
        
        // Update win/loss streaks
        if (isWin) {
            this.stats.currentWinStreak++;
            this.stats.currentLoseStreak = 0;
            this.stats.maxWinStreak = Math.max(this.stats.maxWinStreak, this.stats.currentWinStreak);
        } else {
            this.stats.currentLoseStreak++;
            this.stats.currentWinStreak = 0;
            this.stats.maxLoseStreak = Math.max(this.stats.maxLoseStreak, this.stats.currentLoseStreak);
        }
        
        // Add to game history
        if (this.currentBet > 0) {
            const winAmount = isWin ? this.currentBet * 2 : -this.currentBet;
            this.addToHistory(message, Math.abs(winAmount), isWin);
        }
        
        this.showMessage(message);
        this.hideGameControls();
        this.showNewGameButton();
        this.updateDisplay();
        this.updateStats();
        this.saveStats();
        
        // Add win/loss animation
        const gameStatus = document.getElementById('gameStatus');
        if (isWin) {
            gameStatus.classList.add('win-animation');
        } else if (!message.includes('Push')) {
            gameStatus.classList.add('loss-animation');
        }
        
        setTimeout(() => {
            gameStatus.classList.remove('win-animation', 'loss-animation');
        }, 600);
    }
    
    newGame() {
        this.gameState = 'betting';
        this.currentBet = 0;
        this.playerHand = [];
        this.dealerHand = [];
        this.dealerHoleCard = null;
        this.sideBets = { bet21: 0, betPairs: 0, betBust: 0 };
        this.sideBetWins = { win21: 0, winPairs: 0, winBust: 0 };
        
        // Reset split state
        this.splitHands = [];
        this.currentHandIndex = 0;
        this.isSplit = false;
        
        // Hide side bet notification when starting new game
        const notification = document.getElementById('sidebetNotification');
        if (notification) {
            notification.classList.remove('show');
        }
        
        this.showBettingControls();
        this.hideNewGameButton();
        this.updateDisplay();
        this.renderCards();
        this.showMessage('Place your bet to start playing!');
        // Re-enable inputs
        this.setBetInputsDisabled(false);
        this.updateChipRail();
        this.prevChipBets = { main: 0, bet21: 0, betPairs: 0, betBust: 0 };
    }
    
    // Split hand methods
    nextSplitHand() {
        this.currentHandIndex++;
        if (this.currentHandIndex >= this.splitHands.length) {
            // All split hands played, now dealer plays
            this.gameState = 'dealer';
            this.dealerHand.push(this.dealerHoleCard);
            this.dealerHoleCard = null;
            
            this.hideGameControls();
            this.renderDealerCards({ forceFullRender: true, withAnimation: false });
            setTimeout(() => this.dealerPlay(), 1000);
        } else {
            this.showMessage(`Playing split hand ${this.currentHandIndex + 1} of ${this.splitHands.length}`);
            this.updateDisplay();
        }
    }
    
    renderSplitHands() {
        const container = document.getElementById('playerCards');
        container.innerHTML = '';
        
        this.splitHands.forEach((hand, index) => {
            const handDiv = document.createElement('div');
            handDiv.className = `split-hand ${index === this.currentHandIndex ? 'active' : ''}`;
            handDiv.innerHTML = `<div class="split-label">Hand ${index + 1}</div>`;
            
            hand.forEach(card => {
                const cardDiv = this.createCardElement(card, true);
                handDiv.appendChild(cardDiv);
            });
            
            container.appendChild(handDiv);
        });
    }
    
    // UI Methods
    updateDisplay() {
        document.getElementById('balance').textContent = `$${this.balance.toFixed(2)}`;
        document.getElementById('currentBet').textContent = `$${this.currentBet.toFixed(2)}`;
        
        const playerValue = this.calculateHandValue(this.playerHand);
        const dealerValue = this.gameState === 'betting' || this.dealerHoleCard ? 
            this.calculateHandValue(this.dealerHand) : 
            this.calculateHandValue(this.dealerHand);
            
        document.getElementById('playerValue').textContent = this.playerHand.length ? playerValue : '0';
        document.getElementById('dealerValue').textContent = this.dealerHand.length ? dealerValue : '0';
        
        // Update button states
        const doubleBtn = document.getElementById('doubleBtn');
        const splitBtn = document.getElementById('splitBtn');
        
        const currentHand = this.isSplit ? this.splitHands[this.currentHandIndex] : this.playerHand;
        const canDouble = currentHand.length === 2 && this.currentBet <= this.balance;
        const canSplit = !this.isSplit && this.playerHand.length === 2 && 
                        this.playerHand[0].rank === this.playerHand[1].rank && 
                        this.currentBet <= this.balance;
        
        doubleBtn.disabled = !canDouble;
        splitBtn.disabled = !canSplit;
    }
    
    renderCards(options = {}) {
        this.renderPlayerCards(options);
        this.renderDealerCards(options);
    }
    
    renderPlayerCards({ forceFullRender = false, appendOnly = false, withAnimation = true } = {}) {
        const container = document.getElementById('playerCards');
        if (forceFullRender || this.freshDeal) {
            container.innerHTML = '';
            this.playerHand.forEach((card, index) => {
                const cardElement = this.createCardElement(card);
                if (withAnimation) {
                    cardElement.style.animationDelay = `${index * 0.1}s`;
                    cardElement.classList.add('card-deal');
                }
                container.appendChild(cardElement);
            });
            return;
        }
        // Append-only rendering
        const existing = container.children.length;
        for (let i = existing; i < this.playerHand.length; i++) {
            const card = this.playerHand[i];
            const cardElement = this.createCardElement(card);
            if (withAnimation) cardElement.classList.add('card-deal');
            container.appendChild(cardElement);
        }
    }
    
    renderDealerCards({ forceFullRender = false, appendOnly = false, withAnimation = true } = {}) {
        const container = document.getElementById('dealerCards');
        if (forceFullRender || this.freshDeal) {
            container.innerHTML = '';
            this.dealerHand.forEach((card, index) => {
                const cardElement = this.createCardElement(card);
                if (withAnimation) {
                    cardElement.style.animationDelay = `${index * 0.1}s`;
                    cardElement.classList.add('card-deal');
                }
                container.appendChild(cardElement);
            });
            if (this.dealerHoleCard) {
                const holeCardElement = this.createCardElement(null, true);
                if (withAnimation) holeCardElement.classList.add('card-deal');
                container.appendChild(holeCardElement);
            }
            return;
        }
        // Append-only rendering
        const expected = this.dealerHand.length + (this.dealerHoleCard ? 1 : 0);
        const existing = container.children.length;
        for (let i = existing; i < expected; i++) {
            if (i < this.dealerHand.length) {
                const card = this.dealerHand[i];
                const cardElement = this.createCardElement(card);
                if (withAnimation) cardElement.classList.add('card-deal');
                container.appendChild(cardElement);
            } else if (this.dealerHoleCard) {
                const holeCardElement = this.createCardElement(null, true);
                if (withAnimation) holeCardElement.classList.add('card-deal');
                container.appendChild(holeCardElement);
            }
        }
    }
    
    createCardElement(card, isHoleCard = false) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        
        if (isHoleCard) {
            cardDiv.classList.add('card-back');
            cardDiv.innerHTML = '<i class="fas fa-question"></i>';
        } else {
            cardDiv.classList.add(card.color);
            cardDiv.innerHTML = `
                <div class="card-top">
                    <div class="card-rank">${card.rank}</div>
                    <div class="card-suit">${card.suit}</div>
                </div>
                <div class="card-center">${card.suit}</div>
                <div class="card-bottom">
                    <div class="card-rank">${card.rank}</div>
                    <div class="card-suit">${card.suit}</div>
                </div>
            `;
        }
        
        return cardDiv;
    }
    
    showMessage(message) {
        document.querySelector('.status-message').textContent = message;
    }
    
    showBettingControls() {
        document.getElementById('bettingControls').style.display = 'block';
        // Re-evaluate Deal button availability
        const fakeEvt = new Event('input');
        document.getElementById('mainBetInput')?.dispatchEvent(fakeEvt);
    }
    
    showGameControls() {
        document.getElementById('bettingControls').style.display = 'none';
        document.getElementById('gameControls').style.display = 'flex';
        this.setBetInputsDisabled(true);
    }
    
    hideGameControls() {
        document.getElementById('gameControls').style.display = 'none';
    }
    
    showNewGameButton() {
        document.getElementById('newGameSection').style.display = 'flex';
    }
    
    hideNewGameButton() {
        document.getElementById('newGameSection').style.display = 'none';
    }

    setBetInputsDisabled(disabled) {
        ['mainBetInput','bet21','betPairs','betBust','betMin','betMax','clearBet'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = disabled;
        });
    }
    
    updateStats() {
        document.getElementById('gamesPlayed').textContent = this.stats.gamesPlayed;
        document.getElementById('gamesWon').textContent = this.stats.gamesWon;
        
        const winRate = this.stats.gamesPlayed > 0 ? 
            ((this.stats.gamesWon / this.stats.gamesPlayed) * 100).toFixed(1) : '0';
        document.getElementById('winRate').textContent = `${winRate}%`;
        
        document.getElementById('totalWagered').textContent = `$${this.stats.totalWagered.toFixed(2)}`;
        document.getElementById('netProfit').textContent = `$${this.stats.netProfit.toFixed(2)}`;
    }
    
    saveStats() {
        localStorage.setItem('blackjackStats', JSON.stringify(this.stats));
        localStorage.setItem('blackjackHistory', JSON.stringify(this.gameHistory));
        localStorage.setItem('blackjackBalance', this.balance.toString());
    }
    
    loadStats() {
        const savedStats = localStorage.getItem('blackjackStats');
        const savedHistory = localStorage.getItem('blackjackHistory');
        const savedBalance = localStorage.getItem('blackjackBalance');
        
        if (savedStats) {
            this.stats = JSON.parse(savedStats);
        }
        
        if (savedHistory) {
            this.gameHistory = JSON.parse(savedHistory);
            // Ensure timestamps are Date objects
            this.gameHistory = this.gameHistory.map(item => ({
                ...item,
                timestamp: new Date(item.timestamp)
            }));
            this.updateHistoryDisplay();
        }
        
        if (savedBalance) {
            this.balance = parseFloat(savedBalance);
        }
    }
    
    playSound(type) {
        try {
            let audioId = 'chipSound';
            switch(type) {
                case 'card': audioId = 'cardSound'; break;
                case 'shuffle': audioId = 'shuffleSound'; break;
                case 'win': audioId = 'winSound'; break;
                case 'chip': audioId = 'chipSound'; break;
            }
            
            // Generate audio programmatically since we can't use external files
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            let frequency, duration;
            
            switch(type) {
                case 'card':
                    frequency = 300;
                    duration = 0.15;
                    break;
                case 'shuffle':
                    frequency = 150;
                    duration = 0.3;
                    break;
                case 'win':
                    frequency = 800;
                    duration = 0.5;
                    break;
                case 'chip':
                default:
                    frequency = 400;
                    duration = 0.2;
                    break;
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = type === 'win' ? 'sine' : (type === 'card' ? 'triangle' : 'square');
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {
            // Ignore audio errors
        }
    }

    updateChipRail() {
        // Update main chip amount and inactive state
        const chip = document.getElementById('chipMain');
        const label = document.getElementById('chipMainAmt');
        if (chip && label) {
            label.textContent = `$${(this.currentBet || 0).toFixed(2)}`;
            chip.classList.toggle('inactive', !this.currentBet);
        }
    }

    animateChipPayout(amount, toElementId, color = 'black') {
        if (!amount || amount <= 0) return;
        const toEl = document.getElementById(toElementId);
        const dealerArea = document.getElementById('dealerCards');
        if (!toEl || !dealerArea) return;
        const fromRect = dealerArea.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        const chip = document.createElement('div');
        chip.className = `chip-float ${color === 'red' ? 'red' : 'black'}`;
        chip.textContent = `$${Math.floor(amount).toString()}`;
        chip.style.left = `${fromRect.left + fromRect.width / 2 - 36}px`;
        chip.style.top = `${fromRect.top + fromRect.height / 2 - 36}px`;
        chip.style.transform = 'translate(0, 0)';
        chip.style.opacity = '1';
        document.body.appendChild(chip);

        // Trigger movement towards target chip stack
        const dx = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2);
        const dy = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2);
        requestAnimationFrame(() => {
            chip.style.transform = `translate(${dx}px, ${dy}px)`;
            chip.style.opacity = '0.2';
        });
        setTimeout(() => {
            chip.remove();
            this.playSound('chip');
            // paid glow on destination chip
            const dest = document.getElementById(toElementId);
            if (dest) {
                dest.classList.add('chip-paid');
                setTimeout(() => dest.classList.remove('chip-paid'), 500);
            }
            this.showBalanceFlash(amount);
        }, 850);
    }

    animateChipStackIfIncreased() {
        // Trigger a small pop chip on chips whose value increased since last update
        const map = [
            { key: 'main', amt: this.currentBet, id: 'chipMain', color: 'black' },
            { key: 'bet21', amt: this.sideBets.bet21, id: 'chip21', color: 'red' },
            { key: 'betPairs', amt: this.sideBets.betPairs, id: 'chipPairs', color: 'red' },
            { key: 'betBust', amt: this.sideBets.betBust, id: 'chipBust', color: 'red' },
        ];
        for (const item of map) {
            const prev = this.prevChipBets[item.key] || 0;
            if (item.amt > prev) {
                this.popChip(item.id, item.color);
            }
            this.prevChipBets[item.key] = item.amt;
        }
    }

    popChip(targetId, color = 'black') {
        const target = document.getElementById(targetId);
        if (!target) return;
        const pop = document.createElement('div');
        pop.className = `chip-pop ${color === 'red' ? 'red' : 'black'}`;
        target.appendChild(pop);
        requestAnimationFrame(() => pop.classList.add('animate'));
        setTimeout(() => pop.remove(), 520);
    }

    showBalanceFlash(amount) {
        const flash = document.getElementById('balanceFlash');
        if (!flash || !amount) return;
        flash.textContent = `+ $${Math.floor(amount).toString()}`;
        flash.classList.add('show');
        setTimeout(() => flash.classList.remove('show'), 900);
    }

    showSidebetNotification(text) {
        const notification = document.getElementById('sidebetNotification');
        const textEl = document.getElementById('sidebetText');
        if (!notification || !textEl) return;
        
        textEl.textContent = text;
        notification.classList.add('show');
        this.playSound('win');
        
        // Don't auto-hide - will be hidden when hand ends
    }

    // Helpers and side bet evaluation
    parsePositiveInt(v) {
        const n = parseInt(v || '0', 10);
        return Number.isFinite(n) && n > 0 ? n : 0;
    }

    evaluateSideBetsOnDeal() {
        const bet21 = this.sideBets.bet21;
        const betPairs = this.sideBets.betPairs;
        if (!bet21 && !betPairs) return;
        // Player's first two + dealer upcard
        if (this.playerHand.length < 2 || this.dealerHand.length < 1) return;
        const c1 = this.playerHand[0];
        const c2 = this.playerHand[1];
        const up = this.dealerHand[0];

        // 21+3 evaluation
        // Paytable: Suited Trips 100:1, Straight Flush 40:1, Three of a Kind 30:1, Straight 10:1, Flush 5:1
        if (bet21) {
            const payoutMult = this.eval21Plus3(c1, c2, up);
            if (payoutMult > 0) {
                const win = bet21 * payoutMult;
                this.balance += win;
                this.stats.netProfit += win; // side bet wins don't subtract original here; we already deducted at deal
                this.sideBetWins.win21 = win;
                this.showMessage(`21+3 win: ${payoutMult}:1 pays $${win.toFixed(2)}`);
                this.showSidebetNotification(`21+3 win: ${payoutMult}:1 pays $${win.toFixed(2)}`);
            }
        }

        // Pairs evaluation
        // Paytable: Perfect Pair 25:1, Colored Pair 12:1, Mixed Pair 6:1
        if (betPairs) {
            const payoutMult = this.evalPairs(c1, c2);
            if (payoutMult > 0) {
                const win = betPairs * payoutMult;
                this.balance += win;
                this.stats.netProfit += win;
                this.sideBetWins.winPairs = win;
                this.showMessage(`Pairs win: ${payoutMult}:1 pays $${win.toFixed(2)}`);
                this.showSidebetNotification(`Perfect Pair: ${payoutMult}:1 pays $${win.toFixed(2)}`);
            }
        }
        this.updateDisplay();
    }

    evaluateBustItPayout() {
        const betBust = this.sideBets.betBust;
        if (!betBust) return;
        // Count dealer cards when busting
        const dealerCardsCount = this.dealerHand.length;
        // Common paytable example (cards when dealer busts): 3:1, 4:6, 5:10, 6:15, 7:25, 8+:50
        let mult = 0;
        switch (dealerCardsCount) {
            case 3: mult = 3; break;
            case 4: mult = 6; break;
            case 5: mult = 10; break;
            case 6: mult = 15; break;
            case 7: mult = 25; break;
            default: mult = dealerCardsCount >= 8 ? 50 : 0; break;
        }
        if (mult > 0) {
            const win = betBust * mult;
            this.balance += win;
            this.stats.netProfit += win;
            this.sideBetWins.winBust = win;
            this.showMessage(`Bust It win: ${mult}:1 pays $${win.toFixed(2)}`);
            this.updateDisplay();
            this.showSidebetNotification(`Bust It: ${mult}:1 pays $${win.toFixed(2)}`);
        }
    }

    eval21Plus3(a, b, c) {
        const ranks = [a.rank, b.rank, c.rank];
        const suits = [a.suit, b.suit, c.suit];
        const values = ranks.map(r => (r === 'A' ? 1 : r === 'J' ? 11 : r === 'Q' ? 12 : r === 'K' ? 13 : parseInt(r)));
        values.sort((x, y) => x - y);
        const allSameSuit = suits.every(s => s === suits[0]);
        const allSameRank = ranks.every(r => r === ranks[0]);
        const isStraight = (values[2] - values[0] === 2 && new Set(values).size === 3) ||
                          (values.toString() === '1,12,13'); // A-Q-K as straight high

        if (allSameRank && allSameSuit) return 100; // suited trips
        if (isStraight && allSameSuit) return 40; // straight flush
        if (allSameRank) return 30; // trips
        if (isStraight) return 10; // straight
        if (allSameSuit) return 5; // flush
        return 0;
    }

    evalPairs(a, b) {
        if (a.rank !== b.rank) return 0;
        const isRed = s => (s === '♥' || s === '♦');
        if (a.suit === b.suit) return 25; // perfect pair
        if (isRed(a.suit) === isRed(b.suit)) return 12; // colored pair
        return 6; // mixed pair
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BlackjackGame();
});

// Add some utility functions for enhanced gameplay
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    
    switch(e.key.toLowerCase()) {
        case 'h':
            document.getElementById('hitBtn')?.click();
            break;
        case 's':
            document.getElementById('standBtn')?.click();
            break;
        case 'd':
            document.getElementById('doubleBtn')?.click();
            break;
        case 'r':
            document.getElementById('surrenderBtn')?.click();
            break;
        case ' ':
            e.preventDefault();
            if (document.getElementById('dealBtn').style.display !== 'none') {
                document.getElementById('dealBtn').click();
            } else {
                document.getElementById('newGameBtn')?.click();
            }
            break;
    }
});
