package com.nur.pedidos.catalog.domain.exception;

import com.nur.pedidos.shared.domain.exception.ForbiddenException;

public class CatalogNotOwnerException extends ForbiddenException {

    public CatalogNotOwnerException() {
        super("catalog.not_owner", "Esa categoría o ese producto es de otro restaurante");
    }
}
