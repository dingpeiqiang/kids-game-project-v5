<template>
  <header class="base-header" :class="[variant, { sticky: isSticky }]">
    <!-- 左侧区域 - Logo、返回按钮等 -->
    <div class="header-left">
      <slot name="left">
        <button v-if="showBack" class="back-btn" @click="handleBack">
          ←
        </button>
        <h1 v-if="logo" class="logo">{{ logo }}</h1>
      </slot>
    </div>

    <!-- 中间区域 - 导航、标题等 -->
    <div class="header-center">
      <slot name="center">
        <h2 v-if="title" class="header-title">{{ title }}</h2>
      </slot>
    </div>

    <!-- 右侧区域 - 用户信息、通知、退出等 -->
    <div class="header-right">
      <slot name="right">
        <NotificationBadge
          v-if="showNotifications"
          :count="notificationCount"
          @click="handleNotifications"
        />
        <UserInfo
          v-if="showUserInfo"
          :avatar="avatar"
          :username="username"
          :role="userRole"
        />
        <ExitButton v-if="showExit" @exit="handleExit" />
        <!-- 主题功能已移动到创作者中心 -->
      </slot>
    </div>
  </header>
</template>

<script setup lang="ts">
import NotificationBadge from './NotificationBadge.vue';
import UserInfo from './UserInfo.vue';
import ExitButton from './ExitButton.vue';

interface Props {
  variant?: 'default' | 'kids' | 'parent' | 'admin';
  isSticky?: boolean;
  logo?: string;
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  notificationCount?: number;
  showUserInfo?: boolean;
  avatar?: string;
  username?: string;
  userRole?: string;
  showExit?: boolean;
  showThemeSwitcher?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  isSticky: true,
  showBack: false,
  showNotifications: true,
  notificationCount: 0,
  showUserInfo: true,
  showExit: true,
  showThemeSwitcher: false
});

const emit = defineEmits<{
  back: [];
  notifications: [];
  exit: [];
}>();

function handleBack() {
  emit('back');
}

function handleNotifications() {
  emit('notifications');
}

function handleExit() {
  emit('exit');
}
</script>

<style scoped lang="scss">
.base-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &.sticky {
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-left,
  .header-center,
  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-left {
    flex: 0 0 auto;
  }

  .header-center {
    flex: 1;
    justify-content: center;
  }

  .header-right {
    flex: 0 0 auto;
  }

  /* Logo 样式 */
  .logo {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* 标题样式 */
  .header-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0;
  }

  /* 返回按钮 */
  .back-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: #f5f5f5;
    border-radius: 8px;
    cursor: pointer;
    font-size: 20px;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: #e0e0e0;
      color: #333;
    }
  }

  /* 变体样式 */
  &.variant-kids {
    background: linear-gradient(135deg, #FFE5EC 0%, #FFF5E6 100%);
    .logo {
      background: linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  &.variant-parent {
    background: linear-gradient(135deg, #E8F4FD 0%, #F0E6FF 100%);
    .logo {
      background: linear-gradient(135deg, #4A90E2 0%, #9B59B6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  &.variant-admin {
    background: #2c3e50;
    .logo {
      background: linear-gradient(135deg, #3498db 0%, #1abc9c 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .header-title {
      color: white;
    }
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .base-header {
    padding: 12px 16px;

    .logo {
      font-size: 20px;
    }

    .header-title {
      font-size: 16px;
    }

    .header-right {
      gap: 8px;
    }
  }
}

@media (max-width: 480px) {
  .base-header {
    padding: 10px 12px;

    .logo {
      font-size: 18px;
    }

    .header-title {
      font-size: 14px;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
