<template>
  <div class="theme-preview" :style="previewStyles">
    <!-- 应用主题预览 -->
    <div v-if="previewType === 'application'" class="app-preview">
      <h4 class="preview-title">应用界面预览</h4>
      
      <!-- 模拟导航栏 -->
      <div class="mock-navbar">
        <div class="mock-logo">{{ config.default.name }}</div>
        <div class="mock-nav-items">
          <span class="mock-nav-item">🏠 首页</span>
          <span class="mock-nav-item">🎮 游戏</span>
          <span class="mock-nav-item">👤 我的</span>
        </div>
      </div>
      
      <!-- 模拟卡片 -->
      <div class="mock-card">
        <h5 class="mock-card-title">示例卡片</h5>
        <p class="mock-card-text">这是一段示例文字，展示主题的字体和颜色效果。</p>
        <div class="mock-buttons">
          <button class="mock-btn mock-btn-primary">主要按钮</button>
          <button class="mock-btn mock-btn-secondary">次要按钮</button>
        </div>
      </div>
      
      <!-- 颜色样本 -->
      <div class="color-samples">
        <div 
          v-for="(color, key) in config.default.styles.colors" 
          :key="key"
          class="color-sample"
          :style="{ backgroundColor: color }"
        >
          <span class="color-sample-label">{{ key }}</span>
          <span class="color-sample-value">{{ color }}</span>
        </div>
      </div>
    </div>
    
    <!-- 游戏主题预览 -->
    <div v-else-if="previewType === 'game'" class="game-preview">
      <h4 class="preview-title">游戏界面预览 ({{ gameCode }})</h4>
      
      <!-- 模拟游戏画布 -->
      <div class="mock-game-canvas" :style="gameCanvasStyle">
        <!-- 贪吃蛇示例 -->
        <div v-if="gameCode === 'snake-vue3'" class="snake-demo">
          <div class="snake-grid">
            <div class="snake-cell snake-head">🐍</div>
            <div class="snake-cell snake-body"></div>
            <div class="snake-cell snake-body"></div>
            <div class="snake-cell snake-tail"></div>
          </div>
          <div class="food-demo">🍎</div>
        </div>
        
        <!-- 飞机大战示例 -->
        <div v-else-if="gameCode === 'plane-shooter'" class="plane-demo">
          <div class="player-plane">✈️</div>
          <div class="enemy-plane">👾</div>
          <div class="bullet"></div>
        </div>
        
        <!-- 分数面板 -->
        <div class="mock-score-panel">
          <span>分数：1000</span>
        </div>
      </div>
      
      <!-- 资源预览 -->
      <div class="asset-preview-list">
        <h5 class="asset-preview-title">资源配置预览</h5>
        <div class="asset-preview-grid">
          <div 
            v-for="(asset, key) in config.default.assets" 
            :key="key"
            class="asset-preview-item"
          >
            <span class="asset-preview-key">{{ key }}</span>
            
            <!-- 颜色资源 -->
            <div v-if="asset.type === 'color'" class="asset-color-preview">
              <div class="color-box" :style="{ backgroundColor: asset.value }"></div>
              <span class="asset-value">{{ asset.value }}</span>
            </div>
            
            <!-- Emoji 资源 -->
            <div v-else-if="asset.type === 'emoji'" class="asset-emoji-preview">
              <span class="emoji-display">{{ asset.value }}</span>
            </div>
            
            <!-- 图片资源 -->
            <div v-else-if="asset.type === 'image'" class="asset-image-preview">
              <img v-if="asset.url" :src="asset.url" alt="preview" class="image-thumb" />
              <span v-else class="no-image">无图片</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ThemeConfig, ThemePreviewProps } from '@/types/theme.types';

const props = withDefaults(defineProps<ThemePreviewProps>(), {
  previewType: 'application',
  gameCode: '',
});

// 计算预览样式
const previewStyles = computed(() => {
  const styles = props.config.default.styles;
  return {
    '--primary-color': styles.colors.primary,
    '--secondary-color': styles.colors.secondary,
    '--bg-color': styles.colors.background,
    '--surface-color': styles.colors.surface,
    '--text-color': styles.colors.text,
    '--radius-base': styles.radius.base || '8px',
    '--shadow-base': styles.shadows.base || '0 4px 6px rgba(0,0,0,0.1)',
  } as any;
});

// 游戏画布样式
const gameCanvasStyle = computed(() => {
  const styles = props.config.default.styles;
  return {
    backgroundColor: styles.colors.background,
    fontFamily: styles.typography.fontFamily,
  };
});
</script>

<style scoped lang="scss">
.theme-preview {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 12px;
}

.preview-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
  text-align: center;
}

/* ========== 应用主题预览 ========== */
.app-preview {
  .mock-navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: var(--surface-color);
    border-radius: var(--radius-base);
    box-shadow: var(--shadow-base);
    margin-bottom: 16px;
    
    .mock-logo {
      font-size: 20px;
      font-weight: bold;
      color: var(--primary-color);
    }
    
    .mock-nav-items {
      display: flex;
      gap: 16px;
      
      .mock-nav-item {
        font-size: 14px;
        color: var(--text-color);
        cursor: pointer;
        
        &:hover {
          color: var(--primary-color);
        }
      }
    }
  }
  
  .mock-card {
    background: white;
    border-radius: var(--radius-base);
    padding: 20px;
    box-shadow: var(--shadow-base);
    margin-bottom: 16px;
    
    .mock-card-title {
      font-size: 18px;
      font-weight: bold;
      color: var(--text-color);
      margin-bottom: 12px;
    }
    
    .mock-card-text {
      font-size: 14px;
      color: var(--text-color);
      line-height: 1.6;
      margin-bottom: 16px;
    }
    
    .mock-buttons {
      display: flex;
      gap: 12px;
    }
  }
  
  .mock-btn {
    padding: 10px 20px;
    border-radius: var(--radius-base);
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    
    &.mock-btn-primary {
      background: var(--primary-color);
      color: white;
      
      &:hover {
        opacity: 0.9;
        transform: translateY(-2px);
      }
    }
    
    &.mock-btn-secondary {
      background: var(--secondary-color);
      color: white;
      
      &:hover {
        opacity: 0.9;
      }
    }
  }
  
  .color-samples {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
    margin-top: 20px;
    
    .color-sample {
      height: 80px;
      border-radius: var(--radius-base);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 8px;
      overflow: hidden;
      position: relative;
      
      .color-sample-label {
        font-size: 12px;
        color: rgba(255,255,255,0.9);
        font-weight: 500;
        text-transform: capitalize;
      }
      
      .color-sample-value {
        font-size: 10px;
        color: rgba(255,255,255,0.7);
        font-family: monospace;
      }
    }
  }
}

/* ========== 游戏主题预览 ========== */
.game-preview {
  .mock-game-canvas {
    width: 100%;
    height: 300px;
    border-radius: var(--radius-base);
    position: relative;
    overflow: hidden;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .snake-demo {
    display: flex;
    gap: 20px;
    align-items: center;
    
    .snake-grid {
      display: grid;
      grid-template-columns: repeat(4, 40px);
      gap: 2px;
      background: rgba(255,255,255,0.1);
      padding: 4px;
      border-radius: 8px;
      
      .snake-cell {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        
        &.snake-head {
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        &.snake-body {
          background: #4ade80;
        }
        
        &.snake-tail {
          background: #22c55e;
        }
      }
    }
    
    .food-demo {
      font-size: 32px;
    }
  }
  
  .plane-demo {
    position: relative;
    width: 200px;
    height: 200px;
    
    .player-plane {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 32px;
    }
    
    .enemy-plane {
      position: absolute;
      top: 40px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 28px;
    }
    
    .bullet {
      position: absolute;
      bottom: 60px;
      left: 50%;
      width: 4px;
      height: 20px;
      background: #fbbf24;
      border-radius: 2px;
    }
  }
  
  .mock-score-panel {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: bold;
  }
  
  .asset-preview-list {
    margin-top: 20px;
    
    .asset-preview-title {
      font-size: 14px;
      font-weight: bold;
      color: #666;
      margin-bottom: 12px;
    }
    
    .asset-preview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
    }
    
    .asset-preview-item {
      background: white;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      
      .asset-preview-key {
        display: block;
        font-size: 12px;
        color: #666;
        margin-bottom: 8px;
        word-break: break-all;
      }
      
      .asset-color-preview {
        .color-box {
          width: 100%;
          height: 60px;
          border-radius: 6px;
          border: 1px solid #ddd;
        }
        
        .asset-value {
          display: block;
          font-size: 11px;
          color: #999;
          font-family: monospace;
          margin-top: 4px;
        }
      }
      
      .asset-emoji-preview {
        .emoji-display {
          font-size: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 60px;
        }
      }
      
      .asset-image-preview {
        .image-thumb {
          width: 100%;
          height: 60px;
          object-fit: cover;
          border-radius: 6px;
        }
        
        .no-image {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 60px;
          background: #f5f5f5;
          color: #999;
          font-size: 12px;
          border-radius: 6px;
        }
      }
    }
  }
}
</style>
