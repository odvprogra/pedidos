package com.nur.pedidos.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.identity.domain.exception.AccountNotFoundException;
import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.model.Role;
import com.nur.pedidos.identity.domain.port.FakePasswordHasher;
import com.nur.pedidos.shared.domain.exception.DomainException;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

class SuspendAccountUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-05T12:00:00Z");

    private final FakePasswordHasher passwordHasher = new FakePasswordHasher();
    private final InMemoryAccountRepository accountRepository = new InMemoryAccountRepository();
    private final InMemoryAccountSessions accountSessions = new InMemoryAccountSessions();
    private final SuspendAccountUseCase suspendAccount = new SuspendAccountUseCase(accountRepository, accountSessions);

    @ParameterizedTest
    @EnumSource(names = {"CUSTOMER", "OWNER"})
    void suspendsTheAccountAndRevokesEveryOpenSession(Role role) {
        Account account = save(register("ana@correo.com", role));
        accountSessions.open(account.getId());
        accountSessions.open(account.getId());

        suspendAccount.execute(account.getId());

        assertThat(accountRepository.findById(account.getId()))
                .get()
                .extracting(Account::isSuspended)
                .isEqualTo(true);
        assertThat(accountSessions.openSessionsOf(account.getId())).isZero();
    }

    @Test
    void keepsTheSessionsOfOtherAccounts() {
        Account suspended = save(register("ana@correo.com", Role.CUSTOMER));
        Account other = save(register("luis@correo.com", Role.CUSTOMER));
        accountSessions.open(suspended.getId());
        accountSessions.open(other.getId());

        suspendAccount.execute(suspended.getId());

        assertThat(accountSessions.openSessionsOf(other.getId())).isOne();
        assertThat(accountRepository.findById(other.getId()))
                .get()
                .extracting(Account::isSuspended)
                .isEqualTo(false);
    }

    @Test
    void acceptsSuspendingAnAlreadySuspendedAccount() {
        Account account = register("ana@correo.com", Role.CUSTOMER);
        account.suspend();
        Long id = save(account).getId();

        suspendAccount.execute(id);

        assertThat(accountRepository.findById(id))
                .get()
                .extracting(Account::isSuspended)
                .isEqualTo(true);
    }

    @Test
    void refusesToSuspendAnAdminAndKeepsItsSessions() {
        Account admin = save(Account.createAdmin("admin@pedidos.com", "secreta123", passwordHasher, NOW));
        accountSessions.open(admin.getId());

        assertThatThrownBy(() -> suspendAccount.execute(admin.getId()))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("identity.admin_not_suspendable");
        assertThat(accountRepository.findById(admin.getId()))
                .get()
                .extracting(Account::isSuspended)
                .isEqualTo(false);
        assertThat(accountSessions.openSessionsOf(admin.getId())).isOne();
    }

    @Test
    void failsWhenTheAccountDoesNotExist() {
        assertThatThrownBy(() -> suspendAccount.execute(99L))
                .isInstanceOf(AccountNotFoundException.class)
                .extracting("code")
                .isEqualTo("identity.not_found");
    }

    private Account register(String email, Role role) {
        return Account.register("Ana Rojas", email, "secreta123", role, passwordHasher, NOW);
    }

    private Account save(Account account) {
        return accountRepository.save(account);
    }
}
