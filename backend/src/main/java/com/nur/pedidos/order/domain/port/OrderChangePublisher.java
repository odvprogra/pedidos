package com.nur.pedidos.order.domain.port;

import com.nur.pedidos.order.domain.model.OrderChange;

public interface OrderChangePublisher {

    void publish(OrderChange change);
}
