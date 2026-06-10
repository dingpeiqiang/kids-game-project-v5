import { ASSET_ROOT } from '../config'
import { PlantKind, ZombieKind } from '../types'

export type Pzd2dImages = Record<string, HTMLImageElement | null>

export interface Pzd2dAssets {
  images: Pzd2dImages
  /** 背景 960×540，无则纯色 */
  lawnBg: HTMLImageElement | null
  plants: Record<PlantKind, HTMLImageElement | null>
  zombies: Record<ZombieKind, HTMLImageElement | null>
  iconSun: HTMLImageElement | null
  cardFrame: HTMLImageElement | null
  pea: HTMLImageElement | null
}

const PLANT_PATH: Record<PlantKind, string> = {
  [PlantKind.peashooter]: `${ASSET_ROOT}/sprites/plant_peashooter.png`,
  [PlantKind.sunflower]: `${ASSET_ROOT}/sprites/plant_sunflower.png`,
  [PlantKind.wallnut]: `${ASSET_ROOT}/sprites/plant_wallnut.png`,
  [PlantKind.potatoMine]: `${ASSET_ROOT}/sprites/plant_potato_mine.png`,
  [PlantKind.snowPea]: `${ASSET_ROOT}/sprites/plant_snow_pea.png`,
}

const ZOMBIE_PATH: Record<ZombieKind, string> = {
  [ZombieKind.normalZombie]: `${ASSET_ROOT}/sprites/zombie_normal.png`,
  [ZombieKind.flagZombie]: `${ASSET_ROOT}/sprites/zombie_flag.png`,
  [ZombieKind.bucketZombie]: `${ASSET_ROOT}/sprites/zombie_bucket.png`,
  [ZombieKind.sportZombie]: `${ASSET_ROOT}/sprites/zombie_sport.png`,
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** 加载 §6 资产；单文件失败时对应实体回退 emoji/色块 */
export async function loadPzd2dAssets(): Promise<Pzd2dAssets> {
  const lawnBg = await loadImage(`${ASSET_ROOT}/backgrounds/lawn_day.png`)
  const iconSun = await loadImage(`${ASSET_ROOT}/ui/icon_sun.png`)
  const cardFrame = await loadImage(`${ASSET_ROOT}/ui/card_frame.png`)
  const pea = await loadImage(`${ASSET_ROOT}/ui/pea.png`)

  const plants = {} as Record<PlantKind, HTMLImageElement | null>
  await Promise.all(
    (Object.keys(PLANT_PATH) as PlantKind[]).map(async kind => {
      plants[kind] = await loadImage(PLANT_PATH[kind])
    }),
  )

  const zombies = {} as Record<ZombieKind, HTMLImageElement | null>
  await Promise.all(
    (Object.keys(ZOMBIE_PATH) as ZombieKind[]).map(async kind => {
      zombies[kind] = await loadImage(ZOMBIE_PATH[kind])
    }),
  )

  const images: Pzd2dImages = {
    lawnBg,
    iconSun,
    cardFrame,
    pea,
    house: await loadImage(`${ASSET_ROOT}/ui/house.png`),
    hp_bar_bg: await loadImage(`${ASSET_ROOT}/ui/hp_bar_bg.png`),
  }

  return { images, lawnBg, plants, zombies, iconSun, cardFrame, pea }
}