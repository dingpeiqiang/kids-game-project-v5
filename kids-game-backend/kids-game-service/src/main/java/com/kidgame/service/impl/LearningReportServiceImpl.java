package com.kidgame.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.kidgame.dao.entity.AnswerRecord;
import com.kidgame.dao.entity.WrongQuestion;
import com.kidgame.dao.mapper.AnswerRecordMapper;
import com.kidgame.dao.mapper.WrongQuestionMapper;
import com.kidgame.service.KidService;
import com.kidgame.service.LearningReportService;
import com.kidgame.service.util.QuestionAnswerEvaluator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * 个人学习报告业务服务实现
 */
@Slf4j
@Service
public class LearningReportServiceImpl implements LearningReportService {

    @Autowired
    private AnswerRecordMapper answerRecordMapper;

    @Autowired
    private WrongQuestionMapper wrongQuestionMapper;

    @Autowired
    private KidService kidService;

    @Override
    public Map<String, Object> overview(Long userId) {
        List<AnswerRecord> records = listAnswerRecords(userId, null);
        int totalAnswered = records.size();
        int totalCorrect = 0;
        int totalPoints = 0;
        Set<LocalDate> answerDays = new HashSet<>();
        for (AnswerRecord r : records) {
            if (Integer.valueOf(1).equals(r.getIsCorrect())) {
                totalCorrect++;
            }
            if (r.getGetPoints() != null) {
                totalPoints += r.getGetPoints();
            }
            if (r.getCreateTime() != null) {
                answerDays.add(toLocalDate(r.getCreateTime()));
            }
        }
        double accuracy = totalAnswered > 0 ? (totalCorrect * 100.0 / totalAnswered) : 0.0;
        int continuousDays = calcContinuousDays(answerDays);

        // 错题数（status != 0）
        LambdaQueryWrapper<WrongQuestion> wqWrapper = new LambdaQueryWrapper<>();
        wqWrapper.eq(WrongQuestion::getUserId, userId)
                .ne(WrongQuestion::getStatus, 0);
        int wrongCount = Math.toIntExact(wrongQuestionMapper.selectCount(wqWrapper));

        // 当前游学币余额
        Integer fatiguePoints = kidService.getFatiguePoints(userId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalAnswered", totalAnswered);
        result.put("totalCorrect", totalCorrect);
        result.put("accuracy", Math.round(accuracy * 100) / 100.0);
        result.put("continuousDays", continuousDays);
        result.put("fatiguePoints", fatiguePoints != null ? fatiguePoints : 0);
        result.put("wrongCount", wrongCount);
        return result;
    }

    @Override
    public Map<String, Object> trend(Long userId, int days) {
        long startMs = LocalDate.now().minusDays(days - 1L)
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant()
                .toEpochMilli();
        List<AnswerRecord> records = listAnswerRecords(userId, startMs);
        // 按天分组
        Map<LocalDate, int[]> daily = new TreeMap<>();
        for (int i = 0; i < days; i++) {
            daily.put(LocalDate.now().minusDays(i), new int[]{0, 0});
        }
        for (AnswerRecord r : records) {
            if (r.getCreateTime() == null) {
                continue;
            }
            LocalDate day = toLocalDate(r.getCreateTime());
            int[] stat = daily.computeIfAbsent(day, k -> new int[]{0, 0});
            stat[0]++;
            if (Integer.valueOf(1).equals(r.getIsCorrect())) {
                stat[1]++;
            }
        }
        List<Map<String, Object>> points = new ArrayList<>();
        for (Map.Entry<LocalDate, int[]> entry : daily.entrySet()) {
            int answered = entry.getValue()[0];
            int correct = entry.getValue()[1];
            double acc = answered > 0 ? (correct * 100.0 / answered) : 0.0;
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", entry.getKey().toString());
            point.put("answered", answered);
            point.put("correct", correct);
            point.put("accuracy", Math.round(acc * 100) / 100.0);
            points.add(point);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("days", days);
        result.put("points", points);
        return result;
    }

    @Override
    public Map<String, Object> knowledgeMastery(Long userId) {
        List<AnswerRecord> records = listAnswerRecords(userId, null);
        // 按知识点分组统计
        Map<Long, int[]> statByKp = new HashMap<>();
        for (AnswerRecord r : records) {
            List<Long> kpIds = QuestionAnswerEvaluator.parseLongArray(r.getKnowledgePointIds());
            if (kpIds.isEmpty()) {
                continue;
            }
            boolean isCorrect = Integer.valueOf(1).equals(r.getIsCorrect());
            for (Long kpId : kpIds) {
                int[] stat = statByKp.computeIfAbsent(kpId, k -> new int[]{0, 0});
                stat[0]++;
                if (isCorrect) {
                    stat[1]++;
                }
            }
        }
        List<Map<String, Object>> items = statByKp.entrySet().stream()
                .map(e -> {
                    int answered = e.getValue()[0];
                    int correct = e.getValue()[1];
                    double acc = answered > 0 ? (correct * 100.0 / answered) : 0.0;
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("knowledgePointId", e.getKey());
                    item.put("answered", answered);
                    item.put("correct", correct);
                    item.put("accuracy", Math.round(acc * 100) / 100.0);
                    return item;
                })
                .sorted(Comparator.comparingInt((Map<String, Object> m) -> (int) m.get("answered")).reversed())
                .collect(Collectors.toList());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        return result;
    }

    @Override
    public Map<String, Object> subjectDistribution(Long userId) {
        List<AnswerRecord> records = listAnswerRecords(userId, null);
        Map<Long, int[]> statBySubject = new HashMap<>();
        for (AnswerRecord r : records) {
            Long subjectId = r.getSubjectId();
            if (subjectId == null) {
                continue;
            }
            int[] stat = statBySubject.computeIfAbsent(subjectId, k -> new int[]{0, 0});
            stat[0]++;
            if (Integer.valueOf(1).equals(r.getIsCorrect())) {
                stat[1]++;
            }
        }
        List<Map<String, Object>> items = statBySubject.entrySet().stream()
                .map(e -> {
                    int answered = e.getValue()[0];
                    int correct = e.getValue()[1];
                    double acc = answered > 0 ? (correct * 100.0 / answered) : 0.0;
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("subjectId", e.getKey());
                    item.put("answered", answered);
                    item.put("correct", correct);
                    item.put("accuracy", Math.round(acc * 100) / 100.0);
                    return item;
                })
                .sorted(Comparator.comparingInt((Map<String, Object> m) -> (int) m.get("answered")).reversed())
                .collect(Collectors.toList());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        return result;
    }

    @Override
    public Map<String, Object> difficultyAnalysis(Long userId) {
        List<AnswerRecord> records = listAnswerRecords(userId, null);
        Map<Integer, int[]> statByDiff = new HashMap<>();
        for (AnswerRecord r : records) {
            Integer difficulty = r.getDifficulty();
            if (difficulty == null) {
                continue;
            }
            int[] stat = statByDiff.computeIfAbsent(difficulty, k -> new int[]{0, 0});
            stat[0]++;
            if (Integer.valueOf(1).equals(r.getIsCorrect())) {
                stat[1]++;
            }
        }
        List<Map<String, Object>> items = statByDiff.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    int answered = e.getValue()[0];
                    int correct = e.getValue()[1];
                    double acc = answered > 0 ? (correct * 100.0 / answered) : 0.0;
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("difficulty", e.getKey());
                    item.put("answered", answered);
                    item.put("correct", correct);
                    item.put("accuracy", Math.round(acc * 100) / 100.0);
                    return item;
                })
                .collect(Collectors.toList());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        return result;
    }

    @Override
    public List<Map<String, Object>> recentRecords(Long userId, int limit) {
        LambdaQueryWrapper<AnswerRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AnswerRecord::getKidId, userId)
                .orderByDesc(AnswerRecord::getCreateTime);
        if (limit > 0) {
            wrapper.last("LIMIT " + limit);
        }
        List<AnswerRecord> records = answerRecordMapper.selectList(wrapper);
        List<Map<String, Object>> result = new ArrayList<>();
        for (AnswerRecord r : records) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("recordId", r.getRecordId());
            item.put("questionId", r.getQuestionId());
            item.put("sessionId", r.getSessionId());
            item.put("subjectId", r.getSubjectId());
            item.put("questionType", r.getQuestionType());
            item.put("difficulty", r.getDifficulty());
            item.put("isCorrect", r.getIsCorrect());
            item.put("getPoints", r.getGetPoints());
            item.put("answerTime", r.getAnswerTime());
            item.put("createTime", r.getCreateTime());
            result.add(item);
        }
        return result;
    }

    // ==================== 内部方法 ====================

    /** 查询用户答题记录（可选起始时间） */
    private List<AnswerRecord> listAnswerRecords(Long userId, Long startMs) {
        LambdaQueryWrapper<AnswerRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AnswerRecord::getKidId, userId);
        if (startMs != null) {
            wrapper.ge(AnswerRecord::getCreateTime, startMs);
        }
        wrapper.orderByDesc(AnswerRecord::getCreateTime);
        return answerRecordMapper.selectList(wrapper);
    }

    /** 毫秒时间戳转 LocalDate */
    private LocalDate toLocalDate(long timestamp) {
        return new java.util.Date(timestamp).toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDate();
    }

    /** 计算连续答题天数（从今天往前数） */
    private int calcContinuousDays(Set<LocalDate> answerDays) {
        if (answerDays.isEmpty()) {
            return 0;
        }
        int continuous = 0;
        LocalDate cursor = LocalDate.now();
        // 若今天没答，允许从昨天开始算（保持连续性体验）
        if (!answerDays.contains(cursor)) {
            cursor = cursor.minusDays(1);
        }
        while (answerDays.contains(cursor)) {
            continuous++;
            cursor = cursor.minusDays(1);
        }
        return continuous;
    }
}
