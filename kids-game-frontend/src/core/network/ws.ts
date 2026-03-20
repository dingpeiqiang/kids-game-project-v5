/**
 * WebSocket封装（管控指令/状态同步）
 */
import { envConfig } from '../config';

export interface WSMessage {
  type: string;
  data: any;
  timestamp: number;
}

export type WSMessageHandler = (data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private baseUrl: string;
  private userId: string = 'guest';
  private reconnectDelay: number = 3000;
  private maxReconnect: number = 5;
  private reconnectCount: number = 0;
  private messageHandlers: Map<string, Set<WSMessageHandler>> = new Map();
  private reconnectTimer: any = null;

  constructor() {
    this.baseUrl = envConfig.wsBaseUrl;
  }

  /**
   * 设置用户ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * 连接
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const url = `${this.baseUrl}/${this.userId}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WebSocket] connected');
        this.reconnectCount = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('[WebSocket] message parse error:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] error:', error);
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] closed');
        this.handleReconnect();
      };
    } catch (error) {
      console.error('[WebSocket] connect error:', error);
      this.handleReconnect();
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 发送消息
   */
  send(type: string, data: any): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] not connected');
      return;
    }

    const message: WSMessage = {
      type,
      data,
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * 订阅消息
   */
  on(type: string, handler: WSMessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }

    this.messageHandlers.get(type)!.add(handler);

    return () => {
      this.off(type, handler);
    };
  }

  /**
   * 取消订阅
   */
  off(type: string, handler: WSMessageHandler): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * 处理消息
   */
  private handleMessage(message: WSMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message.data));
    }
  }

  /**
   * 处理重连
   */
  private handleReconnect(): void {
    if (this.reconnectCount >= this.maxReconnect) {
      console.error('[WebSocket] max reconnect attempts reached');
      return;
    }

    this.reconnectCount++;
    console.log(`[WebSocket] reconnecting (${this.reconnectCount}/${this.maxReconnect})...`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  /**
   * 获取连接状态
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WebSocketClient();
