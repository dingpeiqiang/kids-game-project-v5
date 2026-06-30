import { Scene, Texture } from '@babylonjs/core'

const BASE = '/assets/plantZombieDefense'

export interface PlantZombieAssets {
  lawn: Texture | null
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
    } catch {
      resolve(null)
    }
  })
}

async function urlExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

export async function loadPlantZombieAssets(scene: Scene): Promise<PlantZombieAssets> {
  const lawnUrl = `${BASE}/textures/lawn_grass.webp`
  let lawn: Texture | null = null
  if (await urlExists(lawnUrl)) {
    lawn = await loadTexture(scene, lawnUrl, 'pzd_lawn')
    if (lawn) {
      lawn.uScale = 2
      lawn.vScale = 2
    }
  }
  return { lawn, ready: true }
}

export function disposePlantZombieAssets(assets: PlantZombieAssets): void {
  assets.lawn?.dispose()
}