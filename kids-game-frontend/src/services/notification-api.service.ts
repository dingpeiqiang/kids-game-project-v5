/**
 * 消息通知相关 API 服务
 */
import { BaseApiService } from './base-api.service';

export interface Notification {
  notificationId: number;
  userId: number;
  userType: number; // 0-儿童, 1-家长
  type: string; // BIND_REQUEST, GAME_LIMIT, SYSTEM
  title: string;
  content: string;
  status: number; // 0-待处理, 1-已接受, 2-已拒绝, 3-已过期
  isRead: number; // 0-未读, 1-已读
  relatedId?: number;
  senderId?: number;
  senderType?: number;
  extraData?: string;
  createTime: number;
  updateTime: number;
  expireTime?: number;
}

export class NotificationApiService extends BaseApiService {
  private static instance: NotificationApiService;

  private constructor() {
    super();
  }

  static getInstance(): NotificationApiService {
    if (!NotificationApiService.instance) {
      NotificationApiService.instance = new NotificationApiService();
    }
    return NotificationApiService.instance;
  }

  /**
   * 获取用户通知列表
   */
  async getNotifications(userId: number, userType: number): Promise<Notification[]> {
    return this.get<Notification[]>('/api/notification/list', {
      userId,
      userType
    });
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(userId: number, userType: number): Promise<number> {
    return this.get<number>('/api/notification/unread-count', {
      userId,
      userType
    });
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId: number): Promise<void> {
    await this.put('/api/notification/read', { notificationId });
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(userId: number, userType: number): Promise<void> {
    await this.put('/api/notification/read-all', {
      userId,
      userType
    });
  }

  /**
   * 处理绑定请求（接受或拒绝）
   */
  async handleBindRequest(notificationId: number, accept: boolean): Promise<void> {
    await this.post('/api/notification/handle-bind-request', {
      notificationId,
      accept
    });
  }
}

export const notificationApi = NotificationApiService.getInstance();
export default notificationApi;
