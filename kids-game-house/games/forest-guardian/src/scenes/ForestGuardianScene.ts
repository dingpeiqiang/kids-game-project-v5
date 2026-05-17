import TopDownGameScene from './TopDownGameScene'

/**
 * 🌲 森林小卫士 - 游戏主场景
 * 
 * 继承自 TopDownGameScene，针对"森林"主题进行参数定制。
 */
export default class ForestGuardianScene extends TopDownGameScene {
  private isDataReady: boolean = false

  constructor() {
    super({ key: 'ForestGuardianScene' })
  }

  preload(): void {
    // 1. 加载 GTRS 配置的资源
    this.preloadFromGTRS()
    
    // 2. 加载特定的 Tiled 地图（覆盖父类的 map）
    this.load.tilemapTiledJSON('map', '/themes/top_down/assets/scene/sprites/maps/cities/home_page_city.json')
    this.load.image('tileset', '/themes/top_down/assets/scene/sprites/maps/tilesets/tileset.png')
  }

  create(): void {
    // 调用父类逻辑（初始化 GridEngine、输入、英雄等）
    super.create()

    // --- 🌲 森林小卫士定制化逻辑 ---
    console.log('🌲 欢迎来到森林小卫士！')
    
    // 森林主题背景色渐变（通过相机设置）
    this.cameras.main.setBackgroundColor('#1a3d14') // 深森林绿
    
    // 添加入场提示
    this.showWelcomeMessage()
  }

  private showWelcomeMessage(): void {
    // 发送事件给 Vue UI 显示欢迎对话
    const event = new CustomEvent('new-dialog', {
      detail: { 
        characterName: '森林守护者', 
        messages: ['欢迎来到森林！', '使用方向键/WASD移动，', '空格键攻击敌人！'] 
      }
    })
    window.dispatchEvent(event)
  }

  protected createGameObjects(): void {
    super.createGameObjects()
    // 在这里添加森林特有的装饰物
    this.addTestObjects()
  }

  private addTestObjects(): void {
    // 确保英雄位置已设置
    const heroPos = this.gridEngine?.getPosition?.('hero') || { x: 15, y: 15 }
    
    // 1. 在主角周围生成几个史莱姆（位置更分散）
    const slimeCount = 5
    for (let i = 0; i < slimeCount; i++) {
      const angle = (i / slimeCount) * Math.PI * 2
      const radius = 150 + Math.random() * 100
      const x = heroPos.x * 16 + Math.cos(angle) * radius
      const y = heroPos.y * 16 + Math.sin(angle) * radius
      this.createEnemy(x, y, 'slime', 1, 50, 'random')
    }

    // 2. 散落一些金币（围绕英雄）
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const radius = 80 + Math.random() * 60
      const x = heroPos.x * 16 + Math.cos(angle) * radius
      const y = heroPos.y * 16 + Math.sin(angle) * radius
      this.createItem(x, y, 'coin')
    }

    // 3. 放一个血瓶（在英雄附近）
    this.createItem(heroPos.x * 16 + 50, heroPos.y * 16, 'heart')
    
    // 4. 🗡️ 强制生成一把宝剑（确保游戏可玩性）
    this.createItem(heroPos.x * 16 - 50, heroPos.y * 16, 'sword')
    
    // 5. 🌀 创建通往村庄的传送门（紫色方块）
    // 放在主角正下方 64 像素处，确保开局就能看到
    ;(this as any).createTeleporter(heroPos.x * 16, heroPos.y * 16 + 64, 'VillageScene', 10, 10)
    
    console.log('🌲 测试对象已添加：史莱姆 x5, 金币 x8, 血瓶 x1, 宝剑 x1, 传送门 x1')
  }

  protected handleGameOver(): void {
    if (this.isGameOver) return
    this.isGameOver = true
    console.log('💔 森林勇士倒下了...')
    this.game.events.emit('gameover', this.score)
  }
}
