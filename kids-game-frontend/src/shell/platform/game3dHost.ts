/**
 * 3D / externalCanvas 游戏挂载区：大厅 #gameCanvas 或 CanvasGamePlay 宿主
 */
import { getGameLayoutConfig } from '@/games/gameLayout'

const EXTERNAL_3D_GAME_IDS = new Set([
  'cloudBallRush3d',
  'voxelRealm',
  'skyFrenzy',
  'skyRush3d',
  'happyDefense',
  'plantZombieDefense',
  'spaceShooter',
  'dragonShooter',
  'parkingLot',
  'rpgShooterTD',
  'rpgShooter',
  'kingBaby',
])

export function isExternalCanvas3dGame(gameId: string): boolean {
  const cfg = getGameLayoutConfig(gameId)
  if (cfg.externalCanvas) return true
  return EXTERNAL_3D_GAME_IDS.has(gameId)
}

/**
 * @param lifecycleHost GameLifecycle 传入的 canvas 字段（路由页为 div 宿主）
 */
export function resolveGame3dMountHost(lifecycleHost?: HTMLElement | null): HTMLElement | null {
  if (lifecycleHost) {
    prepareGame3dMountHost(lifecycleHost)
    return lifecycleHost
  }
  const shell =
    document.getElementById('gameCanvas') ??
    document.querySelector<HTMLElement>('.game-play-shell__canvas')
  if (shell) {
    prepareGame3dMountHost(shell)
    return shell
  }
  return null
}

export function prepareGame3dMountHost(parent: HTMLElement): void {
  parent.style.width = '100%'
  parent.style.height = '100%'
  parent.style.display = 'block'
  parent.style.position = parent.style.position || 'relative'
  parent.style.overflow = 'hidden'
  parent.style.touchAction = 'none'
}