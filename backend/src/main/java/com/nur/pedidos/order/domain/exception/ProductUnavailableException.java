package com.nur.pedidos.order.domain.exception;

import com.nur.pedidos.shared.domain.exception.DomainException;

public class ProductUnavailableException extends DomainException {

    public ProductUnavailableException() {
        super("order.product_unavailable", "Un producto del pedido ya no está disponible");
    }
}
