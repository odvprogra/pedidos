package com.nur.pedidos.catalog.domain.exception;

import com.nur.pedidos.shared.domain.exception.NotFoundException;

public class ProductNotFoundException extends NotFoundException {

    public ProductNotFoundException() {
        super("catalog.product_not_found", "El producto no existe");
    }
}
