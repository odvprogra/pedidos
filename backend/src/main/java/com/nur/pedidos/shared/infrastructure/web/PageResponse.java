package com.nur.pedidos.shared.infrastructure.web;

import com.nur.pedidos.shared.domain.model.PageResult;
import java.util.List;
import java.util.function.Function;

public record PageResponse<T>(List<T> items, int page, int size, long totalItems, int totalPages) {

    public static <D, T> PageResponse<T> from(PageResult<D> result, Function<D, T> toItem) {
        return new PageResponse<>(
                result.items().stream().map(toItem).toList(),
                result.page(),
                result.size(),
                result.totalItems(),
                result.totalPages());
    }
}
