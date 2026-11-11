package com.nur.pedidos.catalog.application;

import java.math.BigDecimal;

public record EditProductCommand(
        Long ownerId, Long productId, Long categoryId, String name, String description, BigDecimal price) {}
