package com.kidgame.common.handler;

import com.kidgame.common.constant.ErrorCode;
import com.kidgame.common.exception.BusinessException;
import com.kidgame.common.model.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.stream.Collectors;

/**
 * 全局异常处理器
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 处理业务异常
     */
    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusinessException(BusinessException e) {
        e.printStackTrace();
        // 只记录错误信息，不打印完整堆栈（因为业务异常是预期的）
        log.error("Business exception: code={}, msg={}", e.getCode(), e.getMsg());
        return Result.error(e.getCode(), e.getMsg());
    }

    /**
     * 处理参数校验异常（@Valid）
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
        FieldError fieldError = e.getBindingResult().getFieldError();
        String msg = fieldError != null ? fieldError.getDefaultMessage() : "参数校验失败";
        log.error("Parameter validation failed: {}", msg, e);
        return Result.error(ErrorCode.BAD_REQUEST, msg);
    }

    /**
     * 处理参数绑定异常
     */
    @ExceptionHandler(BindException.class)
    public Result<Void> handleBindException(BindException e) {
        FieldError fieldError = e.getFieldError();
        String msg = fieldError != null ? fieldError.getDefaultMessage() : "参数绑定失败";
        log.error("Parameter bind failed: {}", msg, e);
        return Result.error(ErrorCode.BAD_REQUEST, msg);
    }

    /**
     * 处理约束违反异常
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public Result<Void> handleConstraintViolationException(ConstraintViolationException e) {
        String msg = e.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining(", "));
        log.error("Constraint violation: {}", msg, e);
        return Result.error(ErrorCode.BAD_REQUEST, msg);
    }

    /**
     * 处理非法参数异常
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public Result<Void> handleIllegalArgumentException(IllegalArgumentException e) {
        log.error("Illegal argument: {}", e.getMessage(), e);
        return Result.error(ErrorCode.BAD_REQUEST, e.getMessage());
    }

    /**
     * 处理运行时异常
     */
    @ExceptionHandler(RuntimeException.class)
    public Result<Void> handleRuntimeException(RuntimeException e) {
        // 记录完整的异常堆栈
        log.error("Runtime exception: ", e);
        String errorMsg = e.getMessage() != null ? e.getMessage() : "服务器内部错误";
        return Result.error(500, "运行时错误：" + errorMsg);
    }

    /**
     * 处理系统异常（忽略 WebSocket 相关的资源未找到错误）
     */
    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        // 如果是 WebSocket 相关的资源未找到异常，静默处理
        String message = e.getMessage();
        if (message != null && message.contains("No resource") && message.toLowerCase().contains("ws")) {
            log.trace("WebSocket resource request ignored: {}", message);
            return null;
        }
        
        // 记录完整的异常堆栈
        log.error("System exception: ", e);
        
        // 返回详细的错误信息给前端（开发环境）
        // 生产环境可以考虑只返回通用错误信息，避免泄露敏感信息
        String errorMsg = e.getMessage() != null ? e.getMessage() : "服务器内部错误";
        return Result.error(500, "系统错误：" + errorMsg);
    }
}


