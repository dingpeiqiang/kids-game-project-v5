/**
 * 游戏资源检查器
 * 在游戏启动前检查游戏 URL、主题资源等是否可用
 *
 * ⭐ 重要变更：移除对 gameAssetConfig 的依赖
 * 游戏资源检查由游戏自己负责，前端只检查基础设施（游戏是否存在、URL 是否可访问）
 */

import { gameApi } from '@/services/game-api.service';
import { themeApi } from '@/services/theme-api.service';

export interface ResourceCheckResult {
  /** 是否通过检查 */
  passed: boolean;
  /** 错误消息 */
  errorMessage?: string;
  /** 警告消息 */
  warnings?: string[];
  /** 游戏信息 */
  gameInfo?: {
    gameId: number;
    gameCode: string;
    gameName: string;
    gameUrl: string;
  };
}

/**
 * 检查游戏资源是否可用
 * @param gameCode 游戏代码
 * @param themeId 主题ID（可选）
 */
export async function checkGameResources(
  gameCode: string,
  themeId?: number
): Promise<ResourceCheckResult> {
  const warnings: string[] = [];

  try {
    console.log('[ResourceChecker] 开始检查游戏资源:', { gameCode, themeId });

    // 1. 检查游戏是否存在并获取游戏信息
    console.log('[ResourceChecker] 步骤 1: 检查游戏信息...');
    let gameInfo;
    try {
      gameInfo = await gameApi.getByCode(gameCode);
    } catch (error: any) {
      return {
        passed: false,
        errorMessage: `游戏不存在或已下线: ${error.message || '未知错误'}`,
      };
    }

    if (!gameInfo) {
      return {
        passed: false,
        errorMessage: '游戏不存在',
      };
    }

    console.log('[ResourceChecker] 游戏信息:', gameInfo);

    // 2. 检查游戏 URL 是否配置
    console.log('[ResourceChecker] 步骤 2: 检查游戏 URL...');
    if (!gameInfo.gameUrl) {
      return {
        passed: false,
        errorMessage: '游戏未配置访问地址，请联系管理员',
      };
    }

    // 3. 检查游戏 URL 是否可访问（简单检查）
    console.log('[ResourceChecker] 步骤 3: 检查游戏 URL 可访问性...');
    const urlCheckResult = await checkUrlAccessible(gameInfo.gameUrl);
    if (!urlCheckResult.accessible) {
      warnings.push(`游戏服务器可能暂时无法访问: ${urlCheckResult.reason}`);
      console.warn('[ResourceChecker] URL 访问警告:', urlCheckResult.reason);
    }

    // 4. 检查主题是否存在（如果指定了主题）
    // ⭐ 移除主题资源详细检查，由游戏自己负责
    if (themeId) {
      console.log('[ResourceChecker] 步骤 4: 检查主题是否存在...');
      try {
        await themeApi.getDetail(themeId);
        console.log('[ResourceChecker] 主题存在');
      } catch (error: any) {
        return {
          passed: false,
          errorMessage: `主题不存在或无法访问: ${error.message}`,
        };
      }
    }

    // 5. 检查游戏配置
    console.log('[ResourceChecker] 步骤 5: 检查游戏配置...');
    if (gameInfo.status !== 1) {
      return {
        passed: false,
        errorMessage: '游戏已下线或维护中，请稍后再试',
      };
    }

    console.log('[ResourceChecker] 游戏资源检查通过');

    return {
      passed: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      gameInfo: {
        gameId: gameInfo.gameId,
        gameCode: gameInfo.gameCode || gameCode,
        gameName: gameInfo.gameName,
        gameUrl: gameInfo.gameUrl,
      },
    };

  } catch (error: any) {
    console.error('[ResourceChecker] 资源检查失败:', error);
    return {
      passed: false,
      errorMessage: `资源检查失败: ${error.message || '未知错误'}`,
    };
  }
}

/**
 * 检查 URL 是否可访问
 */
async function checkUrlAccessible(url: string): Promise<{ accessible: boolean; reason?: string }> {
  try {
    // 对于本地开发环境，跳过检查（避免 CORS 问题）
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      console.log('[ResourceChecker] 本地 URL，跳过访问检查');
      return { accessible: true };
    }

    // 对于外部 URL，尝试 HEAD 请求（可能会遇到 CORS，所以使用 fetch with no-cors）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return { accessible: true };
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        return { accessible: false, reason: '连接超时' };
      }

      // no-cors 模式下无法获取响应状态，但请求成功说明服务器可达
      return { accessible: true };
    }
  } catch (error: any) {
    return { accessible: false, reason: error.message };
  }
}

/**
 * 快速检查游戏是否可启动（简化版）
 * 只检查游戏是否存在和 URL 是否配置
 */
export async function quickCheckGame(gameCode: string): Promise<boolean> {
  try {
    const game = await gameApi.getByCode(gameCode);
    return !!(game && game.gameUrl && game.status === 1);
  } catch (error) {
    return false;
  }
}
