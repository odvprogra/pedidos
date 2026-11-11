package com.nur.pedidos.catalog.infrastructure.web;

import com.nur.pedidos.catalog.domain.model.Product;
import java.math.BigDecimal;

record ProductResponse(
        Long id,
        Long categoryId,
        String name,
        String description,
        BigDecimal price,
        boolean available,
        String imageUrl) {

    static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getCategoryId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.isAvailable(),
                product.getImageUrl());
    }
}
