package com.nur.pedidos.order.domain.port;

import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderStatus;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.util.Optional;
import java.util.Set;

public interface OrderRepository {

    Order save(Order order);

    Optional<Order> findById(Long id);

    Optional<Order> findByIdForUpdate(Long id);

    PageResult<Order> findPage(int page, int size);

    PageResult<Order> findPageOfCustomer(Long customerId, int page, int size);

    PageResult<Order> findPageOfRestaurant(Long restaurantId, Set<OrderStatus> statuses, int page, int size);
}
