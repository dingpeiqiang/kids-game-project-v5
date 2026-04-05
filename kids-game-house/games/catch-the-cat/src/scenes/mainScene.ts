/// <reference path="../phaser.d.ts"/>

import Phaser from 'phaser';
import data from "../data";
import CatchTheCatGame, { DIFFICULTY_CONFIG, DifficultyLevel } from "../game";
import Cat from "../sprites/cat";
import Block from "../sprites/block";
import ResetButton from "../sprites/resetButton";
import UndoButton from "../sprites/undoButton";
import StatusBar from "../sprites/statusBar";
import CreditText from "../sprites/creditText";
import ScoreDisplay from "../sprites/scoreDisplay";
import SoundToggleButton from "../sprites/soundToggleButton";
import _ from "../i18n";
import nearestSolver from "../solvers/nearestSolver";
import advancedSolver from "../solvers/advancedSolver";
import { soundManager } from "../utils/soundManager";

declare type NeighbourData = {
    i?: number,
    j?: number,
    x?: number,
    y?: number,
}

declare type RecordCoord = {
    cat: {i:number, j:number}[],
    wall: {i:number, j:number}[],
}

enum GameState {
    PLAYING = "playing",
    WIN = "win",
    LOSE = "lose",
}

export default class MainScene extends Phaser.Scene {
    public readonly w: number;
    public readonly h: number;
    public readonly r: number;
    public readonly initialWallCount: number;
    public readonly dx: number;
    public readonly dy: number;
    public game: CatchTheCatGame;
    private recordCoord: RecordCoord;
    
    // 新增属性
    public difficulty: DifficultyLevel = 'normal';
    public score: number = 0;
    public totalMoves: number = 0;
    private scoreDisplay: ScoreDisplay | null = null;
    private difficultyText: Phaser.GameObjects.Text | null = null;

    constructor(w: number, h: number, r: number, initialWallCount: number) {
        super({
            key: "MainScene",
        });
        this.w = w;
        this.h = h;
        this.r = r;
        this.initialWallCount = initialWallCount;
        this.dx = this.r * 2;
        this.dy = this.r * Math.sqrt(3);
    }

    get blocks(): Block[][] {
        return this.data.get("blocks");
    }

    set blocks(value: Block[][]) {
        this.data.set("blocks", value);
    }

    get blocksData(): boolean[][] {
        let result: boolean[][] = [];
        this.blocks.forEach((column, i) => {
            result[i] = [];
            column.forEach((block, j) => {
                result[i][j] = block.isWall;
            });
        });
        return result;
    }

    get cat(): Cat {
        return this.data.get("cat");
    }

    set cat(value: Cat) {
        this.data.set("cat", value);
    }

    get statusBar(): Phaser.GameObjects.Text {
        return this.data.get("status_bar");
    }

    set statusBar(value: Phaser.GameObjects.Text) {
        this.data.set("status_bar", value);
    }

    get creditText(): CreditText {
        return this.data.get("credit_text");
    }

    set creditText(value: CreditText) {
        this.data.set("credit_text", value);
    }

    get state(): GameState {
        return this.data.get("state");
    }

    set state(value: GameState) {
        switch (value) {
            case GameState.PLAYING:
                break;
            case GameState.LOSE:
                this.setStatusText(_("猫已经跑到地图边缘了，你输了"));
                break;
            case GameState.WIN:
                this.setStatusText(_("猫已经无路可走，你赢了"));
                break;
            default:
                return;
        }
        this.data.set("state", value);
    }

    static getNeighbours(i: number, j: number): NeighbourData[] {
        let left = {i: i - 1, j: j};
        let right = {i: i + 1, j: j};
        let top_left;
        let top_right;
        let bottom_left;
        let bottom_right;
        if ((j & 1) === 0) {
            top_left = {i: i - 1, j: j - 1};
            top_right = {i: i, j: j - 1};
            bottom_left = {i: i - 1, j: j + 1};
            bottom_right = {i: i, j: j + 1};
        } else {
            top_left = {i: i, j: j - 1};
            top_right = {i: i + 1, j: j - 1};
            bottom_left = {i: i, j: j + 1};
            bottom_right = {i: i + 1, j: j + 1};
        }
        let neighbours = [];
        neighbours[0] = left;
        neighbours[1] = top_left;
        neighbours[2] = top_right;
        neighbours[3] = right;
        neighbours[4] = bottom_right;
        neighbours[5] = bottom_left;
        return neighbours;
    }

    preload(): void {
        console.log('[MainScene] preload() called');
        // 不在这里加载纹理，改为在 create 中同步加载
    }
    
    private loadTexturesSync(): void {
        console.log('[MainScene] loadTexturesSync() called');
        let textureScale = this.r / data.catStepLength;
        console.log('[MainScene] Texture scale:', textureScale);
        console.log('[MainScene] Loading', Object.keys(data.textures).length, 'textures');
        
        for (let key in data.textures) {
            try {
                const svgString = data.textures[key];
                
                // 解析 SVG 获取尺寸
                const parser = new DOMParser();
                const doc = parser.parseFromString(svgString, 'image/svg+xml');
                const svgElement = doc.documentElement as unknown as SVGElement;
                
                let svgWidth = 32;
                let svgHeight = 32;
                
                if (svgElement && svgElement.getAttribute) {
                    const w = svgElement.getAttribute('width');
                    const h = svgElement.getAttribute('height');
                    if (w) svgWidth = parseFloat(w);
                    if (h) svgHeight = parseFloat(h);
                }
                
                // 应用 scale
                svgWidth *= textureScale;
                svgHeight *= textureScale;
                
                // 将 SVG 转换为 base64
                const base64SVG = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
                
                // 使用 Phaser 的 addBase64 方法
                if (this.textures.exists(key)) {
                    this.textures.remove(key);
                }
                this.textures.addBase64(key, base64SVG);
                console.log('[MainScene] Texture added:', key);
            } catch (e) {
                console.error('[MainScene] Error processing texture:', key, e);
            }
        }
    }

    create(): void {
        console.log('[MainScene] create() called');
        
        // 首先加载纹理
        this.loadTexturesSync();
        
        console.log('[MainScene] Loading textures, count:', Object.keys(data.textures).length);
        
        this.createAnimations();
        this.createBlocks();
        this.createCat();
        this.createStatusText();
        this.createScoreDisplay();
        this.createDifficultyDisplay();
        this.createResetButton();
        this.createUndoButton();
        this.createSoundToggleButton();
        this.createCreditText();
        this.reset();
        if (this.game.solver) {
            this.cat.solver = this.game.solver;
        }
        
        console.log('[MainScene] Scene created successfully');
        console.log('[MainScene] Cat position:', this.cat?.i, this.cat?.j);
        console.log('[MainScene] Blocks count:', this.blocks?.length, 'x', this.blocks?.[0]?.length);
        console.log('[MainScene] Available textures:', Object.keys((this.game as any).textures?.list || {}));
    }

    getPosition(i: number, j: number): NeighbourData {
        return {
            x: this.r * 3 + ((j & 1) === 0 ? this.r : this.dx) + i * this.dx,
            y: this.r * 3 + this.r + j * this.dy,
        };
    }

    getBlock(i: number, j: number): Block | null {
        if (!(i >= 0 && i < this.w && j >= 0 && j < this.h)) {
            return null;
        }
        return this.blocks[i][j];
    }

    playerClick(i: number, j: number): boolean {
        if (this.cat.anims.isPlaying) {
            this.cat.anims.stop();
        }
        if (this.state !== GameState.PLAYING) {
            this.setStatusText(_("游戏已经结束，重新开局"));
            soundManager.playReset();
            this.reset();
            return false;
        }
        let block = this.getBlock(i, j);
        if (!block) {
            this.setStatusText(_("代码错误，当前位置不存在"));
            return false;
        }
        if (block.isWall) {
            this.setStatusText(_("点击位置已经是墙了，禁止点击"));
            return false;
        }
        if (this.cat.i === i && this.cat.j === j) {
            this.setStatusText(_("点击位置是猫当前位置，禁止点击"));
            return false;
        }
        
        // 播放放置墙壁音效
        soundManager.resume();
        soundManager.playPlaceWall();
        
        block.isWall = true;
        this.totalMoves++;
        
        if (this.cat.isCaught()) {
            this.setStatusText(_("猫已经无路可走，你赢了"));
            this.state = GameState.WIN;
            this.calculateScore(true);
            soundManager.playWin();
            this.showVictoryAnimation();
            return false;
        }

        this.recordCoord.cat.push({i: this.cat.i, j:this.cat.j});
        this.recordCoord.wall.push({i, j});

        this.setStatusText(_("您点击了 ") + `(${i}, ${j})`);
        let result = this.cat.step();
        if (!result) {
            this.setStatusText(_("猫认输，你赢了！"));
            this.state = GameState.WIN;
            this.calculateScore(true);
            soundManager.playWin();
            this.showVictoryAnimation();
        } else {
            // 播放猫移动音效
            setTimeout(() => soundManager.playCatMove(), 100);
        }
        return true;
    }
    
    /**
     * 计算得分
     * 胜利时：根据移动次数、剩余可用格子和难度计算
     */
    private calculateScore(won: boolean): void {
        if (!won) {
            this.score = 0;
            return;
        }
        
        // 基础分
        let baseScore = 1000;
        
        // 根据移动次数扣分（越少越好）
        const movePenalty = this.totalMoves * 10;
        
        // 根据难度加成
        const difficultyMultipliers = {
            easy: 1,
            normal: 1.5,
            hard: 2,
            expert: 3
        };
        const multiplier = difficultyMultipliers[this.difficulty];
        
        // 计算剩余空格数（猫被围住时周围还有多少空格）
        let freeSpaces = 0;
        const neighbours = MainScene.getNeighbours(this.cat.i, this.cat.j);
        for (const n of neighbours) {
            if (n && n.i !== undefined && n.j !== undefined) {
                const block = this.getBlock(n.i, n.j);
                if (block && !block.isWall) {
                    freeSpaces++;
                }
            }
        }
        
        // 最终得分
        this.score = Math.max(0, Math.floor((baseScore - movePenalty + freeSpaces * 50) * multiplier));
        this.updateScoreDisplay();
    }
    
    private updateScoreDisplay(): void {
        if (this.scoreDisplay) {
            this.scoreDisplay.updateScore(this.score, this.totalMoves);
        }
    }
    
    private showVictoryAnimation(): void {
        // 添加胜利视觉效果
        const centerX = this.game.canvas.width / 2;
        const centerY = this.game.canvas.height / 2;
        
        // 创建光环效果
        const glow = this.add.graphics();
        glow.fillStyle(0xffff00, 0.3);
        glow.fillCircle(centerX, centerY, 50);
        
        // 缩放动画
        this.tweens.add({
            targets: glow,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                glow.destroy();
            }
        });
    }

    reset() {
        this.cat.reset();
        this.resetBlocks();
        this.randomWall();

        this.recordCoord = {
            cat: [],
            wall: []
        };
        this.state = GameState.PLAYING;
        this.score = 0;
        this.totalMoves = 0;
        this.updateScoreDisplay();
        this.setStatusText(_("点击小圆点，围住小猫"));
        soundManager.playReset();
    }

    undo() {
        if (this.recordCoord.cat.length) {
            if (this.state !== GameState.PLAYING) {
                this.setStatusText(_("游戏已经结束，重新开局"));
                soundManager.playReset();
                this.reset();
            } else {
                const catCoord = this.recordCoord.cat.pop();
                const {i, j} = this.recordCoord.wall.pop();

                this.cat.undo(catCoord.i, catCoord.j);
                this.getBlock(i, j).isWall = false;
                soundManager.playUndo();
            }
        } else {
            this.setStatusText(_("无路可退！！！"));
        }
    }
    private setStatusText(message: string) {
        this.statusBar.setText(message);
    }

    private createAnimations(): void {
        data.animations.forEach(animation => {
            let frames: AnimationFrameConfig[] = [];
            animation.textures.forEach(texture => {
                frames.push({
                    key: texture,
                    frame: 0,
                });
            });
            this.anims.create({
                key: animation.name,
                frames: frames,
                frameRate: data.frameRate,
                repeat: animation.repeat,
            });
        });
    }

    private createBlocks(): void {
        let blocks = [];
        for (let i = 0; i < this.w; i++) {
            blocks[i] = [];
            for (let j = 0; j < this.h; j++) {
                let block = new Block(this, i, j, this.r * 0.9);
                blocks[i][j] = block;
                this.add.existing(block);
                block.on("player_click", this.playerClick.bind(this));
            }
        }
        this.blocks = blocks;
    }

    private createCat(): void {
        let cat = new Cat(this);
        cat.on("escaped", () => {
            this.state = GameState.LOSE;
            soundManager.playLose();
        });
        cat.on("win", () => {
            this.state = GameState.WIN;
            soundManager.playWin();
        });
        // 使用更智能的求解器
        cat.solver = advancedSolver;
        this.cat = cat;
        this.add.existing(cat);
    }

    private createStatusText(): void {
        let statusBar = new StatusBar(this);
        this.statusBar = statusBar;
        this.add.existing(statusBar);
    }

    private createResetButton(): void {
        let resetButton = new ResetButton(this);
        this.add.existing(resetButton);
        resetButton.on("pointerup", () => {
            this.reset();
        });
    }

    private createUndoButton(): void {
        let undoButton = new UndoButton(this);
        this.add.existing(undoButton);
        undoButton.on("pointerup", () => {
            this.undo();
        });
    }

    private createCreditText(): void {
        let creditText = new CreditText(this);
        this.creditText = creditText;
        this.add.existing(creditText);
    }
    
    /**
     * 创建计分显示
     */
    private createScoreDisplay(): void {
        let scoreDisplay = new ScoreDisplay(this);
        this.scoreDisplay = scoreDisplay;
        this.add.existing(scoreDisplay);
    }
    
    /**
     * 创建难度显示
     */
    private createDifficultyDisplay(): void {
        const diffConfig = DIFFICULTY_CONFIG[this.difficulty];
        let difficultyText = new Phaser.GameObjects.Text(this, this.r * 2, this.r, diffConfig.name, {
            fontSize: `${this.r * 0.7}px`,
            color: '#666666',
            fontStyle: 'bold'
        });
        this.difficultyText = difficultyText;
        this.add.existing(difficultyText);
    }
    
    /**
     * 创建音效开关按钮
     */
    private createSoundToggleButton(): void {
        let soundToggleButton = new SoundToggleButton(this);
        this.add.existing(soundToggleButton);
    }

    private resetBlocks() {
        this.blocks.forEach(blocks => {
            blocks.forEach(block => {
                block.isWall = false;
            });
        });
    }

    private randomWall() {
        const array = [];
        for (let j = 0; j < this.h; j++) {
            for (let i = 0; i < this.w; i++) {
                if (i !== this.cat.i || j !== this.cat.j) {
                    array.push(j * this.w + i);
                }
            }
        }
        for (let i = 0; i < array.length; i++) {
            if (i >= this.initialWallCount) {
                break;
            }
            // Shuffle array
            const j = i + Math.floor(Math.random() * (array.length - i));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
            // Set wall
            let wallI = array[i] % this.w;
            let wallJ = Math.floor(array[i] / this.w);
            this.getBlock(wallI, wallJ).isWall = true;
        }
    }
}
