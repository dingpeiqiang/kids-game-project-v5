<template>
  <div class="start-screen">
    <!-- 背景装饰 -->
    <div class="bg-grid"></div>
    <div class="bg-glow glow-1"></div>
    <div class="bg-glow glow-2"></div>

    <div class="start-content">
      <!-- Logo -->
      <div class="logo-wrap">
        <div class="logo-icon">🎖️</div>
        <h1 class="logo-title">坦克大战</h1>
        <p class="logo-sub">TANK BATTLE</p>
      </div>

      <!-- 最高分 -->
      <div class="highscore-bar" v-if="highScore > 0">
        <span class="hs-icon">🏆</span>
        <span class="hs-label">最高分</span>
        <span class="hs-value">{{ highScore.toLocaleString() }}</span>
      </div>

      <!-- 按钮 -->
      <div class="start-actions">
        <button class="start-btn primary-btn" @click="startGame">
          <span class="btn-icon">🚀</span>
          <span>开始游戏</span>
        </button>
      </div>

      <!-- 底部提示 -->
      <p class="start-hint">
        方向键 / WASD 移动 · 空格 / J 射击 · P 暂停
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const highScore = ref(0)

onMounted(() => {
  const saved = localStorage.getItem('tank-battle-highscore')
  if (saved) {
    highScore.value = parseInt(saved) || 0
  }
})

const startGame = () => {
  router.push('/difficulty')
}
</script>

<style scoped>
.start-screen {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(160deg, #0f1a12 0%, #1a2e1f 40%, #0d1f15 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* 网格背景 */
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(74,222,128,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(74,222,128,0.04) 1px, transparent 1px);
  background-size: 48px 48px;
}

/* 光晕 */
.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}
.glow-1 {
  width: 300px; height: 300px;
  background: rgba(251,191,36,0.08);
  top: 10%; left: 15%;
  animation: float-glow 8s ease-in-out infinite;
}
.glow-2 {
  width: 250px; height: 250px;
  background: rgba(74,222,128,0.06);
  bottom: 15%; right: 10%;
  animation: float-glow 10s ease-in-out infinite reverse;
}
@keyframes float-glow {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(20px, -15px); }
}

/* 内容 */
.start-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
}

/* Logo */
.logo-wrap {
  margin-bottom: 2.5rem;
}
.logo-icon {
  font-size: 3.5rem;
  margin-bottom: 0.75rem;
  filter: drop-shadow(0 4px 12px rgba(251,191,36,0.3));
}
.logo-title {
  font-size: 2.8rem;
  font-weight: 900;
  color: #fbbf24;
  letter-spacing: 0.15em;
  text-shadow: 0 2px 20px rgba(251,191,36,0.25);
  line-height: 1.2;
}
.logo-sub {
  font-size: 0.85rem;
  color: #4ade80;
  letter-spacing: 0.5em;
  font-weight: 600;
  margin-top: 0.35rem;
}

/* 最高分 */
.highscore-bar {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(251,191,36,0.08);
  border: 1px solid rgba(251,191,36,0.15);
  border-radius: 999px;
  padding: 6px 18px;
  margin-bottom: 2.5rem;
}
.hs-icon { font-size: 1rem; }
.hs-label { font-size: 0.75rem; color: #9ca3af; }
.hs-value { font-size: 0.95rem; font-weight: 700; color: #fbbf24; }

/* 按钮 */
.start-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 2rem;
}
.start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px 0;
  border-radius: 14px;
  font-size: 1.15rem;
  font-weight: 800;
  border: none;
  cursor: pointer;
  transition: transform 0.12s, box-shadow 0.12s;
}
.start-btn:active { transform: scale(0.97); }
.btn-icon { font-size: 1.2rem; }

.primary-btn {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #1a1a1a;
  box-shadow: 0 6px 24px rgba(251,191,36,0.3);
}
.primary-btn:hover {
  box-shadow: 0 8px 32px rgba(251,191,36,0.45);
  transform: translateY(-1px);
}

/* 底部提示 */
.start-hint {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.6;
}
</style>
