package com.nur.pedidos.catalog.infrastructure.restaurant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.nur.pedidos.restaurant.application.GetOwnRestaurantUseCase;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class RestaurantDirectoryAdapterTest {

    private final GetOwnRestaurantUseCase getOwnRestaurant = mock(GetOwnRestaurantUseCase.class);
    private final RestaurantDirectoryAdapter directory = new RestaurantDirectoryAdapter(getOwnRestaurant);

    @Test
    void givesTheIdOfTheRestaurantOfTheOwner() {
        when(getOwnRestaurant.execute(7L))
                .thenReturn(new Restaurant(
                        4L,
                        7L,
                        "La Casona",
                        null,
                        "Calle Sucre 245",
                        false,
                        false,
                        Instant.parse("2026-11-07T15:00:00Z")));

        assertThat(directory.restaurantIdOf(7L)).isEqualTo(4L);
    }

    @Test
    void letsTheMissingRestaurantErrorReachTheCaller() {
        when(getOwnRestaurant.execute(7L)).thenThrow(new RestaurantNotFoundException());

        assertThatThrownBy(() -> directory.restaurantIdOf(7L))
                .isInstanceOf(RestaurantNotFoundException.class)
                .extracting("code")
                .isEqualTo("restaurant.not_found");
    }
}
