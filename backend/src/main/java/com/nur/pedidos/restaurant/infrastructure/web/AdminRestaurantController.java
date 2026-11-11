package com.nur.pedidos.restaurant.infrastructure.web;

import com.nur.pedidos.restaurant.application.ListAllRestaurantsUseCase;
import com.nur.pedidos.restaurant.application.ReactivateRestaurantUseCase;
import com.nur.pedidos.restaurant.application.SuspendRestaurantUseCase;
import com.nur.pedidos.shared.infrastructure.web.PageResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
class AdminRestaurantController {

    private final ListAllRestaurantsUseCase listAllRestaurants;
    private final SuspendRestaurantUseCase suspendRestaurant;
    private final ReactivateRestaurantUseCase reactivateRestaurant;

    @GetMapping("/admin/restaurants")
    @PreAuthorize("hasRole('ADMIN')")
    PageResponse<RestaurantResponse> list(
            @RequestParam(defaultValue = "0") @Min(0) @Max(1_000_000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return PageResponse.from(listAllRestaurants.execute(page, size), RestaurantResponse::from);
    }

    @PostMapping("/restaurants/{id}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    RestaurantResponse suspend(@PathVariable Long id) {
        return RestaurantResponse.from(suspendRestaurant.execute(id));
    }

    @PostMapping("/restaurants/{id}/reactivate")
    @PreAuthorize("hasRole('ADMIN')")
    RestaurantResponse reactivate(@PathVariable Long id) {
        return RestaurantResponse.from(reactivateRestaurant.execute(id));
    }
}
