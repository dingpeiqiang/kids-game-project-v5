# 🎨 占位图服务说明

## ✅ 已修复 URL 可访问性问题

### 问题
原脚本使用的 `via.placeholder.com` 在国内无法访问。

### 解决方案
已将所有占位图 URL 替换为 **`https://placehold.co`**，该服务：
- ✅ 国内可访问
- ✅ 支持中文文字（添加 `&font=noto` 参数）
- ✅ 免费且稳定
- ✅ 支持自定义尺寸和颜色

---

## 📝 URL 格式说明

### 基本格式
```
https://placehold.co/{宽度}x{高度}/{背景色}/{文字颜色}?text={文字}&font=noto
```

### 示例
```
https://placehold.co/64x64/00ff00/ffffff?text=Snake+Head&font=noto
```

这会产生：
- 64x64 像素的图片
- 绿色背景 (#00ff00)
- 白色文字 (#ffffff)
- 显示 "Snake Head" 文字
- 使用 Noto 字体（支持中文）

---

## 🎯 各主题使用的资源

### 贪吃蛇 - 清新绿
| 资源 | URL | 说明 |
|------|-----|------|
| snakeHead | `https://placehold.co/64x64/00ff00/ffffff?text=Snake+Head&font=noto` | 绿色蛇头 |
| snakeBody | `https://placehold.co/48x48/42b983/ffffff?text=Body&font=noto` | 绿色蛇身 |
| food | `https://placehold.co/32x32/ff0000/ffffff?text=Apple&font=noto` | 红色食物 |

### 贪吃蛇 - 经典复古
| 资源 | URL | 说明 |
|------|-----|------|
| snakeHead | `https://placehold.co/64x64/32cd32/000000?text=Retro+Snake&font=noto` | 复古绿蛇头 |
| food | `https://placehold.co/32x32/ffff00/000000?text=Retro+Food&font=noto` | 黄色食物 |

### 贪吃蛇 - 活力橙
| 资源 | URL | 说明 |
|------|-----|------|
| snakeHead | `https://placehold.co/64x64/ff6600/ffffff?text=Orange+Snake&font=noto` | 橙色蛇头 |
| food | `https://placehold.co/32x32/00ffff/000000?text=Orange+Food&font=noto` | 青色食物 |

### PVZ - 阳光活力
| 资源 | URL | 说明 |
|------|-----|------|
| sunflower | `https://placehold.co/64x64/ffeb3b/000000?text=Sunflower&font=noto` | 向日葵 |
| peashooter | `https://placehold.co/64x64/4caf50/ffffff?text=Peashooter&font=noto` | 豌豆射手 |
| zombie_normal | `https://placehold.co/64x64/757575/ffffff?text=Normal+Zombie&font=noto` | 普通僵尸 |

### PVZ - 月夜幽深
| 资源 | URL | 说明 |
|------|-----|------|
| sunflower | `https://placehold.co/64x64/cddc39/000000?text=Moon+Flower&font=noto` | 月光花 |
| peashooter | `https://placehold.co/64x64/9c27b0/ffffff?text=Moon+Shooter&font=noto` | 紫色豌豆 |

### PVZ - 卡通萌系
| 资源 | URL | 说明 |
|------|-----|------|
| sunflower | `https://placehold.co/64x64/f06292/ffffff?text=Sakura&font=noto` | 樱花 |
| peashooter | `https://placehold.co/64x64/ec407a/ffffff?text=Tulip&font=noto` | 郁金香 |
| projectile | `https://placehold.co/16x16/f06292/ffffff?text=Heart&font=noto` | 爱心子弹 |

---

## 🔍 测试 URL

你可以直接在浏览器中测试这些 URL：

### 测试示例
```
https://placehold.co/64x64/00ff00/ffffff?text=Snake+Head&font=noto
https://placehold.co/32x32/ff0000/ffffff?text=Apple&font=noto
https://placehold.co/800x600/1a472a/ffffff?text=Game+BG&font=noto
```

如果能看到对应的彩色图片，说明服务正常！

---

## 🚀 执行修复脚本

### PowerShell
```powershell
Get-Content fix-theme-resources-with-placeholders.sql | mysql -u root -p123456 kids_game
```

### 验证结果
```sql
-- 查看更新后的 URL
SELECT 
  theme_id,
  theme_name,
  JSON_EXTRACT(config_json, '$.default.assets.snakeHead.url') as head_url
FROM theme_info t
INNER JOIN theme_game_relation r ON t.theme_id = r.theme_id
WHERE r.game_code = 'snake-vue3';
```

---

## 💡 后续优化建议

### 方案 1：使用本地资源（推荐用于生产环境）
1. 下载占位图到本地
2. 上传到服务器/CDN
3. 更新数据库中的 URL

### 方案 2：生成真实资源
使用设计工具或 AI 绘画生成真实的精美图片。

### 方案 3：保持现状（适合开发测试）
`placehold.co` 服务稳定，可以长期用于开发和测试。

---

## ⚠️ 注意事项

1. **生产环境建议使用自己的 CDN**
   - 更好的性能
   - 更可控
   - 品牌一致性

2. **占位图的局限性**
   - 只有简单的色块和文字
   - 没有精美的图形
   - 适合功能测试，不适合最终产品

3. **Fallback 机制仍然重要**
   - 即使占位图无法加载，还有 emoji/颜色作为备选
   - 保证功能始终可用

---

## ✅ 总结

- ✅ 所有 URL 已更换为国内可访问的 `placehold.co`
- ✅ 添加了 `&font=noto` 参数支持中文显示
- ✅ 每个资源都有 fallback 保护
- ✅ 可以直接执行 SQL 脚本进行修复

现在可以放心地运行脚本了！🎉
