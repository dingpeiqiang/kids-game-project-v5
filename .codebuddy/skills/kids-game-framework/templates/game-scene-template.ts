import { Scene } from 'phaser';
import { ComponentContainer, EventBus, GameEventType } from '../../src';

/**
 * 游戏场景模板
 * 
 * 使用说明：
 * 1. 继承 Scene 类
 * 2. 使用 ComponentContainer 管理组件
 * 3. 使用 EventBus 进行组件间通信
 * 4. 所有事件类型必须在 GameEventType 枚举中定义
 * 
 * 重要：
 * - 不要直接访问 Pinia store（使用回调注入）
 * - 使用相对路径引用框架，禁止使用 @/ 别名
 * - 组件间通过 EventBus 通信
 */
export class GameSceneTemplate extends Scene {
  private container: ComponentContainer;
  private eventBus: EventBus;

  constructor(key: string = 'GameSceneTemplate') {
    super({ key });
  }

  preload(): void {
    // 预加载资源
    // this.load.image('player', 'assets/images/player.png');
    // this.load.image('enemy', 'assets/images/enemy.png');
    // this.load.audio('bgm', 'assets/audio/bgm.mp3');
  }

  create(): void {
    // 初始化组件容器
    this.container = new ComponentContainer(this);
    this.eventBus = new EventBus();

    // 添加组件
    // this.container.addComponent(new PlayerComponent(this));
    // this.container.addComponent(new EnemyComponent(this));
    // this.container.addComponent(new ScoreComponent(this));

    // 注册事件监听
    this.setupEventListeners();

    // 启动游戏
    this.startGame();
  }

  update(time: number, delta: number): void {
    // 更新所有组件
    this.container.update(time, delta);
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    // 监听游戏事件
    this.events.on(GameEventType.GAME_OVER, this.handleGameOver, this);
    this.events.on(GameEventType.LEVEL_UP, this.handleLevelUp, this);
    this.events.on(GameEventType.SCORE_CHANGED, this.handleScoreChanged, this);
  }

  /**
   * 开始游戏
   */
  private startGame(): void {
    // 发送游戏开始事件
    this.events.emit(GameEventType.GAME_START);
  }

  /**
   * 处理游戏结束
   */
  private handleGameOver(): void {
    // 处理游戏结束逻辑
    // this.scene.pause();
    // this.scene.launch('GameOverScene');
  }

  /**
   * 处理关卡升级
   */
  private handleLevelUp(): void {
    // 处理关卡升级逻辑
    this.events.emit(GameEventType.LEVEL_CHANGED, this.getCurrentLevel() + 1);
  }

  /**
   * 处理分数变化
   */
  private handleScoreChanged(score: number): void {
    // 处理分数变化逻辑
    console.log(`Score changed: ${score}`);
  }

  /**
   * 获取当前关卡
   */
  private getCurrentLevel(): number {
    // 返回当前关卡
    return 1;
  }

  /**
   * 销毁场景
   */
  destroy(): void {
    // 清理资源
    this.container.destroy();
    this.eventBus.destroy();
    super.destroy();
  }
}
