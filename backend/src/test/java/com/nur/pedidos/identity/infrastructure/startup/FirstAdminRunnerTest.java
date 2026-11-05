package com.nur.pedidos.identity.infrastructure.startup;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.nur.pedidos.identity.application.CreateAdminCommand;
import com.nur.pedidos.identity.application.CreateAdminUseCase;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.DefaultApplicationArguments;

class FirstAdminRunnerTest {

    private final CreateAdminUseCase createAdmin = mock(CreateAdminUseCase.class);

    @Test
    void createsTheAdminWithTheConfiguredCredentials() {
        run(new AdminProperties("admin@pedidos.com", "secreta123"));

        verify(createAdmin).execute(new CreateAdminCommand("admin@pedidos.com", "secreta123"));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void skipsTheAdminWhenNeitherCredentialIsConfigured(String blank) {
        run(new AdminProperties(blank, blank));

        verifyNoInteractions(createAdmin);
    }

    @Test
    void passesAnIncompleteConfigurationToTheRulesOfTheAccount() {
        run(new AdminProperties("admin@pedidos.com", ""));

        verify(createAdmin).execute(new CreateAdminCommand("admin@pedidos.com", ""));
    }

    @Test
    void keepsThePasswordOutOfThePropertiesText() {
        AdminProperties properties = new AdminProperties("admin@pedidos.com", "secreta123");

        assertThat(properties.toString()).contains("admin@pedidos.com").doesNotContain("secreta123");
    }

    private void run(AdminProperties properties) {
        new FirstAdminRunner(properties, createAdmin).run(new DefaultApplicationArguments());
    }
}
