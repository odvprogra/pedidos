package com.nur.pedidos.catalog.application;

import java.math.BigDecimal;

public record CreateProductCommand(Long ownerId, Long categoryId, String name, String description, BigDecimal price) {}
