# AI 编码指南

> 核心提示词：指导 AI 理解项目架构、技术栈和编码规范，确保代码生成不偏离项目核心。

---

## 1. 项目核心

**项目**：儿童游戏平台（Kids Game Platform）
**定位**：专业儿童在线游戏平台，含用户系统、游戏库、家长管控、游学币度管理

---

## 2. 技术栈

| 后端 | 前端 | 游戏 |
|------|------|------|
| Spring Boot 3.x | Vue 3 + TypeScript | Phaser 3.80 |
| MySQL 8.0 + MyBatis-Plus | Vite + Pinia | TypeScript |
| Redis + JWT | Tailwind CSS | |

---

## 3. 项目结构

```
kids-game-project/
├── kids-game-backend/        # Spring Boot 后端
│   ├── kids-game-common/     # 公共模块（常量、工具、异常）
│   ├── kids-game-dao/        # 数据访问层（Entity、Mapper）
│   ├── kids-game-service/    # 业务逻辑层（Service、DTO）
│   └── kids-game-web/       # Web 层（Controller）
├── kids-game-frontend/       # Vue3 前端
│   ├── src/services/         # API 服务
│   ├── src/core/             # 核心功能
│   ├── src/modules/          # 业务模块
│   └── src/components/       # 通用组件
└── kids-game-house/          # Phaser 游戏模块
```

---

## 4. 核心业务规则（不可偏离）

### 用户系统
- **用户类型**：儿童（Kid）+ 家长（Parent）
- **关键规则**：
  - 儿童和家长**都可以玩游戏**
  - 用户类型区别**仅在于权限不同**
  - 家长可约束孩子（时长、时段、屏蔽游戏）
  - 游戏会话、游学币、排行榜对两种用户**完全一致**

### 游学币度系统
- 初始游学币：10 点
- 答题可获取额外游学币
- 每日自动重置
- Redis 缓存优化

### 主题系统（GTRS v1.0.0）

**核心原则**：主题驱动开发（Theme-Driven Development）
- **先有 GTRS 主题，再开发游戏**
- **提前规划资源清单**：GTRS 主题模板列出所有图片/音频资源
- **主题修改不涉及游戏代码**：支持快速视觉迭代
- **强制 Schema 校验**：前端 ajv + 后端 json-schema-validator

**GTRS 主题结构（固定4个顶级字段）**：
```typescript
{
  specMeta: {                    // 规范元数据（固定）
    specName: "GTRS",
    specVersion: "1.0.0",
    compatibility: "v1.0.0"
  },
  themeInfo: { ... },           // 主题信息（ID、名称、创作者）
  globalStyle: { ... },         // 全局样式（颜色、字体）
  resources: {                  // 资源（固定分类）
    images: { login, scene, ui, icon, effect },  // 5个分类
    audio: { bgm, effect, voice }               // 3个分类
  }
}
```

**资源命名规范**：
- `key`：英文（代码用）- `background_img`, `hero_avatar`
- `alias`：中文（可视化用）- `背景图片`, `英雄头像`
- 禁止在代码中硬编码资源路径

**开发流程**：
```
1. 使用 GTRS 主题编辑器创建主题模板（/admin/gtrs-theme-creator）
2. 规划并填写所有图片/音频资源
3. 导出主题 JSON 文件（存放到 src/configs/gtrs-theme-{game}.json）
4. 游戏开发时集成 GTRS 加载器
5. 在 Phaser 场景中使用 GTRSThemeApplier 应用主题
```

---

## 5. 编码规范（强制执行）

### 加载状态规范

#### **骨架屏使用规范** 📋

**必须使用骨架屏的场景**：
1. ✅ **列表数据加载** - 用户列表、关系列表、配置列表等
   ```vue
   <TableSkeleton v-if="loading && data.length === 0" :rows="10" />
   ```

2. ✅ **卡片内容加载** - 统计卡片、信息卡片等
   ```vue
   <CardSkeleton v-if="loading" :count="4" />
   ```

3. ✅ **详情页加载** - 用户详情、游戏详情等
   ```vue
   <TextSkeleton v-if="loading" :lines="5" />
   ```

**禁止使用骨架屏的场景**：
1. ❌ 简单操作（< 0.5 秒）- 使用按钮 loading 状态
2. ❌ 全屏加载 - 使用品牌 Logo + Loading 文字
3. ❌ 表单提交 - 使用按钮 loading 状态

**标准三段式结构**：
```vue
<template>
  <div>
    <!-- 加载中：骨架屏 -->
    <TableSkeleton v-if="loading && data.length === 0" />
    
    <!-- 有数据：真实内容 -->
    <el-table v-else-if="data.length > 0" :data="data">
      <!-- 表格列 -->
    </el-table>
    
    <!-- 空状态：友好提示 -->
    <EmptyState v-else description="暂无数据" show-refresh />
  </div>
</template>
```

**导入规范**：
```typescript
// ✅ 统一从 skeleton.ts 导入
import { TableSkeleton, CardSkeleton } from '@/utils/skeleton'
import EmptyState from '@/components/EmptyState.vue'

// ❌ 不要分散导入或重复定义
```

**相关文件**：
- [`SKELETON_SCREEN_STANDARD.md`](./SKELETON_SCREEN_STANDARD.md) - 完整骨架屏规范
- [`/src/utils/skeleton.ts`](../../src/utils/skeleton.ts) - 骨架屏工具类
- [`/src/components/EmptyState.vue`](../../src/components/EmptyState.vue) - 空状态组件

### 后端 Java
```java
// 命名
包名: com.kidgame.service.impl          // 全小写
类名: UserServiceImpl                    // PascalCase
方法: updateUser()                       // camelCase，动词开头
变量: userName                           // camelCase
常量: MAX_RETRY_COUNT = 3                // 全大写下划线

// 实体类规范
@Data
@TableName("t_kid")
public class Kid {
    @TableId(type = IdType.AUTO)
    private Long kidId;                  // 主键：{业务}_id
    
    @TableField(fill = FieldFill.INSERT)
    private Long createTime;             // 毫秒时间戳
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Long updateTime;
    
    @TableLogic
    private Integer deleted;             // 逻辑删除
}

// 异常处理
if (kid == null) {
    throw new BusinessException(ErrorCode.KID_NOT_FOUND);  // 正确
}

// 事务
@Transactional(rollbackFor = Exception.class)
public void register(KidRegisterDTO dto) { ... }

// 日志
log.info("用户登录成功。Username: {}, UserId: {}", username, userId);  // 参数化
```

### 前端 TypeScript/Vue

**文件命名**：
- 组件：PascalCase - `UserProfile.vue`
- 工具：kebab-case - `date-util.ts`

**Vue 组件结构**：
```
defineProps → defineEmits → 类型定义 → ref/reactive → computed → methods → lifecycle
```

**API 服务类**：
```typescript
import { apiClient, kidApi } from '@/services'

const kid = await kidApi.getInfo(kidId)
const users = await apiClient.get('/api/admin/users')
```

### 统一 API 调用组件

**核心文件**：`src/services/api-client.service.ts` + `src/core/network/shared-http.client.ts` + `src/services/api.types.ts`

**使用规范**：
```typescript
// ✅ 正确：apiClient 或领域 *Api
import { apiClient, shopApi, API_CONSTANTS } from '@/services'

await shopApi.listProducts()
await apiClient.get('/api/admin/users')

// ❌ 禁止：axios.create、裸 fetch('/api/...')
await axios.get('/api/admin/users')  // ❌
fetch('/api/shop/products')          // ❌
```

**特性**：自动 `Authorization`、`X-Device-Fingerprint`、401 刷新 Token。

### 公共组件使用与抽取

**组件目录结构**：
```
src/components/
├── ui/                    # UI 基础组件
│   ├── KidButton.vue
│   ├── KidLoading.vue
│   ├── KidToast.vue
│   ├── KidUnifiedModalV2.vue   # 统一弹窗组件
│   ├── SearchBox.vue
│   └── index.ts           # 统一导出
├── game/                  # 游戏相关组件
│   ├── ScorePanel.vue
│   ├── GameCard.vue
│   └── index.ts
├── layout/                # 布局组件
└── theme/                 # 主题组件
```

**统一弹窗组件（KidUnifiedModalV2）**：
**原则：项目内所有弹窗必须使用此组件，禁止创建新弹窗组件**

```vue
<template>
  <KidUnifiedModalV2
    v-model:show="visible"
    type="success"
    title="游戏胜利！"
    subtitle="恭喜你完成挑战"
    size="md"
    :stats="[
      { label: '得分', value: 1000 },
      { label: '用时', value: '2:30' }
    ]"
    :show-footer="true"
    confirm-text="再玩一次"
    cancel-text="返回首页"
    @confirm="onReplay"
    @cancel="onBack"
  />
</template>
```

**编程式使用**：
```typescript
import { dialog, confirm } from '@/composables/useDialog';

// 信息提示
dialog({
  type: 'success',
  title: '操作成功',
  subtitle: '数据已保存'
});

// 确认对话框
const result = await confirm({
  type: 'question',
  title: '确认删除？',
  subtitle: '此操作不可恢复'
});
```

---

## 6. 数据库规范（关键）

**权威定义**：`schema_v2` - 以 SQL 文件为准

```sql
-- 表名：小写 + 下划线前缀
CREATE TABLE `t_kid` (
    `kid_id` bigint NOT NULL AUTO_INCREMENT COMMENT '儿童ID',
    `username` varchar(50) NOT NULL COMMENT '用户名',
    `create_time` bigint DEFAULT ((unix_timestamp(now()) * 1000)) COMMENT '创建时间',
    `deleted` tinyint DEFAULT '0' COMMENT '逻辑删除',
    PRIMARY KEY (`kid_id`),
    UNIQUE KEY `uk_username` (`username`),
    KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB COMMENT='儿童用户表';
```

**同步原则**：修改实体类 → 必须同步更新 SQL 文件

---

## 7. AI 编码原则

1. **先读现有代码** - 了解项目风格和模式
2. **严格遵循规范** - 命名、结构、异常处理
3. **数据库同步** - 实体类与 SQL 文件保持一致
4. **用户类型平等** - 儿童和家长游戏功能完全一致
5. **质量红线**：
   - 类 ≤ 500 行，方法 ≤ 50 行
   - 禁止魔法值，使用常量
   - 敏感信息必须加密
   - 日志不能打印密码/Token

---

**文档版本**: v2.2 | **最后更新**: 2026-03-18 | **新增**: GTRS v1.0.0 主题系统规范
