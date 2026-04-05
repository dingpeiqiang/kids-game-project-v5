export default function mapCreator(scene = {}) {
  const map = scene.make.tilemap({ key: 'map' })
  const floor = map.addTilesetImage('dungeon', 'v4', 16, 16, 1, 2)
  
  // Phaser 3.60+ 使用 createLayer 替代 createStaticLayer
  const colliderLayer = map.createLayer("colliders", floor, 0, 0)
  const floorLayer = map.createLayer("floor", floor, 0, 0)
  const wallLayer = map.createLayer("walls", floor, 0, 0)
  const specials = map.createLayer("specials", floor, 0, 0)
  
  colliderLayer.setCollisionByProperty({ collides: true });
  wallLayer.setCollisionByProperty({ collides: true });
  specials.setCollisionByProperty({ collides: true });
  
  // group to hold all characters
  scene.physics.add.collider(scene.characters, wallLayer, (a, b) => {
  });
  scene.physics.add.collider(scene.characters, specials, (a, b) => {
  });
  scene.physics.add.collider(scene.characters, colliderLayer, (a, b) => {
  
  });

  return map;
}
