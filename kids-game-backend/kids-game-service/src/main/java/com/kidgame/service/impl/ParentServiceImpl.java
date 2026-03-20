package com.kidgame.service.impl;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.dao.entity.AnswerRecord;
import com.kidgame.dao.entity.BaseUser;
import com.kidgame.dao.entity.GameRecord;
import com.kidgame.dao.entity.Kid;
import com.kidgame.dao.entity.Notification;
import com.kidgame.dao.entity.Parent;
import com.kidgame.dao.entity.ParentLimit;
import com.kidgame.dao.entity.UserRelation;
import com.kidgame.dao.mapper.AnswerRecordMapper;
import com.kidgame.dao.mapper.BaseUserMapper;
import com.kidgame.dao.mapper.GameRecordMapper;
import com.kidgame.dao.mapper.KidMapper;
import com.kidgame.dao.mapper.ParentLimitMapper;
import com.kidgame.dao.mapper.ParentMapper;
import com.kidgame.dao.mapper.UserRelationMapper;
import com.kidgame.service.FatiguePointsService;
import com.kidgame.service.NotificationService;
import com.kidgame.service.ParentService;
import com.kidgame.service.dto.AddChildDTO;
import com.kidgame.service.dto.BindExistingKidDTO;
import com.kidgame.service.dto.ParentLimitDTO;
import com.kidgame.service.dto.ParentLoginDTO;
import com.kidgame.service.dto.ParentOptionDTO;
import com.kidgame.service.dto.ParentRegisterDTO;
import com.kidgame.service.dto.UpdateChildPermissionsDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * 家长业务服务实现
 */
@Slf4j
@Service
public class ParentServiceImpl extends ServiceImpl<ParentMapper, Parent> implements ParentService {

    @Autowired
    private ParentLimitMapper parentLimitMapper;

    @Autowired
    private KidMapper kidMapper;

    @Autowired
    private GameRecordMapper gameRecordMapper;

    @Autowired
    private AnswerRecordMapper answerRecordMapper;

    @Autowired
    private UserRelationMapper userRelationMapper;

    @Autowired
    private ParentMapper parentMapper;

    @Autowired
    private BaseUserMapper baseUserMapper;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private FatiguePointsService fatiguePointsService;

    @Value("${kidgame.parent.default-pin:0000}")
    private String defaultPin;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Parent register(ParentRegisterDTO dto) {
        // 参数校验
        if (dto.getUsername() == null || dto.getUsername().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }
        if (dto.getPhone() == null || dto.getPhone().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }
        if (dto.getPassword() == null || dto.getPassword().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }

        // 用户名长度校验
        String username = dto.getUsername().trim();
        if (username.length() < 2 || username.length() > 20) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }

        // 手机号格式校验
        String phone = dto.getPhone().trim();
        if (!phone.matches("^1[3-9]\\d{9}$")) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }

        // 检查用户名是否已注册（家长）
        LambdaQueryWrapper<BaseUser> usernameWrapper = new LambdaQueryWrapper<>();
        usernameWrapper.eq(BaseUser::getUsername, username)
                .eq(BaseUser::getUserType, 1); // 1-PARENT
        if (baseUserMapper.selectOne(usernameWrapper) != null) {
            throw new BusinessException("该用户名已被注册");
        }

        // 检查手机号是否已注册（家长）
        LambdaQueryWrapper<BaseUser> phoneWrapper = new LambdaQueryWrapper<>();
        phoneWrapper.eq(BaseUser::getUsername, phone)
                .eq(BaseUser::getUserType, 1); // 1-PARENT
        if (baseUserMapper.selectOne(phoneWrapper) != null) {
            throw new BusinessException("该手机号已注册");
        }

        // 创建家长账号（使用 BaseUser）
        BaseUser baseUser = new BaseUser();
        baseUser.setUsername(username);
        baseUser.setPassword(BCrypt.hashpw(dto.getPassword()));
        baseUser.setNickname(dto.getNickname() != null ? dto.getNickname() : "家长");
        baseUser.setUserType(1); // 1-PARENT
        baseUser.setStatus(1); // 1-正常
        long currentTime = System.currentTimeMillis();
        baseUser.setCreateTime(currentTime);
        baseUser.setUpdateTime(currentTime);
        baseUserMapper.insert(baseUser);

        // 创建家长扩展信息（使用 t_user_profile 表存储 phone 和 realName）
        // 注意：这里暂时不创建 Parent 记录，使用 BaseUser 作为主数据
        // Parent 表可能用于向后兼容或存储额外的家长特有信息

        log.info("家长注册成功. Username: {}, Phone: {}, UserId: {}", username, phone, baseUser.getUserId());

        // 返回 Parent 对象（兼容旧接口）
        Parent parent = new Parent();
        parent.setParentId(baseUser.getUserId());
        parent.setPhone(phone);
        parent.setNickname(baseUser.getNickname());
        parent.setRealName(dto.getRealName() != null ? dto.getRealName() : "");
        parent.setIsVerified(0);
        return parent;
    }

    @Override
    public Parent login(ParentLoginDTO dto) {
        // 参数校验
        if (dto.getUsername() == null || dto.getUsername().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }
        if (dto.getPassword() == null || dto.getPassword().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }

        String username = dto.getUsername().trim();

        // 查找用户（从 BaseUser 表）
        LambdaQueryWrapper<BaseUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BaseUser::getUsername, username)
                .eq(BaseUser::getUserType, 1); // 1-PARENT
        BaseUser baseUser = baseUserMapper.selectOne(wrapper);

        if (baseUser == null) {
            throw new BusinessException("用户不存在");
        }

        // 验证密码
        if (!BCrypt.checkpw(dto.getPassword(), baseUser.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD_OBJ);
        }

        // 检查用户状态
        if (baseUser.getStatus() != 1) {
            throw new BusinessException("账号已被禁用");
        }

        // 更新最后登录时间
        baseUser.setLastLoginTime(System.currentTimeMillis());
        baseUserMapper.updateById(baseUser);

        log.info("家长登录成功. Username: {}, UserId: {}", username, baseUser.getUserId());

        // 返回 Parent 对象（兼容旧接口）
        Parent parent = new Parent();
        parent.setParentId(baseUser.getUserId());
        parent.setPhone(baseUser.getUsername()); // 使用 username 作为 phone
        parent.setNickname(baseUser.getNickname());
        parent.setRealName(""); // 可以从 profile 中获取
        parent.setIsVerified(0);

        return parent;
    }

    @Override
    public boolean verifyPassword(Long parentId, String password) {
        Parent parent = getById(parentId);
        if (parent == null) {
            return false;
        }
        return BCrypt.checkpw(password, parent.getPassword());
    }

    @Override
    public ParentLimit getParentLimit(Long kidId) {
        LambdaQueryWrapper<ParentLimit> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ParentLimit::getKidId, kidId);
        ParentLimit limit = parentLimitMapper.selectOne(wrapper);

        if (limit == null) {
            // 返回默认配置
            limit = new ParentLimit();
            limit.setKidId(kidId);
            limit.setDailyDuration(60); // 默认60分钟
            limit.setSingleDuration(30); // 默认30分钟
            limit.setAllowedTimeStart("06:00");
            limit.setAllowedTimeEnd("22:00");
            limit.setAnswerGetPoints(1);
            limit.setDailyAnswerLimit(10);
        }

        return limit;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateParentLimit(ParentLimitDTO dto) {
        ParentLimit limit = parentLimitMapper.selectById(dto.getKidId());

        if (limit == null) {
            // 新增管控规则
            limit = new ParentLimit();
            limit.setKidId(dto.getKidId());
            limit.setDailyDuration(dto.getDailyDuration());
            limit.setSingleDuration(dto.getSingleDuration());
            limit.setAllowedTimeStart(dto.getAllowedTimeStart());
            limit.setAllowedTimeEnd(dto.getAllowedTimeEnd());
            limit.setAnswerGetPoints(1);
            limit.setDailyAnswerLimit(10);
            limit.setCreateTime(System.currentTimeMillis());
            limit.setUpdateTime(System.currentTimeMillis());
            parentLimitMapper.insert(limit);
        } else {
            // 更新管控规则
            limit.setDailyDuration(dto.getDailyDuration());
            limit.setSingleDuration(dto.getSingleDuration());
            limit.setAllowedTimeStart(dto.getAllowedTimeStart());
            limit.setAllowedTimeEnd(dto.getAllowedTimeEnd());
            limit.setUpdateTime(System.currentTimeMillis());
            parentLimitMapper.updateById(limit);
        }

        log.info("Parent limit updated. KidId: {}, DailyDuration: {}, SingleDuration: {}",
                dto.getKidId(), dto.getDailyDuration(), dto.getSingleDuration());
    }

    @Override
    public void remotePauseGame(Long kidId) {
        // TODO: 通过 WebSocket 推送暂停指令到前端
        log.info("Remote pause game. KidId: {}", kidId);
    }

    @Override
    public void remoteUnlockGame(Long kidId) {
        // TODO: 通过 WebSocket 推送解锁指令到前端
        log.info("Remote unlock game. KidId: {}", kidId);
    }

    @Override
    public List<Kid> getParentKids(Long parentId) {
        // 通过用户关系表查询孩子
        List<UserRelation> relations = userRelationMapper.selectKidsByParentId(parentId);

        if (relations == null || relations.isEmpty()) {
            return new ArrayList<>();
        }

        // 获取孩子详细信息
        List<Long> kidIds = relations.stream()
                .map(UserRelation::getUserB)
                .collect(java.util.stream.Collectors.toList());

        return kidMapper.selectBatchIds(kidIds);
    }

    @Override
    public List<GameRecord> getKidGameRecords(Long kidId, Integer limit) {
        return gameRecordMapper.selectByKidIdWithLimit(kidId, limit);
    }

    @Override
    public List<AnswerRecord> getKidAnswerRecords(Long kidId, Integer limit) {
        return answerRecordMapper.selectByKidIdWithLimit(kidId, limit);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void blockGame(Long kidId, Long gameId) {
        // 获取儿童信息
        Kid kid = kidMapper.selectById(kidId);
        if (kid == null) {
            throw new BusinessException(ErrorCode.KID_NOT_FOUND_OBJ);
        }
        if (kid.getParentId() == null) {
            throw new BusinessException("该儿童未绑定家长");
        }

        // 获取或创建管控规则
        LambdaQueryWrapper<ParentLimit> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ParentLimit::getKidId, kidId)
                .eq(ParentLimit::getParentId, kid.getParentId());
        ParentLimit limit = parentLimitMapper.selectOne(wrapper);

        List<Long> blockedGameIds = new ArrayList<>();
        if (limit != null && limit.getBlockedGames() != null && !limit.getBlockedGames().trim().isEmpty()) {
            try {
                blockedGameIds = objectMapper.readValue(limit.getBlockedGames(), new TypeReference<List<Long>>() {});
            } catch (Exception e) {
                log.error("解析 blockedGames JSON 失败: {}", limit.getBlockedGames(), e);
            }
        }

        // 添加到屏蔽列表
        if (!blockedGameIds.contains(gameId)) {
            blockedGameIds.add(gameId);
        }

        // 更新或创建记录
        if (limit == null) {
            limit = new ParentLimit();
            limit.setKidId(kidId);
            limit.setParentId(kid.getParentId());
            limit.setDailyDuration(60);
            limit.setSingleDuration(30);
            limit.setAllowedTimeStart("06:00");
            limit.setAllowedTimeEnd("22:00");
            limit.setAnswerGetPoints(1);
            limit.setDailyAnswerLimit(10);
            limit.setCreateTime(System.currentTimeMillis());
            limit.setUpdateTime(System.currentTimeMillis());
        } else {
            limit.setUpdateTime(System.currentTimeMillis());
        }

        try {
            limit.setBlockedGames(objectMapper.writeValueAsString(blockedGameIds));
        } catch (Exception e) {
            log.error("序列化 blockedGames 失败", e);
            throw new BusinessException("更新屏蔽列表失败");
        }

        if (limit.getLimitId() == null) {
            parentLimitMapper.insert(limit);
        } else {
            parentLimitMapper.updateById(limit);
        }

        log.info("Game blocked. KidId: {}, GameId: {}, TotalBlocked: {}", kidId, gameId, blockedGameIds.size());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void unblockGame(Long kidId, Long gameId) {
        // 获取管控规则
        LambdaQueryWrapper<ParentLimit> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ParentLimit::getKidId, kidId);
        ParentLimit limit = parentLimitMapper.selectOne(wrapper);

        if (limit == null || limit.getBlockedGames() == null || limit.getBlockedGames().trim().isEmpty()) {
            return; // 没有屏蔽的游戏
        }

        try {
            List<Long> blockedGameIds = objectMapper.readValue(limit.getBlockedGames(), new TypeReference<List<Long>>() {});
            blockedGameIds.remove(gameId);

            limit.setBlockedGames(objectMapper.writeValueAsString(blockedGameIds));
            limit.setUpdateTime(System.currentTimeMillis());
            parentLimitMapper.updateById(limit);

            log.info("Game unblocked. KidId: {}, GameId: {}, TotalBlocked: {}", kidId, gameId, blockedGameIds.size());
        } catch (Exception e) {
            log.error("更新屏蔽列表失败: {}", limit.getBlockedGames(), e);
            throw new BusinessException("更新屏蔽列表失败");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchBlockGames(Long kidId, List<Long> gameIds) {
        if (gameIds == null || gameIds.isEmpty()) {
            return;
        }

        // 获取儿童信息
        Kid kid = kidMapper.selectById(kidId);
        if (kid == null) {
            throw new BusinessException(ErrorCode.KID_NOT_FOUND_OBJ);
        }
        if (kid.getParentId() == null) {
            throw new BusinessException("该儿童未绑定家长");
        }

        // 获取或创建管控规则
        LambdaQueryWrapper<ParentLimit> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ParentLimit::getKidId, kidId)
                .eq(ParentLimit::getParentId, kid.getParentId());
        ParentLimit limit = parentLimitMapper.selectOne(wrapper);

        List<Long> blockedGameIds = new ArrayList<>();
        if (limit != null && limit.getBlockedGames() != null && !limit.getBlockedGames().trim().isEmpty()) {
            try {
                blockedGameIds = objectMapper.readValue(limit.getBlockedGames(), new TypeReference<List<Long>>() {});
            } catch (Exception e) {
                log.error("解析 blockedGames JSON 失败: {}", limit.getBlockedGames(), e);
            }
        }

        // 添加到屏蔽列表
        for (Long gameId : gameIds) {
            if (!blockedGameIds.contains(gameId)) {
                blockedGameIds.add(gameId);
            }
        }

        // 更新或创建记录
        if (limit == null) {
            limit = new ParentLimit();
            limit.setKidId(kidId);
            limit.setParentId(kid.getParentId());
            limit.setDailyDuration(60);
            limit.setSingleDuration(30);
            limit.setAllowedTimeStart("06:00");
            limit.setAllowedTimeEnd("22:00");
            limit.setAnswerGetPoints(1);
            limit.setDailyAnswerLimit(10);
            limit.setCreateTime(System.currentTimeMillis());
            limit.setUpdateTime(System.currentTimeMillis());
        } else {
            limit.setUpdateTime(System.currentTimeMillis());
        }

        try {
            limit.setBlockedGames(objectMapper.writeValueAsString(blockedGameIds));
        } catch (Exception e) {
            log.error("序列化 blockedGames 失败", e);
            throw new BusinessException("更新屏蔽列表失败");
        }

        if (limit.getLimitId() == null) {
            parentLimitMapper.insert(limit);
        } else {
            parentLimitMapper.updateById(limit);
        }

        log.info("Batch block games. KidId: {}, Count: {}, TotalBlocked: {}", kidId, gameIds.size(), blockedGameIds.size());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchUnblockGames(Long kidId, List<Long> gameIds) {
        if (gameIds == null || gameIds.isEmpty()) {
            return;
        }

        // 获取管控规则
        LambdaQueryWrapper<ParentLimit> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ParentLimit::getKidId, kidId);
        ParentLimit limit = parentLimitMapper.selectOne(wrapper);

        if (limit == null || limit.getBlockedGames() == null || limit.getBlockedGames().trim().isEmpty()) {
            return; // 没有屏蔽的游戏
        }

        try {
            List<Long> blockedGameIds = objectMapper.readValue(limit.getBlockedGames(), new TypeReference<List<Long>>() {});
            blockedGameIds.removeAll(gameIds);

            limit.setBlockedGames(objectMapper.writeValueAsString(blockedGameIds));
            limit.setUpdateTime(System.currentTimeMillis());
            parentLimitMapper.updateById(limit);


            log.info("Batch unblock games. KidId: {}, Count: {}, TotalBlocked: {}", kidId, gameIds.size(), blockedGameIds.size());
        } catch (Exception e) {
            log.error("更新屏蔽列表失败: {}", limit.getBlockedGames(), e);
            throw new BusinessException("更新屏蔽列表失败");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Kid addChild(AddChildDTO dto) {
        // 参数校验
        if (dto.getNickname() == null || dto.getNickname().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }
        if (dto.getPassword() == null || dto.getPassword().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }
        if (dto.getParentId() == null) {
            throw new BusinessException("家长ID不能为空");
        }

        // 验证家长是否存在
        Parent parent = getById(dto.getParentId());
        if (parent == null) {
            throw new BusinessException("家长不存在");
        }

        // 创建孩子账号
        Kid kid = new Kid();
        kid.setUserType(0); // 0表示儿童
        kid.setUsername("kid_" + System.currentTimeMillis()); // 生成唯一用户名
        kid.setPassword(BCrypt.hashpw(dto.getPassword()));
        kid.setNickname(dto.getNickname().trim());
        kid.setAvatar(dto.getAvatar() != null ? dto.getAvatar() : "👶"); // 默认头像
        kid.setStatus(1); // 激活状态
        kid.setGrade(dto.getGrade()); // 年级
        kid.setParentId(dto.getParentId()); // 绑定家长

        long currentTime = System.currentTimeMillis();
        kid.setCreateTime(currentTime);
        kid.setUpdateTime(currentTime);
        kid.setLastLoginTime(0L);

        kidMapper.insert(kid);

        // 创建默认的管控规则
        ParentLimit limit = new ParentLimit();
        limit.setKidId(kid.getKidId());
        limit.setParentId(dto.getParentId());
        limit.setDailyDuration(60); // 默认60分钟
        limit.setSingleDuration(30); // 默认30分钟
        limit.setAllowedTimeStart("06:00");
        limit.setAllowedTimeEnd("22:00");
        limit.setAnswerGetPoints(1);
        limit.setDailyAnswerLimit(10);
        limit.setCreateTime(currentTime);
        limit.setUpdateTime(currentTime);
        parentLimitMapper.insert(limit);

        log.info("孩子添加成功. Nickname: {}, KidId: {}, ParentId: {}", 
                dto.getNickname(), kid.getKidId(), dto.getParentId());
        return kid;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteChild(Long kidId, Long parentId) {
        // 参数校验
        if (kidId == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }

        // 获取孩子信息
        Kid kid = kidMapper.selectById(kidId);
        if (kid == null) {
            throw new BusinessException("孩子不存在");
        }

        // 验证权限：检查家长是否与孩子绑定
        LambdaQueryWrapper<UserRelation> checkWrapper = new LambdaQueryWrapper<>();
        checkWrapper.eq(UserRelation::getUserA, parentId);
        checkWrapper.eq(UserRelation::getUserB, kidId);
        checkWrapper.eq(UserRelation::getRelationType, UserRelation.RelationType.PARENT_KID);
        if (userRelationMapper.selectCount(checkWrapper) == 0) {
            throw new BusinessException("无权限删除该孩子");
        }

        // 删除孩子账号（逻辑删除）
        kidMapper.deleteById(kidId);

        // 删除关联的管控规则
        LambdaQueryWrapper<ParentLimit> limitWrapper = new LambdaQueryWrapper<>();
        limitWrapper.eq(ParentLimit::getKidId, kidId);
        parentLimitMapper.delete(limitWrapper);

        // 删除家长-孩子关系
        LambdaQueryWrapper<UserRelation> relationWrapper = new LambdaQueryWrapper<>();
        relationWrapper.eq(UserRelation::getUserB, kidId);
        userRelationMapper.delete(relationWrapper);

        // 删除游戏记录
        LambdaQueryWrapper<GameRecord> gameWrapper = new LambdaQueryWrapper<>();
        gameWrapper.eq(GameRecord::getKidId, kidId);
        gameRecordMapper.delete(gameWrapper);

        // 删除答题记录
        LambdaQueryWrapper<AnswerRecord> answerWrapper = new LambdaQueryWrapper<>();
        answerWrapper.eq(AnswerRecord::getKidId, kidId);
        answerRecordMapper.delete(answerWrapper);

        log.info("孩子删除成功. KidId: {}, ParentId: {}", kidId, parentId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateChildPermissions(UpdateChildPermissionsDTO dto) {
        // 参数校验
        if (dto.getKidId() == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ);
        }

        // 获取孩子信息
        Kid kid = kidMapper.selectById(dto.getKidId());
        if (kid == null) {
            throw new BusinessException("孩子不存在");
        }

        // 获取或创建管控规则
        LambdaQueryWrapper<ParentLimit> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ParentLimit::getKidId, dto.getKidId());
        ParentLimit limit = parentLimitMapper.selectOne(wrapper);

        if (limit == null) {
            // 创建新的管控规则
            limit = new ParentLimit();
            limit.setKidId(dto.getKidId());
            limit.setParentId(kid.getParentId());
            limit.setDailyDuration(dto.getDailyDuration() != null ? dto.getDailyDuration() : 60);
            limit.setSingleDuration(dto.getSingleDuration() != null ? dto.getSingleDuration() : 30);
            limit.setAllowedTimeStart(dto.getStartTime() != null ? dto.getStartTime() : "06:00");
            limit.setAllowedTimeEnd(dto.getEndTime() != null ? dto.getEndTime() : "22:00");
            limit.setAnswerGetPoints(1);
            limit.setDailyAnswerLimit(10);
            limit.setCreateTime(System.currentTimeMillis());
            limit.setUpdateTime(System.currentTimeMillis());
            parentLimitMapper.insert(limit);
        } else {
            // 更新管控规则
            if (dto.getDailyDuration() != null) {
                limit.setDailyDuration(dto.getDailyDuration());
            }
            if (dto.getSingleDuration() != null) {
                limit.setSingleDuration(dto.getSingleDuration());
            }
            if (dto.getStartTime() != null) {
                limit.setAllowedTimeStart(dto.getStartTime());
            }
            if (dto.getEndTime() != null) {
                limit.setAllowedTimeEnd(dto.getEndTime());
            }
            limit.setUpdateTime(System.currentTimeMillis());
            parentLimitMapper.updateById(limit);
        }

        // 疲劳点系统设置（根据enableFatiguePoints调整答题获取疲劳点）
        if (dto.getEnableFatiguePoints() != null) {
            limit.setAnswerGetPoints(dto.getEnableFatiguePoints() ? 1 : 0);
            limit.setDailyAnswerLimit(dto.getEnableFatiguePoints() ? 10 : 0);
            parentLimitMapper.updateById(limit);
        }

        log.info("孩子权限更新成功. KidId: {}, DailyDuration: {}, SingleDuration: {}, StartTime: {}, EndTime: {}, EnableFatigue: {}",
                dto.getKidId(), dto.getDailyDuration(), dto.getSingleDuration(),
                dto.getStartTime(), dto.getEndTime(), dto.getEnableFatiguePoints());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void bindExistingKid(BindExistingKidDTO dto) {
        // 参数校验
        if (dto.getKidUsername() == null || dto.getKidUsername().trim().isEmpty()) {
            throw new BusinessException("孩子用户名不能为空");
        }
        if (dto.getParentId() == null) {
            throw new BusinessException("家长ID不能为空");
        }

        // 查找孩子账号
        LambdaQueryWrapper<Kid> kidWrapper = new LambdaQueryWrapper<>();
        kidWrapper.eq(Kid::getUsername, dto.getKidUsername().trim());
        kidWrapper.eq(Kid::getUserType, 0);
        Kid kid = kidMapper.selectOne(kidWrapper);

        if (kid == null) {
            throw new BusinessException("孩子账号不存在");
        }

        // 检查是否已存在绑定关系
        LambdaQueryWrapper<UserRelation> checkWrapper = new LambdaQueryWrapper<>();
        checkWrapper.eq(UserRelation::getUserA, dto.getParentId());
        checkWrapper.eq(UserRelation::getUserB, kid.getKidId());
        checkWrapper.eq(UserRelation::getRelationType, UserRelation.RelationType.PARENT_KID);
        if (userRelationMapper.selectCount(checkWrapper) > 0) {
            throw new BusinessException("该家长已与孩子绑定");
        }

        // 创建绑定关系
        UserRelation relation = new UserRelation();
        relation.setRelationType(UserRelation.RelationType.PARENT_KID);
        relation.setUserA(dto.getParentId());
        relation.setUserB(kid.getKidId());
        relation.setRoleType(UserRelation.RoleType.fromCode(dto.getRoleType() != null ? dto.getRoleType() : 3));
        relation.setIsPrimary(dto.getIsPrimary() != null ? dto.getIsPrimary() : false);
        relation.setPermissionLevel(dto.getPermissionLevel() != null ? dto.getPermissionLevel() : 3);
        relation.setStatus(1);
        long currentTime = System.currentTimeMillis();
        relation.setCreateTime(currentTime);
        relation.setUpdateTime(currentTime);
        userRelationMapper.insert(relation);

        log.info("家长绑定已有孩子成功. KidId: {}, KidUsername: {}, ParentId: {}, RoleType: {}",
                kid.getKidId(), dto.getKidUsername(), dto.getParentId(), dto.getRoleType());
    }

    @Override
    public List<Parent> getParentsForKid(Long kidId) {
        // 查询所有家长关系
        List<UserRelation> relations = userRelationMapper.selectGuardiansByKidId(kidId);

        if (relations == null || relations.isEmpty()) {
            return new ArrayList<>();
        }

        // 获取家长详细信息
        List<Long> parentIds = relations.stream()
                .map(UserRelation::getUserA)
                .collect(java.util.stream.Collectors.toList());

        return parentMapper.selectBatchIds(parentIds);
    }

    @Override
    public List<Parent> getAllParents() {
        // 查询所有状态正常的家长
        LambdaQueryWrapper<Parent> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Parent::getIsVerified, 1); // 只返回已认证的家长
        wrapper.orderByDesc(Parent::getCreateTime);
        return parentMapper.selectList(wrapper);
    }

    @Override
    public List<ParentOptionDTO> getParentOptions() {
        // 查询所有已认证的家长
        LambdaQueryWrapper<Parent> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Parent::getIsVerified, 1);
        wrapper.orderByDesc(Parent::getCreateTime);
        List<Parent> parents = parentMapper.selectList(wrapper);

        // 转换为选项DTO
        return parents.stream().map(parent -> {
            ParentOptionDTO dto = new ParentOptionDTO();
            dto.setParentId(parent.getParentId());
            dto.setNickname(parent.getNickname());
            dto.setRealName(parent.getRealName());
            // 手机号脱敏显示：138****5678
            dto.setMaskedPhone(maskPhone(parent.getPhone()));
            dto.setCreateTime(parent.getCreateTime());
            return dto;
        }).collect(java.util.stream.Collectors.toList());
    }

    /**
     * 手机号脱敏
     * @param phone 手机号
     * @return 脱敏后的手机号
     */
    private String maskPhone(String phone) {
        if (phone == null || phone.length() != 11) {
            return phone;
        }
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long requestBindKid(Long parentId, String kidUsername, Integer roleType, Boolean isPrimary) {
        // 参数校验
        if (kidUsername == null || kidUsername.trim().isEmpty()) {
            throw new BusinessException("孩子用户名不能为空");
        }
        if (parentId == null) {
            throw new BusinessException("家长ID不能为空");
        }

        // 验证家长是否存在
        Parent parent = getById(parentId);
        if (parent == null) {
            throw new BusinessException("家长不存在");
        }

        // 查找孩子账号
        LambdaQueryWrapper<Kid> kidWrapper = new LambdaQueryWrapper<>();
        kidWrapper.eq(Kid::getUsername, kidUsername.trim());
        kidWrapper.eq(Kid::getUserType, 0);
        Kid kid = kidMapper.selectOne(kidWrapper);

        if (kid == null) {
            throw new BusinessException("孩子账号不存在");
        }

        // 检查是否已存在待确认或已建立的绑定关系
        LambdaQueryWrapper<UserRelation> checkWrapper = new LambdaQueryWrapper<>();
        checkWrapper.eq(UserRelation::getUserA, parentId);
        checkWrapper.eq(UserRelation::getUserB, kid.getKidId());
        checkWrapper.eq(UserRelation::getRelationType, UserRelation.RelationType.PARENT_KID);
        checkWrapper.in(UserRelation::getStatus, 0, 1); // 0-待确认, 1-已建立
        if (userRelationMapper.selectCount(checkWrapper) > 0) {
            throw new BusinessException("已存在绑定关系或待确认请求");
        }

        // 创建待确认的绑定关系
        UserRelation relation = new UserRelation();
        relation.setRelationType(UserRelation.RelationType.PARENT_KID);
        relation.setUserA(parentId);
        relation.setUserB(kid.getKidId());
        relation.setRoleType(UserRelation.RoleType.fromCode(roleType != null ? roleType : 3));
        relation.setIsPrimary(isPrimary != null ? isPrimary : false);
        relation.setPermissionLevel(3);
        relation.setStatus(0); // 待确认
        long currentTime = System.currentTimeMillis();
        relation.setCreateTime(currentTime);
        relation.setUpdateTime(currentTime);
        userRelationMapper.insert(relation);

        // 创建通知发送给孩子
        String title = "家长绑定请求";
        String content = String.format("家长 %s 请求与您建立监护关系，请确认。", parent.getNickname());
        notificationService.createBindRequest(
            kid.getKidId(),
            0, // 儿童用户
            parentId,
            1, // 家长用户
            title,
            content,
            relation.getRelationId(),
            null
        );

        log.info("家长请求绑定孩子（待确认）. KidId: {}, KidUsername: {}, ParentId: {}, RoleType: {}, RelationId: {}",
                kid.getKidId(), kidUsername, parentId, roleType, relation.getRelationId());

        return relation.getRelationId();
    }

    @Override
    public Integer getFatiguePoints(Long parentId) {
        // 使用统一的疲劳值服务
        return fatiguePointsService.getFatiguePoints(parentId, 1);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateFatiguePoints(Long parentId, Integer changeType, Integer changePoints, Long relatedId) {
        // 使用统一的疲劳值服务
        String relatedType = changeType == 1 ? "GAME_SESSION" : "QUESTION";
        String remark = changeType == 1 ? "游戏消耗疲劳点" : "答题获得疲劳点";
        fatiguePointsService.updateFatiguePoints(parentId, 1, changeType, changePoints, relatedId, relatedType, remark);
    }
}
