package com.nur.pedidos.restaurant.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.restaurant.domain.exception.RestaurantSuspendedException;
import com.nur.pedidos.shared.domain.exception.DomainException;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class RestaurantTest {

    private static final Instant NOW = Instant.parse("2026-11-07T15:00:00Z");

    @Test
    void registersAClosedRestaurantWithTrimmedFields() {
        Restaurant restaurant =
                Restaurant.register(7L, "  La Casona  ", "  Comida criolla  ", "  Calle Sucre 245 ", NOW);

        assertThat(restaurant.getId()).isNull();
        assertThat(restaurant.getOwnerId()).isEqualTo(7L);
        assertThat(restaurant.getName()).isEqualTo("La Casona");
        assertThat(restaurant.getDescription()).isEqualTo("Comida criolla");
        assertThat(restaurant.getAddress()).isEqualTo("Calle Sucre 245");
        assertThat(restaurant.isOpen()).isFalse();
        assertThat(restaurant.isSuspended()).isFalse();
        assertThat(restaurant.getCreatedAt()).isEqualTo(NOW);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void registersWithoutDescriptionWhenItIsBlank(String description) {
        Restaurant restaurant = Restaurant.register(7L, "La Casona", description, "Calle Sucre 245", NOW);

        assertThat(restaurant.getDescription()).isNull();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void rejectsABlankName(String name) {
        assertThatThrownBy(() -> Restaurant.register(7L, name, null, "Calle Sucre 245", NOW))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("restaurant.name_required");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void rejectsABlankAddress(String address) {
        assertThatThrownBy(() -> Restaurant.register(7L, "La Casona", null, address, NOW))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("restaurant.address_required");
    }

    @Test
    void opensAClosedRestaurant() {
        Restaurant restaurant = restaurant(false, false);

        restaurant.open();

        assertThat(restaurant.isOpen()).isTrue();
    }

    @Test
    void keepsAnOpenRestaurantOpen() {
        Restaurant restaurant = restaurant(true, false);

        restaurant.open();

        assertThat(restaurant.isOpen()).isTrue();
    }

    @Test
    void closesAnOpenRestaurant() {
        Restaurant restaurant = restaurant(true, false);

        restaurant.close();

        assertThat(restaurant.isOpen()).isFalse();
    }

    @Test
    void keepsAClosedRestaurantClosed() {
        Restaurant restaurant = restaurant(false, false);

        restaurant.close();

        assertThat(restaurant.isOpen()).isFalse();
    }

    @Test
    void refusesToOpenASuspendedRestaurant() {
        Restaurant restaurant = restaurant(false, true);

        assertThatThrownBy(restaurant::open)
                .isInstanceOf(RestaurantSuspendedException.class)
                .extracting("code")
                .isEqualTo("restaurant.suspended");
        assertThat(restaurant.isOpen()).isFalse();
    }

    @Test
    void closesASuspendedRestaurant() {
        Restaurant restaurant = restaurant(false, true);

        restaurant.close();

        assertThat(restaurant.isOpen()).isFalse();
    }

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void suspendingAlsoClosesTheRestaurant(boolean open) {
        Restaurant restaurant = restaurant(open, false);

        restaurant.suspend();

        assertThat(restaurant.isSuspended()).isTrue();
        assertThat(restaurant.isOpen()).isFalse();
    }

    @Test
    void keepsASuspendedRestaurantSuspendedAndClosed() {
        Restaurant restaurant = restaurant(false, true);

        restaurant.suspend();

        assertThat(restaurant.isSuspended()).isTrue();
        assertThat(restaurant.isOpen()).isFalse();
    }

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void reactivatesASuspendedRestaurantClosed(boolean open) {
        Restaurant restaurant = restaurant(open, true);

        restaurant.reactivate();

        assertThat(restaurant.isSuspended()).isFalse();
        assertThat(restaurant.isOpen()).isFalse();
    }

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void leavesAnActiveRestaurantAsItWasWhenReactivated(boolean open) {
        Restaurant restaurant = restaurant(open, false);

        restaurant.reactivate();

        assertThat(restaurant.isSuspended()).isFalse();
        assertThat(restaurant.isOpen()).isEqualTo(open);
    }

    @Test
    void canBeOpenedByItsOwnerOnceItIsReactivated() {
        Restaurant restaurant = restaurant(false, false);
        restaurant.suspend();
        restaurant.reactivate();

        restaurant.open();

        assertThat(restaurant.acceptsOrders()).isTrue();
    }

    @ParameterizedTest
    @CsvSource({"true, false, true", "false, false, true", "false, true, false", "true, true, false"})
    void isVisibleToCustomersUnlessItIsSuspended(boolean open, boolean suspended, boolean visible) {
        assertThat(restaurant(open, suspended).isVisible()).isEqualTo(visible);
    }

    @ParameterizedTest
    @CsvSource({"true, false, true", "false, false, false", "false, true, false", "true, true, false"})
    void acceptsOrdersOnlyWhileItIsOpenAndNotSuspended(boolean open, boolean suspended, boolean acceptsOrders) {
        assertThat(restaurant(open, suspended).acceptsOrders()).isEqualTo(acceptsOrders);
    }

    private static Restaurant restaurant(boolean open, boolean suspended) {
        return new Restaurant(1L, 7L, "La Casona", null, "Calle Sucre 245", open, suspended, NOW);
    }
}
