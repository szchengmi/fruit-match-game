// 游戏主逻辑
class Game {
    constructor(mode, ui) {
        this.mode = mode; // 'normal' or 'challenge'
        this.ui = ui;
        this.grid = [];
        this.rows = 8;
        this.cols = 8;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.selectedCell = null;
        this.isProcessing = false;
        this.gameTime = 120; // 修改为120秒
        this.timeLeft = this.gameTime;
        this.target = 500; // 第1关的目标分数
        this.gameActive = false;
        this.timerInterval = null;
        
        // 特殊助手
        this.powerUps = {
            bomb: 3,
            lightning: 2,
            shuffle: 1
        };
        
        // 关卡系统
        this.level = 1;
        this.levelTargets = {
            1: { score: 500, time: 120 },
            2: { score: 1000, time: 120 },
            3: { score: 1800, time: 120 },
            4: { score: 3000, time: 120 },
            5: { score: 5000, time: 120 }
        };
        this.fruitTypes = ['apple', 'banana', 'orange', 'grape', 'strawberry', 'watermelon'];
        
        this.init();
    }

    init() {
        this.createGrid();
        this.ui.createGameBoard(this.grid);
        this.ui.updateScore(this.score);
        this.ui.updateLevel(this.level);
        this.ui.updateTarget(this.levelTargets[this.level].score);
        this.ui.updateTimer(this.levelTargets[this.level].time);
        this.updatePowerUpUI();
    }

    createGrid() {
        // 创建初始格子，确保没有可消除组合
        do {
            this.grid = [];
            for (let row = 0; row < this.rows; row++) {
                this.grid[row] = [];
                for (let col = 0; col < this.cols; col++) {
                    this.grid[row][col] = this.getRandomFruit();
                }
            }
        } while (this.findMatches().length > 0);
    }

    getRandomFruit() {
        return this.fruitTypes[Math.floor(Math.random() * this.fruitTypes.length)];
    }

    start() {
        this.gameActive = true;
        
        // 使用关卡系统的时间
        this.timeLeft = this.levelTargets[this.level].time;
        this.ui.updateTimer(this.timeLeft);
        
        this.startTimer();
        this.ui.showMessage(`游戏开始！关卡: ${this.level}`);
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.ui.updateTimer(this.timeLeft);
            
            if (this.timeLeft <= 0) {
                this.endGame(false);
            }
        }, 1000);
    }

    pause() {
        if (!this.gameActive) return;
        
        this.gameActive = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.ui.showScreen('pause-screen');
    }

    resume() {
        if (this.gameActive) return;
        
        this.gameActive = true;
        this.startTimer();
        this.ui.showScreen('game-screen');
    }

    handleCellClick(row, col) {
        if (!this.gameActive || this.isProcessing) return;
        
        const cell = [row, col];
        
        if (!this.selectedCell) {
            // 第一次点击
            this.selectedCell = cell;
            this.ui.highlightCells([cell], true);
        } else {
            // 第二次点击
            const [selectedRow, selectedCol] = this.selectedCell;
            
            if (row === selectedRow && col === selectedCol) {
                // 重复点击同一个格子
                this.ui.highlightCells([this.selectedCell], false);
                this.selectedCell = null;
            } else if (this.isAdjacent(this.selectedCell, cell)) {
                // 相邻格子，执行交换
                this.ui.highlightCells([this.selectedCell], false);
                this.swapCells(this.selectedCell, cell);
                this.selectedCell = null;
            } else {
                // 不是相邻格子，选择新的格子
                this.ui.highlightCells([this.selectedCell], false);
                this.selectedCell = cell;
                this.ui.highlightCells([cell], true);
            }
        }
    }

    isAdjacent(cell1, cell2) {
        const [row1, col1] = cell1;
        const [row2, col2] = cell2;
        
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    swapCells(cell1, cell2) {
        const [row1, col1] = cell1;
        const [row2, col2] = cell2;
        
        // 交换水果
        const temp = this.grid[row1][col1];
        this.grid[row1][col1] = this.grid[row2][col2];
        this.grid[row2][col2] = temp;
        
        // 检查是否有消除
        const matches = this.findMatches();
        
        if (matches.length > 0) {
            // 有消除，继续处理
            this.ui.createGameBoard(this.grid);
            this.processMatches();
        } else {
            // 没有消除，恢复原状
            this.grid[row1][col1] = this.grid[row2][col2];
            this.grid[row2][col2] = temp;
            this.ui.showMessage('无法消除');
        }
    }

    findMatches() {
        const matches = [];
        
        // 检查水平消除
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols - 2; col++) {
                const fruit = this.grid[row][col];
                if (fruit && fruit === this.grid[row][col + 1] && fruit === this.grid[row][col + 2]) {
                    let matchLength = 3;
                    let currentCol = col + 3;
                    
                    while (currentCol < this.cols && this.grid[row][currentCol] === fruit) {
                        matchLength++;
                        currentCol++;
                    }
                    
                    for (let i = 0; i < matchLength; i++) {
                        matches.push([row, col + i]);
                    }
                }
            }
        }
        
        // 检查垂直消除
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows - 2; row++) {
                const fruit = this.grid[row][col];
                if (fruit && fruit === this.grid[row + 1][col] && fruit === this.grid[row + 2][col]) {
                    let matchLength = 3;
                    let currentRow = row + 3;
                    
                    while (currentRow < this.rows && this.grid[currentRow][col] === fruit) {
                        matchLength++;
                        currentRow++;
                    }
                    
                    for (let i = 0; i < matchLength; i++) {
                        const cell = [row + i, col];
                        if (!matches.some(match => match[0] === cell[0] && match[1] === cell[1])) {
                            matches.push(cell);
                        }
                    }
                }
            }
        }
        
        return matches;
    }

    processMatches() {
        this.isProcessing = true;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        let matches = this.findMatches();
        
        if (matches.length === 0) {
            this.combo = 0;
            this.isProcessing = false;
            this.ui.updateCombo(this.combo);
            return;
        }
        
        // 标记消除并播放动画
        this.ui.animateMatch(matches);
        
        setTimeout(() => {
            // 计算分数
            const points = matches.length * 10 * this.combo;
            this.addScore(points);
            this.ui.updateCombo(this.combo);
            
            // 消除水果
            matches.forEach(([row, col]) => {
                this.grid[row][col] = null;
            });
            
            // 水果下落
            this.dropFruits();
            
            // 补充新水果
            this.fillEmpty();
            
            // 更新界面
            this.ui.createGameBoard(this.grid);
            
            // 继续检查是否有新的消除
            setTimeout(() => {
                this.processMatches();
            }, 300);
            
        }, 400);
    }

    dropFruits() {
        for (let col = 0; col < this.cols; col++) {
            let writePos = this.rows - 1;
            
            for (let row = this.rows - 1; row >= 0; row--) {
                if (this.grid[row][col] !== null) {
                    if (writePos !== row) {
                        this.grid[writePos][col] = this.grid[row][col];
                        this.grid[row][col] = null;
                    }
                    writePos--;
                }
            }
        }
    }

    fillEmpty() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === null) {
                    this.grid[row][col] = this.getRandomFruit();
                }
            }
        }
    }

    usePowerUp(type) {
        if (!this.gameActive || this.powerUps[type] <= 0) return;
        
        this.powerUps[type]--;
        this.updatePowerUpUI();
        
        switch (type) {
            case 'bomb':
                this.useBomb();
                break;
            case 'lightning':
                this.useLightning();
                break;
            case 'shuffle':
                this.useShuffle();
                break;
        }
    }

    useBomb() {
        // 随机选择一个水果，消除周围
        let cells = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] !== null) {
                    cells.push([row, col]);
                }
            }
        }
        
        if (cells.length > 0) {
            const randomCell = cells[Math.floor(Math.random() * cells.length)];
            const [centerRow, centerCol] = randomCell;
            
            const affectedCells = [];
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const newRow = centerRow + dr;
                    const newCol = centerCol + dc;
                    if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                        affectedCells.push([newRow, newCol]);
                    }
                }
            }
            
            this.ui.animateMatch(affectedCells);
            setTimeout(() => {
                affectedCells.forEach(([row, col]) => {
                    this.grid[row][col] = null;
                });
            this.addScore(affectedCells.length * 15);
                this.dropFruits();
                this.fillEmpty();
                this.ui.createGameBoard(this.grid);
                this.processMatches();
            }, 400);
        }
        
        this.ui.showMessage('炸弹使用！');
    }

    useLightning() {
        // 随机选择一行或一列消除
        const isRow = Math.random() > 0.5;
        let affectedCells = [];
        
        if (isRow) {
            const row = Math.floor(Math.random() * this.rows);
            for (let col = 0; col < this.cols; col++) {
                affectedCells.push([row, col]);
            }
        } else {
            const col = Math.floor(Math.random() * this.cols);
            for (let row = 0; row < this.rows; row++) {
                affectedCells.push([row, col]);
            }
        }
        
        this.ui.animateMatch(affectedCells);
        setTimeout(() => {
            affectedCells.forEach(([row, col]) => {
                this.grid[row][col] = null;
            });
            this.addScore(affectedCells.length * 12);
            this.dropFruits();
            this.fillEmpty();
            this.ui.createGameBoard(this.grid);
            this.processMatches();
        }, 400);
        
        this.ui.showMessage('闪电使用！');
    }

    useShuffle() {
        // 重新派发所有水果
        const allFruits = [];
        
        // 收集所有水果
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] !== null) {
                    allFruits.push(this.grid[row][col]);
                }
            }
        }
        
        // 派发回去
        let fruitIndex = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (fruitIndex < allFruits.length) {
                    this.grid[row][col] = allFruits[fruitIndex];
                    fruitIndex++;
                }
            }
        }
        
        this.ui.createGameBoard(this.grid);
        this.ui.showMessage('水果已洗牌！');
    }

    updatePowerUpUI() {
        Object.keys(this.powerUps).forEach(type => {
            this.ui.updatePowerUpCount(type, this.powerUps[type]);
        });
    }

    addScore(points) {
        const oldScore = this.score;
        this.score += points;
        
        // 每提分10分，回复5秒时间
        const oldTens = Math.floor(oldScore / 10);
        const newTens = Math.floor(this.score / 10);
        
        if (newTens > oldTens) {
            this.timeLeft += 5;
            this.ui.showMessage('+时间5秒!');
        }
        
        this.ui.updateScore(this.score);
        
        // 检查是否达到关卡目标
        if (this.score >= this.levelTargets[this.level].score) {
            this.nextLevel();
        }
    }

    nextLevel() {
        if (this.level < 5) {
            this.level++;
            
            // 暂停游戏，显示倒计时
            this.gameActive = false;
            this.ui.showMessage(`关卡 ${this.level} 准备中... 5`);
            
            let countdown = 5;
            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    this.ui.showMessage(`关卡 ${this.level} 准备中... ${countdown}`);
                } else {
                    clearInterval(countdownInterval);
                    
                    // 倒计时结束，开始新关卡
                    this.ui.showMessage(`关卡 ${this.level} 开始!`);
                    
                    // 添加关卡提升动画
                    this.ui.playLevelUpAnimation();
                    
                    // 重置游戏状态
                    this.combo = 0;
                    this.timeLeft = this.levelTargets[this.level].time;
                    
                    // 更新UI
                    this.ui.updateLevel(this.level);
                    this.ui.updateTarget(this.levelTargets[this.level].score);
                    this.ui.updateTimer(this.timeLeft);
                    this.ui.updateCombo(this.combo);
                    
                    // 重新创建格子
                    this.createGrid();
                    this.ui.createGameBoard(this.grid);
                    
                    // 后续游戏
                    this.gameActive = true;
                }
            }, 1000);
        } else {
            // 通关
            this.endGame(true);
        }
    }

    endGame(win) {
        this.gameActive = false;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // 计算等级
        let rating = '未达标';
        if (this.score >= this.target) {
            rating = '优秀';
        } else if (this.score >= this.target * 0.8) {
            rating = '良好';
        } else if (this.score >= this.target * 0.6) {
            rating = '一般';
        }
        
        const result = {
            score: this.score,
            maxCombo: this.maxCombo,
            rating: rating,
            win: win || this.score >= this.target
        };
        
        this.ui.updateFinalStats(result);
        this.ui.showScreen('game-over-screen');
    }

    destroy() {
        this.gameActive = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }
}