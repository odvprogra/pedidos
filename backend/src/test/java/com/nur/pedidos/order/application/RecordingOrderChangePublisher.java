package com.nur.pedidos.order.application;

import com.nur.pedidos.order.domain.model.OrderChange;
import com.nur.pedidos.order.domain.port.OrderChangePublisher;
import java.util.ArrayList;
import java.util.List;

class RecordingOrderChangePublisher implements OrderChangePublisher {

    private final List<OrderChange> published = new ArrayList<>();

    @Override
    public void publish(OrderChange change) {
        published.add(change);
    }

    List<OrderChange> published() {
        return List.copyOf(published);
    }
}
