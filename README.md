# AI Blackjack Casino - 0.5% House Edge

A professional-grade blackjack game with AI dealer, realistic betting system, and a legitimate 0.5% house edge similar to Shuffle.com's implementation.

## 🎮 Features

### Core Gameplay
- **Authentic Blackjack Rules**: Standard blackjack with proper card values and game flow
- **AI Dealer**: Intelligent dealer that follows casino rules (hits on soft 17)
- **0.5% House Edge**: Mathematically accurate house edge for realistic casino experience
- **99.5% RTP**: Return to Player rate matching professional online casinos

### Betting System
- **Dynamic Betting**: Multiple bet amounts ($5, $10, $25, $50, $100, MAX)
- **Balance Management**: Persistent balance tracking with localStorage
- **Bet Validation**: Prevents over-betting and invalid bets

### Game Actions
- **Hit**: Take another card
- **Stand**: Keep current hand and let dealer play
- **Double Down**: Double your bet and take exactly one more card
- **Surrender**: Forfeit half your bet and end the hand
- **Insurance**: (Coming soon) Bet against dealer blackjack

### Advanced Features
- **Statistics Tracking**: Win rate, games played, total wagered, net profit
- **Persistent Data**: Game state and stats saved between sessions
- **Animations**: Smooth card dealing and chip stacking animations
- **Sound Effects**: Card flip and chip sounds (browser permitting)
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🎯 How to Play

### Starting a Game
1. **Place Your Bet**: Click on the betting buttons ($5, $10, $25, $50, $100, or MAX)
2. **Deal Cards**: Click "Deal" to start the round
3. **Make Decisions**: Use Hit, Stand, Double Down, or Surrender based on your hand

### Game Rules
- **Objective**: Get as close to 21 as possible without going over
- **Card Values**:
  - Number cards (2-10): Face value
  - Face cards (J, Q, K): 10 points
  - Aces: 11 points (automatically adjusted to 1 if needed)
- **Blackjack**: 21 with first two cards (Ace + 10-value card)
- **Bust**: Hand value exceeds 21 (automatic loss)

### Dealer Rules
- Dealer must hit on 16 or less
- Dealer must stand on 17 or more
- Dealer checks for blackjack if showing Ace or 10-value card

### Payouts
- **Regular Win**: 1:1 (with 0.5% house edge applied)
- **Blackjack**: 3:2 (with 0.5% house edge applied)
- **Push**: Bet returned (no house edge)
- **Surrender**: Half bet returned

## 🎲 House Edge Implementation

This game implements a legitimate 0.5% house edge through:

1. **Payout Adjustment**: Winning payouts are multiplied by 0.995 (99.5%)
2. **Blackjack Payouts**: 3:2 payouts reduced to ~1.49:1
3. **Mathematical Accuracy**: House edge calculated over long-term play
4. **Fair Play**: No manipulation of card dealing or game outcomes

## 🎨 User Interface

### Modern Casino Design
- **Dark Theme**: Professional casino aesthetic
- **Gradient Backgrounds**: Smooth color transitions
- **Card Animations**: Realistic card dealing effects
- **Responsive Layout**: Adapts to all screen sizes

### Interactive Elements
- **Hover Effects**: Buttons respond to mouse interaction
- **Visual Feedback**: Animations for wins, losses, and actions
- **Status Messages**: Clear game state communication
- **Statistics Panel**: Collapsible stats tracking

## ⌨️ Keyboard Shortcuts

- **H**: Hit
- **S**: Stand  
- **D**: Double Down
- **R**: Surrender
- **Space**: Deal new hand / Start new game

## 🔧 Technical Details

### Technologies Used
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with flexbox and animations
- **Vanilla JavaScript**: No dependencies, pure ES6+
- **LocalStorage**: Persistent data storage
- **Web Audio API**: Sound effects

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### File Structure
```
originalscasino/
├── index.html          # Main game interface
├── styles.css          # Complete styling and animations
├── blackjack.js        # Game logic and AI dealer
└── README.md           # This file
```

## 🎯 Game Strategy Tips

### Basic Strategy
- **Hard 17+**: Always stand
- **Hard 11**: Always double (if possible)
- **Soft 18**: Stand against dealer 2-8, hit against 9-A
- **Pairs**: Split Aces and 8s, never split 10s

### Betting Strategy
- **Bankroll Management**: Never bet more than 5% of your balance
- **Consistent Betting**: Avoid chasing losses with larger bets
- **Know When to Stop**: Set win/loss limits before playing

### Advanced Tips
- **Card Counting**: Not implemented (single deck reshuffled frequently)
- **Surrender**: Use when you have 16 against dealer 9, 10, or A
- **Double Down**: Best with 11, good with 10 against dealer 2-9

## 📊 Statistics Explained

- **Games Played**: Total number of completed hands
- **Games Won**: Hands won (including blackjacks and dealer busts)
- **Win Rate**: Percentage of hands won
- **Total Wagered**: Sum of all bets placed
- **Net Profit**: Total winnings minus total losses

## 🚀 Getting Started

1. **Download**: Save all files to a folder
2. **Open**: Double-click `index.html` or open in your browser
3. **Play**: Start with the default $1000 balance
4. **Enjoy**: Experience authentic casino blackjack!

## 🔮 Future Enhancements

- **Insurance Betting**: Side bet against dealer blackjack
- **Split Pairs**: Ability to split matching cards
- **Multi-Hand Play**: Play multiple hands simultaneously
- **Tournament Mode**: Compete against other players
- **Progressive Jackpot**: Bonus payouts for special hands
- **Card Counting Trainer**: Learn basic strategy and counting

## 📝 License

This project is open source and available under the MIT License.

## 🎰 Disclaimer

This is a simulation for entertainment purposes only. Please gamble responsibly and within your means. The house edge is implemented for educational purposes to demonstrate how real casinos operate.

---

**Enjoy your authentic blackjack experience!** 🃏♠️♥️♦️♣️
