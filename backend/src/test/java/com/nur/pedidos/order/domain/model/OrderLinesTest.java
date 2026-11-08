package com.nur.pedidos.order.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.shared.domain.exception.DomainException;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class OrderLinesTest {

    @Test
    void keepsTheRequestedProductsInTheirOrder() {
        OrderLines lines = new OrderLines(List.of(new OrderLine(12L, 1), new OrderLine(10L, 2)));

        assertThat(lines.lines()).containsExactly(new OrderLine(12L, 1), new OrderLine(10L, 2));
    }

    @Test
    void rejectsAnOrderWithoutProducts() {
        assertThatThrownBy(() -> new OrderLines(List.of()))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("order.empty");
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, 100})
    void rejectsAQuantityOutsideOneToNinetyNine(int quantity) {
        List<OrderLine> lines = List.of(new OrderLine(10L, 2), new OrderLine(12L, quantity));

        assertThatThrownBy(() -> new OrderLines(lines))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("order.invalid_quantity");
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 99})
    void acceptsTheQuantitiesAtTheLimits(int quantity) {
        OrderLines lines = new OrderLines(List.of(new OrderLine(10L, quantity)));

        assertThat(lines.lines()).containsExactly(new OrderLine(10L, quantity));
    }

    @Test
    void rejectsAProductThatAppearsTwice() {
        List<OrderLine> lines = List.of(new OrderLine(10L, 1), new OrderLine(12L, 1), new OrderLine(10L, 3));

        assertThatThrownBy(() -> new OrderLines(lines))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("order.duplicate_product");
    }

    @Test
    void checksTheQuantitiesBeforeTheRepeatedProducts() {
        List<OrderLine> lines = List.of(new OrderLine(10L, 0), new OrderLine(10L, 2));

        assertThatThrownBy(() -> new OrderLines(lines))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("order.invalid_quantity");
    }
}
