package com.nur.pedidos.order.infrastructure.persistence;

import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.port.OrderRepository;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.util.Optional;
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
        Page<OrderEntity> entities =
                jpaRepository.findAllByCustomerId(customerId, PageRequest.of(page, size, NEWEST_FIRST));
        return new PageResult<>(
                entities.map(OrderEntity::toDomain).getContent(), page, size, entities.getTotalElements());
    }
}
