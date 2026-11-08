package com.nur.pedidos.restaurant.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class GetOwnRestaurantUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-07T15:00:00Z");

    private final InMemoryRestaurantRepository restaurantRepository = new InMemoryRestaurantRepository();
    private final GetOwnRestaurantUseCase getOwnRestaurant = new GetOwnRestaurantUseCase(restaurantRepository);

    @Test
    void returnsTheRestaurantOfTheOwner() {
        restaurantRepository.save(Restaurant.register(7L, "La Casona", null, "Calle Sucre 245", NOW));
        restaurantRepository.save(Restaurant.register(8L, "El Fogón", null, "Av. Banzer 120", NOW));

        Restaurant restaurant = getOwnRestaurant.execute(8L);

        assertThat(restaurant.getOwnerId()).isEqualTo(8L);
        assertThat(restaurant.getName()).isEqualTo("El Fogón");
    }

    @Test
    void failsWhenTheOwnerHasNoRestaurant() {
        restaurantRepository.save(Restaurant.register(7L, "La Casona", null, "Calle Sucre 245", NOW));

        assertThatThrownBy(() -> getOwnRestaurant.execute(8L))
                .isInstanceOf(RestaurantNotFoundException.class)
                .extracting("code")
                .isEqualTo("restaurant.not_found");
    }
}
