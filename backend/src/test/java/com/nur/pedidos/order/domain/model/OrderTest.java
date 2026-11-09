package com.nur.pedidos.order.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

import com.nur.pedidos.order.domain.exception.InvalidOrderTransitionException;
import com.nur.pedidos.shared.domain.exception.DomainException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class OrderTest {

    private static final Instant NOW = Instant.parse("2026-11-08T15:00:00Z");
    private static final Instant LATER = Instant.parse("2026-11-08T15:20:00Z");
    private static final RestaurantSnapshot LA_CASONA = new RestaurantSnapshot(4L, "La Casona");
    private static final ProductSnapshot SILPANCHO =
            new ProductSnapshot(10L, "Silpancho", new BigDecimal("45.00"), true);
    private static final ProductSnapshot PIQUE_MACHO =
            new ProductSnapshot(11L, "Pique macho", new BigDecimal("60.00"), false);
    private static final ProductSnapshot LEMONADE = new ProductSnapshot(12L, "Limonada", new BigDecimal("10.50"), true);
    private static final List<ProductSnapshot> MENU = List.of(SILPANCHO, PIQUE_MACHO, LEMONADE);

    @Test
    void placesAPendingOrderForTheCustomerAtTheRestaurant() {
        Order order = Order.place(7L, LA_CASONA, lines(new OrderLine(10L, 1)), MENU, NOW);

        assertThat(order)
                .extracting(
                        Order::getId,
                        Order::getCustomerId,
                        Order::getRestaurantId,
                        Order::getRestaurantName,
                        Order::getStatus,
                        Order::getPlacedAt,
                        Order::getUpdatedAt)
                .containsExactly(null, 7L, 4L, "La Casona", OrderStatus.PLACED, NOW, NOW);
    }

    @Test
    void copiesTheNameAndThePriceOfEachProductInTheRequestedOrder() {
        Order order = Order.place(7L, LA_CASONA, lines(new OrderLine(12L, 3), new OrderLine(10L, 2)), MENU, NOW);

        assertThat(order.getItems())
                .extracting(
                        OrderItem::id,
                        OrderItem::productId,
                        OrderItem::productName,
                        OrderItem::unitPrice,
                        OrderItem::quantity)
                .containsExactly(
                        tuple(null, 12L, "Limonada", new BigDecimal("10.50"), 3),
                        tuple(null, 10L, "Silpancho", new BigDecimal("45.00"), 2));
    }

    @Test
    void calculatesTheTotalAsThePriceTimesTheQuantityOfEachProduct() {
        Order order = Order.place(7L, LA_CASONA, lines(new OrderLine(10L, 2), new OrderLine(12L, 3)), MENU, NOW);

        assertThat(order.getItems())
                .extracting(OrderItem::subtotal)
                .containsExactly(new BigDecimal("90.00"), new BigDecimal("31.50"));
        assertThat(order.getTotal()).isEqualTo(new BigDecimal("121.50"));
    }

    @Test
    void rejectsAProductThatIsNotOnTheMenuOfTheRestaurant() {
        OrderLines lines = lines(new OrderLine(10L, 1), new OrderLine(20L, 1));

        assertThatThrownBy(() -> Order.place(7L, LA_CASONA, lines, MENU, NOW))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("order.product_unavailable");
    }

    @Test
    void rejectsASoldOutProduct() {
        OrderLines lines = lines(new OrderLine(10L, 1), new OrderLine(11L, 1));

        assertThatThrownBy(() -> Order.place(7L, LA_CASONA, lines, MENU, NOW))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("order.product_unavailable");
    }

    @ParameterizedTest
    @MethodSource("validTransitions")
    void movesToTheNextStatusAndRecordsTheTimeOfTheChange(OrderStatus from, Action action, OrderStatus to) {
        Order order = orderIn(from);

        action.applyTo(order, LATER);

        assertThat(order)
                .extracting(Order::getStatus, Order::getPlacedAt, Order::getUpdatedAt)
                .containsExactly(to, NOW, LATER);
    }

    @ParameterizedTest
    @MethodSource("invalidTransitions")
    void refusesAnyOtherTransitionWithoutChangingTheOrder(OrderStatus from, Action action) {
        Order order = orderIn(from);

        assertThatThrownBy(() -> action.applyTo(order, LATER))
                .isInstanceOf(InvalidOrderTransitionException.class)
                .extracting("code")
                .isEqualTo("order.invalid_transition");
        assertThat(order).extracting(Order::getStatus, Order::getUpdatedAt).containsExactly(from, NOW);
    }

    @Test
    void keepsTheItemsAndTheTotalWhenTheStatusChanges() {
        Order order = Order.place(7L, LA_CASONA, lines(new OrderLine(10L, 2)), MENU, NOW);

        order.accept(LATER);

        assertThat(order.getTotal()).isEqualTo(new BigDecimal("90.00"));
        assertThat(order.getItems()).extracting(OrderItem::productName).containsExactly("Silpancho");
    }

    @Test
    void knowsTheCustomerWhoPlacedIt() {
        Order order = orderIn(OrderStatus.PLACED);

        assertThat(order.isPlacedBy(7L)).isTrue();
        assertThat(order.isPlacedBy(8L)).isFalse();
    }

    @Test
    void knowsTheRestaurantItBelongsTo() {
        Order order = orderIn(OrderStatus.PLACED);

        assertThat(order.belongsTo(4L)).isTrue();
        assertThat(order.belongsTo(5L)).isFalse();
    }

    static Stream<Arguments> validTransitions() {
        return Stream.of(
                Arguments.of(OrderStatus.PLACED, Action.ACCEPT, OrderStatus.ACCEPTED),
                Arguments.of(OrderStatus.PLACED, Action.REJECT, OrderStatus.REJECTED),
                Arguments.of(OrderStatus.PLACED, Action.CANCEL, OrderStatus.CANCELLED),
                Arguments.of(OrderStatus.ACCEPTED, Action.MARK_READY, OrderStatus.READY),
                Arguments.of(OrderStatus.READY, Action.MARK_PICKED_UP, OrderStatus.PICKED_UP));
    }

    static Stream<Arguments> invalidTransitions() {
        Set<List<Object>> valid = validTransitions()
                .map(arguments -> List.of(arguments.get()[0], arguments.get()[1]))
                .collect(Collectors.toSet());
        return Arrays.stream(OrderStatus.values())
                .flatMap(from -> Arrays.stream(Action.values()).map(action -> List.<Object>of(from, action)))
                .filter(transition -> !valid.contains(transition))
                .map(transition -> Arguments.of(transition.toArray()));
    }

    private static Order orderIn(OrderStatus status) {
        return new Order(
                42L,
                7L,
                4L,
                "La Casona",
                status,
                new BigDecimal("45.00"),
                NOW,
                NOW,
                List.of(new OrderItem(1L, 10L, "Silpancho", new BigDecimal("45.00"), 1)));
    }

    enum Action {
        ACCEPT(Order::accept),
        REJECT(Order::reject),
        CANCEL(Order::cancel),
        MARK_READY(Order::markReady),
        MARK_PICKED_UP(Order::markPickedUp);

        private final BiConsumer<Order, Instant> change;

        Action(BiConsumer<Order, Instant> change) {
            this.change = change;
        }

        void applyTo(Order order, Instant now) {
            change.accept(order, now);
        }
    }

    private static OrderLines lines(OrderLine... lines) {
        return new OrderLines(List.of(lines));
    }
}
