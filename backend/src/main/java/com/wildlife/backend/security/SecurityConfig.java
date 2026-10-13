package com.wildlife.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/conflict-reports/**")
                        .hasAnyRole("COMMUNITY_MEMBER", "RANGER", "COMMUNITY_LIAISON_OFFICER", "PARK_MANAGER", "SUPERVISOR")
                        .requestMatchers(HttpMethod.PUT, "/api/conflict-reports/*/review")
                        .hasAnyRole("PARK_MANAGER", "SUPERVISOR")
                        .requestMatchers(HttpMethod.PUT, "/api/conflict-reports/*/assign")
                        .hasAnyRole("PARK_MANAGER", "SUPERVISOR")
                        .requestMatchers(HttpMethod.PUT, "/api/conflict-reports/*/respond")
                        .hasAnyRole("COMMUNITY_LIAISON_OFFICER", "PARK_MANAGER", "SUPERVISOR")
                        .requestMatchers(HttpMethod.PUT, "/api/conflict-reports/*/resolve")
                        .hasAnyRole("COMMUNITY_LIAISON_OFFICER", "PARK_MANAGER", "SUPERVISOR")
                        .requestMatchers(HttpMethod.PUT, "/api/conflict-reports/*/close")
                        .hasAnyRole("PARK_MANAGER", "SUPERVISOR")
                        .requestMatchers("/api/risk-zones/**")
                        .hasAnyRole("PARK_MANAGER", "SUPERVISOR")
                        .requestMatchers(HttpMethod.POST, "/api/animals/**")
                        .hasAnyRole("PARK_MANAGER", "SUPERVISOR")
                        .requestMatchers(HttpMethod.PUT, "/api/animals/**")
                        .hasAnyRole("PARK_MANAGER", "SUPERVISOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/animals/**")
                        .hasAnyRole("PARK_MANAGER", "SUPERVISOR")
                        .requestMatchers("/api/rangers/**", "/api/patrol-routes/**")
                        .hasAnyRole("PARK_MANAGER", "SUPERVISOR")
                        .requestMatchers("/api/responders/**")
                        .hasAnyRole("PARK_MANAGER", "SUPERVISOR")
                        .requestMatchers(HttpMethod.POST, "/api/patrols")
                        .hasAnyRole("PARK_MANAGER", "SUPERVISOR")
                        .anyRequest().authenticated())
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS"
        ));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
