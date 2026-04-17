# 配置化通用资源管理器

## 📖 简介

这是一个基于配置驱动的游戏资源管理系统，通过GTRS配置文件自动解析和管理游戏资源。原本针对PVZ（植物大战僵尸）的资源管理器已被重构为通用系统，可支持任意游戏的资源管理需求。

## ✨ 核心特性

- 🎯 **配置驱动**：通过GTRS.json自动加载资源配置
- 🔧 **通用性强**：支持任意游戏，无需修改代码
- 🛡️ **类型安全**：完整的TypeScript类型定义
- 📦 **模块化设计**：清晰的架构，易于维护和扩展
- ⚡ **高性能**：异步加载，懒加载优化
- 🎨 **友好界面**：分组展示，实时进度反馈
- 🔌 **事件驱动**：丰富的事件回调机制

## 📁 项目结构

```
kids-game-frontend/src/modules/admin/
├── types/
│   └── resource-manager-config.ts      # 类型定义（401行）
├── utils/
│   └── generic-resource-manager.ts     # 核心管理类（413行）
├── configs/
│   └── pvz-resource-config.ts          # PVZ配置示例（137行）
├── components/
│   └── GenericResourceManager.vue      # Vue组件（991行）
└── docs/
    └── GENERIC_RESOURCE_MANAGER_GUIDE.md  # 使用文档（441行）
```

## 🚀 快速开始

### 1. 访问资源管理器

```
http://localhost:5173/admin/game-resources?gameId=pvz&themeId=pvz
```

### 2. 为新游戏添加支持

只需确保游戏目录有GTRS.json配置文件：

```
games/your-game/public/themes/default/GTRS.json
```

然后访问：

```
http://localhost:5173/admin/game-resources?gameId=your-game&themeId=default
```

## 💻 代码示例

### 基本用法

```typescript
import { createResourceManager } from '@/modules/admin/utils/generic-resource-manager';

// 创建配置
const config = {
  gameConfig: {
    gameId: 'pvz',
    gameName: '植物大战僵尸',
    themeId: 'pvz',
    themeBasePath: '/themes/pvz',
    groups: []
  }
};

// 创建管理器
const manager = createResourceManager(config);

// 初始化
await manager.initialize();

// 获取资源
const resources = manager.getAllResources();
```

### 事件监听

```typescript
manager.setEvents({
  onGenerationProgress: (current, total, resource) => {
    console.log(`生成进度: ${current}/${total}`);
  },
  onGenerationComplete: (success) => {
    console.log('生成完成');
  }
});
```

## 📊 GTRS配置格式

```json
{
  "specMeta": {
    "specName": "GTRS",
    "specVersion": "1.0.0"
  },
  "themeInfo": {
    "themeCode": "pvz",
    "themeName": "PVZ Default",
    "gameId": "pvz"
  },
  "resources": {
    "images": {
      "scene": {
        "peashooter": {
          "alias": "豌豆射手",
          "src": "/themes/pvz/assets/scene/peashooter.png",
          "type": "png"
        }
      }
    },
    "audio": {
      "bgm": {
        "bgMusic": {
          "alias": "背景音乐",
          "src": "/themes/pvz/assets/audio/bgMusic.mp3",
          "type": "mp3"
        }
      }
    }
  }
}
```

## 🎯 主要API

### 资源查询

```typescript
// 获取所有资源
manager.getAllResources()

// 按类型获取
manager.getResourcesByType(ResourceType.IMAGE)

// 按分类获取
manager.getResourcesByCategory(ResourceCategory.SCENE)

// 按分组获取
manager.getResourcesByGroup('植物角色')

// 获取单个资源
manager.getResource('peashooter')
```

### 资源操作

```typescript
// 重新生成单个资源
await manager.regenerateResource('peashooter')

// 批量生成
await manager.regenerateAllResources()

// 应用资源
await manager.applyResources()

// 刷新预览
manager.refreshPreviews()
```

## 📚 文档

- [完整使用指南](./kids-game-frontend/src/modules/admin/docs/GENERIC_RESOURCE_MANAGER_GUIDE.md)
- [优化报告](./PVZ_RESOURCE_MANAGER_OPTIMIZATION_REPORT.md)
- [GTRS规范](./kids-game-frame-factory/docs/GTRS_SPEC.md)

## 🔄 迁移指南

### 从旧版迁移

**旧版地址**:
```
/games/pvz/public/resource-manager.html
```

**新版地址**:
```
/admin/game-resources?gameId=pvz&themeId=pvz
```

新版完全兼容旧的GTRS配置格式，无需修改配置文件。

## 🎨 资源类型

- `IMAGE` - 图片资源
- `AUDIO` - 音频资源
- `VIDEO` - 视频资源
- `JSON` - JSON配置
- `SCRIPT` - 脚本文件
- `ATLAS` - 雪碧图图集
- `TILEMAP` - 瓦片地图

## 📁 资源分类

- `SCENE` - 场景资源
- `UI` - UI元素
- `ICON` - 图标
- `EFFECT` - 特效
- `BGM` - 背景音乐
- `SOUND_EFFECT` - 音效
- `VOICE` - 语音

## 🛠️ 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI组件**: Element Plus
- **状态管理**: Composition API
- **构建工具**: Vite
- **类型系统**: TypeScript严格模式

## 📈 性能指标

- ✅ 异步加载，不阻塞UI
- ✅ 懒加载，按需加载资源
- ✅ 缓存机制，避免重复请求
- ✅ 虚拟滚动支持（未来扩展）

## 🐛 常见问题

### Q: 资源加载失败？

检查：
1. GTRS.json是否存在且格式正确
2. 资源路径是否正确
3. 浏览器控制台是否有错误

### Q: 如何调试？

打开浏览器开发者工具：
- Console标签：查看日志
- Network标签：检查请求
- Elements标签：检查DOM

### Q: 支持哪些游戏？

任何有GTRS.json配置的游戏都支持，包括：
- PVZ（植物大战僵尸）
- Plane Shooter（飞机大战）
- Space Invaders（太空侵略者）
- 以及未来添加的任何游戏

## 🔮 未来计划

- [ ] 批量导出功能
- [ ] 资源版本管理
- [ ] 协作编辑支持
- [ ] AI生成增强
- [ ] 性能监控面板
- [ ] 国际化支持

## 📝 开发规范

### 添加新游戏支持

1. 创建GTRS.json配置文件
2. 确保资源路径正确
3. 测试资源加载

### 扩展功能

1. 在`ResourceManagerConfig`中添加新配置项
2. 在`GenericResourceManager`中实现功能
3. 更新Vue组件UI
4. 编写测试用例

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 提交Issue

请包含：
- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息

### 提交PR

请确保：
- 代码符合规范
- 添加必要的测试
- 更新相关文档
- 通过CI检查

## 📄 许可证

本项目遵循MIT许可证。

## 📞 联系方式

- 项目维护者: [团队名称]
- Email: [联系邮箱]
- GitHub: [仓库链接]

---

**最后更新**: 2026-04-17  
**版本**: 1.0.0  
**状态**: ✅ 生产就绪
