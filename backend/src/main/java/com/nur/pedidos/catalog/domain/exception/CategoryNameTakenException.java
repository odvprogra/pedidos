package com.nur.pedidos.catalog.domain.exception;

import com.nur.pedidos.shared.domain.exception.ConflictException;

public class CategoryNameTakenException extends ConflictException {

    public CategoryNameTakenException() {
        super("catalog.category_name_taken", "Ya tienes una categoría con ese nombre");
    }
}
