package com.nur.pedidos.catalog.infrastructure.restaurant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.nur.pedidos.restaurant.application.GetOwnRestaurantUseCase;
import com.nur.pedidos.restaurant.application.GetVisibleRestaurantUseCase;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.model.RestaurantCategory;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class RestaurantDirectoryAdapterTest {

    private final GetOwnRestaurantUseCase getOwnRestaurant = mock(GetOwnRestaurantUseCase.class);
    private final GetVisibleRestaurantUseCase getVisibleRestaurant = mock(GetVisibleRestaurantUseCase.class);
    private final RestaurantDirectoryAdapter directory =
            new RestaurantDirectoryAdapter(getOwnRestaurant, getVisibleRestaurant);

    @Test
    void givesTheIdOfTheRestaurantOfTheOwner() {
        when(getOwnRestaurant.execute(7L)).thenReturn(laCasona());

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

    @Test
    void acceptsAVisibleRestaurant() {
        when(getVisibleRestaurant.execute(4L)).thenReturn(laCasona());

        assertThatCode(() -> directory.ensureVisible(4L)).doesNotThrowAnyException();
        verify(getVisibleRestaurant).execute(4L);
    }

    @Test
    void letsTheHiddenRestaurantErrorReachTheCaller() {
        when(getVisibleRestaurant.execute(4L)).thenThrow(new RestaurantNotFoundException());

        assertThatThrownBy(() -> directory.ensureVisible(4L))
                .isInstanceOf(RestaurantNotFoundException.class)
                .extracting("code")
                .isEqualTo("restaurant.not_found");
    }

    private static Restaurant laCasona() {
        return new Restaurant(
                4L,
                7L,
                "La Casona",
                null,
                "Calle Sucre 245",
                RestaurantCategory.TRADITIONAL,
                null,
                false,
                false,
                Instant.parse("2026-11-07T15:00:00Z"));
    }
}
