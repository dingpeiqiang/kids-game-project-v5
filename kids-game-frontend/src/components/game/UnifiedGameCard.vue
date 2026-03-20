<template>
  <div
    class="game-card"
    :class="[
      `variant-${variant}`,
      { locked: isLocked, small: size === 'small', 'is-new': game.isNew, 'is-hot': game.isHot }
    ]"
    @click="handleClick"
  >
    <div class="game-cover">
      <span class="game-icon">{{ game.icon || game.gameIcon || '🎮' }}</span>

      <!-- 新/热门标签 -->
      <div v-if="game.isNew || game.isHot" class="game-badges">
        <span v-if="game.isNew" class="badge badge-new">新</span>
        <span v-if="game.isHot" class="badge badge-hot">热门</span>
      </div>

      <!-- 收藏按钮 -->
      <button
        v-if="showFavorite && !isLocked"
        class="favorite-btn"
        :class="{ active: isFavorite }"
        @click.stop="toggleFavorite"
        :title="isFavorite ? '取消收藏' : '添加收藏'"
      >
        <span class="favorite-icon">{{ isFavorite ? '❤️' : '🤍' }}</span>
      </button>
    </div>

    <div class="game-info">
      <h3 class="game-name">{{ game.gameName || game.name }}</h3>
      <p class="game-age">{{ game.ageRange || game.grade }}年级</p>
      <!-- 默认主题显示 -->
      <p v-if="defaultThemeName" class="game-theme">
        <span class="theme-icon">🎨</span>
        <span class="theme-name">{{ defaultThemeName }}</span>
      </p>
      <p v-if="showDescription && game.description" class="game-description">
        {{ game.description }}
      </p>
    </div>

    <!-- 锁定状态 -->
    <div v-if="isLocked" class="lock-badge">
      <span class="lock-icon">{{ lockReason === '点数不足' ? '🔒' : '🚧' }}</span>
      <span class="lock-text">{{ lockReason }}</span>
    </div>

    <!-- 播放标记 -->
    <div v-if="!isLocked && showPlayBadge" class="play-badge">
      <span class="play-icon">▶️</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '@/core/store/user.store';
import { toast } from '@/services/toast.service';

interface Game {
  gameName?: string;
  name?: string;
  icon?: string;
  gameIcon?: string;
  ageRange?: string;
  grade?: string;
  description?: string;
  isNew?: boolean;
  isHot?: boolean;
  [key: string]: any;
}

interface Props {
  game: Game;
  variant?: 'blue-purple' | 'pink-orange' | 'green-teal' | 'custom';
  size?: 'normal' | 'small';
  userPoints?: number;
  isFavorite?: boolean;
  showFavorite?: boolean;
  showDescription?: boolean;
  showPlayBadge?: boolean;
  pointsRequired?: number;
  locked?: boolean;
  lockReason?: string;
  defaultThemeName?: string; // 默认主题名称
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'blue-purple',
  size: 'normal',
  userPoints: 0,
  isFavorite: false,
  showFavorite: true,
  showDescription: false,
  showPlayBadge: true,
  pointsRequired: 0,
  locked: false,
  lockReason: '点数不足',
  defaultThemeName: '',
});

const emit = defineEmits<{
  play: [game: Game];
  favorite: [game: Game, isFavorite: boolean];
}>();

const userStore = useUserStore();

// 判断是否锁定
const isLocked = computed(() => {
  if (props.locked) return true;
  if (props.pointsRequired > 0 && props.userPoints < props.pointsRequired) {
    return true;
  }
  return false;
});

const displayLockReason = computed(() => {
  if (props.locked) return props.lockReason;
  if (props.pointsRequired > 0 && props.userPoints < props.pointsRequired) {
    return '点数不足';
  }
  return '';
});

function handleClick() {
  if (isLocked.value) {
    toast.warn(displayLockReason.value || '无法开始游戏');
    return;
  }
  emit('play', props.game);
}

function toggleFavorite() {
  const newFavoriteState = !props.isFavorite;
  emit('favorite', props.game, newFavoriteState);
  toast.success(newFavoriteState ? '已添加收藏' : '已取消收藏');
}
</script>

<style scoped lang="scss">
.game-card {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(-4px) scale(0.98);
  }

  &.small {
    padding: 16px;
    border-radius: 16px;

    .game-icon {
      font-size: 40px !important;
    }

    .game-name {
      font-size: 16px !important;
    }

    .game-age {
      font-size: 12px !important;
    }
  }

  &.locked {
    filter: grayscale(0.5);
    cursor: not-allowed;

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }

  /* 变体样式 */
  &.variant-blue-purple {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    &:hover {
      box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
    }
  }

  &.variant-pink-orange {
    background: linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%);

    &:hover {
      box-shadow: 0 12px 40px rgba(255, 107, 157, 0.4);
    }
  }

  &.variant-green-teal {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);

    &:hover {
      box-shadow: 0 12px 40px rgba(17, 153, 142, 0.4);
    }
  }

  .game-cover {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80px;
    margin-bottom: 16px;

    .game-icon {
      font-size: 56px;
      line-height: 1;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    .game-badges {
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      gap: 4px;

      .badge {
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

        &.badge-new {
          background: linear-gradient(135deg, #00f260 0%, #0575e6 100%);
          color: white;
        }

        &.badge-hot {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }
      }
    }

    .favorite-btn {
      position: absolute;
      top: 0;
      right: 0;
      width: 36px;
      height: 36px;
      border: none;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      backdrop-filter: blur(4px);

      &:hover {
        background: rgba(255, 255, 255, 0.5);
        transform: scale(1.1);
      }

      &:active {
        transform: scale(0.9);
      }

      &.active .favorite-icon {
        animation: heartBeat 0.6s ease-in-out;
      }

      .favorite-icon {
        font-size: 18px;
        line-height: 1;
      }

      @keyframes heartBeat {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.3); }
      }
    }
  }

  .game-info {
    .game-name {
      font-size: 18px;
      font-weight: 700;
      color: white;
      margin: 0 0 8px 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .game-age {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 4px 0;
    }

    .game-theme {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.85);
      margin: 4px 0 0 0;
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(255, 255, 255, 0.15);
      padding: 4px 8px;
      border-radius: 12px;
      width: fit-content;

      .theme-icon {
        font-size: 14px;
      }

      .theme-name {
        font-weight: 500;
      }
    }

    .game-description {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  .lock-badge {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    border-radius: 16px;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: slideIn 0.3s ease;

    .lock-icon {
      font-size: 24px;
    }

    .lock-text {
      color: white;
      font-size: 14px;
      font-weight: 600;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.8);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }
  }

  .play-badge {
    position: absolute;
    bottom: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    animation: bounceIn 0.5s ease;

    .play-icon {
      font-size: 20px;
      margin-left: 2px;
    }

    @keyframes bounceIn {
      0% {
        opacity: 0;
        transform: scale(0);
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .game-card {
    padding: 16px;

    .game-cover {
      height: 60px;

      .game-icon {
        font-size: 44px;
      }
    }

    .game-name {
      font-size: 16px;
    }

    .game-age {
      font-size: 12px;
    }
  }
}

@media (max-width: 480px) {
  .game-card {
    padding: 12px;
    border-radius: 16px;

    .game-cover {
      height: 50px;
      margin-bottom: 12px;

      .game-icon {
        font-size: 36px;
      }
    }

    .game-name {
      font-size: 14px;
    }

    .game-age {
      font-size: 11px;
    }
  }
}
</style>
