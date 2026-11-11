package com.nur.pedidos.order.domain.model;

import com.nur.pedidos.shared.domain.exception.DomainException;
import java.util.List;

public record OrderLines(List<OrderLine> lines) {

    public OrderLines {
        if (lines.isEmpty()) {
            throw new DomainException("order.empty", "El pedido no tiene productos");
        }
        if (!lines.stream().allMatch(OrderLine::hasValidQuantity)) {
            throw new DomainException("order.invalid_quantity", "La cantidad de cada producto va de 1 a 99");
        }
        if (lines.stream().map(OrderLine::productId).distinct().count() < lines.size()) {
            throw new DomainException("order.duplicate_product", "Un producto aparece más de una vez en el pedido");
        }
        lines = List.copyOf(lines);
    }
}
