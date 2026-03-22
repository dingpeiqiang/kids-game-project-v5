package com.kidgame.service.impl;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.constant.GameConstants;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.common.util.JwtUtil;
import com.kidgame.common.util.RedisUtil;
import com.kidgame.dao.entity.*;
import com.kidgame.dao.mapper.*;
import com.kidgame.service.FatiguePointsService;
import com.kidgame.service.KidService;
import com.kidgame.service.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 儿童用户业务服务实现
 */
@Slf4j
@Service
public class KidServiceImpl extends ServiceImpl<KidMapper, Kid> implements KidService {

    @Autowired
    private KidMapper kidMapper;

    @Autowired
    private FatiguePointsLogMapper fatiguePointsLogMapper;

    @Autowired
    private UserProfileMapper userProfileMapper;

    @Autowired
    private RedisUtil redisUtil;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRelationMapper userRelationMapper;

    @Autowired
    private ParentMapper parentMapper;

    @Autowired
    private FatiguePointsService fatiguePointsService;

    @Value("${kidgame.game.fatigue-points.initial:10}")
    private Integer initialFatiguePoints;

    private static final String FATIGUE_POINTS_CACHE_KEY = GameConstants.LogPrefix.FATIGUE_POINTS_CACHE;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Kid register(KidRegisterDTO dto) {
        validateRegisterParams(dto);

        LambdaQueryWrapper<Kid> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Kid::getUsername, dto.getUsername().trim());
        wrapper.eq(Kid::getUserType, 0);
        if (kidMapper.selectOne(wrapper) != null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "用户名已存在");
        }

        Kid kid = createNewKid(dto);
        kidMapper.insert(kid);

        // 根据家长手机号查询家长并创建关系
        createParentRelation(kid.getKidId(), dto);

        // 初始化疲劳点数
        fatiguePointsService.initializeFatiguePoints(kid.getKidId(), 0, initialFatiguePoints);

        log.info("儿童注册成功. Username: {}, KidId: {}, ParentPhone: {}",
                dto.getUsername(), kid.getKidId(), dto.getParentPhone());
        return kid;
    }

    /**
     * 验证注册参数
     */
    private void validateRegisterParams(KidRegisterDTO dto) {
        if (dto.getUsername() == null || dto.getUsername().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, GameConstants.ErrorMessage.USERNAME_EMPTY);
        }
        if (dto.getPassword() == null || dto.getPassword().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, GameConstants.ErrorMessage.PASSWORD_EMPTY);
        }
        if (dto.getParentPhone() == null || dto.getParentPhone().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "请提供家长手机号");
        }

        String username = dto.getUsername().trim();
        if (username.length() < GameConstants.Validation.USERNAME_MIN_LENGTH
                || username.length() > GameConstants.Validation.USERNAME_MAX_LENGTH) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, GameConstants.ErrorMessage.USERNAME_LENGTH_INVALID);
        }

        // 验证家长手机号格式
        String parentPhone = dto.getParentPhone().trim();
        if (!parentPhone.matches("^1[3-9]\\d{9}$")) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "家长手机号格式不正确");
        }
    }

    /**
     * 创建新儿童
     */
    private Kid createNewKid(KidRegisterDTO dto) {
        long currentTime = System.currentTimeMillis();
        Kid kid = new Kid();
        kid.setUserType(0);
        kid.setUsername(dto.getUsername().trim());
        kid.setPassword(JwtUtil.encodePassword(dto.getPassword()));
        kid.setNickname(dto.getNickname() != null ? dto.getNickname() : dto.getUsername());
        kid.setAvatar(dto.getAvatar());
        kid.setStatus(1);
        kid.setCreateTime(currentTime);
        kid.setUpdateTime(currentTime);
        return kid;
    }

    /**
     * 创建儿童扩展信息
     */
    private void createKidProfile(Long kidId, KidRegisterDTO dto) {
        UserProfile profile = new UserProfile();
        profile.setUserId(kidId);
        profile.setProfileType(UserProfile.ProfileType.KID_INFO);
        profile.setProfileData(new JSONObject()
                .fluentPut("grade", dto.getGrade())
                .fluentPut("fatigue_points", initialFatiguePoints)
                .fluentPut("daily_answer_points", 0)
                .toJSONString());
        profile.setCreateTime(System.currentTimeMillis());
        profile.setUpdateTime(System.currentTimeMillis());
        userProfileMapper.insert(profile);
    }

    /**
     * 创建家长-孩子关系（通过家长手机号查询）
     */
    private void createParentRelation(Long kidId, KidRegisterDTO dto) {
        // 根据家长手机号查询家长
        String parentPhone = dto.getParentPhone().trim();
        LambdaQueryWrapper<Parent> parentWrapper = new LambdaQueryWrapper<>();
        parentWrapper.eq(Parent::getPhone, parentPhone);
        Parent parent = parentMapper.selectOne(parentWrapper);

        if (parent == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "家长账号不存在，请先注册家长账号");
        }

        if (parent.getIsVerified() != 1) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "家长账号未认证，无法绑定");
        }

        // 检查是否已存在绑定关系
        LambdaQueryWrapper<UserRelation> checkWrapper = new LambdaQueryWrapper<>();
        checkWrapper.eq(UserRelation::getUserA, parent.getParentId());
        checkWrapper.eq(UserRelation::getUserB, kidId);
        checkWrapper.eq(UserRelation::getRelationType, UserRelation.RelationType.PARENT_KID);
        if (userRelationMapper.selectCount(checkWrapper) > 0) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "该家长已与此孩子绑定");
        }

        // 创建绑定关系
        UserRelation relation = new UserRelation();
        relation.setRelationType(UserRelation.RelationType.PARENT_KID);
        relation.setUserA(parent.getParentId());
        relation.setUserB(kidId);
        // 默认角色为监护人(3)，默认权限为完全控制(3)，状态为已建立(1)
        relation.setRoleType(UserRelation.RoleType.fromCode(dto.getParentRoleType() != null ? dto.getParentRoleType() : UserRelation.RoleType.GUARDIAN.getCode()));
        relation.setIsPrimary(true); // 通过手机号注册的，该家长就是主要监护人
        relation.setPermissionLevel(UserRelation.PERMISSION_FULL_CONTROL);
        relation.setStatus(UserRelation.STATUS_ESTABLISHED);
        long currentTime = System.currentTimeMillis();
        relation.setCreateTime(currentTime);
        relation.setUpdateTime(currentTime);
        userRelationMapper.insert(relation);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Kid login(String username, String password) {
        // 参数校验
        if (username == null || username.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "用户名不能为空");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "密码不能为空");
        }

        // 用户名长度校验
        username = username.trim();
        if (username.length() < 2 || username.length() > 20) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "用户名长度为2-20个字符");
        }

        // 根据用户名查询用户（儿童用户）
        LambdaQueryWrapper<Kid> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Kid::getUsername, username);
        wrapper.eq(Kid::getUserType, 0);
        Kid kid = kidMapper.selectOne(wrapper);

        if (kid == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND_OBJ, "用户名不存在");
        }

        // 验证密码
        if (!JwtUtil.matches(password, kid.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD_OBJ, "密码错误");
        }

        // 生成 JWT Token
        String token = jwtUtil.generateToken(kid.getKidId().toString());

        // 克隆对象避免修改原始数据
        Kid resultKid = new Kid();
        resultKid.setKidId(kid.getKidId());
        resultKid.setUsername(kid.getUsername());
        resultKid.setNickname(kid.getNickname());
        resultKid.setAvatar(kid.getAvatar());

        // 获取扩展信息（grade, fatigue_points等）
        UserProfile profile = getKidProfile(kid.getKidId());
        if (profile != null) {
            JSONObject extInfo = JSON.parseObject(profile.getProfileData());
            resultKid.setGrade(extInfo.getString("grade"));
            resultKid.setFatiguePoints(extInfo.getInteger("fatigue_points"));
            resultKid.setDailyAnswerPoints(extInfo.getInteger("daily_answer_points"));
        }

        // 将token放入deviceId字段返回（前端需要）
        resultKid.setDeviceId(token);

        log.info("Kid login success. Username: {}, KidId: {}", username, kid.getKidId());
        return resultKid;
    }

    /**
     * 获取儿童扩展信息
     */
    private UserProfile getKidProfile(Long kidId) {
        LambdaQueryWrapper<UserProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProfile::getUserId, kidId);
        wrapper.eq(UserProfile::getProfileType, UserProfile.ProfileType.KID_INFO);
        return userProfileMapper.selectOne(wrapper);
    }

    @Override
    public Kid getKidInfo(Long kidId) {
        return getById(kidId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateFatiguePoints(Long kidId, Integer changeType, Integer changePoints, Long relatedId) {
        // 使用统一的疲劳值服务
        String relatedType = changeType == 1 ? "GAME_SESSION" : "QUESTION";
        String remark = changeType == 1 ? "游戏消耗疲劳点" : "答题获得疲劳点";
        fatiguePointsService.updateFatiguePoints(kidId, 0, changeType, changePoints, relatedId, relatedType, remark);
    }

    @Override
    public Integer getFatiguePoints(Long kidId) {
        // 使用统一的疲劳值服务
        return fatiguePointsService.getFatiguePoints(kidId, 0);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer resetDailyFatiguePoints(Long kidId) {
        // 使用统一的疲劳值服务
        return fatiguePointsService.resetDailyFatiguePoints(kidId, 0);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void bindParent(Long kidId, Long parentId) {
        Kid kid = getById(kidId);
        if (kid == null) {
            throw new BusinessException(ErrorCode.KID_NOT_FOUND_OBJ);
        }

        // 检查是否已存在绑定关系
        LambdaQueryWrapper<UserRelation> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserRelation::getUserA, parentId);
        wrapper.eq(UserRelation::getUserB, kidId);
        wrapper.eq(UserRelation::getRelationType, UserRelation.RelationType.PARENT_KID);
        UserRelation existing = userRelationMapper.selectOne(wrapper);

        if (existing != null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "该家长已与孩子绑定");
        }

        // 通过创建用户关系来绑定家长
        UserRelation relation = new UserRelation();
        relation.setRelationType(UserRelation.RelationType.PARENT_KID);
        relation.setUserA(parentId);
        relation.setUserB(kidId);
        relation.setRoleType(UserRelation.RoleType.GUARDIAN);
        relation.setIsPrimary(false);
        relation.setPermissionLevel(3);
        relation.setStatus(1);
        relation.setCreateTime(System.currentTimeMillis());
        relation.setUpdateTime(System.currentTimeMillis());
        userRelationMapper.insert(relation);

        log.info("Parent bound. KidId: {}, ParentId: {}", kidId, parentId);
    }

    @Override
    public List<ParentInfoDTO> getParentsForKid(Long kidId) {
        // 查询所有家长关系
        List<UserRelation> relations = userRelationMapper.selectGuardiansByKidId(kidId);

        if (relations == null || relations.isEmpty()) {
            return new ArrayList<>();
        }

        // 获取家长详细信息
        List<Long> parentIds = relations.stream()
                .map(UserRelation::getUserA)
                .collect(Collectors.toList());

        List<Parent> parents = parentMapper.selectBatchIds(parentIds);

        // 组装返回结果
        List<ParentInfoDTO> result = new ArrayList<>();
        for (UserRelation relation : relations) {
            Parent parent = parents.stream()
                    .filter(p -> p.getParentId().equals(relation.getUserA()))
                    .findFirst()
                    .orElse(null);

            if (parent != null) {
                ParentInfoDTO dto = new ParentInfoDTO();
                dto.setParentId(parent.getParentId());
                dto.setNickname(parent.getNickname());
                dto.setAvatar(parent.getRealName());
                dto.setRoleType(relation.getRoleType().getCode());
                dto.setRoleTypeDesc(relation.getRoleType().getDesc());
                dto.setIsPrimary(relation.getIsPrimary());
                dto.setPermissionLevel(relation.getPermissionLevel());
                dto.setCreateTime(relation.getCreateTime());
                result.add(dto);
            }
        }

        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void unbindParent(UnbindParentDTO dto) {
        // 检查儿童是否存在
        Kid kid = getById(dto.getKidId());
        if (kid == null) {
            throw new BusinessException(ErrorCode.KID_NOT_FOUND_OBJ);
        }

        // 查询关系
        LambdaQueryWrapper<UserRelation> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserRelation::getUserA, dto.getParentId());
        wrapper.eq(UserRelation::getUserB, dto.getKidId());
        wrapper.eq(UserRelation::getRelationType, UserRelation.RelationType.PARENT_KID);
        UserRelation relation = userRelationMapper.selectOne(wrapper);

        if (relation == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "绑定关系不存在");
        }

        // 检查是否是主要监护人
        if (relation.getIsPrimary()) {
            // 检查是否还有其他家长
            long otherParentsCount = userRelationMapper.selectGuardiansByKidId(dto.getKidId()).stream()
                    .filter(r -> !r.getRelationId().equals(relation.getRelationId()))
                    .count();

            if (otherParentsCount == 0) {
                throw new BusinessException(ErrorCode.PARAM_ERROR, "无法解除最后一位主要监护人，请先转移监护权");
            }
        }

        // 删除关系
        userRelationMapper.deleteById(relation.getRelationId());

        log.info("Parent unbound. KidId: {}, ParentId: {}, OperatorId: {}",
                dto.getKidId(), dto.getParentId(), dto.getOperatorId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updatePrimaryGuardian(UpdatePrimaryGuardianDTO dto) {
        // 检查儿童是否存在
        Kid kid = getById(dto.getKidId());
        if (kid == null) {
            throw new BusinessException(ErrorCode.KID_NOT_FOUND_OBJ);
        }

        // 检查新监护人是否存在且已绑定
        LambdaQueryWrapper<UserRelation> newWrapper = new LambdaQueryWrapper<>();
        newWrapper.eq(UserRelation::getUserA, dto.getNewPrimaryParentId());
        newWrapper.eq(UserRelation::getUserB, dto.getKidId());
        newWrapper.eq(UserRelation::getRelationType, UserRelation.RelationType.PARENT_KID);
        UserRelation newRelation = userRelationMapper.selectOne(newWrapper);

        if (newRelation == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "新监护人未与孩子绑定");
        }

        // 取消旧的主要监护人
        LambdaQueryWrapper<UserRelation> oldWrapper = new LambdaQueryWrapper<>();
        oldWrapper.eq(UserRelation::getUserB, dto.getKidId());
        oldWrapper.eq(UserRelation::getRelationType, UserRelation.RelationType.PARENT_KID);
        oldWrapper.eq(UserRelation::getIsPrimary, true);
        List<UserRelation> oldPrimaryRelations = userRelationMapper.selectList(oldWrapper);

        for (UserRelation oldRelation : oldPrimaryRelations) {
            oldRelation.setIsPrimary(false);
            oldRelation.setUpdateTime(System.currentTimeMillis());
            userRelationMapper.updateById(oldRelation);
        }

        // 设置新的主要监护人
        newRelation.setIsPrimary(true);
        newRelation.setUpdateTime(System.currentTimeMillis());
        userRelationMapper.updateById(newRelation);

        log.info("Primary guardian updated. KidId: {}, NewPrimaryParentId: {}, OperatorId: {}",
                dto.getKidId(), dto.getNewPrimaryParentId(), dto.getOperatorId());
    }

    @Override
    public List<Kid> searchKids(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "搜索关键词不能为空");
        }

        String trimmedKeyword = keyword.trim();

        // 模糊搜索用户名或昵称
        LambdaQueryWrapper<Kid> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Kid::getUserType, 0); // 只搜索儿童用户
        wrapper.and(w -> w.like(Kid::getUsername, trimmedKeyword)
                .or()
                .like(Kid::getNickname, trimmedKeyword));
        wrapper.eq(Kid::getStatus, 1); // 只搜索正常状态的用户
        wrapper.orderByAsc(Kid::getCreateTime); // 按创建时间排序
        wrapper.last("LIMIT 20"); // 限制返回数量

        List<Kid> kids = kidMapper.selectList(wrapper);

        log.info("Search kids. Keyword: {}, Result count: {}", keyword, kids.size());
        return kids;
    }
}
