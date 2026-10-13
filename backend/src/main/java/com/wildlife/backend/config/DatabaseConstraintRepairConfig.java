package com.wildlife.backend.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseConstraintRepairConfig {

    @Bean
    public ApplicationRunner repairAppUserRoleConstraint(JdbcTemplate jdbcTemplate) {
        return args -> jdbcTemplate.execute("""
                DO $$
                BEGIN
                    ALTER TABLE app_users
                    DROP CONSTRAINT IF EXISTS app_users_role_check;

                    ALTER TABLE app_users
                    ADD CONSTRAINT app_users_role_check
                    CHECK (role IN (
                        'RANGER',
                        'COMMUNITY_MEMBER',
                        'COMMUNITY_LIAISON_OFFICER',
                        'PARK_MANAGER',
                        'SUPERVISOR'
                    ));
                END $$;
                """);
    }
}
