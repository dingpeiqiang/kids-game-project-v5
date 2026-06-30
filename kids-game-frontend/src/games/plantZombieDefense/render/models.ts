import { Mesh, Scene, TransformNode, Vector3 } from '@babylonjs/core'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import '@babylonjs/loaders'
import { PlantKind, ZombieKind } from '../types'

const BASE = '/assets/plantZombieDefense/models'

export interface ModelTemplates {
  plants: Partial<Record<PlantKind, TransformNode>>
  zombies: Partial<Record<ZombieKind, TransformNode>>
  house: TransformNode | null
}

const PLANT_FILES: Record<PlantKind, string> = {
  [PlantKind.peashooter]: 'peashooter.glb',
  [PlantKind.sunflower]: 'sunflower.glb',
  [PlantKind.wallnut]: 'wallnut.glb',
  [PlantKind.potatoMine]: 'potato_mine.glb',
  [PlantKind.snowPea]: 'snow_pea.glb',
}

const ZOMBIE_FILES: Record<ZombieKind, string> = {
  [ZombieKind.normalZombie]: 'normal_zombie.glb',
  [ZombieKind.flagZombie]: 'normal_zombie.glb',
  [ZombieKind.bucketZombie]: 'bucket_zombie.glb',
  [ZombieKind.sportZombie]: 'sport_zombie.glb',
}

async function urlExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

function hideTemplate(root: TransformNode): void {
  root.setEnabled(false)
  for (const m of root.getChildMeshes(false)) {
    m.isPickable = false
    m.setEnabled(false)
  }
}

async function loadGlbTemplate(scene: Scene, file: string): Promise<TransformNode | null> {
  const url = `${BASE}/${file}`
  if (!(await urlExists(url))) return null
  try {
    const result = await SceneLoader.ImportMeshAsync('', `${BASE}/`, file, scene)
    const root =
      result.transformNodes.find(n => n.name !== '__root__') ?? result.transformNodes[0] ?? null
    if (root) {
      hideTemplate(root)
      return root
    }
    if (!result.meshes.length) return null
    const wrapper = new TransformNode(`tpl_${file}`, scene)
    for (const m of result.meshes) {
      if (!m.parent || m.parent === scene) m.parent = wrapper
    }
    hideTemplate(wrapper)
    return wrapper
  } catch {
    return null
  }
}

export async function loadPlantZombieModels(scene: Scene): Promise<ModelTemplates> {
  const plants: Partial<Record<PlantKind, TransformNode>> = {}
  const zombies: Partial<Record<ZombieKind, TransformNode>> = {}

  await Promise.all(
    (Object.keys(PLANT_FILES) as PlantKind[]).map(async kind => {
      const tpl = await loadGlbTemplate(scene, PLANT_FILES[kind])
      if (tpl) plants[kind] = tpl
    }),
  )

  const zombieKinds = new Set(Object.values(ZOMBIE_FILES))
  await Promise.all(
    [...zombieKinds].map(async file => {
      const tpl = await loadGlbTemplate(scene, file)
      if (!tpl) return
      for (const [kind, f] of Object.entries(ZOMBIE_FILES) as [ZombieKind, string][]) {
        if (f === file) zombies[kind] = tpl
      }
    }),
  )

  const house = await loadGlbTemplate(scene, 'house_base.glb')
  return { plants, zombies, house }
}

export function clonePlantModel(
  templates: ModelTemplates,
  kind: PlantKind,
  name: string,
): TransformNode | null {
  const tpl = templates.plants[kind]
  if (!tpl) return null
  const inst = tpl.clone(name, null) as TransformNode
  inst.setEnabled(true)
  for (const m of inst.getChildMeshes(false)) {
    m.setEnabled(true)
    m.isPickable = false
  }
  return inst
}

export function cloneZombieModel(
  templates: ModelTemplates,
  kind: ZombieKind,
  name: string,
): TransformNode | null {
  const tpl = templates.zombies[kind]
  if (!tpl) return null
  const inst = tpl.clone(name, null) as TransformNode
  inst.scaling = new Vector3(0.85, 0.85, 0.85)
  inst.setEnabled(true)
  for (const m of inst.getChildMeshes(false)) {
    m.setEnabled(true)
    m.isPickable = false
  }
  return inst
}

export function cloneHouseModel(templates: ModelTemplates, name: string): TransformNode | null {
  const tpl = templates.house
  if (!tpl) return null
  const inst = tpl.clone(name, null) as TransformNode
  inst.setEnabled(true)
  for (const m of inst.getChildMeshes(false)) {
    m.setEnabled(true)
    m.isPickable = false
  }
  return inst
}

export interface ShadowGeneratorLike {
  addShadowCaster(mesh: Mesh): void
}

export function addShadowCasters(node: TransformNode | Mesh, shadowGen: ShadowGeneratorLike): void {
  if (node instanceof Mesh) {
    shadowGen.addShadowCaster(node)
    return
  }
  for (const m of node.getChildMeshes(false)) {
    if (m instanceof Mesh) shadowGen.addShadowCaster(m)
  }
}

export function disposeModelTemplates(templates: ModelTemplates): void {
  for (const n of Object.values(templates.plants)) n?.dispose(false, true)
  for (const n of Object.values(templates.zombies)) n?.dispose(false, true)
  templates.house?.dispose(false, true)
}

export function disposeVisual(root: TransformNode | Mesh): void {
  root.dispose(false, true)
}