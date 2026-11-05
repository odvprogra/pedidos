package com.nur.pedidos.identity.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.identity.domain.exception.AccountSuspendedException;
import com.nur.pedidos.identity.domain.exception.InvalidCredentialsException;
import com.nur.pedidos.identity.domain.port.FakePasswordHasher;
import com.nur.pedidos.shared.domain.exception.DomainException;
import java.time.Instant;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class AccountTest {

    private static final Instant NOW = Instant.parse("2026-11-04T15:00:00Z");
    private static final String PASSWORD = "secreta123";

    private final FakePasswordHasher passwordHasher = new FakePasswordHasher();

    @Test
    void registersAnActiveAccountWithTrimmedNameAndNormalizedEmail() {
        Account account = register("  Ana Rojas  ", "  Ana.Rojas@Correo.COM ", PASSWORD, Role.CUSTOMER);

        assertThat(account.getId()).isNull();
        assertThat(account.getName()).isEqualTo("Ana Rojas");
        assertThat(account.getEmail()).isEqualTo("ana.rojas@correo.com");
        assertThat(account.getRole()).isEqualTo(Role.CUSTOMER);
        assertThat(account.isSuspended()).isFalse();
        assertThat(account.getCreatedAt()).isEqualTo(NOW);
    }

    @Test
    void registersAnOwner() {
        Account account = register("La Casona", "casona@correo.com", PASSWORD, Role.OWNER);

        assertThat(account.getRole()).isEqualTo(Role.OWNER);
    }

    @Test
    void keepsTheHashInsteadOfThePassword() {
        Account account = register("Ana Rojas", "ana@correo.com", PASSWORD, Role.CUSTOMER);

        assertThat(account.getPasswordHash()).isEqualTo("hashed:secreta123");
    }

    @Test
    void rejectsTheRegistrationOfAnAdmin() {
        assertThatThrownBy(() -> register("Ana Rojas", "ana@correo.com", PASSWORD, Role.ADMIN))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("identity.role_not_allowed");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void rejectsABlankName(String name) {
        assertThatThrownBy(() -> register(name, "ana@correo.com", PASSWORD, Role.CUSTOMER))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("identity.name_required");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void rejectsABlankEmail(String email) {
        assertThatThrownBy(() -> register("Ana Rojas", email, PASSWORD, Role.CUSTOMER))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("identity.email_required");
    }

    @ParameterizedTest
    @ValueSource(strings = {"ana", "ana@", "@correo.com", "ana@correo", "ana rojas@correo.com", "ana@@correo.com"})
    void rejectsAnEmailWithoutAValidFormat(String email) {
        assertThatThrownBy(() -> register("Ana Rojas", email, PASSWORD, Role.CUSTOMER))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("identity.invalid_email");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"1234567", "ññññ"})
    void rejectsAPasswordWithFewerThanEightCharacters(String password) {
        assertThatThrownBy(() -> register("Ana Rojas", "ana@correo.com", password, Role.CUSTOMER))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("identity.password_too_short");
    }

    @ParameterizedTest
    @ValueSource(ints = {73, 100})
    void rejectsAPasswordLongerThan72Bytes(int length) {
        assertThatThrownBy(() -> register("Ana Rojas", "ana@correo.com", "a".repeat(length), Role.CUSTOMER))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("identity.password_too_long");
    }

    @Test
    void measuresTheUpperLimitInBytesNotInCharacters() {
        String thirtySevenTwoByteCharacters = "ñ".repeat(37);

        assertThatThrownBy(() -> register("Ana Rojas", "ana@correo.com", thirtySevenTwoByteCharacters, Role.CUSTOMER))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("identity.password_too_long");
    }

    @ParameterizedTest
    @ValueSource(strings = {"12345678", "ññññññññ"})
    void acceptsAPasswordOfExactlyEightCharacters(String password) {
        assertThatCode(() -> register("Ana Rojas", "ana@correo.com", password, Role.CUSTOMER))
                .doesNotThrowAnyException();
    }

    @ParameterizedTest
    @MethodSource("passwordsOfExactly72Bytes")
    void acceptsAPasswordOfExactly72Bytes(String password) {
        assertThatCode(() -> register("Ana Rojas", "ana@correo.com", password, Role.CUSTOMER))
                .doesNotThrowAnyException();
    }

    static Stream<String> passwordsOfExactly72Bytes() {
        return Stream.of("a".repeat(72), "ñ".repeat(36));
    }

    @Test
    void normalizesAnEmailToLowercaseWithoutSurroundingSpaces() {
        assertThat(Account.normalizeEmail("  INFO@Correo.COM ")).isEqualTo("info@correo.com");
    }

    @Test
    void authenticatesWithTheRightPassword() {
        Account account = register("Ana Rojas", "ana@correo.com", PASSWORD, Role.CUSTOMER);

        assertThatCode(() -> account.authenticate(PASSWORD, passwordHasher)).doesNotThrowAnyException();
    }

    @Test
    void rejectsTheWrongPassword() {
        Account account = register("Ana Rojas", "ana@correo.com", PASSWORD, Role.CUSTOMER);

        assertThatThrownBy(() -> account.authenticate("otra-clave", passwordHasher))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void rejectsASuspendedAccountWithTheRightPassword() {
        Account account = register("Ana Rojas", "ana@correo.com", PASSWORD, Role.CUSTOMER);
        account.suspend();

        assertThatThrownBy(() -> account.authenticate(PASSWORD, passwordHasher))
                .isInstanceOf(AccountSuspendedException.class);
    }

    @Test
    void doesNotRevealTheSuspensionWhenThePasswordIsWrong() {
        Account account = register("Ana Rojas", "ana@correo.com", PASSWORD, Role.CUSTOMER);
        account.suspend();

        assertThatThrownBy(() -> account.authenticate("otra-clave", passwordHasher))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @ParameterizedTest
    @EnumSource(names = {"CUSTOMER", "OWNER"})
    void suspendsACustomerOrAnOwner(Role role) {
        Account account = register("Ana Rojas", "ana@correo.com", PASSWORD, role);

        account.suspend();

        assertThat(account.isSuspended()).isTrue();
    }

    @Test
    void createsAnActiveAdminNamedAdministrador() {
        Account admin = Account.createAdmin("  Admin@Pedidos.com ", PASSWORD, passwordHasher, NOW);

        assertThat(admin.getId()).isNull();
        assertThat(admin.getName()).isEqualTo("Administrador");
        assertThat(admin.getEmail()).isEqualTo("admin@pedidos.com");
        assertThat(admin.getPasswordHash()).isEqualTo("hashed:secreta123");
        assertThat(admin.getRole()).isEqualTo(Role.ADMIN);
        assertThat(admin.isSuspended()).isFalse();
        assertThat(admin.getCreatedAt()).isEqualTo(NOW);
    }

    @ParameterizedTest
    @CsvSource(
            nullValues = "null",
            value = {"null, identity.email_required", "'  ', identity.email_required", "admin, identity.invalid_email"})
    void rejectsAnAdminWithoutAValidEmail(String email, String code) {
        assertThatThrownBy(() -> Account.createAdmin(email, PASSWORD, passwordHasher, NOW))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo(code);
    }

    @ParameterizedTest
    @MethodSource("invalidAdminPasswords")
    void appliesThePasswordRulesToTheAdmin(String password, String code) {
        assertThatThrownBy(() -> Account.createAdmin("admin@pedidos.com", password, passwordHasher, NOW))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo(code);
    }

    static Stream<Arguments> invalidAdminPasswords() {
        return Stream.of(
                Arguments.of(null, "identity.password_too_short"),
                Arguments.of("corta", "identity.password_too_short"),
                Arguments.of("a".repeat(73), "identity.password_too_long"));
    }

    @Test
    void refusesToSuspendAnAdmin() {
        Account admin = Account.createAdmin("admin@pedidos.com", PASSWORD, passwordHasher, NOW);

        assertThatThrownBy(admin::suspend)
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("identity.admin_not_suspendable");
        assertThat(admin.isSuspended()).isFalse();
    }

    @Test
    void reactivatesASuspendedAccount() {
        Account account = register("Ana Rojas", "ana@correo.com", PASSWORD, Role.CUSTOMER);
        account.suspend();

        account.reactivate();

        assertThat(account.isSuspended()).isFalse();
    }

    private Account register(String name, String email, String password, Role role) {
        return Account.register(name, email, password, role, passwordHasher, NOW);
    }
}
