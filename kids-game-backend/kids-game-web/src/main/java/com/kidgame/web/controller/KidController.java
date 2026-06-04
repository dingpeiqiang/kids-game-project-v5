package com.kidgame.web.controller;

import com.kidgame.common.model.Result;
import com.kidgame.dao.entity.Kid;
import com.kidgame.service.KidService;
import com.kidgame.service.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 儿童控制器
 */
@Tag(name = "儿童管理", description = "儿童用户相关接口")
@RestController
@RequestMapping("/api/kid")
public class KidController {

    @Autowired
    private KidService kidService;

    @Operation(summary = "儿童注册")
    @PostMapping("/register")
    public Result<Kid> register(@RequestBody KidRegisterDTO dto) {
        Kid kid = kidService.register(dto);
        return Result.success(kid);
    }

    @Operation(summary = "儿童登录")
    @PostMapping("/login")
    public Result<Kid> login(@RequestBody KidLoginDTO dto) {
        Kid kid = kidService.login(dto.getUsername(), dto.getPassword());
        return Result.success(kid);
    }

    @Operation(summary = "获取儿童信息")
    @GetMapping("/info")
    public Result<Kid> getKidInfo(
            @Parameter(description = "儿童ID") @RequestParam Long kidId) {
        Kid kid = kidService.getKidInfo(kidId);
        return Result.success(kid);
    }

    @Operation(summary = "获取疲劳点数")
    @GetMapping("/fatigue-points")
    public Result<Integer> getFatiguePoints(
            @Parameter(description = "儿童ID") @RequestParam Long kidId) {
        Integer points = kidService.getFatiguePoints(kidId);
        return Result.success(points);
    }

    @Operation(summary = "获取儿童的所有家长（孩子首页显示）")
    @GetMapping("/parents")
    public Result<List<ParentInfoDTO>> getParentsForKid(
            @Parameter(description = "儿童ID") @RequestParam Long kidId) {
        List<ParentInfoDTO> parents = kidService.getParentsForKid(kidId);
        return Result.success(parents);
    }

    @Operation(summary = "解除与家长的绑定关系")
    @PostMapping("/unbind")
    public Result<Void> unbindParent(@RequestBody UnbindParentDTO dto) {
        kidService.unbindParent(dto);
        return Result.success();
    }

    @Operation(summary = "更新主要监护人")
    @PutMapping("/primary-guardian")
    public Result<Void> updatePrimaryGuardian(@RequestBody UpdatePrimaryGuardianDTO dto) {
        kidService.updatePrimaryGuardian(dto);
        return Result.success();
    }

    @Operation(summary = "搜索已注册的孩子（按用户名或昵称模糊搜索）")
    @GetMapping("/search")
    public Result<List<Kid>> searchKids(
            @Parameter(description = "搜索关键词") @RequestParam String keyword) {
        List<Kid> kids = kidService.searchKids(keyword);
        return Result.success(kids);
    }
}
