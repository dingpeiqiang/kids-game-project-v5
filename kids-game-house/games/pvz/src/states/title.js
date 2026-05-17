export const TitleState = {
  update: function() {
    const text = this.game.add.text(
      this.game.world.width / 2, 
      this.game.world.height / 2, 
      'Tap to Start', 
      { font: '20px sans-serif', fill: '#FFF' }
    )
    text.anchor.setTo(0.5, 0.5)

    this.game.input.onTap.add(() => {
      this.game.state.start('Play')
    })
  }
}