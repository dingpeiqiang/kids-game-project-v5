/**
 * Phaser游戏基类
 */
// Phaser 从 CDN 加载为全局变量

export interface GameConfig {
  width: number;
  height: number;
  type: any; // Phaser.Game type
  parent: string;
  backgroundColor: number;
  scene: any[];
}

export abstract class BaseGameScene extends Phaser.Scene {
  protected score: number = 0;
  protected lives: number = 3;
  protected level: number = 1;
  protected isPaused: boolean = false;
  protected isDestroyed: boolean = false;

  create() {
    try {
      this.createUI();
      this.setupGame();
    } catch (error) {
      console.error(`[${this.scene.key}] create error:`, error);
    }
  }

  update() {
    if (!this.isPaused && !this.isDestroyed) {
      try {
        this.updateGame();
      } catch (error) {
        console.error(`[${this.scene.key}] update error:`, error);
      }
    }
  }

  /**
   * 创建UI
   */
  protected createUI(): void {
    // 子类实现
  }

  /**
   * 设置游戏
   */
  protected abstract setupGame(): void;

  /**
   * 更新游戏
   */
  protected abstract updateGame(): void;

  /**
   * 添加分数
   */
  protected addScore(points: number): void {
    this.score += points;
    this.updateScoreDisplay();
  }

  /**
   * 扣除生命
   */
  protected loseLife(): void {
    this.lives--;
    this.updateLivesDisplay();

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  /**
   * 更新分数显示
   */
  protected updateScoreDisplay(): void {
    // 子类实现
  }

  /**
   * 更新生命显示
   */
  protected updateLivesDisplay(): void {
    // 子类实现
  }

  /**
   * 游戏结束
   */
  protected gameOver(): void {
    try {
      this.isPaused = true;
      this.scene.pause();
      this.events.emit('gameOver', { score: this.score, level: this.level });
    } catch (error) {
      console.error(`[${this.scene.key}] gameOver error:`, error);
    }
  }

  /**
   * 暂停游戏
   */
  pauseGame(): void {
    this.isPaused = true;
    this.scene.pause();
  }

  /**
   * 继续游戏
   */
  resumeGame(): void {
    this.isPaused = false;
    this.scene.resume();
  }

  /**
   * 场景关闭时清理资源（子类可重写）
   */
  shutdown(): void {
    this.isDestroyed = true;
  }
}

/**
 * Phaser游戏基类
 */
export abstract class BaseGame {
  protected game: Phaser.Game | null = null;
  protected container: HTMLElement;
  protected config: Partial<GameConfig>;
  protected isDestroyed: boolean = false;

  constructor(containerId: string, config: Partial<GameConfig>) {
    const containerElement = document.getElementById(containerId);
    if (!containerElement) {
      throw new Error(`[BaseGame] Container element with id "${containerId}" not found`);
    }
    this.container = containerElement;
    this.config = {
      type: Phaser.AUTO as any,
      width: this.container.clientWidth || 800,
      height: this.container.clientHeight || 600,
      parent: containerId,
      backgroundColor: 0xf0f9ff,
      ...config,
    };
  }

  /**
   * 启动游戏
   */
  start(): void {
    if (this.isDestroyed) {
      console.error('[BaseGame] Cannot start: game is destroyed');
      return;
    }

    if (this.game) {
      console.warn('[BaseGame] game already started');
      return;
    }

    try {
      this.game = new Phaser.Game({
        ...this.config,
        scene: this.config.scene!,
      });
    } catch (error) {
      console.error('[BaseGame] start error:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * 停止游戏
   */
  stop(): void {
    if (this.isDestroyed) return;

    this.cleanup();
  }

  /**
   * 暂停游戏
   */
  pause(): void {
    if (this.isDestroyed || !this.game) return;

    try {
      const scenes = this.game.scene.getScenes();
      scenes.forEach((scene: any) => {
        if (scene instanceof BaseGameScene) {
          scene.pauseGame();
        }
      });
    } catch (error) {
      console.error('[BaseGame] pause error:', error);
    }
  }

  /**
   * 继续游戏
   */
  resume(): void {
    if (this.isDestroyed || !this.game) return;

    try {
      const scenes = this.game.scene.getScenes();
      scenes.forEach((scene: any) => {
        if (scene instanceof BaseGameScene) {
          scene.resumeGame();
        }
      });
    } catch (error) {
      console.error('[BaseGame] resume error:', error);
    }
  }

  /**
   * 调整大小
   */
  resize(width: number, height: number): void {
    if (this.isDestroyed || !this.game) return;

    try {
      this.game.scale.resize(width, height);
    } catch (error) {
      console.error('[BaseGame] resize error:', error);
    }
  }

  /**
   * 清理资源
   */
  protected cleanup(): void {
    this.isDestroyed = true;

    if (this.game) {
      try {
        this.game.destroy(true);
      } catch (error) {
        console.error('[BaseGame] cleanup error:', error);
      }
      this.game = null;
    }
  }

  /**
   * 销毁游戏实例
   */
  destroy(): void {
    this.cleanup();
  }
}
