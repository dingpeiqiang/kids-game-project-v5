<template>
  <div class="game-page">
    <!-- 游戏 iframe -->
    <iframe
      ref="gameFrame"
      :src="gameUrl"
      class="game-iframe"
      @load="onGameLoaded"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    ></iframe>

    <!-- 加载提示（仅在加载时显示） -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">加载游戏中...</p>
    </div>

<!-- 资源管理悬浮按钮 -->
    <button 
      @click="openResourceManager" 
      class="resource-manager-float-btn"
      title="打开资源管理"
    >
      🖼️
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { gameApi } from '@/services/game-api.service';
import {
  isLoggedIn,
  getCurrentUserId,
  getCurrentUserName,
  validateGameStartPermission
} from '@/utils/auth';


const router = useRouter();
const route = useRoute();

// Refs
const gameFrame = ref<HTMLIFrameElement | null>(null);
const gameUrl = ref('');
const isLoading = ref(true);
const gameInfo = ref<{ gameId: number; gameCode: string } | null>(null);
const gameCode = ref(''); // 保存当前游戏 code

/**
 * 初始化游戏
 */
async function initGame() {
  try {
    console.log('[GamePage] ========== 开始初始化游戏 ==========');
    isLoading.value = true;

    // 1. 获取游戏 code
    const currentGameCode = route.params.type as string;
    gameCode.value = currentGameCode; // 保存到 ref
    console.log('[GamePage] 步骤 1: 准备加载游戏:', currentGameCode);

    // 2. 检查用户是否已登录或为游客模式
if (!validateGameStartPermission()) {
      console.error('[GamePage] 步骤 2: 用户未登录，无法启动游戏');
      return;
    }

    console.log('[GamePage] 步骤 2: 用户已登录');
    const userId = getCurrentUserId();
    console.log('[GamePage] 步骤 2: 用户 ID:', userId);

    // 3. 获取游戏信息
    console.log('[GamePage] 步骤 3: 获取游戏信息...');
    const game = await gameApi.getByCode(currentGameCode);
    console.log('[GamePage] 步骤 3: 游戏信息:', game);

    if (!game.gameUrl) {
      throw new Error('游戏未配置访问地址，请联系管理员');
    }

    // 保存游戏信息
    gameInfo.value = {
      gameId: game.gameId,
      gameCode: game.gameCode || currentGameCode,
    };

    // 4. 启动游戏会话
    console.log('[GamePage] 步骤 4: 启动游戏会话，游戏 ID:', game.gameId);
    const session = await gameApi.startSession(game.gameId);

    console.log('[GamePage] 步骤 4: 游戏会话创建成功:', {
      gameId: game.gameId,
      sessionToken: session.sessionToken
    });

    // 5. 构建游戏 URL（只发送初始化参数，不控制游戏）
    console.log('[GamePage] 步骤 5: 构建游戏 URL...');
    
    // 获取 token 和用户信息，传递给游戏（使用统一的 key）
    const authToken = localStorage.getItem('authToken') || '';
    const parentToken = localStorage.getItem('parentToken') || '';
    const token = authToken || parentToken; // 优先使用 authToken，如果没有则使用 parentToken
    const userInfo = localStorage.getItem('userInfo') || localStorage.getItem('parentInfo') || '{}';
    
    // 获取游戏专用主题 ID（如果有的话）
    const gameThemeKey = `game-theme-${currentGameCode}`;
    const gameThemeId = localStorage.getItem(gameThemeKey) || '';
    
    const params = new URLSearchParams({
      session_token: session.sessionToken || '',  // 独立部署模式需要此参数
      session_id: session.sessionToken || '',     // 兼容旧版
      user_id: String(getCurrentUserId()),
      user_name: getCurrentUserName(),
      token: token, // 传递 token，游戏需要用来验证身份
      user_info: userInfo, // 传递用户信息
      game_id: String(game.gameId), // 传递游戏 ID
      platform_url: window.location.origin, // 传递平台 URL，用于游戏结束后返回首页
    });
    
    // 如果有游戏专用主题，添加到 URL 参数
    if (gameThemeId) {
      params.append('theme_id', gameThemeId);
      console.log('[GamePage] 使用游戏专用主题:', gameThemeId);
    }

    // 添加游戏配置（如果有）
    if (game.gameConfig) {
      params.append('game_config', JSON.stringify(game.gameConfig));
    }

    gameUrl.value = `${game.gameUrl}?${params.toString()}`;

    console.log('[GamePage] 步骤 5: 游戏 URL:', gameUrl.value);
    console.log('[GamePage] ========== 游戏初始化完成，开始加载 ==========');

    // 保存 sessionToken 用于结果提交
    gameSessionId.value = session.sessionToken;

  } catch (error: any) {
    console.error('[GamePage] 初始化游戏失败:', error);
    alert(`游戏加载失败：${error.message || '未知错误'}`);

    // 根据用户类型跳转到对应的首页
    const userInfo = localStorage.getItem('userInfo');
    const parentInfo = localStorage.getItem('parentInfo');

    if (parentInfo) {
      router.push('/parent');
    } else if (userInfo) {
      router.push('/');
    } else {
      router.push('/game');
    }
  }
}



/**
 * 游戏加载完成
 */
function onGameLoaded() {
  console.log('[GamePage] 游戏加载完成');
  isLoading.value = false;
}



/**
 * 验证消息来源（安全检查）
 * 只接受来自游戏 iframe 的消息
 */
function isValidMessageSource(origin: string): boolean {
  // 如果是 null（沙箱环境），允许通过
  if (origin === 'null') {
    return true;
  }

  // gameUrl 为空时，直接拒绝（游戏尚未加载完成）
  if (!gameUrl.value) {
    console.debug('[GamePage] 游戏 URL 尚未初始化，忽略消息:', origin);
    return false;
  }

  // 验证消息来源是否与游戏 URL 同源
  try {
    let gameOrigin: string;
    
    if (gameUrl.value.startsWith('http://') || gameUrl.value.startsWith('https://')) {
      // 完整 URL
      gameOrigin = new URL(gameUrl.value).origin;
    } else {
      // 相对路径，视为同源（游戏托管在当前域名下）
      gameOrigin = window.location.origin;
    }
    
    const isValid = origin === gameOrigin;
    if (!isValid) {
      console.debug('[GamePage] 消息来源不匹配:', { origin, gameOrigin, gameUrl: gameUrl.value });
    }
    return isValid;
  } catch (e) {
    console.warn('[GamePage] 解析游戏 URL 失败:', e, 'gameUrl:', gameUrl.value);
    return false;
  }
}

/**
 * 提交游戏结果到后端
 */
async function submitGameResult(result: any) {
  try {
    console.log('[GamePage] 提交游戏结果:', result);

    await gameApi.submitResult(gameSessionId.value, {
      sessionId: result.sessionId || gameSessionId.value,
      sessionToken: gameSessionId.value,
      score: result.final_score || result.score || 0,
      duration: result.duration || 0,
      lives: result.lives,
      level: result.level,
      isWin: result.is_win || result.isWin || false,
      details: result.details || {},
    });

    console.log('[GamePage] 游戏结果提交成功');

  } catch (error: any) {
    console.error('[GamePage] 提交游戏结果失败:', error);
    // 不阻塞游戏，静默失败即可
  }
}

// 保存 sessionToken
const gameSessionId = ref('');

/**
 * 监听游戏消息（只接收数据，不控制游戏）
 */
function onMessage(event: MessageEvent) {
  // 安全检查：验证消息来源
  if (!isValidMessageSource(event.origin)) {
    console.warn('[GamePage] 忽略来自未知来源的消息:', event.origin);
    return;
  }

  const message = event.data;
  const type = message.type || message.event;
  const data = message.data || message.payload;

  console.log('[GamePage] 收到游戏消息:', { type, data });

  switch (type) {
    case 'GAME_STATUS':
    case 'gameStatus':
      // 游戏状态更新 - 只记录日志，不更新 UI（UI 由游戏自己处理）
      console.log('[GamePage] 游戏状态更新:', data);
      // 可选：可以发送到平台存储用于统计分析
      break;

    case 'OPEN_RESOURCE_MANAGER':
      // 打开资源管理页面
      console.log('[GamePage] 收到打开资源管理页面请求:', data);
      if (data && data.url) {
        console.log('[GamePage] 打开 URL:', data.url);
        window.open(data.url, '_blank');
      }
      break;

    case 'GAME_OVER':
    case 'gameOver':
      // 游戏结束 - 提交结果到后端
      console.log('[GamePage] 游戏结束:', data);
      submitGameResult(data);

      // 延迟后返回首页（游戏自己显示结束界面）
      // 给游戏3秒时间显示结束界面，然后返回
      setTimeout(() => {
        console.log('[GamePage] 返回首页');

        // 根据用户类型跳转到对应的首页
        const userInfo = localStorage.getItem('userInfo');
        const parentInfo = localStorage.getItem('parentInfo');

        if (parentInfo) {
          router.push('/parent');
        } else if (userInfo) {
          router.push('/');
        } else {
          router.push('/game');
        }
      }, 3000);
      break;

    case 'GAME_ERROR':
    case 'gameError':
      // 游戏错误 - 记录日志
      console.error('[GamePage] 游戏错误:', data);
      // 可以选择显示错误提示或返回首页
      break;

    default:
      console.log('[GamePage] 未知消息类型:', type);
  }
}

/**
 * 页面关闭前尝试通知游戏
 */
function onBeforeUnload(e: BeforeUnloadEvent) {
  console.log('[GamePage] 用户尝试关闭页面');

  // 通知游戏准备关闭
  if (gameFrame.value?.contentWindow) {
    gameFrame.value.contentWindow.postMessage(
      {
        type: 'PAGE_CLOSE_REQUEST',
        data: { reason: 'user_close' }
      },
      '*'
    );
  }

  // 标准的浏览器关闭确认提示
  e.preventDefault();
  e.returnValue = '确定要退出游戏吗？';
}

/**
 * 打开资源管理页面
 */
function openResourceManager() {
  console.log('[Resource Manager] 点击资源管理按钮');
  console.log('[Resource Manager] 当前游戏代码:', gameCode.value);
  
  if (!gameCode.value) {
    console.error('[Resource Manager] 游戏代码不存在');
    alert('游戏信息不存在');
    return;
  }
  
  // 获取当前选择的主题
  const gameThemeKey = `game-theme-${gameCode.value}`;
  const themeId = localStorage.getItem(gameThemeKey) || 'default';
  
  console.log('[Resource Manager] 主题ID:', themeId);
  
  // 跳转到资源管理页面（不限制权限）
  console.log('[Resource Manager] 跳转到资源管理页面');
  router.push({
    path: '/admin/game-resources',
    query: {
      gameId: gameCode.value,
      themeId: themeId
    }
  });
}

/**
 * 页面可见性变化（切换标签页）
 */
function onVisibilityChange() {
  if (document.hidden) {
    console.log('[GamePage] 页面隐藏');
    if (gameFrame.value?.contentWindow) {
      gameFrame.value.contentWindow.postMessage(
        { type: 'PAGE_VISIBILITY_CHANGE', data: { hidden: true } },
        '*'
      );
    }
  } else {
    console.log('[GamePage] 页面显示');
    if (gameFrame.value?.contentWindow) {
      gameFrame.value.contentWindow.postMessage(
        { type: 'PAGE_VISIBILITY_CHANGE', data: { hidden: false } },
        '*'
      );
    }
  }
}


onMounted(async () => {
  console.log('[GamePage] 组件已挂载');

  // 监听消息
  window.addEventListener('message', onMessage);

  // 监听页面关闭
  window.addEventListener('beforeunload', onBeforeUnload);

// 监听页面可见性变化
  document.addEventListener('visibilitychange', onVisibilityChange);

  // 初始化游戏
  await initGame();
});

onUnmounted(() => {
  console.log('[GamePage] 组件已卸载');

  // 移除监听器
  window.removeEventListener('message', onMessage);
window.removeEventListener('beforeunload', onBeforeUnload);
  document.removeEventListener('visibilitychange', onVisibilityChange);
});
</script>

<style scoped>
.game-page {
  width: 100vw;
  height: 100vh;
  background: #000;
  overflow: hidden;
  position: relative;
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

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #333;
  border-top: 4px solid #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 20px;
  color: #fff;
  font-size: 18px;
  font-weight: 500;
}

/* 资源管理悬浮按钮 */
.resource-manager-float-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 24px;
  box-shadow: 0 4px 15px rgba(72, 219, 251, 0.4);
  transition: all 0.3s ease;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resource-manager-float-btn:hover {
  transform: scale(1.1) rotate(10deg);
  box-shadow: 0 6px 20px rgba(72, 219, 251, 0.6);
}

.resource-manager-float-btn:active {
  transform: scale(0.95);
}

/* 创作者中心入口 */
.creator-center-link {
  text-decoration: none;
}
</style>
