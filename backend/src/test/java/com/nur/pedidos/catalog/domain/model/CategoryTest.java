package com.nur.pedidos.catalog.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.shared.domain.exception.DomainException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class CategoryTest {

    @Test
    void createsACategoryWithATrimmedName() {
        Category category = Category.create(4L, "  Platos fuertes  ");

        assertThat(category.getId()).isNull();
        assertThat(category.getRestaurantId()).isEqualTo(4L);
        assertThat(category.getName()).isEqualTo("Platos fuertes");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void rejectsABlankName(String name) {
        assertThatThrownBy(() -> Category.create(4L, name))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("catalog.category_name_required");
    }

    @Test
    void renamesWithATrimmedName() {
        Category category = new Category(3L, 4L, "Platos fuertes");

        category.rename("  Segundos ");

        assertThat(category.getName()).isEqualTo("Segundos");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void keepsTheNameWhenTheNewOneIsBlank(String name) {
        Category category = new Category(3L, 4L, "Platos fuertes");

        assertThatThrownBy(() -> category.rename(name))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("catalog.category_name_required");
        assertThat(category.getName()).isEqualTo("Platos fuertes");
    }

    @Test
    void belongsOnlyToItsRestaurant() {
        Category category = new Category(3L, 4L, "Platos fuertes");

        assertThat(category.belongsTo(4L)).isTrue();
        assertThat(category.belongsTo(5L)).isFalse();
    }
}
