# 游戏主题系统集成指南

## 概述

主题系统已集成到游戏管理功能中，每个游戏可以有多个主题，支持：
- ✅ 按游戏维度管理主题
- ✅ 每个游戏设置默认主题
- ✅ 主题与游戏绑定（game_id, game_code）
- ✅ 在游戏管理界面直接管理主题

---

## 数据库变更

### 1. 执行迁移 SQL

```sql
-- 添加游戏关联字段到 theme_info 表
ALTER TABLE `theme_info` 
ADD COLUMN `game_id` BIGINT NOT NULL COMMENT '关联游戏 ID' AFTER `theme_id`,
ADD COLUMN `game_code` VARCHAR(50) NOT NULL COMMENT '游戏代码（如：snake-vue3）' AFTER `game_id`,
ADD COLUMN `is_default` TINYINT DEFAULT 0 COMMENT '是否为默认主题：0-否，1-是' AFTER `config_json`,
ADD INDEX `idx_game_id` (`game_id`),
ADD INDEX `idx_game_code` (`game_code`);
```

### 2. 表结构

```sql
CREATE TABLE `theme_info` (
    `theme_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主题 ID',
    `game_id` BIGINT NOT NULL COMMENT '关联游戏 ID',
    `game_code` VARCHAR(50) NOT NULL COMMENT '游戏代码',
    `author_id` BIGINT NOT NULL COMMENT '作者 ID',
    `theme_name` VARCHAR(100) NOT NULL COMMENT '主题名称',
    `author_name` VARCHAR(50) COMMENT '作者名称',
    `price` INT DEFAULT 0 COMMENT '价格（游戏币）',
    `status` VARCHAR(20) DEFAULT 'pending' COMMENT '状态',
    `download_count` INT DEFAULT 0 COMMENT '下载次数',
    `total_revenue` INT DEFAULT 0 COMMENT '总收益',
    `thumbnail_url` VARCHAR(500) COMMENT '缩略图 URL',
    `description` TEXT COMMENT '描述',
    `config_json` JSON NOT NULL COMMENT '主题配置',
    `is_default` TINYINT DEFAULT 0 COMMENT '是否为默认主题',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`theme_id`),
    INDEX `idx_game_id` (`game_id`),
    INDEX `idx_game_code` (`game_code`)
);
```

---

## 后端实现

### 1. 实体类更新 (ThemeInfo.java)

```java
@TableField("game_id")
private Long gameId;

@TableField("game_code")
private String gameCode;

@TableField("is_default")
private Boolean isDefault;
```

### 2. Service 接口新增方法

```java
// 获取游戏主题列表
Page<ThemeInfo> listGameThemes(Long gameId, String gameCode, String status, Integer page, Integer pageSize);

// 设置默认主题
boolean setDefaultTheme(Long themeId);
```

### 3. Controller 更新

```java
@GetMapping("/list")
public Result<Map<String, Object>> listThemes(
    @RequestParam(required = false) String status,
    @RequestParam(defaultValue = "1") Integer page,
    @RequestParam(defaultValue = "20") Integer pageSize,
    @RequestParam(required = false) Long gameId,
    @RequestParam(required = false) String gameCode) {
    
    Page<ThemeInfo> pageInfo;
    if (gameId != null || gameCode != null) {
        pageInfo = themeService.listGameThemes(gameId, gameCode, status, page, pageSize);
    } else {
        pageInfo = themeService.listThemes(status, page, pageSize);
    }
    // ...
}

@PostMapping("/set-default")
public Result<ThemeInfo> setDefaultTheme(@RequestBody Map<String, Long> params) {
    Long themeId = params.get("themeId");
    ThemeInfo theme = themeService.setDefaultTheme(themeId);
    return Result.success(theme);
}
```

---

## 前端实现

### 1. 游戏管理集成主题

在游戏管理卡片中添加"🎨 主题"按钮，点击打开主题管理弹窗。

### 2. 主题管理功能

- **主题列表** - 显示当前游戏的所有主题
- **创建主题** - 为当前游戏创建新主题
- **编辑主题** - 修改主题配置
- **上架/下架** - 控制主题可见性
- **设为默认** - 设置游戏的默认主题
- **删除主题** - 删除不需要的主题

### 3. API 调用

```typescript
// 获取游戏主题列表
axios.get('/api/theme/list', {
  params: { gameId: game.gameId, gameCode: game.gameCode }
});

// 设为默认主题
axios.post('/api/theme/set-default', { themeId: theme.themeId });

// 创建/更新主题
axios.post('/api/theme/upload', {
  gameId: game.gameId,
  gameCode: game.gameCode,
  themeName: '主题名称',
  config: { ... }
});
```

---

## 使用流程

### 管理员操作

1. **访问游戏管理** - `/admin/games`
2. **点击主题按钮** - 在游戏卡片上点击 "🎨 主题"
3. **查看主题列表** - 显示该游戏的所有主题
4. **创建主题** - 点击"创建主题"，填写配置
5. **管理主题** - 编辑、上架/下架、设为默认、删除

### 玩家使用

1. **选择游戏** - 进入游戏选择页面
2. **选择主题** - 在游戏内主题菜单选择喜欢的主题
3. **使用主题** - 主题自动应用到游戏中

---

## 主题配置示例

```json
{
  "default": {
    "name": "炫酷主题",
    "author": "官方",
    "assets": {
      "bg_main": "images/bg_cool.png",
      "player_1": "images/player_cool.png",
      "bgm_main": "audio/bgm_cool.mp3"
    },
    "styles": {
      "color_text": "#ffffff",
      "color_primary": "#667eea",
      "font_size_title": "40px"
    }
  }
}
```

---

## 待实现功能

- [ ] ThemeServiceImpl 实现 `listGameThemes` 方法
- [ ] ThemeServiceImpl 实现 `setDefaultTheme` 方法
- [ ] 后端添加 `/api/theme/set-default` 接口
- [ ] 后端添加 `/api/theme/update` 接口
- [ ] 主题上传时自动压缩图片
- [ ] 主题预览功能
- [ ] 主题批量导入/导出

---

## 数据库初始化数据

```sql
-- 为贪吃蛇游戏添加默认主题
INSERT INTO `theme_info` 
(`game_id`, `game_code`, `author_id`, `theme_name`, `author_name`, `price`, `status`, 
 `is_default`, `config_json`) 
VALUES 
(1, 'snake-vue3', 1, '官方默认主题', '游戏官方', 0, 'on_sale', 1, 
 '{"default": {"name": "官方默认主题", "assets": {}, "styles": {"color_primary": "#42b983"}}}');
```

---

## 注意事项

1. **游戏关联** - 创建主题时必须指定 `game_id` 和 `game_code`
2. **默认主题** - 每个游戏只能有一个默认主题（`is_default = 1`）
3. **主题配置** - `config_json` 必须是有效的 JSON 格式
4. **权限控制** - 只有管理员可以创建/编辑主题
5. **玩家购买** - 玩家购买后主题绑定账号，可跨设备使用
