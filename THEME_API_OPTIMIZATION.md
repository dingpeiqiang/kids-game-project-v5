# 主题查询 API 优化方案

## 📋 问题分析

### 当前 API 限制

1. **GET 请求限制**
   - 只能传递简单参数（ownerType, ownerId）
   - 无法传递复杂的筛选条件

2. **不支持分页**
   - 一次性返回所有数据
   - 数据量大时影响性能

3. **过滤条件有限**
   - 没有来源筛选参数（source）
   - 前端需要做额外过滤

## 💡 解决方案对比

### 方案一：纯前端过滤（当前实现）

**实现方式**：
```typescript
// 前端统一调用一次 API，获取所有数据
const availableThemes = await themeApi.getMyAvailableThemes(params);

// 前端根据来源筛选
switch (sourceFilter) {
  case 'official':
    return availableThemes.filter(t => t.isOfficial);
  case 'purchased':
    return availableThemes.filter(t => !t.isOfficial && t.authorId !== userId);
  case 'mine':
    return availableThemes.filter(t => t.authorId === userId);
}
```

**优点**：
- ✅ 无需修改后端
- ✅ 筛选响应快（无网络延迟）
- ✅ 用户体验好

**缺点**：
- ❌ 一次性加载所有数据
- ❌ 数据量大（>1000 条）时性能差
- ❌ 浪费带宽

**适用场景**：主题数量 < 500 条

---

### 方案二：后端增强过滤和分页 ⭐ 推荐

**实现方式**：
```typescript
// 前端传递筛选和分页参数
const result = await themeApi.getMyAvailableThemes({
  ownerType: 'GAME',
  ownerId: 1,
  source: 'official',  // 新增：来源筛选
  page: 1,
  pageSize: 20
});

// 后端返回分页数据
{
  list: [...],
  total: 156,
  pageNum: 1,
  pageSize: 20
}
```

**优点**：
- ✅ 支持分页，性能好
- ✅ 减少数据传输
- ✅ 可扩展性强

**缺点**：
- ⚠️ 需要修改后端
- ⚠️ 切换筛选时有网络延迟

**适用场景**：生产环境，主题数量多

---

### 方案三：混合模式（最佳实践）⭐⭐⭐

**实现方式**：
- 小数据量（< 200 条）：使用前端过滤
- 大数据量（>= 200 条）：使用后端分页

**判断逻辑**：
```typescript
// 首次加载时不传分页参数，获取全部数据
const allThemes = await themeApi.getMyAvailableThemes(params);

if (allThemes.length < 200) {
  // 数据量小，使用前端过滤
  useFrontendFiltering(allThemes);
} else {
  // 数据量大，切换到后端分页模式
  useBackendPagination(params);
}
```

**优点**：
- ✅ 兼顾性能和体验
- ✅ 小数据量快速响应
- ✅ 大数据量高效加载

---

## 🔧 实施步骤（选择方案二）

### 第一步：修改后端 Controller

**文件**: `ThemeController.java`

```java
@GetMapping("/my-available-themes")
public Result<Map<String, Object>> getMyAvailableThemes(
        @RequestParam(required = false) String ownerType,
        @RequestParam(required = false) Long ownerId,
        @RequestParam(defaultValue = "all") String source,  // 新增
        @RequestParam(defaultValue = "1") Integer page,     // 新增
        @RequestParam(defaultValue = "20") Integer pageSize,// 新增
        HttpServletRequest request) {
    
    Long userId = Long.valueOf(request.getAttribute("userId"));
    
    // 调用服务层，获取分页数据
    Map<String, Object> result = themeService.getMyAvailableThemesWithPage(
        userId, ownerType, ownerId, source, page, pageSize
    );
    
    return Result.success(result);
}
```

### 第二步：添加 Service 方法

**文件**: `ThemeServiceImpl.java`

```java
public Map<String, Object> getMyAvailableThemesWithPage(
        Long userId, String ownerType, Long ownerId, 
        String source, Integer page, Integer pageSize) {
    
    // 1. 构建查询条件
    LambdaQueryWrapper<ThemeInfo> wrapper = buildQueryWrapper(
        userId, ownerType, ownerId, source
    );
    
    // 2. 执行分页查询
    Page<ThemeInfo> pageInfo = new Page<>(page, pageSize);
    List<ThemeInfo> themes = themeInfoMapper.selectPage(pageInfo, wrapper);
    
    // 3. 返回分页数据
    Map<String, Object> result = new HashMap<>();
    result.put("list", themes);
    result.put("total", pageInfo.getTotal());
    result.put("pageNum", page);
    result.put("pageSize", pageSize);
    
    return result;
}

private LambdaQueryWrapper<ThemeInfo> buildQueryWrapper(
        Long userId, String ownerType, Long ownerId, String source) {
    
    LambdaQueryWrapper<ThemeInfo> wrapper = new LambdaQueryWrapper<>();
    
    // 基础条件：已上架
    wrapper.eq(ThemeInfo::getStatus, "on_sale");
    
    // 适用范围筛选
    if (ownerType != null) {
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
            // 查询已购买的主题 ID
            List<Long> purchasedIds = getPurchaseThemeIds(userId);
            wrapper.in(ThemeInfo::getThemeId, purchasedIds)
                   .ne(ThemeInfo::getIsOfficial, true)
                   .ne(ThemeInfo::getAuthorId, userId);
            break;
            
        case "mine":
            wrapper.eq(ThemeInfo::getAuthorId, userId);
            break;
            
        default: // "all"
            // 官方主题 + 我的主题 + 已购买主题
            wrapper.and(w -> w
                .eq(ThemeInfo::getIsOfficial, true)
                .or(or -> or.eq(ThemeInfo::getAuthorId, userId))
                .or(or -> or.in(ThemeInfo::getThemeId, getPurchaseThemeIds(userId)))
            );
            break;
    }
    
    return wrapper;
}
```

### 第三步：修改前端 API 调用

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

### 第四步：修改前端组件

**文件**: `index.vue`

```typescript
// 重新加载筛选后的数据
async function reloadCurrentData() {
  try {
    const params = {
      ownerType: filterOwnerType.value,
      ownerId: selectedGameId.value || undefined,
      source: themeSourceFilter.value,  // 传递来源筛选
      page: 1,                           // 重置到第一页
      pageSize: 20
    };
    
    const result = await themeApi.getMyAvailableThemes(params);
    
    // result 是分页数据：{ list, total, pageNum, pageSize }
    allThemes.value = result.list.map(theme => ({
      ...theme,
      source: theme.isOfficial ? 'official' : 
              theme.authorId === currentUserId ? 'mine' : 'purchased',
      sourceLabel: ...,
      sourceIcon: ...
    }));
    
    // 更新分页信息
    pagination.total = result.total;
    pagination.current = result.pageNum;
  } catch (error) {
    console.error('加载主题失败:', error);
  }
}
```

---

## 📊 性能对比

| 方案 | 数据量 100 | 数据量 1000 | 数据量 10000 |
|------|-----------|------------|-------------|
| 纯前端 | 优秀 | 良好 | 差 |
| 后端分页 | 优秀 | 优秀 | 优秀 |
| 混合模式 | 优秀 | 优秀 | 优秀 |

---

## 🎯 推荐实施方案

**阶段一（快速修复）**：
1. 保持现有前端过滤逻辑不变
2. 添加数据量检测，超过 500 条提示优化
3. 优点：改动最小，快速上线

**阶段二（中期优化）**：
1. 后端增加分页和筛选支持
2. 前端改为后端分页模式
3. 优点：性能最优，适合生产

**阶段三（长期规划）**：
1. 实现混合模式
2. 智能选择前端/后端过滤
3. 优点：兼顾体验和性能

---

## ⚠️ 注意事项

1. **向后兼容**
   - 保留旧的 API 调用方式
   - 通过参数区分新旧逻辑

2. **错误处理**
   - 分页参数校验
   - 空结果处理

3. **性能优化**
   - 添加数据库索引
   - 考虑缓存机制

---

**制定时间**: 2026-03-21  
**版本**: v1.0
