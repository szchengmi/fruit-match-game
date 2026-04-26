// 游戏主程序
class FruitMatchGame {
    constructor() {
        this.game = null;
        this.ui = null;
        this.currentScreen = 'menu';
        this.init();
    }

    init() {
        // 初始化UI
        this.ui = new UI();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化菜单
        this.showMenu();
    }

    bindEvents() {
        // 菜单按钮事件
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame('simple');
        });

        document.getElementById('challenge-btn').addEventListener('click', () => {
            this.startGame('challenge');
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });

        document.getElementById('leaderboard-btn').addEventListener('click', () => {
            this.showLeaderboard();
        });
    }

    showMenu() {
        this.currentScreen = 'menu';
        document.getElementById('menu-screen').classList.add('active');
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('settings-screen').classList.remove('active');
        document.getElementById('leaderboard-screen').classList.remove('active');
    }

    startGame(mode = 'simple') {
        this.currentScreen = 'game';
        this.game = new Game(mode, this.ui);
        this.ui.setGame(this.game);
        this.ui.showScreen('game-screen');
        this.game.startGameLoop();
    }

    showSettings() {
        this.currentScreen = 'settings';
        this.ui.showScreen('settings-screen');
    }

    showLeaderboard() {
        this.currentScreen = 'leaderboard';
        this.ui.showScreen('leaderboard-screen');
    }
}

// 全局初始化函数
let gameInstance = null;

function initGame(mode = 'simple') {
    if (gameInstance) {
        gameInstance.startGame(mode);
    } else {
        gameInstance = new FruitMatchGame();
        setTimeout(() => gameInstance.startGame(mode), 100);
    }
}

// 开始游戏
document.addEventListener('DOMContentLoaded', () => {
    gameInstance = new FruitMatchGame();
});