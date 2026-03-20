package com.kidgame.common.util;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/**
 * 游戏管控工具类
 *
 * @author kids-game-platform
 * @since 2.0.0
 */
public class GameControlUtil {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    /**
     * 检查是否在允许时间段
     *
     * @param startTimeStr 开始时间 (HH:mm)
     * @param endTimeStr   结束时间 (HH:mm)
     * @return 是否在允许时间段
     */
    public static boolean isInAllowedTime(String startTimeStr, String endTimeStr) {
        if (startTimeStr == null || endTimeStr == null) {
            return true; // 未设置则允许
        }

        try {
            LocalTime now = LocalTime.now();
            LocalTime startTime = LocalTime.parse(startTimeStr, TIME_FORMATTER);
            LocalTime endTime = LocalTime.parse(endTimeStr, TIME_FORMATTER);

            // 处理跨天情况（如 22:00 - 06:00）
            if (endTime.isBefore(startTime)) {
                return !now.isBefore(startTime) || !now.isAfter(endTime);
            } else {
                return !now.isBefore(startTime) && !now.isAfter(endTime);
            }
        } catch (Exception e) {
            // 解析失败时允许游戏
            return true;
        }
    }

    /**
     * 检查是否在工作日
     *
     * @return 是否在工作日
     */
    public static boolean isWeekday() {
        DayOfWeek day = LocalDate.now().getDayOfWeek();
        return day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY;
    }

    /**
     * 检查是否在周末
     *
     * @return 是否在周末
     */
    public static boolean isWeekend() {
        return !isWeekday();
    }

    /**
     * 计算时间段差值（分钟）
     *
     * @param startTimeStr 开始时间 (HH:mm)
     * @param endTimeStr   结束时间 (HH:mm)
     * @return 时间差（分钟）
     */
    public static int calculateTimeDifference(String startTimeStr, String endTimeStr) {
        try {
            LocalTime startTime = LocalTime.parse(startTimeStr, TIME_FORMATTER);
            LocalTime endTime = LocalTime.parse(endTimeStr, TIME_FORMATTER);

            // 处理跨天情况
            if (endTime.isBefore(startTime)) {
                endTime = endTime.plusHours(24);
            }

            return (int) java.time.Duration.between(startTime, endTime).toMinutes();
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * 检查时长是否超限
     *
     * @param playedDuration   已玩时长（秒）
     * @param maxDurationLimit 最大时长限制（分钟）
     * @return 是否超限
     */
    public static boolean isDurationExceeded(long playedDuration, int maxDurationLimit) {
        long playedMinutes = playedDuration / 60;
        return playedMinutes >= maxDurationLimit;
    }

    /**
     * 计算剩余时长
     *
     * @param playedDuration   已玩时长（秒）
     * @param maxDurationLimit 最大时长限制（分钟）
     * @return 剩余时长（分钟）
     */
    public static int calculateRemainingDuration(long playedDuration, int maxDurationLimit) {
        long playedMinutes = playedDuration / 60;
        return Math.max(0, maxDurationLimit - (int) playedMinutes);
    }

    /**
     * 检查疲劳点是否足够
     *
     * @param currentPoints  当前点数
     * @param requiredPoints 需要点数
     * @return 是否足够
     */
    public static boolean isFatiguePointsSufficient(int currentPoints, int requiredPoints) {
        return currentPoints >= requiredPoints;
    }

    /**
     * 检查是否达到每日答题上限
     *
     * @param todayPoints      今日已得点数
     * @param dailyLimit       每日上限
     * @param pointsPerAnswer  每题点数
     * @return 是否达到上限
     */
    public static boolean isDailyAnswerLimitExceeded(int todayPoints, int dailyLimit, int pointsPerAnswer) {
        return todayPoints >= dailyLimit;
    }

    /**
     * 计算可答题次数
     *
     * @param todayPoints      今日已得点数
     * @param dailyLimit       每日上限
     * @param pointsPerAnswer  每题点数
     * @return 可答题次数
     */
    public static int calculateRemainingAnswerCount(int todayPoints, int dailyLimit, int pointsPerAnswer) {
        if (pointsPerAnswer <= 0) {
            return 0;
        }
        return Math.max(0, (dailyLimit - todayPoints) / pointsPerAnswer);
    }

    /**
     * 格式化时长显示
     *
     * @param seconds 时长（秒）
     * @return 格式化字符串（如 "1小时30分钟"）
     */
    public static String formatDuration(long seconds) {
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;
        long secs = seconds % 60;

        if (hours > 0) {
            return String.format("%d小时%d分钟", hours, minutes);
        } else if (minutes > 0) {
            return String.format("%d分钟", minutes);
        } else {
            return String.format("%d秒", secs);
        }
    }

    /**
     * 格式化点数显示
     *
     * @param points 点数
     * @return 格式化字符串
     */
    public static String formatPoints(int points) {
        if (points <= 0) {
            return "0点";
        }
        return points + "点";
    }

    /**
     * 获取今天的日期字符串
     *
     * @return 日期字符串 (YYYY-MM-DD)
     */
    public static String getTodayDateString() {
        return LocalDate.now().toString();
    }
}
