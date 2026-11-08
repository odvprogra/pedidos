package com.nur.pedidos.order.domain.model;

public record OrderLine(Long productId, int quantity) {

    private static final int MIN_QUANTITY = 1;
    private static final int MAX_QUANTITY = 99;

    boolean hasValidQuantity() {
        return quantity >= MIN_QUANTITY && quantity <= MAX_QUANTITY;
    }
}
