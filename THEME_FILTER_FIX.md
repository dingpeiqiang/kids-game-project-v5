# 主题创作中心筛选功能修复

## 问题描述

主题创作中心的主题列表展示与筛选条件不匹配，无论选择什么筛选条件，主题列表都是混乱的。

## 根本原因

在 `kids-game-frontend/src/modules/creator-center/index.vue` 的 `reloadCurrentData()` 函数中：

1. **加载官方主题时**：正确地根据 `filterOwnerType`、`selectedGameId` 筛选参数调用后端 API
2. **合并我的主题时**：完全没有根据筛选条件过滤，直接把所有"我的主题"都添加到列表中

这导致：
- 选择"官方"或"购买"时，仍然显示所有"我的主题"
- 选择特定游戏时，仍然显示该用户的所有游戏主题
- 主题列表与筛选条件完全不一致

## 修复方案

### 1. 修复筛选逻辑 (creator-center/index.vue)

在 `reloadCurrentData()` 函数中，添加完整的筛选条件：

```typescript
// 只有当筛选条件包含"我的"时，才添加我的主题
if (themeSourceFilter.value === 'all' || themeSourceFilter.value === 'mine') {
  myThemes.value.forEach((theme: any) => {
    // ⭐ 过滤条件 1: 适用范围匹配（ownerType）
    if (filterOwnerType.value && theme.ownerType !== filterOwnerType.value) {
      return; // 跳过不匹配的主题
    }

    // ⭐ 过滤条件 2: 游戏匹配（如果选定了具体游戏）
    if (filterOwnerType.value === 'GAME' && selectedGameId.value && theme.ownerId !== selectedGameId.value) {
      return; // 跳过不匹配的游戏主题
    }

    // ⭐ 避免重复（根据 themeId 去重）
    const exists = themes.find(t => t.themeId === theme.themeId);
    if (!exists) {
      themes.push({
        ...theme,
        source: 'mine',
        sourceLabel: '我的',
        sourceIcon: '🎨',
      });
    }
  });
}
```

### 2. 清理遗留的 applicableScope 引用 (ThemeCreator.vue)

根据之前的决策（参考工作记忆），`applicableScope` 字段已被废弃，统一使用 `ownerType`。

修复前：
```typescript
const payload = {
  themeName: formData.basic.name,
  authorName: formData.basic.author,
  applicableScope: formData.basic.applicableScope, // ❌ 遗留字段
  // ...
};
```

修复后：
```typescript
const payload = {
  themeName: formData.basic.name,
  authorName: formData.basic.author,
  ownerType: formData.basic.selectedGameCode ? 'GAME' : 'APPLICATION', // ✅ 根据 gameCode 判断
  ownerId: formData.basic.selectedGameId,
  // ...
};
```

## 筛选规则总结

### 适用范围 (ownerType)
- `APPLICATION` - 应用主题：适用于整个应用
- `GAME` - 游戏主题：适用于特定游戏（ownerId = gameId）

### 主题来源 (themeSourceFilter)
- `all` - 全部：官方主题 + 购买的主题 + 我的主题
- `official` - 官方：仅显示官方上架的主题
- `purchased` - 购买：仅显示用户已购买的主题（后端支持）
- `mine` - 我的：仅显示用户创建的主题

### 游戏筛选 (selectedGameId)
- 仅在 `ownerType === 'GAME'` 时生效
- 根据 `ownerId` 筛选特定游戏的主题
- 不选择具体游戏时，显示所有游戏主题

## 测试建议

1. **适用范围测试**
   - 选择"应用主题"，只显示应用主题
   - 选择"游戏主题"，只显示游戏主题

2. **游戏筛选测试**
   - 选择"游戏主题" + "贪吃蛇大冒险"，只显示贪吃蛇的主题
   - 切换到"飞机大战"，只显示飞机大战的主题

3. **主题来源测试**
   - 选择"官方"，只显示官方主题（不显示我的主题）
   - 选择"我的"，只显示我创建的主题（不显示官方主题）
   - 选择"全部"，显示所有类型的主题

## 相关文件

- `kids-game-frontend/src/modules/creator-center/index.vue` - 主要修复
- `kids-game-frontend/src/modules/admin/components/ThemeCreator.vue` - 清理遗留字段
- `kids-game-frontend/src/types/theme.types.ts` - 类型定义（已正确使用 ownerType）
