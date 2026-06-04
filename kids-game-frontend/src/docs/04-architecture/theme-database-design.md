# 主题系统数据库设计

## 数据库脚本汇总

**版本**: V3.0  
**更新时间**: 2026-03-16

---

## 📁 脚本清单

| 序号 | 脚本文件 | 说明 |
|------|----------|------|
| 1 | `theme-system-migration-v3.sql` | 主题系统完整迁移脚本 |
| 2 | `theme-init-data.sql` | 主题初始化数据（可选） |
| 3 | `theme-test-data.sql` | 主题测试数据（可选） |

---

## 📊 表结构总览

```
┌─────────────────────────┐
│   theme_info            │  ← 主题信息（独立）
│   - theme_id (PK)       │
│   - author_id           │
│   - theme_name          │
│   - applicable_scope    │
│   - config_json         │
│   - price               │
│   - status              │
└──────────┬──────────────┘
           │ 1:N
┌──────────▼──────────────┐
│   theme_game_relation   │  ← 关系表（多对多）
│   - relation_id (PK)    │
│   - theme_id (FK)       │
│   - game_id             │
│   - game_code           │
│   - is_default          │
└──────────┬──────────────┘
           │ N:1
┌──────────▼──────────────┐
│   game                  │  ← 游戏表（已存在）
│   - game_id (PK)        │
│   - game_code           │
└─────────────────────────┘
```

---

## 🚀 执行步骤

### 1. 执行主迁移脚本（必须）

```bash
cd kids-game-backend
mysql -u root -p kids_game < theme-system-migration-v3.sql
```

### 2. 执行初始化脚本（推荐）

```bash
mysql -u root -p kids_game < theme-init-data.sql
```

### 3. 执行测试脚本（可选 - 仅开发环境）

```bash
mysql -u root -p kids_game < theme-test-data.sql
```

---

## ⚠️ 注意事项

### 执行顺序
1. 先执行 `theme-system-migration-v3.sql`（创建表）
2. 再执行 `theme-init-data.sql`（初始化数据）
3. 最后执行 `theme-test-data.sql`（测试数据，可选）

### 外键约束
- `theme_game_relation.theme_id` → `theme_info.theme_id` (CASCADE DELETE)
- `theme_assets.theme_id` → `theme_info.theme_id` (CASCADE DELETE)
- 删除主题时，关联的关系和资源会自动删除

### 唯一约束
- `theme_game_relation` 表中 `(theme_id, game_id)` 必须唯一
- 同一主题对同一游戏只能有一条关系记录

---

## 📞 常用查询 SQL

### 查询游戏的所有主题
```sql
SELECT t.* 
FROM theme_info t
INNER JOIN theme_game_relation r ON t.theme_id = r.theme_id
WHERE r.game_id = 1 AND r.game_code = 'snake-vue3'
  AND t.status = 'on_sale'
ORDER BY r.is_default DESC, r.sort_order ASC;
```

### 查询游戏的默认主题
```sql
SELECT t.*
FROM theme_info t
INNER JOIN theme_game_relation r ON t.theme_id = r.theme_id
WHERE r.game_id = 1 AND r.is_default = 1
LIMIT 1;
```

---

## 📁 相关文件

- `kids-game-backend/theme-system-migration-v3.sql` - 主迁移脚本
- `kids-game-backend/theme-init-data.sql` - 初始化数据
- `kids-game-backend/theme-test-data.sql` - 测试数据
- [主题API参考](./theme-api-reference.md)

---

*文档更新时间：2026-03-16*
