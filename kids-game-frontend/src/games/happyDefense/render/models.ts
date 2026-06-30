import { Mesh, Scene, TransformNode, Vector3 } from '@babylonjs/core'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import '@babylonjs/loaders'
import type { EnemyKind, TowerKind } from '../types'

const BASE = '/assets/happyDefense/models'

export type TowerModelKey = TowerKind
export type EnemyModelKey = EnemyKind

export interface ModelTemplates {
  towers: Partial<Record<TowerModelKey, TransformNode>>
  enemies: Partial<Record<EnemyModelKey, TransformNode>>
  base: TransformNode | null
}

const TOWER_FILES: Record<TowerModelKey, string> = {
  popcorn: 'tower_popcorn.glb',
  bubble: 'tower_bubble.glb',
  lightning: 'tower_lightning.glb',
  pierce: 'tower_pierce.glb',
}

const ENEMY_FILES: Record<EnemyModelKey, string> = {
  grunt: 'enemy_grunt.glb',
  flyer: 'enemy_flyer.glb',
  tank: 'enemy_tank.glb',
  boss: 'enemy_boss.glb',
}

const ENEMY_SCALE: Record<EnemyModelKey, number> = {
  grunt: 0.75,
  flyer: 0.75,
  tank: 1.1,
  boss: 1.4,
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
      result.transformNodes.find(n => n.name !== '__root__') ??
      result.transformNodes[0] ??
      null

    if (root) {
      hideTemplate(root)
      return root
    }

    if (!result.meshes.length) return null
    const wrapper = new TransformNode(`tpl_${file.replace('.glb', '')}`, scene)
    for (const m of result.meshes) {
      if (!m.parent || m.parent === scene) {
        m.parent = wrapper
      }
    }
    hideTemplate(wrapper)
    return wrapper
  } catch {
    return null
  }
}

/** Blender 导出 GLB；缺文件则对应实体用程序几何体 */
export async function loadHappyDefenseModels(scene: Scene): Promise<ModelTemplates> {
  const towers: Partial<Record<TowerModelKey, TransformNode>> = {}
  const enemies: Partial<Record<EnemyModelKey, TransformNode>> = {}

  await Promise.all(
    (Object.keys(TOWER_FILES) as TowerModelKey[]).map(async kind => {
      const tpl = await loadGlbTemplate(scene, TOWER_FILES[kind])
      if (tpl) towers[kind] = tpl
    }),
  )

  await Promise.all(
    (Object.keys(ENEMY_FILES) as EnemyModelKey[]).map(async kind => {
      const tpl = await loadGlbTemplate(scene, ENEMY_FILES[kind])
      if (tpl) enemies[kind] = tpl
    }),
  )

  const base = await loadGlbTemplate(scene, 'base.glb')

  return { towers, enemies, base }
}

export function cloneTowerModel(
  templates: ModelTemplates,
  kind: TowerKind,
  name: string,
): TransformNode | null {
  const tpl = templates.towers[kind]
  if (!tpl) return null
  const inst = tpl.clone(name, null) as TransformNode
  inst.setEnabled(true)
  for (const m of inst.getChildMeshes(false)) {
    m.setEnabled(true)
    m.isPickable = false
  }
  return inst
}

export function cloneEnemyModel(
  templates: ModelTemplates,
  kind: EnemyKind,
  name: string,
): TransformNode | null {
  const tpl = templates.enemies[kind]
  if (!tpl) return null
  const inst = tpl.clone(name, null) as TransformNode
  const s = ENEMY_SCALE[kind]
  inst.scaling = new Vector3(s, s, s)
  inst.setEnabled(true)
  for (const m of inst.getChildMeshes(false)) {
    m.setEnabled(true)
    m.isPickable = false
  }
  return inst
}

export function cloneBaseModel(templates: ModelTemplates, name: string): TransformNode | null {
  const tpl = templates.base
  if (!tpl) return null
  const inst = tpl.clone(name, null) as TransformNode
  inst.setEnabled(true)
  for (const m of inst.getChildMeshes(false)) {
    m.setEnabled(true)
    m.isPickable = false
  }
  return inst
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

export interface ShadowGeneratorLike {
  addShadowCaster(mesh: Mesh): void
}

export function disposeModelTemplates(templates: ModelTemplates): void {
  for (const n of Object.values(templates.towers)) n?.dispose(false, true)
  for (const n of Object.values(templates.enemies)) n?.dispose(false, true)
  templates.base?.dispose(false, true)
}

export function disposeVisual(root: TransformNode | Mesh): void {
  root.dispose(false, true)
}