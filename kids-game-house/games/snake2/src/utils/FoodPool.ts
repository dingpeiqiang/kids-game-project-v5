/**
 * 食物对象池
 * 
 * 用于复用食物对象，减少 GC 压力
 */

import type { Food } from '../types/FoodTypes'
import { createFood } from '../types/FoodTypes'

export class FoodPool {
  private pool: Food[] = []
  private initialSize: number = 10
  
  constructor() {
    // 预创建食物对象
    for (let i = 0; i < this.initialSize; i++) {
      this.pool.push(createFood({ x: -1, y: -1 }))
    }
  }
  
  /**
   * 获取一个食物对象
   */
  acquire(position: { x: number, y: number }): Food {
    const food = this.pool.pop() || createFood(position)
    food.position = position
    food.isActive = true
    return food
  }
  
  /**
   * 回收食物对象
   */
  release(food: Food): void {
    food.isActive = false
    food.position = { x: -1, y: -1 }
    this.pool.push(food)
  }
  
  /**
   * 清空所有对象
   */
  clear(): void {
    this.pool.forEach(food => {
      food.isActive = false
    })
    this.pool.length = 0
  }
  
  /**
   * 获取池大小
   */
  getSize(): number {
    return this.pool.length
  }
}
