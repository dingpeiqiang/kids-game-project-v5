package com.kidgame.service;

import java.util.List;
import java.util.Map;

public interface TaskProgressService {

    void onMetric(Long userId, String metric, int delta);

    List<Map<String, Object>> listTasksForUser(Long userId);

    Map<String, Object> claimTask(Long userId, Long taskId);
}