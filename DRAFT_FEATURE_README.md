# 草稿功能实现文档

## 概述

草稿功能允许用户在编辑主题时保存草稿，防止数据丢失。草稿存储在后端数据库中，支持跨设备访问。

## 数据库设计

### 表结构：theme_draft

```sql
CREATE TABLE `theme_draft` (
    `draft_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '草稿 ID',
    `author_id` BIGINT NOT NULL COMMENT '作者 ID',
    `draft_name` VARCHAR(100) NOT NULL COMMENT '草稿名称',
    `theme_name` VARCHAR(100) COMMENT '主题名称',
    `owner_type` VARCHAR(20) NOT NULL DEFAULT 'GAME' COMMENT '适用范围：GAME-游戏主题，APPLICATION-应用主题',
    `owner_id` BIGINT COMMENT '所有者 ID（游戏主题时需要）',
    `config_json` JSON NOT NULL COMMENT '完整主题配置 (GTRS 格式)',
    `thumbnail_url` VARCHAR(500) COMMENT '缩略图 URL',
    `size` INT DEFAULT 0 COMMENT '草稿大小（字节）',
    `status` VARCHAR(20) DEFAULT 'draft' COMMENT '状态：draft-草稿',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`draft_id`),
    INDEX `idx_author_id` (`author_id`),
    INDEX `idx_owner_type` (`owner_type`),
    INDEX `idx_owner_id` (`owner_id`),
    INDEX `idx_updated_at` (`updated_at`),
    CONSTRAINT `fk_draft_author` FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主题草稿表';
```

## 后端实现

### 1. 实体类
- `ThemeDraft.java`: 草稿实体类

### 2. Mapper 接口
- `ThemeDraftMapper.java`: MyBatis Plus Mapper，提供基础 CRUD 和自定义查询

### 3. DTO 类
- `ThemeDraftDTO.java`: 草稿数据传输对象，包含关联的游戏信息

### 4. Service 层
- `ThemeService.java` 接口新增方法：
  - `saveDraft()`: 保存草稿
  - `getMyDrafts()`: 获取用户所有草稿
  - `getDraftDetail()`: 获取草稿详情
  - `deleteDraft()`: 删除草稿

- `ThemeServiceImpl.java` 实现上述方法，包含：
  - 自动清理超过 20 个的旧草稿
  - 权限验证
  - 异常处理

### 5. Controller 层
- `ThemeController.java` 新增 API 接口：
  - `POST /api/theme/draft`: 保存草稿
  - `GET /api/theme/draft/my`: 获取我的草稿列表
  - `GET /api/theme/draft/{draftId}`: 获取草稿详情
  - `DELETE /api/theme/draft/{draftId}`: 删除草稿

所有接口都需要登录认证（`@RequireLogin`）。

## 前端实现

### 1. API 服务
- `theme-api.service.ts` 新增方法：
  - `saveDraft()`: 保存草稿
  - `getMyDrafts()`: 获取草稿列表
  - `getDraftDetail()`: 获取草稿详情
  - `deleteDraft()`: 删除草稿

### 2. 组件更新
- `GTRSThemeCreatorV2.vue`:
  - `saveDraft()`: 调用后端 API 保存草稿
  - `handleDraftRestore()`: 恢复草稿到编辑器

- `DraftManager.vue`:
  - `loadDrafts()`: 从后端加载草稿列表
  - `handleDelete()`: 调用后端 API 删除草稿
  - `handleDownload()`: 下载草稿为 JSON 文件
  - `handleRestore()`: 恢复草稿到编辑器

## 功能特性

1. **自动限制草稿数量**: 每个用户最多保留 20 个草稿，超过后自动删除最旧的
2. **权限验证**: 只能访问和删除自己的草稿
3. **数据完整性**: 保存前进行 GTRS Schema 校验
4. **草稿下载**: 支持将草稿导出为 JSON 文件
5. **排序**: 草稿按更新时间降序排列

## 使用流程

### 保存草稿

1. 在主题编辑器中编辑主题
2. 点击顶部工具栏的"保存草稿"按钮
3. 系统自动保存当前主题配置到后端
4. 显示"草稿保存成功"提示

### 查看草稿

1. 在主题编辑器中点击"草稿管理"按钮
2. 打开草稿管理对话框
3. 显示所有草稿列表（按更新时间降序）

### 恢复草稿

1. 在草稿管理对话框中找到要恢复的草稿
2. 点击"恢复"按钮
3. 确认恢复操作
4. 草稿内容加载到编辑器

### 删除草稿

1. 在草稿管理对话框中找到要删除的草稿
2. 点击"删除"按钮
3. 确认删除操作
4. 草稿从数据库中移除

### 下载草稿

1. 在草稿管理对话框中找到要下载的草稿
2. 点击"下载"按钮
3. 草稿自动下载为 JSON 文件

## 部署步骤

### 1. 执行数据库迁移

```bash
cd kids-game-backend
mysql -u root -p kids_game < theme-draft-migration.sql
```

### 2. 重新编译后端

```bash
cd kids-game-backend
mvn clean install -DskipTests
```

### 3. 重启后端服务

```bash
# 根据你的部署方式重启
```

### 4. 前端自动更新

前端代码已更新，重新编译后即可使用。

## 注意事项

1. **草稿数量限制**: 每个用户最多 20 个草稿
2. **数据验证**: 保存草稿前会进行 GTRS Schema 校验
3. **权限控制**: 只能操作自己的草稿
4. **自动清理**: 超过 20 个草稿时自动删除最旧的
5. **草稿命名**: 草稿名称默认为主题名称，未命名时为"未命名草稿"

## 未来扩展

1. **草稿自动保存**: 支持定时自动保存（如每 5 分钟）
2. **草稿标签**: 为草稿添加标签，方便分类管理
3. **草稿分享**: 支持将草稿分享给其他用户
4. **草稿版本历史**: 保留草稿的历史版本
5. **草稿合并**: 支持将多个草稿合并
