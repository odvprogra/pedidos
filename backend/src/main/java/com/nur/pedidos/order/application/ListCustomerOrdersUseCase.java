package com.nur.pedidos.order.application;

import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.port.OrderRepository;
import com.nur.pedidos.shared.domain.model.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ListCustomerOrdersUseCase {

    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public PageResult<Order> execute(Long customerId, int page, int size) {
        return orderRepository.findPageOfCustomer(customerId, page, size);
    }
}
