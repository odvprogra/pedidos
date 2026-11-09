package com.nur.pedidos.order.application;

import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderItem;
import com.nur.pedidos.order.domain.port.OrderRepository;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.TreeMap;
import java.util.function.Predicate;

class InMemoryOrderRepository implements OrderRepository {

    private static final Comparator<Order> NEWEST_FIRST =
            Comparator.comparing(Order::getPlacedAt).thenComparing(Order::getId).reversed();

    private final TreeMap<Long, Order> orders = new TreeMap<>();
    private long orderSequence;
    private long itemSequence;

    @Override
    public Order save(Order order) {
        Long id = order.getId() != null ? order.getId() : ++orderSequence;
        Order saved =
                copyOf(order, id, order.getItems().stream().map(this::withId).toList());
        orders.put(id, saved);
        return copyOf(saved);
    }

    @Override
    public Optional<Order> findById(Long id) {
        return Optional.ofNullable(orders.get(id)).map(InMemoryOrderRepository::copyOf);
    }

    @Override
    public Optional<Order> findByIdForUpdate(Long id) {
        return findById(id);
    }

    @Override
    public PageResult<Order> findPageOfCustomer(Long customerId, int page, int size) {
        return pageOf(order -> order.isPlacedBy(customerId), page, size);
    }

    List<Order> all() {
        return orders.values().stream().map(InMemoryOrderRepository::copyOf).toList();
    }

    Order get(Long id) {
        return findById(id).orElseThrow();
    }

    private PageResult<Order> pageOf(Predicate<Order> filter, int page, int size) {
        List<Order> matching =
                orders.values().stream().filter(filter).sorted(NEWEST_FIRST).toList();
        List<Order> items = matching.stream()
                .skip((long) page * size)
                .limit(size)
                .map(InMemoryOrderRepository::copyOf)
                .toList();
        return new PageResult<>(items, page, size, matching.size());
    }

    private OrderItem withId(OrderItem item) {
        Long id = item.id() != null ? item.id() : ++itemSequence;
        return new OrderItem(id, item.productId(), item.productName(), item.unitPrice(), item.quantity());
    }

    private static Order copyOf(Order order) {
        return copyOf(order, order.getId(), order.getItems());
    }

    private static Order copyOf(Order order, Long id, List<OrderItem> items) {
        return new Order(
                id,
                order.getCustomerId(),
                order.getRestaurantId(),
                order.getRestaurantName(),
                order.getStatus(),
                order.getTotal(),
                order.getPlacedAt(),
                order.getUpdatedAt(),
                items);
    }
}
