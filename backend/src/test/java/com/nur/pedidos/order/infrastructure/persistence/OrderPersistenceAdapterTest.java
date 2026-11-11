package com.nur.pedidos.order.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

import com.nur.pedidos.TestcontainersConfiguration;
import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderItem;
import com.nur.pedidos.order.domain.model.OrderStatus;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({TestcontainersConfiguration.class, OrderPersistenceAdapter.class})
class OrderPersistenceAdapterTest {

    private static final Instant NOW = Instant.parse("2026-11-08T15:00:00Z");

    @Autowired
    private OrderPersistenceAdapter adapter;

    @Autowired
    private OrderJpaRepository jpaRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void savesAnOrderTogetherWithItsItems() {
        Order saved =
                adapter.save(order("56.00", item(12L, "Limonada", "10.50", 1), item(10L, "Silpancho", "45.50", 1)));

        assertThat(reload(saved))
                .extracting(
                        Order::getId,
                        Order::getCustomerId,
                        Order::getRestaurantId,
                        Order::getRestaurantName,
                        Order::getStatus,
                        Order::getTotal,
                        Order::getPlacedAt,
                        Order::getUpdatedAt)
                .containsExactly(
                        saved.getId(), 7L, 4L, "La Casona", OrderStatus.PLACED, new BigDecimal("56.00"), NOW, NOW);
    }

    @Test
    void keepsTheItemsInTheOrderTheyWereSaved() {
        Order saved =
                adapter.save(order("135.00", item(12L, "Limonada", "15.00", 3), item(10L, "Silpancho", "45.00", 2)));

        assertThat(saved.getItems()).extracting(OrderItem::id).doesNotContainNull();
        assertThat(reload(saved).getItems())
                .extracting(OrderItem::productId, OrderItem::productName, OrderItem::unitPrice, OrderItem::quantity)
                .containsExactly(
                        tuple(12L, "Limonada", new BigDecimal("15.00"), 3),
                        tuple(10L, "Silpancho", new BigDecimal("45.00"), 2));
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 100})
    void rejectsAQuantityOutsideOneToNinetyNine(int quantity) {
        Order order = order("45.00", item(10L, "Silpancho", "45.00", quantity));

        assertThatThrownBy(() -> adapter.save(order)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void rejectsTheSameProductTwiceInAnOrder() {
        Order order = order("90.00", item(10L, "Silpancho", "45.00", 1), item(10L, "Silpancho", "45.00", 1));

        assertThatThrownBy(() -> adapter.save(order)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void rejectsAnItemWithoutPrice() {
        Order order = order("45.00", item(10L, "Silpancho", "0.00", 1));

        assertThatThrownBy(() -> adapter.save(order)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void rejectsAnOrderWithoutTotal() {
        Order order = order("0.00", item(10L, "Silpancho", "45.00", 1));

        assertThatThrownBy(() -> adapter.save(order)).isInstanceOf(DataIntegrityViolationException.class);
    }

    private Order reload(Order saved) {
        entityManager.flush();
        entityManager.clear();
        return jpaRepository.findById(saved.getId()).orElseThrow().toDomain();
    }

    private static Order order(String total, OrderItem... items) {
        return new Order(
                null, 7L, 4L, "La Casona", OrderStatus.PLACED, new BigDecimal(total), NOW, NOW, List.of(items));
    }

    private static OrderItem item(Long productId, String name, String unitPrice, int quantity) {
        return new OrderItem(null, productId, name, new BigDecimal(unitPrice), quantity);
    }
}
