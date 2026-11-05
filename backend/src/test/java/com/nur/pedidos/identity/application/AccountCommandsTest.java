package com.nur.pedidos.identity.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.nur.pedidos.identity.domain.model.Role;
import org.junit.jupiter.api.Test;

class AccountCommandsTest {

    @Test
    void keepsThePasswordOutOfTheRegistrationText() {
        RegisterAccountCommand command =
                new RegisterAccountCommand("Ana Rojas", "ana@correo.com", "secreta123", Role.CUSTOMER);

        assertThat(command.toString()).contains("ana@correo.com").doesNotContain("secreta123");
    }

    @Test
    void keepsThePasswordOutOfTheLogInText() {
        LogInCommand command = new LogInCommand("ana@correo.com", "secreta123");

        assertThat(command.toString()).contains("ana@correo.com").doesNotContain("secreta123");
    }

    @Test
    void keepsThePasswordOutOfTheAdminText() {
        CreateAdminCommand command = new CreateAdminCommand("admin@pedidos.com", "secreta123");

        assertThat(command.toString()).contains("admin@pedidos.com").doesNotContain("secreta123");
    }
}
