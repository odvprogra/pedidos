package com.nur.pedidos.shared.infrastructure.web;

public record HealthResponse(
        String status,
        String javaVersion,
        String springBootVersion,
        boolean databaseConnected,
        String databaseVersion) {}
