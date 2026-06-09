import { ASSET_BASE } from './assets'

/** 策划案 8.3 音效 16 项 */
export type SfxId =
  | 'ball_roll'
  | 'ball_jump_land'
  | 'ball_ice_slide'
  | 'star_collect'
  | 'pickup_buff'
  | 'barrier_slide'
  | 'fall_void'
  | 'level_clear'
  | 'level_reset'
  | 'ui_click'
  | 'shield_loop'
  | 'skin_switch'
  | 'star_rating'

export type BgmId = 'bgm_casual' | 'bgm_compete' | 'ambience_wind'

const SFX_FILES: Record<SfxId, string> = {
  ball_roll: `${ASSET_BASE}/audio/ball_roll.ogg`,
  ball_jump_land: `${ASSET_BASE}/audio/ball_jump_land.ogg`,
  ball_ice_slide: `${ASSET_BASE}/audio/ball_ice_slide.ogg`,
  star_collect: `${ASSET_BASE}/audio/star_collect.ogg`,
  pickup_buff: `${ASSET_BASE}/audio/pickup_buff.ogg`,
  barrier_slide: `${ASSET_BASE}/audio/barrier_slide.ogg`,
  fall_void: `${ASSET_BASE}/audio/fall_void.ogg`,
  level_clear: `${ASSET_BASE}/audio/level_clear.ogg`,
  level_reset: `${ASSET_BASE}/audio/level_reset.ogg`,
  ui_click: `${ASSET_BASE}/audio/ui_click.ogg`,
  shield_loop: `${ASSET_BASE}/audio/shield_loop.ogg`,
  skin_switch: `${ASSET_BASE}/audio/skin_switch.ogg`,
  star_rating: `${ASSET_BASE}/audio/star_rating.ogg`,
}

const BGM_FILES: Record<BgmId, string> = {
  bgm_casual: `${ASSET_BASE}/audio/bgm_casual.ogg`,
  bgm_compete: `${ASSET_BASE}/audio/bgm_compete.ogg`,
  ambience_wind: `${ASSET_BASE}/audio/ambience_wind.ogg`,
}

export interface CloudBallAudio {
  playSfx: (id: SfxId, opts?: { volume?: number; loop?: boolean }) => void
  stopSfx: (id: SfxId) => void
  playBgm: (id: BgmId, volume?: number) => void
  stopBgm: () => void
  dispose: () => void
}

async function canPlay(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

export async function createCloudBallAudio(): Promise<CloudBallAudio> {
  const cache = new Map<string, HTMLAudioElement>()
  const loops = new Map<string, HTMLAudioElement>()

  const getClip = async (url: string): Promise<HTMLAudioElement | null> => {
    if (cache.has(url)) return cache.get(url)!
    if (!(await canPlay(url))) return null
    const a = new Audio(url)
    a.preload = 'auto'
    cache.set(url, a)
    return a
  }

  const playSfx = (id: SfxId, opts?: { volume?: number; loop?: boolean }) => {
    const url = SFX_FILES[id]
    void getClip(url).then(a => {
      if (!a) return
      const clip = a.cloneNode() as HTMLAudioElement
      clip.volume = opts?.volume ?? 0.55
      clip.loop = opts?.loop ?? false
      if (clip.loop) {
        loops.get(id)?.pause()
        loops.set(id, clip)
      }
      void clip.play().catch(() => {})
    })
  }

  const stopSfx = (id: SfxId) => {
    const loop = loops.get(id)
    if (loop) {
      loop.pause()
      loop.currentTime = 0
      loops.delete(id)
    }
  }

  let bgmEl: HTMLAudioElement | null = null
  let ambEl: HTMLAudioElement | null = null

  const playBgm = (id: BgmId, volume = 0.35) => {
    const url = BGM_FILES[id]
    void getClip(url).then(a => {
      if (!a) return
      if (id === 'ambience_wind') {
        ambEl?.pause()
        ambEl = a
        ambEl.loop = true
        ambEl.volume = volume * 0.5
        void ambEl.play().catch(() => {})
        return
      }
      bgmEl?.pause()
      bgmEl = a
      bgmEl.loop = true
      bgmEl.volume = volume
      void bgmEl.play().catch(() => {})
    })
  }

  const stopBgm = () => {
    bgmEl?.pause()
    bgmEl = null
    ambEl?.pause()
    ambEl = null
  }

  return {
    playSfx,
    stopSfx,
    playBgm,
    stopBgm,
    dispose: () => {
      stopBgm()
      for (const l of loops.values()) {
        l.pause()
      }
      loops.clear()
      cache.clear()
    },
  }
}