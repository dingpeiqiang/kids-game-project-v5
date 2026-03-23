# t_parent 残留清理总结

## 📊 清理概览

本次清理针对项目中 `t_parent` 相关的废弃代码进行了系统性的标记和整理。

---

## ✅ 已完成的清理工作

### 1. **Entity 实体类标记废弃**

| 文件 | 修改内容 | 状态 |
|------|----------|------|
| [`Parent.java`](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-dao\src\main\java\com\kidgame\dao\entity\Parent.java) | 添加 `@Deprecated` + 迁移说明 | ✅ 完成 |
| [`ParentLimit.java`](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-dao\src\main\java\com\kidgame\dao\entity\ParentLimit.java) | 添加 `@Deprecated` + 迁移说明 | ✅ 完成 |

**修改示例:**
```java
/**
 * 家长用户实体
 * @deprecated 已废弃，请使用 BaseUser + UserProfile 替代（user_type=1 表示家长）
 */
@Deprecated
@Data
@TableName("t_parent")
public class Parent implements Serializable {
```

---

### 2. **Mapper 接口标记废弃**

| 文件 | 修改内容 | 状态 |
|------|----------|------|
| [`ParentMapper.java`](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-dao\src\main\java\com\kidgame\dao\mapper\ParentMapper.java) | 添加 `@Deprecated` + 迁移说明 | ✅ 完成 |
| [`ParentLimitMapper.java`](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-dao\src\main\java\com\kidgame\dao\mapper\ParentLimitMapper.java) | 添加 `@Deprecated` + 迁移说明 | ✅ 完成 |

**修改示例:**
```java
/**
 * 家长用户 Mapper
 * @deprecated 已废弃，请使用 BaseUserMapper 替代
 */
@Deprecated
@Mapper
public interface ParentMapper extends BaseMapper<Parent> {
}
```

---

### 3. **Service 服务层标记废弃**

| 文件 | 修改内容 | 状态 |
|------|----------|------|
| [`ParentService.java`](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-service\src\main\java\com\kidgame\service\ParentService.java) | 添加 `@Deprecated` + 迁移说明 | ✅ 完成 |
| [`ParentServiceImpl.java`](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-service\src\main\java\com\kidgame\service\impl\ParentServiceImpl.java) | 添加 `@Deprecated` + 迁移说明 | ✅ 完成 |

**修改示例:**
```java
/**
 * 家长业务服务
 * @deprecated 已废弃，请使用 UserService + UserRelationService + UserControlConfigService 替代
 */
@Deprecated
public interface ParentService extends IService<Parent> {
```

---

### 4. **Controller 控制层标记废弃**

| 文件 | 修改内容 | 状态 |
|------|----------|------|
| [`ParentController.java`](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-web\src\main\java\com\kidgame\web\controller\ParentController.java) | 添加 `@Deprecated` + 迁移说明 | ✅ 完成 |

**注意**: Controller 保留 API 接口以维持向后兼容性，但标记为废弃。

---

### 5. **创建迁移指南文档**

📄 **文档**: [`PARENT_LIMIT_MIGRATION_GUIDE.md`](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\PARENT_LIMIT_MIGRATION_GUIDE.md)

**内容包括:**
- 迁移目标和核心差异
- 代码迁移示例（Entity/Mapper/Service/DTO）
- 需要修改的文件清单
- 数据库迁移 SQL 脚本
- 注意事项和迁移策略
- 迁移检查清单

---

## 📈 清理统计

| 类别 | 文件数 | 修改行数 |
|------|--------|----------|
| Entity 类 | 2 | +4 行 |
| Mapper 接口 | 2 | +4 行 |
| Service 接口 | 1 | +2 行 |
| Service 实现 | 1 | +2 行 |
| Controller | 1 | +2 行 |
| 文档 | 1 | +186 行 |
| **总计** | **8** | **+200 行** |

---

## 🔍 残留检测结果

### ✅ 已标记废弃的文件（8 个）

1. `Parent.java` - Entity ✅
2. `ParentMapper.java` - Mapper ✅
3. `ParentService.java` - Service Interface ✅
4. `ParentServiceImpl.java` - Service Implementation ✅
5. `ParentController.java` - Controller ✅
6. `ParentLimit.java` - Entity ✅
7. `ParentLimitMapper.java` - Mapper ✅
8. `PARENT_LIMIT_MIGRATION_GUIDE.md` - Migration Guide ✅

### ⚠️ 保留使用旧架构的代码（需后续迁移）

以下代码仍在使用 `ParentLimit`，但由于是核心业务逻辑，建议按照迁移指南逐步替换：

1. **ParentServiceImpl.java** (高优先级)
   - `getParentLimit()` 方法
   - `updateParentLimit()` 方法
   - `addChild()` 方法

2. **GameServiceImpl.java** (高优先级)
   - `checkGamePermission()` 方法
   - `getBlockedGameIds()` 方法

3. **QuestionServiceImpl.java** (中优先级)
   - `submitAnswer()` 方法中的疲劳点计算

---

## 🎯 架构对比

### 旧架构（已废弃）
```
t_parent (家长表)
├── parent_id (PK)
├── phone
├── password
└── ...

t_parent_limit (管控规则表)
├── limit_id (PK)
├── parent_id (FK)
├── kid_id (FK)
└── ...
```

### 新架构（推荐）
```
t_user (统一用户表)
├── user_id (PK)
├── user_type (0-KID, 1-PARENT, 2-ADMIN)
├── username
└── ...

t_user_profile (扩展信息表)
├── profile_id (PK)
├── user_id (FK)
├── profile_type (KID_INFO/PARENT_INFO)
└── ext_info_json

t_user_control_config (管控配置表)
├── config_id (PK)
├── user_id (FK - 被管控者)
├── guardian_id (FK - 监护人)
└── ...
```

---

## 📋 下一步行动建议

### 短期（1-2 周）
- [ ] 阅读并理解 [`PARENT_LIMIT_MIGRATION_GUIDE.md`](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\PARENT_LIMIT_MIGRATION_GUIDE.md)
- [ ] 在测试环境执行数据库迁移 SQL
- [ ] 开始迁移 `ParentServiceImpl` 的核心方法

### 中期（2-4 周）
- [ ] 完成 `GameServiceImpl` 的时长检查逻辑迁移
- [ ] 完成 `QuestionServiceImpl` 的疲劳点计算迁移
- [ ] 更新相关单元测试

### 长期（1-2 个月）
- [ ] 完全切换到 `UserControlConfig` 架构
- [ ] 删除 `ParentLimit` 相关代码
- [ ] 下线旧的 `/api/parent/*` 接口

---

## ⚠️ 重要提示

1. **向后兼容**: 所有废弃的类和方法都保留了 `@Deprecated` 注解，确保现有功能不受影响
2. **渐进式迁移**: 建议采用渐进式迁移策略，避免大规模重构带来的风险
3. **充分测试**: 每个迁移步骤都需要在测试环境充分验证
4. **数据备份**: 在执行数据库迁移前，务必备份生产数据

---

## 📚 参考文档

- [UserControlConfig Entity](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-dao\src\main\java\com\kidgame\dao\entity\UserControlConfig.java)
- [BaseUser Entity](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-dao\src\main\java\com\kidgame\dao\entity\BaseUser.java)
- [schema_v2.sql](file://d:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-backend\kids-game-web\src\main\resources\schema_v2.sql) (新架构建表脚本)

---

*清理完成时间：2026-03-23*  
*清理执行人：AI Assistant*
