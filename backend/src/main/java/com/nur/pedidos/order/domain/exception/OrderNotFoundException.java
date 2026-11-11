package com.nur.pedidos.order.domain.exception;

import com.nur.pedidos.shared.domain.exception.NotFoundException;

public class OrderNotFoundException extends NotFoundException {

    public OrderNotFoundException() {
        super("order.not_found", "No encontramos el pedido");
    }
}
