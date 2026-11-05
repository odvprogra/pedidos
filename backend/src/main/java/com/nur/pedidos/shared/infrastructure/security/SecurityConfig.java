package com.nur.pedidos.shared.infrastructure.security;

import jakarta.servlet.DispatcherType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.LogoutConfigurer;
import org.springframework.security.config.annotation.web.configurers.RequestCacheConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import tools.jackson.databind.json.JsonMapper;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, JsonMapper jsonMapper) throws Exception {
        ProblemDetailsSecurityHandler problemDetails = new ProblemDetailsSecurityHandler(jsonMapper);
        http.authorizeHttpRequests(requests -> requests.dispatcherTypeMatchers(DispatcherType.ERROR)
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/health")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/register", "/api/v1/auth/login")
                        .permitAll()
                        .anyRequest()
                        .authenticated())
                .csrf(csrf -> csrf.spa())
                .exceptionHandling(exceptions ->
                        exceptions.authenticationEntryPoint(problemDetails).accessDeniedHandler(problemDetails))
                .requestCache(RequestCacheConfigurer::disable)
                .logout(LogoutConfigurer::disable);
        return http.build();
    }

    @Bean
    SecuritySessions securitySessions() {
        return new SecuritySessions();
    }
}
