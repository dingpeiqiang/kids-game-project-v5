/**
 * 消息通知 API
 */
import { apiClient } from './api-client.service';

export interface Notification {
  notificationId: number;
  userId: number;
  userType: number;
  type: string;
  title: string;
  content: string;
  status: number;
  isRead: number;
  relatedId?: number;
  senderId?: number;
  senderType?: number;
  extraData?: string;
  createTime: number;
  updateTime: number;
  expireTime?: number;
}

export const notificationApi = {
  getNotifications(userId: number, userType: number): Promise<Notification[]> {
    return apiClient.get<Notification[]>('/api/notification/list', {
      params: { userId, userType },
    } as never);
  },

  getUnreadCount(userId: number, userType: number): Promise<number> {
    return apiClient.get<number>('/api/notification/unread-count', {
      params: { userId, userType },
    } as never);
  },

  async markAsRead(notificationId: number): Promise<void> {
    await apiClient.put('/api/notification/read', { notificationId });
  },

  async markAllAsRead(userId: number, userType: number): Promise<void> {
    await apiClient.put('/api/notification/read-all', { userId, userType });
  },

  async handleBindRequest(notificationId: number, accept: boolean): Promise<void> {
    await apiClient.post('/api/notification/handle-bind-request', { notificationId, accept });
  },
};

export default notificationApi;