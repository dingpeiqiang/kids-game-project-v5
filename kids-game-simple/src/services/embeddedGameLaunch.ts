/**
 * 内置 Canvas 游戏启动前校验（对齐 GameModeSelect 单机流程）
 */
import { toast } from '@/services/toast.service';
import { useUserStore } from '@/core/store/user.store';

export async function prepareEmbeddedCanvasPlay(gameCode: string): Promise<boolean> {
  const userInfo = localStorage.getItem('userInfo');
  const parentInfo = localStorage.getItem('parentInfo');
  if (!userInfo && !parentInfo) {
    toast.error('请先登录');
    return false;
  }

  try {
    const { checkGameResources } = await import('@/utils/gameResourceChecker');
    const gameThemeKey = `game-theme-${gameCode}`;
    const savedThemeId = localStorage.getItem(gameThemeKey);
    const themeId = savedThemeId ? parseInt(savedThemeId, 10) : undefined;
    const checkResult = await checkGameResources(gameCode, themeId);
    if (!checkResult.passed) {
      toast.error(checkResult.errorMessage || '游戏资源不可用');
      return false;
    }
    if (checkResult.warnings?.length) {
      checkResult.warnings.forEach((w) => toast.warning(w));
    }
  } catch (e) {
    console.warn('[embeddedGameLaunch] resource check skipped', e);
  }

  const userStore = useUserStore();
  if (!userStore.currentUserHasEnoughFatigue(1)) {
    toast.error('游学币不足，请通过答题获得游学币');
    return false;
  }

  try {
    await userStore.consumeCurrentUserFatiguePoints(1);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '扣除游学币失败';
    toast.error(msg);
    return false;
  }

  return true;
}