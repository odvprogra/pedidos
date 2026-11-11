package com.nur.pedidos.identity.infrastructure.web;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class AuthRequestsTest {

    @Test
    void keepsThePasswordOutOfTheRegistrationText() {
        RegisterAccountRequest request =
                new RegisterAccountRequest("Ana Rojas", "ana@correo.com", "secreta123", "OWNER");

        assertThat(request.toString()).contains("ana@correo.com").doesNotContain("secreta123");
    }

    @Test
    void keepsThePasswordOutOfTheLogInText() {
        LogInRequest request = new LogInRequest("ana@correo.com", "secreta123");

        assertThat(request.toString()).contains("ana@correo.com").doesNotContain("secreta123");
    }
}
