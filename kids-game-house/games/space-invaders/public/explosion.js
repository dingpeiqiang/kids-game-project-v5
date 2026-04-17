class Explosion extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "explosion");
    scene.add.existing(this);
    this.setOrigin(0.5);
    this.on('animationcomplete', () => {
      this.destroy();
    });
    this.play("explode");
  }
}
