package com.nur.pedidos.order.domain.model;

import com.nur.pedidos.order.domain.exception.ProductUnavailableException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.Getter;

@Getter
public class Order {

    private final Long id;
    private final Long customerId;
    private final Long restaurantId;
    private final String restaurantName;
    private final OrderStatus status;
    private final BigDecimal total;
    private final Instant placedAt;
    private final Instant updatedAt;
    private final List<OrderItem> items;

    public Order(
            Long id,
            Long customerId,
            Long restaurantId,
            String restaurantName,
            OrderStatus status,
            BigDecimal total,
            Instant placedAt,
            Instant updatedAt,
            List<OrderItem> items) {
        this.id = id;
        this.customerId = customerId;
        this.restaurantId = restaurantId;
        this.restaurantName = restaurantName;
        this.status = status;
        this.total = total;
        this.placedAt = placedAt;
        this.updatedAt = updatedAt;
        this.items = List.copyOf(items);
    }

    public static Order place(
            Long customerId, RestaurantSnapshot restaurant, OrderLines lines, List<ProductSnapshot> menu, Instant now) {
        Map<Long, ProductSnapshot> menuById =
                menu.stream().collect(Collectors.toMap(ProductSnapshot::id, Function.identity()));
        List<OrderItem> items = lines.lines().stream()
                .map(line -> OrderItem.of(orderable(menuById.get(line.productId())), line.quantity()))
                .toList();
        return new Order(
                null,
                customerId,
                restaurant.id(),
                restaurant.name(),
                OrderStatus.PLACED,
                totalOf(items),
                now,
                now,
                items);
    }

    private static ProductSnapshot orderable(ProductSnapshot product) {
        if (product == null || !product.available()) {
            throw new ProductUnavailableException();
        }
        return product;
    }

    private static BigDecimal totalOf(List<OrderItem> items) {
        return items.stream().map(OrderItem::subtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
