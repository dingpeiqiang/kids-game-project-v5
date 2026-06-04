# Phaser 版本兼容性说明

## ⚠️ 重要：Phaser 版本锁定

本项目使用 **Phaser 3.52.0**，版本已在 `package.json` 中精确锁定。

```json
{
  "dependencies": {
    "phaser": "3.52.0"
  }
}
```

**注意**：版本号前没有 `^` 或 `~` 符号，这意味着 npm 不会自动升级到更高版本。

## 为什么锁定版本？

### API 兼容性问题

Phaser 3.60+ 版本移除了以下 API：

1. **ParticleEmitterManager**
   ```typescript
   // ❌ Phaser 3.60+ 已移除
   const emitterManager = scene.add.particles('key')
   emitterManager.createEmitter({ ... })
   
   // ✅ Phaser 3.52.0 可用
   const emitterManager = scene.add.particles('key')
   emitterManager.createEmitter({ ... })
   ```

2. **createEmitter 方法**
   - 在 3.60+ 中被新的粒子系统 API 替代
   - 需要完全重写粒子相关代码

### 受影响的文件

- `src/scripts/objects/brick.ts` - 使用 `ParticleEmitterManager` 实现砖块破碎效果

## 如果需要升级 Phaser

如果你希望升级到 Phaser 3.60+，需要完成以下工作：

### 1. 更新 package.json
```json
{
  "dependencies": {
    "phaser": "^3.90.0"
  }
}
```

### 2. 重写粒子系统代码

**旧代码 (brick.ts)**:
```typescript
private blockEmitter: Phaser.GameObjects.Particles.ParticleEmitterManager

constructor({ scene, x = 0, y = 0 }: Config) {
  // ...
  this.blockEmitter = scene.add.particles('atlas')
  this.blockEmitter.createEmitter({
    frame: { frames: ['brick'], cycle: true },
    gravityY: 1000,
    lifespan: 2000,
    speed: 400,
    angle: { min: -115, max: -70 },
    frequency: -1,
  })
}

public break(tile: Phaser.Tilemaps.Tile) {
  this.blockEmitter.emitParticle(6, tile.x * 16, tile.y * 16)
}
```

**新代码 (需要重写)**:
```typescript
private blockEmitter: Phaser.GameObjects.Particles.ParticleEmitter

constructor({ scene, x = 0, y = 0 }: Config) {
  // ...
  // 创建粒子发射器（新 API）
  this.blockEmitter = scene.add.particles('atlas').createEmitter({
    frame: { frames: ['brick'], cycle: true },
    gravityY: 1000,
    lifespan: 2000,
    speed: 400,
    angle: { min: -115, max: -70 },
    frequency: -1,
  })
}

public break(tile: Phaser.Tilemaps.Tile) {
  this.blockEmitter.explode(6, tile.x * 16, tile.y * 16)
}
```

### 3. 测试所有场景

确保所有使用粒子的场景都能正常工作：
- 砖块破碎效果
- 其他可能的粒子效果

## 当前状态

✅ **Phaser 3.52.0 已正确安装**
✅ **所有功能正常运行**
✅ **开发服务器正常启动**

## 验证版本

```bash
# 检查已安装的 Phaser 版本
npm list phaser

# 应该输出：
# phaser-project-template@3.24.1
# └── phaser@3.52.0
```

## 常见问题

### Q: 我可以升级到最新的 Phaser 吗？

A: 可以，但需要重写粒子系统代码。如果只是运行现有游戏，建议保持 3.52.0。

### Q: 为什么 Vite 会安装错误的版本？

A: 如果 package.json 中使用 `"phaser": "^3.52.0"`（带 `^`），npm 会安装最新的兼容版本（3.90.0）。我们已改为精确版本 `"phaser": "3.52.0"`。

### Q: 如何确保版本不会被意外升级？

A: 
1. 使用精确版本号（无 `^` 或 `~`）
2. 提交 package-lock.json 到版本控制
3. 团队成员使用相同的 package-lock.json

## 参考资料

- [Phaser 3.60 迁移指南](https://phaser.io/phaser3/devlog/180)
- [Phaser 粒子系统文档](https://photonstorm.github.io/phaser3-docs/Phaser.GameObjects.Particles.html)
- [Phaser 3.52.0 文档](https://photonstorm.github.io/phaser3-docs/Phaser.v3.52.0.html)

---

**最后更新**: 2026-04-05  
**当前版本**: Phaser 3.52.0  
**状态**: ✅ 稳定运行
