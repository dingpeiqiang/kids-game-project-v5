# 配置化通用资源管理器使用指南

## 📋 概述

通用资源管理器是一个基于配置驱动的资源管理系统，支持不同游戏的资源管理需求。通过GTRS配置文件自动解析游戏资源，实现统一的资源查看、生成、编辑和应用功能。

## ✨ 核心特性

- ✅ **配置驱动**：通过GTRS.json配置文件自动加载资源
- ✅ **通用性强**：支持任意游戏的资源管理
- ✅ **类型安全**：完整的TypeScript类型定义
- ✅ **事件驱动**：丰富的事件回调机制
- ✅ **分组展示**：按资源类型和分类组织展示
- ✅ **AI集成**：支持AI生成资源（需配置SD WebUI）
- ✅ **音频编辑**：内置音频编辑功能
- ✅ **进度追踪**：实时显示资源生成进度

## 🏗️ 架构设计

```
┌─────────────────────────────────────────┐
│   GenericResourceManager (核心类)       │
├─────────────────────────────────────────┤
│  - 配置加载                              │
│  - 资源管理                              │
│  - 生成控制                              │
│  - 事件系统                              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   GTRS Parser (配置解析器)              │
├─────────────────────────────────────────┤
│  - 解析GTRS.json                        │
│  - 转换为ResourceConfig                 │
│  - 构建资源分组                          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Vue Component (UI组件)                │
├─────────────────────────────────────────┤
│  - 资源展示                              │
│  - 交互操作                              │
│  - 进度显示                              │
└─────────────────────────────────────────┘
```

## 📦 文件结构

```
kids-game-frontend/src/modules/admin/
├── types/
│   └── resource-manager-config.ts      # 类型定义
├── utils/
│   └── generic-resource-manager.ts     # 核心管理类
├── configs/
│   └── pvz-resource-config.ts          # PVZ配置示例
└── components/
    └── GenericResourceManager.vue      # Vue组件
```

## 🚀 快速开始

### 1. 基本用法

```typescript
import { createResourceManager } from '@/modules/admin/utils/generic-resource-manager';
import type { ResourceManagerConfig } from '@/modules/admin/types/resource-manager-config';

// 创建资源配置
const config: ResourceManagerConfig = {
  gameConfig: {
    gameId: 'pvz',
    gameName: '植物大战僵尸',
    themeId: 'pvz',
    themeName: 'PVZ 默认主题',
    themeBasePath: '/themes/pvz',
    groups: []
  },
  enableAIGeneration: true,
  enableAudioEditing: true
};

// 创建资源管理器实例
const manager = createResourceManager(config);

// 设置事件监听
manager.setEvents({
  onConfigLoaded: (config) => {
    console.log('配置加载成功', config);
  },
  onResourcesUpdated: (resources) => {
    console.log('资源列表更新', resources);
  },
  onGenerationProgress: (current, total, resource) => {
    console.log(`生成进度: ${current}/${total}`, resource);
  },
  onGenerationComplete: (success, resources) => {
    console.log('生成完成', success);
  },
  onError: (error) => {
    console.error('错误', error);
  }
});

// 初始化
await manager.initialize();

// 获取所有资源
const allResources = manager.getAllResources();

// 获取分组
const groups = manager.getGroups();
```

### 2. 在Vue组件中使用

```vue
<template>
  <GenericResourceManager />
</template>

<script setup lang="ts">
import GenericResourceManager from '@/modules/admin/components/GenericResourceManager.vue';
</script>
```

### 3. 路由配置

```typescript
// router/index.ts
{
  path: '/admin/game-resources',
  name: 'GameResourceManager',
  component: () => import('@/modules/admin/components/GenericResourceManager.vue'),
  meta: {
    title: '游戏资源管理',
    requiresAuth: true
  }
}
```

## 🔧 配置详解

### ResourceManagerConfig

```typescript
interface ResourceManagerConfig {
  // 游戏配置（必需）
  gameConfig: GameResourceConfig;
  
  // 功能开关
  enableAIGeneration?: boolean;        // 启用AI生成
  enableAudioEditing?: boolean;        // 启用音频编辑
  enableSpriteSheetMaker?: boolean;    // 启用雪碧图制作
  
  // API地址
  sdApiUrl?: string;                   // SD WebUI API
  musicGenApiUrl?: string;             // MusicGen API
  
  // 自定义操作
  customActions?: Array<{
    id: string;
    label: string;
    icon: string;
    handler: (resource: ResourceConfig) => void;
  }>;
}
```

### GameResourceConfig

```typescript
interface GameResourceConfig {
  gameId: string;              // 游戏ID
  gameName: string;            // 游戏名称
  themeId: string;             // 主题ID
  themeName?: string;          // 主题名称
  themeBasePath: string;       // 主题基础路径
  gtrsConfigPath?: string;     // GTRS配置路径
  
  // 可选配置
  sizeSpecs?: Record<string, SizeSpec>;  // 尺寸规格
  prompts?: Record<string, string>;      // AI提示词
  generationConfig?: GenerationConfig;   // 生成配置
  groups?: ResourceGroupConfig[];        // 资源分组
}
```

## 📊 GTRS配置格式

通用资源管理器从GTRS.json自动解析资源配置。标准的GTRS格式如下：

```json
{
  "specMeta": {
    "specName": "GTRS",
    "specVersion": "1.0.0"
  },
  "themeInfo": {
    "themeCode": "pvz",
    "themeName": "PVZ Default Theme",
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
      },
      "ui": { ... },
      "effect": { ... }
    },
    "audio": {
      "bgm": {
        "bgMusic": {
          "alias": "背景音乐",
          "src": "/themes/pvz/assets/audio/bgMusic.mp3",
          "type": "mp3"
        }
      },
      "effect": { ... }
    }
  }
}
```

## 🎯 常用API

### 资源查询

```typescript
// 获取所有资源
const allResources = manager.getAllResources();

// 按类型获取
const images = manager.getResourcesByType(ResourceType.IMAGE);
const audios = manager.getResourcesByType(ResourceType.AUDIO);

// 按分类获取
const sceneImages = manager.getResourcesByCategory(ResourceCategory.SCENE);

// 按分组获取
const plantResources = manager.getResourcesByGroup('植物角色');

// 获取单个资源
const peashooter = manager.getResource('peashooter');
```

### 资源操作

```typescript
// 重新生成单个资源
await manager.regenerateResource('peashooter');

// 重新生成所有资源
await manager.regenerateAllResources();

// 应用资源（替换原游戏素材）
await manager.applyResources();

// 刷新预览
manager.refreshPreviews();
```

### 状态管理

```typescript
// 获取资源总数
const count = manager.getTotalResourceCount();

// 获取所有分组
const groups = manager.getGroups();

// 获取配置
const config = manager.getConfig();
```

## 🎨 资源类型

```typescript
enum ResourceType {
  IMAGE = 'image',       // 图片
  AUDIO = 'audio',       // 音频
  VIDEO = 'video',       // 视频
  JSON = 'json',         // JSON配置
  SCRIPT = 'script',     // 脚本
  ATLAS = 'atlas',       // 图集
  TILEMAP = 'tilemap'    // 瓦片地图
}
```

## 📁 资源分类

```typescript
enum ResourceCategory {
  // 图片分类
  SCENE = 'scene',           // 场景
  UI = 'ui',                 // UI元素
  ICON = 'icon',             // 图标
  EFFECT = 'effect',         // 特效
  
  // 音频分类
  BGM = 'bgm',               // 背景音乐
  SOUND_EFFECT = 'effect',   // 音效
  VOICE = 'voice',           // 语音
  
  // 其他
  SCRIPT = 'script',         // 脚本
  DATA = 'data'              // 数据
}
```

## 🔄 资源状态

```typescript
enum ResourceStatus {
  UNCHANGED = 'unchanged',   // 未变化
  NEW = 'new',               // 新生成
  MODIFIED = 'modified',     // 已修改
  ERROR = 'error'            // 错误
}
```

## 💡 最佳实践

### 1. 为新游戏添加资源管理

**步骤1**: 确保游戏有GTRS.json配置文件

```json
// games/your-game/public/themes/default/GTRS.json
{
  "specMeta": { ... },
  "themeInfo": { ... },
  "resources": { ... }
}
```

**步骤2**: 在路由中添加参数

```
/admin/game-resources?gameId=your-game&themeId=default
```

**步骤3**: 通用资源管理器会自动加载配置

### 2. 自定义资源分组

如果需要自定义资源分组，可以在配置中指定：

```typescript
const config: ResourceManagerConfig = {
  gameConfig: {
    // ...
    groups: [
      {
        name: '主要角色',
        icon: '🎮',
        resources: [
          { key: 'player', alias: '玩家', ... },
          { key: 'enemy', alias: '敌人', ... }
        ]
      }
    ]
  }
};
```

### 3. 添加自定义操作

```typescript
const config: ResourceManagerConfig = {
  // ...
  customActions: [
    {
      id: 'export',
      label: '导出资源',
      icon: '📤',
      handler: (resource) => {
        console.log('导出', resource);
        // 实现导出逻辑
      }
    }
  ]
};
```

## 🐛 常见问题

### Q1: 资源加载失败？

**检查项**:
1. GTRS.json文件是否存在且格式正确
2. themeBasePath路径是否正确
3. 浏览器控制台是否有错误信息

### Q2: 图片无法预览？

**检查项**:
1. 图片路径是否正确
2. 服务器是否配置了静态资源访问
3. 检查网络请求是否404

### Q3: AI生成不工作？

**检查项**:
1. SD WebUI是否启动并启用API
2. sdApiUrl配置是否正确
3. 资源是否有prompt配置

## 📝 迁移指南

### 从旧版GameResourceManager迁移

**旧版**:
```vue
<GameResourceManager />
```

**新版**:
```vue
<GenericResourceManager />
```

新版组件会自动从URL参数读取gameId和themeId，无需额外配置。

## 🔗 相关文档

- [GTRS规范文档](../../kids-game-frame-factory/docs/GTRS_SPEC.md)
- [资源生成指南](../../../QUICK_START_RESOURCE_MANAGER.md)
- [API参考](./RESOURCE_MANAGER_API.md)

## 📞 技术支持

如有问题，请联系开发团队或查看项目Wiki。
