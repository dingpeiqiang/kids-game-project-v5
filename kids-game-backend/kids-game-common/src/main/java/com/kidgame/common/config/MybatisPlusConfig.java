package com.kidgame.common.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.List;

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
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }

    /**
     * 自定义 SqlSessionFactory：枚举处理器 + Mapper XML（与 application-*.yml 中 mapper-locations 一致）
     */
    @Bean
    public SqlSessionFactory sqlSessionFactory(
            DataSource dataSource,
            MybatisPlusInterceptor mybatisPlusInterceptor) throws Exception {
        MybatisSqlSessionFactoryBean factoryBean = new MybatisSqlSessionFactoryBean();
        factoryBean.setDataSource(dataSource);
        factoryBean.setPlugins(mybatisPlusInterceptor);

        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        List<Resource> mapperXml = new ArrayList<>();
        for (String pattern : new String[]{
                "classpath*:mapper/**/*.xml",
                "classpath*:com/kidgame/dao/mapper/**/*.xml"
        }) {
            Resource[] found = resolver.getResources(pattern);
            for (Resource r : found) {
                mapperXml.add(r);
            }
        }
        factoryBean.setMapperLocations(mapperXml.toArray(Resource[]::new));

        MybatisConfiguration configuration = new MybatisConfiguration();
        configuration.setMapUnderscoreToCamelCase(true);
        configuration.setDefaultEnumTypeHandler(
                com.baomidou.mybatisplus.core.handlers.MybatisEnumTypeHandler.class);
        factoryBean.setConfiguration(configuration);

        return factoryBean.getObject();
    }
}
