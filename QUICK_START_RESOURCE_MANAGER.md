# 游戏资源管理系统 - 快速启动指南

## 🚀 5分钟快速上手

### 前置条件

确保以下服务已安装并可用：
- ✅ Node.js (v16+)
- ✅ Stable Diffusion WebUI (带 API 支持)
- ✅ Java (v11+, 如需后端 API)

### 步骤 1: 启动 SD WebUI

```bash
# 进入 SD WebUI 目录
cd /path/to/stable-diffusion-webui

# 启动时启用 API
./webui-user.bat --api  # Windows
./webui-user.sh --api   # Linux/Mac
```

等待看到类似输出：
```
API enabled
Running on local URL:  http://127.0.0.1:7860
```

### 步骤 2: 测试资源生成脚本

```bash
# 在项目根目录执行
cd kids-game-project-v5

# 测试生成（会重新生成 PVZ 所有资源）
node optimize-pvz-assets.js pvz pvz
```

预期输出：
```
🎨 开始生成优化的 PVZ 卡通风格素材...
✅ 成功连接到 SD WebUI API
⏳ 正在生成高质量素材: peashooter.png (plant)...
   🖼️  已移除背景
✅ 已保存: .../peashooter.png
   📊 完整度分数: 100.0%
...
🎉 素材生成完成！
   ✅ 成功: 17 个
```

### 步骤 3: 启动前端开发服务器

```bash
cd kids-game-frontend
npm install    # 首次需要安装依赖
npm run dev
```

访问: `http://localhost:5173`

### 步骤 4: 启动后端服务（可选，用于完整功能）

```bash
cd kids-game-backend
mvn spring-boot:run
```

后端 API 将运行在: `http://localhost:8080`

### 步骤 5: 访问资源管理页面

1. 打开浏览器访问: `http://localhost:5173/admin/game-resources`
2. 如果需要登录，使用管理员账号登录
3. 在左侧菜单找到 "🖼️ 游戏资源管理"

### 步骤 6: 使用资源管理器

#### 查看资源
1. 选择游戏: "植物大战僵尸"
2. 选择主题: "PVZ 默认主题"
3. 自动显示所有资源卡片

#### 重新生成资源
1. 点击 "🔄 重新生成资源" 按钮
2. 观察进度条和日志
3. 等待生成完成

#### 预览和对比
1. 点击任意资源卡片
2. 查看大图和详细信息
3. 如果有原版本，会显示对比

#### 应用资源
1. 确认新资源质量满意
2. 点击 "✅ 应用资源" 按钮
3. 资源将被替换到游戏目录

## 💻 命令行快速操作

### 仅使用脚本（不启动前端）

```bash
# 生成 PVZ 资源
node optimize-pvz-assets.js pvz pvz

# 生成其他游戏资源（如果支持）
node optimize-pvz-assets.js snake default

# 查看生成的文件
ls -lh kids-game-house/games/pvz/public/themes/pvz/assets/scene/*.png
```

### 验证资源质量

```bash
# 运行验证脚本
node validate-pvz-assets.js
```

预期输出：
```
🔍 开始验证 PVZ 游戏素材...
📁 找到 18 个 PNG 文件
✅ cherrybomb.png       83.26 KB | 320x320 | 透明
✅ grass_tile.png      140.30 KB | 320x320
...
✨ 所有素材验证通过！
```

## 🎯 常见场景

### 场景 1: 我只想要重新生成某个资源

**方法 A: 使用前端界面**
1. 访问资源管理页面
2. 找到目标资源卡片
3. 点击 "🔄 重生成" 按钮

**方法 B: 修改脚本后手动运行**
```bash
# 编辑 optimize-pvz-assets.js
# 注释掉其他资源，只保留需要的
# 然后运行
node optimize-pvz-assets.js pvz pvz
```

### 场景 2: 我想调整生成质量

编辑 `optimize-pvz-assets.js`，修改生成参数：

```javascript
// 更高质量（更慢）
{
  steps: 40,              // 从 30 增加到 40
  cfgScale: 9,            // 从 7.5 增加到 9
  enableHiresFix: true,
}

// 更快速度（较低质量）
{
  steps: 20,              // 从 30 降低到 20
  cfgScale: 6,            // 从 7.5 降低到 6
  enableHiresFix: false,  // 禁用高清修复
}
```

### 场景 3: 我想更换风格

在 `generateWithStyle` 调用中更改风格 ID：

```javascript
// 当前使用卡通风格
'cartoon'

// 可更换为：
'pixel-art'     // 像素艺术
'fantasy'       // 奇幻风格
'scifi'         // 科幻风格
'minimalist'    // 简约风格
'chibi'         // Q版风格
```

### 场景 4: 生成失败了怎么办？

1. **检查 SD WebUI 是否运行**
   ```bash
   curl http://localhost:7860/sdapi/v1/samplers
   ```

2. **查看错误日志**
   - 前端：浏览器控制台 (F12)
   - 后端：终端输出
   - 脚本：终端输出

3. **常见问题**
   - API 连接失败 → 检查 SD WebUI 是否启动
   - 内存不足 → 降低 batch size
   - 超时 → 增加 timeout 设置

## 📝 配置说明

### SD WebUI API 地址

在 `optimize-pvz-assets.js` 中修改：

```javascript
const API_URL = 'http://localhost:7860';  // 默认
// 如果 SD WebUI 在其他机器上：
const API_URL = 'http://192.168.1.100:7860';
```

### 输出目录

默认输出到：
```
kids-game-house/games/{gameId}/public/themes/{themeId}/assets/scene/
```

可以通过修改 `OUTPUT_DIR` 常量自定义。

### 生成参数详解

```javascript
{
  width: 160,                    // 基础宽度（会被 Hires Fix 放大）
  height: 160,                   // 基础高度
  steps: 30,                     // 采样步数（20-40，越高越精细）
  cfgScale: 7.5,                 // CFG 引导强度（5-10，越高越遵循提示词）
  enableHiresFix: true,          // 是否启用高清修复
  hrUpscaler: 'R-ESRGAN 4x+',   // 高清修复算法
  hrScale: 2,                    // 放大倍数（最终尺寸 = 基础尺寸 × hrScale）
  denoisingStrength: 0.45,       // 重绘强度（0.3-0.6，影响细节变化）
  
  // 完整度检测
  checkCompleteness: true,       // 是否检测完整度
  autoFix: true,                 // 是否自动修复
  completenessThreshold: 0.8,    // 完整度阈值（0-1）
}
```

## 🔗 相关文档

- [完整使用指南](./GAME_RESOURCE_MANAGER_GUIDE.md)
- [系统总结](./GAME_RESOURCE_SYSTEM_SUMMARY.md)
- [PVZ 资源优化报告](./PVZ_ASSETS_OPTIMIZATION_REPORT.md)
- [game-ui-tool 文档](./game-ui-tool/README.md)

## ❓ 常见问题

**Q: 为什么生成这么慢？**
A: 每个资源约需 30-60 秒，17 个资源总共需要 10-15 分钟。可以降低 steps 或禁用 Hires Fix 来加速。

**Q: 如何知道生成进度？**
A: 前端界面有实时进度条和日志。命令行模式下会显示每个资源的生成状态。

**Q: 生成的资源在哪里？**
A: `kids-game-house/games/pvz/public/themes/pvz/assets/scene/`

**Q: 可以撤销应用吗？**
A: 当前版本暂不支持自动回滚。建议应用前手动备份。

**Q: 支持哪些游戏？**
A: 理论上支持任何游戏，只要按照 GTRS 规范组织资源目录结构。

## 🎉 开始使用

现在你已经了解了基础知识，可以：
1. 访问资源管理页面探索功能
2. 尝试重新生成一些资源
3. 查看生成的效果
4. 根据需求调整参数

祝你使用愉快！🚀

---
*最后更新: 2026-04-13*
