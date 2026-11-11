package com.nur.pedidos.order.infrastructure.persistence;

import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderStatus;
import com.nur.pedidos.order.domain.port.OrderRepository;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class OrderPersistenceAdapter implements OrderRepository {

    private static final Sort NEWEST_FIRST = Sort.by(Sort.Order.desc("placedAt"), Sort.Order.desc("id"));

    private final OrderJpaRepository jpaRepository;

    @Override
    public Order save(Order order) {
        return jpaRepository.save(OrderEntity.fromDomain(order)).toDomain();
    }

    @Override
    public Optional<Order> findById(Long id) {
        return jpaRepository.findById(id).map(OrderEntity::toDomain);
    }

    @Override
    public Optional<Order> findByIdForUpdate(Long id) {
        return jpaRepository.findForUpdateById(id).map(OrderEntity::toDomain);
    }

    @Override
    public PageResult<Order> findPageOfCustomer(Long customerId, int page, int size) {
        return pageOf(jpaRepository.findAllByCustomerId(customerId, newestFirst(page, size)), page, size);
    }

    @Override
    public PageResult<Order> findPageOfRestaurant(Long restaurantId, Set<OrderStatus> statuses, int page, int size) {
        PageRequest request = newestFirst(page, size);
        Page<OrderEntity> entities = statuses.isEmpty()
                ? jpaRepository.findAllByRestaurantId(restaurantId, request)
                : jpaRepository.findAllByRestaurantIdAndStatusIn(restaurantId, statuses, request);
        return pageOf(entities, page, size);
    }

    private static PageRequest newestFirst(int page, int size) {
        return PageRequest.of(page, size, NEWEST_FIRST);
    }

    private static PageResult<Order> pageOf(Page<OrderEntity> entities, int page, int size) {
        return new PageResult<>(
                entities.map(OrderEntity::toDomain).getContent(), page, size, entities.getTotalElements());
    }
}
