# API 响应格式统一处理方案

## 问题背景

项目中存在 API 响应格式不统一的问题：
1. **分页数据结构不一致**：有时返回数组，有时返回 `{list: [], total: 0}`
2. **响应格式检查不一致**：有的用 `response.data.code === 200`，有的用 `response.data.success`
3. **错误处理分散**：每个调用点都要重复写格式检查和错误处理代码

## 解决方案

### 1. 统一分页数据类型

**文件**: `src/services/api.types.ts`

```typescript
/**
 * 分页数据结构
 */
export interface PageData<T> {
  list: T[];
  total: number;
}

/**
 * 判断是否为分页数据结构
 */
export function isPageData<T>(data: any): data is PageData<T> {
  return data && 
    typeof data === 'object' && 
    'list' in data && 
    'total' in data &&
    Array.isArray(data.list);
}
```

### 2. BaseApiService 自动数据规范化

**文件**: `src/services/base-api.service.ts`

```typescript
export interface RequestOptions extends InternalAxiosRequestConfig {
  retry?: number;
  retryDelay?: number;
  skipErrorHandler?: boolean;
  returnPageData?: boolean;  // ✅ 新增：强制返回分页格式
}

/**
 * GET 请求
 * @param returnPageData - 是否强制返回分页格式（自动将数组包装为 {list, total}）
 */
protected async get<T>(
  url: string,
  config?: RequestOptions
): Promise<T> {
  const { returnPageData, ...restConfig } = config || {};
  const response = await this.request<T>({
    method: 'GET',
    url,
    ...restConfig,
  });
  
  const data = response.data;
  
  // 如果需要返回分页格式，且当前不是分页格式
  if (returnPageData && !isPageData(data) && Array.isArray(data)) {
    return {
      list: data,
      total: data.length,
    } as T;
  }
  
  return data;
}
```

### 3. Service 层明确返回类型

**文件**: `src/services/theme-api.service.ts`

```typescript
/**
 * 获取主题列表
 * @returns 分页数据 {list, total}
 */
async getList(params: ThemeListParams = {}): Promise<PageData<CloudThemeInfo>> {
  // ... 构建查询参数
  
  // 使用 returnPageData: true 确保返回分页格式
  return this.get<PageData<CloudThemeInfo>>(url, { returnPageData: true });
}
```

### 4. 调用方简化

**优化前**：
```typescript
const result = await themeApi.getList(params);
const themes = result?.list || result || [];
const themeList = (Array.isArray(themes) ? themes : []).map(...);
```

**优化后**：
```typescript
const result = await themeApi.getList(params);
const themes = result.list || [];  // ✅ 类型安全，一定是 PageData 格式
const themeList = themes.map(...);
```

## 优化成果

### 1. 类型安全
- ✅ 所有 API 方法都有明确的返回类型
- ✅ TypeScript 会在编译时检查类型错误
- ✅ IDE 自动补全和类型提示

### 2. 代码简洁
- ✅ 无需在每个调用点写格式检查代码
- ✅ 无需判断是数组还是分页对象
- ✅ 错误处理在拦截器中统一完成

### 3. 维护性好
- ✅ 后端修改响应格式时，只需修改 API 层
- ✅ 业务代码不受影响
- ✅ 新增 API 自动遵循统一格式

## 已优化文件

| 文件 | 优化内容 |
|------|---------|
| `api.types.ts` | 添加 PageData 类型定义和辅助函数 |
| `base-api.service.ts` | 添加 returnPageData 选项，自动数据规范化 |
| `theme-api.service.ts` | 明确返回类型，使用 returnPageData |
| `creator-center/index.vue` | 简化数据提取逻辑 |
| `ThemeManager.ts` | 使用新的 PageData 格式 |
| `GameThemeLoader.ts` | 使用 PageData.list 字段 |
| `GameManagement.vue` | 使用 themeApi 替代 axios，统一错误处理 |

## 待优化文件

以下文件仍在使用旧的 axios 调用方式，建议统一迁移到新的 API Service：

- `src/modules/admin/components/ThemeStorePage.vue`
- `src/modules/admin/components/ThemeSelector.vue`
- `src/modules/admin/components/ThemeManagement.vue`
- `src/core/theme/ThemeSwitcher.vue`
- `src/components/FileUpload.vue`

## 最佳实践

### 1. 新增 API 方法

```typescript
// ✅ 推荐：明确返回类型
async getList(params: ListParams): Promise<PageData<Item>> {
  return this.get<PageData<Item>>(url, { returnPageData: true });
}

// ✅ 推荐：单条数据
async getDetail(id: string): Promise<Item> {
  return this.get<Item>(`/api/item/detail?id=${id}`);
}
```

### 2. 调用 API

```typescript
// ✅ 推荐：使用统一的 API Service
const result = await themeApi.getList(params);
const items = result.list;  // 类型安全

// ❌ 不推荐：直接使用 axios
const response = await axios.get('/api/theme/list');
const items = response.data.data?.list || response.data.data || [];
```

### 3. 错误处理

```typescript
// ✅ 推荐：使用 try-catch，错误已在拦截器中处理
try {
  await themeApi.upload(payload);
  await dialog.success('上传成功！');
} catch (error) {
  // 错误已在拦截器中显示 Toast
  console.error('上传失败:', error);
}

// ❌ 不推荐：手动检查响应格式
if (response.data.code === 200) {
  // ...
} else {
  await dialog.error(response.data.msg);
}
```

## 总结

通过在 API 层统一处理响应格式，我们实现了：

1. **类型安全**：TypeScript 编译时检查
2. **代码简洁**：无需重复的格式检查代码
3. **维护性强**：后端修改只影响 API 层
4. **一致性高**：所有 API 调用遵循相同模式

这种架构模式符合"关注点分离"原则，让业务代码专注于业务逻辑，而不用关心底层的数据格式转换。
