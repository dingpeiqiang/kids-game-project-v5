/**
 * 内置 Canvas 游戏启动前校验（对齐 GameModeSelect 单机流程，仅依赖 @simple）
 */
import { apiConsumeFatiguePoints, tokenStore } from './apiClient'
import { userService } from './userService'
import { showToast } from './userUI'
import { prepareGameTheme } from '../games/gameThemeBridge'

function resolveSessionUser(): { userId: number; userType: 0 | 1 } | null {
  if (userService.isLoggedIn && userService.current) {
    const userId = Number(userService.current.id)
    if (Number.isFinite(userId)) {
      return { userId, userType: 0 }
    }
  }
  const uid = tokenStore.getUserId()
  if (uid) {
    return { userId: Number(uid), userType: 0 }
  }
  try {
    const raw = localStorage.getItem('userInfo') || localStorage.getItem('parentInfo')
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const id = Number(parsed.id ?? parsed.userId ?? parsed.kidId ?? parsed.parentId)
    if (!Number.isFinite(id)) return null
    const userType: 0 | 1 =
      parsed.userType === 1 || parsed.parentId != null || localStorage.getItem('parentInfo') === raw
        ? 1
        : 0
    return { userId: id, userType }
  } catch {
    return null
  }
}

function getLocalFatiguePoints(): number {
  if (userService.isLoggedIn && userService.current) {
    return userService.current.studyCoins ?? 0
  }
  try {
    const raw = localStorage.getItem('userInfo') || localStorage.getItem('parentInfo')
    if (!raw) return 0
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const n = parsed.fatiguePoints ?? parsed.studyCoins
    return typeof n === 'number' ? n : Number(n) || 0
  } catch {
    return 0
  }
}

export async function prepareEmbeddedCanvasPlay(gameCode: string): Promise<boolean> {
  const session = resolveSessionUser()
  if (!session) {
    showToast('请先登录', 'error')
    return false
  }

  try {
    await prepareGameTheme(gameCode)
  } catch (e) {
    console.warn('[embeddedGameLaunch] theme prep skipped', e)
  }

  const required = 1
  if (getLocalFatiguePoints() < required) {
    showToast('游学币不足，请通过答题获得游学币', 'error')
    return false
  }

  const consume = await apiConsumeFatiguePoints(session.userId, session.userType, required)
  if (!consume.ok) {
    showToast(consume.msg || '扣除游学币失败', 'error')
    return false
  }

  if (userService.isLoggedIn && userService.current) {
    const cur = userService.current
    cur.studyCoins = Math.max(0, (cur.studyCoins ?? 0) - required)
    userService.saveUser(cur)
  }

  return true
}