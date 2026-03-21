# GTRS 编辑器作者信息修复

## 问题描述

GTRS 编辑器发布主题时，没有正确写入 `author_id` 和 `author_name`。

## 根本原因

### 前端问题（主要问题）

在 `GTRSThemeCreatorV2.vue` 的 `publishTheme()` 函数中：

```javascript
// ❌ 错误代码
const uploadData: any = {
  name: themeData.value.themeInfo.themeName,
  author: themeData.value.themeInfo.author || '创作者',  // ❌ 使用的是用户在编辑器填写的
  // ...
}
```

问题：
- `themeData.value.themeInfo.author` 是用户在编辑器的"基本信息"面板手动填写的作者名称
- 这个值与当前登录用户的真实名称无关，用户可以随意填写
- **前端没有传递当前登录用户的真实作者信息**

### 后端处理（正确部分）

后端代码是正确的：

1. **Controller 层** (`ThemeController.java`):
   ```java
   String userIdStr = (String) request.getAttribute("userId");
   Long authorId = Long.valueOf(userIdStr);
   ThemeInfo theme = themeService.uploadTheme(authorId, themeData);
   ```
   - ✅ 从 JWT token 中获取 `authorId`（当前登录用户的 ID）
   - ✅ 将 `authorId` 传递给 Service 层

2. **Service 层** (`ThemeServiceImpl.java`):
   ```java
   theme.setAuthorId(authorId);  // ✅ 设置作者 ID（从 JWT 获取）
   String authorName = themeData.getAuthorName();
   if (authorName == null || authorName.isEmpty()) {
       authorName = themeData.getAuthor();
   }
   theme.setAuthorName(authorName != null ? authorName : "创作者");  // ⚠️ 依赖前端传递
   ```
   - ✅ `authorId` 正确使用（从 JWT 获取）
   - ⚠️ `authorName` 依赖前端传递（这是问题所在）

## 修复方案

### 前端修复（GTRSThemeCreatorV2.vue）

**步骤 1：导入 userStore**

```javascript
import { useUserStore } from '@/core/store/user.store'

const userStore = useUserStore()
```

**步骤 2：获取当前登录用户的真实名称**

```javascript
// ⭐ 获取当前登录用户的真实信息
// 后端会从 JWT token 中获取 authorId，这里只需要传递正确的 authorName
const currentAuthorName = userStore.parentUsername || '创作者'
```

**步骤 3：使用真实作者名称**

```javascript
// ✅ 修复后的代码
const uploadData: any = {
  name: themeData.value.themeInfo.themeName,
  authorName: currentAuthorName,  // ⭐ 使用当前登录用户的真实名称
  price: publishData?.price ?? 0,
  description: publishData?.description || '',
  thumbnail: '',
  config: themeData.value,
  ownerType: 'GAME',
  gameCode: gameCode,
  ownerId: ownerId,
  status: 'pending'
}
```

## 数据流

### 修复前（错误）
```
用户登录（parentUsername="张三"）
  ↓
打开 GTRS 编辑器
  ↓
用户在"基本信息"面板填写 author="李四"  // ❌ 可以随意填写
  ↓
发布主题
  ↓
前端传递：author: "李四"
  ↓
后端接收：authorName: "李四"
  ↓
数据库：author_id=123（正确）, author_name="李四"（❌ 错误）
```

### 修复后（正确）
```
用户登录（parentUsername="张三"）
  ↓
打开 GTRS 编辑器
  ↓
用户在"基本信息"面板填写 author="李四"  // 这个值被忽略
  ↓
发布主题
  ↓
前端获取：userStore.parentUsername = "张三"
  ↓
前端传递：authorName: "张三"  // ⭐ 使用真实用户名称
  ↓
后端接收：authorName: "张三"
  ↓
数据库：author_id=123（✅ 正确）, author_name="张三"（✅ 正确）
```

## 关键点

### 1. AuthorId vs AuthorName

| 字段 | 获取方式 | 可靠性 |
|------|---------|--------|
| `author_id` | 从 JWT token 中获取（后端） | ✅ 100% 可靠 |
| `author_name` | 从前端传递（后端使用前端值） | ⚠️ 需要前端传递正确值 |

### 2. 为什么不使用 themeData 中的 author？

`themeData.value.themeInfo.author` 是 GTRS 配置的一部分，用户可以随意编辑：
- 可能是用户自己的名字
- 可能是其他人的名字
- 可能是空值或默认值

**不应该**将这个值作为主题的真实作者名称。

### 3. 正确的作者信息来源

- **AuthorId**：从 JWT token 中获取（后端自动处理）
- **AuthorName**：从 `userStore.parentUsername` 获取（前端传递）

## 测试验证

1. **测试步骤**：
   - 使用用户"张三"登录
   - 打开 GTRS 编辑器
   - 在"基本信息"面板填写 author="李四"（故意使用错误值）
   - 发布主题
   - 检查数据库：`author_name` 应该是"张三"，而不是"李四"

2. **预期结果**：
   ```
   数据库记录：
   - author_id: 123（用户张三的 ID）
   - author_name: "张三"（用户张三的真实名称）
   - 主题配置中的 author: "李四"（保留用户填写的值）
   ```

## 修改文件

1. ✅ `kids-game-frontend/src/modules/creator-center/GTRSThemeCreatorV2.vue`
   - 添加 `useUserStore` 导入
   - 获取 `currentAuthorName` from `userStore.parentUsername`
   - 使用 `authorName: currentAuthorName` 替代 `author: themeData.value.themeInfo.author`

## 相关后端文件（无需修改）

1. `ThemeController.java` - ✅ 已经正确从 JWT 获取 authorId
2. `ThemeServiceImpl.java` - ✅ 已经正确设置 authorId 和 authorName
3. `ThemeUploadDTO.java` - ✅ 已经支持 authorName 字段
