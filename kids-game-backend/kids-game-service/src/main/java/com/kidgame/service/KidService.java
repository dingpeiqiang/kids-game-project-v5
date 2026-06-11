package com.kidgame.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kidgame.dao.entity.Kid;
import com.kidgame.service.dto.*;

import java.util.List;

/**
 * 儿童用户业务服务
 */
public interface KidService extends IService<Kid> {

    /**
     * 儿童注册
     * @param dto 注册请求
     * @return 儿童信息
     */
    Kid register(KidRegisterDTO dto);

    /**
     * 儿童登录（用户名密码登录）
     * @param username 用户名
     * @param password 密码
     * @return 儿童信息
     */
    Kid login(String username, String password);

    /**
     * 获取儿童信息
     * @param kidId 儿童ID
     * @return 儿童信息
     */
    Kid getKidInfo(Long kidId);

    /**
     * 更新儿童游学币
     * @param kidId 儿童ID
     * @param changeType 变化类型（1-消耗，2-获得，3-重置）
     * @param changePoints 变化点数
     * @param relatedId 关联ID
     */
    void updateFatiguePoints(Long kidId, Integer changeType, Integer changePoints, Long relatedId);

    /**
     * 获取儿童当前游学币
     * @param kidId 儿童ID
     * @return 游学币
     */
    Integer getFatiguePoints(Long kidId);

    /**
     * 重置每日游学币
     * @param kidId 儿童 ID
     * @return 重置后的游学币
     */
    Integer resetDailyFatiguePoints(Long kidId);

    /**
     * 绑定家长
     * @param kidId 儿童ID
     * @param parentId 家长ID
     */
    void bindParent(Long kidId, Long parentId);

    /**
     * 获取儿童的所有家长信息（用于孩子首页显示）
     * @param kidId 儿童ID
     * @return 家长信息列表
     */
    List<ParentInfoDTO> getParentsForKid(Long kidId);

    /**
     * 解除与家长的绑定关系
     * @param dto 解除绑定请求
     */
    void unbindParent(UnbindParentDTO dto);

    /**
     * 更新主要监护人
     * @param dto 更新主要监护人请求
     */
    void updatePrimaryGuardian(UpdatePrimaryGuardianDTO dto);

    /**
     * 搜索已注册的孩子（按用户名或昵称模糊搜索）
     * @param keyword 搜索关键词
     * @return 孩子信息列表
     */
    List<Kid> searchKids(String keyword);
}
