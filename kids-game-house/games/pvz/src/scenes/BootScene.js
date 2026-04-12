import Phaser from 'phaser'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // ── 加载程序化生成的新素材（独立 PNG） ──
    const G = 'generated'

    // 植物
    this.load.image('peashooter', `/${G}/peashooter.png`)
    this.load.image('sunflower', `/${G}/sunflower.png`)
    this.load.image('wallnut', `/${G}/wallnut.png`)
    this.load.image('iceshooter', `/${G}/iceshooter.png`)
    this.load.image('repeater', `/${G}/repeater.png`)
    this.load.image('cherrybomb', `/${G}/cherrybomb.png`)
    this.load.image('potatomine', `/${G}/potatomine.png`)

    // 子弹
    this.load.image('pea', `/${G}/pea.png`)
    this.load.image('ice_pea', `/${G}/ice_pea.png`)

    // 阳光
    this.load.image('sun', `/${G}/sun.png`)

    // 僵尸（4种）
    this.load.image('zombie_normal', `/${G}/zombie_normal.png`)
    this.load.image('zombie_conehead', `/${G}/zombie_conehead.png`)
    this.load.image('zombie_buckethead', `/${G}/zombie_buckethead.png`)
    this.load.image('zombie_newspaper', `/${G}/zombie_newspaper.png`)

    // 割草机
    this.load.image('lawnmower', `/${G}/lawnmower.png`)

    // 草地背景
    this.load.image('grass', '/newgrass7x12_small.png')

    // 音效
    this.load.audio('peaShoot', ['/audio/effects/pea_shoot.mp3', '/audio/effects/pea_shoot.ogg'])
    this.load.audio('splat', ['/audio/effects/splat.mp3', '/audio/effects/splat.ogg'])
    this.load.audio('zombiesAreComing', ['/audio/effects/zombies_are_coming.mp3', '/audio/effects/zombies_are_coming.ogg'])

    // 加载进度条
    const C = window.GAME_CONFIG
    const barW = 300
    const barH = 20
    const barX = (C.BASE_W - barW) / 2
    const barY = C.BASE_H / 2

    const bgBar = this.add.rectangle(C.BASE_W / 2, barY, barW + 4, barH + 4, 0x333333).setOrigin(0.5)
    const fgBar = this.add.rectangle(barX, barY - barH / 2, 0, barH, 0x4CAF50).setOrigin(0)

    this.load.on('progress', (value) => {
      fgBar.width = barW * value
    })

    this.load.on('complete', () => {
      bgBar.destroy()
      fgBar.destroy()
    })

    // 加载提示文字
    this.add.text(C.BASE_W / 2, barY - 40, '正在加载资源...', {
      fontSize: '20px', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5)
  }

  create() {
    // 布局常量传到 game 对象
    const C = window.GAME_CONFIG
    Object.keys(C).forEach(k => { this.game[k] = C[k] })

    this.scene.start('TitleScene')
  }
}
