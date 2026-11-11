package com.nur.pedidos.order.infrastructure.web;

import com.nur.pedidos.order.application.PlaceOrderUseCase;
import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.shared.infrastructure.security.CurrentUser;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(OrderController.ORDERS)
@RequiredArgsConstructor
class OrderController {

    static final String ORDERS = "/api/v1/orders";

    private final PlaceOrderUseCase placeOrder;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    ResponseEntity<OrderResponse> place(
            @AuthenticationPrincipal CurrentUser customer, @Valid @RequestBody PlaceOrderRequest request) {
        Order order = placeOrder.execute(request.toCommand(customer.id()));
        return ResponseEntity.created(URI.create(ORDERS + "/" + order.getId())).body(OrderResponse.from(order));
    }
}
