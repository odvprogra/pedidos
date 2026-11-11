package com.nur.pedidos.order.application;

import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.port.OrderRepository;
import com.nur.pedidos.shared.domain.model.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ListAllOrdersUseCase {

    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public PageResult<Order> execute(int page, int size) {
        return orderRepository.findPage(page, size);
    }
}
