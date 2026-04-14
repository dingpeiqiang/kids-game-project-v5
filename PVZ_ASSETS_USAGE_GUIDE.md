# PVZ 游戏素材生成工具使用说明

## 🚀 快速开始

### 前置要求
1. 确保已安装 Node.js (v16+)
2. 确保 Stable Diffusion WebUI API 正在运行 (默认地址: http://localhost:7860)
3. 确保 `game-ui-tool` 已正确配置

### 生成素材

```bash
# 在项目根目录执行
node optimize-pvz-assets.js
```

## 📝 自定义配置

### 修改生成参数

编辑 `optimize-pvz-assets.js` 文件，可以调整以下参数：

#### 1. 输出目录
```javascript
const OUTPUT_DIR = path.join(__dirname, 'kids-game-house', 'games', 'pvz', 'public', 'themes', 'pvz', 'assets', 'scene');
```

#### 2. 生成参数
```javascript
{
  width: 160,              // 图片宽度
  height: 160,             // 图片高度
  steps: 30,               // 采样步数 (越高越精细，但更慢)
  cfgScale: 7.5,           // CFG 引导强度
  enableHiresFix: true,    // 是否启用高清修复
  hrUpscaler: 'R-ESRGAN 4x+ Anime6B',  // 高清修复算法
  hrScale: 2,              // 放大倍数
  denoisingStrength: 0.45, // 重绘强度
}
```

#### 3. 完整度检测
```javascript
{
  checkCompleteness: true,     // 是否检测完整度
  autoFix: true,               // 是否自动修复
  completenessThreshold: 0.8,  // 完整度阈值
}
```

### 添加新素材

在 `assets` 数组中添加新的素材定义：

```javascript
{ 
  name: 'new_plant.png',                    // 文件名
  prompt: '描述你的素材...',                // 正向提示词
  category: 'plant'                         // 分类 (用于背景移除判断)
}
```

支持的分类：
- `plant` - 植物
- `zombie` - 僵尸
- `projectile` - 子弹/投射物
- `resource` - 资源 (如阳光)
- `prop` - 道具
- `tool` - 工具
- `background` - 背景 (不会移除背景)

## 🎨 风格选择

目前使用的是 `cartoon` (卡通风格)，可以更换为其他风格：

```javascript
// 可用的风格预设
'pixel-art'    // 像素艺术
'cartoon'      // 卡通风格 (当前使用)
'fantasy'      // 奇幻风格
'scifi'        // 科幻风格
'medieval'     // 中世纪
'horror'       // 恐怖风格
'minimalist'   // 简约风格
'chibi'        // Q版风格
'watercolor'   // 水彩风格
'hand-drawn'   // 手绘风格
```

## 🔧 故障排除

### 问题 1: 无法连接到 API

**错误信息**: `❌ 无法连接到 Stable Diffusion API`

**解决方案**:
1. 确认 SD WebUI 已启动
2. 检查 API 地址是否正确 (默认: http://localhost:7860)
3. 确认 API 模式已启用 (--api 参数)

### 问题 2: 生成速度慢

**优化建议**:
1. 降低 `steps` 参数 (从 30 降到 20-25)
2. 禁用高清修复 (`enableHiresFix: false`)
3. 减小图片尺寸 (从 160x160 降到 128x128)

### 问题 3: 素材质量不佳

**改进方法**:
1. 增加 `steps` 参数 (30-40)
2. 调整 `cfgScale` (7-9 之间)
3. 优化提示词，添加更多细节描述
4. 启用高清修复 (`enableHiresFix: true`)

### 问题 4: 背景移除效果不好

**调整参数**:
```javascript
await SDWebUI.removeBackground(imageBase64, {
  bgColor: 'auto',      // 或 'white', 'black'
  tolerance: 40,        // 增加容差 (30-60)
  feather: 3            // 边缘羽化 (2-5)
});
```

## 📊 监控生成进度

脚本会自动显示每个素材的生成状态：

```
⏳ 正在生成高质量素材: peashooter.png (plant)...
   🖼️  已移除背景
✅ 已保存: .../peashooter.png
   📊 完整度分数: 100.0%
   🔧 是否自动修复: 否
```

## 🔄 批量重新生成

如果需要重新生成所有素材：

```bash
# 1. 备份现有素材 (可选)
cp -r kids-game-house/games/pvz/public/themes/pvz/assets/scene backup/

# 2. 运行生成脚本
node optimize-pvz-assets.js

# 3. 验证结果
ls -lh kids-game-house/games/pvz/public/themes/pvz/assets/scene/*.png
```

## 💡 最佳实践

### 1. 提示词编写技巧
- ✅ **具体描述**: "cute green pea shooter with large mouth"
- ❌ **模糊描述**: "a plant"
- ✅ **包含风格**: "cartoon style, clean lines"
- ✅ **指定视角**: "side view, transparent background"

### 2. 负面提示词
始终包含以下负面提示词：
```
blurry, low resolution, ugly, distorted, watermark, text, 
signature, realistic, photorealistic, 3d render, messy lines, 
bad anatomy, cropped, incomplete, partial view
```

### 3. 尺寸选择
- **小图标**: 64x64 或 128x128
- **角色/道具**: 160x160 (当前设置)
- **背景瓦片**: 192x192 或 256x256

### 4. 性能优化
- 首次生成时使用较低参数测试效果
- 确认满意后再用高参数批量生成
- 定期清理生成的临时文件

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `optimize-pvz-assets.js` | 主生成脚本 |
| `PVZ_ASSETS_OPTIMIZATION_REPORT.md` | 优化报告 |
| `sprites.json` | 精灵表配置文件 |
| `*.png` | 生成的游戏素材 |

## 🆘 获取帮助

如遇问题，请检查：
1. [PVZ_ASSETS_OPTIMIZATION_REPORT.md](./PVZ_ASSETS_OPTIMIZATION_REPORT.md) - 详细技术报告
2. [game-ui-tool README](../../game-ui-tool/README.md) - 工具文档
3. SD WebUI 控制台日志 - API 错误信息

---
*最后更新: 2026年4月13日*
