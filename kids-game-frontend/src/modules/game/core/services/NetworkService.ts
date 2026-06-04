import {
  INetworkService,
  NetworkConfig,
  ConnectionState,
  NetworkMessage,
  NetworkMessageType,
} from '../interfaces/ServiceInterface';

/**
 * 网络服务实现
 * 提供WebSocket通信、消息收发、自动重连等功能
 */
export class NetworkService implements INetworkService {
  private config: NetworkConfig;
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts: number = 0;
  private heartbeatTimer: number | null = null;
  private messageQueue: any[] = [];
  private subscribers: Map<string, Array<(message: any) => void>> = new Map();
  private pendingRequests: Map<string, { resolve: (value: any) => void; reject: (error: any) => void; timer: number }> = new Map();
  private lastHeartbeatTime: number = 0;
  private latency: number = 0;
  private isInitialized: boolean = false;

  constructor(config?: Partial<NetworkConfig>) {
    this.config = {
      serverUrl: 'ws://localhost:8080',
      maxReconnectAttempts: 5,
      reconnectInterval: 3000,
      heartbeatInterval: 30000,
      messageTimeout: 5000,
      enableCompression: false,
      ...config,
    };
  }

  /**
   * 初始化网络服务
   */
  initialize(config: NetworkConfig): void {
    this.config = { ...this.config, ...config };
    this.isInitialized = true;
    this.log('NetworkService initialized', config);
  }

  /**
   * 连接服务器
   */
  async connect(roomId: string): Promise<void> {
    if (this.connectionState === ConnectionState.CONNECTED) {
      this.log('Already connected');
      return;
    }

    this.connectionState = ConnectionState.CONNECTING;
    this.log('Connecting to server...', { roomId });

    return new Promise((resolve, reject) => {
      try {
        const url = `${this.config.serverUrl}/${roomId}`;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.connectionState = ConnectionState.CONNECTED;
          this.reconnectAttempts = 0;
          this.lastHeartbeatTime = Date.now();
          this.log('Connected to server');

          // 启动心跳
          this.startHeartbeat();

          // 发送队列中的消息
          this.flushMessageQueue();

          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          this.log('WebSocket error:', error);
          this.connectionState = ConnectionState.ERROR;
        };

        this.ws.onclose = (event) => {
          this.log('WebSocket closed', { code: event.code, reason: event.reason });
          this.stopHeartbeat();

          if (this.connectionState === ConnectionState.CONNECTED) {
            this.connectionState = ConnectionState.DISCONNECTED;
            // 尝试重连
            this.reconnect();
          }

          if (event.code !== 1000 && this.connectionState === ConnectionState.CONNECTING) {
            reject(new Error('Connection failed'));
          }
        };
      } catch (error) {
        this.log('Failed to connect:', error);
        this.connectionState = ConnectionState.ERROR;
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.log('Disconnecting...');

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }

    this.connectionState = ConnectionState.DISCONNECTED;
    this.reconnectAttempts = 0;
    this.messageQueue = [];
    this.subscribers.clear();

    this.log('Disconnected');
  }

  /**
   * 发送消息
   */
  send(message: any): void {
    if (!this.isConnected()) {
      this.log('Not connected, queuing message');
      this.messageQueue.push(message);
      return;
    }

    try {
      const data = JSON.stringify(message);
      this.ws!.send(data);
      this.log('Sent message', { type: message.type });
    } catch (error) {
      this.log('Failed to send message:', error);
      this.messageQueue.push(message);
    }
  }

  /**
   * 批量发送消息
   */
  sendBatch(messages: any[]): void {
    messages.forEach(message => this.send(message));
    this.log(`Sent ${messages.length} messages in batch`);
  }

  /**
   * 订阅消息类型
   */
  subscribe(messageType: string, callback: (message: any) => void): void {
    if (!this.subscribers.has(messageType)) {
      this.subscribers.set(messageType, []);
    }

    this.subscribers.get(messageType)!.push(callback);
    this.log(`Subscribed to message type: ${messageType}`);
  }

  /**
   * 取消订阅
   */
  unsubscribe(messageType: string, callback: (message: any) => void): void {
    const callbacks = this.subscribers.get(messageType);
    if (!callbacks) return;

    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.log(`Unsubscribed from message type: ${messageType}`);
    }

    // 如果没有回调了，删除键
    if (callbacks.length === 0) {
      this.subscribers.delete(messageType);
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 发起请求（请求-响应模式）
   */
  request<T = any>(request: any, timeout?: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const message = { ...request, requestId };

      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout: ${requestId}`));
      }, timeout ?? this.config.messageTimeout);

      this.pendingRequests.set(requestId, { resolve, reject, timer });

      // 订阅响应
      const callback = (response: any) => {
        if (response.requestId === requestId) {
          clearTimeout(timer);
          this.pendingRequests.delete(requestId);
          this.unsubscribe('response', callback);

          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.data as T);
          }
        }
      };

      this.subscribe('response', callback);
      this.send(message);
    });
  }

  /**
   * 发送心跳
   */
  sendHeartbeat(): void {
    if (!this.isConnected()) return;

    const now = Date.now();
    const heartbeatMessage: NetworkMessage = {
      type: NetworkMessageType.READY,
      playerId: 'system',
      data: { timestamp: now },
      timestamp: now,
    };

    this.send(heartbeatMessage);
    this.lastHeartbeatTime = now;
  }

  /**
   * 重连
   */
  async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('Max reconnect attempts reached, giving up');
      this.connectionState = ConnectionState.ERROR;
      return;
    }

    this.reconnectAttempts++;
    this.connectionState = ConnectionState.RECONNECTING;
    this.log(`Reconnecting... (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    await new Promise(resolve => setTimeout(resolve, this.config.reconnectInterval));

    try {
      // 获取房间ID（从上次连接的URL中提取）
      const roomId = this.ws?.url?.split('/').pop() || 'default';
      await this.connect(roomId);
    } catch (error) {
      this.log('Reconnect failed:', error);
      this.reconnect();
    }
  }

  /**
   * 获取网络延迟
   */
  getLatency(): number {
    return this.latency;
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // 计算延迟
      const now = Date.now();
      this.latency = now - message.timestamp;

      this.log('Received message', { type: message.type, latency: this.latency });

      // 通知订阅者
      const callbacks = this.subscribers.get(message.type);
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(message);
          } catch (error) {
            this.log('Error in subscriber callback:', error);
          }
        });
      }
    } catch (error) {
      this.log('Failed to parse message:', error);
    }
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = window.setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);

    this.log('Heartbeat started', { interval: this.config.heartbeatInterval });
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.log('Heartbeat stopped');
  }

  /**
   * 刷新消息队列
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
    this.log(`Flushed ${this.messageQueue.length} queued messages`);
  }

  /**
   * 记录日志
   */
  private log(message: string, data?: any): void {
    console.log(`[NetworkService] ${message}`, data ? data : '');
  }

  /**
   * 获取统计信息
   */
  getStatistics(): Record<string, any> {
    return {
      connectionState: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      latency: this.latency,
      messageQueueSize: this.messageQueue.length,
      subscribers: Array.from(this.subscribers.entries()).map(([type, callbacks]) => ({
        type,
        count: callbacks.length,
      })),
      pendingRequests: this.pendingRequests.size,
      isInitialized: this.isInitialized,
    };
  }

  /**
   * 清空订阅
   */
  clearSubscribers(): void {
    this.subscribers.clear();
    this.log('Cleared all subscribers');
  }
}
