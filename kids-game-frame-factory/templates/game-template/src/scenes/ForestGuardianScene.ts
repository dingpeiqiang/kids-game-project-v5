import TopDownGameScene from './TopDownGameScene'

/**
 * 🌲 森林小卫士 - 游戏主场景
 * 
 * 继承自 TopDownGameScene，针对“森林”主题进行参数定制。
 */
export default class ForestGuardianScene extends TopDownGameScene {
  constructor() {
    super()
  }

  preload(): void {
    // 1. 加载 GTRS 配置的资源
    this.preloadFromGTRS()
    
    // 2. 加载特定的 Tiled 地图
    this.load.tilemapTiledJSON('map_forest', '/themes/top_down/assets/scene/sprites/maps/cities/city.json')
    this.load.image('tileset', '/themes/top_down/assets/scene/sprites/maps/tilesets/tileset.png')
  }

  create(): void {
    // 调用父类逻辑（初始化 GridEngine、输入、英雄等）
    super.create()

    // --- 定制化逻辑 ---
    console.log('🌲 欢迎来到森林小卫士！')
    
    // 可以在这里修改背景色或添加特效
    this.cameras.main.setBackgroundColor('#2d4a22') // 深森林绿
  }

  protected createGameObjects(): void {
    super.createGameObjects()
    // 在这里添加森林特有的装饰物（如树木、花朵）
  }

  protected handleGameOver(): void {
    console.log('💔 小狐狸累倒了...')
    super.handleGameOver()
  }
}
