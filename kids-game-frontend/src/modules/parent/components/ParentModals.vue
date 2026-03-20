<template>
  <!-- 通知弹窗 -->
  <KidUnifiedModalV2
    :show="showNotifications"
    title="🔔 通知中心"
    size="lg"
    :closable="true"
    :show-footer="false"
    @update:show="$emit('closeNotifications')"
    @close="$emit('closeNotifications')"
  >
    <div class="notifications-header">
      <h3 class="modal-title">🔔 通知中心</h3>
      <div class="notifications-actions">
        <span class="unread-count">{{ unreadCount }}条未读</span>
        <button v-if="hasUnread" @click="markAllAsRead" class="mark-all-btn">
          全部已读
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="notifications-loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="notifications.length === 0" class="notifications-empty">
      <span class="empty-icon">📭</span>
      <p>暂无通知</p>
    </div>

    <div v-else class="notifications-list">
      <div
        v-for="notification in notifications"
        :key="notification.notificationId"
        class="notification-item"
        :class="{
          unread: notification.isRead === 0,
          'bind-request': notification.type === 'BIND_REQUEST',
          expired: notification.status === 3
        }"
      >
        <div class="notification-icon">
          {{ getNotificationIcon(notification.type) }}
        </div>
        <div class="notification-content">
          <h4 class="notification-title">{{ notification.title }}</h4>
          <p class="notification-text">{{ notification.content }}</p>
          <div class="notification-meta">
            <span class="notification-time">{{ formatTime(notification.createTime) }}</span>
            <span class="notification-status" :class="getStatusClass(notification.status)">
              {{ getStatusText(notification.status) }}
            </span>
          </div>

          <!-- 绑定请求操作按钮 -->
          <div
            v-if="notification.type === 'BIND_REQUEST' && notification.status === 0"
            class="bind-request-actions"
          >
            <button
              @click="handleBindRequest(notification.notificationId, true)"
              class="action-btn accept"
              :disabled="isProcessing"
            >
              ✓ 接受
            </button>
            <button
              @click="handleBindRequest(notification.notificationId, false)"
              class="action-btn reject"
              :disabled="isProcessing"
            >
              ✕ 拒绝
            </button>
          </div>

          <!-- 标记已读按钮 -->
          <button
            v-else-if="notification.isRead === 0"
            @click="markAsRead(notification.notificationId)"
            class="mark-read-btn"
          >
            标为已读
          </button>
        </div>
      </div>
    </div>
  </KidUnifiedModalV2>

  <!-- 头像选择弹窗 -->
  <KidUnifiedModalV2
    :show="showAvatarPicker"
    title="选择你的头像 🎨"
    size="md"
    :closable="true"
    :show-footer="false"
    @update:show="$emit('closeAvatarPicker')"
    @close="$emit('closeAvatarPicker')"
  >
    <div class="avatar-grid">
      <button
        v-for="avatar in avatars"
        :key="avatar"
        class="avatar-option"
        :class="{ active: currentAvatar === avatar }"
        @click="$emit('changeAvatar', avatar)"
      >
        <img v-if="isImageUrl(avatar)" :src="avatar" alt="头像" class="option-avatar-image" />
        <span v-else class="option-avatar-emoji">{{ avatar }}</span>
      </button>
    </div>
  </KidUnifiedModalV2>

  <!-- 退出确认弹窗 -->
  <KidSimpleModal
    :model-value="showLogoutConfirm"
    title="退出登录"
    message="确定要退出登录吗？退出后需要重新登录才能管理孩子。"
    icon="👋"
    confirm-type="danger"
    cancel-text="取消"
    confirm-text="退出"
    @update:model-value="$emit('closeLogoutConfirm')"
    @cancel="$emit('closeLogoutConfirm')"
    @confirm="$emit('confirmLogout')"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { notificationApi } from '@/services/notification-api.service';
import type { Notification as ApiNotification } from '@/services/api.types';
import { modal } from '@/composables/useUnifiedModalV2';
import KidUnifiedModalV2 from '@/components/ui/KidUnifiedModalV2.vue';
import KidSimpleModal from '@/components/ui/KidSimpleModal.vue';

const props = defineProps<{
  showNotifications: boolean;
  showAvatarPicker: boolean;
  showLogoutConfirm: boolean;
  userId: number;
  userType: number; // 0-儿童, 1-家长
  avatars: string[];
  currentAvatar?: string;
}>();

const emit = defineEmits<{
  closeNotifications: [];
  closeAvatarPicker: [];
  closeLogoutConfirm: [];
  changeAvatar: [avatar: string];
  confirmLogout: [];
  notificationsLoaded: [count: number];
}>();

// 状态
const notifications = ref<ApiNotification[]>([]);
const isLoading = ref(false);
const isProcessing = ref(false);
const errorMessage = ref('');

// 计算属性
const unreadCount = computed(() => {
  return notifications.value.filter(n => n.isRead === 0).length;
});

const hasUnread = computed(() => unreadCount.value > 0);

// 方法
async function loadNotifications() {
  if (!props.userId) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    notifications.value = await notificationApi.getList(props.userId, props.userType);
    emit('notificationsLoaded', unreadCount.value);
  } catch (err: any) {
    errorMessage.value = err.message || '加载通知失败';
    console.error('加载通知失败:', err);
  } finally {
    isLoading.value = false;
  }
}

async function markAsRead(notificationId: number) {
  try {
    await notificationApi.markAsRead(notificationId);

    // 更新本地状态
    const notification = notifications.value.find(n => n.notificationId === notificationId);
    if (notification) {
      notification.isRead = 1;
    }

    emit('notificationsLoaded', unreadCount.value);
  } catch (err: any) {
    errorMessage.value = err.message || '操作失败';
    console.error('标记已读失败:', err);
  }
}

async function markAllAsRead() {
  try {
    await notificationApi.markAllAsRead(props.userId, props.userType);

    // 更新本地状态
    notifications.value.forEach(n => {
      if (n.isRead === 0) {
        n.isRead = 1;
      }
    });

    emit('notificationsLoaded', 0);
  } catch (err: any) {
    errorMessage.value = err.message || '操作失败';
    console.error('标记全部已读失败:', err);
  }
}

async function handleBindRequest(notificationId: number, accept: boolean) {
  isProcessing.value = true;
  errorMessage.value = '';

  try {
    await notificationApi.handleBindRequest(notificationId, accept);

    // 更新本地状态
    const notification = notifications.value.find(n => n.notificationId === notificationId);
    if (notification) {
      notification.status = accept ? 1 : 2; // 1-已接受, 2-已拒绝
      notification.isRead = 1;
    }

    emit('notificationsLoaded', unreadCount.value);

    // 重新加载通知列表以获取最新状态
    await loadNotifications();
  } catch (err: any) {
    errorMessage.value = err.message || '操作失败';
    console.error('处理绑定请求失败:', err);
  } finally {
    isProcessing.value = false;
  }
}

function getNotificationIcon(type: string): string {
  const iconMap: Record<string, string> = {
    'BIND_REQUEST': '🔗',
    'GAME_LIMIT': '🛡️',
    'SYSTEM': '📢',
  };
  return iconMap[type] || '🔔';
}

function getStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    0: '待处理',
    1: '已接受',
    2: '已拒绝',
    3: '已过期',
  };
  return statusMap[status] || '未知';
}

function getStatusClass(status: number): string {
  const classMap: Record<number, string> = {
    0: 'pending',
    1: 'accepted',
    2: 'rejected',
    3: 'expired',
  };
  return classMap[status] || '';
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`;
  } else {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
}

function isImageUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/');
}

// 监听显示状态，自动加载通知
function onShowNotificationsChanged() {
  if (props.showNotifications) {
    loadNotifications();
  }
}

// 暴露方法供父组件调用
defineExpose({
  loadNotifications
});

// 监听props变化
import { watch } from 'vue';
watch(() => props.showNotifications, onShowNotificationsChanged);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

/* 通知弹窗 */
.notifications-modal,
.avatar-modal,
.confirm-modal {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-title {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

/* 通知头部 */
.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.notifications-header .modal-title {
  margin: 0;
}

.notifications-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.unread-count {
  font-size: 0.85rem;
  color: #666;
  padding: 0.25rem 0.75rem;
  background: #f9fafb;
  border-radius: 20px;
}

.mark-all-btn {
  padding: 0.4rem 0.8rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.mark-all-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

/* 加载状态 */
.notifications-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 空状态 */
.notifications-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #999;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.notifications-empty p {
  margin: 0;
  font-size: 0.95rem;
}

/* 通知列表 */
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.notification-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 12px;
  border-left: 3px solid transparent;
  transition: all 0.3s;
}

.notification-item.unread {
  background: white;
  border-left-color: #667eea;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.notification-item.bind-request {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-left-color: #f59e0b;
}

.notification-item.expired {
  opacity: 0.6;
  background: #f3f4f6;
}

.notification-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  font-weight: bold;
  color: #333;
}

.notification-text {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  color: #666;
  line-height: 1.4;
}

.notification-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.notification-time {
  font-size: 0.75rem;
  color: #999;
}

.notification-status {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.notification-status.pending {
  background: #fef3c7;
  color: #d97706;
}

.notification-status.accepted {
  background: #dcfce7;
  color: #166534;
}

.notification-status.rejected {
  background: #fee2e2;
  color: #dc2626;
}

.notification-status.expired {
  background: #f3f4f6;
  color: #666;
}

/* 绑定请求操作按钮 */
.bind-request-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.action-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.3s;
}

.action-btn.accept {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.action-btn.accept:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.action-btn.reject {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.action-btn.reject:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mark-read-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.3s;
}

.mark-read-btn:hover {
  transform: scale(1.05);
}

/* 头像选择 */
.avatar-modal {
  max-width: 600px;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.avatar-option {
  width: 70px;
  height: 70px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.avatar-option:hover {
  transform: scale(1.1);
  border-color: #667eea;
}

.avatar-option.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.option-avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.option-avatar-emoji {
  font-size: 2.5rem;
  line-height: 1;
}

/* 退出确认 */
.confirm-modal {
  max-width: 400px;
  text-align: center;
}

.modal-text {
  color: #666;
  margin: 0 0 2rem 0;
  font-size: 1rem;
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.btn-secondary,
.btn-primary {
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary {
  background: #f3f4f6;
  color: #666;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.close-modal-btn {
  width: 100%;
  padding: 1rem;
  background: #f3f4f6;
  color: #666;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.close-modal-btn:hover {
  background: #e5e7eb;
}

@media (max-width: 768px) {
  .notifications-modal,
  .avatar-modal,
  .confirm-modal {
    padding: 1.5rem;
    width: 95%;
  }

  .notifications-header {
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .avatar-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }

  .avatar-option {
    width: 55px;
    height: 55px;
  }

  .option-avatar-emoji {
    font-size: 2rem;
  }
}
</style>
