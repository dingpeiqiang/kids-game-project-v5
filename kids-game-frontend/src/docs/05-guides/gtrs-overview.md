# GTRS v1.0.0 主题系统概述

> 核心提示词：指导 AI 理解项目架构、技术栈和编码规范，确保代码生成不偏离项目核心。

---

## 1. 项目核心

**项目**：儿童游戏平台（Kids Game Platform）  
**定位**：专业儿童在线游戏平台，含用户系统、游戏库、家长管控、疲劳度管理

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
│   └── kids-game-web/        # Web 层（Controller）
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
  - ✅ 儿童和家长**都可以玩游戏**
  - ✅ 用户类型区别**仅在于权限不同**
  - ✅ 家长可约束孩子（时长、时段、屏蔽游戏）
  - ✅ 游戏会话、疲劳点、排行榜对两种用户**完全一致**

### 疲劳度系统
- 初始疲劳点：10 点
- 答题可获取额外疲劳点
- 每日自动重置
- Redis 缓存优化

### 主题系统（GTRS v1.0.0）

**核心原则**：主题驱动开发（Theme-Driven Development）
- ✅ **先有 GTRS 主题，再开发游戏**
- 📦 **提前规划资源清单**：GTRS 主题模板列出所有图片/音频资源
- 🔄 **主题修改不涉及游戏代码**：支持快速视觉迭代
- 📄 **强制 Schema 校验**：前端 ajv + 后端 json-schema-validator

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

**游戏端集成（强制）**：
```typescript
import { GTRSThemeLoader } from '@/shared/utils/GTRSThemeLoader';
import { GTRSThemeApplier } from '@/shared/utils/GTRSThemeApplier';

// 初始化
const themeLoader = new GTRSThemeLoader();
const theme = await themeLoader.loadTheme('theme_id');
const themeApplier = new GTRSThemeApplier(theme);

// 在 Phaser 场景中使用
class GameScene extends Phaser.Scene {
  create() {
    // 应用图片资源
    themeApplier.applyImageToSprite(this, 'background_img', 'background');
    
    // 应用全局样式
    themeApplier.applyGlobalStyleToDOM();
    
    // 播放音频
    themeApplier.playAudio('bgm', 'bgm_main', { loop: true });
  }
}
```

**校验和兜底**：
- ✅ 前端提交时：ajv 校验
- ✅ 后端存储时：json-schema-validator 校验
- ✅ 游戏加载时：Schema 校验 + 失败就报错
- ✅ 双重兜底：GTRS 默认主题 + 游戏内置资源

---

## 5. 编码规范（强制执行）

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
    throw new BusinessException(ErrorCode.KID_NOT_FOUND);  // ✅ 正确
}

// 事务
@Transactional(rollbackFor = Exception.class)
public void register(KidRegisterDTO dto) { ... }

// 日志
log.info("用户登录成功。Username: {}, UserId: {}", username, userId);  // ✅ 参数化
```

### 前端 TypeScript/Vue
```typescript
// 文件命名
UserProfile.vue        // 组件：PascalCase
date-util.ts           // 工具：kebab-case

// Vue 组件结构
defineProps → defineEmits → 类型定义 → ref/reactive → computed → methods → lifecycle

// API 服务类
export class KidApiService extends BaseApiService {
    private static instance: KidApiService;
    static getInstance(): KidApiService { ... }
    async getKidInfo(kidId: number): Promise<Kid> { ... }
}
export const kidApi = KidApiService.getInstance();
```

### API 服务层规范（重要）

#### 核心架构
- **基类**: `BaseApiService` - 基于 Axios，统一封装 HTTP 请求、Token、重试机制
- **错误处理**: `error-handler.ts` - 统一错误处理器，自动 Toast 提示
- **服务拆分**: 按业务模块拆分（themeApi, kidApi, parentApi 等）
- **禁止**: 已废弃 `apiService`，禁止使用

#### 统一响应格式
```typescript
// 后端统一响应
interface ApiResponse<T> {
  code: number;    // 200 成功
  msg: string;
  data: T;
}

// ⭐ 分页数据（统一标准）
interface PageData<T> {
  list: T[];
  total: number;
}
```

#### 关键特性
```typescript
// 1. 分页数据自动规范化
interface RequestOptions {
  returnPageData?: boolean;  // 强制返回 {list, total}
}

// 2. Service 层明确返回类型
class ThemeApiService extends BaseApiService {
  async getList(params): Promise<PageData<Theme>> {
    return this.get(url, { returnPageData: true });
  }
  
  async getDetail(id): Promise<Theme> {
    return this.get(`/detail?id=${id}`);
  }
}

// 3. 调用方简洁使用
const result = await themeApi.getList(params);
const themes = result.list;  // TypeScript 类型安全
```

#### 使用规范
```typescript
// ✅ 正确：使用细分服务，自动 Token、自动错误处理
import { themeApi, kidApi } from '@/services';

try {
  const result = await themeApi.getList({ page: 1 });
  const themes = result.list;  // 无需格式检查
} catch (error) {
  // 错误已自动显示 Toast
}

// ❌ 错误：直接使用 axios，手动处理响应格式
const response = await axios.get('/api/theme/list');
const themes = response.data.data?.list || [];  // 禁止
```

### 公共组件使用与抽取

#### 组件目录结构
```
src/components/
├── ui/                    # UI 基础组件
│   ├── KidButton.vue
│   ├── KidLoading.vue
│   ├── KidToast.vue
│   ├── KidUnifiedModalV2.vue   # ⭐ 唯一统一弹窗组件
│   ├── SearchBox.vue
│   └── index.ts           # 统一导出
├── game/                  # 游戏相关组件
│   ├── ScorePanel.vue
│   ├── GameCard.vue
│   └── index.ts
├── layout/                # 布局组件
├── theme/                 # 主题组件
└── index.ts               # 全局统一导出
```

#### 统一弹窗组件（KidUnifiedModalV2）
**原则：项目内所有弹窗必须使用此组件，禁止创建新弹窗组件**

```vue
<!-- 1. 组件方式使用 -->
<template>
  <KidUnifiedModalV2
    v-model:show="visible"
    type="success"              <!-- info/success/warning/error/question/result/reward/levelup/gameover -->
    title="游戏胜利！"
    subtitle="恭喜你完成挑战"
    size="md"                   <!-- sm/md/lg/xl -->
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

<script setup>
import { KidUnifiedModalV2 } from '@/components';
</script>
```

```typescript
// 2. 编程式使用（推荐）
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
if (result) {
  // 执行删除
}
```

#### 何时抽取公共组件

**必须抽取为公共组件的情况**：
1. **3+ 处复用** - 同一功能在 3 个及以上地方使用
2. **复杂逻辑** - 包含复杂交互或状态管理
3. **视觉一致性** - 需要保持统一视觉风格的元素
4. **业务通用** - 跨模块通用的业务组件

**禁止抽取的情况**：
1. **单一业务逻辑** - 仅特定页面使用
2. **过度抽象** - 为抽象而抽象，增加复杂度
3. **简单包装** - 只是对原生元素的简单封装

#### 公共组件开发规范

```vue
<!-- KidXxx.vue 公共组件模板 -->
<template>
  <div class="kid-xxx" :class="[`size-${size}`, { 'is-disabled': disabled }]">
    <!-- 组件内容 -->
  </div>
</template>

<script setup lang="ts">
/**
 * KidXxx 组件
 * 
 * @description 组件功能描述
 * @example
 * <KidXxx title="标题" @confirm="handleConfirm" />
 */

// 1. Props 定义（必须带默认值）
interface Props {
  /** 标题 */
  title?: string;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否禁用 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  size: 'md',
  disabled: false
});

// 2. Emits 定义
const emit = defineEmits<{
  /** 确认事件 */
  confirm: [value: string];
  /** 取消事件 */
  cancel: [];
}>();

// 3. 组件逻辑...
</script>

<style scoped lang="scss">
.kid-xxx {
  // 样式
}
</style>
```

#### 组件导出规范

```typescript
// src/components/ui/index.ts
// 按功能分组导出，带注释说明

// ===== 基础 UI 组件 =====
export { default as KidButton } from './KidButton.vue';
export { default as KidLoading } from './KidLoading.vue';

// ===== 弹窗组件（统一使用 KidUnifiedModalV2） =====
export { default as KidUnifiedModalV2 } from './KidUnifiedModalV2.vue';

// ===== 表单组件 =====
export { default as SearchBox } from './SearchBox.vue';
```

```typescript
// src/components/index.ts - 全局统一导出
export * from './ui';
export * from './game';
export * from './layout';
```

#### 组件使用原则

```vue
<script setup lang="ts">
// ✅ 正确：从统一入口导入
import { KidButton, KidUnifiedModalV2 } from '@/components';

// ❌ 错误：直接导入具体路径（破坏封装）
import KidButton from '@/components/ui/KidButton.vue';
</script>
```

---

## 6. 数据库规范（关键）

**权威定义**：`kids-game-db-sql.sql` - 以 SQL 文件为准

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

**文档版本**: v2.2 | **最后更新**: 2026-03-20 | **新增**: GTRS v1.0.0 主题系统规范
