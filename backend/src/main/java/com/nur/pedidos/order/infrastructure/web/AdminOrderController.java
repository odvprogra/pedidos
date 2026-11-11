package com.nur.pedidos.order.infrastructure.web;

import com.nur.pedidos.order.application.ListAllOrdersUseCase;
import com.nur.pedidos.shared.infrastructure.web.PageResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
class AdminOrderController {

    private final ListAllOrdersUseCase listAllOrders;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    PageResponse<OrderResponse> list(
            @RequestParam(defaultValue = "0") @Min(0) @Max(1_000_000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return PageResponse.from(listAllOrders.execute(page, size), OrderResponse::from);
    }
}
