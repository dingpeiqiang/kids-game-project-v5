import { Scene, Texture } from '@babylonjs/core'

const BASE = '/assets/happyDefense'

export type TileTextureKey = 'grass' | 'path' | 'rock'

export interface HappyDefenseAssets {
  tiles: Partial<Record<TileTextureKey, Texture>>
  ready: boolean
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
      tex.uScale = 1
      tex.vScale = 1
    } catch {
      resolve(null)
    }
  })
}

/** 探测资源是否存在（避免控制台大量 404 时可先 HEAD；纹理仍用 onError 回退） */
async function urlExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

/**
 * 加载 Kenney / ambientCG 等放入 public 的 WebP。
 * 文件缺失时返回空贴图表，场景使用纯色块（零依赖也能玩）。
 */
export async function loadHappyDefenseAssets(scene: Scene): Promise<HappyDefenseAssets> {
  const entries: { key: TileTextureKey; file: string }[] = [
    { key: 'grass', file: `${BASE}/textures/grass.webp` },
    { key: 'path', file: `${BASE}/textures/path.webp` },
    { key: 'rock', file: `${BASE}/textures/rock.webp` },
  ]

  const tiles: Partial<Record<TileTextureKey, Texture>> = {}
  await Promise.all(
    entries.map(async ({ key, file }) => {
      if (!(await urlExists(file))) return
      const tex = await loadTexture(scene, file, `hd_${key}`)
      if (tex) tiles[key] = tex
    }),
  )

  return { tiles, ready: true }
}

export function tileKeyForCell(kind: 'build' | 'path' | 'block' | 'base'): TileTextureKey | null {
  if (kind === 'path') return 'path'
  if (kind === 'block') return 'rock'
  if (kind === 'build' || kind === 'base') return 'grass'
  return null
}

export function disposeHappyDefenseAssets(assets: HappyDefenseAssets): void {
  for (const tex of Object.values(assets.tiles)) {
    tex?.dispose()
  }
}