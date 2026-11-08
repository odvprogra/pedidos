package com.nur.pedidos.order.infrastructure.persistence;

import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.port.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class OrderPersistenceAdapter implements OrderRepository {

    private final OrderJpaRepository jpaRepository;

    @Override
    public Order save(Order order) {
        return jpaRepository.save(OrderEntity.fromDomain(order)).toDomain();
    }
}
