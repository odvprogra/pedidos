package com.nur.pedidos.order.infrastructure.events;

import com.nur.pedidos.order.domain.model.OrderChange;
import com.nur.pedidos.order.domain.port.OrderChangePublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class SpringOrderChangePublisher implements OrderChangePublisher {

    private final ApplicationEventPublisher events;

    @Override
    public void publish(OrderChange change) {
        events.publishEvent(change);
    }
}
