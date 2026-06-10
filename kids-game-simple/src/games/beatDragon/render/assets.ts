import { ASSET_ROOT } from '../config'

export interface BeatDragonImages {
  hero: HTMLImageElement | null
  dragonNormal: HTMLImageElement | null
  dragonFire: HTMLImageElement | null
  bg: HTMLImageElement | null
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export async function loadBeatDragonAssets(): Promise<BeatDragonImages> {
  const [hero, dragonNormal, dragonFire, bg] = await Promise.all([
    loadImage(`${ASSET_ROOT}/sprites/hero.png`),
    loadImage(`${ASSET_ROOT}/sprites/dragon_normal_sheet.png`),
    loadImage(`${ASSET_ROOT}/sprites/dragon_fire_sheet.png`),
    loadImage(`${ASSET_ROOT}/backgrounds/play_bg.webp`),
  ])
  return { hero, dragonNormal, dragonFire, bg }
}