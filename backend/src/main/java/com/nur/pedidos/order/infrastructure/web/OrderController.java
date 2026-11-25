package com.nur.pedidos.order.infrastructure.web;

import com.nur.pedidos.order.application.CancelOrderUseCase;
import com.nur.pedidos.order.application.GetCustomerOrderUseCase;
import com.nur.pedidos.order.application.ListCustomerOrdersUseCase;
import com.nur.pedidos.order.application.PlaceOrderUseCase;
import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.shared.infrastructure.security.CurrentUser;
import com.nur.pedidos.shared.infrastructure.web.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping(OrderController.ORDERS)
@RequiredArgsConstructor
class OrderController {

    static final String ORDERS = "/api/v1/orders";

    private final PlaceOrderUseCase placeOrder;
    private final ListCustomerOrdersUseCase listCustomerOrders;
    private final GetCustomerOrderUseCase getCustomerOrder;
    private final CancelOrderUseCase cancelOrder;
    private final OrderChangeStreams orderChangeStreams;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    ResponseEntity<OrderResponse> place(
            @AuthenticationPrincipal CurrentUser customer, @Valid @RequestBody PlaceOrderRequest request) {
        Order order = placeOrder.execute(request.toCommand(customer.id()));
        return ResponseEntity.created(URI.create(ORDERS + "/" + order.getId())).body(OrderResponse.from(order));
    }

    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    PageResponse<OrderResponse> list(
            @AuthenticationPrincipal CurrentUser customer,
            @RequestParam(defaultValue = "0") @Min(0) @Max(1_000_000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return PageResponse.from(listCustomerOrders.execute(customer.id(), page, size), OrderResponse::from);
    }

    @GetMapping(path = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasRole('CUSTOMER')")
    SseEmitter events(@AuthenticationPrincipal CurrentUser customer) {
        return orderChangeStreams.openForCustomer(customer.id());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    OrderResponse get(@AuthenticationPrincipal CurrentUser customer, @PathVariable Long id) {
        return OrderResponse.from(getCustomerOrder.execute(customer.id(), id));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    OrderResponse cancel(@AuthenticationPrincipal CurrentUser customer, @PathVariable Long id) {
        return OrderResponse.from(cancelOrder.execute(customer.id(), id));
    }
}
