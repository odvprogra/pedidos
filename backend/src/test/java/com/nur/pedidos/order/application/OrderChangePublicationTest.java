package com.nur.pedidos.order.application;

import static com.nur.pedidos.order.application.OrderFixtures.order;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.order.domain.exception.InvalidOrderTransitionException;
import com.nur.pedidos.order.domain.exception.OrderNotOwnerException;
import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderChange;
import com.nur.pedidos.order.domain.model.OrderLine;
import com.nur.pedidos.order.domain.model.OrderStatus;
import com.nur.pedidos.order.domain.model.ProductSnapshot;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class OrderChangePublicationTest {

    private static final Instant NOW = Instant.parse("2026-11-08T15:10:00Z");
    private static final Long CUSTOMER = 7L;
    private static final Long OTHER_CUSTOMER = 8L;
    private static final Long OWNER = 3L;
    private static final Long LA_CASONA = 4L;
    private static final Long EL_FOGON = 5L;

    private final Clock clock = Clock.fixed(NOW, ZoneOffset.UTC);
    private final InMemoryRestaurantDirectory restaurantDirectory = new InMemoryRestaurantDirectory();
    private final InMemoryProductCatalog productCatalog = new InMemoryProductCatalog();
    private final InMemoryOrderRepository orderRepository = new InMemoryOrderRepository();
    private final RecordingOrderChangePublisher orderChanges = new RecordingOrderChangePublisher();

    private final PlaceOrderUseCase placeOrder =
            new PlaceOrderUseCase(restaurantDirectory, productCatalog, orderRepository, orderChanges, clock);
    private final AcceptOrderUseCase acceptOrder =
            new AcceptOrderUseCase(restaurantDirectory, orderRepository, orderChanges, clock);
    private final RejectOrderUseCase rejectOrder =
            new RejectOrderUseCase(restaurantDirectory, orderRepository, orderChanges, clock);
    private final StartPreparingOrderUseCase startPreparingOrder =
            new StartPreparingOrderUseCase(restaurantDirectory, orderRepository, orderChanges, clock);
    private final MarkOrderReadyUseCase markOrderReady =
            new MarkOrderReadyUseCase(restaurantDirectory, orderRepository, orderChanges, clock);
    private final MarkOrderPickedUpUseCase markOrderPickedUp =
            new MarkOrderPickedUpUseCase(restaurantDirectory, orderRepository, orderChanges, clock);
    private final CancelOrderUseCase cancelOrder = new CancelOrderUseCase(orderRepository, orderChanges, clock);

    @BeforeEach
    void openLaCasona() {
        restaurantDirectory.register(OWNER, LA_CASONA);
        restaurantDirectory.takeOrders(LA_CASONA, "La Casona");
        productCatalog.publish(LA_CASONA, new ProductSnapshot(10L, "Silpancho", new BigDecimal("45.00"), true));
    }

    @Test
    void announcesANewOrderToItsRestaurantAndItsCustomer() {
        Order placed = placeOrder.execute(new PlaceOrderCommand(CUSTOMER, LA_CASONA, List.of(new OrderLine(10L, 2))));

        assertThat(orderChanges.published())
                .containsExactly(new OrderChange(placed.getId(), LA_CASONA, CUSTOMER, OrderStatus.PLACED));
    }

    @ParameterizedTest(name = "{0} -> {1}")
    @CsvSource({
        "PLACED, ACCEPTED",
        "PLACED, REJECTED",
        "PLACED, CANCELLED",
        "ACCEPTED, IN_PREPARATION",
        "IN_PREPARATION, READY",
        "READY, PICKED_UP"
    })
    void announcesEveryChangeOfStatusOnce(OrderStatus from, OrderStatus to) {
        Order saved = orderRepository.save(order(CUSTOMER, LA_CASONA, from));

        change(saved.getId(), to);

        assertThat(orderChanges.published()).containsExactly(new OrderChange(saved.getId(), LA_CASONA, CUSTOMER, to));
    }

    @Test
    void announcesNothingWhenTheChangeIsNotAllowed() {
        Order cancelled = orderRepository.save(order(CUSTOMER, LA_CASONA, OrderStatus.CANCELLED));

        assertThatThrownBy(() -> acceptOrder.execute(OWNER, cancelled.getId()))
                .isInstanceOf(InvalidOrderTransitionException.class);
        assertThat(orderChanges.published()).isEmpty();
    }

    @Test
    void announcesNothingWhenTheOrderBelongsToSomeoneElse() {
        Order foreign = orderRepository.save(order(CUSTOMER, EL_FOGON, OrderStatus.PLACED));
        Order ofAnotherCustomer = orderRepository.save(order(OTHER_CUSTOMER, LA_CASONA, OrderStatus.PLACED));

        assertThatThrownBy(() -> acceptOrder.execute(OWNER, foreign.getId()))
                .isInstanceOf(OrderNotOwnerException.class);
        assertThatThrownBy(() -> cancelOrder.execute(CUSTOMER, ofAnotherCustomer.getId()))
                .isInstanceOf(OrderNotOwnerException.class);
        assertThat(orderChanges.published()).isEmpty();
    }

    private void change(Long orderId, OrderStatus to) {
        switch (to) {
            case ACCEPTED -> acceptOrder.execute(OWNER, orderId);
            case REJECTED -> rejectOrder.execute(OWNER, orderId);
            case CANCELLED -> cancelOrder.execute(CUSTOMER, orderId);
            case IN_PREPARATION -> startPreparingOrder.execute(OWNER, orderId);
            case READY -> markOrderReady.execute(OWNER, orderId);
            case PICKED_UP -> markOrderPickedUp.execute(OWNER, orderId);
            case PLACED -> throw new IllegalArgumentException("A placed order is announced by placeOrder");
        }
    }
}
