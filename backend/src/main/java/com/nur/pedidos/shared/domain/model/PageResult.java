package com.nur.pedidos.shared.domain.model;

import java.util.List;

public record PageResult<T>(List<T> items, int page, int size, long totalItems) {

    public PageResult {
        items = List.copyOf(items);
    }

    public int totalPages() {
        return (int) Math.ceilDiv(totalItems, size);
    }
}
