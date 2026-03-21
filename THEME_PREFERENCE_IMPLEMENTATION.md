# 主题偏好系统实现指南

## ✅ 已完成部分

### 1. 数据库设计
- **文件**: `kids-game-backend/user-theme-preference.sql`
- **内容**:
  - 创建 `user_theme_preference` 表
  - 唯一索引：`user_id + owner_type + owner_id`
  - 支持每个用户对每个游戏/应用保存一个当前主题

### 2. 后端实现

#### 2.1 实体类
- **文件**: `kids-game-backend/kids-game-dao/src/main/java/com/kidgame/dao/entity/UserThemePreference.java`
- **功能**: 用户主题偏好实体

#### 2.2 Mapper 接口
- **文件**: `kids-game-backend/kids-game-dao/src/main/java/com/kidgame/dao/mapper/UserThemePreferenceMapper.java`
- **方法**:
  - `selectUserCurrentTheme()` - 获取用户当前主题
  - `selectUserCurrentThemeId()` - 获取用户当前主题 ID

#### 2.3 Service 层
- **文件**: `kids-game-backend/kids-game-service/src/main/java/com/kidgame/service/impl/ThemeServiceImpl.java`
- **新增方法**:
  - `getUserCurrentTheme()` - 获取用户当前使用的主题
  - `saveUserPreference()` - 保存用户主题偏好
  - `getDefaultThemeForGame()` - 获取游戏默认主题

#### 2.4 Controller 层
- **文件**: `kids-game-backend/kids-game-web/src/main/java/com/kidgame/web/controller/ThemeController.java`
- **新增 API**:
  - `GET /api/theme/user/current` - 获取用户当前主题
  - `POST /api/theme/user/preference` - 保存用户主题偏好

### 3. 前端工具类

#### 3.1 本地缓存工具
- **文件**: `kids-game-frontend/src/core/utils/theme-preference.util.ts`
- **功能**:
  - `saveLocal()` - 保存到 localStorage
  - `getLocal()` - 从 localStorage 读取
  - `removeLocal()` - 清除本地偏好
  - `isExpired()` - 检查是否过期

#### 3.2 API 服务
- **文件**: `kids-game-frontend/src/services/theme-api.service.ts`
- **新增方法**:
  - `getUserCurrentTheme()` - 调用后端获取用户当前主题
  - `saveUserPreference()` - 调用后端保存偏好

---

## 📝 待完成部分（需手动实现）

### 1. ThemeManager.ts 集成用户偏好逻辑

**文件**: `kids-game-frontend/src/core/theme/ThemeManager.ts`

需要在 ThemeManager 类中添加以下方法:

```typescript
/**
 * ⭐ 加载用户当前主题（优先从后端加载）
 */
async loadUserCurrentTheme(
  userId: number,
  ownerType: string,
  ownerId: number
): Promise<ThemeConfig | null> {
  try {
    // 1. 尝试从后端加载
    const preference = await themeApi.getUserCurrentTheme(ownerType, ownerId);
    
    if (preference && preference.themeId) {
      // 保存到本地缓存
      ThemePreferenceUtil.saveLocal(ownerType, ownerId, preference.themeId);
      
      // 加载完整主题配置
      return await this.loadThemeById(preference.themeId);
    }
  } catch (error) {
    console.warn('[ThemeManager] 从后端加载主题失败，使用本地缓存');
  }
  
  // 2. 降级到本地缓存
  const cachedThemeId = ThemePreferenceUtil.getLocal(ownerType, ownerId);
  if (cachedThemeId) {
    return await this.loadThemeById(cachedThemeId);
  }
  
  // 3. 使用游戏默认主题
  return await this.loadDefaultThemeForGame(ownerId);
}

/**
 * ⭐ 切换用户主题
 */
async switchUserTheme(
  userId: number,
  ownerType: string,
  ownerId: number,
  themeId: number
): Promise<boolean> {
  try {
    // 1. 保存到后端
    const success = await themeApi.saveUserPreference(ownerType, ownerId, themeId);
    
    if (!success) {
      throw new Error('保存用户偏好失败');
    }
    
    // 2. 更新本地缓存
    ThemePreferenceUtil.saveLocal(ownerType, ownerId, themeId);
    
    // 3. 应用主题
    await this.switchTheme(themeId.toString());
    
    return true;
  } catch (error) {
    console.error('[ThemeManager] 切换主题失败:', error);
    return false;
  }
}
```

### 2. MyThemesManagement.vue 优化主题标签展示

**文件**: `kids-game-frontend/src/modules/creator-center/components/MyThemesManagement.vue`

在主题卡片上添加标签展示逻辑（第 30-50 行左右）:

```vue
<div class="theme-badges">
  <!-- 官方主题标签 -->
  <span v-if="theme.isOfficial" class="badge-official">
    🏛️ 官方
  </span>
  
  <!-- 我的创作标签 -->
  <span v-else-if="theme.source === 'mine'" class="badge-mine">
    🎨 我的
  </span>
  
  <!-- 已购买标签 -->
  <span v-else-if="theme.source === 'purchased'" class="badge-purchased">
    🛒 已购
  </span>
  
  <!-- 免费标签 -->
  <span v-if="theme.price === 0" class="badge-free">
    🆓 免费
  </span>
  
  <!-- 默认主题标签 -->
  <span v-if="theme.isDefault" class="badge-default">
    ⭐ 默认
  </span>
  
  <!-- 使用中主题标签 -->
  <span v-if="theme.isCurrent" class="badge-current">
    ✓ 使用中
  </span>
</div>
```

样式参考:

```scss
.theme-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
  
  .badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    
    &-official {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
    }
    
    &-mine {
      background: #dbeafe;
      color: #1e40af;
      border: 1px solid #93c5fd;
    }
    
    &-purchased {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #6ee7b7;
    }
    
    &-free {
      background: #fce7f3;
      color: #9d174d;
      border: 1px solid #f9a8d4;
    }
    
    &-default {
      background: #ede9fe;
      color: #5b21b6;
      border: 1px solid #c4b5fd;
    }
    
    &-current {
      background: #059669;
      color: white;
      border: 1px solid #047857;
    }
  }
}
```

### 3. CreatorCenter.vue 整合"使用"按钮功能

**文件**: `kids-game-frontend/src/modules/creator-center/index.vue`

修改 `handleUseTheme` 函数（第 588-593 行）:

```typescript
async function handleUseTheme(theme: any) {
  try {
    const userId = getCurrentUserId();
    const ownerType = theme.ownerType || 'GAME';
    const ownerId = theme.gameId || theme.ownerId;
    const themeId = theme.themeId || theme.id;
    
    dialog.loading(`正在应用主题 ${theme.name}...`);
    
    // 1. 调用后端 API 保存偏好
    const success = await themeApi.saveUserPreference(ownerType, ownerId, themeId);
    
    if (!success) {
      throw new Error('保存用户偏好失败');
    }
    
    // 2. 更新本地缓存
    ThemePreferenceUtil.saveLocal(ownerType, ownerId, themeId);
    
    // 3. 应用主题到当前页面
    await themeManager.switchUserTheme(userId, ownerType, ownerId, themeId);
    
    dialog.success(`已应用主题：${theme.name}`);
    
    // 4. 刷新主题列表显示
    await reloadCurrentData();
    
  } catch (error: any) {
    console.error('[handleUseTheme] 应用主题失败:', error);
    dialog.error('应用主题失败：' + (error.message || '未知错误'));
  } finally {
    dialog.close();
  }
}
```

### 4. ThemeStorePage.vue 优化主题商店标签

**文件**: `kids-game-frontend/src/modules/admin/components/ThemeStorePage.vue`

参考 MyThemesManagement.vue 的标签展示逻辑，在主题卡片中添加相同的标签展示。

---

## 🧪 测试步骤

### 1. 数据库初始化

```bash
# 在 kids-game-backend 目录执行
mysql -u your_user -p your_database < user-theme-preference.sql
```

### 2. 验证 API

使用 Postman 或浏览器访问:

```bash
# 获取用户当前主题
GET http://localhost:8080/api/theme/user/current?ownerType=GAME&ownerId=1
Authorization: Bearer YOUR_TOKEN

# 保存用户主题偏好
POST http://localhost:8080/api/theme/user/preference?ownerType=GAME&ownerId=1&themeId=1
Authorization: Bearer YOUR_TOKEN
```

### 3. 前端测试

1. 启动前端开发服务器
2. 登录用户账号
3. 进入创作者中心
4. 点击"使用"按钮应用主题
5. 刷新页面，验证主题是否保持
6. 切换到另一个用户账号，验证主题偏好是否独立

---

## 📋 核心设计理念

### 分层存储策略

1. **第一层：后端数据库持久化**
   - 表：`user_theme_preference`
   - 优势：跨设备同步、数据不丢失
   - API: `/api/theme/user/current`, `/api/theme/user/preference`

2. **第二层：本地缓存快速加载**
   - localStorage key: `theme_preference_GAME_1`
   - 优势：快速读取、离线可用
   - 工具类：`ThemePreferenceUtil`

3. **加载优先级**
   - 后端数据库 > 本地缓存 > 游戏默认主题

### 主题标签体系

| 标签类型 | 标识字段 | 颜色 | 说明 |
|---------|---------|------|------|
| 🏛️ 官方 | `isOfficial: true` | 黄色 | 官方发布的主题 |
| 🎨 我的 | `source === 'mine'` | 蓝色 | 用户自己创作的 |
| 🛒 已购 | `source === 'purchased'` | 绿色 | 已购买的付费主题 |
| 🆓 免费 | `price === 0` | 粉色 | 免费主题 |
| ⭐ 默认 | `isDefault: true` | 紫色 | 游戏默认主题 |
| ✓ 使用中 | `isCurrent: true` | 绿色 | 当前正在使用的 |

---

## 🎯 下一步计划

1. 完成 ThemeManager.ts 的方法集成
2. 完成前端组件的标签展示优化
3. 完成"使用"按钮功能实现
4. 运行 SQL 脚本并测试完整流程
5. 验证跨设备主题同步功能
