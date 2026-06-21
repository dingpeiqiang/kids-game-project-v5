package com.kidgame.service.impl;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.dao.entity.DailySession;
import com.kidgame.dao.entity.Question;
import com.kidgame.dao.entity.UserProfile;
import com.kidgame.dao.mapper.DailySessionMapper;
import com.kidgame.dao.mapper.UserProfileMapper;
import com.kidgame.service.PracticeService;
import com.kidgame.service.QuestionService;
import com.kidgame.service.dto.AnswerDTO;
import com.kidgame.service.dto.PracticeStartDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 每日练习会话业务服务实现
 */
@Slf4j
@Service
public class PracticeServiceImpl extends ServiceImpl<DailySessionMapper, DailySession> implements PracticeService {

    /** 默认题目数量 */
    private static final int DEFAULT_QUESTION_COUNT = 5;

    /** 内存缓存：sessionId → 题目ID列表 */
    private final Map<Long, List<Long>> sessionQuestionCache = new ConcurrentHashMap<>();

    @Autowired
    private DailySessionMapper dailySessionMapper;

    @Autowired
    private QuestionService questionService;

    @Autowired
    private UserProfileMapper userProfileMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public DailySession start(Long userId, PracticeStartDTO dto) {
        // 获取儿童学龄
        String grade = getKidGrade(userId);
        if (!StringUtils.hasText(grade)) {
            throw new BusinessException(ErrorCode.PARAM_ERROR_OBJ, "未设置儿童学龄，无法开始练习");
        }

        int questionCount = dto.getQuestionCount() != null && dto.getQuestionCount() > 0
                ? dto.getQuestionCount() : DEFAULT_QUESTION_COUNT;

        // 抽题
        List<Long> questionIds = new ArrayList<>();
        List<Long> excludeIds = new ArrayList<>();
        for (int i = 0; i < questionCount; i++) {
            try {
                QuestionService.QuestionQuery query = new QuestionService.QuestionQuery()
                        .grade(grade)
                        .subjectId(dto.getSubjectId())
                        .knowledgePointIds(dto.getKnowledgePointIds())
                        .difficultyRange(dto.getDifficultyRange())
                        .questionType(dto.getQuestionType())
                        .excludeQuestionIds(excludeIds);
                Question q = questionService.getRandomQuestion(query);
                if (q == null || q.getQuestionId() == null) {
                    break;
                }
                questionIds.add(q.getQuestionId());
                excludeIds.add(q.getQuestionId());
            } catch (BusinessException e) {
                // 题库不足，停止抽题
                log.warn("Practice start: not enough questions. userId={}, got={}/{}, error={}",
                        userId, questionIds.size(), questionCount, e.getMsg());
                break;
            }
        }
        if (questionIds.isEmpty()) {
            throw new BusinessException(ErrorCode.QUESTION_NOT_FOUND_OBJ, "未找到符合条件的题目");
        }

        // 创建会话
        long now = System.currentTimeMillis();
        DailySession session = new DailySession();
        session.setUserId(userId);
        session.setSessionDate(LocalDate.now());
        session.setSubjectId(dto.getSubjectId());
        session.setKnowledgePointIds(dto.getKnowledgePointIds() != null ? JSON.toJSONString(dto.getKnowledgePointIds()) : null);
        session.setDifficultyRange(dto.getDifficultyRange());
        session.setTotalCount(questionIds.size());
        session.setAnsweredCount(0);
        session.setCorrectCount(0);
        session.setPointsEarned(0);
        session.setDuration(0);
        session.setSource(StringUtils.hasText(dto.getSource()) ? dto.getSource() : "DAILY");
        session.setSourceId(dto.getSourceId());
        session.setStatus(0);
        session.setStartTime(now);
        session.setCreateTime(now);
        session.setUpdateTime(now);
        dailySessionMapper.insert(session);

        // 缓存题目ID列表
        sessionQuestionCache.put(session.getSessionId(), questionIds);

        log.info("Practice session started. userId={}, sessionId={}, questionCount={}",
                userId, session.getSessionId(), questionIds.size());
        return session;
    }

    @Override
    public Question nextQuestion(Long sessionId) {
        DailySession session = getById(sessionId);
        List<Long> questionIds = sessionQuestionCache.get(sessionId);
        if (questionIds == null || questionIds.isEmpty()) {
            throw new BusinessException(ErrorCode.BUSINESS_ERROR_OBJ, "会话题目已失效，请重新开始练习");
        }
        int index = session.getAnsweredCount() != null ? session.getAnsweredCount() : 0;
        if (index >= questionIds.size()) {
            // 已答完所有题目
            return null;
        }
        Question question = questionService.getById(questionIds.get(index));
        if (question == null) {
            throw new BusinessException(ErrorCode.QUESTION_NOT_FOUND_OBJ);
        }
        return sanitizeForExam(question);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AnswerDTO.Result submit(Long sessionId, AnswerDTO dto) {
        DailySession session = getById(sessionId);
        if (session.getStatus() != null && session.getStatus() != 0) {
            throw new BusinessException(ErrorCode.BUSINESS_ERROR_OBJ, "会话已结束，无法提交答案");
        }
        // 设置会话ID和儿童ID
        dto.setSessionId(sessionId);
        dto.setKidId(session.getUserId());

        // 调用题目服务判分
        AnswerDTO.Result result = questionService.submitAnswer(dto);

        // 更新会话统计
        long now = System.currentTimeMillis();
        int answered = (session.getAnsweredCount() != null ? session.getAnsweredCount() : 0) + 1;
        int correct = session.getCorrectCount() != null ? session.getCorrectCount() : 0;
        int points = session.getPointsEarned() != null ? session.getPointsEarned() : 0;
        if (Boolean.TRUE.equals(result.getIsCorrect())) {
            correct++;
        }
        if (result.getGetPoints() != null) {
            points += result.getGetPoints();
        }
        session.setAnsweredCount(answered);
        session.setCorrectCount(correct);
        session.setPointsEarned(points);
        session.setUpdateTime(now);
        dailySessionMapper.updateById(session);

        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public DailySession finish(Long sessionId) {
        DailySession session = getById(sessionId);
        if (session.getStatus() != null && session.getStatus() != 0) {
            throw new BusinessException(ErrorCode.BUSINESS_ERROR_OBJ, "会话已结束");
        }
        long now = System.currentTimeMillis();
        session.setStatus(1);
        session.setEndTime(now);
        long start = session.getStartTime() != null ? session.getStartTime() : now;
        session.setDuration((int) ((now - start) / 1000));
        session.setUpdateTime(now);
        dailySessionMapper.updateById(session);
        // 清理缓存
        sessionQuestionCache.remove(sessionId);
        log.info("Practice session finished. sessionId={}, duration={}s", sessionId, session.getDuration());
        return session;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public DailySession abandon(Long sessionId) {
        DailySession session = getById(sessionId);
        if (session.getStatus() != null && session.getStatus() != 0) {
            throw new BusinessException(ErrorCode.BUSINESS_ERROR_OBJ, "会话已结束");
        }
        long now = System.currentTimeMillis();
        session.setStatus(2);
        session.setEndTime(now);
        long start = session.getStartTime() != null ? session.getStartTime() : now;
        session.setDuration((int) ((now - start) / 1000));
        session.setUpdateTime(now);
        dailySessionMapper.updateById(session);
        // 清理缓存
        sessionQuestionCache.remove(sessionId);
        log.info("Practice session abandoned. sessionId={}", sessionId);
        return session;
    }

    @Override
    public DailySession getById(Long sessionId) {
        DailySession session = dailySessionMapper.selectById(sessionId);
        if (session == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND_OBJ, "练习会话不存在");
        }
        return session;
    }

    @Override
    public List<DailySession> listToday(Long userId) {
        LambdaQueryWrapper<DailySession> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DailySession::getUserId, userId)
                .eq(DailySession::getSessionDate, LocalDate.now())
                .orderByDesc(DailySession::getCreateTime);
        return dailySessionMapper.selectList(wrapper);
    }

    @Override
    public Map<String, Object> todayStats(Long userId) {
        List<DailySession> sessions = listToday(userId);
        int sessionCount = sessions.size();
        int totalAnswered = 0;
        int totalCorrect = 0;
        int totalPoints = 0;
        for (DailySession s : sessions) {
            totalAnswered += s.getAnsweredCount() != null ? s.getAnsweredCount() : 0;
            totalCorrect += s.getCorrectCount() != null ? s.getCorrectCount() : 0;
            totalPoints += s.getPointsEarned() != null ? s.getPointsEarned() : 0;
        }
        Map<String, Object> result = new HashMap<>();
        result.put("sessionCount", sessionCount);
        result.put("answeredCount", totalAnswered);
        result.put("correctCount", totalCorrect);
        result.put("pointsEarned", totalPoints);
        return result;
    }

    // ==================== 内部方法 ====================

    /** 从用户扩展信息获取儿童学龄 */
    private String getKidGrade(Long userId) {
        LambdaQueryWrapper<UserProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProfile::getUserId, userId)
                .eq(UserProfile::getProfileType, UserProfile.ProfileType.KID_INFO);
        UserProfile profile = userProfileMapper.selectOne(wrapper);
        if (profile != null && StringUtils.hasText(profile.getProfileData())) {
            JSONObject extInfo = JSON.parseObject(profile.getProfileData());
            return extInfo.getString("grade");
        }
        return null;
    }

    /** 返回给儿童的题目需剥离答案与解析 */
    private Question sanitizeForExam(Question question) {
        Question copy = new Question();
        copy.setQuestionId(question.getQuestionId());
        copy.setSubjectId(question.getSubjectId());
        copy.setKnowledgePoints(question.getKnowledgePoints());
        copy.setTags(question.getTags());
        copy.setMediaUrls(question.getMediaUrls());
        copy.setContent(question.getContent());
        copy.setOptions(question.getOptions());
        copy.setGrade(question.getGrade());
        copy.setType(question.getType());
        copy.setDifficulty(question.getDifficulty());
        copy.setScore(question.getScore());
        copy.setTimeLimit(question.getTimeLimit());
        copy.setAnswerMode(question.getAnswerMode());
        copy.setFillConfig(question.getFillConfig());
        copy.setStatus(question.getStatus());
        return copy;
    }
}
