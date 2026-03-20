/**
 * 对战游戏基类
 * 提供本地分屏和网络对战的公共支持
 * 所有对战类游戏都应该继承这个基类
 */
// Phaser 从 CDN 加载为全局变量
import { envConfig } from '@/core/config';

export enum BattleMode {
  /** 本地分屏 - 两个玩家在同一台设备上对战 */
  LOCAL_SPLIT = 'local_split',
  /** 网络对战 - 两个玩家通过互联网对战 */
  ONLINE_MULTIPLAYER = 'online_multiplayer',
}

export enum PlayerType {
  PLAYER_1 = 'player1',
  PLAYER_2 = 'player2',
}

export interface PlayerState {
  playerId: PlayerType;
  score: number;
  lives: number;
  isReady: boolean;
}

export interface BattleConfig {
  mode: BattleMode;
  maxScore?: number;
  timeLimit?: number; // 秒
  roomId?: string; // 网络对战房间号
}

export interface BattleMessage {
  type: 'ready' | 'move' | 'score' | 'lives' | 'game_over';
  playerId: PlayerType;
  data: any;
  timestamp: number;
}

export abstract class BattleGameScene extends Phaser.Scene {
  // ===== 公共属性 =====

  /** 对战模式 */
  protected battleMode: BattleMode = BattleMode.LOCAL_SPLIT;
  /** 对战配置 */
  protected battleConfig: BattleConfig;
  /** 玩家1状态 */
  protected player1: PlayerState;
  /** 玩家2状态 */
  protected player2: PlayerState;
  /** 当前玩家 (网络对战时使用) */
  protected currentPlayer: PlayerType = PlayerType.PLAYER_1;
  /** 对手 (网络对战时使用) */
  protected opponent: PlayerType = PlayerType.PLAYER_2;
  /** 游戏时间 */
  protected gameTime: number = 0;
  /** 游戏是否运行中 */
  protected isGameRunning: boolean = false;
  /** 胜利者 */
  protected winner: PlayerType | null = null;
  /** 是否为主机 (网络对战) */
  protected isHost: boolean = false;

  // ===== 分屏相关 =====

  protected splitLine!: Phaser.GameObjects.Graphics;
  protected player1Zone: Phaser.Geom.Rectangle;
  protected player2Zone: Phaser.Geom.Rectangle;

  // ===== 网络对战相关 =====

  protected wsConnection: WebSocket | null = null;
  protected messageQueue: BattleMessage[] = [];
  protected reconnectAttempts: number = 0;
  protected maxReconnectAttempts: number = 5;

  // ===== 键盘控制 =====

  protected cursors1!: any;
  protected cursors2!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor(config: Phaser.Types.Scenes.SceneConfig & { battleConfig?: BattleConfig }) {
    super(config);
    this.battleConfig = config.battleConfig || { mode: BattleMode.LOCAL_SPLIT };

    this.player1 = {
      playerId: PlayerType.PLAYER_1,
      score: 0,
      lives: 3,
      isReady: false,
    };

    this.player2 = {
      playerId: PlayerType.PLAYER_2,
      score: 0,
      lives: 3,
      isReady: false,
    };

    this.player1Zone = new Phaser.Geom.Rectangle(0, 0, 0, 0);
    this.player2Zone = new Phaser.Geom.Rectangle(0, 0, 0, 0);
  }

  // ===== 生命周期 =====

  create() {
    const { width, height } = this.scale;

    // 初始化分屏区域
    this.player1Zone.setSize(width / 2, height);
    this.player2Zone.setSize(width / 2, height);
    this.player2Zone.setPosition(width / 2, 0);

    // 根据对战模式初始化
    if (this.battleMode === BattleMode.LOCAL_SPLIT) {
      this.setupLocalSplit();
    } else {
      this.setupOnlineMultiplayer();
    }

    // 创建基础UI
    this.createBattleUI();

    // 创建游戏内容
    this.createGameContent();
  }

  update(time: number, delta: number) {
    if (!this.isGameRunning) return;

    // 更新游戏时间
    if (this.battleConfig.timeLimit) {
      this.gameTime += delta / 1000;
      if (this.gameTime >= this.battleConfig.timeLimit) {
        this.endGameByTime();
        return;
      }
      this.updateTimeDisplay();
    }

    // 根据模式更新
    if (this.battleMode === BattleMode.LOCAL_SPLIT) {
      this.updateLocalSplit(delta);
    } else {
      this.updateOnlineMultiplayer(delta);
    }

    // 检查胜负
    this.checkWinCondition();
  }

  // ===== 模式初始化 =====

  /**
   * 设置本地分屏模式
   */
  protected setupLocalSplit(): void {
    console.log('[BattleGameScene] 设置本地分屏模式');

    // 玩家1使用 WASD
    this.cursors1 = this.input.keyboard!.addKeys('W,A,S,D') as any;
    // 玩家2使用箭头键
    this.cursors2 = this.input.keyboard!.createCursorKeys();

    // 创建分屏线
    this.createSplitLine();

    // 两个玩家都准备就绪
    this.player1.isReady = true;
    this.player2.isReady = true;

    // 延迟开始
    this.time.delayedCall(2000, () => this.startGame());
  }

  /**
   * 设置网络对战模式
   */
  protected async setupOnlineMultiplayer(): void {
    console.log('[BattleGameScene] 设置网络对战模式');

    // 判断自己是玩家1还是玩家2
    this.currentPlayer = this.determinePlayerRole();
    this.opponent = this.currentPlayer === PlayerType.PLAYER_1 ? PlayerType.PLAYER_2 : PlayerType.PLAYER_1;

    // 连接WebSocket
    await this.connectToBattleServer();

    // 等待对手准备
    this.showWaitingForOpponent();
  }

  /**
   * 确定玩家角色 (网络对战)
   * 由子类或游戏逻辑决定
   */
  protected determinePlayerRole(): PlayerType {
    // 默认逻辑: 房间号奇数的是玩家1, 偶数的是玩家2
    if (this.battleConfig.roomId) {
      const roomNum = parseInt(this.battleConfig.roomId);
      return roomNum % 2 === 0 ? PlayerType.PLAYER_2 : PlayerType.PLAYER_1;
    }
    return PlayerType.PLAYER_1;
  }

  // ===== 网络对战通信 =====

  /**
   * 连接对战服务器
   */
  protected async connectToBattleServer(): Promise<void> {
    const apiBaseUrl = envConfig.apiBaseUrl.replace('/api', '');
    const wsProtocol = apiBaseUrl.startsWith('https') ? 'wss://' : 'ws://';
    const wsHost = apiBaseUrl.replace(/^https?:\/\//, '');

    const wsUrl = `${wsProtocol}${wsHost}/battle/${this.battleConfig.roomId}`;
    console.log('[BattleGameScene] 连接对战服务器:', wsUrl);

    return new Promise((resolve, reject) => {
      try {
        this.wsConnection = new WebSocket(wsUrl);

        this.wsConnection.onopen = () => {
          console.log('[BattleGameScene] 对战服务器连接成功');
          this.reconnectAttempts = 0;

          // 发送准备消息
          this.sendBattleMessage({
            type: 'ready',
            playerId: this.currentPlayer,
            data: { ready: true },
            timestamp: Date.now(),
          });

          resolve();
        };

        this.wsConnection.onmessage = (event) => {
          this.handleBattleMessage(JSON.parse(event.data));
        };

        this.wsConnection.onclose = (event) => {
          console.log('[BattleGameScene] 对战服务器连接关闭', event);
          if (this.isGameRunning && event.code !== 1000) {
            this.reconnectToServer();
          }
        };

        this.wsConnection.onerror = (error) => {
          console.error('[BattleGameScene] 对战服务器连接错误', error);
          reject(error);
        };
      } catch (error) {
        console.error('[BattleGameScene] 连接对战服务器失败', error);
        reject(error);
      }
    });
  }

  /**
   * 重连服务器
   */
  protected async reconnectToServer(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.showNetworkError('连接断开,请重新开始');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[BattleGameScene] 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    try {
      await this.connectToBattleServer();
      this.showNetworkReconnected();
    } catch (error) {
      this.time.delayedCall(3000, () => this.reconnectToServer());
    }
  }

  /**
   * 发送对战消息
   */
  protected sendBattleMessage(message: BattleMessage): void {
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
      console.warn('[BattleGameScene] WebSocket未连接,消息已缓存');
      this.messageQueue.push(message);
      return;
    }

    try {
      this.wsConnection.send(JSON.stringify(message));
    } catch (error) {
      console.error('[BattleGameScene] 发送消息失败', error);
      this.messageQueue.push(message);
    }
  }

  /**
   * 处理对战消息
   */
  protected handleBattleMessage(message: BattleMessage): void {
    console.log('[BattleGameScene] 收到对战消息:', message);

    switch (message.type) {
      case 'ready':
        this.handleOpponentReady(message);
        break;

      case 'move':
        this.handleOpponentMove(message);
        break;

      case 'score':
        this.handleOpponentScore(message);
        break;

      case 'lives':
        this.handleOpponentLives(message);
        break;

      case 'game_over':
        this.handleOpponentGameOver(message);
        break;
    }
  }

  /**
   * 处理对手准备
   */
  protected handleOpponentReady(message: BattleMessage): void {
    if (message.playerId === this.opponent) {
      console.log('[BattleGameScene] 对手已准备');
      this.opponentReady();

      // 如果自己已经准备好,就开始游戏
      if (this.getCurrentPlayerState().isReady) {
        this.startGame();
      }
    }
  }

  /**
   * 处理对手移动
   */
  protected handleOpponentMove(message: BattleMessage): void {
    // 子类实现具体的移动逻辑
  }

  /**
   * 处理对手得分
   */
  protected handleOpponentScore(message: BattleMessage): void {
    if (message.playerId === this.opponent) {
      if (this.opponent === PlayerType.PLAYER_1) {
        this.player1.score = message.data.score;
      } else {
        this.player2.score = message.data.score;
      }
      this.updateScoreDisplay();
    }
  }

  /**
   * 处理对手失去生命
   */
  protected handleOpponentLives(message: BattleMessage): void {
    if (message.playerId === this.opponent) {
      if (this.opponent === PlayerType.PLAYER_1) {
        this.player1.lives = message.data.lives;
      } else {
        this.player2.lives = message.data.lives;
      }
      this.updateLivesDisplay();
    }
  }

  /**
   * 处理对手游戏结束
   */
  protected handleOpponentGameOver(message: BattleMessage): void {
    console.log('[BattleGameScene] 对手游戏结束:', message);
    // 子类可以处理
  }

  /**
   * 对手准备就绪
   */
  protected opponentReady(): void {
    // 子类可以实现
  }

  // ===== 游戏逻辑 =====

  /**
   * 开始游戏
   */
  protected startGame(): void {
    console.log('[BattleGameScene] 开始游戏');
    this.isGameRunning = true;
    this.gameTime = 0;
    this.onGameStart();
  }

  /**
   * 本地分屏更新
   */
  protected updateLocalSplit(delta: number): void {
    this.updatePlayer1(delta);
    this.updatePlayer2(delta);
  }

  /**
   * 网络对战更新
   */
  protected updateOnlineMultiplayer(delta: number): void {
    // 只更新自己控制的玩家
    if (this.currentPlayer === PlayerType.PLAYER_1) {
      this.updatePlayer1(delta);
    } else {
      this.updatePlayer2(delta);
    }
  }

  /**
   * 超时结束游戏
   */
  protected endGameByTime(): void {
    if (this.player1.score > this.player2.score) {
      this.endGame(PlayerType.PLAYER_1);
    } else if (this.player2.score > this.player1.score) {
      this.endGame(PlayerType.PLAYER_2);
    } else {
      this.showDrawResult();
    }
  }

  /**
   * 结束游戏
   */
  protected endGame(winner: PlayerType): void {
    this.isGameRunning = false;
    this.winner = winner;
    this.onGameEnd(winner);
    this.showGameOver(winner);

    // 网络对战模式下发送游戏结束消息
    if (this.battleMode === BattleMode.ONLINE_MULTIPLAYER && this.wsConnection) {
      this.sendBattleMessage({
        type: 'game_over',
        playerId: this.currentPlayer,
        data: { winner, player1Score: this.player1.score, player2Score: this.player2.score },
        timestamp: Date.now(),
      });
    }

    // 关闭WebSocket连接
    if (this.wsConnection) {
      this.wsConnection.close(1000, '游戏结束');
      this.wsConnection = null;
    }
  }

  /**
   * 检查胜负条件
   */
  protected checkWinCondition(): void {
    // 检查分数
    if (this.battleConfig.maxScore) {
      if (this.player1.score >= this.battleConfig.maxScore) {
        this.endGame(PlayerType.PLAYER_1);
        return;
      }
      if (this.player2.score >= this.battleConfig.maxScore) {
        this.endGame(PlayerType.PLAYER_2);
        return;
      }
    }

    // 检查生命值
    if (this.player1.lives <= 0) {
      this.endGame(PlayerType.PLAYER_2);
      return;
    }
    if (this.player2.lives <= 0) {
      this.endGame(PlayerType.PLAYER_1);
      return;
    }
  }

  // ===== UI相关 =====

  /**
   * 创建对战UI
   */
  protected createBattleUI(): void {
    const { width, height } = this.scale;

    // 玩家1分数
    this.add.text(20, 20, `玩家1: ${this.player1.score}`, {
      fontSize: '32px',
      color: '#ff6b9d',
      fontStyle: 'bold',
    }).setOrigin(0, 0);

    // 玩家2分数
    this.add.text(width - 20, 20, `玩家2: ${this.player2.score}`, {
      fontSize: '32px',
      color: '#4ecdc4',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    // 时间显示
    if (this.battleConfig.timeLimit) {
      this.add.text(width / 2, 20, `时间: ${this.battleConfig.timeLimit}`, {
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0);
    }

    // 玩家区域标识
    this.add.text(width / 4, height - 40, '玩家1', {
      fontSize: '24px',
      color: '#ff6b9d',
    }).setOrigin(0.5);

    this.add.text((width / 4) * 3, height - 40, '玩家2', {
      fontSize: '24px',
      color: '#4ecdc4',
    }).setOrigin(0.5);
  }

  /**
   * 创建分屏线
   */
  protected createSplitLine(): void {
    const { width, height } = this.scale;

    this.splitLine = this.add.graphics();
    this.splitLine.lineStyle(4, 0xff0000, 0.5);
    this.splitLine.lineBetween(width / 2, 0, width / 2, height);
  }

  /**
   * 显示等待对手
   */
  protected showWaitingForOpponent(): void {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2, '等待对手连接...', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  /**
   * 显示网络错误
   */
  protected showNetworkError(message: string): void {
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);

    this.add.text(width / 2, height / 2, message, {
      fontSize: '32px',
      color: '#ef4444',
    }).setOrigin(0.5);
  }

  /**
   * 显示网络重连成功
   */
  protected showNetworkReconnected(): void {
    const { width, height } = this.scale;

    const text = this.add.text(width / 2, height / 2, '已重新连接', {
      fontSize: '32px',
      color: '#4ecdc4',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      alpha: 0,
      duration: 2000,
      onComplete: () => text.destroy(),
    });
  }

  /**
   * 显示游戏结束
   */
  protected showGameOver(winner: PlayerType): void {
    const { width, height } = this.scale;
    const winnerText = winner === PlayerType.PLAYER_1 ? '玩家1' : '玩家2';
    const winnerColor = winner === PlayerType.PLAYER_1 ? '#ff6b9d' : '#4ecdc4';

    // 遮罩
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    // 胜利文字
    this.add.text(width / 2, height / 2 - 50, `${winnerText} 获胜!`, {
      fontSize: '64px',
      color: winnerColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 最终分数
    this.add.text(
      width / 2,
      height / 2 + 30,
      `玩家1: ${this.player1.score}  vs  玩家2: ${this.player2.score}`,
      {
        fontSize: '32px',
        color: '#ffffff',
      }
    ).setOrigin(0.5);

    // 发送事件
    this.events.emit('battleGameOver', {
      winner,
      player1Score: this.player1.score,
      player2Score: this.player2.score,
      gameTime: this.gameTime,
    });
  }

  /**
   * 显示平局
   */
  protected showDrawResult(): void {
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    this.add.text(width / 2, height / 2, '平局!', {
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(
      width / 2,
      height / 2 + 60,
      `玩家1: ${this.player1.score}  vs  玩家2: ${this.player2.score}`,
      {
        fontSize: '32px',
        color: '#ffffff',
      }
    ).setOrigin(0.5);
  }

  // ===== 玩家状态管理 =====

  /**
   * 更新玩家1分数
   */
  protected updatePlayer1Score(points: number): void {
    this.player1.score += points;
    this.updateScoreDisplay();

    // 网络对战模式下发送更新
    if (this.battleMode === BattleMode.ONLINE_MULTIPLAYER) {
      this.sendBattleMessage({
        type: 'score',
        playerId: PlayerType.PLAYER_1,
        data: { score: this.player1.score },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 更新玩家2分数
   */
  protected updatePlayer2Score(points: number): void {
    this.player2.score += points;
    this.updateScoreDisplay();

    // 网络对战模式下发送更新
    if (this.battleMode === BattleMode.ONLINE_MULTIPLAYER) {
      this.sendBattleMessage({
        type: 'score',
        playerId: PlayerType.PLAYER_2,
        data: { score: this.player2.score },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 玩家1失去生命
   */
  protected losePlayer1Life(): void {
    this.player1.lives--;
    this.updateLivesDisplay();

    // 网络对战模式下发送更新
    if (this.battleMode === BattleMode.ONLINE_MULTIPLAYER) {
      this.sendBattleMessage({
        type: 'lives',
        playerId: PlayerType.PLAYER_1,
        data: { lives: this.player1.lives },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 玩家2失去生命
   */
  protected losePlayer2Life(): void {
    this.player2.lives--;
    this.updateLivesDisplay();

    // 网络对战模式下发送更新
    if (this.battleMode === BattleMode.ONLINE_MULTIPLAYER) {
      this.sendBattleMessage({
        type: 'lives',
        playerId: PlayerType.PLAYER_2,
        data: { lives: this.player2.lives },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 更新分数显示
   */
  protected updateScoreDisplay(): void {
    this.children.list.forEach((child: any) => {
      if (child.text?.startsWith('玩家1:')) {
        child.text = `玩家1: ${this.player1.score}`;
      }
      if (child.text?.startsWith('玩家2:')) {
        child.text = `玩家2: ${this.player2.score}`;
      }
    });
  }

  /**
   * 更新生命显示
   */
  protected updateLivesDisplay(): void {
    // 子类可以扩展
  }

  /**
   * 更新时间显示
   */
  protected updateTimeDisplay(): void {
    if (!this.battleConfig.timeLimit) return;

    const remainingTime = Math.max(0, this.battleConfig.timeLimit - this.gameTime);
    this.children.list.forEach((child: any) => {
      if (child.text?.startsWith('时间:')) {
        child.text = `时间: ${Math.ceil(remainingTime)}`;
      }
    });
  }

  /**
   * 获取当前玩家状态
   */
  protected getCurrentPlayerState(): PlayerState {
    return this.currentPlayer === PlayerType.PLAYER_1 ? this.player1 : this.player2;
  }

  // ===== 抽象方法 - 子类必须实现 =====

  /**
   * 创建游戏内容
   */
  protected abstract createGameContent(): void;

  /**
   * 游戏开始回调
   */
  protected abstract onGameStart(): void;

  /**
   * 更新玩家1
   */
  protected abstract updatePlayer1(delta: number): void;

  /**
   * 更新玩家2
   */
  protected abstract updatePlayer2(delta: number): void;

  /**
   * 游戏结束回调
   */
  protected abstract onGameEnd(winner: PlayerType): void;
}
