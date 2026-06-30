import { Scene, Texture } from '@babylonjs/core'
import type { TrackTheme } from '../types'

export const ASSET_BASE = '/assets/cloudBallRush3d'

export type TrackTextureKey = 'track_meadow' | 'track_ice' | 'track_star' | 'slow_zone'

export interface CloudBallAssets {
  track: Partial<Record<TrackTextureKey, Texture>>
  ready: boolean
}

async function urlExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

function loadTexture(scene: Scene, url: string, name: string): Promise<Texture | null> {
  return new Promise(resolve => {
    try {
      const tex = new Texture(url, scene, false, true, Texture.TRILINEAR_SAMPLINGMODE, () => {
        resolve(tex)
      }, () => {
        tex.dispose()
        resolve(null)
      })
      tex.name = name
    } catch {
      resolve(null)
    }
  })
}

export function trackTextureKeyForTheme(theme: TrackTheme): TrackTextureKey | null {
  if (theme === 'meadow') return 'track_meadow'
  if (theme === 'ice') return 'track_ice'
  if (theme === 'star') return 'track_star'
  return null
}

/** 探测 public 下 WebP；缺失则场景用马卡龙纯色（见 style.ts） */
export async function loadCloudBallAssets(scene: Scene): Promise<CloudBallAssets> {
  const files: { key: TrackTextureKey; path: string }[] = [
    { key: 'track_meadow', path: `${ASSET_BASE}/textures/track_meadow.webp` },
    { key: 'track_ice', path: `${ASSET_BASE}/textures/track_ice.webp` },
    { key: 'track_star', path: `${ASSET_BASE}/textures/track_star.webp` },
    { key: 'slow_zone', path: `${ASSET_BASE}/textures/slow_zone.webp` },
  ]

  const track: Partial<Record<TrackTextureKey, Texture>> = {}
  await Promise.all(
    files.map(async ({ key, path }) => {
      if (!(await urlExists(path))) return
      const tex = await loadTexture(scene, path, `cbr_${key}`)
      if (tex) track[key] = tex
    }),
  )

  return { track, ready: true }
}

export function disposeCloudBallAssets(assets: CloudBallAssets): void {
  for (const tex of Object.values(assets.track)) {
    tex?.dispose()
  }
}