package com.nur.pedidos.order.domain.model;

import com.nur.pedidos.order.domain.exception.InvalidOrderTransitionException;
import com.nur.pedidos.shared.domain.exception.DomainException;
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
    private OrderStatus status;
    private final BigDecimal total;
    private final Instant placedAt;
    private Instant updatedAt;
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

    public void accept(Instant now) {
        moveTo(OrderStatus.ACCEPTED, now);
    }

    public void reject(Instant now) {
        moveTo(OrderStatus.REJECTED, now);
    }

    public void startPreparing(Instant now) {
        moveTo(OrderStatus.IN_PREPARATION, now);
    }

    public void markReady(Instant now) {
        moveTo(OrderStatus.READY, now);
    }

    public void markPickedUp(Instant now) {
        moveTo(OrderStatus.PICKED_UP, now);
    }

    public void cancel(Instant now) {
        moveTo(OrderStatus.CANCELLED, now);
    }

    public boolean isPlacedBy(Long customerId) {
        return this.customerId.equals(customerId);
    }

    public boolean belongsTo(Long restaurantId) {
        return this.restaurantId.equals(restaurantId);
    }

    private void moveTo(OrderStatus next, Instant now) {
        if (!status.canBecome(next)) {
            throw new InvalidOrderTransitionException();
        }
        this.status = next;
        this.updatedAt = now;
    }

    private static ProductSnapshot orderable(ProductSnapshot product) {
        if (product == null || !product.available()) {
            throw new DomainException("order.product_unavailable", "Un producto del pedido ya no está disponible");
        }
        return product;
    }

    private static BigDecimal totalOf(List<OrderItem> items) {
        return items.stream().map(OrderItem::subtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
