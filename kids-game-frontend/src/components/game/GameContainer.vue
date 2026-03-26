<template>
  <div class="game-container-wrapper">
    <!-- 游戏 iframe -->
    <iframe
      ref="gameFrame"
      :src="gameUrl"
      class="game-iframe"
      @load="onGameLoaded"
      sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
      allowfullscreen
      allow="autoplay; fullscreen"
    ></iframe>

    <!-- 加载提示 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">{{ loadingText }}</p>
      <p v-if="showLoadingTip" class="loading-tip">温馨提示：首次加载可能需要几秒钟，请耐心等待~</p>
    </div>

    <!-- 错误提示 -->
    <div v-if="isError" class="error-overlay">
      <div class="error-icon">😕</div>
      <p class="error-text">{{ errorMessage }}</p>
      <button @click="retryLoad" class="retry-btn">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { gameApi } from '@/services/game-api.service';
import {
  isLoggedIn,
  getCurrentUserId,
  getCurrentUserName,
  validateGameStartPermission
} from '@/utils/auth';
import { envConfig } from '@/core/config/env';

interface Props {
  gameCode?: string; // 游戏代码（从路由参数获取）
  sessionId?: string; // 会话 ID（可选，默认自动生成）
  autoStart?: boolean; // 是否自动启动（默认 true）
}

const props = withDefaults(defineProps<Props>(), {
  gameCode: '',
  sessionId: '',
  autoStart: true
});

const emit = defineEmits<{
  (e: 'game-loaded', data: { gameId: number; gameCode: string }): void;
  (e: 'game-error', error: Error): void;
  (e: 'game-exit'): void;
}>();

// Refs
const gameFrame = ref<HTMLIFrameElement | null>(null);
const gameUrl = ref('');
const isLoading = ref(true);
const isError = ref(false);
const errorMessage = ref('');
const loadingText = ref('正在连接游戏平台...');
const showLoadingTip = ref(true);

// 状态
const gameInfo = ref<{ gameId: number; gameCode: string; gameUrl: string } | null>(null);
const currentGameCode = ref('');
const messageHandler = ref<((event: MessageEvent) => void) | null>(null);
const sessionId = ref(''); // 保存当前会话 ID

/**
 * 获取游戏 URL（混合架构核心逻辑）
 */
function getGameUrl(gameCode: string, baseUrl?: string): string {
  const isDev = import.meta.env.DEV;
  
  // 开发环境：使用独立部署的地址
  if (isDev) {
    return getStandaloneGameUrl(gameCode);
  }
  
  // 生产环境：使用整合部署的地址
  else {
    return getIntegratedGameUrl(gameCode, baseUrl);
  }
}

/**
 * 获取独立部署的游戏 URL（开发环境）
 */
function getStandaloneGameUrl(gameCode: string): string {
  // 游戏端口映射表
  const gamePortMap: Record<string, number> = {
    'SNAKE_VUE3': 3003,
    'PLANE_SHOOTER': 3002,
    'CHROMOSOME': 3001,
    'PLANTS_VS_ZOMBIE': 3004,
  };

  const port = gamePortMap[gameCode] || 3005;
  const baseUrl = `http://localhost:${port}`;
  
  console.log('[GameContainer] 开发模式 - 使用独立部署地址:', baseUrl);
  return baseUrl;
}

/**
 * 获取整合部署的游戏 URL（生产环境）
 */
function getIntegratedGameUrl(gameCode: string, baseUrl?: string): string {
  // 优先使用传入的 baseUrl
  if (baseUrl) {
    console.log('[GameContainer] 生产模式 - 使用自定义地址:', baseUrl);
    return baseUrl;
  }

  // 使用 CDN 地址
  const cdnBaseUrl = import.meta.env.VITE_GAME_CDN_URL || window.location.origin;
  const gamePath = `/games/${gameCode.toLowerCase()}/`;
  
  console.log('[GameContainer] 生产模式 - 使用 CDN 地址:', cdnBaseUrl + gamePath);
  return cdnBaseUrl + gamePath;
}

/**
 * 生成 URL 参数
 */
function buildGameUrlParams(params: {
  session_id: string;
  user_id: string;
  user_name: string;
  game_config?: any;
}): string {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object') {
        queryParams.set(key, encodeURIComponent(JSON.stringify(value)));
      } else {
        queryParams.set(key, String(value));
      }
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * 初始化游戏
 */
async function initGame() {
  try {
    console.log('[GameContainer] ========== 开始初始化游戏 ==========');
    isLoading.value = true;
    isError.value = false;

    // 1. 获取游戏 code
    const targetGameCode = props.gameCode || currentGameCode.value;
    if (!targetGameCode) {
      throw new Error('游戏代码不能为空');
    }

    currentGameCode.value = targetGameCode;
    console.log('[GameContainer] 游戏代码:', targetGameCode);

    // 2. 检查登录状态和权限
    if (!isLoggedIn()) {
      console.warn('[GameContainer] 用户未登录，跳转到登录页');
      router.push('/login');
      return;
    }

    const hasPermission = validateGameStartPermission();
    if (!hasPermission) {
      console.warn('[GameContainer] 无游戏权限');
      showError('您暂无权限进行此游戏，请先完成前面的游戏哦~');
      return;
    }

    // 3. 获取游戏信息
    const gameData = await gameApi.getByCode(targetGameCode);
    if (!gameData) {
      throw new Error(`未找到游戏：${targetGameCode}`);
    }

    gameInfo.value = {
      gameId: gameData.gameId,
      gameCode: gameData.gameCode,
      gameUrl: (gameData as any).gameUrl || ''
    };

    console.log('[GameContainer] 游戏信息:', gameInfo.value);

    // 4. 构建游戏 URL
    const userId = getCurrentUserId();
    const userName = getCurrentUserName();
    sessionId.value = props.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 准备游戏配置
    const gameConfig = {
      gameId: gameData.gameId,
      gameCode: gameData.gameCode,
      difficulty: 'normal',
      ...(gameData as any).extraConfig
    };

    // 构建完整的 URL 参数
    const urlParams = buildGameUrlParams({
      session_id: sessionId.value,
      user_id: String(userId),
      user_name: userName,
      game_config: gameConfig
    });

    // 获取游戏基础 URL
    const baseGameUrl = getGameUrl(targetGameCode, gameData.gameUrl);
    
    // 完整 URL
    gameUrl.value = `${baseGameUrl}${urlParams}`;

    console.log('[GameContainer] 游戏 URL:', gameUrl.value);
    console.log('[GameContainer] 环境:', import.meta.env.DEV ? '开发' : '生产');

    // 5. 隐藏加载提示（延迟一点，避免闪烁）
    setTimeout(() => {
      showLoadingTip.value = false;
    }, 3000);

  } catch (error: any) {
    console.error('[GameContainer] 初始化失败:', error);
    showError(error.message || '游戏加载失败，请稍后重试');
    emit('game-error', error);
  }
}

/**
 * 游戏加载完成
 */
function onGameLoaded() {
  console.log('[GameContainer] 游戏 iframe 加载完成');
  isLoading.value = false;
  
  // 通知父组件
  if (gameInfo.value) {
    emit('game-loaded', {
      gameId: gameInfo.value.gameId,
      gameCode: gameInfo.value.gameCode
    });
  }
}

/**
 * 处理来自游戏的消息
 */
function onMessage(event: MessageEvent) {
  // 验证消息来源
  if (!gameUrl.value || !event.origin.includes(new URL(gameUrl.value).host)) {
    return;
  }

  const data = event.data;
  console.log('[GameContainer] 收到游戏消息:', data);

  // 处理不同类型的消息
  switch (data?.type) {
    case 'GAME_LOADED':
      console.log('[GameContainer] 游戏已加载完成');
      break;

    case 'GAME_STATUS':
      // 游戏状态更新
      handleGameStatus(data.data);
      break;

    case 'GAME_OVER':
      // 游戏结束
      handleGameOver(data.data);
      break;

    case 'GAME_ERROR':
      // 游戏错误
      handleError(data.data);
      break;

    case 'COMMAND':
      // 处理平台命令
      if (data.action === 'EXIT') {
        handleExitCommand();
      }
      break;
  }
}

/**
 * 处理游戏状态更新
 */
function handleGameStatus(statusData: any) {
  // 可以在这里更新全局状态或发送到后端
  console.log('[GameContainer] 游戏状态更新:', statusData);
}

/**
 * 处理游戏结束
 */
async function handleGameOver(gameOverData: any) {
  console.log('[GameContainer] 游戏结束:', gameOverData);
  
  try {
    // 上报成绩到后端
    if (gameInfo.value && sessionId.value) {
      await gameApi.submitResult(sessionId.value, {
        score: gameOverData.score || 0,
        duration: gameOverData.duration || 0,
        status: gameOverData.status || 'completed',
        extraData: gameOverData
      });
          
      console.log('[GameContainer] 成绩已提交');
    }
  } catch (error) {
    console.error('[GameContainer] 提交成绩失败:', error);
  }
}

/**
 * 处理错误
 */
function handleError(errorData: any) {
  console.error('[GameContainer] 游戏错误:', errorData);
  showError(errorData.error || '游戏运行出错');
  emit('game-error', new Error(errorData.error));
}

/**
 * 处理退出命令
 */
function handleExitCommand() {
  console.log('[GameContainer] 收到退出命令');
  emit('game-exit');
  router.back();
}

/**
 * 显示错误
 */
function showError(message: string) {
  isError.value = true;
  errorMessage.value = message;
  isLoading.value = false;
}

/**
 * 重试加载
 */
function retryLoad() {
  console.log('[GameContainer] 重试加载');
  isError.value = false;
  isLoading.value = true;
  initGame();
}

/**
 * 向游戏发送消息
 */
function postMessageToGame(message: any) {
  if (gameFrame.value?.contentWindow) {
    gameFrame.value.contentWindow.postMessage(message, '*');
  }
}

// 路由
const router = useRouter();
const route = useRoute();

// 生命周期
onMounted(async () => {
  console.log('[GameContainer] 组件已挂载');

  // 设置消息监听器
  messageHandler.value = onMessage;
  window.addEventListener('message', onMessage);

  // 自动启动游戏
  if (props.autoStart) {
    await initGame();
  }
});

onUnmounted(() => {
  console.log('[GameContainer] 组件已卸载');

  // 移除监听器
  if (messageHandler.value) {
    window.removeEventListener('message', onMessage);
  }
});

// 导出方法供父组件调用
defineExpose({
  postMessageToGame,
  retryLoad
});
</script>

<style scoped>
.game-container-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  background: #000;
  overflow: hidden;
}

.game-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  position: absolute;
  top: 0;
  left: 0;
}

/* 加载覆盖层 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  color: white;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 6px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 20px;
  margin-bottom: 10px;
  font-weight: bold;
}

.loading-tip {
  font-size: 14px;
  opacity: 0.8;
  margin-top: 5px;
}

/* 错误覆盖层 */
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  color: white;
}

.error-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.error-text {
  font-size: 18px;
  margin-bottom: 30px;
  max-width: 80%;
  text-align: center;
  line-height: 1.5;
}

.retry-btn {
  padding: 12px 30px;
  font-size: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: bold;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.retry-btn:active {
  transform: translateY(0);
}
</style>
