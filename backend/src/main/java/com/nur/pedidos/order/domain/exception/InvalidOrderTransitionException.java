package com.nur.pedidos.order.domain.exception;

import com.nur.pedidos.shared.domain.exception.ConflictException;

public class InvalidOrderTransitionException extends ConflictException {

    public InvalidOrderTransitionException() {
        super("order.invalid_transition", "El pedido ya no admite ese cambio de estado");
    }
}
