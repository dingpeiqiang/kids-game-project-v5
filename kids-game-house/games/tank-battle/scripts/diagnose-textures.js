/**
 * 🔍 纹理诊断工具
 * 
 * 使用方法：
 * 1. 在游戏运行时打开浏览器控制台（F12）
 * 2. 复制粘贴此脚本到控制台执行
 * 3. 查看输出结果
 */

(function diagnoseTextures() {
  console.log('🔍 ====== 开始纹理诊断 ======\n');
  
  // 1. 检查 Phaser 游戏实例
  const games = window.Phaser?.Game?.instances || [];
  if (games.length === 0) {
    console.error('❌ 未找到 Phaser 游戏实例');
    return;
  }
  
  const game = games[0];
  const scene = game.scene.scenes[0] || game.scene.getScene('TankGameScene');
  
  if (!scene) {
    console.error('❌ 未找到 TankGameScene 场景');
    return;
  }
  
  console.log('✅ 找到游戏实例和场景\n');
  
  // 2. 检查纹理管理器
  const textureManager = scene.textures;
  console.log('📦 纹理管理器:', textureManager);
  console.log('📋 已加载的纹理名称列表:');
  console.log(Object.keys(textureManager.textureManager).filter(k => k.includes('enemy')));
  console.log('');
  
  // 3. 检查关键的敌人纹理
  const enemyTextures = [
    'enemy_light_up',
    'enemy_light_down',
    'enemy_light_left',
    'enemy_light_right',
    'enemy_medium_up',
    'enemy_medium_down',
    'enemy_medium_left',
    'enemy_medium_right',
    'enemy_heavy_up',
    'enemy_heavy_down',
    'enemy_heavy_left',
    'enemy_heavy_right'
  ];
  
  console.log('🎯 关键敌人纹理检查:\n');
  
  let successCount = 0;
  let failCount = 0;
  
  enemyTextures.forEach(texName => {
    const exists = textureManager.exists(texName);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${texName}: ${exists ? '存在' : '不存在'}`);
    
    if (exists) {
      successCount++;
      
      // 获取纹理详细信息
      const tex = textureManager.get(texName);
      console.log(`   └─ 尺寸：${tex.width}x${tex.height}`);
      console.log(`   └─ 源数量：${tex.source?.length || 0}`);
      
      if (tex.source && tex.source[0]) {
        const src = tex.source[0];
        console.log(`   └─ 源文件：${src.path || src.key}`);
      }
    } else {
      failCount++;
    }
  });
  
  console.log(`\n📊 统计：${successCount}/${enemyTextures.length} 个纹理存在`);
  
  if (failCount > 0) {
    console.log(`\n⚠️  警告：${failCount} 个纹理缺失或加载失败`);
    console.log('\n💡 建议操作:');
    console.log('1. 检查 GTRS.json 配置是否正确');
    console.log('2. 检查图片文件是否存在于 public/themes/tank_default/assets/scene/');
    console.log('3. 按 Ctrl+Shift+R 强制刷新浏览器');
    console.log('4. 清除 Vite 缓存并重启开发服务器');
  } else {
    console.log('\n✅ 所有敌人纹理都已正确加载！');
  }
  
  // 4. 检查实际使用的纹理
  console.log('\n\n🎮 实时纹理使用检测:');
  console.log('监听敌人创建事件...');
  
  scene.events.on('update', () => {
    const enemies = scene.children.list.filter(c => c.texture?.key?.includes('enemy'));
    if (enemies.length > 0) {
      console.log(`📸 当前屏幕上有 ${enemies.length} 个敌人坦克`);
      enemies.forEach((enemy, i) => {
        console.log(`   敌人${i+1}: 纹理=${enemy.texture.key}, 角度=${enemy.angle}°, 速度=(${enemy.body?.velocity.x}, ${enemy.body?.velocity.y})`);
      });
    }
  }, this);
  
  console.log('✅ 监听器已设置，当敌人出现在屏幕上时会显示详细信息\n');
  
  console.log('====== 诊断完成 ======\n');
})();
