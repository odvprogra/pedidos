package com.nur.pedidos.identity.infrastructure.web;

import static com.nur.pedidos.shared.infrastructure.security.TestSessions.sessionOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.authenticated;
import static org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.unauthenticated;

import com.nur.pedidos.identity.application.GetAccountUseCase;
import com.nur.pedidos.identity.application.LogInCommand;
import com.nur.pedidos.identity.application.LogInUseCase;
import com.nur.pedidos.identity.application.RegisterAccountCommand;
import com.nur.pedidos.identity.application.RegisterAccountUseCase;
import com.nur.pedidos.identity.domain.exception.AccountSuspendedException;
import com.nur.pedidos.identity.domain.exception.EmailTakenException;
import com.nur.pedidos.identity.domain.exception.InvalidCredentialsException;
import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.model.Role;
import com.nur.pedidos.shared.domain.exception.DomainException;
import com.nur.pedidos.shared.infrastructure.security.CurrentUser;
import com.nur.pedidos.shared.infrastructure.security.SecurityConfig;
import java.time.Instant;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    private static final Instant NOW = Instant.parse("2026-11-04T15:00:00Z");
    private static final String REGISTRATION = """
            {"name": "Ana Rojas", "email": "Ana@Correo.com", "password": "secreta123", "role": "CUSTOMER"}
            """;
    private static final String CREDENTIALS = """
            {"email": "ana@correo.com", "password": "secreta123"}
            """;

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private RegisterAccountUseCase registerAccount;

    @MockitoBean
    private LogInUseCase logIn;

    @MockitoBean
    private GetAccountUseCase getAccount;

    @Test
    void registersAnAccountAndStartsItsSession() {
        when(registerAccount.execute(any())).thenReturn(account(7L, Role.CUSTOMER));

        var response = mvc.post()
                .uri("/api/v1/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(REGISTRATION);

        assertThat(response)
                .hasStatus(HttpStatus.CREATED)
                .hasHeader("Location", "/api/v1/auth/me")
                .matches(authenticated().withAuthenticationPrincipal(new CurrentUser(7L, "CUSTOMER")))
                .bodyJson()
                .satisfies(json -> {
                    assertThat(json).extractingPath("$.id").isEqualTo(7);
                    assertThat(json).extractingPath("$.email").isEqualTo("ana@correo.com");
                    assertThat(json).extractingPath("$.role").isEqualTo("CUSTOMER");
                    assertThat(json).doesNotHavePath("$.passwordHash");
                });
        verify(registerAccount)
                .execute(new RegisterAccountCommand("Ana Rojas", "Ana@Correo.com", "secreta123", Role.CUSTOMER));
    }

    @ParameterizedTest
    @MethodSource("invalidRegistrations")
    void rejectsAnInvalidRegistration(String body, String field) {
        var response = mvc.post()
                .uri("/api/v1/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body);

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo(field);
        });
        verifyNoInteractions(registerAccount);
    }

    static Stream<Arguments> invalidRegistrations() {
        return Stream.of(
                Arguments.of(registration("  ", "ana@correo.com", "secreta123", "\"CUSTOMER\""), "name"),
                Arguments.of(registration("a".repeat(101), "ana@correo.com", "secreta123", "\"CUSTOMER\""), "name"),
                Arguments.of(registration("Ana Rojas", "", "secreta123", "\"CUSTOMER\""), "email"),
                Arguments.of(registration("Ana Rojas", "a".repeat(255), "secreta123", "\"CUSTOMER\""), "email"),
                Arguments.of(registration("Ana Rojas", "ana@correo.com", "", "\"CUSTOMER\""), "password"),
                Arguments.of(registration("Ana Rojas", "ana@correo.com", "secreta123", "\"ADMIN\""), "role"),
                Arguments.of(registration("Ana Rojas", "ana@correo.com", "secreta123", "\"CHEF\""), "role"),
                Arguments.of(registration("Ana Rojas", "ana@correo.com", "secreta123", "null"), "role"));
    }

    @Test
    void rejectsAMalformedBody() {
        var response = mvc.post()
                .uri("/api/v1/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": ");

        assertThat(response)
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("validation_failed");
    }

    @Test
    void rejectsATakenEmailWithoutStartingASession() {
        when(registerAccount.execute(any())).thenThrow(new EmailTakenException());

        var response = mvc.post()
                .uri("/api/v1/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(REGISTRATION);

        assertThat(response)
                .hasStatus(HttpStatus.CONFLICT)
                .matches(unauthenticated())
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("identity.email_taken");
    }

    @Test
    void rejectsARegistrationThatBreaksABusinessRule() {
        when(registerAccount.execute(any()))
                .thenThrow(new DomainException("identity.password_too_short", "La contraseña es corta"));

        var response = mvc.post()
                .uri("/api/v1/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(REGISTRATION);

        assertThat(response)
                .hasStatus(HttpStatus.UNPROCESSABLE_CONTENT)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("identity.password_too_short");
    }

    @Test
    void rejectsARegistrationWithoutCsrfToken() {
        var response = mvc.post()
                .uri("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(REGISTRATION);

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("csrf_invalid");
        verifyNoInteractions(registerAccount);
    }

    @Test
    void logsInAndStartsTheSession() {
        when(logIn.execute(any())).thenReturn(account(9L, Role.OWNER));

        var response = mvc.post()
                .uri("/api/v1/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(CREDENTIALS);

        assertThat(response)
                .hasStatusOk()
                .matches(authenticated().withAuthenticationPrincipal(new CurrentUser(9L, "OWNER")))
                .bodyJson()
                .extractingPath("$.role")
                .isEqualTo("OWNER");
        verify(logIn).execute(new LogInCommand("ana@correo.com", "secreta123"));
    }

    @Test
    void rejectsInvalidCredentialsWithoutStartingASession() {
        when(logIn.execute(any())).thenThrow(new InvalidCredentialsException());

        var response = mvc.post()
                .uri("/api/v1/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(CREDENTIALS);

        assertThat(response)
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .matches(unauthenticated())
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("identity.invalid_credentials");
    }

    @Test
    void rejectsASuspendedAccountWithoutStartingASession() {
        when(logIn.execute(any())).thenThrow(new AccountSuspendedException());

        var response = mvc.post()
                .uri("/api/v1/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(CREDENTIALS);

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .matches(unauthenticated())
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("identity.account_suspended");
    }

    @ParameterizedTest
    @MethodSource("incompleteCredentials")
    void rejectsIncompleteCredentials(String body, String field) {
        var response = mvc.post()
                .uri("/api/v1/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body);

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo(field);
        });
        verifyNoInteractions(logIn);
    }

    static Stream<Arguments> incompleteCredentials() {
        return Stream.of(
                Arguments.of("{\"email\": \" \", \"password\": \"secreta123\"}", "email"),
                Arguments.of("{\"email\": \"ana@correo.com\", \"password\": \"\"}", "password"));
    }

    @ParameterizedTest
    @EnumSource(Role.class)
    void logsOutAnyRole(Role role) {
        var response = mvc.post()
                .uri("/api/v1/auth/logout")
                .with(sessionOf(role.name(), 7L))
                .with(csrf());

        assertThat(response).hasStatus(HttpStatus.NO_CONTENT).matches(unauthenticated());
    }

    @Test
    void rejectsALogoutWithoutSession() {
        assertThat(mvc.post().uri("/api/v1/auth/logout").with(csrf()))
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
    }

    @ParameterizedTest
    @EnumSource(Role.class)
    void returnsTheCurrentAccountOfAnyRole(Role role) {
        when(getAccount.execute(7L)).thenReturn(account(7L, role));

        assertThat(mvc.get().uri("/api/v1/auth/me").with(sessionOf(role.name(), 7L)))
                .hasStatusOk()
                .bodyJson()
                .satisfies(json -> {
                    assertThat(json).extractingPath("$.id").isEqualTo(7);
                    assertThat(json).extractingPath("$.role").isEqualTo(role.name());
                });
    }

    @Test
    void rejectsTheCurrentAccountWithoutSession() {
        assertThat(mvc.get().uri("/api/v1/auth/me"))
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(getAccount);
    }

    private static String registration(String name, String email, String password, String role) {
        return """
                {"name": "%s", "email": "%s", "password": "%s", "role": %s}
                """.formatted(name, email, password, role);
    }

    private static Account account(Long id, Role role) {
        return new Account(id, "Ana Rojas", "ana@correo.com", "{bcrypt}hash", role, false, NOW);
    }
}
