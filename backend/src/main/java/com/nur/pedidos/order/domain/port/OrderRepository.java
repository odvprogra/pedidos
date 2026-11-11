package com.nur.pedidos.order.domain.port;

import com.nur.pedidos.order.domain.model.Order;

public interface OrderRepository {

    Order save(Order order);
}
