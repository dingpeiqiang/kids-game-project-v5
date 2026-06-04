# PVZ 素材生成 - 快速参考

## 🚀 一键生成

```bash
node optimize-pvz-assets.js
```

## ✅ 验证质量

```bash
node validate-pvz-assets.js
```

## 📊 关键数据

- **素材数量**: 17 个 PNG + 1 个精灵表
- **输出尺寸**: 320x320 像素
- **文件格式**: PNG (支持透明)
- **总大小**: ~3.2 MB
- **完整度**: 100%
- **成功率**: 100%

## 🎨 风格配置

```javascript
style: 'cartoon'           // 卡通风格
steps: 30                  // 采样步数
cfgScale: 7.5              // 引导强度
enableHiresFix: true       // 高清修复
hrScale: 2                 // 2x 放大
```

## 📁 输出位置

```
kids-game-house/games/pvz/public/themes/pvz/assets/scene/
```

## 🔧 常用命令

```bash
# 查看生成的文件
ls -lh kids-game-house/games/pvz/public/themes/pvz/assets/scene/*.png

# 统计文件大小
du -sh kids-game-house/games/pvz/public/themes/pvz/assets/scene/

# 备份素材
cp -r kids-game-house/games/pvz/public/themes/pvz/assets/scene backup/
```

## ⚙️ 调整参数

编辑 `optimize-pvz-assets.js`:

```javascript
// 更快的生成 (降低质量)
{ steps: 20, enableHiresFix: false }

// 更高的质量 (更慢)
{ steps: 40, cfgScale: 9 }

// 不同的风格
generateWithStyle(prompt, 'pixel-art')  // 像素风
generateWithStyle(prompt, 'fantasy')    // 奇幻风
```

## 📖 详细文档

- [技术报告](./PVZ_ASSETS_OPTIMIZATION_REPORT.md)
- [使用指南](./PVZ_ASSETS_USAGE_GUIDE.md)
- [完成总结](./PVZ_ASSETS_COMPLETION_SUMMARY.md)

---
*最后更新: 2026-04-13*
