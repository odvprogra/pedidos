package com.nur.pedidos.shared.domain.model;

import java.util.List;

public record PageResult<T>(List<T> items, int page, int size, long totalItems) {

    public PageResult {
        if (page < 0 || size < 1 || totalItems < 0) {
            throw new IllegalArgumentException(
                    "Invalid page %d of size %d with %d items".formatted(page, size, totalItems));
        }
        items = List.copyOf(items);
    }

    public int totalPages() {
        return (int) Math.ceilDiv(totalItems, size);
    }
}
