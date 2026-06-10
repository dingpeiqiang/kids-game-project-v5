import { ASSET_PATHS } from './config'
import type { GameAssets } from './types'

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export async function loadGameAssets(): Promise<GameAssets> {
  const [tankPlayer, tankEnemy, wallBrick, bg] = await Promise.all([
    loadImage(ASSET_PATHS.tankPlayer),
    loadImage(ASSET_PATHS.tankEnemy),
    loadImage(ASSET_PATHS.wallBrick),
    loadImage(ASSET_PATHS.bg),
  ])
  return { tankPlayer, tankEnemy, wallBrick, bg }
}