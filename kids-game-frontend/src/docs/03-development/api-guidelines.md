# 前端 API 设计规范

## 概述

统一前端 API 响应格式处理，确保类型安全、代码简洁、维护性好。

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
  returnPageData?: boolean;  // 强制返回分页格式
}

/**
 * GET 请求
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

```typescript
/**
 * 获取主题列表
 * @returns 分页数据 {list, total}
 */
async getList(params: ThemeListParams = {}): Promise<PageData<CloudThemeInfo>> {
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
const themes = result.list || [];  // 类型安全，一定是 PageData 格式
const themeList = themes.map(...);
```

## 优化成果

### 1. 类型安全

- 所有 API 方法都有明确的返回类型
- TypeScript 会在编译时检查类型错误
- IDE 自动补全和类型提示

### 2. 代码简洁

- 无需在每个调用点写格式检查代码
- 无需判断是数组还是分页对象
- 错误处理在拦截器中统一完成

### 3. 维护性好

- 后端修改响应格式时，只需修改 API 层
- 业务代码不受影响
- 新增 API 自动遵循统一格式

## 最佳实践

### 1. 新增 API 方法

```typescript
// 推荐：明确返回类型
async getList(params: ListParams): Promise<PageData<Item>> {
  return this.get<PageData<Item>>(url, { returnPageData: true });
}

// 推荐：单条数据
async getDetail(id: string): Promise<Item> {
  return this.get<Item>(`/api/item/detail?id=${id}`);
}
```

### 2. 调用 API

```typescript
// 推荐：使用统一的 API Service
const result = await themeApi.getList(params);
const items = result.list;

// 不推荐：直接使用 axios
const response = await axios.get('/api/theme/list');
const items = response.data.data?.list || response.data.data || [];
```

### 3. 错误处理

```typescript
// 推荐：使用 try-catch，错误已在拦截器中处理
try {
  await themeApi.upload(payload);
  await dialog.success('上传成功！');
} catch (error) {
  console.error('上传失败:', error);
}
```

## 已优化文件

| 文件 | 优化内容 |
|------|---------|
| `api.types.ts` | 添加 PageData 类型定义 |
| `base-api.service.ts` | 添加 returnPageData 选项 |
| `theme-api.service.ts` | 明确返回类型 |
| `creator-center/index.vue` | 简化数据提取逻辑 |

---

**版本**: v1.0.0
**最后更新**: 2026-03-20
