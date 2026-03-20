<template>
  <div class="game-mode-container">
    <!-- 头部 -->
    <header class="mode-header">
      <button @click="goBack" class="back-btn">← 返回</button>
      <div class="game-title">{{ gameName }}</div>
      <button @click="showThemeSelector = true" class="theme-select-btn" title="选择主题">
        🎨 主题
      </button>
    </header>

    <!-- 主内容 -->
    <main class="mode-content">
      <!-- 当前主题显示 -->
      <div v-if="selectedThemeName" class="current-theme-banner">
        <span class="theme-label">当前主题：</span>
        <span class="theme-name">{{ selectedThemeName }}</span>
        <button @click="showThemeSelector = true" class="change-theme-btn">更换</button>
      </div>

      <!-- 游戏说明 -->
      <div class="game-description">
        <div class="game-icon">{{ getGameIcon() }}</div>
        <h2 class="mode-title">选择游戏模式</h2>
        <p class="game-desc-text">{{ gameDescription }}</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 模式列表 -->
      <div v-else class="mode-list">
        <div
          v-for="mode in availableModes"
          :key="mode.type"
          class="mode-card"
          :class="{ 'recommended': mode.recommended }"
          @click="selectMode(mode)"
        >
          <div class="mode-icon">{{ mode.icon }}</div>
          <div class="mode-info">
            <h3 class="mode-name">{{ mode.name }}</h3>
            <p class="mode-desc">{{ mode.description }}</p>
            <div v-if="mode.recommended" class="recommended-badge">推荐</div>
          </div>
          <div class="mode-arrow">→</div>
        </div>
      </div>

      <!-- 提示信息 -->
      <div class="mode-tips">
        <div class="tip-item">
          <span class="tip-icon">💡</span>
          <span class="tip-text">单机模式可与AI对战，适合练习</span>
        </div>
        <div class="tip-item">
          <span class="tip-icon">👥</span>
          <span class="tip-text">本地对抗适合朋友一起玩</span>
        </div>
        <div class="tip-item">
          <span class="tip-icon">🌐</span>
          <span class="tip-text">网络对战可与在线玩家对战</span>
        </div>
      </div>
    </main>

    <!-- 主题选择器弹窗 -->
    <div v-if="showThemeSelector" class="theme-selector-modal" @click="showThemeSelector = false">
      <div class="theme-selector-content" @click.stop>
        <div class="modal-header">
          <h3>选择游戏主题</h3>
          <button @click="showThemeSelector = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <GameThemeSelector
            :game-code="gameCode"
            v-model="selectedThemeId"
            @theme-selected="handleThemeSelected"
          />
        </div>
        <div class="modal-footer">
          <button @click="clearThemeSelection" class="btn-clear">使用默认主题</button>
          <button @click="showThemeSelector = false" class="btn-confirm">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useGameStore } from '@/core/store/game.store';
import { useUserStore } from '@/core/store/user.store';
import { toast } from '@/services/toast.service';
import GameThemeSelector from '@/components/game/GameThemeSelector.vue';

const router = useRouter();
const route = useRoute();
const gameStore = useGameStore();
const userStore = useUserStore();

// ===== 状态 =====

const isLoading = ref(false);
const gameCode = ref('');
const showThemeSelector = ref(false);
const selectedThemeId = ref<number | undefined>(undefined);
const selectedThemeName = ref('');

// ===== 计算属性 =====

const gameType = computed(() => route.params.type as string);

const gameName = computed(() => {
  const game = gameStore.getGameById(parseInt(gameType.value));
  return game?.gameName || '游戏';
});

const gameDescription = computed(() => {
  const game = gameStore.getGameById(parseInt(gameType.value));
  return game?.description || '选择你喜欢的游戏模式开始游戏';
});

const availableModes = computed(() => {
  const game = gameStore.getGameById(parseInt(gameType.value));
  const gameModulePath = game?.modulePath || 'math-adventure';

  // 根据不同的游戏返回不同的模式列表
  const modeMap: Record<string, any[]> = {
    'math-adventure': [
      {
        type: 'single',
        name: '单机模式',
        icon: '🎮',
        description: '与AI智能对手对战，适合练习',
        recommended: true,
      },
      {
        type: 'local',
        name: '本地对抗',
        icon: '👥',
        description: '与朋友在同一设备上对战',
        recommended: false,
      },
      {
        type: 'online',
        name: '网络对战',
        icon: '🌐',
        description: '与在线玩家实时对战',
        recommended: false,
      },
    ],
    'english-battle': [
      {
        type: 'single',
        name: '单机模式',
        icon: '🎮',
        description: '与AI对手比拼单词量',
        recommended: true,
      },
      {
        type: 'online',
        name: '网络对战',
        icon: '🌐',
        description: '与在线玩家实时对战',
        recommended: false,
      },
    ],
  };

  return modeMap[gameModulePath] || modeMap['math-adventure'];
});

// ===== 方法 =====

function getGameIcon(): string {
  const game = gameStore.getGameById(parseInt(gameType.value));
  if (!game) return '🎮';

  const iconMap: Record<string, string> = {
    'MATH_ADVENTURE': '🔢',
    'ENGLISH_BATTLE': '📚',
    'CHINESE_MATCH': '📝',
    'PUZZLE_GAME': '🧩',
    'MEMORY_MASTER': '🧠',
    'BLOCK_CASTLE': '🏰',
    'PAINTING_MASTER': '🎨',
    'HAPPY_FARM': '🌾',
    'ANIMAL_WORLD': '🦁',
    'MUSIC_BEAT': '🎵',
  };

  return iconMap[game.gameCode] || '🎮';
}

function goBack() {
  // 根据用户类型跳转到对应的首页
  const userInfo = localStorage.getItem('userInfo');
  const parentInfo = localStorage.getItem('parentInfo');

  if (parentInfo) {
    // 家长跳转到家长首页
    router.push('/parent');
  } else if (userInfo) {
    // 儿童跳转到儿童首页
    router.push('/');
  } else {
    // 未登录跳转到游戏大厅
    router.push('/game');
  }
}

async function selectMode(mode: any) {
  console.log('[GameMode] 选择模式:', mode.type);

  try {
    isLoading.value = true;

    // 本地对抗模式：跳转到双玩家登录页（不需要预先登录）
    if (mode.type === 'local') {
      router.push(`/game/${gameType.value}/local-login`);
      return;
    }

    // 检查是否登录（儿童或家长）
    const userInfo = localStorage.getItem('userInfo');
    const parentInfo = localStorage.getItem('parentInfo');

    if (!userInfo && !parentInfo) {
      toast.error('请先登录');
      router.push('/login');
      return;
    }

    // ===== 新增：游戏资源检查 =====
    console.log('[GameMode] 开始游戏资源检查...');
    const { checkGameResources } = await import('@/utils/gameResourceChecker');
    
    // 获取选择的主题 ID（如果有）
    const gameThemeKey = `game-theme-${gameCode.value}`;
    const savedThemeId = localStorage.getItem(gameThemeKey);
    const themeId = savedThemeId ? parseInt(savedThemeId) : undefined;

    // 执行资源检查
    const checkResult = await checkGameResources(gameType.value, themeId);
    
    if (!checkResult.passed) {
      console.error('[GameMode] 游戏资源检查失败:', checkResult.errorMessage);
      toast.error(checkResult.errorMessage || '游戏资源不可用');
      return;
    }

    // 显示警告（如果有）
    if (checkResult.warnings && checkResult.warnings.length > 0) {
      console.warn('[GameMode] 游戏资源检查警告:', checkResult.warnings);
      checkResult.warnings.forEach(warning => {
        toast.warning(warning);
      });
    }

    console.log('[GameMode] 游戏资源检查通过');
    // ===== 资源检查结束 =====

    // 检查疲劳点是否足够
    if (!userStore.currentUserHasEnoughFatigue(1)) {
      toast.error('疲劳点不足，请通过答题获得疲劳点');
      return;
    }

    // 扣除疲劳点（每次游戏消耗1点）
    try {
      await userStore.consumeCurrentUserFatiguePoints(1);
    } catch (error: any) {
      console.error('[GameMode] 扣除疲劳点失败:', error);
      // 显示后端返回的具体错误信息
      toast.error(error.message || '扣除疲劳点失败');
      return;
    }

    // 保存选择的模式类型到路由参数
    router.push({
      path: `/game/${gameType.value}/play`,
      query: { mode: mode.type },
    });
  } catch (err: any) {
    console.error('[GameMode] 启动游戏失败:', err);
    toast.error(err.message || '启动游戏失败');
  } finally {
    isLoading.value = false;
  }
}

// ===== 主题相关方法 =====

/**
 * 主题选择回调
 */
function handleThemeSelected(theme: any) {
  console.log('[GameMode] 选择主题:', theme);
  
  // 保存主题到 localStorage（游戏专用）
  const gameThemeKey = `game-theme-${gameCode.value}`;
  localStorage.setItem(gameThemeKey, theme.themeId.toString());
  
  // 更新显示的主题名称
  selectedThemeName.value = theme.themeName;
  
  toast.success(`已选择主题：${theme.themeName}`);
  showThemeSelector.value = false;
}

/**
 * 清除主题选择（使用默认主题）
 */
function clearThemeSelection() {
  const gameThemeKey = `game-theme-${gameCode.value}`;
  localStorage.removeItem(gameThemeKey);
  
  selectedThemeId.value = undefined;
  selectedThemeName.value = '';
  
  toast.success('已切换到默认主题');
  showThemeSelector.value = false;
}

/**
 * 加载已选择的主题
 */
function loadSelectedTheme() {
  const gameThemeKey = `game-theme-${gameCode.value}`;
  const savedThemeId = localStorage.getItem(gameThemeKey);
  
  if (savedThemeId) {
    selectedThemeId.value = parseInt(savedThemeId);
    // 注意：主题名称需要从主题列表中获取，这里暂时显示 ID
    selectedThemeName.value = `主题 #${savedThemeId}`;
  }
}

// ===== 生命周期 =====

onMounted(async () => {
  gameCode.value = gameType.value;
  console.log('[GameMode] 游戏代码:', gameCode.value);
  
  // 加载已选择的主题
  loadSelectedTheme();
});
</script>

<style scoped>
.game-mode-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

/* 头部 */
.mode-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.back-btn {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.game-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #667eea;
  text-align: center;
  flex: 1;
}

.theme-select-btn {
  padding: 0.5rem 1rem;
  background: #feca57;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s;
}

.theme-select-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(254, 202, 87, 0.4);
}

.current-theme-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #feca57 0%, #ff6b6b 100%);
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(254, 202, 87, 0.3);
}

.theme-label {
  font-weight: 500;
  opacity: 0.9;
}

.theme-name {
  font-weight: 700;
}

.change-theme-btn {
  padding: 0.25rem 0.75rem;
  background: white;
  color: #feca57;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
}

.change-theme-btn:hover {
  transform: scale(1.05);
}

/* 主题选择器弹窗 */
.theme-selector-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.theme-selector-content {
  background: white;
  border-radius: 20px;
  width: 90vw;
  max-width: 900px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #f0f0f0;
  color: #666;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 2rem;
  border-top: 1px solid #e0e0e0;
  background: #f9f9f9;
}

.btn-clear,
.btn-confirm {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-clear {
  background: #e0e0e0;
  color: #666;
}

.btn-clear:hover {
  background: #d0d0d0;
}

.btn-confirm {
  background: #667eea;
  color: white;
}

.btn-confirm:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.spacer {
  width: 80px;
}

/* 主内容 */
.mode-content {
  flex: 1;
  padding: 2rem 1.5rem;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
}

/* 游戏说明 */
.game-description {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: slideDown 0.6s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.game-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.mode-title {
  font-size: 2rem;
  color: #333;
  margin: 0 0 1rem 0;
  font-weight: bold;
}

.game-desc-text {
  font-size: 1.1rem;
  color: #666;
  margin: 0;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e0e0e0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container p {
  color: #666;
  font-size: 1rem;
}

/* 模式列表 */
.mode-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.mode-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  animation: slideUp 0.5s ease-out;
  animation-fill-mode: both;
}

.mode-card:nth-child(1) {
  animation-delay: 0.1s;
}

.mode-card:nth-child(2) {
  animation-delay: 0.2s;
}

.mode-card:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mode-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

.mode-card.recommended {
  border: 3px solid #feca57;
  background: linear-gradient(135deg, #fef9e7 0%, #fff 100%);
}

.mode-card.recommended::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #feca57 0%, #ff6b6b 100%);
}

.mode-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.mode-info {
  flex: 1;
}

.mode-name {
  font-size: 1.3rem;
  color: #333;
  margin: 0 0 0.5rem 0;
  font-weight: bold;
}

.mode-desc {
  font-size: 0.95rem;
  color: #666;
  margin: 0;
}

.recommended-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #feca57 0%, #ff6b6b 100%);
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  border-radius: 12px;
  margin-top: 0.5rem;
}

.mode-arrow {
  font-size: 2rem;
  color: #667eea;
  flex-shrink: 0;
  transition: transform 0.3s;
}

.mode-card:hover .mode-arrow {
  transform: translateX(5px);
}

/* 提示信息 */
.mode-tips {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e0e0e0;
}

.tip-item:last-child {
  border-bottom: none;
}

.tip-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.tip-text {
  font-size: 0.95rem;
  color: #666;
}

/* 响应式 */
@media (max-width: 768px) {
  .mode-header {
    padding: 0.75rem 1rem;
    gap: 0.5rem;
  }

  .back-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }

  .game-title {
    font-size: 1rem;
  }

  .theme-select-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }

  .spacer {
    width: 0;
  }

  .current-theme-banner {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    flex-wrap: wrap;
  }

  .theme-selector-content {
    width: 95vw;
    max-height: 90vh;
  }

  .modal-header {
    padding: 1rem 1.5rem;
  }

  .modal-header h3 {
    font-size: 1.25rem;
  }

  .modal-body {
    padding: 1rem 1.5rem;
  }

  .modal-footer {
    padding: 0.75rem 1.5rem;
    flex-direction: column;
  }

  .btn-clear,
  .btn-confirm {
    width: 100%;
  }

  .mode-content {
    padding: 1.5rem 1rem;
  }

  .game-description {
    padding: 1.5rem;
  }

  .game-icon {
    font-size: 3rem;
  }

  .mode-title {
    font-size: 1.5rem;
  }

  .game-desc-text {
    font-size: 1rem;
  }

  .mode-card {
    padding: 1rem;
    gap: 1rem;
  }

  .mode-icon {
    font-size: 2.5rem;
  }

  .mode-name {
    font-size: 1.1rem;
  }

  .mode-desc {
    font-size: 0.85rem;
  }

  .mode-arrow {
    font-size: 1.5rem;
  }

  .mode-tips {
    padding: 1rem;
  }

  .tip-item {
    padding: 0.5rem 0;
  }

  .tip-icon {
    font-size: 1.25rem;
  }

  .tip-text {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .mode-card {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .mode-icon {
    font-size: 2rem;
  }

  .mode-name {
    font-size: 1rem;
  }

  .mode-desc {
    font-size: 0.8rem;
  }

  .mode-arrow {
    font-size: 1.25rem;
  }
}
</style>
