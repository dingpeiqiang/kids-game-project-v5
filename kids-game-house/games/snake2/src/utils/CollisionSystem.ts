// ============================================================================
// 🎮 碰撞系统 - 通用框架层
// ============================================================================
// 
// 📌 说明:
//   100% 跨游戏复用，包含：
//   - AABB 碰撞检测
//   - 四叉树性能优化
//   - 实体管理器
//   - 碰撞检测器
// ============================================================================

import type { BaseEntity } from '../components/game/entities/BaseEntity'
import type { AABB } from '../types/entity'

// ============================================================================
// 📦 第一部分：AABB 碰撞检测工具
// ============================================================================

/**
 * ⭐ 通用 AABB 碰撞检测函数
 * 
 * @remarks
 * 跨游戏通用，几行代码，计算最快
 * 
 * @param a - 实体 A
 * @param b - 实体 B
 * @returns 是否发生碰撞
 */
export function checkCollision(a: BaseEntity, b: BaseEntity): boolean {
  const aCol = a.getCollider()
  const bCol = b.getCollider()
  
  return (
    aCol.x < bCol.x + bCol.w &&
    aCol.x + aCol.w > bCol.x &&
    aCol.y < bCol.y + bCol.h &&
    aCol.y + aCol.h > bCol.y
  )
}

/**
 * 批量碰撞检测（优化版）
 * 
 * @param entities - 待检测的实体数组
 * @param targets - 目标实体数组
 * @param callback - 碰撞回调
 */
export function batchCheckCollision(
  entities: BaseEntity[],
  targets: BaseEntity[],
  callback: (a: BaseEntity, b: BaseEntity) => void
): void {
  for (const entity of entities) {
    if (!entity.active) continue
    
    for (const target of targets) {
      if (!target.active) continue
      
      if (checkCollision(entity, target)) {
        callback(entity, target)
      }
    }
  }
}

// ============================================================================
// 🌳 第二部分：四叉树性能优化
// ============================================================================

/**
 * 🌳 四叉树节点
 */
class QuadTreeNode {
  private boundary: AABB
  private capacity: number
  private entities: BaseEntity[] = []
  private divided: boolean = false
  private children: QuadTreeNode[] = []
  
  constructor(boundary: AABB, capacity: number) {
    this.boundary = boundary
    this.capacity = capacity
  }
  
  /**
   * 插入实体
   */
  insert(entity: BaseEntity): boolean {
    // 边界检查
    if (!this.containsPoint(entity.x, entity.y)) {
      return false
    }
    
    // 容量未满，直接插入
    if (this.entities.length < this.capacity) {
      this.entities.push(entity)
      return true
    }
    
    // 自动细分
    if (!this.divided) {
      this.subdivide()
    }
    
    // 尝试插入子节点
    for (const child of this.children) {
      if (child.insert(entity)) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * 查询范围内的实体
   */
  query(range: AABB): BaseEntity[] {
    const found: BaseEntity[] = []
    
    // 范围不重叠，直接返回
    if (!this.intersects(range)) {
      return found
    }
    
    // 收集当前节点的实体
    for (const entity of this.entities) {
      if (this.containsPoint(entity.x, entity.y)) {
        found.push(entity)
      }
    }
    
    // 递归查询子节点
    if (this.divided) {
      for (const child of this.children) {
        found.push(...child.query(range))
      }
    }
    
    return found
  }
  
  /**
   * 细分为四个子节点
   */
  private subdivide(): void {
    const { x, y, width, height } = this.boundary
    
    const halfW = width / 2
    const halfH = height / 2
    
    // 创建四个象限
    this.children = [
      new QuadTreeNode({ x, y, width: halfW, height: halfH }, this.capacity),     // 左上
      new QuadTreeNode({ x: x + halfW, y, width: halfW, height: halfH }, this.capacity), // 右上
      new QuadTreeNode({ x, y: y + halfH, width: halfW, height: halfH }, this.capacity), // 左下
      new QuadTreeNode({ x: x + halfW, y: y + halfH, width: halfW, height: halfH }, this.capacity) // 右下
    ]
    
    this.divided = true
  }
  
  private containsPoint(px: number, py: number): boolean {
    return (
      px >= this.boundary.x &&
      px <= this.boundary.x + this.boundary.width &&
      py >= this.boundary.y &&
      py <= this.boundary.y + this.boundary.height
    )
  }
  
  private intersects(range: AABB): boolean {
    return !(
      range.x > this.boundary.x + this.boundary.width ||
      range.x + range.width < this.boundary.x ||
      range.y > this.boundary.y + this.boundary.height ||
      range.y + range.height < this.boundary.y
    )
  }
  
  /**
   * 清空
   */
  clear(): void {
    this.entities = []
    if (this.divided) {
      this.children.forEach(child => child.clear())
      this.children = []
      this.divided = false
    }
  }
}

/**
 * 🌳 四叉树管理器
 * 
 * @remarks
 * 根据实体数量自动启用/禁用
 * 
 * @example
 * ```typescript
 * // 贪吃蛇：不用四叉树（实体太少）
 * const qt = new QuadTree(800, 600, 4, 20, false)
 * 
 * // 飞机大战：必用四叉树（实体很多）
 * const qt = new QuadTree(800, 600, 4, 20, true)
 * 
 * // 植物大战僵尸：建议用（实体中等）
 * const qt = new QuadTree(800, 600, 6, 30, true)
 * ```
 */
export class QuadTree {
  private root: QuadTreeNode
  private enabled: boolean
  
  constructor(
    width: number,
    height: number,
    maxEntities: number = 4,
    minSize: number = 20,
    enabled: boolean = true
  ) {
    this.root = new QuadTreeNode({ x: 0, y: 0, width, height }, maxEntities)
    this.enabled = enabled
  }
  
  /**
   * 插入实体
   */
  insert(entity: BaseEntity): boolean {
    if (!this.enabled) return false
    return this.root.insert(entity)
  }
  
  /**
   * 查询候选实体
   */
  query(entity: BaseEntity): BaseEntity[] {
    if (!this.enabled) return []
    
    const range = entity.getCollider()
    return this.root.query(range)
  }
  
  /**
   * 清空四叉树
   */
  clear(): void {
    if (!this.enabled) return
    this.root.clear()
  }
  
  /**
   * 是否启用
   */
  isEnabled(): boolean {
    return this.enabled
  }
}

// ============================================================================
// 🎮 第三部分：实体管理器
// ============================================================================

/**
 * 🎮 实体管理器
 * 
 * @remarks
 * 跨游戏通用，提供统一的实体管理
 */
export class EntityManager {
  private entities: BaseEntity[] = []
  
  /**
   * 添加实体
   */
  add(entity: BaseEntity): void {
    this.entities.push(entity)
  }
  
  /**
   * 移除失活实体
   */
  removeInactive(): void {
    this.entities = this.entities.filter(e => e.active)
  }
  
  /**
   * 获取所有激活实体
   */
  getActive(): BaseEntity[] {
    return this.entities.filter(e => e.active)
  }
  
  /**
   * 按类型筛选实体
   */
  getByType(type: string): BaseEntity[] {
    return this.entities.filter(e => e.type === type && e.active)
  }
  
  /**
   * 按类型前缀筛选（支持模糊匹配）
   */
  getByTypePrefix(prefix: string): BaseEntity[] {
    return this.entities.filter(e => e.type.startsWith(prefix) && e.active)
  }
  
  /**
   * 遍历所有激活实体
   */
  forEach(callback: (entity: BaseEntity) => void): void {
    this.entities.forEach(e => {
      if (e.active) callback(e)
    })
  }
  
  /**
   * 更新所有实体
   */
  updateAll(deltaTime: number): void {
    this.entities.forEach(e => {
      if (e.active) e.update(deltaTime)
    })
  }
  
  /**
   * 渲染所有实体
   */
  renderAll(ctx: any): void {
    // 按 zIndex 排序
    const sorted = [...this.entities]
      .filter(e => e.active && e.visible !== false)
      .sort((a, b) => a.zIndex - b.zIndex)
    
    sorted.forEach(e => e.render(ctx))
  }
  
  /**
   * 清空所有实体
   */
  clear(): void {
    this.entities = []
  }
  
  /**
   * 获取实体数量
   */
  count(): number {
    return this.entities.length
  }
  
  /**
   * 获取激活实体数量
   */
  activeCount(): number {
    return this.entities.filter(e => e.active).length
  }
}

// ============================================================================
// 🎯 第四部分：碰撞检测器
// ============================================================================

/**
 * 🎯 碰撞检测器
 * 
 * @remarks
 * 标准化的碰撞检测流程，跨游戏通用
 */
export class CollisionDetector {
  private entityManager: EntityManager
  private quadTree: QuadTree | null = null
  
  constructor(
    entityManager: EntityManager,
    useQuadTree: boolean = false,
    worldWidth?: number,
    worldHeight?: number
  ) {
    this.entityManager = entityManager
    
    if (useQuadTree && worldWidth && worldHeight) {
      this.quadTree = new QuadTree(worldWidth, worldHeight)
    }
  }
  
  /**
   * ⭐ 执行碰撞检测（每帧调用）
   * 
   * @param collisionCallback - 碰撞回调函数
   */
  detectCollisions(collisionCallback: (a: BaseEntity, b: BaseEntity) => void): void {
    // Step 1: 清空失活实体
    this.entityManager.removeInactive()
    
    // Step 2: （可选）重建四叉树
    if (this.quadTree) {
      this.quadTree.clear()
      this.entityManager.getActive().forEach(e => this.quadTree?.insert(e))
    }
    
    // Step 3: 获取需要检测的核心实体
    const coreEntities = this.entityManager.getActive()
    
    // Step 4: 对每个核心实体执行碰撞检测
    for (const entity of coreEntities) {
      let candidates: BaseEntity[]
      
      // Step 4.1: 使用四叉树查询候选实体（如有）
      if (this.quadTree) {
        candidates = this.quadTree.query(entity)
          .filter(e => e !== entity && e.active)
      } else {
        // Step 4.2: 全量检测（无四叉树）
        candidates = coreEntities.filter(e => e !== entity && e.active)
      }
      
      // Step 5: 对候选实体调用 AABB
      for (const candidate of candidates) {
        if (entity.isCollide(candidate)) {
          // Step 6: 调用碰撞回调
          collisionCallback(entity, candidate)
        }
      }
    }
  }
}
