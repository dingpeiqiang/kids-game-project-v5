# GTRS v1.0.0 主题系统迁移指南

## 📋 概述

本文档提供了将现有主题系统从旧版格式迁移到 GTRS v1.0.0 规范的完整指南。

## 🎯 迁移目标

1. ✅ 将所有现有主题数据迁移到 GTRS v1.0.0 规范
2. ✅ 保持数据库结构不变，仅更新 `config_json` 字段
3. ✅ 实现平滑过渡，支持新老格式并存（可选）
4. ✅ 提供数据备份和回滚机制

## 📦 迁移准备

### 1. 备份数据库

```bash
# MySQL 备份
mysqldump -u root -p kids_game_db > kids_game_db_backup_$(date +%Y%m%d).sql

# 或通过数据库管理工具导出 theme_info 表
```

### 2. 确认依赖项

确保以下依赖已安装：

**后端依赖** (pom.xml):
```xml
<!-- JSON Schema 验证 -->
<dependency>
    <groupId>com.networknt</groupId>
    <artifactId>json-schema-validator</artifactId>
    <version>1.0.87</version>
</dependency>
```

**前端依赖** (package.json):
```json
{
  "ajv": "^8.12.0"
}
```

## 🚀 迁移步骤

### 方式一：通过 API 自动迁移（推荐）

#### 1. 启动后端服务

```bash
cd kids-game-backend
mvn spring-boot:run
```

#### 2. 调用迁移接口

**检测主题格式：**
```bash
curl -X POST http://localhost:8080/api/theme/detect-format \
  -H "Content-Type: application/json" \
  -d '{"themeJson": "{...}"}'
```

**迁移旧版主题：**
```bash
curl -X POST http://localhost:8080/api/theme/migrate-to-gtrs \
  -H "Content-Type: application/json" \
  -d '{
    "oldThemeJson": "{...}",
    "themeId": "game_001_theme_default",
    "gameId": "game_001",
    "themeName": "默认主题"
  }'
```

**校验 GTRS 主题：**
```bash
curl -X POST http://localhost:8080/api/theme/validate-gtrs \
  -H "Content-Type: application/json" \
  -d '{"themeJson": "{...}"}'
```

### 方式二：通过 SQL 手动迁移

#### 1. 执行迁移 SQL

```bash
mysql -u root -p kids_game_db < migrate_theme_to_gtrs.sql
```

#### 2. 验证迁移结果

```sql
-- 检查 GTRS 格式主题数量
SELECT COUNT(*) as gtrs_theme_count
FROM `theme_info`
WHERE JSON_EXTRACT(config_json, '$.specMeta.specName') = 'GTRS';

-- 检查特定主题的配置
SELECT
    theme_id,
    theme_name,
    JSON_EXTRACT(config_json, '$.specMeta.specVersion') as version,
    JSON_EXTRACT(config_json, '$.themeInfo.themeId') as theme_id_field
FROM `theme_info`
LIMIT 10;
```

### 方式三：使用 Java 迁移工具

创建迁移工具类：

```java
import com.kidgame.service.ThemeMigrationService;
import com.kidgame.dao.entity.ThemeInfo;
import com.kidgame.dao.mapper.ThemeInfoMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class ThemeMigrationRunner implements CommandLineRunner {

    @Autowired
    private ThemeMigrationService migrationService;

    @Autowired
    private ThemeInfoMapper themeInfoMapper;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("开始主题数据迁移...");

        // 获取所有需要迁移的主题
        List<ThemeInfo> themes = themeInfoMapper.selectList(null);

        for (ThemeInfo theme : themes) {
            try {
                String oldConfig = theme.getConfigJson();

                // 检查是否已为 GTRS 格式
                if (migrationService.isGTRSFormat(oldConfig)) {
                    System.out.println("跳过已迁移主题: " + theme.getThemeName());
                    continue;
                }

                // 执行迁移
                String gtrsConfig = migrationService.migrateToGTRS(
                    oldConfig,
                    "game_" + theme.getOwnerId() + "_theme_" + theme.getThemeId(),
                    "game_" + theme.getOwnerId(),
                    theme.getThemeName()
                );

                // 更新数据库
                theme.setConfigJson(gtrsConfig);
                themeInfoMapper.updateById(theme);

                System.out.println("迁移成功: " + theme.getThemeName());
            } catch (Exception e) {
                System.err.println("迁移失败: " + theme.getThemeName() + ", 错误: " + e.getMessage());
            }
        }

        System.out.println("主题数据迁移完成！");
    }
}
```

运行迁移工具：

```bash
cd kids-game-backend
mvn spring-boot:run -Dspring-boot.run.arguments="--migrate-themes=true"
```

## ✅ 验证迁移

### 1. 数据验证

```sql
-- 检查所有主题的 GTRS 格式
SELECT
    theme_id,
    theme_name,
    CASE
        WHEN JSON_EXTRACT(config_json, '$.specMeta.specName') = 'GTRS' THEN '✓'
        ELSE '✗'
    END as is_gtrs,
    JSON_EXTRACT(config_json, '$.specMeta.specVersion') as version,
    JSON_LENGTH(config_json, '$.resources.images.login') as login_images,
    JSON_LENGTH(config_json, '$.resources.audio.bgm') as bgm_count
FROM `theme_info`;
```

### 2. 功能验证

**前端验证：**
1. 打开 GTRS 主题编辑器
2. 加载已迁移的主题
3. 检查资源是否正确显示
4. 验证校验功能是否正常

**游戏端验证：**
1. 启动游戏（贪吃蛇/植物大战僵尸）
2. 切换到已迁移的主题
3. 检查资源是否正确加载
4. 验证样式是否正确应用

### 3. API 验证

```bash
# 获取主题列表
curl http://localhost:8080/api/theme/list

# 下载并验证主题
curl http://localhost:8080/api/theme/download?id=1 | jq '.data.configJson' > theme.json

# 校验主题格式
curl -X POST http://localhost:8080/api/theme/validate-gtrs \
  -H "Content-Type: application/json" \
  -d '{"themeJson": '"$(cat theme.json)"'}'
```

## 🔄 回滚方案

如果迁移出现问题，执行以下回滚步骤：

### 方式一：从备份恢复

```bash
# 恢复整个数据库
mysql -u root -p kids_game_db < kids_game_db_backup_20250318.sql
```

### 方式二：从备份表恢复

```sql
-- 删除当前数据
DELETE FROM `theme_info`;

-- 从备份表恢复
INSERT INTO `theme_info` SELECT * FROM `theme_info_backup_20250318`;
```

### 方式三：通过 API 回滚（如果支持）

```bash
curl -X POST http://localhost:8080/api/theme/rollback \
  -H "Content-Type: application/json" \
  -d '{"backupDate": "20250318"}'
```

## 📝 迁移检查清单

- [ ] 数据库已备份
- [ ] 后端依赖已安装
- [ ] 前端依赖已安装
- [ ] 迁移脚本已测试
- [ ] 迁移方案已确定（API/SQL/Java）
- [ ] 迁移已执行
- [ ] 迁移结果已验证
- [ ] 前端功能已测试
- [ ] 游戏端功能已测试
- [ ] API 接口已测试
- [ ] 备份数据已清理（确认无误后）

## 🎨 迁移后优化建议

1. **清理旧格式数据**（可选）：
   ```sql
   DELETE FROM `theme_info`
   WHERE JSON_EXTRACT(config_json, '$.specMeta.specName') != 'GTRS';
   ```

2. **优化索引**：
   ```sql
   CREATE INDEX idx_gtrs_spec ON theme_info(
     (JSON_EXTRACT(config_json, '$.specMeta.specName'))
   );
   ```

3. **定期验证**：
   ```sql
   -- 创建定期验证脚本
   SELECT
     theme_id,
     theme_name,
     JSON_EXTRACT(config_json, '$.specMeta.specVersion') as version
   FROM `theme_info`
   WHERE JSON_EXTRACT(config_json, '$.specMeta.specName') != 'GTRS';
   ```

## 📞 技术支持

如遇到迁移问题，请提供以下信息：
1. 错误日志
2. 数据库版本
3. 迁移方式（API/SQL/Java）
4. 失败的主题 ID
5. 完整的错误堆栈

## 📚 相关文档

- [GTRS v1.0.0 官方规范](./GTRS_V1_SPECIFICATION.md)
- [GTRS Schema 校验文件](./kids-game-frontend/src/schemas/gtrs-schema.json)
- [ThemeMigrationService 源码](./kids-game-backend/kids-game-service/src/main/java/com/kidgame/service/ThemeMigrationService.java)

---

**迁移成功标准：**
- ✅ 所有主题的 `config_json` 都包含 GTRS 规范的 `specMeta` 字段
- ✅ 主题数据通过 Schema 校验
- ✅ 前端编辑器可以正常加载和编辑
- ✅ 游戏端可以正常加载和应用主题
- ✅ 用户可以正常购买和下载主题
