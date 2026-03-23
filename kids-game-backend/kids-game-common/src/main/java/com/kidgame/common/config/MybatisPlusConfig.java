package com.kidgame.common.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * MyBatis-Plus 配置
 */
@Configuration
@MapperScan("com.kidgame.dao.mapper")
public class MybatisPlusConfig {

    /**
     * 分页插件
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 添加分页插件（MySQL 数据库）
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }

    /**
     * 配置 SqlSessionFactory，启用枚举处理器
     */
    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
        com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean factoryBean = 
            new com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean();
        factoryBean.setDataSource(dataSource);
        
        // 注册分页插件
        MybatisPlusInterceptor interceptor = mybatisPlusInterceptor();
        factoryBean.setPlugins(interceptor);
        
        MybatisConfiguration configuration = new MybatisConfiguration();
        // 设置默认的枚举类型处理器，使用 @EnumValue 注解标记的值
        configuration.setDefaultEnumTypeHandler(com.baomidou.mybatisplus.core.handlers.MybatisEnumTypeHandler.class);
        factoryBean.setConfiguration(configuration);

        return factoryBean.getObject();
    }
}
