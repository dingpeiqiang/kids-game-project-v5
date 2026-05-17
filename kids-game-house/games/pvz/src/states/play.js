import { Zombie } from '../models/zombie.js'
import { Plant } from '../models/plant.js'

export const PlayState = {
  init: function() {
    this.game.input.onTap.add((pointer) => {
      this.handleTap(this.game.input.activePointer)
    })
  },

  create: function() {
    this.game.world.setBounds(0, 0, this.game.world.width, this.game.world.height)

    this.game.add.image(0, 0, 'grass')

    this.game.plants = this.game.add.physicsGroup(Phaser.Physics.ARCADE, this.game.world, 'plants')
    this.game.projectiles = this.game.add.physicsGroup(Phaser.Physics.ARCADE, this.game.world, 'projectiles')
    this.game.zombies = this.game.add.physicsGroup(Phaser.Physics.ARCADE, this.game.world, 'zombies')

    this.game.time.events.repeat(3 * 1000, 9999, () => new Zombie(this), this)

    this.game.audio = {}
    this.game.audio.pea_shoot = this.game.add.audio('peaShoot')
    this.game.audio.splat = this.game.add.audio('splat')
    this.game.audio.zombiesAreComing = this.game.add.audio('zombiesAreComing')

    this.game.audio.zombiesAreComing.play()
  },

  update: function() {
    this.game.physics.arcade.overlap(
      this.game.projectiles, 
      this.game.zombies, 
      this.handleZombieHit, 
      null, 
      this
    )
  },

  handleZombieHit: function(projectile, zombie) {
    this.game.audio.splat.play()
    zombie.damage(1)
    projectile.kill()
  },

  handleTap: function(pointer) {
    const cell = this.getCellOrigin(pointer.x, pointer.y)
    const row = this.rowForY(cell.y)
    const col = this.colForX(cell.x)
    if (!this.plantAt(row, col)) {
      new Plant(this, this.game.input.activePointer.position)
    }
  },

  plantAt: function(row, col) {
    return this.game.plants.children.find(sprite => 
      sprite.plant && sprite.plant.row === row && sprite.plant.col === col
    )
  },

  getCellOrigin: function(x, y) {
    return {
      x: Math.floor(x / this.game.CELL_WIDTH) * this.game.CELL_WIDTH + 10,
      y: Math.floor(y / this.game.CELL_HEIGHT) * this.game.CELL_HEIGHT
    }
  },

  colForX: function(x) {
    return x / this.game.CELL_WIDTH
  },

  rowForY: function(y) {
    return y / this.game.CELL_HEIGHT
  },

  yForRow: function(row) {
    if (row === 0) return 0
    return 35 + (row - 1) * 41
  }
}