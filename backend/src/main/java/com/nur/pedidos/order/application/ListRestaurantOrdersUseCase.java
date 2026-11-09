package com.nur.pedidos.order.application;

import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderStatus;
import com.nur.pedidos.order.domain.port.OrderRepository;
import com.nur.pedidos.order.domain.port.RestaurantDirectory;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ListRestaurantOrdersUseCase {

    private final RestaurantDirectory restaurantDirectory;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public PageResult<Order> execute(Long ownerId, Set<OrderStatus> statuses, int page, int size) {
        Long restaurantId = restaurantDirectory.restaurantIdOf(ownerId);
        return orderRepository.findPageOfRestaurant(restaurantId, statuses, page, size);
    }
}
