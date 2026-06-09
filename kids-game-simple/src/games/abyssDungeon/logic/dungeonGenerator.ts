import type { DungeonLevel, DungeonRoom, DungeonTile, Enemy, Trap, Chest, Switch, Door, Position } from '../types'
import { GAME_CONFIG, ENEMY_TEMPLATES, BOSS_TEMPLATES, LEVEL_DESIGN } from '../config'

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function createRooms(width: number, height: number, roomCount: number): DungeonRoom[] {
  const rooms: DungeonRoom[] = []
  const minRoomSize = 4
  const maxRoomSize = 8
  const spacing = 2

  for (let i = 0; i < roomCount; i++) {
    let attempts = 0
    let placed = false

    while (!placed && attempts < 100) {
      const roomWidth = randomInt(minRoomSize, maxRoomSize)
      const roomHeight = randomInt(minRoomSize, maxRoomSize)
      const x = randomInt(1, width - roomWidth - 1)
      const y = randomInt(1, height - roomHeight - 1)

      const newRoom: DungeonRoom = {
        x,
        y,
        width: roomWidth,
        height: roomHeight,
        center: {
          x: x + roomWidth / 2,
          y: y + roomHeight / 2,
          z: 0,
        },
        connections: [],
      }

      let overlaps = false
      for (const existingRoom of rooms) {
        if (
          x < existingRoom.x + existingRoom.width + spacing &&
          x + roomWidth + spacing > existingRoom.x &&
          y < existingRoom.y + existingRoom.height + spacing &&
          y + roomHeight + spacing > existingRoom.y
        ) {
          overlaps = true
          break
        }
      }

      if (!overlaps) {
        rooms.push(newRoom)
        placed = true
      }
      attempts++
    }
  }

  return rooms
}

function connectRooms(rooms: DungeonRoom[]): DungeonRoom[] {
  for (let i = 1; i < rooms.length; i++) {
    const prevRoom = rooms[i - 1]
    const currRoom = rooms[i]

    const startX = Math.floor(prevRoom.center.x)
    const startY = Math.floor(prevRoom.center.y)
    const endX = Math.floor(currRoom.center.x)
    const endY = Math.floor(currRoom.center.y)

    if (Math.random() > 0.5) {
      currRoom.connections.push({ x: startX, y: startY })
      for (let x = Math.min(startX, endX); x <= Math.max(startX, endX); x++) {
        currRoom.connections.push({ x, y: startY })
      }
      for (let y = Math.min(startY, endY); y <= Math.max(startY, endY); y++) {
        currRoom.connections.push({ x: endX, y })
      }
    } else {
      currRoom.connections.push({ x: startX, y: startY })
      for (let y = Math.min(startY, endY); y <= Math.max(startY, endY); y++) {
        currRoom.connections.push({ x: startX, y })
      }
      for (let x = Math.min(startX, endX); x <= Math.max(startX, endX); x++) {
        currRoom.connections.push({ x, y: endY })
      }
    }
    currRoom.connections.push({ x: endX, y: endY })
  }

  return rooms
}

function createTiles(rooms: DungeonRoom[], width: number, height: number): DungeonTile[][] {
  const tiles: DungeonTile[][] = []

  for (let y = 0; y < height; y++) {
    tiles[y] = []
    for (let x = 0; x < width; x++) {
      tiles[y][x] = {
        x,
        y,
        type: 'wall',
        explored: false,
        visible: false,
      }
    }
  }

  for (const room of rooms) {
    for (let dy = 0; dy < room.height; dy++) {
      for (let dx = 0; dx < room.width; dx++) {
        const tileX = room.x + dx
        const tileY = room.y + dy
        if (tileX >= 0 && tileX < width && tileY >= 0 && tileY < height) {
          tiles[tileY][tileX].type = 'floor'
        }
      }
    }

    for (const conn of room.connections) {
      if (conn.x >= 0 && conn.x < width && conn.y >= 0 && conn.y < height) {
        tiles[conn.y][conn.x].type = 'floor'
      }
    }
  }

  return tiles
}

function placeEnemies(
  level: number,
  rooms: DungeonRoom[],
  tileMap: DungeonTile[][]
): Enemy[] {
  const enemies: Enemy[] = []
  const levelDesign = LEVEL_DESIGN[level as keyof typeof LEVEL_DESIGN]
  const enemyCount = levelDesign?.enemyCount || 3
  const strengthMultiplier = Math.pow(GAME_CONFIG.ENEMY_STRENGTH_MULTIPLIER, level - 1)

  for (let i = 0; i < enemyCount; i++) {
    const room = randomChoice(rooms.filter((_, idx) => idx > 0 && idx < rooms.length - 1))
    const template = randomChoice(ENEMY_TEMPLATES)
    
    let x: number, y: number
    let attempts = 0
    do {
      x = room.x + randomInt(1, room.width - 2)
      y = room.y + randomInt(1, room.height - 2)
      attempts++
    } while (tileMap[y][x].type !== 'floor' && attempts < 20)

    const enemy: Enemy = {
      ...template,
      id: generateId(),
      position: { x, y, z: 0 },
      rotation: 0,
      hp: Math.floor(template.hp * strengthMultiplier),
      maxHp: Math.floor(template.maxHp * strengthMultiplier),
      attack: Math.floor(template.attack * strengthMultiplier),
      defense: Math.floor(template.defense * strengthMultiplier),
      damage: Math.floor(template.damage * strengthMultiplier),
      patrolPoints: [
        { x: x - 2, y: y, z: 0 },
        { x: x + 2, y: y, z: 0 },
      ],
    }

    enemies.push(enemy)
  }

  return enemies
}

function placeTraps(
  level: number,
  rooms: DungeonRoom[],
  tileMap: DungeonTile[][]
): Trap[] {
  const traps: Trap[] = []
  const levelDesign = LEVEL_DESIGN[level as keyof typeof LEVEL_DESIGN]
  const trapCount = levelDesign?.trapCount || 0
  const trapTypes: Trap['type'][] = ['spike', 'fire', 'ice', 'poison']

  for (let i = 0; i < trapCount; i++) {
    const room = randomChoice(rooms)
    let x: number, y: number
    let attempts = 0
    do {
      x = room.x + randomInt(1, room.width - 2)
      y = room.y + randomInt(1, room.height - 2)
      attempts++
    } while (tileMap[y][x].type !== 'floor' && attempts < 20)

    if (tileMap[y][x].type === 'floor') {
      const type = randomChoice(trapTypes)
      traps.push({
        id: generateId(),
        position: { x, y, z: 0 },
        type,
        active: true,
        damage: GAME_CONFIG.TRAP_DAMAGE[type],
        cooldown: GAME_CONFIG.TRAP_COOLDOWN[type],
        lastActivated: 0,
        triggered: false,
      })
      tileMap[y][x].type = 'trap'
    }
  }

  return traps
}

function placeChests(
  level: number,
  rooms: DungeonRoom[],
  tileMap: DungeonTile[][]
): Chest[] {
  const chests: Chest[] = []
  const levelDesign = LEVEL_DESIGN[level as keyof typeof LEVEL_DESIGN]
  const chestCount = levelDesign?.chestCount || 2

  for (let i = 0; i < chestCount; i++) {
    const room = randomChoice(rooms)
    let x: number, y: number
    let attempts = 0
    do {
      x = room.x + randomInt(1, room.width - 2)
      y = room.y + randomInt(1, room.height - 2)
      attempts++
    } while (tileMap[y][x].type !== 'floor' && attempts < 20)

    if (tileMap[y][x].type === 'floor') {
      const rarity = Math.random() < GAME_CONFIG.CHEST_RARITY_CHANCE.common ? 'common' : 'rare'
      chests.push({
        id: generateId(),
        position: { x, y, z: 0 },
        opened: false,
        loot: [],
        rarity,
      })
      tileMap[y][x].type = 'chest'
    }
  }

  return chests
}

function placeBoss(
  level: number,
  rooms: DungeonRoom[]
): Enemy | null {
  const levelDesign = LEVEL_DESIGN[level as keyof typeof LEVEL_DESIGN]
  
  if (!levelDesign?.hasBoss || levelDesign.bossIndex < 0) {
    return null
  }

  const bossTemplate = BOSS_TEMPLATES[levelDesign.bossIndex]
  if (!bossTemplate) return null

  const lastRoom = rooms[rooms.length - 1]
  const strengthMultiplier = Math.pow(GAME_CONFIG.ENEMY_STRENGTH_MULTIPLIER, level - 1)

  const boss: Enemy = {
    ...bossTemplate,
    id: generateId(),
    position: {
      x: lastRoom.center.x,
      y: lastRoom.center.y,
      z: 0,
    },
    rotation: 0,
    hp: Math.floor(bossTemplate.hp * strengthMultiplier),
    maxHp: Math.floor(bossTemplate.maxHp * strengthMultiplier),
    attack: Math.floor(bossTemplate.attack * strengthMultiplier),
    defense: Math.floor(bossTemplate.defense * strengthMultiplier),
    damage: Math.floor(bossTemplate.damage * strengthMultiplier),
    patrolPoints: [],
  }

  return boss
}

function placeStairs(rooms: DungeonRoom[]): Position {
  const lastRoom = rooms[rooms.length - 1]
  return {
    x: lastRoom.center.x,
    y: lastRoom.center.y,
    z: 0,
  }
}

function placePlayerStart(rooms: DungeonRoom[]): Position {
  const firstRoom = rooms[0]
  return {
    x: firstRoom.center.x,
    y: firstRoom.center.y,
    z: 0,
  }
}

export function generateDungeon(level: number): DungeonLevel {
  const { MAP_WIDTH, MAP_HEIGHT } = GAME_CONFIG
  const levelDesign = LEVEL_DESIGN[level as keyof typeof LEVEL_DESIGN]
  const roomCount = levelDesign?.roomCount || 4

  const rooms = connectRooms(createRooms(MAP_WIDTH, MAP_HEIGHT, roomCount))
  const tiles = createTiles(rooms, MAP_WIDTH, MAP_HEIGHT)
  const enemies = placeEnemies(level, rooms, tiles)
  const traps = placeTraps(level, rooms, tiles)
  const chests = placeChests(level, rooms, tiles)
  const boss = placeBoss(level, rooms)
  const stairsPosition = placeStairs(rooms)
  const playerStartPosition = placePlayerStart(rooms)

  const switches: Switch[] = []
  const doors: Door[] = []

  if (level > 2) {
    const doorRoom = rooms[Math.floor(rooms.length / 2)]
    const door: Door = {
      id: generateId(),
      position: { x: doorRoom.center.x, y: doorRoom.y, z: 0 },
      opened: false,
      locked: true,
    }
    doors.push(door)

    const switchRoom = randomChoice(rooms.filter(r => r !== doorRoom))
    switches.push({
      id: generateId(),
      position: { x: switchRoom.center.x, y: switchRoom.center.y, z: 0 },
      activated: false,
      targetDoorId: door.id,
    })
  }

  return {
    level,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    tiles,
    rooms,
    enemies,
    traps,
    chests,
    switches,
    doors,
    boss,
    stairsPosition,
    playerStartPosition,
  }
}

export function isWalkable(tileMap: DungeonTile[][], x: number, y: number): boolean {
  if (x < 0 || x >= tileMap[0].length || y < 0 || y >= tileMap.length) {
    return false
  }
  const tile = tileMap[Math.floor(y)][Math.floor(x)]
  return tile.type === 'floor' || tile.type === 'door' && tile.type !== 'wall'
}

export function updateVisibility(
  tileMap: DungeonTile[][],
  playerX: number,
  playerY: number,
  viewRange: number = 5
): void {
  const width = tileMap[0].length
  const height = tileMap.length

  for (let dy = -viewRange; dy <= viewRange; dy++) {
    for (let dx = -viewRange; dx <= viewRange; dx++) {
      const tileX = Math.floor(playerX) + dx
      const tileY = Math.floor(playerY) + dy

      if (tileX >= 0 && tileX < width && tileY >= 0 && tileY < height) {
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance <= viewRange) {
          tileMap[tileY][tileX].visible = true
          tileMap[tileY][tileX].explored = true
        } else {
          tileMap[tileY][tileX].visible = false
        }
      }
    }
  }
}