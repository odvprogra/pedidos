package com.nur.pedidos.order.application;

import com.nur.pedidos.order.domain.exception.OrderNotFoundException;
import com.nur.pedidos.order.domain.exception.OrderNotOwnerException;
import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.port.OrderRepository;
import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CancelOrderUseCase {

    private final OrderRepository orderRepository;
    private final Clock clock;

    @Transactional
    public Order execute(Long customerId, Long orderId) {
        Order order = orderRepository.findByIdForUpdate(orderId).orElseThrow(OrderNotFoundException::new);
        if (!order.isPlacedBy(customerId)) {
            throw new OrderNotOwnerException();
        }
        order.cancel(clock.instant());
        return orderRepository.save(order);
    }
}
