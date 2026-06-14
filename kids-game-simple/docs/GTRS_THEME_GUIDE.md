# GTRS 主题换肤指南 v1.0.0

**GTRS**（Game Theme Resource Spec）是本平台的**游戏资源与视觉换肤标准**。运营/美术只需替换主题包，无需改代码即可上线新皮肤（前提是游戏按 GPTS 使用槽位名加载资源）。

---

## 1. 规范标识

| 字段 | 固定值 |
|------|--------|
| `specMeta.specName` | `GTRS` |
| `specMeta.specVersion` | `1.0.0` |
| TypeScript 类型 | `src/types/gtrs-theme.ts` |

---

## 2. 资源分类

### 2.1 图片 `resources.images`

| 分类 | 典型用途 |
|------|----------|
| `login` | 登录/授权相关（平台级可空） |
| `scene` | 角色、敌人、背景、**颜色元数据** |
| `ui` | HUD、按钮、面板 |
| `icon` | 道具、技能图标 |
| `effect` | 粒子、爆炸、光效 |

每条资源结构：

```json
"player": {
  "src": "/themes/snake/player.png",
  "type": "png",
  "alias": "player"
}
```

### 2.2 元数据槽（无图片换肤）

当 `src` 为 **颜色** 而非 URL 时，Canvas 游戏通过 `GTRSThemeApplier` 读取：

| src 示例 | 含义 |
|----------|------|
| `#2ECC71` | 单色 |
| `["#FF6B6B","#FFD93D"]` | JSON 字符串数组，如食物颜色列表 |

命名建议与策划文档 §4.2 一致，例如 `snake_body`、`food_colors`。

### 2.3 音频 `resources.audio`

| 分类 | 说明 |
|------|------|
| `bgm` | 背景音乐，`volume` 0~1 |
| `effect` | 短音效 |
| `voice` | 语音（可选） |

---

## 3. 加载顺序（运行时）

1. 用户进入游戏 → `initGame` → `prepareGameTheme(gameId)`  
2. `loadThemeGTRS(gameId, themeId?)`  
   - 指定 `themeId` → API `/api/theme/{themeId}`  
   - 否则 → `/api/theme/default?gameId=`  
   - 失败 → `public/themes/{gameId}_theme_default.json`  
   - 再失败 → 内存生成空 GTRS + `globalStyle` 默认  
3. 成功 → 写入 `themeCache`，`applyCachedThemeToDocument` 注入 CSS 变量（壳层/UI）  
4. 游戏内 → `getCachedGTRSTheme(gameId)` / `getCanvasPaletteForGame(gameId)`

用户选中主题 ID 存于 `localStorage` 键：`kidgame_selected_theme_id`（见 `gameThemeBridge.ts`）。

---

## 4. 文件与后端

| 来源 | 路径/接口 |
|------|-----------|
| 本地默认 | `kids-game-simple/public/themes/{gameId}_theme_default.json` |
| 静态资源 | `kids-game-simple/public/themes/{gameId}/*` |
| 后端 | 主题表 `config_json` 字段（完整 GTRS JSON） |

复制模板：

`docs/templates/gtrs_theme_default.template.json` → 改名为 `{gameId}_theme_default.json`。

---

## 5. 换肤操作步骤（运营）

1. 向研发索取该游戏的 **资源槽位表**（策划文档 §4.2）  
2. 按槽位导出图片/音频，保持 **文件名与 key 无关**，以 JSON 内 `src` 指向为准  
3. 修改 `globalStyle` 中主色/背景色（最快肉眼可见）  
4. 替换 JSON 或上传后端主题  
5. 清缓存重进游戏验证（开发环境可硬刷新）  

---

## 6. Phaser 纹理命名

```
gtrs_{gameId}_{category}_{resourceKey}
```

例：`gtrs_snake_scene_player`  
与 `getPhaserTextureKey('snake', 'scene', 'player')` 一致。

---

## 7. 旧版 TRS 迁移

若仅有旧格式（扁平 `images` + `globalStyle`），loader 会调用 `migrateTRSOrLegacyToGTRS`。  
**新游戏请直接交付 GTRS**，避免二次迁移丢字段。

---

## 8. 故障排查

| 现象 | 检查 |
|------|------|
| 换主题无变化 | 游戏是否仍写死颜色/路径；是否未走 `getCanvasPaletteForGame` |
| 控制台 GTRS warn | 主题 JSON 缺 `specName:GTRS`；API 404 |
| 图片 404 | `src` 路径相对 `public/`，需以 `/themes/...` 开头 |
| 进游戏黑屏 | 与 GTRS 无关时查 WebGL `destroy`；GTRS 加载失败不应阻断 |

---

## 9. 与策划文档关系

- 新游戏：**先**在 [GAME_DESIGN_SPEC_TEMPLATE.md](./GAME_DESIGN_SPEC_TEMPLATE.md) §4 定槽位  
- 实施：**GPTS_GAME_DEV_SPEC.md** §4 强制代码绑槽位  
- 换肤：本文档 + 主题 JSON