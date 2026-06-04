# PVZ 游戏资源管理系统 - 使用指南

## 📋 系统概述

本系统提供了一个完整的游戏资源查看、生成和管理界面，允许管理员：
- 📸 查看游戏的所有资源图片
- 🔄 重新生成单个或全部资源
- 👁️ 预览新旧版本对比
- ✅ 采纳并应用新生成的资源

## 🚀 快速开始

### 1. 访问资源管理页面

登录后台管理系统后，在左侧菜单点击 **"🖼️ 游戏资源管理"**，或直接访问：
```
http://localhost:5173/admin/game-resources
```

### 2. 选择游戏和主题

1. 在"选择游戏"下拉框中选择目标游戏（如：植物大战僵尸）
2. 在"选择主题"下拉框中选择对应主题

### 3. 查看资源

系统会自动加载该主题下的所有资源文件，以卡片形式展示：
- 资源预览图
- 文件名
- 文件大小
- 尺寸信息
- 状态标识（新生成/已修改/未变化）

## 🎯 核心功能

### 📦 批量重新生成资源

点击 **"🔄 重新生成资源"** 按钮：
1. 系统会调用 `optimize-pvz-assets.js` 脚本
2. 显示实时生成进度
3. 生成完成后自动刷新预览

**生成过程：**
- 连接 Stable Diffusion API
- 逐个生成 17 个素材
- 自动检测完整度
- 智能移除背景
- 保存到指定目录

### 🔄 单独重新生成资源

在资源卡片上点击 **"🔄 重生成"** 按钮：
- 仅重新生成该资源
- 快速预览效果
- 适合微调单个素材

### 👁️ 预览资源详情

点击任意资源卡片：
- 查看大图预览
- 查看详细元数据（尺寸、格式、大小等）
- 对比原版本（如果有）
- 决定是否采纳

### ✅ 采纳资源

在资源详情弹窗中点击 **"✅ 采纳此版本"**：
- 标记该资源为"新生成"状态
- 准备应用到游戏中

### 🎨 应用资源

点击 **"✅ 应用资源"** 按钮：
- 将所有标记为"新生成"的资源替换到游戏目录
- 备份原有资源（可选）
- 更新 sprites.json 配置文件

### 🔃 刷新预览

点击 **"🔃 刷新预览"** 按钮：
- 清除浏览器缓存
- 重新加载所有资源图片
- 确保看到最新版本

## 🛠️ 技术实现

### 前端组件

**文件位置：** `kids-game-frontend/src/modules/admin/components/GameResourceManager.vue`

**主要功能：**
- Vue 3 Composition API
- 响应式资源列表
- 实时进度显示
- 图片懒加载
- 错误处理

### 后端 API

**文件位置：** `kids-game-backend/kids-game-web/src/main/java/com/sitech/kidsgame/web/controller/admin/GameResourceController.java`

**API 端点：**

```
GET  /api/admin/resources/{gameId}/{themeId}
     获取资源列表

POST /api/admin/resources/{gameId}/{themeId}/regenerate
     重新生成资源

POST /api/admin/resources/{gameId}/{themeId}/apply
     应用新资源

GET  /api/admin/resources/{gameId}/{themeId}/progress
     获取生成进度
```

### 资源生成脚本

**文件位置：** `optimize-pvz-assets.js`

**使用方法：**
```bash
# 基本用法（默认 pvz 游戏和主题）
node optimize-pvz-assets.js

# 指定游戏和主题
node optimize-pvz-assets.js pvz pvz
node optimize-pvz-assets.js snake default
```

**支持参数：**
- `gameId`: 游戏ID（默认: pvz）
- `themeId`: 主题ID（默认: pvz）

## 📊 资源状态说明

| 状态 | 标识 | 说明 |
|------|------|------|
| ✨ 新生成 | new | 刚刚生成的资源，尚未应用 |
| ✏️ 已修改 | modified | 基于原资源修改后的版本 |
| ✓ 未变化 | unchanged | 与原资源相同，未做修改 |

## 💡 最佳实践

### 1. 生成前准备

- 确保 Stable Diffusion API 正在运行
- 检查网络连接
- 预留足够的磁盘空间

### 2. 渐进式生成

建议按以下顺序操作：
1. 先生成 1-2 个资源测试效果
2. 确认质量满意后批量生成
3. 仔细预览每个资源
4. 最后统一应用

### 3. 质量控制

- 使用资源详情弹窗仔细检查
- 对比原版本确保改进
- 注意透明度和边缘质量
- 检查尺寸是否符合要求

### 4. 备份策略

应用资源前：
```bash
# 手动备份（推荐）
cp -r kids-game-house/games/pvz/public/themes/pvz/assets/scene \
      kids-game-house/games/pvz/public/themes/pvz/assets/scene.backup.$(date +%Y%m%d)
```

## 🔧 故障排除

### 问题 1: 无法加载资源列表

**可能原因：**
- 游戏或主题路径不存在
- 权限不足
- 后端服务未启动

**解决方案：**
1. 检查目录是否存在
2. 确认后端服务运行正常
3. 查看浏览器控制台错误信息

### 问题 2: 资源生成失败

**可能原因：**
- SD WebUI API 未启动
- API 地址配置错误
- 网络连接问题

**解决方案：**
1. 启动 SD WebUI: `webui-user.bat --api`
2. 检查 `optimize-pvz-assets.js` 中的 API_URL
3. 测试 API 连接: `curl http://localhost:7860/sdapi/v1/samplers`

### 问题 3: 图片预览不显示

**可能原因：**
- 图片路径错误
- 文件格式不支持
- 浏览器缓存

**解决方案：**
1. 点击"刷新预览"按钮
2. 清除浏览器缓存
3. 检查图片文件是否损坏

### 问题 4: 应用资源后游戏无变化

**可能原因：**
- 缓存未清除
- 配置文件未更新
- 游戏未重启

**解决方案：**
1. 硬刷新游戏页面 (Ctrl+F5)
2. 检查 sprites.json 是否正确
3. 重启游戏开发服务器

## 📝 扩展开发

### 添加新游戏支持

1. 在 `kids-game-house/games/` 下创建新游戏目录
2. 按照 GTRS 规范组织资源结构
3. 在前端选择器中会自动识别

### 自定义生成参数

编辑 `optimize-pvz-assets.js`：

```javascript
// 调整生成质量
{
  steps: 40,              // 增加步数提高质量
  cfgScale: 9,            // 增强提示词遵循
  enableHiresFix: true,   // 启用高清修复
}

// 更换风格
generateWithStyle(prompt, 'pixel-art')  // 像素风
generateWithStyle(prompt, 'fantasy')    // 奇幻风
```

### 添加新的 API 端点

在 `GameResourceController.java` 中添加：

```java
@PostMapping("/{gameId}/{themeId}/backup")
@ApiOperation("备份当前资源")
public Result<Void> backupResources(...) {
    // 实现备份逻辑
}
```

## 🎓 学习资源

- [PVZ 资源优化报告](./PVZ_ASSETS_OPTIMIZATION_REPORT.md)
- [PVZ 资源使用指南](./PVZ_ASSETS_USAGE_GUIDE.md)
- [game-ui-tool 文档](./game-ui-tool/README.md)
- [GTRS 规范文档](./kids-game-frame-factory/docs/GTRS_SPEC.md)

## 🆘 获取帮助

遇到问题时：
1. 查看浏览器控制台日志
2. 检查后端服务日志
3. 查看 SD WebUI 控制台输出
4. 参考本文档的故障排除部分

---

**最后更新**: 2026-04-13  
**版本**: 1.0.0  
**维护者**: AI Assistant
