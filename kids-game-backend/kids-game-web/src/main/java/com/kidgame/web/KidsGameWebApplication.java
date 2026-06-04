package com.kidgame.web;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 儿童游戏平台 Web 应用启动类
 */
@SpringBootApplication(scanBasePackages = "com.kidgame")
@EnableScheduling
public class KidsGameWebApplication {

    public static void main(String[] args) {
        SpringApplication.run(KidsGameWebApplication.class, args);
        System.out.println("========================================");
        System.out.println("儿童游戏平台后端启动成功！");
        System.out.println("API文档地址: http://localhost:8080/doc.html");
        System.out.println("========================================");
    }
}


