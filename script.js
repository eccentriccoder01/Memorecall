class LuxeMemoryGame {
    constructor() {
        this.gameBoard = document.getElementById('gameBoard');
        this.timerElement = document.getElementById('timer');
        this.movesElement = document.getElementById('moves');
        this.scoreElement = document.getElementById('score');
        this.accuracyElement = document.getElementById('accuracy');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        
        // Game state
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.attempts = 0;
        this.startTime = null;
        this.gameTime = 0;
        this.timerInterval = null;
        this.isPaused = false;
        this.hintsRemaining = 3;
        this.currentDifficulty = 'easy';
        
        // Card icons for different themes
        this.cardIcons = {
            luxury: [
                'fas fa-gem', 'fas fa-crown', 'fas fa-ring', 'fas fa-star',
                'fas fa-trophy', 'fas fa-medal', 'fas fa-chess-queen', 'fas fa-diamond',
                'fas fa-fire', 'fas fa-bolt', 'fas fa-magic', 'fas fa-heart',
                'fas fa-leaf', 'fas fa-snowflake', 'fas fa-sun', 'fas fa-moon',
                'fas fa-key', 'fas fa-lock', 'fas fa-shield', 'fas fa-sword',
                'fas fa-rocket', 'fas fa-plane', 'fas fa-ship', 'fas fa-car',
                'fas fa-music', 'fas fa-guitar', 'fas fa-microphone', 'fas fa-headphones',
                'fas fa-camera', 'fas fa-palette', 'fas fa-brush', 'fas fa-pen'
            ]
        };
        
        this.difficultySettings = {
            easy: { size: 4, pairs: 8, timeBonus: 1000, moveBonus: 50 },
            medium: { size: 6, pairs: 18, timeBonus: 2000, moveBonus: 75 },
            hard: { size: 8, pairs: 32, timeBonus: 3000, moveBonus: 100 }
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateHintDisplay();
        this.startNewGame();
    }
    
    bindEvents() {
        // Difficulty selection
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentDifficulty = btn.dataset.difficulty;
                this.startNewGame();
            });
        });
        
        // Control buttons
        document.getElementById('newGameBtn').addEventListener('click', () => this.startNewGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('hintBtn').addEventListener('click', () => this.useHint());
        
        // Modal buttons
        document.getElementById('playAgainBtn').addEventListener('click', () => this.playAgain());
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeVictoryModal());
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.closePauseModal();
            this.startNewGame();
        });
        
        // Close modals on overlay click
        document.getElementById('victoryModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeVictoryModal();
            }
        });
        
        document.getElementById('pauseModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.togglePause();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'n':
                case 'N':
                    this.startNewGame();
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePause();
                    break;
                case 'h':
                case 'H':
                    this.useHint();
                    break;
            }
        });
    }
    
    startNewGame() {
        this.resetGame();
        this.generateCards();
        this.renderBoard();
        this.startTimer();
        this.updateStats();
        this.updateProgress();
    }
    
    resetGame() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.attempts = 0;
        this.gameTime = 0;
        this.startTime = Date.now();
        this.hintsRemaining = 3;
        this.isPaused = false;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.closeVictoryModal();
        this.closePauseModal();
        this.updateHintDisplay();
        
        // Update pause button
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
    }
    
    generateCards() {
        const settings = this.difficultySettings[this.currentDifficulty];
        const totalCards = settings.pairs * 2;
        const selectedIcons = this.cardIcons.luxury.slice(0, settings.pairs);
        
        // Create pairs
        const cardPairs = [...selectedIcons, ...selectedIcons];
        
        // Shuffle cards
        this.cards = this.shuffleArray(cardPairs).map((icon, index) => ({
            id: index,
            icon: icon,
            isFlipped: false,
            isMatched: false
        }));
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    renderBoard() {
        const settings = this.difficultySettings[this.currentDifficulty];
        this.gameBoard.className = `game-board ${this.currentDifficulty}`;
        this.gameBoard.innerHTML = '';
        
        this.cards.forEach(card => {
            const cardElement = this.createCardElement(card);
            this.gameBoard.appendChild(cardElement);
        });
    }
    
    createCardElement(card) {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.dataset.id = card.id;

        cardEl.innerHTML = `
            <div class="card-inner">
                <div class="card-face card-back">
                    <i class="fas fa-question"></i>
                </div>
                <div class="card-face card-front">
                    <i class="${card.icon}"></i>
                </div>
            </div>
        `;

        cardEl.addEventListener('click', () => this.flipCard(card.id));

        return cardEl;
    }
    
    flipCard(cardId) {
        if (this.isPaused || this.flippedCards.length >= 2) return;

        const card = this.cards[cardId];
        const cardElement = document.querySelector(`[data-id="${cardId}"]`);

        if (card.isFlipped || card.isMatched) return;

        card.isFlipped = true;
        cardElement.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.attempts++;
            this.checkMatch();
        }
    }
    
    checkMatch() {
        const [card1, card2] = this.flippedCards;
        
        setTimeout(() => {
            if (card1.icon === card2.icon) {
                this.handleMatch(card1, card2);
            } else {
                this.handleMismatch(card1, card2);
            }
            
            this.moves++;
            this.flippedCards = [];
            this.updateStats();
            this.updateProgress();
            
            if (this.matchedPairs === this.difficultySettings[this.currentDifficulty].pairs) {
                this.endGame();
            }
        }, 1000);
    }
    
    handleMatch(card1, card2) {
        card1.isMatched = true;
        card2.isMatched = true;
        this.matchedPairs++;
        
        const cardEl1 = document.querySelector(`[data-id="${card1.id}"]`);
        const cardEl2 = document.querySelector(`[data-id="${card2.id}"]`);
        
        cardEl1.classList.add('matched');
        cardEl2.classList.add('matched');
        
        // Add sparkle effect
        this.addSparkleEffect(cardEl1);
        this.addSparkleEffect(cardEl2);
    }
    
    handleMismatch(card1, card2) {
        card1.isFlipped = false;
        card2.isFlipped = false;
        
        const cardEl1 = document.querySelector(`[data-id="${card1.id}"]`);
        const cardEl2 = document.querySelector(`[data-id="${card2.id}"]`);
        
        cardEl1.classList.remove('flipped');
        cardEl2.classList.remove('flipped');
        
        // Add shake effect
        cardEl1.style.animation = 'shake 0.5s ease-in-out';
        cardEl2.style.animation = 'shake 0.5s ease-in-out';
        
        setTimeout(() => {
            cardEl1.style.animation = '';
            cardEl2.style.animation = '';
        }, 500);
    }
    
    addSparkleEffect(element) {
        const sparkles = document.createElement('div');
        sparkles.className = 'sparkles';
        sparkles.style.position = 'absolute';
        sparkles.style.top = '0';
        sparkles.style.left = '0';
        sparkles.style.right = '0';
        sparkles.style.bottom = '0';
        sparkles.style.pointerEvents = 'none';
        sparkles.style.background = 'radial-gradient(circle, rgba(212, 175, 55, 0.8) 2px, transparent 2px)';
        sparkles.style.backgroundSize = '20px 20px';
        sparkles.style.animation = 'sparkle 1s ease-out forwards';
        
        element.appendChild(sparkles);
        
        setTimeout(() => {
            sparkles.remove();
        }, 1000);
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                this.gameTime = Date.now() - this.startTime;
                this.updateTimer();
            }
        }, 1000);
    }
    
    updateTimer() {
        const minutes = Math.floor(this.gameTime / 60000);
        const seconds = Math.floor((this.gameTime % 60000) / 1000);
        this.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateStats() {
        this.movesElement.textContent = this.moves;
        
        const accuracy = this.attempts === 0 ? 100 : Math.round((this.matchedPairs / this.attempts) * 100);
        this.accuracyElement.textContent = `${accuracy}%`;
        
        const score = this.calculateScore();
        this.scoreElement.textContent = score.toLocaleString();
    }
    
    calculateScore() {
        const settings = this.difficultySettings[this.currentDifficulty];
        const baseScore = this.matchedPairs * 100;
        const timeBonus = Math.max(0, settings.timeBonus - Math.floor(this.gameTime / 1000) * 10);
        const moveBonus = Math.max(0, (settings.pairs * 2 - this.moves) * settings.moveBonus);
        const accuracyBonus = this.attempts === 0 ? 0 : Math.floor((this.matchedPairs / this.attempts) * 500);
        
        return baseScore + timeBonus + moveBonus + accuracyBonus;
    }
    
    updateProgress() {
        const totalPairs = this.difficultySettings[this.currentDifficulty].pairs;
        const progress = (this.matchedPairs / totalPairs) * 100;
        
        this.progressBar.style.width = `${progress}%`;
        this.progressText.textContent = `${Math.round(progress)}% Complete`;
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.isPaused) {
            pauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Resume</span>';
            this.showPauseModal();
        } else {
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
            this.closePauseModal();
        }
    }
    
    useHint() {
        if (this.hintsRemaining <= 0 || this.isPaused) return;
        
        const unmatched = this.cards.filter(card => !card.isMatched && !card.isFlipped);
        if (unmatched.length < 2) return;
        
        // Find a matching pair
        for (let i = 0; i < unmatched.length; i++) {
            for (let j = i + 1; j < unmatched.length; j++) {
                if (unmatched[i].icon === unmatched[j].icon) {
                    const cardEl1 = document.querySelector(`[data-id="${unmatched[i].id}"]`);
                    const cardEl2 = document.querySelector(`[data-id="${unmatched[j].id}"]`);
                    
                    cardEl1.classList.add('hint');
                    cardEl2.classList.add('hint');
                    
                    setTimeout(() => {
                        cardEl1.classList.remove('hint');
                        cardEl2.classList.remove('hint');
                    }, 2000);
                    
                    this.hintsRemaining--;
                    this.updateHintDisplay();
                    return;
                }
            }
        }
    }
    
    updateHintDisplay() {
        const hintCount = document.querySelector('.hint-count');
        hintCount.textContent = this.hintsRemaining;
        
        const hintBtn = document.getElementById('hintBtn');
        if (this.hintsRemaining <= 0) {
            hintBtn.style.opacity = '0.5';
            hintBtn.style.pointerEvents = 'none';
        } else {
            hintBtn.style.opacity = '1';
            hintBtn.style.pointerEvents = 'auto';
        }
    }
    
    endGame() {
        clearInterval(this.timerInterval);
        
        setTimeout(() => {
            this.showVictoryModal();
        }, 1000);
    }
    
    showVictoryModal() {
        const modal = document.getElementById('victoryModal');
        const finalTime = document.getElementById('finalTime');
        const finalMoves = document.getElementById('finalMoves');
        const finalScore = document.getElementById('finalScore');
        const finalRating = document.getElementById('finalRating');
        
        const minutes = Math.floor(this.gameTime / 60000);
        const seconds = Math.floor((this.gameTime % 60000) / 1000);
        finalTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        finalMoves.textContent = this.moves;
        finalScore.textContent = this.calculateScore().toLocaleString();
        
        // Calculate rating based on performance
        const rating = this.calculateRating();
        finalRating.textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        
        modal.classList.add('active');
    }
    
    calculateRating() {
        const settings = this.difficultySettings[this.currentDifficulty];
        const perfectMoves = settings.pairs * 2;
        const timeInSeconds = this.gameTime / 1000;
        const accuracy = this.attempts === 0 ? 100 : (this.matchedPairs / this.attempts) * 100;
        
        let rating = 5;
        
        if (this.moves > perfectMoves * 1.5) rating--;
        if (this.moves > perfectMoves * 2) rating--;
        if (timeInSeconds > 180) rating--;
        if (accuracy < 80) rating--;
        if (accuracy < 60) rating--;
        
        return Math.max(1, rating);
    }
    
    showPauseModal() {
        const modal = document.getElementById('pauseModal');
        modal.classList.add('active');
    }
    
    closePauseModal() {
        const modal = document.getElementById('pauseModal');
        modal.classList.remove('active');
    }
    
    closeVictoryModal() {
        const modal = document.getElementById('victoryModal');
        modal.classList.remove('active');
    }
    
    playAgain() {
        this.closeVictoryModal();
        this.startNewGame();
    }
}

// Add shake animation to CSS dynamically
const shakeKeyframes = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
        20%, 40%, 60%, 80% { transform: translateX(3px); }
    }
    
    @keyframes sparkle {
        0% { opacity: 0; transform: scale(0); }
        50% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(0); }
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = shakeKeyframes;
document.head.appendChild(styleSheet);

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LuxeMemoryGame();
});

// Add some additional visual enhancements
document.addEventListener('DOMContentLoaded', () => {
    // Add dynamic background particle generation
    const createParticle = () => {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.width = '2px';
        particle.style.height = '2px';
        particle.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.top = '100vh';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '-1';
        particle.style.opacity = '0.7';
        
        document.body.appendChild(particle);
        
        const animation = particle.animate([
            { transform: 'translateY(0px) rotate(0deg)', opacity: 0.7 },
            { transform: `translateY(-100vh) rotate(360deg)`, opacity: 0 }
        ], {
            duration: Math.random() * 3000 + 2000,
            easing: 'ease-out'
        });
        
        animation.addEventListener('finish', () => {
            particle.remove();
        });
    };
    
    // Create particles periodically
    setInterval(createParticle, 200);
    
    // Add mouse trail effect
    let mouseTrail = [];
    document.addEventListener('mousemove', (e) => {
        mouseTrail.push({ x: e.clientX, y: e.clientY, time: Date.now() });
        
        // Keep only recent positions
        mouseTrail = mouseTrail.filter(pos => Date.now() - pos.time < 500);
        
        // Create trail particle
        if (Math.random() < 0.3) {
            const trailParticle = document.createElement('div');
            trailParticle.style.position = 'fixed';
            trailParticle.style.width = '3px';
            trailParticle.style.height = '3px';
            trailParticle.style.backgroundColor = 'rgba(212, 175, 55, 0.6)';
            trailParticle.style.borderRadius = '50%';
            trailParticle.style.left = e.clientX + 'px';
            trailParticle.style.top = e.clientY + 'px';
            trailParticle.style.pointerEvents = 'none';
            trailParticle.style.zIndex = '999';
            
            document.body.appendChild(trailParticle);
            
            trailParticle.animate([
                { opacity: 0.6, transform: 'scale(1)' },
                { opacity: 0, transform: 'scale(0)' }
            ], {
                duration: 500,
                easing: 'ease-out'
            }).addEventListener('finish', () => {
                trailParticle.remove();
            });
        }
    });
});