package com.nur.pedidos.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.model.Role;
import com.nur.pedidos.identity.domain.port.FakePasswordHasher;
import com.nur.pedidos.shared.domain.exception.DomainException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

class CreateAdminUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-05T12:00:00Z");

    private final FakePasswordHasher passwordHasher = new FakePasswordHasher();
    private final InMemoryAccountRepository accountRepository = new InMemoryAccountRepository();
    private final CreateAdminUseCase createAdmin =
            new CreateAdminUseCase(accountRepository, passwordHasher, Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    void createsTheAdminWhenThereIsNoAdminYet() {
        createAdmin.execute(new CreateAdminCommand(" Admin@Pedidos.com ", "secreta123"));

        assertThat(accountRepository.count()).isEqualTo(1);
        assertThat(accountRepository.findByEmail("admin@pedidos.com"))
                .get()
                .extracting(Account::getName, Account::getRole, Account::getPasswordHash, Account::getCreatedAt)
                .containsExactly("Administrador", Role.ADMIN, "hashed:secreta123", NOW);
    }

    @Test
    void keepsTheExistingAdminAndItsPassword() {
        createAdmin.execute(new CreateAdminCommand("admin@pedidos.com", "secreta123"));

        createAdmin.execute(new CreateAdminCommand("ADMIN@pedidos.com", "otra-clave-123"));

        assertThat(accountRepository.count()).isEqualTo(1);
        assertThat(accountRepository.findByEmail("admin@pedidos.com"))
                .get()
                .extracting(Account::getPasswordHash)
                .isEqualTo("hashed:secreta123");
    }

    @Test
    void doesNotCreateASecondAdminForANewEmail() {
        createAdmin.execute(new CreateAdminCommand("admin@pedidos.com", "secreta123"));

        createAdmin.execute(new CreateAdminCommand("otro.admin@pedidos.com", "secreta123"));

        assertThat(accountRepository.count()).isEqualTo(1);
        assertThat(accountRepository.findByEmail("otro.admin@pedidos.com")).isEmpty();
    }

    @ParameterizedTest
    @EnumSource(names = {"CUSTOMER", "OWNER"})
    void refusesAnEmailThatBelongsToAnotherRole(Role role) {
        accountRepository.save(
                Account.register("Ana Rojas", "ana@correo.com", "secreta123", role, passwordHasher, NOW));

        assertThatThrownBy(() -> createAdmin.execute(new CreateAdminCommand("ana@correo.com", "secreta123")))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("identity.admin_email_taken");
        assertThat(accountRepository.count()).isEqualTo(1);
        assertThat(accountRepository.findByEmail("ana@correo.com"))
                .get()
                .extracting(Account::getRole)
                .isEqualTo(role);
    }

    @Test
    void savesNothingWhenTheAdminBreaksARule() {
        assertThatThrownBy(() -> createAdmin.execute(new CreateAdminCommand("admin@pedidos.com", "corta")))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("identity.password_too_short");

        assertThat(accountRepository.count()).isZero();
    }
}
