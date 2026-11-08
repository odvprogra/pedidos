package com.nur.pedidos.order.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

import com.nur.pedidos.order.domain.exception.ProductUnavailableException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class OrderTest {

    private static final Instant NOW = Instant.parse("2026-11-08T15:00:00Z");
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
                .isInstanceOf(ProductUnavailableException.class)
                .extracting("code")
                .isEqualTo("order.product_unavailable");
    }

    @Test
    void rejectsASoldOutProduct() {
        OrderLines lines = lines(new OrderLine(10L, 1), new OrderLine(11L, 1));

        assertThatThrownBy(() -> Order.place(7L, LA_CASONA, lines, MENU, NOW))
                .isInstanceOf(ProductUnavailableException.class)
                .extracting("code")
                .isEqualTo("order.product_unavailable");
    }

    private static OrderLines lines(OrderLine... lines) {
        return new OrderLines(List.of(lines));
    }
}
