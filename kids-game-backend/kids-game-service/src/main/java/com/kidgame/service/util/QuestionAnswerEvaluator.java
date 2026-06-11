package com.kidgame.service.util;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * 题目答案比对（支持选项全文、字母、判断题、填空题规范化）
 */
public final class QuestionAnswerEvaluator {

    private QuestionAnswerEvaluator() {
    }

    public static boolean isCorrect(QuestionContext ctx, String userAnswer) {
        if (ctx == null || !StringUtils.hasText(ctx.correctAnswer())) {
            return false;
        }
        String normalizedUser = normalizeUserAnswer(ctx, userAnswer);
        String normalizedCorrect = normalizeCorrectAnswer(ctx);
        if (!StringUtils.hasText(normalizedUser)) {
            return false;
        }
        if ("fill".equalsIgnoreCase(ctx.type())) {
            return normalizedUser.equalsIgnoreCase(normalizedCorrect);
        }
        return normalizedUser.equals(normalizedCorrect);
    }

    public static String normalizeCorrectAnswer(QuestionContext ctx) {
        String raw = ctx.correctAnswer().trim();
        String type = ctx.type() != null ? ctx.type().toLowerCase(Locale.ROOT) : "choice";
        if ("judgment".equals(type)) {
            return normalizeJudgment(raw);
        }
        if ("fill".equals(type)) {
            return raw.trim();
        }
        return normalizeChoiceAnswer(raw, ctx.options());
    }

    public static String normalizeUserAnswer(QuestionContext ctx, String userAnswer) {
        if (!StringUtils.hasText(userAnswer)) {
            return "";
        }
        String raw = userAnswer.trim();
        String type = ctx.type() != null ? ctx.type().toLowerCase(Locale.ROOT) : "choice";
        if ("judgment".equals(type)) {
            return normalizeJudgment(raw);
        }
        if ("fill".equals(type)) {
            return raw.trim();
        }
        return normalizeChoiceAnswer(raw, ctx.options());
    }

    private static String normalizeChoiceAnswer(String raw, String optionsJson) {
        String trimmed = raw.trim();
        if (trimmed.length() == 1 && Character.isLetter(trimmed.charAt(0))) {
            List<String> options = parseOptions(optionsJson);
            int idx = Character.toUpperCase(trimmed.charAt(0)) - 'A';
            if (idx >= 0 && idx < options.size()) {
                return options.get(idx).trim();
            }
        }
        List<String> options = parseOptions(optionsJson);
        for (int i = 0; i < options.size(); i++) {
            if (options.get(i).trim().equals(trimmed)) {
                return options.get(i).trim();
            }
        }
        return trimmed;
    }

    private static String normalizeJudgment(String value) {
        String v = value.trim();
        if ("true".equalsIgnoreCase(v) || "1".equals(v) || "对".equals(v) || "正确".equals(v) || "是".equals(v)) {
            return "对";
        }
        if ("false".equalsIgnoreCase(v) || "0".equals(v) || "错".equals(v) || "错误".equals(v) || "否".equals(v)) {
            return "错";
        }
        return v;
    }

    public static List<String> parseOptions(String optionsJson) {
        List<String> result = new ArrayList<>();
        if (!StringUtils.hasText(optionsJson)) {
            return result;
        }
        String trimmed = optionsJson.trim();
        try {
            JSONArray arr = JSON.parseArray(trimmed);
            for (int i = 0; i < arr.size(); i++) {
                result.add(String.valueOf(arr.get(i)).trim());
            }
            return result;
        } catch (Exception ignored) {
            for (String part : trimmed.split("[,，]")) {
                if (StringUtils.hasText(part)) {
                    result.add(part.trim());
                }
            }
            return result;
        }
    }

    public record QuestionContext(String type, String options, String correctAnswer) {
    }
}