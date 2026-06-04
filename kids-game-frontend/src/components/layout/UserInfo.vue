<template>
  <div class="user-info">
    <div class="user-avatar" :style="{ background: avatarBackground }">
      {{ avatarText }}
    </div>
    <div class="user-details">
      <span class="user-name">{{ displayName }}</span>
      <span v-if="userRole" class="user-role">{{ roleText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  avatar?: string;
  username?: string;
  userRole?: string;
}

const props = withDefaults(defineProps<Props>(), {
  avatar: '',
  username: '用户',
  userRole: ''
});

// 显示名称
const displayName = computed(() => {
  if (!props.username || props.username === '用户') {
    return '未登录';
  }
  return props.username;
});

// 头像文字
const avatarText = computed(() => {
  if (props.avatar) {
    // 如果是表情符号或图标，直接显示
    if (props.avatar.length <= 2) {
      return props.avatar;
    }
  }
  // 否则显示用户名首字
  return displayName.value.charAt(0).toUpperCase();
});

// 头像背景色
const avatarBackground = computed(() => {
  if (props.avatar) {
    // 如果有头像图片，返回图片URL
    if (props.avatar.length > 2) {
      return `url(${props.avatar}) center/cover`;
    }
  }
  // 根据角色生成不同颜色
  const colors: Record<string, string> = {
    '儿童': 'linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%)',
    '家长': 'linear-gradient(135deg, #4A90E2 0%, #9B59B6 100%)',
    '管理员': 'linear-gradient(135deg, #3498db 0%, #1abc9c 100%)'
  };
  return colors[props.userRole] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
});

// 角色文字
const roleText = computed(() => {
  const roleMap: Record<string, string> = {
    '儿童': '小朋友',
    '家长': '家长',
    '管理员': '管理员'
  };
  return roleMap[props.userRole] || props.userRole;
});
</script>

<style scoped lang="scss">
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f5f5f5;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e8e8e8;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
  }

  .user-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .user-name {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-role {
    font-size: 12px;
    color: #999;
  }
}

@media (max-width: 768px) {
  .user-info {
    gap: 6px;
    padding: 4px 8px;

    .user-avatar {
      width: 28px;
      height: 28px;
      font-size: 12px;
    }

    .user-name {
      font-size: 13px;
      max-width: 80px;
    }

    .user-role {
      font-size: 11px;
    }
  }
}

@media (max-width: 480px) {
  .user-info {
    .user-details {
      display: none;
    }
  }
}
</style>
