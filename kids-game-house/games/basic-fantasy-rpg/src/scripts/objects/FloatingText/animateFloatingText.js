export default function animateFloatingText(scene = {}, floatingText) {

  floatingText.setVisible(true);

  if (floatingText._animation === 'up') {
    let side = floatingText._side;// which way are we facing;
    let endX;
    let endY;
    // set variables used to tween:
    if (side > 0) {
        endX = floatingText.x + 10;
        endY = floatingText.y + -50;
    } else {
        endX = floatingText.x - 10;
        endY = floatingText.y + -50;
    }
    
    // Phaser 3.60+ 直接使用 add 替代 timeline
    scene.tweens.add({
      targets: floatingText,
      x: endX,
      y: endY,
      alpha: 0,
      ease: 'Quint',
      duration: floatingText._timeToLive,
      onComplete: function() {
        floatingText.destroy();
      }
    });
  }

  if (floatingText._animation === 'fade') {
    floatingText.depth = 1800;
    scene.tweens.add({
      targets: floatingText,
      alpha: 0,
      duration: floatingText._timeToLive,
      onComplete: function() {
        floatingText.destroy();
      }
    });
  }
}
