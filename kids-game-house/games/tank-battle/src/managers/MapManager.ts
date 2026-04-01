// ============================================================================
// 🗺️ 坦克大战 - 地图管理器
// ============================================================================
// 
// 📌 说明:
//   统一管理游戏地图，支持：
//   - 程序化地图生成
//   - 地图模板加载
//   - 地图块缓存复用
//   - 动态地图破坏
//   - Tiled 地图编辑器集成
// ============================================================================

/**
 * ⭐ 地图块类型枚举
 */
export enum TileType {
  EMPTY = 'empty',           // 空地
  BRICK = 'brick',           // 砖墙
  STEEL = 'steel',           // 钢墙
  WATER = 'water',           // 水域
  FOREST = 'forest',         // 森林
  BASE = 'base',             // 基地
  SPAWN_PLAYER = 'spawn_player',   // 玩家出生点
  SPAWN_ENEMY = 'spawn_enemy'      // 敌人出生点
}

/**
 * ⭐ 地图块数据
 */
export interface ITileData {
  type: TileType
  x: number
  y: number
  health?: number
  maxHealth?: number
}

/**
 * ⭐ 地图配置
 */
export interface IMapConfig {
  width: number              // 地图宽度（格数）
  height: number             // 地图高度（格数）
  tileSize: number           // 格子大小（像素）
  tiles: ITileData[][]       // 地图数据二维数组
}

/**
 * ⭐ 地图模板
 */
export interface IMapTemplate {
  id: string
  name: string
  difficulty: 'easy' | 'normal' | 'hard' | 'expert'
  layout: string[]           // 字符串数组表示的地图
}

/**
 * ⭐ 地图管理器
 */
export class MapManager {
  private scene: Phaser.Scene
  
  // 地图数据
  private currentMap: IMapConfig | null = null
  private tileCache: Map<string, Phaser.GameObjects.Image> = new Map()
  
  // 地图对象引用
  private tileObjects: Map<string, Phaser.GameObjects.GameObject> = new Map()
  
  // 地图模板库
  private templates: Map<string, IMapTemplate> = new Map()
  
  // 性能统计
  private stats = {
    totalTiles: 0,
    renderedTiles: 0,
    cachedTiles: 0
  }
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
    console.log('🗺️ [MapManager] 已创建')
    
    this.initTemplates()
  }
  
  // ===========================================================================
  // 📌 公共 API - 地图创建
  // ===========================================================================
  
  /**
   * ⭐ 从模板加载地图（增强参数验证）
   */
  loadFromTemplate(templateId: string): IMapConfig {
    // ✅ 参数检查
    if (!templateId || typeof templateId !== 'string') {
      console.error('[MapManager] loadFromTemplate: 模板 ID 无效')
      throw new Error('模板 ID 必须是非空字符串')
    }
    
    const template = this.templates.get(templateId)
    if (!template) {
      const availableTemplates = Array.from(this.templates.keys()).join(', ')
      console.error(
        `[MapManager] loadFromTemplate: 模板 "${templateId}" 不存在\n` +
        `可用模板：[${availableTemplates}]`
      )
      throw new Error(`地图模板 ${templateId} 不存在`)
    }
    
    console.log(`🗺️ [MapManager] 加载地图模板：${template.name}`)
    
    const config = this.parseTemplate(template)
    this.currentMap = config
    
    return config
  }
  
  /**
   * ⭐ 程序化生成地图（增强参数验证）
   */
  generateMap(
    width: number = 20,
    height: number = 15,
    tileSize: number = 40,
    density: number = 0.3
  ): IMapConfig {
    // ✅ 参数验证
    if (width < 5 || width > 100) {
      console.warn('[MapManager] generateMap: 宽度超出合理范围，已调整为默认值')
      width = 20
    }
    
    if (height < 5 || height > 100) {
      console.warn('[MapManager] generateMap: 高度超出合理范围，已调整为默认值')
      height = 15
    }
    
    if (tileSize < 16 || tileSize > 128) {
      console.warn('[MapManager] generateMap: 格子大小超出合理范围，已调整为默认值')
      tileSize = 40
    }
    
    if (density < 0 || density > 1) {
      console.warn('[MapManager] generateMap: 密度必须在 0-1 之间，已调整为默认值')
      density = 0.3
    }
    
    console.log(`🗺️ [MapManager] 程序化生成地图 ${width}x${height}`)
    
    const tiles: ITileData[][] = []
    
    for (let y = 0; y < height; y++) {
      tiles[y] = []
      for (let x = 0; x < width; x++) {
        const tile = this.generateTile(x, y, tileSize, density)
        tiles[y][x] = tile
      }
    }
    
    this.currentMap = { width, height, tileSize, tiles }
    return this.currentMap
  }
  
  /**
   * ⭐ 从 JSON 导入地图（增强错误处理）
   */
  loadFromJSON(jsonString: string): IMapConfig {
    // ✅ 参数检查
    if (!jsonString || typeof jsonString !== 'string') {
      console.error('[MapManager] loadFromJSON: JSON 字符串无效')
      throw new Error('JSON 字符串不能为空')
    }
    
    try {
      const data = JSON.parse(jsonString)
      
      // ✅ 验证数据结构
      if (!data.width || !data.height || !data.tileSize || !data.tiles) {
        console.error('[MapManager] loadFromJSON: JSON 格式不正确，缺少必需字段')
        throw new Error('地图配置格式不正确')
      }
      
      this.currentMap = data as IMapConfig
      console.log(`🗺️ [MapManager] 从 JSON 加载地图成功`)
      return this.currentMap
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ [MapManager] JSON 解析失败:', errorMessage)
      throw error
    }
  }
  
  /**
   * ⭐ 导出为 JSON（增强安全性）
   */
  exportToJSON(): string {
    // ✅ 地图存在性检查
    if (!this.currentMap) {
      console.error('[MapManager] exportToJSON: 当前没有活动的地图')
      throw new Error('当前没有活动的地图')
    }
    
    // ✅ 数据完整性检查
    if (!this.currentMap.tiles || !Array.isArray(this.currentMap.tiles)) {
      console.error('[MapManager] exportToJSON: tiles 数组无效')
      throw new Error('地图数据不完整')
    }
    
    try {
      return JSON.stringify(this.currentMap, null, 2)
    } catch (error) {
      console.error('[MapManager] exportToJSON 失败:', error)
      throw error
    }
  }
  
  // ===========================================================================
  // 📌 公共 API - 地图渲染
  // ===========================================================================
  
  /**
   * ⭐ 渲染地图（增强错误处理）
   */
  render(layer: Phaser.GameObjects.Container): void {
    // ✅ 参数验证
    if (!layer) {
      console.error('[MapManager] render: layer 容器不能为空')
      throw new Error('渲染层容器不能为空')
    }
    
    // ✅ 地图存在性检查
    if (!this.currentMap) {
      console.error('[MapManager] render: 没有活动的地图可渲染')
      throw new Error('没有活动的地图可渲染')
    }
    
    // ✅ 数据完整性检查
    if (!this.currentMap.tiles || !Array.isArray(this.currentMap.tiles)) {
      console.error('[MapManager] render: tiles 数组无效')
      throw new Error('地图数据不完整')
    }
    
    console.log('🎨 [MapManager] 渲染地图...')
    
    const { width, height, tileSize, tiles } = this.currentMap
    
    try {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const tile = tiles[y][x]
          
          // ✅ 安全检查每个瓷砖
          if (!tile) {
            console.warn(`[MapManager] tiles[${y}][${x}] 为空，跳过`)
            continue
          }
          
          if (tile.type === TileType.EMPTY) {
            continue  // 空地不渲染
          }
          
          const gameObject = this.createTileGameObject(tile, layer)
          const key = `${x}_${y}`
          this.tileObjects.set(key, gameObject)
        }
      }
      
      this.stats.renderedTiles = this.tileObjects.size
      console.log(`✅ [MapManager] 渲染完成：${this.stats.renderedTiles} 个地块`)
      
    } catch (error) {
      console.error('[MapManager] render 失败:', error)
      throw error
    }
  }
  
  /**
   * ⭐ 清除地图
   */
  clear(): void {
    console.log('🧹 [MapManager] 清除地图...')
    
    this.tileObjects.forEach(obj => obj.destroy())
    this.tileObjects.clear()
    this.tileCache.clear()
    
    this.currentMap = null
    this.stats.totalTiles = 0
    this.stats.renderedTiles = 0
    this.stats.cachedTiles = 0
    
    console.log('✅ [MapManager] 地图已清除')
  }
  
  // ===========================================================================
  // 📌 公共 API - 地图查询
  // ===========================================================================
  
  /**
   * ⭐ 获取指定位置的地图块（增强空值检查）
   */
  getTile(x: number, y: number): ITileData | null {
    // ✅ 参数类型检查
    if (typeof x !== 'number' || typeof y !== 'number') {
      console.error('[MapManager] getTile: 坐标类型错误，必须是数字')
      return null
    }
    
    if (isNaN(x) || isNaN(y)) {
      console.error('[MapManager] getTile: 坐标值无效 (NaN)')
      return null
    }
    
    // ✅ 地图存在性检查
    if (!this.currentMap) {
      console.warn('[MapManager] getTile: 当前没有活动的地图')
      return null
    }
    
    const { width, height, tileSize } = this.currentMap
    
    // ✅ 计算网格坐标
    const gridX = Math.floor(x / tileSize)
    const gridY = Math.floor(y / tileSize)
    
    // ✅ 边界检查
    if (gridX < 0 || gridX >= width || gridY < 0 || gridY >= height) {
      return null  // 超出地图范围
    }
    
    // ✅ 安全检查数组访问
    if (!this.currentMap.tiles[gridY]) {
      console.error(`[MapManager] tiles[${gridY}] 不存在`)
      return null
    }
    
    if (!this.currentMap.tiles[gridY][gridX]) {
      console.warn(`[MapManager] tiles[${gridY}][${gridX}] 为空`)
      return null
    }
    
    return this.currentMap.tiles[gridY][gridX]
  }
  
  /**
   * ⭐ 设置地图块（增强参数验证）
   */
  setTile(x: number, y: number, tile: ITileData): boolean {
    // ✅ 参数验证
    if (!tile || !tile.type) {
      console.error('[MapManager] setTile: 瓷砖数据无效')
      return false
    }
    
    // ✅ 地图存在性检查
    if (!this.currentMap) {
      console.error('[MapManager] setTile: 没有活动的地图')
      return false
    }
    
    const { width, height, tileSize } = this.currentMap
    const gridX = Math.floor(x / tileSize)
    const gridY = Math.floor(y / tileSize)
    
    // ✅ 边界检查
    if (gridX < 0 || gridX >= width || gridY < 0 || gridY >= height) {
      console.warn(`[MapManager] setTile: 坐标超出范围 (${gridX}, ${gridY})`)
      return false
    }
    
    try {
      // ✅ 安全检查数组
      if (!this.currentMap.tiles[gridY]) {
        console.error(`[MapManager] tiles[${gridY}] 不存在`)
        return false
      }
      
      this.currentMap.tiles[gridY][gridX] = tile
      
      // ✅ 更新渲染（如果需要）
      const key = `${gridX}_${gridY}`
      const oldObj = this.tileObjects.get(key)
      if (oldObj) {
        oldObj.destroy()
      }
      
      // 这里应该重新创建，但为了性能通常在 EntityManager 中处理
      
      return true
      
    } catch (error) {
      console.error('[MapManager] setTile 失败:', error)
      return false
    }
  }
  
  /**
   * ⭐ 检查位置是否可通行（增强安全性）
   */
  isWalkable(x: number, y: number): boolean {
    // ✅ 参数检查
    if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
      console.warn('[MapManager] isWalkable: 坐标参数无效')
      return false
    }
    
    const tile = this.getTile(x, y)
    if (!tile) return false
    
    // ✅ 安全检查 tile.type
    if (!tile.type) {
      console.warn('[MapManager] isWalkable: 地图块类型为空')
      return false
    }
    
    // 不可通行的地形
    const blockedTypes = [TileType.BRICK, TileType.STEEL, TileType.WATER]
    return !blockedTypes.includes(tile.type)
  }
  
  /**
   * ⭐ 获取所有出生点（增强健壮性）
   */
  getSpawnPoints(type: 'player' | 'enemy'): { x: number, y: number }[] {
    // ✅ 参数检查
    if (!type || (type !== 'player' && type !== 'enemy')) {
      console.error('[MapManager] getSpawnPoints: 类型参数必须是 "player" 或 "enemy"')
      return []
    }
    
    // ✅ 地图存在性检查
    if (!this.currentMap) {
      console.warn('[MapManager] getSpawnPoints: 当前没有活动的地图')
      return []
    }
    
    const points: { x: number, y: number }[] = []
    const targetType = type === 'player' ? TileType.SPAWN_PLAYER : TileType.SPAWN_ENEMY
    
    const { width, height, tileSize, tiles } = this.currentMap
    
    // ✅ 安全检查 tiles 数组
    if (!tiles || !Array.isArray(tiles)) {
      console.error('[MapManager] getSpawnPoints: tiles 数组无效')
      return []
    }
    
    for (let y = 0; y < height; y++) {
      // ✅ 检查每一行是否存在
      if (!tiles[y]) {
        console.warn(`[MapManager] tiles[${y}] 不存在，跳过`)
        continue
      }
      
      for (let x = 0; x < width; x++) {
        // ✅ 安全检查每个瓷砖
        if (!tiles[y][x]) continue
        
        if (tiles[y][x].type === targetType) {
          points.push({
            x: x * tileSize + tileSize / 2,
            y: y * tileSize + tileSize / 2
          })
        }
      }
    }
    
    return points
  }
  
  // ===========================================================================
  // 🔧 内部方法
  // ===========================================================================
  
  /**
   * 初始化地图模板
   */
  private initTemplates(): void {
    // 模板 1: 简单地图
    this.templates.set('simple', {
      id: 'simple',
      name: '简单训练场',
      difficulty: 'easy',
      layout: [
        '....................',
        '.##..##......##..##.',
        '.##..##......##..##.',
        '....................',
        '..##........##......',
        '..##........##......',
        '....................',
        '......####..........',
        '......####..........',
        '....................',
        '..####......####....',
        '....................',
        'P..................E',
        'P..................E',
        '.......BB............'
      ]
    })
    
    // 模板 2: 中等复杂度
    this.templates.set('medium', {
      id: 'medium',
      name: '初次战斗',
      difficulty: 'normal',
      layout: [
        '####################',
        '#..#..#......#..#..#',
        '#..#..#......#..#..#',
        '#..#..######.#..#..#',
        '#..#..........#..#..#',
        '######..##..######..',
        '........##...........',
        '..####......####.....',
        '..####......####.....',
        '...........##........',
        '..##..########..##...',
        '..##..########..##...',
        'P..................E',
        'P..................E',
        '.......BB............'
      ]
    })
    
    // 模板 3: 复杂地图
    this.templates.set('complex', {
      id: 'complex',
      name: '钢铁防线',
      difficulty: 'hard',
      layout: [
        '####################',
        '#SS#SS#......#SS#SS#',
        '#SS#SS#......#SS#SS#',
        '#SS#SS###..###SS#SS#',
        '#####........#####...',
        '....#..####..#.......',
        '....#..####..#.......',
        '.####........####....',
        '.####........####....',
        '....#..####..#.......',
        '####..########..####',
        '####..########..####',
        'P..................E',
        'P..................E',
        '.......BB............'
      ]
    })
    
    console.log(`✅ [MapManager] 初始化 ${this.templates.size} 个地图模板`)
  }
  
  /**
   * 解析地图模板
   */
  private parseTemplate(template: IMapTemplate): IMapConfig {
    const layout = template.layout
    const height = layout.length
    const width = layout[0].length
    const tileSize = 40  // 默认 40px
    
    const tiles: ITileData[][] = []
    
    for (let y = 0; y < height; y++) {
      tiles[y] = []
      for (let x = 0; x < width; x++) {
        const char = layout[y][x]
        const tile = this.charToTile(char, x, y, tileSize)
        tiles[y][x] = tile
      }
    }
    
    return { width, height, tileSize, tiles }
  }
  
  /**
   * 字符转地图块
   */
  private charToTile(
    char: string,
    gridX: number,
    gridY: number,
    tileSize: number
  ): ITileData {
    const x = gridX * tileSize + tileSize / 2
    const y = gridY * tileSize + tileSize / 2
    
    switch (char) {
      case '#': return { type: TileType.BRICK, x, y, health: 2, maxHealth: 2 }
      case 'S': return { type: TileType.STEEL, x, y, health: Infinity, maxHealth: Infinity }
      case '~': return { type: TileType.WATER, x, y }
      case '%': return { type: TileType.FOREST, x, y }
      case 'B': return { type: TileType.BASE, x, y }
      case 'P': return { type: TileType.SPAWN_PLAYER, x, y }
      case 'E': return { type: TileType.SPAWN_ENEMY, x, y }
      case '.': 
      default:
        return { type: TileType.EMPTY, x, y }
    }
  }
  
  /**
   * 程序化生成单个地图块
   */
  private generateTile(
    gridX: number,
    gridY: number,
    tileSize: number,
    density: number
  ): ITileData {
    const x = gridX * tileSize + tileSize / 2
    const y = gridY * tileSize + tileSize / 2
    
    // 边界必须是墙
    if (gridX === 0 || gridX === this.currentMap!.width - 1 ||
        gridY === 0 || gridY === this.currentMap!.height - 1) {
      return { type: TileType.BRICK, x, y, health: 2, maxHealth: 2 }
    }
    
    // 随机生成墙壁
    if (Math.random() < density) {
      // 70% 砖墙，30% 钢墙
      const isSteel = Math.random() < 0.3
      return {
        type: isSteel ? TileType.STEEL : TileType.BRICK,
        x, y,
        health: isSteel ? Infinity : 2,
        maxHealth: isSteel ? Infinity : 2
      }
    }
    
    return { type: TileType.EMPTY, x, y }
  }
  
  /**
   * 创建地图块游戏对象
   */
  private createTileGameObject(
    tile: ITileData,
    layer: Phaser.GameObjects.Container
  ): Phaser.GameObjects.GameObject {
    // 尝试从缓存获取纹理
    let texture = this.getTileTexture(tile.type)
    
    // 如果缓存中没有，创建新纹理
    if (!texture) {
      texture = this.createTileTexture(tile.type)
    }
    
    // 创建 Image 对象（比 Sprite 轻量）
    const image = layer.add(
      new Phaser.GameObjects.Image(this.scene, tile.x, tile.y, texture)
    )
    
    // 设置物理属性
    if ([TileType.BRICK, TileType.STEEL, TileType.BASE].includes(tile.type)) {
      this.scene.physics.add.existing(image, true)  // static body
    }
    
    // 存储额外数据
    image.setData('tileType', tile.type)
    image.setData('health', tile.health)
    
    return image
  }
  
  /**
   * 获取或创建地图块纹理
   */
  private getTileTexture(type: TileType): string | null {
    const key = `tile_${type}`
    return this.scene.textures.exists(key) ? key : null
  }
  
  /**
   * 创建地图块纹理（程序化生成）
   */
  private createTileTexture(type: TileType): string {
    const key = `tile_${type}`
    const size = 40
    
    // 创建 RenderTexture（动态绘制）
    const rt = this.scene.make.renderTexture({
      x: 0,
      y: 0,
      width: size,
      height: size,
      add: false
    })
    
    // 根据类型绘制不同图案
    switch (type) {
      case TileType.BRICK:
        rt.fill(0x8B4513)  // 棕色背景
        // 绘制砖块纹理
        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < 2; j++) {
            rt.fillRect(
              j * 20 + (i % 2) * 10,
              i * 10,
              18,
              8,
              0xA0522D
            )
          }
        }
        break
        
      case TileType.STEEL:
        rt.fill(0xC0C0C0)  // 银色背景
        // 绘制金属光泽
        rt.fillRect(5, 5, 30, 30, 0xD3D3D3)
        rt.drawLine(5, 5, 35, 35, 0xFFFFFF, 2)
        break
        
      case TileType.WATER:
        rt.fill(0x4169E1)  // 蓝色背景
        // 绘制波浪
        for (let i = 0; i < 3; i++) {
          rt.fillRect(5, 10 + i * 10, 30, 3, 0x87CEEB)
        }
        break
        
      case TileType.FOREST:
        rt.fill(0x228B22)  // 绿色背景
        // 绘制树木
        for (let i = 0; i < 9; i++) {
          const x = (i % 3) * 12 + 4
          const y = Math.floor(i / 3) * 12 + 4
          rt.fillCircle(x, y, 5, 0x32CD32)
        }
        break
        
      case TileType.BASE:
        rt.fill(0xFFD700)  // 金色背景
        // 绘制基地标志
        rt.fillCircle(20, 20, 15, 0xFFFF00)
        rt.fillText('🏠', 10, 10, { fontSize: '20px' })
        break
    }
    
    rt.saveTexture(key)
    
    this.stats.cachedTiles++
    return key
  }
  
  // ===========================================================================
  // 📊 性能监控
  // ===========================================================================
  
  /**
   * 获取性能统计
   */
  getStats(): {
    totalTiles: number
    renderedTiles: number
    cachedTiles: number
    mapWidth: number
    mapHeight: number
  } {
    return {
      totalTiles: this.stats.totalTiles,
      renderedTiles: this.stats.renderedTiles,
      cachedTiles: this.stats.cachedTiles,
      mapWidth: this.currentMap?.width ?? 0,
      mapHeight: this.currentMap?.height ?? 0
    }
  }
  
  /**
   * 打印性能报告
   */
  printStats(): void {
    const stats = this.getStats()
    console.log('📊 [MapManager] 性能统计:')
    console.log(`   地图尺寸：${stats.mapWidth} x ${stats.mapHeight}`)
    console.log(`   总地块数：${stats.totalTiles}`)
    console.log(`   渲染地块：${stats.renderedTiles}`)
    console.log(`   缓存纹理：${stats.cachedTiles}`)
  }
}
