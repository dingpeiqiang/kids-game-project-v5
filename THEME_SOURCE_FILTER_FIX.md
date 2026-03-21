# 主题来源筛选逻辑修复

## 问题描述

点击"我的"主题来源筛选时，没有根据当前登录账号关联查询，筛选逻辑不清晰。

## 新的筛选逻辑

| 来源筛选 | 查询内容 |
|---------|---------|
| **全部** | 1. 自己创建的主题（`authorId = 当前用户ID`）<br>2. 已购买的主题（`authorId ≠ 当前用户ID && 已购买 && price > 0`）<br>3. 官方主题（`isOfficial = true`，不限价格） |
| **官方** | 官方主题（`isOfficial = true`，不限价格） |
| **购买** | 已购买的主题（`authorId ≠ 当前用户ID && 已购买 && price > 0`） |
| **我的** | 自己创建的主题（`authorId = 当前用户ID`） |

## 修改内容

### 1. Tab 页签名称修改

**文件**: `kids-game-frontend/src/modules/creator-center/index.vue`

```typescript
// 修改前
const tabs = [
  { id: 'my-themes', label: '我的主题', icon: '🎨' },
  { id: 'store', label: '主题商店', icon: '🛍️' },
];

// 修改后
const tabs = [
  { id: 'my-themes', label: '已有主题', icon: '📦' },
  { id: 'store', label: '主题商店', icon: '🛍️' },
];
```

### 2. 后端添加获取已购买主题的接口

#### 2.1 Service 接口

**文件**: `kids-game-backend/kids-game-service/src/main/java/com/kidgame/service/ThemeService.java`

```java
/**
 * 获取用户已购买的主题列表
 * @param buyerId 购买者 ID
 * @return 已购买的主题列表
 */
List<ThemeInfo> getPurchasedThemes(Long buyerId);
```

#### 2.2 Service 实现

**文件**: `kids-game-backend/kids-game-service/src/main/java/com/kidgame/service/impl/ThemeServiceImpl.java`

```java
@Override
public List<ThemeInfo> getPurchasedThemes(Long buyerId) {
    LambdaQueryWrapper<ThemePurchase> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(ThemePurchase::getBuyerId, buyerId)
           .eq(ThemePurchase::getIsRefunded, 0);

    List<ThemePurchase> purchases = themePurchaseMapper.selectList(wrapper);

    if (purchases == null || purchases.isEmpty()) {
        return new ArrayList<>();
    }

    List<Long> themeIds = purchases.stream()
            .map(ThemePurchase::getThemeId)
            .collect(Collectors.toList());

    LambdaQueryWrapper<ThemeInfo> themeWrapper = new LambdaQueryWrapper<>();
    themeWrapper.in(ThemeInfo::getThemeId, themeIds);

    return themeInfoMapper.selectList(themeWrapper);
}
```

#### 2.3 Controller 接口

**文件**: `kids-game-backend/kids-game-web/src/main/java/com/kidgame/web/controller/ThemeController.java`

```java
/**
 * 获取已购买的主题列表
 * @param request HTTP 请求
 * @return 已购买的主题列表（包含游戏关联信息）
 */
@Operation(summary = "获取已购买的主题")
@GetMapping("/purchased-themes")
public Result<List<Map<String, Object>>> getPurchasedThemes(HttpServletRequest request) {

    try {
        String userIdStr = (String) request.getAttribute("userId");
        Long buyerId = Long.valueOf(userIdStr);

        log.info("获取已购买的主题。BuyerId: {}", buyerId);

        List<ThemeInfo> themes = themeService.getPurchasedThemes(buyerId);

        // ⭐ 为每个主题添加游戏信息（与 list 接口保持一致）
        List<Map<String, Object>> listWithGameName = new java.util.ArrayList<>();
        for (ThemeInfo theme : themes) {
            Map<String, Object> themeMap = new HashMap<>();
            // 使用 fastjson 将对象转为 Map
            themeMap = JSON.parseObject(JSON.toJSONString(theme), Map.class);

            // 查询主题关联的游戏信息（通过 ownerType + ownerId）
            if ("GAME".equals(theme.getOwnerType()) && theme.getOwnerId() != null) {
                var game = themeService.getGameById(theme.getOwnerId());
                if (game != null) {
                    themeMap.put("gameId", game.getGameId());
                    themeMap.put("gameCode", game.getGameCode());
                    themeMap.put("gameName", game.getGameName());
                }
            }

            // 如果没有关联游戏，设置默认值
            if (!themeMap.containsKey("gameName")) {
                themeMap.put("gameName", "游戏主题");
            }

            listWithGameName.add(themeMap);
        }

        return Result.success(listWithGameName);
    } catch (Exception e) {
        log.error("获取已购买主题失败", e);
        return Result.error("获取已购买主题失败：" + e.getMessage());
    }
}
```

### 3. 前端 API 调用

**文件**: `kids-game-frontend/src/services/theme-api.service.ts`

```typescript
/**
 * 获取已购买的主题列表
 * GET /api/theme/purchased-themes
 * 后端从认证信息中获取用户ID，不需要传递参数
 */
async getPurchasedThemes(): Promise<CloudThemeInfo[]> {
  return this.get<CloudThemeInfo[]>('/api/theme/purchased-themes');
}
```

### 4. 前端筛选逻辑重构

**文件**: `kids-game-frontend/src/modules/creator-center/index.vue`

#### 4.1 添加数据状态

```typescript
// 数据状态
const officialThemes = ref<Array<any>>([]); // 官方主题（从商店获取）
const myThemes = ref<CloudThemeInfo[]>([]); // 自己创建的主题
const purchasedThemes = ref<CloudThemeInfo[]>([]); // 已购买的主题

// 加载状态
const loadingMyThemes = ref(false);
const loadingPurchasedThemes = ref(false);
const loadingStore = ref(false);
const loadingGames = ref(false);
```

#### 4.2 添加加载已购买主题的方法

```typescript
// 加载已购买的主题
async function loadPurchasedThemes() {
  loadingPurchasedThemes.value = true;
  try {
    // 检查用户是否登录
    const userId = getCurrentUserId();
    if (!userId || userId === 0) {
      console.warn('[CreatorCenter] 用户未登录，无法加载已购买主题');
      purchasedThemes.value = [];
      return;
    }

    // 后端从认证信息中获取用户ID
    const themes = await themeApi.getPurchasedThemes();
    purchasedThemes.value = themes || [];
    console.log('[CreatorCenter] 已购买主题加载成功:', purchasedThemes.value.length, 'userId:', userId);
  } catch (error) {
    console.error('[CreatorCenter] 加载已购买主题失败:', error);
    purchasedThemes.value = [];
  } finally {
    loadingPurchasedThemes.value = false;
  }
}
```

#### 4.3 重写筛选逻辑

```typescript
// 重新加载筛选后的数据
async function reloadCurrentData() {
  console.log('[CreatorCenter] reloadCurrentData 开始，当前筛选条件:', {
    themeSourceFilter: themeSourceFilter.value,
    filterOwnerType: filterOwnerType.value,
    selectedGameId: selectedGameId.value
  });

  const themes: any[] = [];

  // 根据不同的来源筛选加载不同的数据
  switch (themeSourceFilter.value) {
    case 'all':
      // 全部：自己创建的主题 + 已购买的主题 + 官方且免费的主题
      await loadMyThemes();
      await loadPurchasedThemes();

      // 1. 添加自己创建的主题
      myThemes.value.forEach((theme: any) => {
        if (matchesFilter(theme)) {
          const exists = themes.find(t => t.themeId === theme.themeId);
          if (!exists) {
            themes.push({
              ...theme,
              source: 'mine',
              sourceLabel: '我的',
              sourceIcon: '🎨',
            });
          }
        }
      });

      // 2. 添加已购买的主题（authorId ≠ 当前用户ID 且 price > 0）
      const currentUserId = getCurrentUserId();
      purchasedThemes.value.forEach((theme: any) => {
        // 只显示收费且不是自己创建的已购买主题
        if (theme.price > 0 && theme.authorId !== currentUserId && matchesFilter(theme)) {
          const exists = themes.find(t => t.themeId === theme.themeId);
          if (!exists) {
            themes.push({
              ...theme,
              source: 'purchased',
              sourceLabel: '购买',
              sourceIcon: '🛒',
            });
          }
        }
      });

      // 3. 添加官方主题（isOfficial = true，不限价格）
      const officialThemes = await loadOfficialThemes();
      officialThemes.forEach((theme: any) => {
        if (matchesFilter(theme)) {
          const exists = themes.find(t => t.themeId === theme.themeId);
          if (!exists) {
            themes.push({
              ...theme,
              source: 'official',
              sourceLabel: '官方',
              sourceIcon: '🏛️',
            });
          }
        }
      });

      break;

    case 'official':
      // 官方：查询所有官方主题（isOfficial = true，不限价格）
      const onlyOfficial = await loadOfficialThemes();
      onlyOfficial.forEach((theme: any) => {
        if (matchesFilter(theme)) {
          themes.push({
            ...theme,
            source: 'official',
            sourceLabel: '官方',
            sourceIcon: '🏛️',
          });
        }
      });
      break;

    case 'purchased':
      // 购买：查询已购买的收费主题（authorId ≠ 当前用户ID）
      await loadPurchasedThemes();
      const currentUserId = getCurrentUserId();
      purchasedThemes.value.forEach((theme: any) => {
        // 只显示收费且不是自己创建的已购买主题
        if (theme.price > 0 && theme.authorId !== currentUserId && matchesFilter(theme)) {
          themes.push({
            ...theme,
            source: 'purchased',
            sourceLabel: '购买',
            sourceIcon: '🛒',
          });
        }
      });
      break;

    case 'mine':
      // 我的：查询自己创建的主题
      await loadMyThemes();
      myThemes.value.forEach((theme: any) => {
        if (matchesFilter(theme)) {
          themes.push({
            ...theme,
            source: 'mine',
            sourceLabel: '我的',
            sourceIcon: '🎨',
          });
        }
      });
      break;
  }

  allThemes.value = themes;
  console.log('[CreatorCenter] 主题列表更新:', themes.length, '条', {
    filterOwnerType: filterOwnerType.value,
    selectedGameId: selectedGameId.value,
    themeSourceFilter: themeSourceFilter.value
  });
}

// 辅助函数：检查主题是否匹配筛选条件
function matchesFilter(theme: any): boolean {
  // 过滤条件 1: 适用范围匹配（ownerType）
  if (filterOwnerType.value && theme.ownerType !== filterOwnerType.value) {
    return false;
  }

  // 过滤条件 2: 游戏匹配（如果选定了具体游戏）
  if (filterOwnerType.value === 'GAME' && selectedGameId.value && theme.ownerId !== selectedGameId.value) {
    return false;
  }

  return true;
}

// 加载官方主题（isOfficial = true，不限价格）
async function loadOfficialThemes(): Promise<any[]> {
  try {
    const params: any = {
      status: 'on_sale',
      page: 1,
      pageSize: 1000 // 获取所有主题
    };

    if (filterOwnerType.value === 'GAME') {
      params.ownerType = 'GAME';
      if (selectedGameId.value) {
        params.ownerId = selectedGameId.value;
      }
    } else if (filterOwnerType.value === 'APPLICATION') {
      params.ownerType = 'APPLICATION';
    }

    const result = await themeApi.getList(params);
    const themes = result.list || [];

    // 过滤出官方主题（isOfficial = true，不限价格）
    const officialThemes = themes.filter((theme: any) => {
      return theme.isOfficial === true;
    });

    // 映射显示字段
    return officialThemes.map((theme: any) => ({
      ...theme,
      name: theme.themeName || theme.name,
      author: theme.authorName || theme.author,
      ownerType: theme.ownerType || 'GAME',
      ownerId: theme.ownerId ?? theme.gameId,
    }));
  } catch (error) {
    console.error('[CreatorCenter] 加载官方主题失败:', error);
    return [];
  }
}
```

## 技术要点

### 1. 筛选条件组合

每个来源筛选都会同时应用以下过滤条件：
- **适用范围**：`ownerType`（APPLICATION/GAME）
- **游戏筛选**：如果选择了"游戏主题"，会根据 `ownerId` 过滤具体游戏

### 2. 主题来源标识

| 来源 | `source` | `sourceLabel` | `sourceIcon` | 说明 |
|------|----------|---------------|--------------|------|
| 自己创建 | `mine` | 我的 | 🎨 | `authorId = 当前用户ID` |
| 已购买 | `purchased` | 购买 | 🛒 | 已购买且 `price > 0 && authorId ≠ 当前用户ID` |
| 官方 | `official` | 官方 | 🏛️ | `isOfficial = true`（不限价格） |

### 3. 去重逻辑

使用 `themeId` 作为唯一标识，避免重复显示同一个主题。

### 4. 官方主题的判断

```typescript
// 过滤条件（不限价格）
theme.isOfficial === true
```

### 5. 购买主题的判断

```typescript
// 过滤条件（不是自己创建的）
theme.price > 0 && theme.authorId !== currentUserId
```

## 修改文件清单

### 后端
1. ✅ `kids-game-backend/kids-game-service/src/main/java/com/kidgame/service/ThemeService.java` - 添加接口方法
2. ✅ `kids-game-backend/kids-game-service/src/main/java/com/kidgame/service/impl/ThemeServiceImpl.java` - 实现方法
3. ✅ `kids-game-backend/kids-game-web/src/main/java/com/kidgame/web/controller/ThemeController.java` - 添加 API 接口

### 前端
1. ✅ `kids-game-frontend/src/services/theme-api.service.ts` - 添加 API 调用方法
2. ✅ `kids-game-frontend/src/modules/creator-center/index.vue` - 重构筛选逻辑

## 测试验证

### 1. 后端测试

```bash
# 测试获取已购买主题列表
curl -X GET "http://localhost:8080/api/theme/purchased-themes" \
  -H "Authorization: Bearer <token>"
```

### 2. 前端测试

1. **测试"全部"筛选**：
   - 检查是否显示自己创建的主题
   - 检查是否显示已购买的收费主题
   - 检查是否显示官方免费主题

2. **测试"官方"筛选**：
   - 检查是否只显示官方免费主题
   - 检查是否不显示收费主题

3. **测试"购买"筛选**：
   - 检查是否只显示已购买的收费主题
   - 检查是否不显示免费主题

4. **测试"我的"筛选**：
   - 检查是否只显示自己创建的主题
   - 检查是否不显示其他用户创建的主题

5. **测试组合筛选**：
   - 选择"游戏主题" + 具体游戏
   - 检查不同来源筛选是否正确过滤

## 注意事项

1. **用户未登录**：如果用户未登录，"我的"和"购买"筛选将返回空列表
2. **权限控制**：已购买主题的接口需要 JWT 认证
3. **性能优化**：官方免费主题查询使用了 `pageSize: 1000`，生产环境应考虑分页或缓存
4. **数据一致性**：购买记录的 `is_refunded` 字段用于标识是否已退款，退款的主题不应显示在已购买列表中
