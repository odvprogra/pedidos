package com.nur.pedidos.identity.infrastructure.startup;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class AdminPropertiesTest {

    @Test
    void keepsThePasswordOutOfTheText() {
        AdminProperties properties = new AdminProperties("admin@pedidos.com", "secreta123");

        assertThat(properties.toString()).contains("admin@pedidos.com").doesNotContain("secreta123");
    }
}
