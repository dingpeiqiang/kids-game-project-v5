package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.common.util.JwtUtil;
import com.kidgame.dao.entity.TaskDefinition;
import com.kidgame.service.TaskManageService;
import com.kidgame.service.TaskProgressService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/task")
@RequiredArgsConstructor
public class TaskController {

    private final TaskProgressService taskProgressService;
    private final TaskManageService taskManageService;
    private final JwtUtil jwtUtil;

    @GetMapping("/list")
    public Result<List<Map<String, Object>>> list(@RequestHeader("Authorization") String authorization) {
        Long userId = parseUserId(authorization);
        return Result.success(taskProgressService.listTasksForUser(userId));
    }

    @PostMapping("/claim")
    public Result<Map<String, Object>> claim(
            @RequestHeader("Authorization") String authorization,
            @RequestBody ClaimBody body) {
        Long userId = parseUserId(authorization);
        return Result.success(taskProgressService.claimTask(userId, body.getTaskId()));
    }

    @PostMapping("/manage")
    public Result<TaskDefinition> createOrUpdate(
            @RequestHeader("Authorization") String authorization,
            @RequestBody TaskDefinition body) {
        Long operatorId = parseUserId(authorization);
        return Result.success(taskManageService.saveTask(operatorId, body));
    }

    @GetMapping("/manage/list")
    public Result<List<TaskDefinition>> manageList(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(required = false) Long kidId) {
        Long operatorId = parseUserId(authorization);
        return Result.success(taskManageService.listManageable(operatorId, kidId));
    }

    private Long parseUserId(String authorization) {
        String token = authorization.replace("Bearer ", "");
        return Long.parseLong(jwtUtil.getUserId(token));
    }

    @Data
    public static class ClaimBody {
        private Long taskId;
    }
}