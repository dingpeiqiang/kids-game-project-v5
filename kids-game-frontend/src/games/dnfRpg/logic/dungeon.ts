/**
 * 地下城管理器（优化版）
 * 支持分支路径、房间类型和状态管理
 */

import type { DungeonRoom, EnemySpawn, LevelConfig } from '../types'
import type { RoomGraph, RoomGraphNode, RoomNodeStatus } from '../types'

export interface LevelData {
  levels: LevelConfig[]
}

// 创建地下城房间管理器
export class DungeonManager {
  private levels: LevelConfig[]
  private currentLevelIndex: number
  private currentRoomId: number
  /** 房间访问历史（用于回溯） */
  private roomHistory: number[]
  /** 当前关卡房间图 */
  private roomGraph!: RoomGraph

  constructor(levels: LevelConfig[]) {
    this.levels = levels
    this.currentLevelIndex = 0
    this.currentRoomId = -1
    this.roomHistory = []
    this.buildRoomGraph()
  }

  /** 构建房间图 */
  private buildRoomGraph(): void {
    const level = this.levels[this.currentLevelIndex]
    const nodeMap = new Map<number, RoomGraphNode>()
    let entryId = -1

    for (const room of level.rooms) {
      const children = room.branches ?? []
      const status: RoomNodeStatus = 'unknown'

      nodeMap.set(room.id, {
        roomId: room.id,
        status,
        children,
      })

      // 入口房间：roomType === 'entry' 或第一个房间
      if (room.roomType === 'entry' || entryId === -1) {
        entryId = room.id
      }
    }

    this.roomGraph = {
      nodeMap,
      entryRoomId: entryId,
      currentRoomId: entryId,
    }
    this.currentRoomId = entryId

    // 初始化入口和其子节点状态
    const entryNode = this.roomGraph.nodeMap.get(entryId)
    if (entryNode) {
      entryNode.status = 'current'
      // 子节点设为 available
      for (const childId of entryNode.children) {
        const childNode = this.roomGraph.nodeMap.get(childId)
        if (childNode && childNode.status === 'unknown') {
          childNode.status = 'available'
        }
      }
    }
  }

  /** 根据ID获取房间 */
  getRoomById(roomId: number): DungeonRoom | undefined {
    const level = this.getCurrentLevel()
    return level.rooms.find(r => r.id === roomId)
  }

  getCurrentLevel(): LevelConfig {
    return this.levels[this.currentLevelIndex]
  }

  getCurrentRoom(): DungeonRoom {
    const room = this.getRoomById(this.currentRoomId)
    if (!room) {
      // 降级：返回第一个房间
      return this.getCurrentLevel().rooms[0]
    }
    return room
  }

  getCurrentRoomIndex(): number {
    const level = this.getCurrentLevel()
    return level.rooms.findIndex(r => r.id === this.currentRoomId)
  }

  getTotalRooms(): number {
    return this.getCurrentLevel().rooms.length
  }

  getCurrentLevelIndex(): number {
    return this.currentLevelIndex
  }

  getTotalLevels(): number {
    return this.levels.length
  }

  getCurrentRoomId(): number {
    return this.currentRoomId
  }

  getRoomGraph(): RoomGraph {
    return this.roomGraph
  }

  getRoomHistory(): number[] {
    return [...this.roomHistory]
  }

  isLastRoom(): boolean {
    const room = this.getCurrentRoom()
    return !room.branches || room.branches.length === 0
  }

  isLastLevel(): boolean {
    return this.currentLevelIndex >= this.levels.length - 1
  }

  isBossRoom(): boolean {
    return this.getCurrentRoom().roomType === 'boss' || (this.getCurrentRoom().hasBoss ?? false)
  }

  isTreasureRoom(): boolean {
    return this.getCurrentRoom().roomType === 'treasure'
  }

  isRestRoom(): boolean {
    return this.getCurrentRoom().roomType === 'rest'
  }

  isSecretRoom(): boolean {
    return this.getCurrentRoom().roomType === 'secret'
  }

  /** 获取当前房间可前往的分支房间列表 */
  getAvailableBranches(): DungeonRoom[] {
    const room = this.getCurrentRoom()
    if (!room.branches || room.branches.length === 0) return []

    const result: DungeonRoom[] = []
    for (const branchId of room.branches) {
      const branchRoom = this.getRoomById(branchId)
      const branchNode = this.roomGraph.nodeMap.get(branchId)
      if (branchRoom && branchNode && branchNode.status !== 'locked') {
        result.push(branchRoom)
      }
    }
    return result
  }

  /** 获取房间状态 */
  getRoomStatus(roomId: number): RoomNodeStatus {
    const node = this.roomGraph.nodeMap.get(roomId)
    return node?.status ?? 'unknown'
  }

  /** 前往指定ID的房间（支持分支选择） */
  goToRoom(roomId: number): boolean {
    const room = this.getRoomById(roomId)
    if (!room) return false

    const node = this.roomGraph.nodeMap.get(roomId)
    if (!node || node.status === 'locked') return false

    // 检查进入条件
    if (room.entryCondition?.type === 'key') {
      // 需要钥匙才能进入（由外部逻辑设置状态）
      return false
    }

    // 标记当前房间为 completed
    const currentNode = this.roomGraph.nodeMap.get(this.currentRoomId)
    if (currentNode) {
      currentNode.status = 'completed'
    }

    // 记录历史
    this.roomHistory.push(this.currentRoomId)

    // 切换到新房间
    this.currentRoomId = roomId
    node.status = 'current'

    // 更新子节点状态
    this.updateChildNodeStatus(room)

    return true
  }

  /** 前往下一个可用分支（默认第一个） */
  goToNextBranch(branchIndex: number = 0): boolean {
    const branches = this.getAvailableBranches()
    if (branchIndex >= branches.length) return false
    return this.goToRoom(branches[branchIndex].id)
  }

  /** 前往下一个房间（兼容旧线性逻辑：取第一个分支） */
  nextRoom(): boolean {
    if (this.isLastRoom()) {
      if (this.isLastLevel()) return false
      this.currentLevelIndex++
      this.roomHistory = []
      this.buildRoomGraph()
      return true
    }

    // 线性模式：找第一个未完成的子节点
    const room = this.getCurrentRoom()
    if (room.branches && room.branches.length > 0) {
      return this.goToRoom(room.branches[0])
    }

    // 如果没定义分支，按顺序找下一个房间
    const level = this.getCurrentLevel()
    const currentIdx = level.rooms.findIndex(r => r.id === this.currentRoomId)
    if (currentIdx >= 0 && currentIdx < level.rooms.length - 1) {
      return this.goToRoom(level.rooms[currentIdx + 1].id)
    }

    return false
  }

  /** 更新子节点状态 */
  private updateChildNodeStatus(room: DungeonRoom): void {
    if (!room.branches) return

    for (const childId of room.branches) {
      const childNode = this.roomGraph.nodeMap.get(childId)
      if (childNode && childNode.status === 'unknown') {
        const childRoom = this.getRoomById(childId)
        // 检查是否有锁定条件
        if (childRoom?.entryCondition?.type === 'key') {
          childNode.status = 'locked'
        } else {
          childNode.status = 'available'
        }
      }
    }
  }

  /** 解锁指定房间（例如使用钥匙解锁） */
  unlockRoom(roomId: number): boolean {
    const node = this.roomGraph.nodeMap.get(roomId)
    if (!node || node.status !== 'locked') return false
    node.status = 'available'
    return true
  }

  /** 发现隐藏房间 */
  revealSecretRoom(roomId: number): boolean {
    const node = this.roomGraph.nodeMap.get(roomId)
    if (!node || node.status !== 'unknown') return false
    node.status = 'available'
    return true
  }

  /** 获取房间图的所有节点（按层级排列，用于小地图渲染） */
  getRoomGraphLayout(): { roomId: number; status: RoomNodeStatus; children: number[]; roomType: string; depth: number }[] {
    const result: { roomId: number; status: RoomNodeStatus; children: number[]; roomType: string; depth: number }[] = []
    const visited = new Set<number>()
    const level = this.getCurrentLevel()

    // BFS 遍历
    const queue: { roomId: number; depth: number }[] = [{ roomId: this.roomGraph.entryRoomId, depth: 0 }]
    visited.add(this.roomGraph.entryRoomId)

    while (queue.length > 0) {
      const { roomId, depth } = queue.shift()!
      const node = this.roomGraph.nodeMap.get(roomId)
      const room = level.rooms.find(r => r.id === roomId)

      if (node && room) {
        result.push({
          roomId,
          status: node.status,
          children: node.children,
          roomType: room.roomType,
          depth,
        })

        for (const childId of node.children) {
          if (!visited.has(childId)) {
            visited.add(childId)
            queue.push({ roomId: childId, depth: depth + 1 })
          }
        }
      }
    }

    return result
  }

  reset() {
    this.currentLevelIndex = 0
    this.currentRoomId = -1
    this.roomHistory = []
    this.buildRoomGraph()
  }
}

// 从房间配置生成敌人列表
export function spawnEnemiesFromRoom(room: DungeonRoom): { type: EnemySpawn['type']; x: number; y: number; behavior: string; quantity: number }[] {
  const result: { type: EnemySpawn['type']; x: number; y: number; behavior: string; quantity: number }[] = []
  for (const spawn of room.enemies) {
    result.push({
      type: spawn.type,
      x: spawn.x,
      y: spawn.y,
      behavior: spawn.behavior || 'chase',
      quantity: spawn.quantity,
    })
  }
  return result
}