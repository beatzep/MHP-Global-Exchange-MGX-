package com.mhp.exchange.config;

import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

@Configuration
public class DataSourceConfig {

    private static final Logger logger = LoggerFactory.getLogger(DataSourceConfig.class);

    private boolean isUsingH2 = false;

    @Value("${spring.datasource.url:jdbc:mariadb://192.168.0.192:3306/meine_datenbank}")
    private String mariadbUrl;

    @Value("${spring.datasource.username:mgx_app}")
    private String mariadbUsername;

    @Value("${spring.datasource.password:SehrSicheresPasswort123!}")
    private String mariadbPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        // Try MariaDB first
        try {
            logger.info("Attempting to connect to MariaDB at: {}", mariadbUrl);
            HikariConfig mariadbConfig = new HikariConfig();
            mariadbConfig.setJdbcUrl(mariadbUrl);
            mariadbConfig.setUsername(mariadbUsername);
            mariadbConfig.setPassword(mariadbPassword);
            mariadbConfig.setDriverClassName("org.mariadb.jdbc.Driver");
            mariadbConfig.setConnectionTimeout(5000); // 5 seconds timeout
            mariadbConfig.setMaximumPoolSize(10);

            HikariDataSource mariadbDataSource = new HikariDataSource(mariadbConfig);

            // Test the connection
            try (Connection connection = mariadbDataSource.getConnection()) {
                logger.info("✓ Successfully connected to MariaDB");
                return mariadbDataSource;
            }
        } catch (Exception e) {
            logger.warn("✗ MariaDB connection failed: {} - Falling back to H2 in-memory database", e.getMessage());
        }

        // Fallback to H2
        logger.info("Starting with H2 in-memory database (Development Mode)");
        isUsingH2 = true;
        HikariConfig h2Config = new HikariConfig();
        h2Config.setJdbcUrl("jdbc:h2:mem:meine_datenbank;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE");
        h2Config.setUsername("sa");
        h2Config.setPassword("");
        h2Config.setDriverClassName("org.h2.Driver");
        h2Config.setMaximumPoolSize(5);

        return new HikariDataSource(h2Config);
    }

    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.mhp.exchange");

        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        em.setJpaVendorAdapter(vendorAdapter);

        Map<String, Object> properties = new HashMap<>();
        properties.put("hibernate.show_sql", true);
        properties.put("hibernate.format_sql", true);

        // Set dialect and ddl-auto based on database type
        if (isUsingH2) {
            properties.put("hibernate.dialect", "org.hibernate.dialect.H2Dialect");
            properties.put("hibernate.hbm2ddl.auto", "create-drop"); // H2: Test-DB, wird bei jedem Start zurückgesetzt
            logger.info("H2 Database Mode: create-drop (Test-Datenbank wird bei Neustart zurückgesetzt)");
        } else {
            properties.put("hibernate.dialect", "org.hibernate.dialect.MariaDBDialect");
            properties.put("hibernate.hbm2ddl.auto", "update"); // MariaDB: Persistente DB, behält Daten
            logger.info("MariaDB Mode: update (Daten bleiben erhalten)");
        }

        em.setJpaPropertyMap(properties);
        return em;
    }

    @Bean
    public PlatformTransactionManager transactionManager(LocalContainerEntityManagerFactoryBean entityManagerFactory) {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(entityManagerFactory.getObject());
        return transactionManager;
    }
}
