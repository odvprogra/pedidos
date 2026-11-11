package com.nur.pedidos.order.domain.model;

public enum OrderStatus {
    PLACED,
    ACCEPTED,
    IN_PREPARATION,
    READY,
    PICKED_UP,
    REJECTED,
    CANCELLED;

    boolean canBecome(OrderStatus next) {
        return switch (this) {
            case PLACED -> next == ACCEPTED || next == REJECTED || next == CANCELLED;
            case ACCEPTED -> next == IN_PREPARATION;
            case IN_PREPARATION -> next == READY;
            case READY -> next == PICKED_UP;
            case PICKED_UP, REJECTED, CANCELLED -> false;
        };
    }
}
