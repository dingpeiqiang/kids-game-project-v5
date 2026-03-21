# 主题查询后端过滤实现指南

## ✅ 后端已完成

### 1. Controller 层修改

**文件**: `ThemeController.java`

```java
@GetMapping("/my-available-themes")
public Result<Map<String, Object>> getMyAvailableThemes(
        @RequestParam(required = false) String ownerType,
        @RequestParam(required = false) Long ownerId,
        @RequestParam(defaultValue = "all") String source,  // ⭐ 新增
        @RequestParam(defaultValue = "1") Integer page,     // ⭐ 新增
        @RequestParam(defaultValue = "20") Integer pageSize,// ⭐ 新增
        HttpServletRequest request) {
    
    Long userId = Long.valueOf(request.getAttribute("userId"));
    
    // 调用服务层，获取分页数据
    Map<String, Object> result = themeService.getMyAvailableThemesWithPage(
        userId, ownerType, ownerId, source, page, pageSize
    );
    
    return Result.success(result);
}
```

### 2. Service 接口修改

**文件**: `ThemeService.java`

```java
/**
 * ⭐ 新增：获取用户可用的主题（支持分页和来源筛选）
 */
Map<String, Object> getMyAvailableThemesWithPage(Long userId, String ownerType, Long ownerId, 
                                                  String source, Integer page, Integer pageSize);
```

### 3. Service 实现修改

**文件**: `ThemeServiceImpl.java`

#### 主方法：
```java
@Override
public Map<String, Object> getMyAvailableThemesWithPage(Long userId, String ownerType, Long ownerId, 
                                                         String source, Integer page, Integer pageSize) {
    // 1. 构建查询条件
    LambdaQueryWrapper<ThemeInfo> wrapper = buildQueryWrapper(userId, ownerType, ownerId, source);
    
    // 2. 执行分页查询
    Page<ThemeInfo> pageInfo = new Page<>(page, pageSize);
    themeInfoMapper.selectPage(pageInfo, wrapper);
    List<ThemeInfo> themes = pageInfo.getRecords();
    
    // 3. 为每个主题添加游戏信息
    for (ThemeInfo theme : themes) {
        if ("GAME".equals(theme.getOwnerType()) && theme.getOwnerId() != null) {
            var game = getGameById(theme.getOwnerId());
            if (game != null) {
                // 使用 JSON 扩展字段
                String jsonStr = JSON.toJSONString(theme);
                Map<String, Object> themeMap = JSON.parseObject(jsonStr, Map.class);
                themeMap.put("gameId", game.getGameId());
                themeMap.put("gameCode", game.getGameCode());
                themeMap.put("gameName", game.getGameName());
                themes.set(i, JSON.parseObject(JSON.toJSONString(themeMap), ThemeInfo.class));
            }
        }
    }
    
    // 4. 返回分页数据
    Map<String, Object> result = new HashMap<>();
    result.put("list", themes);
    result.put("total", pageInfo.getTotal());
    result.put("pageNum", page);
    result.put("pageSize", pageSize);
    
    return result;
}
```

#### 辅助方法：
```java
/**
 * 构建查询条件
 */
private LambdaQueryWrapper<ThemeInfo> buildQueryWrapper(Long userId, String ownerType, Long ownerId, String source) {
    LambdaQueryWrapper<ThemeInfo> wrapper = new LambdaQueryWrapper<>();
    
    // 基础条件：已上架
    wrapper.eq(ThemeInfo::getStatus, "on_sale");
    
    // 适用范围筛选
    if (ownerType != null && !ownerType.isEmpty()) {
        wrapper.eq(ThemeInfo::getOwnerType, ownerType);
        if ("GAME".equals(ownerType) && ownerId != null) {
            wrapper.eq(ThemeInfo::getOwnerId, ownerId);
        }
    }
    
    // ⭐ 来源筛选
    switch (source) {
        case "official":
            wrapper.eq(ThemeInfo::getIsOfficial, true);
            break;
            
        case "purchased":
            List<Long> purchasedIds = getPurchaseThemeIds(userId);
            if (purchasedIds.isEmpty()) {
                wrapper.eq(ThemeInfo::getThemeId, -1L); // 空结果
            } else {
                wrapper.in(ThemeInfo::getThemeId, purchasedIds)
                       .ne(ThemeInfo::getIsOfficial, true)
                       .ne(ThemeInfo::getAuthorId, userId);
            }
            break;
            
        case "mine":
            wrapper.eq(ThemeInfo::getAuthorId, userId);
            break;
            
        default: // "all"
            List<Long> allPurchasedIds = getPurchaseThemeIds(userId);
            wrapper.and(w -> w
                .eq(ThemeInfo::getIsOfficial, true)
                .or(or -> or.eq(ThemeInfo::getAuthorId, userId))
            );
            if (!allPurchasedIds.isEmpty()) {
                wrapper.or(or -> or
                    .in(ThemeInfo::getThemeId, allPurchasedIds)
                    .ne(ThemeInfo::getIsOfficial, true)
                    .ne(ThemeInfo::getAuthorId, userId)
                );
            }
            break;
    }
    
    return wrapper;
}

/**
 * 获取用户已购买的主题 ID 列表
 */
private List<Long> getPurchaseThemeIds(Long userId) {
    LambdaQueryWrapper<ThemePurchase> purchaseWrapper = new LambdaQueryWrapper<>();
    purchaseWrapper.eq(ThemePurchase::getBuyerId, userId)
                   .eq(ThemePurchase::getIsRefunded, 0);
    List<ThemePurchase> purchases = themePurchaseMapper.selectList(purchaseWrapper);
    
    if (purchases.isEmpty()) {
        return new ArrayList<>();
    }
    
    return purchases.stream()
            .map(ThemePurchase::getThemeId)
            .collect(Collectors.toList());
}
```

---

## 🔧 前端需要修改

### 第一步：更新 API 服务

**文件**: `theme-api.service.ts`

```typescript
interface ThemeAvailableParams {
  ownerType?: 'GAME' | 'APPLICATION';
  ownerId?: number;
  source?: 'all' | 'official' | 'purchased' | 'mine';
  page?: number;
  pageSize?: number;
}

async getMyAvailableThemes(params: ThemeAvailableParams): Promise<PageData<CloudThemeInfo>> {
  const queryParams = new URLSearchParams();
  
  if (params.ownerType) queryParams.append('ownerType', params.ownerType);
  if (params.ownerId) queryParams.append('ownerId', params.ownerId.toString());
  if (params.source) queryParams.append('source', params.source);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  
  const url = `/api/theme/my-available-themes?${queryParams.toString()}`;
  
  return this.get<PageData<CloudThemeInfo>>(url);
}
```

### 第二步：更新前端组件

**文件**: `creator-center/index.vue`

#### 1. 更新分页状态
```typescript
const pagination = ref({
  current: 1,
  size: 20,
  total: 0,
  totalPages: 0
});
```

#### 2. 修改 reloadCurrentData 函数
```typescript
async function reloadCurrentData() {
  try {
    const params = {
      ownerType: filterOwnerType.value,
      ownerId: selectedGameId.value || undefined,
      source: themeSourceFilter.value,  // ⭐ 传递来源筛选
      page: 1,                           // ⭐ 重置到第一页
      pageSize: 20
    };
    
    const result = await themeApi.getMyAvailableThemes(params);
    
    // ⭐ result 现在是分页数据：{ list, total, pageNum, pageSize }
    allThemes.value = result.list.map((theme: any) => ({
      ...theme,
      source: theme.isOfficial ? 'official' : 
              theme.authorId === currentUserId ? 'mine' : 'purchased',
      sourceLabel: theme.isOfficial ? '官方' : 
                     theme.authorId === currentUserId ? '我的' : '购买',
      sourceIcon: theme.isOfficial ? '🏛️' : 
                    theme.authorId === currentUserId ? '🎨' : '🛒'
    }));
    
    // ⭐ 更新分页信息
    pagination.value.total = result.total;
    pagination.value.current = result.pageNum;
    pagination.value.totalPages = Math.ceil(result.total / result.pageSize);
    
  } catch (error) {
    console.error('[CreatorCenter] 加载主题失败:', error);
    allThemes.value = [];
  }
}
```

#### 3. 添加翻页函数
```typescript
function goToPage(page: number) {
  if (page < 1 || page > pagination.value.totalPages) return;
  pagination.value.current = page;
  
  // 重新加载当前页数据（保持筛选条件）
  reloadCurrentDataWithPage(page);
}

async function reloadCurrentDataWithPage(page: number) {
  try {
    const params = {
      ownerType: filterOwnerType.value,
      ownerId: selectedGameId.value || undefined,
      source: themeSourceFilter.value,
      page: page,
      pageSize: 20
    };
    
    const result = await themeApi.getMyAvailableThemes(params);
    
    allThemes.value = result.list.map((theme: any) => ({
      ...theme,
      source: theme.isOfficial ? 'official' : 
              theme.authorId === currentUserId ? 'mine' : 'purchased',
      sourceLabel: ...,
      sourceIcon: ...
    }));
    
    pagination.value.current = result.pageNum;
    pagination.value.total = result.total;
    pagination.value.totalPages = Math.ceil(result.total / result.pageSize);
    
  } catch (error) {
    console.error('加载主题失败:', error);
  }
}
```

#### 4. 添加分页 UI（在组件底部）
```vue
<!-- 分页 -->
<div v-if="pagination.totalPages > 1" class="pagination">
  <button
    :disabled="pagination.current <= 1"
    @click="goToPage(pagination.current - 1)"
    class="btn-page"
  >
    ⬅️ 上一页
  </button>
  
  <div class="page-numbers">
    <button
      v-for="page in visiblePages"
      :key="page"
      :class="['page-number', { active: page === pagination.current }]"
      @click="goToPage(page)"
    >
      {{ page }}
    </button>
  </div>
  
  <button
    :disabled="pagination.current >= pagination.totalPages"
    @click="goToPage(pagination.current + 1)"
    class="btn-page"
  >
    下一页 ➡️
  </button>
</div>
```

#### 5. 添加页码计算
```typescript
const visiblePages = computed(() => {
  const pages = [];
  const current = pagination.value.current;
  const total = pagination.value.totalPages;
  
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
    pages.push(i);
  }
  
  return pages;
});
```

---

## 📊 API 返回格式

### 旧格式（数组）:
```json
{
  "code": 200,
  "data": [
    { "themeId": 1, "themeName": "...", ... },
    { "themeId": 2, "themeName": "...", ... }
  ]
}
```

### 新格式（分页对象）:
```json
{
  "code": 200,
  "data": {
    "list": [
      { "themeId": 1, "themeName": "...", ... },
      { "themeId": 2, "themeName": "...", ... }
    ],
    "total": 156,
    "pageNum": 1,
    "pageSize": 20
  }
}
```

---

## ✅ 测试步骤

1. **启动后端**
   ```bash
   cd kids-game-backend
   mvn spring-boot:run
   ```

2. **启动前端**
   ```bash
   cd kids-game-frontend
   npm run dev
   ```

3. **测试筛选功能**
   - 访问创建者中心
   - 切换不同的来源筛选（全部/官方/购买/我的）
   - 验证数据是否正确过滤

4. **测试分页功能**
   - 如果主题数量超过 20 个
   - 验证翻页是否正常工作
   - 检查每页数据量

5. **测试组合筛选**
   - 选择"游戏主题" + 指定游戏
   - 切换不同的来源筛选
   - 验证分页是否正常

---

## 🎯 性能优化建议

1. **数据库索引**
   ```sql
   -- 为主题表添加索引
   CREATE INDEX idx_owner_type_status ON theme_info(owner_type, status);
   CREATE INDEX idx_author_id ON theme_info(author_id);
   CREATE INDEX idx_is_official ON theme_info(is_official);
   
   -- 为购买记录表添加索引
   CREATE INDEX idx_buyer_id ON theme_purchase(buyer_id, is_refunded);
   ```

2. **缓存策略**
   - 考虑缓存用户的购买记录（减少重复查询）
   - 缓存热门游戏的主题列表

3. **前端优化**
   - 添加加载骨架屏
   - 实现虚拟滚动（如果单页数据量大）
   - 添加防抖处理（快速切换筛选时）

---

**实施时间**: 2026-03-21  
**版本**: v2.0  
**状态**: 后端已完成，待前端实施
