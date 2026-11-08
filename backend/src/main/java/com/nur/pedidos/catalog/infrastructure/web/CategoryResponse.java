package com.nur.pedidos.catalog.infrastructure.web;

import com.nur.pedidos.catalog.domain.model.Category;

record CategoryResponse(Long id, String name) {

    static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getName());
    }
}
