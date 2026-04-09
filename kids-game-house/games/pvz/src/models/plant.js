import Phaser from 'phaser'
import Pea from './pea.js'

export default class Plant extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, cell) {
    // cell 已经包含 x, y 坐标
    const row = scene.rowForY(cell.y)
    const col = scene.colForX(cell.x)
    
    super(scene, cell.x, cell.y, 'sprites', 'ps-idle01.png')
    
    // 添加到场景和物理组
    scene.add.existing(this)
    scene.physics.add.existing(this)
    scene.plants.add(this)
    
    // 存储游戏数据
    this.gameData = {
      row: row,
      col: col,
      lastShotAt: 0,
      firingRate: 1000 // 1秒射击间隔
    }
    
    // 创建动画
    this.createAnimations()
    
    // 启动空闲动画
    this.play('plant-idle')
    
    // 注册到场景的更新列表
    scene.events.on('update', this.update, this)
  }
  
  createAnimations() {
    // 检查动画是否已存在，避免重复创建
    if (!this.scene.anims.exists('plant-shoot')) {
      this.scene.anims.create({
        key: 'plant-shoot',
        frames: [
          { key: 'sprites', frame: 'ps-shoot1.png' },
          { key: 'sprites', frame: 'ps-shoot2.png' }
        ],
        frameRate: 5,
        repeat: 0
      })
      
      this.scene.anims.create({
        key: 'plant-idle',
        frames: [
          { key: 'sprites', frame: 'ps-idle01.png' }
        ],
        frameRate: 1
      })
      
      // 射击动画完成后返回空闲状态
      this.on('animationcomplete-plant-shoot', () => {
        this.play('plant-idle')
      })
    }
  }
  
  update(time, delta) {
    // 检查是否需要射击
    if (this.zombieAhead() && this.canShoot(time)) {
      this.shoot(time)
    }
  }
  
  zombieAhead() {
    // 检查同一行是否有僵尸在前方
    let hasZombieAhead = false
    this.scene.zombies.children.each((zombie) => {
      if (zombie.active && 
          zombie.gameData && 
          zombie.gameData.row === this.gameData.row && 
          zombie.x > this.x) {
        hasZombieAhead = true
      }
    })
    return hasZombieAhead
  }
  
  canShoot(currentTime) {
    return (currentTime - this.gameData.lastShotAt) > this.gameData.firingRate
  }
  
  shoot(currentTime) {
    this.gameData.lastShotAt = currentTime
    this.play('plant-shoot')
    this.scene.sounds.peaShoot.play()
    
    // 创建豌豆子弹 - 直接通过场景的物理组创建
    const pea = this.scene.projectiles.create(this.x + 10, this.y, 'sprites', 'pea.png')
    
    // 配置子弹
    pea.setScale(2)
    pea.body.setSize(30, 30)
    pea.body.setAllowGravity(false)
    
    // 关键：先设置速度，再设置其他属性
    pea.setVelocityX(150)
    
    console.log('Pea shot with velocity:', pea.body.velocity.x)
  }
}