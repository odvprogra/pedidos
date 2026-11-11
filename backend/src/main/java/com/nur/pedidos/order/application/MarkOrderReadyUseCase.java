package com.nur.pedidos.order.application;

import com.nur.pedidos.order.domain.exception.OrderNotFoundException;
import com.nur.pedidos.order.domain.exception.OrderNotOwnerException;
import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.port.OrderRepository;
import com.nur.pedidos.order.domain.port.RestaurantDirectory;
import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MarkOrderReadyUseCase {

    private final RestaurantDirectory restaurantDirectory;
    private final OrderRepository orderRepository;
    private final Clock clock;

    @Transactional
    public Order execute(Long ownerId, Long orderId) {
        Long restaurantId = restaurantDirectory.restaurantIdOf(ownerId);
        Order order = orderRepository.findByIdForUpdate(orderId).orElseThrow(OrderNotFoundException::new);
        if (!order.belongsTo(restaurantId)) {
            throw new OrderNotOwnerException();
        }
        order.markReady(clock.instant());
        return orderRepository.save(order);
    }
}
