package com.nur.pedidos.shared.infrastructure.web;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.SpringBootVersion;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    public HealthResponse check() {
        String databaseVersion = findDatabaseVersion();

        return new HealthResponse(
                "UP",
                Runtime.version().toString(),
                SpringBootVersion.getVersion(),
                databaseVersion != null,
                databaseVersion);
    }

    private String findDatabaseVersion() {
        try {
            return jdbcTemplate.queryForObject("show server_version", String.class);
        } catch (DataAccessException ex) {
            return null;
        }
    }
}
