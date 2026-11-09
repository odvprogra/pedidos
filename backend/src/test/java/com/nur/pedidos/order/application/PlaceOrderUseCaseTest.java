package com.nur.pedidos.order.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

import com.nur.pedidos.order.domain.exception.RestaurantUnavailableException;
import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderItem;
import com.nur.pedidos.order.domain.model.OrderLine;
import com.nur.pedidos.order.domain.model.OrderStatus;
import com.nur.pedidos.order.domain.model.ProductSnapshot;
import com.nur.pedidos.shared.domain.exception.DomainException;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PlaceOrderUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-08T15:00:00Z");
    private static final Long LA_CASONA = 4L;
    private static final Long EL_FOGON = 5L;
    private static final Long CLOSED_RESTAURANT = 6L;

    private final InMemoryRestaurantDirectory restaurantDirectory = new InMemoryRestaurantDirectory();
    private final InMemoryProductCatalog productCatalog = new InMemoryProductCatalog();
    private final InMemoryOrderRepository orderRepository = new InMemoryOrderRepository();
    private final PlaceOrderUseCase placeOrder = new PlaceOrderUseCase(
            restaurantDirectory, productCatalog, orderRepository, Clock.fixed(NOW, ZoneOffset.UTC));

    @BeforeEach
    void openRestaurants() {
        restaurantDirectory.takeOrders(LA_CASONA, "La Casona");
        productCatalog.publish(
                LA_CASONA,
                new ProductSnapshot(10L, "Silpancho", new BigDecimal("45.00"), true),
                new ProductSnapshot(11L, "Pique macho", new BigDecimal("60.00"), false),
                new ProductSnapshot(12L, "Limonada", new BigDecimal("10.50"), true));
        restaurantDirectory.takeOrders(EL_FOGON, "El Fogón");
        productCatalog.publish(EL_FOGON, new ProductSnapshot(20L, "Napolitana", new BigDecimal("70.00"), true));
    }

    @Test
    void savesTheOrderOfTheCustomerAtTheTimeOfTheClock() {
        Order order = placeOrder.execute(
                new PlaceOrderCommand(7L, LA_CASONA, List.of(new OrderLine(10L, 2), new OrderLine(12L, 1))));

        assertThat(orderRepository.all()).singleElement().satisfies(saved -> {
            assertThat(saved.getId()).isEqualTo(order.getId());
            assertThat(saved)
                    .extracting(
                            Order::getCustomerId,
                            Order::getRestaurantId,
                            Order::getRestaurantName,
                            Order::getStatus,
                            Order::getTotal,
                            Order::getPlacedAt)
                    .containsExactly(7L, LA_CASONA, "La Casona", OrderStatus.PLACED, new BigDecimal("100.50"), NOW);
            assertThat(saved.getItems())
                    .extracting(OrderItem::productName, OrderItem::quantity)
                    .containsExactly(tuple("Silpancho", 2), tuple("Limonada", 1));
        });
        assertThat(order.getItems()).extracting(OrderItem::id).doesNotContainNull();
    }

    @Test
    void refusesARestaurantThatIsNotTakingOrders() {
        PlaceOrderCommand command = new PlaceOrderCommand(7L, CLOSED_RESTAURANT, List.of(new OrderLine(10L, 1)));

        assertThatThrownBy(() -> placeOrder.execute(command))
                .isInstanceOf(RestaurantUnavailableException.class)
                .extracting("code")
                .isEqualTo("order.restaurant_unavailable");
        assertThat(orderRepository.all()).isEmpty();
    }

    @Test
    void refusesAProductFromTheMenuOfAnotherRestaurant() {
        PlaceOrderCommand command =
                new PlaceOrderCommand(7L, LA_CASONA, List.of(new OrderLine(10L, 1), new OrderLine(20L, 1)));

        assertThatThrownBy(() -> placeOrder.execute(command))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("order.product_unavailable");
        assertThat(orderRepository.all()).isEmpty();
    }

    @Test
    void refusesTheWholeOrderWhenOneProductIsSoldOut() {
        PlaceOrderCommand command =
                new PlaceOrderCommand(7L, LA_CASONA, List.of(new OrderLine(10L, 1), new OrderLine(11L, 1)));

        assertThatThrownBy(() -> placeOrder.execute(command)).isInstanceOf(DomainException.class);
        assertThat(orderRepository.all()).isEmpty();
    }

    @Test
    void checksTheItemsBeforeAskingForTheRestaurant() {
        PlaceOrderCommand command = new PlaceOrderCommand(7L, CLOSED_RESTAURANT, List.of());

        assertThatThrownBy(() -> placeOrder.execute(command))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("order.empty");
    }
}
