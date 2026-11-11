package com.nur.pedidos.order.application;

import com.nur.pedidos.order.domain.exception.OrderNotFoundException;
import com.nur.pedidos.order.domain.exception.OrderNotOwnerException;
import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.port.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetCustomerOrderUseCase {

    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public Order execute(Long customerId, Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(OrderNotFoundException::new);
        if (!order.isPlacedBy(customerId)) {
            throw new OrderNotOwnerException();
        }
        return order;
    }
}
