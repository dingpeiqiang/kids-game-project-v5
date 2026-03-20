# 统一主题配置系统实施指南

## 📋 实施概览

本次实施完成了统一的主题配置系统，支持应用主题和游戏主题的统一定义，包含样式、图片、音频等多种资源类型。

---

## ✅ 已完成内容

### 1. 数据库迁移脚本
**文件**: `kids-game-backend/theme-system-unified-migration.sql`

**主要变更**:
- ✅ 创建统一的 `theme_info` 表结构
- ✅ 保留 `theme_game_relation` 关系表 (支持多对多)
- ✅ `config_json` 字段存储完整的主题配置 (包含 styles/assets/audio)
- ✅ 添加示例数据 (应用主题 + 游戏主题)

**执行方式**:
```bash
mysql -u root -p kids_game_platform < theme-system-unified-migration.sql
```

---

### 2. TypeScript 类型定义
**文件**: `kids-game-frontend/src/types/theme.types.ts`

**核心类型**:
```typescript
// 资源类型
type AssetType = 'color' | 'emoji' | 'image' | 'audio';

// 资源配置接口
interface ColorAsset { type: 'color'; value: string; }
interface EmojiAsset { type: 'emoji'; value: string; }
interface ImageAsset { type: 'image'; url: string; thumbnailUrl?: string; }
interface AudioAsset { type: 'audio'; url: string; volume?: number; loop?: boolean; }

// 统一主题配置
interface ThemeConfig {
  default: {
    name: string;
    author: string;
    styles: ThemeStyles;  // 颜色/字体/圆角/阴影
    assets: Record<string, ThemeAsset>;  // 资源配置
    audio: Record<string, AudioAsset>;   // 音频配置
  }
}
```

---

### 3. 主题创作组件
**文件**: `kids-game-frontend/src/modules/admin/components/ThemeCreator.vue`

**功能特性**:
- ✅ 基础信息配置 (名称/作者/类型/价格)
- ✅ 样式配置 (颜色选择器/字体滑块/圆角输入)
- ✅ 资源配置 (支持 color/emoji/image/audio 四种类型)
- ✅ 音频配置 (音量控制/循环播放)
- ✅ 实时预览 (左侧配置，右侧预览)
- ✅ 保存到本地草稿
- ✅ 上传到云端

**使用示例**:
```vue
<ThemeCreator 
  @close="handleClose" 
  @saved="handleSaved" 
/>
```

---

### 4. 实时预览组件
**文件**: `kids-game-frontend/src/modules/admin/components/ThemePreview.vue`

**预览模式**:
- **应用主题预览**: 模拟首页/个人中心界面
- **游戏主题预览**: 根据 gameCode 显示不同游戏的预览效果

**预览内容**:
- ✅ 导航栏样式
- ✅ 卡片组件样式
- ✅ 按钮样式
- ✅ 颜色样本展示
- ✅ 游戏资源配置预览

---

## 🔧 待完成工作

### 1. 后端 Service 实现

**需要更新的类**:
- `ThemeServiceImpl.java` - 主题服务实现
- `ThemeController.java` - 主题控制器

**关键方法**:

```java
/**
 * 上传主题
 */
public ThemeInfo uploadTheme(Long authorId, ThemeUploadDTO themeData) {
    ThemeInfo theme = new ThemeInfo();
    theme.setAuthorId(authorId);
    theme.setThemeName(themeData.getThemeName());
    theme.setApplicableScope(themeData.getApplicableScope());
    
    // 将 ThemeConfig 转换为 JSON 字符串
    String configJson = JSON.toJSONString(themeData.getConfig());
    theme.setConfigJson(configJson);
    
    themeInfoMapper.insert(theme);
    
    // 如果是游戏主题，添加关联关系
    if ("specific".equals(theme.getApplicableScope())) {
        ThemeGameRelation relation = new ThemeGameRelation();
        relation.setThemeId(theme.getThemeId());
        relation.setGameId(themeData.getGameId());
        relation.setGameCode(themeData.getGameCode());
        relation.setIsDefault(themeData.getIsDefault() != null ? themeData.getIsDefault() : false);
        themeGameRelationMapper.insert(relation);
    }
    
    return theme;
}

/**
 * 获取游戏的所有主题
 */
public Page<ThemeInfo> listGameThemes(Long gameId, String gameCode, String status, Integer page, Integer pageSize) {
    // 查询关系表获取主题 ID 列表
    List<Long> themeIds = themeGameRelationMapper.selectThemeIdsByGameId(gameId);
    
    LambdaQueryWrapper<ThemeInfo> wrapper = new LambdaQueryWrapper<>();
    wrapper.in(ThemeInfo::getThemeId, themeIds);
    
    if (status != null) {
        wrapper.eq(ThemeInfo::getStatus, status);
    }
    
    return themeInfoMapper.selectPage(new Page<>(page, pageSize), wrapper);
}
```

---

### 2. 资源上传服务

**需要创建的文件**:
- `ResourceUploadService.java` - 资源上传服务
- `ResourceUploadController.java` - 上传控制器

**功能需求**:
```java
/**
 * 上传图片资源
 */
public ResourceUploadResponse uploadImage(MultipartFile file) {
    // 1. 验证文件类型 (仅图片)
    String contentType = file.getContentType();
    if (!contentType.startsWith("image/")) {
        throw new BusinessException("仅支持图片文件");
    }
    
    // 2. 生成文件名
    String filename = UUID.randomUUID().toString() + "." + getExtension(file);
    
    // 3. 上传到 CDN/对象存储
    String cdnUrl = ossService.upload(file, "themes/images/" + filename);
    
    // 4. 生成缩略图
    String thumbnailUrl = generateThumbnail(file);
    
    return ResourceUploadResponse.builder()
            .success(true)
            .url(cdnUrl)
            .thumbnailUrl(thumbnailUrl)
            .filename(filename)
            .size(file.getSize())
            .build();
}

/**
 * 上传音频资源
 */
public ResourceUploadResponse uploadAudio(MultipartFile file) {
    // 类似图片上传逻辑
}
```

---

### 3. 前端 API 服务

**需要创建的文件**:
- `src/services/themeApi.ts` - 主题 API 封装
- `src/services/resourceUpload.ts` - 资源上传服务

**API 接口**:
```typescript
// 获取主题列表
GET /api/theme/list?applicableScope=all&status=on_sale&page=1&pageSize=20

// 上传主题
POST /api/theme/upload
{
  "themeName": "粉彩应用主题",
  "authorName": "官方设计师",
  "applicableScope": "all",
  "price": 0,
  "config": { ... },
  "description": "..."
}

// 上传图片
POST /api/resource/upload/image
Content-Type: multipart/form-data

// 上传音频
POST /api/resource/upload/audio
Content-Type: multipart/form-data
```

---

## 📝 使用流程

### 创建应用主题

1. 打开主题创作页面 (`/admin/theme/create`)
2. 选择"应用主题"类型
3. 填写基础信息 (名称、作者、描述)
4. 配置样式 (颜色、字体、圆角等)
5. 添加资源 (背景图、图标、按钮等)
6. 添加音频 (点击音效、通知音效等)
7. 查看右侧实时预览
8. 点击"上传到云端"

### 创建游戏主题

1. 打开主题创作页面
2. 选择"游戏主题"类型
3. 选择具体游戏 (如：贪吃蛇)
4. 配置该游戏专属的资源 (蛇头、蛇身、食物等)
5. 其他步骤与应用主题类似

---

## 🎯 主题配置示例

### 应用主题配置

```json
{
  "default": {
    "name": "粉彩应用主题",
    "author": "官方设计师",
    "styles": {
      "colors": {
        "primary": "#FF6B9D",
        "secondary": "#4ECDC4",
        "background": "#f9fafb"
      },
      "typography": {
        "fontSizes": {
          "base": "1rem"
        }
      }
    },
    "assets": {
      "bg_main": { "type": "color", "value": "#f9fafb" },
      "icon_logo": { "type": "emoji", "value": "🌈" },
      "btn_primary": { "type": "color", "value": "#FF6B9D" }
    },
    "audio": {
      "sfx_click": { 
        "type": "audio", 
        "url": "https://cdn.example.com/sfx/click.mp3",
        "volume": 0.4
      }
    }
  }
}
```

### 游戏主题配置 (贪吃蛇)

```json
{
  "default": {
    "name": "经典绿色主题",
    "gameCode": "snake-vue3",
    "styles": {
      "colors": {
        "primary": "#4ade80",
        "background": "#1e293b"
      }
    },
    "assets": {
      "snakeHead": { "type": "emoji", "value": "🐍" },
      "snakeBody": { "type": "color", "value": "#4ade80" },
      "food_normal": { "type": "emoji", "value": "🍎" },
      "gameBg": { "type": "color", "value": "#1e293b" }
    },
    "audio": {
      "bgmGameplay": { 
        "type": "audio", 
        "url": "",
        "loop": true,
        "volume": 0.15
      },
      "sfxEat": { 
        "type": "audio", 
        "url": "",
        "volume": 0.1
      }
    }
  }
}
```

---

## ⚠️ 注意事项

1. **数据库执行顺序**: 先执行 migration 脚本，再启动后端服务
2. **CDN 配置**: 需要配置对象存储 (阿里云 OSS/腾讯云 COS) 用于存放资源文件
3. **CORS 配置**: 确保 CDN 域名已配置跨域访问
4. **文件限制**: 建议限制上传图片大小 (<5MB)、音频大小 (<10MB)
5. **缓存策略**: CDN 资源设置合理的缓存过期时间

---

## 🚀 下一步计划

- [ ] 实现后端 Service 完整方法
- [ ] 集成对象存储服务 (OSS/COS)
- [ ] 测试主题创建和加载流程
- [ ] 优化预览组件的游戏特定渲染
- [ ] 添加主题批量导入/导出功能
- [ ] 实现主题版本管理

---

## 📞 问题反馈

如有问题请查看:
- 数据库脚本：`theme-system-unified-migration.sql`
- 类型定义：`src/types/theme.types.ts`
- 组件源码：`src/modules/admin/components/ThemeCreator.vue`
