# 游戏配置功能实施指南

**日期**: 2026-03-23  
**状态**: 🟡 进行中  
**目标**: 实现基于 t_game_config 表的游戏资源配置功能

---

## 📊 现有资源清单

### ✅ 已有的文件

| 文件 | 路径 | 状态 |
|------|------|------|
| GameConfigEntity.java | kids-game-dao/.../entity/ | ✅ 已完成 |
| GameConfigMapper.java | kids-game-dao/.../mapper/ | ✅ 已完成 |
| t_game_config 表 | 数据库 | ✅ 已存在 |

### ⏳ 需要创建的文件

1. **GameConfigService.java** - Service 接口
2. **GameConfigServiceImpl.java** - Service 实现
3. **GameConfigDTO.java** - 数据传输对象（可选）

---

## 🎯 功能设计

### 核心功能

```java
public interface GameConfigService {
    
    // ========== 单个配置操作 ==========
    
    /**
     * 保存或更新游戏配置
     */
    void saveGameConfig(Long gameId, String configKey, String configValue, String description);
    
    /**
     * 获取游戏配置值
     */
    String getGameConfig(Long gameId, String configKey);
    
    /**
     * 删除游戏配置
     */
    void deleteGameConfig(Long gameId, String configKey);
    
    // ========== 批量操作 ==========
    
    /**
     * 批量保存游戏配置
     */
    void batchSaveGameConfig(Long gameId, Map<String, String> configs);
    
    /**
     * 获取游戏所有配置
     */
    Map<String, String> getAllGameConfigs(Long gameId);
    
    /**
     * 根据前缀获取配置（如获取所有 screenshot_*）
     */
    List<GameConfigEntity> getConfigsByPrefix(Long gameId, String keyPrefix);
}
```

---

## 📝 实现代码

### 1. GameConfigService.java

```java
package com.kidgame.service;

import com.kidgame.dao.entity.GameConfigEntity;

import java.util.List;
import java.util.Map;

/**
 * 游戏配置服务接口
 */
public interface GameConfigService {
    
    /**
     * 保存或更新游戏配置
     * @param gameId 游戏 ID
     * @param configKey 配置键
     * @param configValue 配置值
     * @param description 配置描述
     */
    void saveGameConfig(Long gameId, String configKey, String configValue, String description);
    
    /**
     * 获取游戏配置值
     * @param gameId 游戏 ID
     * @param configKey 配置键
     * @return 配置值，不存在返回 null
     */
    String getGameConfig(Long gameId, String configKey);
    
    /**
     * 删除游戏配置
     * @param gameId 游戏 ID
     * @param configKey 配置键
     */
    void deleteGameConfig(Long gameId, String configKey);
    
    /**
     * 批量保存游戏配置
     * @param gameId 游戏 ID
     * @param configs 配置 Map
     */
    void batchSaveGameConfig(Long gameId, Map<String, String> configs);
    
    /**
     * 获取游戏所有配置
     * @param gameId 游戏 ID
     * @return 配置 Map
     */
    Map<String, String> getAllGameConfigs(Long gameId);
    
    /**
     * 根据前缀获取配置
     * @param gameId 游戏 ID
     * @param keyPrefix 键前缀
     * @return 配置列表
     */
    List<GameConfigEntity> getConfigsByPrefix(Long gameId, String keyPrefix);
}
```

---

### 2. GameConfigServiceImpl.java

```java
package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.kidgame.dao.entity.GameConfigEntity;
import com.kidgame.dao.mapper.GameConfigMapper;
import com.kidgame.service.GameConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 游戏配置服务实现
 */
@Slf4j
@Service
public class GameConfigServiceImpl implements GameConfigService {
    
    @Autowired
    private GameConfigMapper gameConfigMapper;
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveGameConfig(Long gameId, String configKey, String configValue, String description) {
        log.debug("保存游戏配置。GameId: {}, Key: {}", gameId, configKey);
        
        // 查询是否已存在
        GameConfigEntity existing = gameConfigMapper.selectOne(
            new LambdaQueryWrapper<GameConfigEntity>()
                .eq(GameConfigEntity::getGameId, gameId)
                .eq(GameConfigEntity::getConfigKey, configKey)
        );
        
        if (existing != null) {
            // 更新
            existing.setConfigValue(configValue);
            if (description != null) {
                existing.setDescription(description);
            }
            existing.setUpdateTime(System.currentTimeMillis());
            gameConfigMapper.updateById(existing);
            log.debug("游戏配置已更新。ConfigId: {}", existing.getConfigId());
        } else {
            // 新增
            GameConfigEntity config = new GameConfigEntity();
            config.setGameId(gameId);
            config.setConfigKey(configKey);
            config.setConfigValue(configValue);
            config.setDescription(description);
            config.setCreateTime(System.currentTimeMillis());
            config.setUpdateTime(System.currentTimeMillis());
            gameConfigMapper.insert(config);
            log.debug("游戏配置已创建。ConfigId: {}", config.getConfigId());
        }
    }
    
    @Override
    public String getGameConfig(Long gameId, String configKey) {
        GameConfigEntity config = gameConfigMapper.selectOne(
            new LambdaQueryWrapper<GameConfigEntity>()
                .eq(GameConfigEntity::getGameId, gameId)
                .eq(GameConfigEntity::getConfigKey, configKey)
        );
        
        return config != null ? config.getConfigValue() : null;
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteGameConfig(Long gameId, String configKey) {
        log.info("删除游戏配置。GameId: {}, Key: {}", gameId, configKey);
        
        gameConfigMapper.delete(
            new LambdaQueryWrapper<GameConfigEntity>()
                .eq(GameConfigEntity::getGameId, gameId)
                .eq(GameConfigEntity::getConfigKey, configKey)
        );
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchSaveGameConfig(Long gameId, Map<String, String> configs) {
        log.info("批量保存游戏配置。GameId: {}, Count: {}", gameId, configs.size());
        
        for (Map.Entry<String, String> entry : configs.entrySet()) {
            saveGameConfig(gameId, entry.getKey(), entry.getValue(), null);
        }
    }
    
    @Override
    public Map<String, String> getAllGameConfigs(Long gameId) {
        List<GameConfigEntity> configs = gameConfigMapper.selectList(
            new LambdaQueryWrapper<GameConfigEntity>()
                .eq(GameConfigEntity::getGameId, gameId)
        );
        
        return configs.stream()
            .collect(Collectors.toMap(
                GameConfigEntity::getConfigKey,
                GameConfigEntity::getConfigValue
            ));
    }
    
    @Override
    public List<GameConfigEntity> getConfigsByPrefix(Long gameId, String keyPrefix) {
        return gameConfigMapper.selectList(
            new LambdaQueryWrapper<GameConfigEntity>()
                .eq(GameConfigEntity::getGameId, gameId)
                .like(GameConfigEntity::getConfigKey, keyPrefix)
        );
    }
}
```

---

## 🔧 集成到 AdminService

### 修改 AdminServiceImpl.java

在 `AdminServiceImpl` 中添加依赖并恢复被注释的代码：

```java
@Service
public class AdminServiceImpl implements AdminService {
    
    @Autowired
    private GameMapper gameMapper;
    
    @Autowired
    private GameConfigService gameConfigService;  // ✅ 新增
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Game createGame(GameCreateDTO dto) {
        // 1. 创建游戏主体
        Game game = new Game();
        game.setGameCode(dto.getGameCode());
        game.setGameName(dto.getGameName());
        game.setCategory(dto.getCategory());
        game.setGrade(dto.getGrade());
        game.setIconUrl(dto.getIconUrl());
        // ❌ 已删除的字段（不再设置）
        // game.setCoverUrl(dto.getCoverUrl());
        // game.setResourceUrl(dto.getResourceUrl());
        // game.setDescription(dto.getDescription());
        game.setModulePath(dto.getModulePath());
        game.setSortOrder(dto.getSortOrder());
        game.setConsumePointsPerMinute(dto.getConsumePointsPerMinute());
        game.setStatus(dto.getStatus());
        
        if (game.getGameCode() == null || game.getGameCode().trim().isEmpty()) {
            game.setGameCode(generateGameCode(dto.getGameName()));
        }
        
        game.setCreateTime(System.currentTimeMillis());
        game.setUpdateTime(System.currentTimeMillis());
        game.setDeleted(0);
        
        gameMapper.insert(game);
        
        // 2. ✅ 保存资源配置到 t_game_config 表
        saveGameResources(game.getGameId(), dto);
        
        log.info("创建游戏成功。GameId: {}, GameCode: {}", game.getGameId(), game.getGameCode());
        
        return game;
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateGame(Long gameId, GameUpdateDTO dto) {
        Game game = gameMapper.selectById(gameId);
        if (game == null) {
            throw new RuntimeException("游戏不存在");
        }
        
        // 1. 更新游戏基本信息
        if (dto.getGameName() != null) {
            game.setGameName(dto.getGameName());
        }
        if (dto.getCategory() != null) {
            game.setCategory(dto.getCategory());
        }
        if (dto.getGrade() != null) {
            game.setGrade(dto.getGrade());
        }
        if (dto.getIconUrl() != null) {
            game.setIconUrl(dto.getIconUrl());
        }
        if (dto.getModulePath() != null) {
            game.setModulePath(dto.getModulePath());
        }
        if (dto.getSortOrder() != null) {
            game.setSortOrder(dto.getSortOrder());
        }
        
        game.setUpdateTime(System.currentTimeMillis());
        gameMapper.updateById(game);
        
        // 2. ✅ 更新资源配置
        updateGameResources(gameId, dto);
        
        log.info("更新游戏成功。GameId: {}", gameId);
    }
    
    // ========== 辅助方法 ==========
    
    /**
     * 保存游戏资源配置
     */
    private void saveGameResources(Long gameId, GameCreateDTO dto) {
        Map<String, String> configs = new HashMap<>();
        
        if (dto.getCoverUrl() != null && !dto.getCoverUrl().isEmpty()) {
            configs.put("cover_url", dto.getCoverUrl());
            configs.put("cover_url_desc", "游戏封面图");
        }
        if (dto.getResourceUrl() != null && !dto.getResourceUrl().isEmpty()) {
            configs.put("resource_url", dto.getResourceUrl());
            configs.put("resource_url_desc", "游戏资源 CDN 地址");
        }
        if (dto.getDescription() != null && !dto.getDescription().isEmpty()) {
            configs.put("description", dto.getDescription());
            configs.put("description_desc", "游戏描述");
        }
        
        if (!configs.isEmpty()) {
            // 注意：需要处理带 _desc 的键
            for (Map.Entry<String, String> entry : configs.entrySet()) {
                if (entry.getKey().endsWith("_desc")) {
                    continue; // 跳过描述，单独处理
                }
                
                String key = entry.getKey();
                String value = entry.getValue();
                String descKey = key + "_desc";
                String desc = configs.get(descKey);
                
                gameConfigService.saveGameConfig(gameId, key, value, desc);
            }
        }
    }
    
    /**
     * 更新游戏资源配置
     */
    private void updateGameResources(Long gameId, GameUpdateDTO dto) {
        // 更新封面图
        if (dto.getCoverUrl() != null) {
            gameConfigService.saveGameConfig(gameId, "cover_url", dto.getCoverUrl(), "游戏封面图");
        }
        // 更新资源地址
        if (dto.getResourceUrl() != null) {
            gameConfigService.saveGameConfig(gameId, "resource_url", dto.getResourceUrl(), "游戏资源 CDN 地址");
        }
        // 更新描述
        if (dto.getDescription() != null) {
            gameConfigService.saveGameConfig(gameId, "description", dto.getDescription(), "游戏描述");
        }
    }
}
```

---

## 📋 常用的配置键约定

| 配置键 | 说明 | 示例值 |
|--------|------|--------|
| `cover_url` | 游戏封面图 | `https://cdn.example.com/cover.jpg` |
| `resource_url` | 游戏资源包地址 | `https://cdn.example.com/game.zip` |
| `description` | 游戏描述 | `这是一个有趣的儿童益智游戏...` |
| `screenshot_1` | 截图 1 | `https://cdn.example.com/s1.jpg` |
| `screenshot_2` | 截图 2 | `https://cdn.example.com/s2.jpg` |
| `screenshot_3` | 截图 3 | `https://cdn.example.com/s3.jpg` |
| `play_guide` | 玩法指南 | `点击开始按钮进入游戏...` |
| `version` | 版本号 | `1.0.0` |
| `min_players` | 最小玩家数 | `1` |
| `max_players` | 最大玩家数 | `4` |
| `difficulty` | 难度等级 | `easy/medium/hard` |

---

## ✅ 测试用例

### Service 层测试

```java
@SpringBootTest
class GameConfigServiceTest {
    
    @Autowired
    private GameConfigService gameConfigService;
    
    @Test
    void testSaveAndGetConfig() {
        Long gameId = 1L;
        
        // 保存配置
        gameConfigService.saveGameConfig(gameId, "cover_url", "https://example.com/cover.jpg", "封面图");
        
        // 获取配置
        String coverUrl = gameConfigService.getGameConfig(gameId, "cover_url");
        assertEquals("https://example.com/cover.jpg", coverUrl);
    }
    
    @Test
    void testBatchSaveConfigs() {
        Long gameId = 2L;
        Map<String, String> configs = new HashMap<>();
        configs.put("cover_url", "https://example.com/cover.jpg");
        configs.put("description", "游戏描述");
        configs.put("version", "1.0.0");
        
        gameConfigService.batchSaveGameConfig(gameId, configs);
        
        Map<String, String> allConfigs = gameConfigService.getAllGameConfigs(gameId);
        assertEquals(3, allConfigs.size());
        assertTrue(allConfigs.containsKey("cover_url"));
        assertTrue(allConfigs.containsKey("description"));
    }
    
    @Test
    void testDeleteConfig() {
        Long gameId = 3L;
        gameConfigService.saveGameConfig(gameId, "temp_key", "temp_value", "临时配置");
        
        // 删除配置
        gameConfigService.deleteGameConfig(gameId, "temp_key");
        
        // 验证已删除
        String value = gameConfigService.getGameConfig(gameId, "temp_key");
        assertNull(value);
    }
}
```

---

## 🚀 实施步骤

### Step 1: 创建 Service 接口和实现 ✅

- [x] GameConfigEntity.java (已存在)
- [x] GameConfigMapper.java (已存在)
- [ ] GameConfigService.java (待创建)
- [ ] GameConfigServiceImpl.java (待创建)

### Step 2: 修改 AdminServiceImpl ✅

- [ ] 注入 GameConfigService
- [ ] 恢复 createGame 中被注释的代码（改为调用 Service）
- [ ] 恢复 updateGame 中被注释的代码（改为调用 Service）
- [ ] 添加辅助方法：saveGameResources, updateGameResources

### Step 3: 编译测试 ✅

```bash
mvn clean compile -DskipTests
mvn test -Dtest=GameConfigServiceTest
```

### Step 4: 集成测试 🔴

使用 Postman 或 Swagger 测试 API：
- POST /admin/games - 创建游戏（包含资源配置）
- PUT /admin/games/{id} - 更新游戏（更新资源配置）
- GET /admin/games/{id}/configs - 获取游戏配置列表

---

## 📊 架构优势

### 职责分离 ✅

```
t_game (核心信息)
├─ game_id, game_code
├─ game_name, category
├─ icon_url, module_path
└─ status, sort_order

t_game_config (扩展配置)
├─ cover_url
├─ resource_url
├─ description
├─ screenshots
└─ play_guide

theme_info (视觉主题)
├─ styles (颜色/字体)
├─ assets (图片)
└─ audio (音效)
```

### 灵活性 ✅

- ✅ 新增配置类型无需修改表结构
- ✅ 支持动态添加任意数量的配置项
- ✅ 每个游戏可以有完全不同的配置集合

### 性能优化 ✅

- ✅ 唯一索引保证查询效率
- ✅ 可以按需缓存热点配置
- ✅ 支持批量操作

---

**下一步**: 立即创建 GameConfigService 和 GameConfigServiceImpl 文件！
