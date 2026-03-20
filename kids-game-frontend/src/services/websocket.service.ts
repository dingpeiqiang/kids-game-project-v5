/**
 * WebSocket 实时通信服务
 * 功能：管理 WebSocket 连接，实时同步疲劳点，推送远程控制消息
 * 从 platform 迁移到 frontend，适配 Vue 3 + Vite
 */
import { envConfig } from '@/core/config';

export enum WSMessageType {
  // 疲劳点相关
  FATIGUE_POINTS_UPDATE = 'fatigue_points_update',
  FATIGUE_POINTS_LOW = 'fatigue_points_low',
  FATIGUE_POINTS_EXHAUSTED = 'fatigue_points_exhausted',

  // 游戏控制相关
  GAME_PAUSE = 'game_pause',
  GAME_RESUME = 'game_resume',
  GAME_KICK = 'game_kick',

  // 管控规则相关
  PARENT_LIMIT_UPDATE = 'parent_limit_update',
  TIME_RESTRICTION_UPDATE = 'time_restriction_update',

  // 系统相关
  HEARTBEAT = 'heartbeat',
  PING = 'ping',
  PONG = 'pong',
}

export interface WSMessage {
  type: WSMessageType;
  data?: any;
  timestamp?: number;
}

export interface WSConnectionConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export interface WSConnectionStatus {
  connected: boolean;
  connecting: boolean;
  reconnectAttempts: number;
  lastConnectedAt?: number;
  lastMessageAt?: number;
}

type WSEventHandler = (data: any) => void;

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;

  private config: Required<WSConnectionConfig> = {
    url: '',
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
  };

  private status: WSConnectionStatus = {
    connected: false,
    connecting: false,
    reconnectAttempts: 0,
  };

  private eventHandlers: Map<WSMessageType | 'connect' | 'disconnect' | 'error', WSEventHandler[]> = new Map();
  private messageQueue: WSMessage[] = [];
  private isInitialized = false;
  private kidId: number | string | null = null;

  private constructor() {
    // 私有构造函数，确保单例
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * 初始化服务
   */
  async initialize(kidId: number | string): Promise<void> {
    if (this.isInitialized) {
      console.warn('[WebSocket] 服务已初始化');
      return;
    }

    this.kidId = kidId;

    // 获取WebSocket URL
    const apiBaseUrl = envConfig.apiBaseUrl.replace('/api', '');
    const wsProtocol = apiBaseUrl.startsWith('https') ? 'wss://' : 'ws://';
    const wsHost = apiBaseUrl.replace(/^https?:\/\//, '');

    this.config.url = `${wsProtocol}${wsHost}/ws/${kidId}`;

    console.log('[WebSocket] 初始化服务, URL:', this.config.url);

    this.connect();
    this.isInitialized = true;
  }

  /**
   * 连接
   */
  connect(): void {
    if (this.status.connected || this.status.connecting) {
      console.warn('[WebSocket] 已连接或正在连接中');
      return;
    }

    console.log('[WebSocket] 尝试连接...');

    this.status.connecting = true;
    this.status.reconnectAttempts = 0;

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupWebSocketHandlers();
    } catch (error) {
      console.error('[WebSocket] 连接失败:', error);
      this.handleConnectionError(error);
    }
  }

  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('[WebSocket] 连接成功');
      this.handleConnectionOpen();
    };

    this.ws.onclose = (event) => {
      console.log('[WebSocket] 连接关闭, code:', event.code, 'reason:', event.reason);
      this.handleConnectionClose(event);
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] 连接错误:', error);
      this.handleConnectionError(error);
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };
  }

  private handleConnectionOpen(): void {
    this.status.connected = true;
    this.status.connecting = false;
    this.status.reconnectAttempts = 0;
    this.status.lastConnectedAt = Date.now();

    // 清除重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 启动心跳
    this.startHeartbeat();

    // 发送缓存的消息
    this.flushMessageQueue();

    // 触发连接成功事件
    this.emit('connect', null);
  }

  private handleConnectionClose(event: CloseEvent): void {
    this.status.connected = false;
    this.status.connecting = false;

    // 停止心跳
    this.stopHeartbeat();

    // 触发断开连接事件
    this.emit('disconnect', { code: event.code, reason: event.reason });

    // 如果是非正常关闭，尝试重连
    if (event.code !== 1000) {
      this.reconnect();
    }
  }

  private handleConnectionError(error: any): void {
    this.status.connecting = false;
    this.emit('error', error);
  }

  /**
   * 重连
   */
  reconnect(): void {
    if (this.status.connected || this.status.connecting) {
      return;
    }

    if (this.status.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[WebSocket] 已达到最大重连次数:', this.config.maxReconnectAttempts);
      return;
    }

    this.status.reconnectAttempts++;
    console.log(`[WebSocket] ${this.config.reconnectInterval / 1000}秒后进行第${this.status.reconnectAttempts}次重连...`);

    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, this.config.reconnectInterval);
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    console.log('[WebSocket] 断开连接');

    // 停止心跳
    this.stopHeartbeat();

    // 清除重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 关闭WebSocket
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.status.connected = false;
    this.status.connecting = false;
    this.isInitialized = false;
    this.kidId = null;
  }

  /**
   * 发送消息
   */
  send(message: WSMessage): void {
    if (this.status.connected && this.ws) {
      const messageWithTimestamp = {
        ...message,
        timestamp: Date.now(),
      };

      this.ws.send(JSON.stringify(messageWithTimestamp));
      this.status.lastMessageAt = Date.now();
    } else {
      // 缓存消息，等待连接后发送
      this.messageQueue.push(message);
      console.warn('[WebSocket] 未连接，消息已缓存:', message);
    }
  }

  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) {
      return;
    }

    console.log('[WebSocket] 发送缓存的消息，数量:', this.messageQueue.length);

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    messages.forEach(message => {
      this.send(message);
    });
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WSMessage = JSON.parse(event.data);
      this.status.lastMessageAt = Date.now();

      console.log('[WebSocket] 收到消息:', message);

      // 处理特殊消息
      switch (message.type) {
        case WSMessageType.PING:
          this.send({ type: WSMessageType.PONG });
          return;

        case WSMessageType.PONG:
          // 心跳响应，无需处理
          return;
      }

      // 触发对应类型的事件
      this.emit(message.type, message.data);
    } catch (error) {
      console.error('[WebSocket] 解析消息失败:', error);
    }
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = window.setInterval(() => {
      if (this.status.connected) {
        this.send({ type: WSMessageType.HEARTBEAT });
      }
    }, this.config.heartbeatInterval);

    console.log('[WebSocket] 已启动心跳，间隔:', this.config.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 监听事件
   */
  on(event: WSMessageType | 'connect' | 'disconnect' | 'error', handler: WSEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * 移除事件监听
   */
  off(event: WSMessageType | 'connect' | 'disconnect' | 'error', handler: WSEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: WSMessageType | 'connect' | 'disconnect' | 'error', data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[WebSocket] 事件处理器执行失败, event: ${event}`, error);
        }
      });
    }
  }

  // ===== 便捷方法 =====

  onFatiguePointsUpdate(handler: (points: number) => void): void {
    this.on(WSMessageType.FATIGUE_POINTS_UPDATE, (data) => {
      handler(data.points || 0);
    });
  }

  onFatiguePointsLow(handler: (info: { points: number; threshold: number }) => void): void {
    this.on(WSMessageType.FATIGUE_POINTS_LOW, (data) => {
      handler({
        points: data.points || 0,
        threshold: data.threshold || 3,
      });
    });
  }

  onFatiguePointsExhausted(handler: () => void): void {
    this.on(WSMessageType.FATIGUE_POINTS_EXHAUSTED, () => {
      handler();
    });
  }

  onGamePause(handler: (reason: string) => void): void {
    this.on(WSMessageType.GAME_PAUSE, (data) => {
      handler(data.reason || '家长远程暂停');
    });
  }

  onGameResume(handler: () => void): void {
    this.on(WSMessageType.GAME_RESUME, () => {
      handler();
    });
  }

  onParentLimitUpdate(handler: (limit: any) => void): void {
    this.on(WSMessageType.PARENT_LIMIT_UPDATE, (data) => {
      handler(data.limit || {});
    });
  }

  // ===== 状态查询 =====

  getConnectionStatus(): WSConnectionStatus {
    return { ...this.status };
  }

  isConnected(): boolean {
    return this.status.connected;
  }

  isConnecting(): boolean {
    return this.status.connecting;
  }

  getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }

  /**
   * 配置
   */
  setConfig(config: Partial<WSConnectionConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[WebSocket] 配置已更新:', this.config);
  }
}

/**
 * 导出单例实例
 */
export const webSocketService = WebSocketService.getInstance();
