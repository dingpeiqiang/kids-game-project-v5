package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.dao.entity.UserRelation;
import com.kidgame.service.UserRelationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户关系控制器 - 处理多监护人、多子女场景
 */
@Tag(name = "用户关系管理", description = "用户关系（监护人-子女）相关接口")
@RestController
@RequestMapping("/api/user-relation")
public class UserRelationController {

    @Autowired
    private UserRelationService userRelationService;

    @Operation(summary = "绑定监护人与儿童关系")
    @PostMapping("/bind")
    public Result<UserRelation> bindRelation(
            @Parameter(description = "监护人ID") @RequestParam Long guardianUserId,
            @Parameter(description = "儿童ID") @RequestParam Long kidUserId,
            @Parameter(description = "关系类型：FATHER/MOTHER/GUARDIAN/TUTOR") @RequestParam String relationType,
            @Parameter(description = "是否为主监护人") @RequestParam(required = false, defaultValue = "false") Boolean isPrimary,
            @Parameter(description = "权限级别：FULL/PARTIAL/VIEW_ONLY") @RequestParam(required = false, defaultValue = "FULL") String permissionLevel) {
        UserRelation relation = userRelationService.bindRelation(guardianUserId, kidUserId, relationType, isPrimary, permissionLevel);
        return Result.success(relation);
    }

    @Operation(summary = "解绑关系")
    @DeleteMapping("/unbind")
    public Result<Void> unbindRelation(
            @Parameter(description = "监护人ID") @RequestParam Long guardianUserId,
            @Parameter(description = "儿童ID") @RequestParam Long kidUserId) {
        userRelationService.unbindRelation(guardianUserId, kidUserId);
        return Result.success();
    }

    @Operation(summary = "更新关系")
    @PutMapping("/update")
    public Result<UserRelation> updateRelation(@RequestBody UserRelation relation) {
        UserRelation updated = userRelationService.updateRelation(relation);
        return Result.success(updated);
    }

    @Operation(summary = "获取监护人的所有儿童")
    @GetMapping("/guardian/{guardianUserId}/kids")
    public Result<List<UserRelation>> getGuardianKids(
            @Parameter(description = "监护人ID") @PathVariable Long guardianUserId) {
        List<UserRelation> relations = userRelationService.getGuardianKids(guardianUserId);
        return Result.success(relations);
    }

    @Operation(summary = "获取儿童的所有监护人")
    @GetMapping("/kid/{kidUserId}/guardians")
    public Result<List<UserRelation>> getKidGuardians(
            @Parameter(description = "儿童ID") @PathVariable Long kidUserId) {
        List<UserRelation> relations = userRelationService.getKidGuardians(kidUserId);
        return Result.success(relations);
    }

    @Operation(summary = "设置主监护人")
    @PutMapping("/set-primary")
    public Result<Void> setPrimaryGuardian(
            @Parameter(description = "监护人ID") @RequestParam Long guardianUserId,
            @Parameter(description = "儿童ID") @RequestParam Long kidUserId) {
        userRelationService.setPrimaryGuardian(guardianUserId, kidUserId);
        return Result.success();
    }

    @Operation(summary = "更新权限级别")
    @PutMapping("/permission-level")
    public Result<Void> updatePermissionLevel(
            @Parameter(description = "监护人ID") @RequestParam Long guardianUserId,
            @Parameter(description = "儿童ID") @RequestParam Long kidUserId,
            @Parameter(description = "权限级别：FULL/PARTIAL/VIEW_ONLY") @RequestParam String permissionLevel) {
        userRelationService.updatePermissionLevel(guardianUserId, kidUserId, permissionLevel);
        return Result.success();
    }

    @Operation(summary = "检查关系是否存在")
    @GetMapping("/check")
    public Result<Boolean> checkRelationExists(
            @Parameter(description = "监护人ID") @RequestParam Long guardianUserId,
            @Parameter(description = "儿童ID") @RequestParam Long kidUserId) {
        boolean exists = userRelationService.checkRelationExists(guardianUserId, kidUserId);
        return Result.success(exists);
    }
}
