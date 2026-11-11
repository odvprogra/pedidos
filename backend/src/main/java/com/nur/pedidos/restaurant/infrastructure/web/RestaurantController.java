package com.nur.pedidos.restaurant.infrastructure.web;

import com.nur.pedidos.restaurant.application.CloseRestaurantUseCase;
import com.nur.pedidos.restaurant.application.EditRestaurantUseCase;
import com.nur.pedidos.restaurant.application.GetOwnRestaurantUseCase;
import com.nur.pedidos.restaurant.application.OpenRestaurantUseCase;
import com.nur.pedidos.restaurant.application.RegisterRestaurantUseCase;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.shared.infrastructure.security.CurrentUser;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/restaurants")
@RequiredArgsConstructor
class RestaurantController {

    private static final URI OWN_RESTAURANT = URI.create("/api/v1/restaurants/mine");

    private final RegisterRestaurantUseCase registerRestaurant;
    private final GetOwnRestaurantUseCase getOwnRestaurant;
    private final EditRestaurantUseCase editRestaurant;
    private final OpenRestaurantUseCase openRestaurant;
    private final CloseRestaurantUseCase closeRestaurant;

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    ResponseEntity<RestaurantResponse> register(
            @AuthenticationPrincipal CurrentUser owner, @Valid @RequestBody RestaurantRequest request) {
        Restaurant restaurant = registerRestaurant.execute(request.toRegisterCommand(owner.id()));
        return ResponseEntity.created(OWN_RESTAURANT).body(RestaurantResponse.from(restaurant));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('OWNER')")
    RestaurantResponse mine(@AuthenticationPrincipal CurrentUser owner) {
        return RestaurantResponse.from(getOwnRestaurant.execute(owner.id()));
    }

    @PutMapping("/mine")
    @PreAuthorize("hasRole('OWNER')")
    RestaurantResponse edit(@AuthenticationPrincipal CurrentUser owner, @Valid @RequestBody RestaurantRequest request) {
        return RestaurantResponse.from(editRestaurant.execute(request.toEditCommand(owner.id())));
    }

    @PostMapping("/mine/open")
    @PreAuthorize("hasRole('OWNER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void open(@AuthenticationPrincipal CurrentUser owner) {
        openRestaurant.execute(owner.id());
    }

    @PostMapping("/mine/close")
    @PreAuthorize("hasRole('OWNER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void close(@AuthenticationPrincipal CurrentUser owner) {
        closeRestaurant.execute(owner.id());
    }
}
