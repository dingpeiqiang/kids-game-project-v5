/**
 * 四叉树空间分区
 * 
 * 用于优化碰撞检测性能，从 O(n²) 降到 O(n log n)
 */

interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

export interface Entity {
  x: number
  y: number
  width: number
  height: number
  id?: string
}

export class QuadTree {
  private boundary: Rectangle
  private capacity: number
  private entities: Entity[] = []
  private divided: boolean = false
  private children: QuadTree[] = []
  
  constructor(boundary: Rectangle, capacity: number = 4) {
    this.boundary = boundary
    this.capacity = capacity
  }
  
  /**
   * 插入实体
   */
  insert(entity: Entity): boolean {
    // 如果实体不在边界内，返回 false
    if (!this.intersects(entity)) {
      return false
    }
    
    // 如果还没满且未分裂，直接添加
    if (this.entities.length < this.capacity && !this.divided) {
      this.entities.push(entity)
      return true
    }
    
    // 如果已分裂，添加到子节点
    if (!this.divided) {
      this.subdivide()
      
      // 将当前节点的实体重新分配到子节点
      const previousEntities = [...this.entities]
      this.entities = []
      
      for (const e of previousEntities) {
        this.children.some(child => child.insert(e))
      }
    }
    
    return this.children.some(child => child.insert(entity))
  }
  
  /**
   * 查询范围内的所有实体
   */
  query(range: Rectangle): Entity[] {
    const found: Entity[] = []
    
    // 如果查询范围不与边界相交，返回空数组
    if (!this.intersects(range)) {
      return found
    }
    
    // 检查当前节点的实体
    for (const entity of this.entities) {
      if (
        entity.x >= range.x &&
        entity.x <= range.x + range.width &&
        entity.y >= range.y &&
        entity.y <= range.y + range.height
      ) {
        found.push(entity)
      }
    }
    
    // 如果已分裂，查询子节点
    if (this.divided) {
      for (const child of this.children) {
        found.push(...child.query(range))
      }
    }
    
    return found
  }
  
  /**
   * 清空四叉树
   */
  clear(): void {
    this.entities = []
    this.divided = false
    this.children = []
  }
  
  /**
   * 获取所有实体
   */
  getAllEntities(): Entity[] {
    const all: Entity[] = [...this.entities]
    
    if (this.divided) {
      for (const child of this.children) {
        all.push(...child.getAllEntities())
      }
    }
    
    return all
  }
  
  /**
   * 获取实体数量
   */
  getCount(): number {
    let count = this.entities.length
    
    if (this.divided) {
      for (const child of this.children) {
        count += child.getCount()
      }
    }
    
    return count
  }
  
  /**
   * 检查是否与矩形相交
   */
  private intersects(rect: Entity | Rectangle): boolean {
    return rect.x < this.boundary.x + this.boundary.width &&
           rect.x + (rect as Entity).width > this.boundary.x &&
           rect.y < this.boundary.y + this.boundary.height &&
           rect.y + (rect as Entity).height > this.boundary.y
  }
  
  /**
   * 分裂为四个子节点
   */
  private subdivide(): void {
    const { x, y, width, height } = this.boundary
    const halfWidth = width / 2
    const halfHeight = height / 2
    
    this.children = [
      // 左上
      new QuadTree(
        { x, y, width: halfWidth, height: halfHeight },
        this.capacity
      ),
      // 右上
      new QuadTree(
        { x: x + halfWidth, y, width: halfWidth, height: halfHeight },
        this.capacity
      ),
      // 左下
      new QuadTree(
        { x, y: y + halfHeight, width: halfWidth, height: halfHeight },
        this.capacity
      ),
      // 右下
      new QuadTree(
        { x: x + halfWidth, y: y + halfHeight, width: halfWidth, height: halfHeight },
        this.capacity
      )
    ]
    
    this.divided = true
  }
}
