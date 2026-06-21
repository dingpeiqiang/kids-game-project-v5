package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.kidgame.common.model.PageResult;
import com.kidgame.dao.entity.QuestionCollection;
import com.kidgame.dao.mapper.QuestionCollectionMapper;
import com.kidgame.service.CollectionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 题目收藏业务服务实现
 */
@Slf4j
@Service
public class CollectionServiceImpl implements CollectionService {

    @Autowired
    private QuestionCollectionMapper questionCollectionMapper;

    @Override
    public PageResult<QuestionCollection> page(Long userId, long page, long size) {
        LambdaQueryWrapper<QuestionCollection> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(QuestionCollection::getUserId, userId)
                .orderByDesc(QuestionCollection::getCreateTime);
        Page<QuestionCollection> pageReq = new Page<>(page, size);
        Page<QuestionCollection> result = questionCollectionMapper.selectPage(pageReq, wrapper);
        return PageResult.of(result.getCurrent(), result.getSize(), result.getTotal(), result.getRecords());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean toggle(Long userId, Long questionId, String note) {
        QuestionCollection existing = findCollection(userId, questionId);
        if (existing != null) {
            // 已收藏 → 取消
            questionCollectionMapper.deleteById(existing.getCollectionId());
            log.info("Collection removed. userId={}, questionId={}", userId, questionId);
            return false;
        }
        // 未收藏 → 添加
        QuestionCollection collection = new QuestionCollection();
        collection.setUserId(userId);
        collection.setQuestionId(questionId);
        collection.setNote(note);
        collection.setCreateTime(System.currentTimeMillis());
        questionCollectionMapper.insert(collection);
        log.info("Collection added. userId={}, questionId={}", userId, questionId);
        return true;
    }

    @Override
    public boolean isCollected(Long userId, Long questionId) {
        return findCollection(userId, questionId) != null;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void remove(Long userId, Long questionId) {
        LambdaQueryWrapper<QuestionCollection> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(QuestionCollection::getUserId, userId)
                .eq(QuestionCollection::getQuestionId, questionId);
        questionCollectionMapper.delete(wrapper);
    }

    // ==================== 内部方法 ====================

    private QuestionCollection findCollection(Long userId, Long questionId) {
        LambdaQueryWrapper<QuestionCollection> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(QuestionCollection::getUserId, userId)
                .eq(QuestionCollection::getQuestionId, questionId);
        return questionCollectionMapper.selectOne(wrapper);
    }
}
