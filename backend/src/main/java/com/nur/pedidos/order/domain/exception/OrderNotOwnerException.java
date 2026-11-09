package com.nur.pedidos.order.domain.exception;

import com.nur.pedidos.shared.domain.exception.ForbiddenException;

public class OrderNotOwnerException extends ForbiddenException {

    public OrderNotOwnerException() {
        super("order.not_owner", "Ese pedido es de otra cuenta o de otro restaurante");
    }
}
