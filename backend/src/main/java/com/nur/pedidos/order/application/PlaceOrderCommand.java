package com.nur.pedidos.order.application;

import com.nur.pedidos.order.domain.model.OrderLine;
import java.util.List;

public record PlaceOrderCommand(Long customerId, Long restaurantId, List<OrderLine> lines) {}
