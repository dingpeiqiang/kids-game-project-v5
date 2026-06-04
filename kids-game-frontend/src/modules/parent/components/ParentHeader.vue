<template>
  <BaseHeader variant="parent" class="kids-header">
    <template #left>
      <h1 class="logo">⭐ 星光游学</h1>
      <div class="header-decoration">
        <span class="decoration-star">✨</span>
        <span class="decoration-star">🌟</span>
        <span class="decoration-star">✨</span>
      </div>
    </template>

    <template #center>
      <div class="weather-widget" title="今日天气">
        <span class="weather-icon">☀️</span>
        <span class="weather-temp">25°C</span>
      </div>
    </template>

    <template #right>
      <button @click="$emit('showNotifications')" class="notification-btn" title="通知">
        🔔
        <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
      </button>
      <div class="user-info">
        <div class="user-avatar" @click="$emit('showAvatarPicker')" title="点击更换头像">
          <img v-if="isImageUrl(avatar)" :src="avatar" alt="头像" class="avatar-image" />
          <span v-else class="avatar-emoji">{{ avatar || '👨‍👩‍👧' }}</span>
        </div>
        <div class="user-details">
          <span class="user-name">{{ displayName }}</span>
          <span class="user-level">家长</span>
        </div>
      </div>
      <button @click="$emit('logout')" class="exit-btn" title="退出">
        🚪
      </button>
    </template>
  </BaseHeader>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseHeader from '@/components/layout/BaseHeader.vue';

const props = defineProps<{
  avatar?: string;
  username?: string;
  unreadCount: number;
}>();

defineEmits<{
  showNotifications: [];
  showAvatarPicker: [];
  logout: [];
}>();

const displayName = computed(() => {
  return props.username || '家长';
});

function isImageUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/');
}
</script>

<style scoped>
.logo {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-decoration {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;
}

.decoration-star {
  font-size: 1.2rem;
  animation: starTwinkle 1.5s ease-in-out infinite;
  display: inline-block;
}

@keyframes starTwinkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.9) rotate(15deg);
  }
}

.weather-widget {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border-radius: 20px;
  border: 2px solid #fdba74;
}

.weather-icon {
  font-size: 1.5rem;
}

.weather-temp {
  font-size: 0.9rem;
  font-weight: bold;
  color: #c2410c;
}

.notification-btn {
  width: 44px;
  height: 44px;
  font-size: 1.2rem;
  background: white;
  border: 2px solid #667eea;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
  position: relative;
}

.notification-btn:hover {
  background: #667eea;
  transform: scale(1.05);
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 25px;
  border: 2px solid rgba(102, 126, 234, 0.5);
  cursor: pointer;
  transition: all 0.3s;
}

.user-info:hover {
  background: white;
  transform: scale(1.02);
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
}

.user-name {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.user-level {
  font-size: 0.7rem;
  color: #667eea;
  font-weight: bold;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  padding: 0.1rem 0.4rem;
  border-radius: 8px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border-radius: 50%;
  border: 2px solid #667eea;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-emoji {
  line-height: 1;
}

.exit-btn {
  width: 44px;
  height: 44px;
  font-size: 1.2rem;
  background: white;
  border: 2px solid #ef4444;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
}

.exit-btn:hover {
  background: #ef4444;
  color: white;
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .header-decoration {
    display: none;
  }

  .user-details {
    display: none;
  }

  .logo {
    font-size: 1.2rem;
  }
}
</style>
