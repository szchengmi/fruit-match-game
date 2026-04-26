import { Game } from './game.js';

export class UI {
    constructor() {
        this.game = null;
        this.gameBoard = document.getElementById('game-board');
        this.scoreElement = document.getElementById('score');
        this.timerElement = document.getElementById('timer');
        this.levelElement = document.getElementById('level');
        
        this.selectedCell = null;
        this.dragging = false;
        this.startCell = null;
        
        this.initializeEventListeners();
    }

    setGame(game) {
        this.game = game;
        this.renderBoard();
    }

    showScreen(screenId) {
        // 隐藏所有屏幕
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // 显示指定的屏幕
        document.getElementById(screenId).classList.add('active');
        
        if (screenId === 'game-screen' && this.game) {
            this.renderBoard();
            this.updateGameStatus();
            this.updatePowerUpUI();
        }
    }

    initializeEventListeners() {
        // 游戏框滜事件
        if (this.gameBoard) {
            this.gameBoard.addEventListener('click', this.handleCellClick.bind(this));
            this.gameBoard.addEventListener('mousedown', this.handleMouseDown.bind(this));
            this.gameBoard.addEventListener('mousemove', this.handleMouseMove.bind(this));
            this.gameBoard.addEventListener('mouseup', this.handleMouseUp.bind(this));
        }

        // 按钮事件
        const bombBtn = document.getElementById('bomb-powerup');
        if (bombBtn) {
            bombBtn.addEventListener('click', () => {
                if (this.game) {
                    this.game.useBomb();
                    this.updatePowerUpUI();
                }
            });
        }

        const lightningBtn = document.getElementById('lightning-powerup');
        if (lightningBtn) {
            lightningBtn.addEventListener('click', () => {
                if (this.game) {
                    this.game.useLightning();
                    this.updatePowerUpUI();
                }
            });
        }

        const shuffleBtn = document.getElementById('shuffle-powerup');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => {
                if (this.game) {
                    this.game.useShuffle();
                    this.updatePowerUpUI();
                }
            });
        }

        // 模式选择
        const simpleModeBtn = document.getElementById('simple-mode');
        if (simpleModeBtn) {
            simpleModeBtn.addEventListener('click', () => {
                if (this.game) {
                    this.game.setMode('simple');
                    this.updateGameStatus();
                }
            });
        }

        const challengeModeBtn = document.getElementById('challenge-mode');
        if (challengeModeBtn) {
            challengeModeBtn.addEventListener('click', () => {
                if (this.game) {
                    this.game.setMode('challenge');
                    this.updateGameStatus();
                }
            });
        }

        // 重新开始
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (this.game) {
                    this.restartGame();
                }
            });
        }

        // 关闭结果面板
        const closeResultBtn = document.getElementById('close-result');
        if (closeResultBtn) {
            closeResultBtn.addEventListener('click', () => {
                document.getElementById('game-result-modal').style.display = 'none';
            });
        }

        // 关闭关卡提示
        const closeLevelUpBtn = document.getElementById('close-level-up');
        if (closeLevelUpBtn) {
            closeLevelUpBtn.addEventListener('click', () => {
                document.getElementById('level-up-modal').style.display = 'none';
            });
        }
    }
    handleCellClick(event) {
        if (this.game.gameOver) return;

        const cell = event.target.closest('.cell');
        if (!cell) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (this.selectedCell) {
            if (this.selectedCell.row === row && this.selectedCell.col === col) {
                // 取消选择
                this.clearSelection();
            } else if (this.isAdjacent(this.selectedCell, { row, col })) {
                // 交换格子
                this.game.swapCells(this.selectedCell, { row, col });
                this.clearSelection();
                this.updateBoard();
            } else {
                // 选择新的格子
                this.selectCell(row, col);
            }
        } else {
            this.selectCell(row, col);
        }
    }

    handleMouseDown(event) {
        if (this.game.gameOver) return;

        const cell = event.target.closest('.cell');
        if (!cell) return;

        this.dragging = true;
        this.startCell = {
            row: parseInt(cell.dataset.row),
            col: parseInt(cell.dataset.col)
        };
    }

    handleMouseMove(event) {
        if (!this.dragging || this.game.gameOver) return;

        const cell = event.target.closest('.cell');
        if (!cell) return;

        const currentCell = {
            row: parseInt(cell.dataset.row),
            col: parseInt(cell.dataset.col)
        };

        if (this.isAdjacent(this.startCell, currentCell)) {
            this.game.swapCells(this.startCell, currentCell);
            this.updateBoard();
            this.dragging = false;
            this.startCell = null;
        }
    }

    handleMouseUp() {
        this.dragging = false;
        this.startCell = null;
    }

    selectCell(row, col) {
        this.clearSelection();
        this.selectedCell = { row, col };
        const cell = this.gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('selected');
        }
    }

    clearSelection() {
        this.selectedCell = null;
        const selected = this.gameBoard.querySelectorAll('.selected');
        selected.forEach(cell => cell.classList.remove('selected'));
    }

    isAdjacent(cell1, cell2) {
        const rowDiff = Math.abs(cell1.row - cell2.row);
        const colDiff = Math.abs(cell1.col - cell2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    renderBoard() {
        this.gameBoard.innerHTML = '';
        for (let row = 0; row < this.game.grid.length; row++) {
            for (let col = 0; col < this.game.grid[row].length; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                const fruit = this.game.grid[row][col];
                if (fruit) {
                    const fruitElement = document.createElement('div');
                    fruitElement.className = 'fruit';
                    
                    // 使用图片替代emoji
                    const img = document.createElement('img');
                    img.src = this.getFruitImage(fruit);
                    img.className = 'fruit-image';
                    img.alt = this.getFruitName(fruit);
                    
                    fruitElement.appendChild(img);
                    cell.appendChild(fruitElement);
                }

                this.gameBoard.appendChild(cell);
            }
        }
    }

    getFruitImage(fruitType) {
        const fruitImages = {
            'apple': './pic/apple.png',
            'banana': './pic/banana.png',
            'orange': './pic/orange.png',
            'grape': './pic/grape.png',
            'strawberry': './pic/strawberry.png',
            'watermelon': './pic/watermelon.png',
            'cherry': './pic/cherry.png'
        };
        return fruitImages[fruitType] || './pic/apple.png';
    }

    getFruitName(fruitType) {
        const fruitNames = {
            'apple': '苹果',
            'banana': '香蕉',
            'orange': '橙子',
            'grape': '葡萄',
            'strawberry': '荆葱',
            'watermelon': '西瓜',
            'cherry': '樱桃'
        };
        return fruitNames[fruitType] || fruitType;
    }

    updateBoard() {
        // 游戏逻辑自动处理消除和下落
        this.renderBoard();
        this.updateGameStatus();
    }

    animateMatch(cells) {
        // 简化动画，禁用大型移动，使用纯样式效果
        cells.forEach(([row, col]) => {
            const cell = this.gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.style.opacity = '0.5';
                setTimeout(() => {
                    cell.style.opacity = '1';
                }, 150);
            }
        });
    }

    updateGameStatus() {
        this.scoreElement.textContent = this.game.score;
        this.timerElement.textContent = Math.ceil(this.game.timeLeft);
        this.levelElement.textContent = this.game.level;
    }

    updatePowerUpUI() {
        document.getElementById('bomb-count').textContent = this.game.powerUps.bomb;
        document.getElementById('lightning-count').textContent = this.game.powerUps.lightning;
        document.getElementById('shuffle-count').textContent = this.game.powerUps.shuffle;
    }

    showLevelUp() {
        const modal = document.getElementById('level-up-modal');
        const currentLevel = document.getElementById('current-level');
        const nextLevel = document.getElementById('next-level');
        
        currentLevel.textContent = this.game.level;
        nextLevel.textContent = this.game.level + 1;
        
        modal.style.display = 'block';
        
        // 5秒后自动关闭
        setTimeout(() => {
            modal.style.display = 'none';
        }, 5000);
    }

    showGameResult(result) {
        document.getElementById('final-score').textContent = result.score;
        document.getElementById('max-combo').textContent = result.maxCombo;
        
        const resultTitle = document.getElementById('game-result');
        if (result.win) {
            resultTitle.textContent = '🎉 胜利！';
            resultTitle.style.color = '#27ae60';
        } else {
            resultTitle.textContent = '游戏结束';
            resultTitle.style.color = '#e74c3c';
        }

        document.getElementById('game-result-modal').style.display = 'block';
    }

    restartGame() {
        this.game.restart();
        this.renderBoard();
        this.updateGameStatus();
        this.updatePowerUpUI();
        this.clearSelection();
        document.getElementById('game-result-modal').style.display = 'none';
        document.getElementById('level-up-modal').style.display = 'none';
    }

    playLevelUpAnimation() {
        // 禁用晦然一点的动画，避免页面晃动
        const levelUpText = document.createElement('div');
        levelUpText.textContent = `第${this.game.level}关`;
        levelUpText.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            font-weight: bold;
            color: #ffd700;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            z-index: 1000;
            animation: levelUpText 2s ease-out forwards;
        `;
        
        document.body.appendChild(levelUpText);
        
        setTimeout(() => {
            document.body.removeChild(levelUpText);
        }, 2000);
    }
}