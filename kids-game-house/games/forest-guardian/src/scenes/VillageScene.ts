import TopDownGameScene from './TopDownGameScene'

/**
 * 🏘️ 新手村 - 精美瓦片地图场景
 *
 * 使用程序化生成的瓦片纹理绘制一个漂亮的村庄地图。
 * 包含草地、泥土路、木地板、房屋、树木、花草、石头、水池等精美瓦片。
 */

// 瓦片大小
const TILE_SIZE = 16

// 瓦片类型
enum TileType {
  GRASS_DARK = 1,
  GRASS_LIGHT = 2,
  GRASS_FLOWER = 3,
  DIRT = 4,
  WOOD = 5,
  HOUSE_WALL = 6,
  HOUSE_ROOF = 7,
  TREE_TRUNK = 8,
  TREE_LEAVES = 9,
  STONE = 10,
  WATER = 11,
  FENCE = 12,
  PORTAL = 13,
}

export default class VillageScene extends TopDownGameScene {
  private tileGraphics!: Phaser.GameObjects.Graphics
  private tileTextures: Map<number, string> = new Map()

  constructor() {
    super({ key: 'VillageScene' })
  }

  preload(): void {
    // 跳过 GTRS 和默认 tileset 加载
    // VillageScene 使用自己动态生成的瓦片纹理
    console.log('🏘️ 村庄场景预加载（使用动态瓦片）...')
  }

  create(): void {
    // 生成虚拟地图数据（二维数组格式给 Phaser）
    const mapData = this.generateVillageMap2D()

    if (!this.scene.settings.data) {
      this.scene.settings.data = {}
    }
    ;(this.scene.settings.data as any).mapData = mapData

    console.log(`🏘️ 村庄地图数据已准备: ${mapData[0].length}x${mapData.length}`)

    // 生成所有瓦片纹理
    this.generateTileTextures()

    super.create()

    // 背景色
    this.cameras.main.setBackgroundColor('#3d5c3d')
  }

  /**
   * 生成所有瓦片纹理
   */
  private generateTileTextures(): void {
    // 1. 深绿草地
    this.createTileTexture(TileType.GRASS_DARK, (g) => {
      g.fillStyle(0x2d4a2d)
      g.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
      // 添加草纹理
      g.fillStyle(0x3d5c3d)
      for (let i = 0; i < 6; i++) {
        const x = Phaser.Math.Between(2, 14)
        const y = Phaser.Math.Between(2, 14)
        g.fillRect(x, y, 2, 3)
      }
    })

    // 2. 浅绿草地
    this.createTileTexture(TileType.GRASS_LIGHT, (g) => {
      g.fillStyle(0x4a6b4a)
      g.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
      // 添加草地细节
      g.fillStyle(0x5a7b5a)
      for (let i = 0; i < 4; i++) {
        const x = Phaser.Math.Between(1, 13)
        const y = Phaser.Math.Between(1, 13)
        g.fillRect(x, y, 2, 2)
      }
    })

    // 3. 开花草地
    this.createTileTexture(TileType.GRASS_FLOWER, (g) => {
      g.fillStyle(0x4a6b4a)
      g.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
      // 小花
      g.fillStyle(0xffff66)
      g.fillCircle(4, 4, 2)
      g.fillCircle(12, 8, 2)
      g.fillCircle(6, 12, 2)
      g.fillStyle(0xff6699)
      g.fillCircle(10, 3, 1.5)
      g.fillCircle(3, 10, 1.5)
    })

    // 4. 泥土路
    this.createTileTexture(TileType.DIRT, (g) => {
      g.fillStyle(0x8b6914)
      g.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
      // 泥土纹理
      g.fillStyle(0x7a5a10)
      g.fillRect(2, 2, 3, 2)
      g.fillRect(8, 6, 4, 2)
      g.fillRect(4, 11, 3, 2)
      // 浅色高光
      g.fillStyle(0x9b7924)
      g.fillRect(6, 3, 2, 1)
      g.fillRect(11, 9, 2, 1)
    })

    // 5. 木地板
    this.createTileTexture(TileType.WOOD, (g) => {
      g.fillStyle(0xa0522d)
      g.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
      // 木纹线条
      g.lineStyle(1, 0x8b4513)
      g.lineBetween(0, 4, 16, 4)
      g.lineBetween(0, 8, 16, 8)
      g.lineBetween(0, 12, 16, 12)
      // 垂直木纹
      g.lineStyle(1, 0x7a3d1a)
      g.lineBetween(8, 0, 8, 4)
      g.lineBetween(4, 4, 4, 8)
      g.lineBetween(12, 8, 12, 12)
      g.lineBetween(6, 12, 6, 16)
    })

    // 6. 房屋墙壁
    this.createTileTexture(TileType.HOUSE_WALL, (g) => {
      // 木墙
      g.fillStyle(0xcd853f)
      g.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
      // 木板纹理
      g.fillStyle(0xb8732e)
      g.fillRect(0, 0, 16, 4)
      g.fillRect(0, 8, 16, 4)
      g.fillRect(0, 13, 16, 3)
      // 窗格
      g.fillStyle(0x87ceeb)
      g.fillRect(4, 5, 8, 5)
      g.lineStyle(1, 0x8b4513)
      g.lineBetween(8, 5, 8, 10)
      g.lineBetween(4, 7.5, 12, 7.5)
      // 窗框
      g.lineStyle(1, 0x654321)
      g.strokeRect(4, 5, 8, 5)
    })

    // 7. 房屋屋顶
    this.createTileTexture(TileType.HOUSE_ROOF, (g) => {
      // 瓦片屋顶
      g.fillStyle(0x8b0000)
      g.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
      // 瓦片纹理（波浪形）
      g.fillStyle(0xa52a2a)
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const offsetX = (row % 2) * 4
          g.fillRect(col * 8 + offsetX - 4, row * 4, 8, 4)
        }
      }
      // 高光
      g.fillStyle(0xb22222)
      g.fillRect(2, 2, 3, 1)
      g.fillRect(10, 6, 4, 1)
    })

    // 8. 树干
    this.createTileTexture(TileType.TREE_TRUNK, (g) => {
      g.fillStyle(0x4a3728)
      g.fillRect(5, 0, 6, 16)
      // 树皮纹理
      g.fillStyle(0x3a2718)
      g.fillRect(6, 2, 2, 3)
      g.fillRect(9, 8, 2, 4)
      g.fillStyle(0x5a4738)
      g.fillRect(7, 5, 1, 2)
    })

    // 9. 树冠
    this.createTileTexture(TileType.TREE_LEAVES, (g) => {
      // 深绿色树冠
      g.fillStyle(0x228b22)
      g.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
      // 叶丛层次
      g.fillStyle(0x2e8b2e)
      g.fillCircle(8, 6, 5)
      g.fillCircle(5, 10, 4)
      g.fillCircle(11, 10, 4)
      // 高光
      g.fillStyle(0x32cd32)
      g.fillCircle(6, 4, 3)
      g.fillCircle(10, 8, 2)
    })

    // 10. 石头
    this.createTileTexture(TileType.STONE, (g) => {
      g.fillStyle(0x808080)
      g.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
      // 石头形状
      g.fillStyle(0x696969)
      g.fillRect(2, 4, 12, 8)
      g.fillStyle(0xa9a9a9)
      g.fillRect(4, 6, 4, 3)
      // 裂缝
      g.lineStyle(1, 0x505050)
      g.lineBetween(6, 4, 8, 8)
      g.lineBetween(10, 5, 12, 10)
    })

    // 11. 水池
    this.createTileTexture(TileType.WATER, (g) => {
      g.fillStyle(0x4169e1)
      g.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
      // 水波纹
      g.fillStyle(0x6495ed)
      g.fillRect(2, 3, 6, 2)
      g.fillRect(9, 8, 5, 2)
      g.fillRect(3, 12, 4, 2)
      // 高光
      g.fillStyle(0x87ceeb)
      g.fillRect(4, 4, 2, 1)
      g.fillRect(10, 9, 2, 1)
    })

    // 12. 篱笆
    this.createTileTexture(TileType.FENCE, (g) => {
      g.fillStyle(0x2d4a2d)
      g.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
      // 篱笆木条
      g.fillStyle(0x8b7355)
      g.fillRect(1, 4, 3, 12)
      g.fillRect(7, 4, 3, 12)
      g.fillRect(13, 4, 2, 12)
      // 横梁
      g.fillStyle(0x7a6345)
      g.fillRect(0, 5, 16, 2)
      g.fillRect(0, 11, 16, 2)
    })

    // 13. 传送门
    this.createTileTexture(TileType.PORTAL, (g) => {
      // 魔法光环
      g.fillStyle(0x4b0082)
      g.fillCircle(8, 8, 7)
      g.fillStyle(0x9932cc)
      g.fillCircle(8, 8, 5)
      g.fillStyle(0xda70d6)
      g.fillCircle(8, 8, 3)
      // 星星效果
      g.fillStyle(0xffffff)
      g.fillRect(6, 5, 2, 2)
      g.fillRect(9, 7, 2, 2)
      g.fillRect(7, 10, 2, 2)
    })
  }

  /**
   * 创建单个瓦片纹理
   */
  private createTileTexture(tileType: number, drawFunc: (g: Phaser.GameObjects.Graphics) => void): void {
    const key = `village_tile_${tileType}`
    const g = this.make.graphics({ x: 0, y: 0 })
    drawFunc(g)
    g.generateTexture(key, TILE_SIZE, TILE_SIZE)
    g.destroy()
    this.tileTextures.set(tileType, key)
  }

  /**
   * 生成村庄地图数据（二维数组格式）
   */
  private generateVillageMap2D(): number[][] {
    const width = 25
    const height = 20
    const map: number[][] = []

    // 初始化为深绿草地
    for (let y = 0; y < height; y++) {
      map[y] = []
      for (let x = 0; x < width; x++) {
        map[y][x] = TileType.GRASS_DARK
      }
    }

    // 添加一些浅绿草地和开花草地
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (Math.random() < 0.15) {
          map[y][x] = TileType.GRASS_LIGHT
        } else if (Math.random() < 0.08) {
          map[y][x] = TileType.GRASS_FLOWER
        }
      }
    }

    // 村庄中心广场（泥土路，十字形）
    const centerX = 12
    const centerY = 10
    for (let x = 8; x <= 16; x++) {
      map[centerY][x] = TileType.DIRT
      if (x >= 10 && x <= 14) {
        map[centerY - 1][x] = TileType.DIRT
        map[centerY + 1][x] = TileType.DIRT
      }
    }

    // 垂直道路
    for (let y = 5; y <= 15; y++) {
      map[y][centerX] = TileType.DIRT
    }

    // 左边的房子 (5x4)
    this.drawHouse2D(map, 3, 3, 5, 4)

    // 右边的房子 (6x4)
    this.drawHouse2D(map, 17, 4, 6, 4)

    // 上方的房子 (4x3)
    this.drawHouse2D(map, 10, 1, 4, 3)

    // 左边的树群
    this.drawTree2D(map, 1, 2)
    this.drawTree2D(map, 0, 8)
    this.drawTree2D(map, 2, 12)

    // 右边的树群
    this.drawTree2D(map, 23, 2)
    this.drawTree2D(map, 24, 9)
    this.drawTree2D(map, 22, 14)

    // 装饰性石头
    this.placeTile2D(map, 5, 14, TileType.STONE)
    this.placeTile2D(map, 6, 15, TileType.STONE)
    this.placeTile2D(map, 19, 16, TileType.STONE)

    // 左边篱笆
    for (let y = 6; y <= 8; y++) {
      map[y][2] = TileType.FENCE
    }

    // 右边篱笆
    for (let y = 7; y <= 9; y++) {
      map[y][22] = TileType.FENCE
    }

    // 传送门位置（村庄左下角）
    map[17][3] = TileType.PORTAL

    // 水池（右上角装饰）
    this.drawWater2D(map, 20, 2, 3, 2)

    return map
  }

  /**
   * 绘制房屋（二维数组版本）
   */
  private drawHouse2D(map: number[][], startX: number, startY: number, w: number, h: number): void {
    // 木地板地基
    for (let y = startY; y < startY + h; y++) {
      for (let x = startX; x < startX + w; x++) {
        if (y >= 0 && y < map.length && x >= 0 && x < map[0].length) {
          map[y][x] = TileType.WOOD
        }
      }
    }

    // 墙壁（中间区域）
    for (let y = startY + 1; y < startY + h - 1; y++) {
      for (let x = startX + 1; x < startX + w - 1; x++) {
        if (y >= 0 && y < map.length && x >= 0 && x < map[0].length) {
          map[y][x] = TileType.HOUSE_WALL
        }
      }
    }

    // 屋顶（顶部一行）
    for (let x = startX; x < startX + w; x++) {
      if (startY >= 0 && startY < map.length && x >= 0 && x < map[0].length) {
        map[startY][x] = TileType.HOUSE_ROOF
      }
    }

    // 门（底部中间）
    const doorX = startX + Math.floor(w / 2)
    if (startY + h - 1 >= 0 && startY + h - 1 < map.length && doorX >= 0 && doorX < map[0].length) {
      map[startY + h - 1][doorX] = TileType.WOOD
    }
  }

  /**
   * 绘制树木（二维数组版本）
   */
  private drawTree2D(map: number[][], x: number, y: number): void {
    const height = map.length
    const width = map[0].length

    // 树干
    if (y >= 0 && y < height && x >= 0 && x < width) {
      map[y][x] = TileType.TREE_TRUNK
    }
    // 树冠（3x3）
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx
        const ny = y + dy
        if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
          map[ny][nx] = TileType.TREE_LEAVES
        }
      }
    }
  }

  /**
   * 绘制水池（二维数组版本）
   */
  private drawWater2D(map: number[][], startX: number, startY: number, w: number, h: number): void {
    for (let y = startY; y < startY + h; y++) {
      for (let x = startX; x < startX + w; x++) {
        if (y >= 0 && y < map.length && x >= 0 && x < map[0].length) {
          map[y][x] = TileType.WATER
        }
      }
    }
  }

  /**
   * 放置单个瓦片（二维数组版本）
   */
  private placeTile2D(map: number[][], x: number, y: number, tileType: number): void {
    if (y >= 0 && y < map.length && x >= 0 && x < map[0].length) {
      map[y][x] = tileType
    }
  }

  /**
   * 绘制房屋（一维数组版本 - 已废弃）
   */
  private drawHouse(map: number[], width: number, startX: number, startY: number, w: number, h: number): void {
    // 木地板地基
    for (let y = startY; y < startY + h; y++) {
      for (let x = startX; x < startX + w; x++) {
        map[y * width + x] = TileType.WOOD
      }
    }

    // 墙壁（中间区域）
    for (let y = startY + 1; y < startY + h - 1; y++) {
      for (let x = startX + 1; x < startX + w - 1; x++) {
        map[y * width + x] = TileType.HOUSE_WALL
      }
    }

    // 屋顶（顶部一行）
    for (let x = startX; x < startX + w; x++) {
      map[startY * width + x] = TileType.HOUSE_ROOF
    }

    // 门（底部中间）
    const doorX = startX + Math.floor(w / 2)
    map[(startY + h - 1) * width + doorX] = TileType.WOOD
  }

  /**
   * 绘制树木（一维数组版本 - 已废弃）
   */
  private drawTree(map: number[], width: number, x: number, y: number): void {
    // 树干
    map[y * width + x] = TileType.TREE_TRUNK
    // 树冠（3x3）
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < 25 && ny >= 0 && ny < 20) {
          // 角落放角落瓦片，中心放树冠
          if (dx === 0 && dy === 0) {
            map[ny * width + nx] = TileType.TREE_LEAVES
          } else if (Math.abs(dx) + Math.abs(dy) === 1) {
            map[ny * width + nx] = TileType.TREE_LEAVES
          }
        }
      }
    }
  }

  /**
   * 绘制水池（一维数组版本 - 已废弃）
   */
  private drawWater(map: number[], width: number, startX: number, startY: number, w: number, h: number): void {
    for (let y = startY; y < startY + h; y++) {
      for (let x = startX; x < startX + w; x++) {
        map[y * width + x] = TileType.WATER
      }
    }
  }

  /**
   * 放置单个瓦片（一维数组版本 - 已废弃）
   */
  private placeTile(map: number[], width: number, x: number, y: number, tileType: number): void {
    if (x >= 0 && x < 25 && y >= 0 && y < 20) {
      map[y * width + x] = tileType
    }
  }

  /**
   * 绘制房屋
   */
  private drawHouse(map: number[], width: number, startX: number, startY: number, w: number, h: number): void {
    // 木地板地基
    for (let y = startY; y < startY + h; y++) {
      for (let x = startX; x < startX + w; x++) {
        map[y * width + x] = TileType.WOOD
      }
    }

    // 墙壁（中间区域）
    for (let y = startY + 1; y < startY + h - 1; y++) {
      for (let x = startX + 1; x < startX + w - 1; x++) {
        map[y * width + x] = TileType.HOUSE_WALL
      }
    }

    // 屋顶（顶部一行）
    for (let x = startX; x < startX + w; x++) {
      map[startY * width + x] = TileType.HOUSE_ROOF
    }

    // 门（底部中间）
    const doorX = startX + Math.floor(w / 2)
    map[(startY + h - 1) * width + doorX] = TileType.WOOD
  }

  /**
   * 绘制树木（树干 + 树冠）
   */
  private drawTree(map: number[], width: number, x: number, y: number): void {
    // 树干
    map[y * width + x] = TileType.TREE_TRUNK
    // 树冠（3x3）
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < 25 && ny >= 0 && ny < 20) {
          // 角落放角落瓦片，中心放树冠
          if (dx === 0 && dy === 0) {
            map[ny * width + nx] = TileType.TREE_LEAVES
          } else if (Math.abs(dx) + Math.abs(dy) === 1) {
            map[ny * width + nx] = TileType.TREE_LEAVES
          }
        }
      }
    }
  }

  /**
   * 绘制水池
   */
  private drawWater(map: number[], width: number, startX: number, startY: number, w: number, h: number): void {
    for (let y = startY; y < startY + h; y++) {
      for (let x = startX; x < startX + w; x++) {
        map[y * width + x] = TileType.WATER
      }
    }
  }

  /**
   * 放置单个瓦片
   */
  private placeTile(map: number[], width: number, x: number, y: number, tileType: number): void {
    if (x >= 0 && x < 25 && y >= 0 && y < 20) {
      map[y * width + x] = tileType
    }
  }

  protected createGameObjects(): void {
    super.createGameObjects()

    // 英雄出生在村庄中心广场
    const heroPos = (this as any).gridEngine?.getPosition?.('hero') || { x: 12, y: 11 }

    // 创建回森林的传送门（在村庄左下角）
    ;(this as any).createTeleporter(3 * 16, 17 * 16 + 64, 'ForestGuardianScene', 15, 15)

    console.log('🏘️ 村庄瓦片地图已生成')
  }
}
