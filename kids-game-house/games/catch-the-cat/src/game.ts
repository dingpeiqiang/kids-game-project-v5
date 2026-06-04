/// <reference path="./phaser.d.ts"/>

import Phaser from 'phaser';
import MainScene from "./scenes/mainScene";

declare type CatchTheCatGameConfig = {
    /**
     * grid columns
     */
    w: number,
    /**
     * grid rows
     */
    h: number,
    /**
     * grid circle radius
     */
    r: number,
    /**
     * initial wall count
     */
    initialWallCount?: number,
    /**
     * The background color of the game canvas. The default is black.
     */
    backgroundColor?: string | number;
    /**
     * The DOM element that will contain the game canvas, or its `id`. If null (the default) or if the named element doesn't exist, the game canvas is inserted directly into the document body.
     */
    parent?: HTMLElement | string;
    /**
     * 'left' or 'center'
     */
    statusBarAlign?: string;
    /**
     * text at bottom right corner
     */
    credit?: string;
    /**
     * difficulty level: 'easy' | 'normal' | 'hard' | 'expert'
     */
    difficulty?: 'easy' | 'normal' | 'hard' | 'expert';
};

/**
 * 难度级别配置
 */
export const DIFFICULTY_CONFIG = {
    easy: {
        name: '简单',
        initialWallCount: 5,
        solverName: 'nearestSolver',
        description: '适合新手练习'
    },
    normal: {
        name: '普通',
        initialWallCount: 8,
        solverName: 'advancedSolver',
        description: '平衡的挑战'
    },
    hard: {
        name: '困难',
        initialWallCount: 10,
        solverName: 'advancedSolver',
        description: '需要策略性思考'
    },
    expert: {
        name: '专家',
        initialWallCount: 12,
        solverName: 'advancedSolver',
        description: '极限挑战模式'
    }
} as const;

export type DifficultyLevel = keyof typeof DIFFICULTY_CONFIG;
/*!
 * Catch The Cat Game
 *
 * https://github.com/ganlvtech/phaser-catch-the-cat
 */
export default class CatchTheCatGame extends Phaser.Game {
    public readonly mainScene: MainScene;
    public readonly myConfig: CatchTheCatGameConfig;

    constructor(config: CatchTheCatGameConfig) {
        if (!config.credit) {
            config.credit = "github.com/ganlvtech";
        }
        if (!config.backgroundColor) {
            config.backgroundColor = 0xeeeeee;
        }
        
        // 根据难度级别设置初始墙壁数量
        const difficulty = config.difficulty || 'normal';
        const diffConfig = DIFFICULTY_CONFIG[difficulty];
        const initialWallCount = config.initialWallCount ?? diffConfig.initialWallCount;
        
        let w = config.w;
        let h = config.h;
        let r = config.r * window.devicePixelRatio;
        let canvasZoom = 1 / window.devicePixelRatio;
        let canvasWidth = Math.floor((6.5 + 2 * w) * r);
        let canvasHeight = Math.floor((6 + Math.sqrt(3) * h) * r);
        let scene = new MainScene(w, h, r, initialWallCount);
        scene.difficulty = difficulty;
        scene.score = 0;
        scene.totalMoves = 0;
        
        // 获取 parent 元素
        let parentElement: HTMLElement | string | null = config.parent || null;
        if (typeof parentElement === 'string' && parentElement) {
            parentElement = document.getElementById(parentElement);
        }
        
        console.log('[CatchTheCatGame] Parent element:', parentElement);
        
        const gameConfig: Phaser.Types.Core.GameConfig = {
            width: canvasWidth,
            height: canvasHeight,
            type: Phaser.AUTO,
            parent: parentElement,
            backgroundColor: config.backgroundColor,
            scene: scene,
            zoom: canvasZoom,
        };
        super(gameConfig);
        this.myConfig = config;
        this.mainScene = scene;
    }

    private _solver;

    get solver() {
        return this._solver;
    }

    set solver(value) {
        this._solver = value;
        try {
            this.mainScene.cat.solver = value;
        } finally {
        }
    }
}
