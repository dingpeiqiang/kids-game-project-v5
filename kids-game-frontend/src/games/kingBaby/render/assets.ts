import { ASSET_ROOT } from '../config'

export interface KingBabyImages {
  hero: HTMLImageElement | null
  enemyHero: HTMLImageElement | null
  minion: HTMLImageElement | null
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

export async function loadKingBabyAssets(): Promise<KingBabyImages> {
  const [hero, enemyHero, minion, bg] = await Promise.all([
    loadImage(`${ASSET_ROOT}/sprite/hero_liubei.png`),
    loadImage(`${ASSET_ROOT}/sprite/enemy_yuji.png`),
    loadImage(`${ASSET_ROOT}/sprite/minion.png`),
    loadImage(`${ASSET_ROOT}/bg/map_canyon.png`),
  ])
  return { hero, enemyHero, minion, bg }
}