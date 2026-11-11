package com.nur.pedidos.restaurant.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.model.RestaurantCategory;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class CloseRestaurantUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-07T15:00:00Z");

    private final InMemoryRestaurantRepository restaurantRepository = new InMemoryRestaurantRepository();
    private final CloseRestaurantUseCase closeRestaurant = new CloseRestaurantUseCase(restaurantRepository);

    @Test
    void closesOnlyTheRestaurantOfTheOwner() {
        restaurantRepository.save(restaurant(7L, true));
        restaurantRepository.save(restaurant(8L, true));

        closeRestaurant.execute(7L);

        assertThat(isOpen(7L)).isFalse();
        assertThat(isOpen(8L)).isTrue();
    }

    @Test
    void acceptsClosingAClosedRestaurant() {
        restaurantRepository.save(restaurant(7L, false));

        closeRestaurant.execute(7L);

        assertThat(isOpen(7L)).isFalse();
    }

    @Test
    void failsWhenTheOwnerHasNoRestaurant() {
        restaurantRepository.save(restaurant(7L, true));

        assertThatThrownBy(() -> closeRestaurant.execute(8L))
                .isInstanceOf(RestaurantNotFoundException.class)
                .extracting("code")
                .isEqualTo("restaurant.not_found");
        assertThat(isOpen(7L)).isTrue();
    }

    private static Restaurant restaurant(Long ownerId, boolean open) {
        return new Restaurant(
                null,
                ownerId,
                "La Casona",
                null,
                "Calle Sucre 245",
                RestaurantCategory.TRADITIONAL,
                null,
                open,
                false,
                NOW);
    }

    private boolean isOpen(Long ownerId) {
        return restaurantRepository.findByOwnerId(ownerId).orElseThrow().isOpen();
    }
}
