package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.dao.entity.Kid;
import com.kidgame.dao.entity.Parent;
import com.kidgame.dao.entity.ParentLimit;
import com.kidgame.service.ParentService;
import com.kidgame.service.dto.AddChildDTO;
import com.kidgame.service.dto.BindExistingKidDTO;
import com.kidgame.service.dto.ParentLimitDTO;
import com.kidgame.service.dto.ParentLoginDTO;
import com.kidgame.service.dto.ParentRegisterDTO;
import com.kidgame.service.dto.UpdateChildPermissionsDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 家长控制器
 */
@Tag(name = "家长管理", description = "家长管控相关接口")
@RestController
@RequestMapping("/api/parent")
public class ParentController {

    @Autowired
    private ParentService parentService;

    @Operation(summary = "家长注册")
    @PostMapping("/register")
    public Result<com.kidgame.dao.entity.Parent> register(@RequestBody ParentRegisterDTO dto) {
        com.kidgame.dao.entity.Parent parent = parentService.register(dto);
        return Result.success(parent);
    }

    @Operation(summary = "家长登录")
    @PostMapping("/login")
    public Result<com.kidgame.dao.entity.Parent> login(@RequestBody ParentLoginDTO dto) {
        com.kidgame.dao.entity.Parent parent = parentService.login(dto);
        return Result.success(parent);
    }

    @Operation(summary = "验证家长密码")
    @PostMapping("/verify")
    public Result<Boolean> verifyPassword(
            @Parameter(description = "家长ID") @RequestParam Long parentId,
            @Parameter(description = "密码") @RequestParam String password) {
        boolean result = parentService.verifyPassword(parentId, password);
        return Result.success(result);
    }

    @Operation(summary = "获取管控规则")
    @GetMapping("/limit")
    public Result<ParentLimit> getParentLimit(
            @Parameter(description = "儿童ID") @RequestParam Long kidId) {
        ParentLimit limit = parentService.getParentLimit(kidId);
        return Result.success(limit);
    }

    @Operation(summary = "更新管控规则")
    @PutMapping("/limit")
    public Result<Void> updateParentLimit(@RequestBody ParentLimitDTO dto) {
        parentService.updateParentLimit(dto);
        return Result.success();
    }

    @Operation(summary = "远程暂停游戏")
    @PostMapping("/remote/pause")
    public Result<Void> remotePauseGame(
            @Parameter(description = "儿童ID") @RequestParam Long kidId) {
        parentService.remotePauseGame(kidId);
        return Result.success();
    }

    @Operation(summary = "远程解锁游戏")
    @PostMapping("/remote/unlock")
    public Result<Void> remoteUnlockGame(
            @Parameter(description = "儿童ID") @RequestParam Long kidId) {
        parentService.remoteUnlockGame(kidId);
        return Result.success();
    }

    @Operation(summary = "获取儿童列表")
    @GetMapping("/kids")
    public Result<List<Kid>> getParentKids(
            @Parameter(description = "家长ID") @RequestParam Long parentId) {
        List<Kid> kids = parentService.getParentKids(parentId);
        return Result.success(kids);
    }

    @Operation(summary = "获取儿童游戏记录")
    @GetMapping("/game-records")
    public Result<List<com.kidgame.dao.entity.GameRecord>> getKidGameRecords(
            @Parameter(description = "儿童ID") @RequestParam Long kidId,
            @Parameter(description = "数量限制") @RequestParam(required = false, defaultValue = "20") Integer limit) {
        List<com.kidgame.dao.entity.GameRecord> records = parentService.getKidGameRecords(kidId, limit);
        return Result.success(records);
    }

    @Operation(summary = "获取儿童答题记录")
    @GetMapping("/answer-records")
    public Result<List<com.kidgame.dao.entity.AnswerRecord>> getKidAnswerRecords(
            @Parameter(description = "儿童ID") @RequestParam Long kidId,
            @Parameter(description = "数量限制") @RequestParam(required = false, defaultValue = "20") Integer limit) {
        List<com.kidgame.dao.entity.AnswerRecord> records = parentService.getKidAnswerRecords(kidId, limit);
        return Result.success(records);
    }

    @Operation(summary = "屏蔽游戏")
    @PostMapping("/game/block")
    public Result<Void> blockGame(
            @Parameter(description = "儿童ID") @RequestParam Long kidId,
            @Parameter(description = "游戏ID") @RequestParam Long gameId) {
        parentService.blockGame(kidId, gameId);
        return Result.success();
    }

    @Operation(summary = "取消屏蔽游戏")
    @PostMapping("/game/unblock")
    public Result<Void> unblockGame(
            @Parameter(description = "儿童ID") @RequestParam Long kidId,
            @Parameter(description = "游戏ID") @RequestParam Long gameId) {
        parentService.unblockGame(kidId, gameId);
        return Result.success();
    }

    @Operation(summary = "批量屏蔽游戏")
    @PostMapping("/game/block/batch")
    public Result<Void> batchBlockGames(
            @Parameter(description = "儿童ID") @RequestParam Long kidId,
            @RequestBody List<Long> gameIds) {
        parentService.batchBlockGames(kidId, gameIds);
        return Result.success();
    }

    @Operation(summary = "批量取消屏蔽游戏")
    @PostMapping("/game/unblock/batch")
    public Result<Void> batchUnblockGames(
            @Parameter(description = "儿童ID") @RequestParam Long kidId,
            @RequestBody List<Long> gameIds) {
        parentService.batchUnblockGames(kidId, gameIds);
        return Result.success();
    }

    @Operation(summary = "添加孩子")
    @PostMapping("/child")
    public Result<Kid> addChild(@RequestBody AddChildDTO dto) {
        Kid kid = parentService.addChild(dto);
        return Result.success(kid);
    }

    @Operation(summary = "删除孩子")
    @DeleteMapping("/child/{kidId}")
    public Result<Void> deleteChild(
            @Parameter(description = "儿童ID") @PathVariable Long kidId,
            @Parameter(description = "家长ID") @RequestParam Long parentId) {
        parentService.deleteChild(kidId, parentId);
        return Result.success();
    }

    @Operation(summary = "更新孩子游戏权限")
    @PutMapping("/child/{kidId}/permissions")
    public Result<Void> updateChildPermissions(
            @Parameter(description = "儿童ID") @PathVariable Long kidId,
            @RequestBody UpdateChildPermissionsDTO dto) {
        dto.setKidId(kidId);
        parentService.updateChildPermissions(dto);
        return Result.success();
    }

    @Operation(summary = "绑定已有孩子")
    @PostMapping("/bind-existing-kid")
    public Result<Void> bindExistingKid(@RequestBody BindExistingKidDTO dto) {
        parentService.bindExistingKid(dto);
        return Result.success();
    }

    @Operation(summary = "获取孩子的所有家长")
    @GetMapping("/kid-parents")
    public Result<List<Parent>> getParentsForKid(
            @Parameter(description = "儿童ID") @RequestParam Long kidId) {
        List<Parent> parents = parentService.getParentsForKid(kidId);
        return Result.success(parents);
    }

    @Operation(summary = "获取所有家长列表（用于孩子注册时选择）")
    @GetMapping("/all")
    public Result<List<Parent>> getAllParents() {
        List<Parent> parents = parentService.getAllParents();
        return Result.success(parents);
    }

    @Operation(summary = "获取家长选项列表（用于孩子注册时选择，简化信息）")
    @GetMapping("/options")
    public Result<List<com.kidgame.service.dto.ParentOptionDTO>> getParentOptions() {
        List<com.kidgame.service.dto.ParentOptionDTO> options = parentService.getParentOptions();
        return Result.success(options);
    }

    @Operation(summary = "家长请求绑定孩子（创建待确认关系和通知）")
    @PostMapping("/request-bind-kid")
    public Result<Long> requestBindKid(
            @Parameter(description = "家长ID") @RequestParam Long parentId,
            @Parameter(description = "孩子用户名") @RequestParam String kidUsername,
            @Parameter(description = "角色类型：1-父亲, 2-母亲, 3-监护人, 4-辅导员") @RequestParam(required = false, defaultValue = "3") Integer roleType,
            @Parameter(description = "是否为主要监护人") @RequestParam(required = false, defaultValue = "false") Boolean isPrimary) {
        Long relationId = parentService.requestBindKid(parentId, kidUsername, roleType, isPrimary);
        return Result.success(relationId);
    }
}
