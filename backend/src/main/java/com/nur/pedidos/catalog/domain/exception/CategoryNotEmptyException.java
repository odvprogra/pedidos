package com.nur.pedidos.catalog.domain.exception;

import com.nur.pedidos.shared.domain.exception.ConflictException;

public class CategoryNotEmptyException extends ConflictException {

    public CategoryNotEmptyException() {
        super("catalog.category_not_empty", "La categoría tiene productos: muévelos o bórralos antes");
    }
}
