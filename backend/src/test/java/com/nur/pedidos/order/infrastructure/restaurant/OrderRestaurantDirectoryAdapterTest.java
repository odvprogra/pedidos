package com.nur.pedidos.order.infrastructure.restaurant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.nur.pedidos.order.domain.exception.RestaurantUnavailableException;
import com.nur.pedidos.order.domain.model.RestaurantSnapshot;
import com.nur.pedidos.restaurant.application.GetVisibleRestaurantUseCase;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class OrderRestaurantDirectoryAdapterTest {

    private final GetVisibleRestaurantUseCase getVisibleRestaurant = mock(GetVisibleRestaurantUseCase.class);
    private final OrderRestaurantDirectoryAdapter directory = new OrderRestaurantDirectoryAdapter(getVisibleRestaurant);

    @Test
    void givesTheIdAndTheNameOfAnOpenRestaurant() {
        when(getVisibleRestaurant.execute(4L)).thenReturn(laCasona(true));

        assertThat(directory.restaurantTakingOrders(4L)).isEqualTo(new RestaurantSnapshot(4L, "La Casona"));
    }

    @Test
    void refusesAClosedRestaurant() {
        when(getVisibleRestaurant.execute(4L)).thenReturn(laCasona(false));

        assertThatThrownBy(() -> directory.restaurantTakingOrders(4L))
                .isInstanceOf(RestaurantUnavailableException.class)
                .extracting("code")
                .isEqualTo("order.restaurant_unavailable");
    }

    @Test
    void turnsAHiddenOrMissingRestaurantIntoAnUnavailableOne() {
        when(getVisibleRestaurant.execute(4L)).thenThrow(new RestaurantNotFoundException());

        assertThatThrownBy(() -> directory.restaurantTakingOrders(4L))
                .isInstanceOf(RestaurantUnavailableException.class)
                .extracting("code")
                .isEqualTo("order.restaurant_unavailable");
    }

    private static Restaurant laCasona(boolean open) {
        return new Restaurant(
                4L, 7L, "La Casona", null, "Calle Sucre 245", open, false, Instant.parse("2026-11-08T15:00:00Z"));
    }
}
