import Phaser from 'phaser'

/**
 * Tiled 地图加载器
 * 支持 .json 格式的 Tiled 地图数据
 */
export class TiledMapLoader {
  private scene: Phaser.Scene
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }
  
  /**
   * 加载 Tiled 地图
   * @param mapKey 地图资源的 key
   * @param tilesetKey 瓦片集资源的 key
   */
  loadMap(mapKey: string, tilesetKey: string): Phaser.Tilemaps.Tilemap {
    const map = this.scene.make.tilemap({ key: mapKey })
    
    // 加载瓦片集
    const tileset = map.addTilesetImage(tilesetKey)
    
    if (!tileset) {
      console.error('❌ 无法加载瓦片集:', tilesetKey)
      throw new Error('Tileset not found')
    }
    
    return map
  }
  
  /**
   * 创建动态瓦片层
   * @param map 地图对象
   * @param layerName 层名称
   * @param tilesetIndex 瓦片集索引（默认 0）
   */
  createLayer(
    map: Phaser.Tilemaps.Tilemap, 
    layerName: string, 
    tilesetIndex: number = 0
  ): Phaser.Tilemaps.TilemapLayer | null {
    const layer = map.createLayer(layerName, map.tilesets[tilesetIndex], 0, 0)
    
    if (layer) {
      // 自动设置碰撞属性
      layer.setCollisionByProperty({ collides: true })
    }
    
    return layer
  }
  
  /**
   * 从对象层获取所有物体
   * @param map 地图对象
   * @param objectLayer 对象层名称
   */
  getObjectsFromLayer(map: Phaser.Tilemaps.Tilemap, objectLayer: string): any[] {
    const objects = map.getObjectLayer(objectLayer)?.objects || []
    return objects
  }
  
  /**
   * 批量创建墙壁（从对象层）
   * @param group 墙壁组
   * @param texture 纹理 key
   * @param objectLayer 对象层名称
   */
  createWallsFromLayer(
    group: Phaser.Physics.Arcade.StaticGroup,
    texture: string,
    objectLayer: string,
    map: Phaser.Tilemaps.Tilemap
  ): void {
    const objects = this.getObjectsFromLayer(map, objectLayer)
    
    objects.forEach(obj => {
      if (obj.x !== undefined && obj.y !== undefined) {
        // Tiled 坐标是左上角，Phaser Sprite 使用中心点
        const wall = group.create(obj.x + 32, obj.y + 32, texture)
        wall.setImmovable(true)
        
        // 如果有自定义属性
        if (obj.properties) {
          const props: any = {}
          obj.properties.forEach((prop: any) => {
            props[prop.name] = prop.value
          })
          
          if (props.type === 'steel') {
            wall.setTexture('wall_steel')
          }
        }
      }
    })
  }
}
