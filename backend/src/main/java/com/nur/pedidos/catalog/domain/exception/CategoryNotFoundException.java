package com.nur.pedidos.catalog.domain.exception;

import com.nur.pedidos.shared.domain.exception.NotFoundException;

public class CategoryNotFoundException extends NotFoundException {

    public CategoryNotFoundException() {
        super("catalog.category_not_found", "La categoría no existe");
    }
}
