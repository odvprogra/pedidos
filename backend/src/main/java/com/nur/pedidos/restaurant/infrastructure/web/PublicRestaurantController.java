package com.nur.pedidos.restaurant.infrastructure.web;

import com.nur.pedidos.restaurant.application.GetVisibleRestaurantUseCase;
import com.nur.pedidos.restaurant.application.ListVisibleRestaurantsUseCase;
import com.nur.pedidos.shared.infrastructure.web.PageResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/restaurants")
@RequiredArgsConstructor
class PublicRestaurantController {

    private final ListVisibleRestaurantsUseCase listVisibleRestaurants;
    private final GetVisibleRestaurantUseCase getVisibleRestaurant;

    @GetMapping
    PageResponse<PublicRestaurantResponse> list(
            @RequestParam(defaultValue = "0") @Min(0) @Max(1_000_000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return PageResponse.from(listVisibleRestaurants.execute(page, size), PublicRestaurantResponse::from);
    }

    @GetMapping("/{id}")
    PublicRestaurantResponse get(@PathVariable Long id) {
        return PublicRestaurantResponse.from(getVisibleRestaurant.execute(id));
    }
}
