import { audioService } from '../../../services/audio'

export type Pzd2dSfx =
  | 'sun_collect'
  | 'plant_place'
  | 'pea_hit'
  | 'zombie_kill'
  | 'wave_clear'
  | 'house_hurt'
  | 'ui_invalid'
  | 'win'
  | 'lose'

export function playPzd2dSfx(kind: Pzd2dSfx): void {
  try {
    audioService.initOnGesture()
    switch (kind) {
      case 'sun_collect':
        audioService.collect()
        break
      case 'plant_place':
        audioService.hit()
        break
      case 'pea_hit':
        audioService.hit()
        break
      case 'zombie_kill':
        audioService.collect()
        break
      case 'wave_clear':
        audioService.collect()
        break
      case 'house_hurt':
        audioService.hit()
        break
      case 'ui_invalid':
        audioService.nearMiss()
        break
      case 'win':
        if (typeof audioService.win === 'function') audioService.win()
        else audioService.collect()
        break
      case 'lose':
        audioService.hit()
        break
      default:
        break
    }
  } catch {
    /* noop */
  }
}

export function drainSfxQueue(queue: Pzd2dSfx[]): void {
  const deduped: Pzd2dSfx[] = []
  for (const k of queue) {
    if (!deduped.includes(k)) deduped.push(k)
  }
  queue.length = 0
  for (const k of deduped) playPzd2dSfx(k)
}