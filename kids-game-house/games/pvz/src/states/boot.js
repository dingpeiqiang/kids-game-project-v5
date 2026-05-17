export const BootState = {
  preload: function() {
    this.game.load.atlasJSONHash('sprites', '/assets/sprites.png', '/assets/sprites.json')
    this.game.load.image('grass', '/assets/newgrass7x12_small.png')
    this.game.load.audio('peaShoot', ['/assets/audio/effects/pea_shoot.mp3', '/assets/audio/effects/pea_shoot.ogg'])
    this.game.load.audio('splat', ['/assets/audio/effects/splat.mp3', '/assets/audio/effects/splat.ogg'])
    this.game.load.audio('zombiesAreComing', ['/assets/audio/effects/zombies_are_coming.mp3', '/assets/audio/effects/zombies_are_coming.ogg'])
  },

  init: function() {
    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL
    this.game.scale.minWidth = 490
    this.game.scale.minHeight = 290
    this.game.scale.maxWidth = 980
    this.game.scale.maxHeight = 580
    this.game.scale.pageAlignHorizontally = true
    this.game.scale.pageAlignVertically = true
    this.game.scale.forceOrientation(true, false)
    this.game.scale.setScreenSize(true)

    this.game.input.maxPointers = 1
  },

  create: function() {
    this.game.CELL_WIDTH = 490 / 12
    this.game.CELL_HEIGHT = 290 / 7

    this.game.state.start('Title')
  }
}