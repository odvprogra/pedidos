package com.nur.pedidos.order.infrastructure.web;

import com.nur.pedidos.order.application.AcceptOrderUseCase;
import com.nur.pedidos.order.application.ListRestaurantOrdersUseCase;
import com.nur.pedidos.order.application.MarkOrderPickedUpUseCase;
import com.nur.pedidos.order.application.MarkOrderReadyUseCase;
import com.nur.pedidos.order.application.RejectOrderUseCase;
import com.nur.pedidos.order.application.StartPreparingOrderUseCase;
import com.nur.pedidos.order.domain.model.OrderStatus;
import com.nur.pedidos.shared.infrastructure.security.CurrentUser;
import com.nur.pedidos.shared.infrastructure.web.PageResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/restaurants/mine/orders")
@RequiredArgsConstructor
class RestaurantOrderController {

    private final ListRestaurantOrdersUseCase listRestaurantOrders;
    private final AcceptOrderUseCase acceptOrder;
    private final RejectOrderUseCase rejectOrder;
    private final StartPreparingOrderUseCase startPreparingOrder;
    private final MarkOrderReadyUseCase markOrderReady;
    private final MarkOrderPickedUpUseCase markOrderPickedUp;

    @GetMapping
    @PreAuthorize("hasRole('OWNER')")
    PageResponse<OrderResponse> list(
            @AuthenticationPrincipal CurrentUser owner,
            @RequestParam(name = "status", defaultValue = "") Set<OrderStatus> statuses,
            @RequestParam(defaultValue = "0") @Min(0) @Max(1_000_000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return PageResponse.from(listRestaurantOrders.execute(owner.id(), statuses, page, size), OrderResponse::from);
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasRole('OWNER')")
    OrderResponse accept(@AuthenticationPrincipal CurrentUser owner, @PathVariable Long id) {
        return OrderResponse.from(acceptOrder.execute(owner.id(), id));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('OWNER')")
    OrderResponse reject(@AuthenticationPrincipal CurrentUser owner, @PathVariable Long id) {
        return OrderResponse.from(rejectOrder.execute(owner.id(), id));
    }

    @PostMapping("/{id}/start-preparing")
    @PreAuthorize("hasRole('OWNER')")
    OrderResponse startPreparing(@AuthenticationPrincipal CurrentUser owner, @PathVariable Long id) {
        return OrderResponse.from(startPreparingOrder.execute(owner.id(), id));
    }

    @PostMapping("/{id}/mark-ready")
    @PreAuthorize("hasRole('OWNER')")
    OrderResponse markReady(@AuthenticationPrincipal CurrentUser owner, @PathVariable Long id) {
        return OrderResponse.from(markOrderReady.execute(owner.id(), id));
    }

    @PostMapping("/{id}/mark-picked-up")
    @PreAuthorize("hasRole('OWNER')")
    OrderResponse markPickedUp(@AuthenticationPrincipal CurrentUser owner, @PathVariable Long id) {
        return OrderResponse.from(markOrderPickedUp.execute(owner.id(), id));
    }
}
