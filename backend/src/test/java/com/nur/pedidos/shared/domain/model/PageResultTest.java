package com.nur.pedidos.shared.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class PageResultTest {

    @ParameterizedTest
    @CsvSource({"0, 20, 0", "1, 20, 1", "20, 20, 1", "21, 20, 2", "45, 20, 3", "100, 100, 1"})
    void countsThePagesRoundingUp(long totalItems, int size, int totalPages) {
        PageResult<String> result = new PageResult<>(List.of(), 0, size, totalItems);

        assertThat(result.totalPages()).isEqualTo(totalPages);
    }

    @Test
    void keepsThePageRequestedEvenWhenItIsPastTheLastOne() {
        PageResult<String> result = new PageResult<>(List.of(), 9, 20, 45);

        assertThat(result.page()).isEqualTo(9);
        assertThat(result.items()).isEmpty();
        assertThat(result.totalPages()).isEqualTo(3);
    }

    @ParameterizedTest
    @CsvSource({"-1, 20, 0", "0, 0, 0", "0, -5, 0", "0, 20, -1"})
    void rejectsAPageThatCannotExist(int page, int size, long totalItems) {
        assertThatThrownBy(() -> new PageResult<>(List.of(), page, size, totalItems))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void doesNotChangeWhenTheOriginalListChanges() {
        List<String> items = new ArrayList<>(List.of("Ana"));
        PageResult<String> result = new PageResult<>(items, 0, 20, 1);

        items.add("Luis");

        assertThat(result.items()).containsExactly("Ana");
        assertThatThrownBy(() -> result.items().add("Luis")).isInstanceOf(UnsupportedOperationException.class);
    }
}
