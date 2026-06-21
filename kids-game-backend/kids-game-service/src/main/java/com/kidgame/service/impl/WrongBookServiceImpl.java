package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.common.model.PageResult;
import com.kidgame.dao.entity.Question;
import com.kidgame.dao.entity.WrongQuestion;
import com.kidgame.dao.mapper.WrongQuestionMapper;
import com.kidgame.service.QuestionService;
import com.kidgame.service.WrongBookService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 错题本业务服务实现
 */
@Slf4j
@Service
public class WrongBookServiceImpl implements WrongBookService {

    /** 复习间隔：1天（毫秒） */
    private static final long REVIEW_INTERVAL_MS = 24L * 60 * 60 * 1000;
    /** 掌握度上限 */
    private static final int MASTERY_MAX = 3;

    @Autowired
    private WrongQuestionMapper wrongQuestionMapper;

    @Autowired
    private QuestionService questionService;

    @Override
    public PageResult<WrongQuestion> page(Long userId, Long subjectId, Integer masteryLevel, Integer status, long page, long size) {
        LambdaQueryWrapper<WrongQuestion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WrongQuestion::getUserId, userId);
        if (subjectId != null) {
            wrapper.eq(WrongQuestion::getSubjectId, subjectId);
        }
        if (masteryLevel != null) {
            wrapper.eq(WrongQuestion::getMasteryLevel, masteryLevel);
        }
        if (status != null) {
            wrapper.eq(WrongQuestion::getStatus, status);
        }
        wrapper.orderByDesc(WrongQuestion::getLastWrongTime);
        Page<WrongQuestion> pageReq = new Page<>(page, size);
        Page<WrongQuestion> result = wrongQuestionMapper.selectPage(pageReq, wrapper);
        return PageResult.of(result.getCurrent(), result.getSize(), result.getTotal(), result.getRecords());
    }

    @Override
    public List<WrongQuestion> listDueReview(Long userId) {
        long now = System.currentTimeMillis();
        LambdaQueryWrapper<WrongQuestion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WrongQuestion::getUserId, userId)
                .ne(WrongQuestion::getStatus, 0)
                .isNotNull(WrongQuestion::getNextReviewTime)
                .le(WrongQuestion::getNextReviewTime, now)
                .orderByAsc(WrongQuestion::getNextReviewTime);
        return wrongQuestionMapper.selectList(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public WrongQuestion review(Long userId, Long questionId, String userAnswer, boolean isCorrect) {
        WrongQuestion wq = findWrongQuestion(userId, questionId);
        long now = System.currentTimeMillis();
        int currentMastery = wq.getMasteryLevel() != null ? wq.getMasteryLevel() : 0;
        if (isCorrect) {
            // 答对：掌握度 +1（上限3），达到3则 status=0
            int newMastery = Math.min(currentMastery + 1, MASTERY_MAX);
            wq.setMasteryLevel(newMastery);
            if (newMastery >= MASTERY_MAX) {
                wq.setStatus(0);
            }
        } else {
            // 答错：重置掌握度
            wq.setMasteryLevel(0);
            wq.setStatus(1);
            wq.setWrongCount((wq.getWrongCount() != null ? wq.getWrongCount() : 0) + 1);
            wq.setLastWrongTime(now);
            wq.setLastWrongAnswer(userAnswer);
        }
        wq.setReviewCount((wq.getReviewCount() != null ? wq.getReviewCount() : 0) + 1);
        wq.setLastReviewTime(now);
        wq.setNextReviewTime(now + REVIEW_INTERVAL_MS);
        wq.setUpdateTime(now);
        wrongQuestionMapper.updateById(wq);
        log.info("Wrong question reviewed. userId={}, questionId={}, isCorrect={}, mastery={}",
                userId, questionId, isCorrect, wq.getMasteryLevel());
        return wq;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void markMastered(Long userId, Long questionId) {
        WrongQuestion wq = findWrongQuestion(userId, questionId);
        long now = System.currentTimeMillis();
        wq.setMasteryLevel(MASTERY_MAX);
        wq.setStatus(0);
        wq.setUpdateTime(now);
        wrongQuestionMapper.updateById(wq);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void remove(Long userId, Long questionId) {
        LambdaQueryWrapper<WrongQuestion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WrongQuestion::getUserId, userId)
                .eq(WrongQuestion::getQuestionId, questionId);
        if (wrongQuestionMapper.delete(wrapper) <= 0) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND_OBJ, "错题不存在");
        }
    }

    @Override
    public Map<String, Object> stats(Long userId) {
        LambdaQueryWrapper<WrongQuestion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WrongQuestion::getUserId, userId);
        List<WrongQuestion> all = wrongQuestionMapper.selectList(wrapper);
        long now = System.currentTimeMillis();
        int total = all.size();
        int dueReview = 0;
        int mastered = 0;
        Map<String, Integer> bySubject = new HashMap<>();
        for (WrongQuestion wq : all) {
            // 待复习：status != 0 且 nextReviewTime <= now
            if (wq.getStatus() != null && wq.getStatus() != 0
                    && wq.getNextReviewTime() != null && wq.getNextReviewTime() <= now) {
                dueReview++;
            }
            // 已掌握：status == 0 或 masteryLevel >= 3
            if ((wq.getStatus() != null && wq.getStatus() == 0)
                    || (wq.getMasteryLevel() != null && wq.getMasteryLevel() >= MASTERY_MAX)) {
                mastered++;
            }
            // 按学科分组
            String subjectKey = wq.getSubjectId() != null ? wq.getSubjectId().toString() : "null";
            bySubject.merge(subjectKey, 1, Integer::sum);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("total", total);
        result.put("dueReview", dueReview);
        result.put("mastered", mastered);
        result.put("bySubject", bySubject);
        return result;
    }

    // ==================== 内部方法 ====================

    private WrongQuestion findWrongQuestion(Long userId, Long questionId) {
        LambdaQueryWrapper<WrongQuestion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WrongQuestion::getUserId, userId)
                .eq(WrongQuestion::getQuestionId, questionId);
        WrongQuestion wq = wrongQuestionMapper.selectOne(wrapper);
        if (wq == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND_OBJ, "错题不存在");
        }
        return wq;
    }
}
