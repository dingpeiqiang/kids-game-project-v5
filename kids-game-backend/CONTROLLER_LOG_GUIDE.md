# 接口日志打印功能说明

## 问题描述
系统后端之前没有统一的接口出入参日志打印，导致调试和排查问题时无法快速定位请求和响应数据。

## 解决方案

### 1. 新增组件

#### 1.1 ControllerLogInterceptor（控制器日志拦截器）
- **位置**: `kids-game-common/src/main/java/com/kidgame/common/interceptor/ControllerLogInterceptor.java`
- **功能**: 
  - 拦截所有 `/api/**` 路径的请求
  - 在 `preHandle` 中打印请求信息（URI、方法、IP、参数、请求体）
  - 在 `postHandle` 中打印响应状态和耗时
  - 支持 JSON 格式化的请求体显示

#### 1.2 ControllerLogAspect（控制器日志切面）- 可选
- **位置**: `kids-game-common/src/main/java/com/kidgame/common/aspect/ControllerLogAspect.java`
- **功能**: 
  - 使用 AOP 方式记录更详细的日志
  - 可以打印完整的响应数据
  - 需要添加 `spring-boot-starter-aop` 依赖

### 2. 配置说明

#### 2.1 已添加的依赖
在 `kids-game-common/pom.xml` 中已添加：
```xml
<!-- Spring Boot AOP -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

#### 2.2 拦截器注册
在 `WebConfig.java` 中已注册拦截器：
```java
@Autowired
private ControllerLogInterceptor controllerLogInterceptor;

@Override
public void addInterceptors(InterceptorRegistry registry) {
    // 控制器日志拦截器（最外层，先注册）
    registry.addInterceptor(controllerLogInterceptor)
            .addPathPatterns("/api/**")
            .excludePathPatterns(
                    "/doc.html",
                    "/swagger-resources/**",
                    "/v3/api-docs/**",
                    "/webjars/**",
                    "/favicon.ico"
            );
    
    // ... 其他拦截器
}
```

### 3. 日志输出示例

#### 3.1 请求日志
```
2026-03-13 22:30:15 [http-nio-8080-exec-1] INFO  c.k.c.i.ControllerLogInterceptor - ========== 请求开始：com.kidgame.web.controller.BaseUserController.login ==========
2026-03-13 22:30:15 [http-nio-8080-exec-1] INFO  c.k.c.i.ControllerLogInterceptor - 请求 URI: /api/user/login
2026-03-13 22:30:15 [http-nio-8080-exec-1] INFO  c.k.c.i.ControllerLogInterceptor - 请求方法：POST
2026-03-13 22:30:15 [http-nio-8080-exec-1] INFO  c.k.c.i.ControllerLogInterceptor - 请求 IP: 127.0.0.1
2026-03-13 22:30:15 [http-nio-8080-exec-1] INFO  c.k.c.i.ControllerLogInterceptor - 请求参数：无
2026-03-13 22:30:15 [http-nio-8080-exec-1] INFO  c.k.c.i.ControllerLogInterceptor - 请求体 (JSON): 
{
  "username" : "test",
  "password" : "123456"
}
```

#### 3.2 响应日志
```
2026-03-13 22:30:16 [http-nio-8080-exec-1] INFO  c.k.c.i.ControllerLogInterceptor - ========== 请求结束：com.kidgame.web.controller.BaseUserController.login 耗时：150ms ==========
2026-03-13 22:30:16 [http-nio-8080-exec-1] INFO  c.k.c.i.ControllerLogInterceptor - 响应状态：200
```

### 4. 日志级别控制

在 `application.yml` 中可以调整日志级别：

```yaml
logging:
  level:
    com.kidgame.common.interceptor.ControllerLogInterceptor: info  # 默认 info 级别
    com.kidgame.common.aspect.ControllerLogAspect: debug  # AOP 切面可以使用 debug 级别
```

### 5. 特性说明

1. **自动识别请求类型**: 
   - JSON 请求体会格式化显示
   - FormData 请求只打印类型，不打印文件内容
   - 普通表单参数会逐行打印

2. **性能友好**:
   - 使用 ThreadLocal 记录请求耗时
   - 响应数据过长时会自动截断（超过 5000 字符）

3. **异常处理**:
   - 如果读取请求体失败，会打印警告但不影响正常请求
   - 如果序列化响应数据失败，会降级使用 toString()

### 6. 注意事项

1. **敏感信息**: 
   - 密码等敏感字段会在日志中明文显示
   - 建议在生产环境降低日志级别或脱敏处理

2. **性能考虑**:
   - 生产环境建议将日志级别调整为 WARN 或 ERROR
   - 高并发场景可以考虑异步日志

3. **日志文件大小**:
   - JSON 请求/响应可能较大，注意配置日志滚动策略
   - 建议使用 logback 的 SizeAndTimeBasedRollingPolicy

### 7. 启用/禁用

如需禁用日志拦截器，可以在 `WebConfig` 中注释掉相关配置：

```java
// 注释掉这行即可禁用
// registry.addInterceptor(controllerLogInterceptor)
//         .addPathPatterns("/api/**")
```

### 8. 扩展功能

如果需要更强大的日志功能（如链路追踪、性能监控），可以考虑：
- 集成 Spring Cloud Sleuth
- 使用 Micrometer + Prometheus
- 接入 ELK 日志平台
