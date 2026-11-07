package com.nur.pedidos.identity.infrastructure.web;

import static com.nur.pedidos.shared.infrastructure.security.TestSessions.sessionOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import com.nur.pedidos.identity.application.ListAccountsUseCase;
import com.nur.pedidos.identity.application.ReactivateAccountUseCase;
import com.nur.pedidos.identity.application.SuspendAccountUseCase;
import com.nur.pedidos.identity.domain.exception.AccountNotFoundException;
import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.model.Role;
import com.nur.pedidos.shared.domain.exception.DomainException;
import com.nur.pedidos.shared.domain.model.PageResult;
import com.nur.pedidos.shared.infrastructure.security.SecurityConfig;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@WebMvcTest(AccountController.class)
@Import(SecurityConfig.class)
class AccountControllerTest {

    private static final Instant NOW = Instant.parse("2026-11-07T12:00:00Z");

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private ListAccountsUseCase listAccounts;

    @MockitoBean
    private SuspendAccountUseCase suspendAccount;

    @MockitoBean
    private ReactivateAccountUseCase reactivateAccount;

    @Test
    void listsTheFirstPageOfAccountsAsAdmin() {
        when(listAccounts.execute(0, 20))
                .thenReturn(new PageResult<>(
                        List.of(
                                account(1L, "Administrador", "admin@pedidos.com", Role.ADMIN, false),
                                account(7L, "Ana Rojas", "ana@correo.com", Role.CUSTOMER, true)),
                        0,
                        20,
                        2));

        var response = mvc.get().uri("/api/v1/accounts").with(sessionOf("ADMIN", 1L));

        assertThat(response).hasStatus(HttpStatus.OK).bodyJson().isStrictlyEqualTo("""
                {
                  "items": [
                    {"id": 1, "name": "Administrador", "email": "admin@pedidos.com", "role": "ADMIN", "suspended": false},
                    {"id": 7, "name": "Ana Rojas", "email": "ana@correo.com", "role": "CUSTOMER", "suspended": true}
                  ],
                  "page": 0,
                  "size": 20,
                  "totalItems": 2,
                  "totalPages": 1
                }
                """);
    }

    @ParameterizedTest
    @CsvSource({"0, 1", "2, 20", "1000000, 100"})
    void listsTheRequestedPageAndSize(int page, int size) {
        when(listAccounts.execute(page, size)).thenReturn(new PageResult<>(List.of(), page, size, 45));

        var response =
                mvc.get().uri("/api/v1/accounts?page=" + page + "&size=" + size).with(sessionOf("ADMIN", 1L));

        assertThat(response).hasStatus(HttpStatus.OK).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.page").isEqualTo(page);
            assertThat(json).extractingPath("$.size").isEqualTo(size);
            assertThat(json).extractingPath("$.totalItems").isEqualTo(45);
        });
        verify(listAccounts).execute(page, size);
    }

    @ParameterizedTest
    @CsvSource({
        "page=-1, page",
        "page=1000001, page",
        "page=abc, page",
        "size=0, size",
        "size=101, size",
        "size=abc, size"
    })
    void rejectsAnInvalidPageOrSize(String query, String field) {
        var response = mvc.get().uri("/api/v1/accounts?" + query).with(sessionOf("ADMIN", 1L));

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo(field);
        });
        verifyNoInteractions(listAccounts);
    }

    @Test
    void rejectsAListRequestWithoutSession() {
        assertThat(mvc.get().uri("/api/v1/accounts"))
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(listAccounts);
    }

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "OWNER"})
    void rejectsAListRequestFromAnotherRole(String role) {
        assertThat(mvc.get().uri("/api/v1/accounts").with(sessionOf(role, 7L)))
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("access_denied");
        verifyNoInteractions(listAccounts);
    }

    @Test
    void suspendsTheAccountAsAdmin() {
        var response = mvc.post()
                .uri("/api/v1/accounts/7/suspend")
                .with(sessionOf("ADMIN", 1L))
                .with(csrf());

        assertThat(response).hasStatus(HttpStatus.NO_CONTENT);
        verify(suspendAccount).execute(7L);
    }

    @Test
    void reactivatesTheAccountAsAdmin() {
        var response = mvc.post()
                .uri("/api/v1/accounts/7/reactivate")
                .with(sessionOf("ADMIN", 1L))
                .with(csrf());

        assertThat(response).hasStatus(HttpStatus.NO_CONTENT);
        verify(reactivateAccount).execute(7L);
    }

    @ParameterizedTest
    @ValueSource(strings = {"suspend", "reactivate"})
    void rejectsARequestWithoutSession(String action) {
        var response = mvc.post().uri("/api/v1/accounts/7/" + action).with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(suspendAccount, reactivateAccount);
    }

    @ParameterizedTest
    @CsvSource({"suspend, CUSTOMER", "suspend, OWNER", "reactivate, CUSTOMER", "reactivate, OWNER"})
    void rejectsARequestFromAnotherRole(String action, String role) {
        var response = mvc.post()
                .uri("/api/v1/accounts/7/" + action)
                .with(sessionOf(role, 7L))
                .with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("access_denied");
        verifyNoInteractions(suspendAccount, reactivateAccount);
    }

    @ParameterizedTest
    @ValueSource(strings = {"suspend", "reactivate"})
    void rejectsARequestWithoutCsrfToken(String action) {
        var response = mvc.post().uri("/api/v1/accounts/7/" + action).with(sessionOf("ADMIN", 1L));

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("csrf_invalid");
        verifyNoInteractions(suspendAccount, reactivateAccount);
    }

    @ParameterizedTest
    @ValueSource(strings = {"suspend", "reactivate"})
    void rejectsAnIdThatIsNotANumber(String action) {
        var response = mvc.post()
                .uri("/api/v1/accounts/abc/" + action)
                .with(sessionOf("ADMIN", 1L))
                .with(csrf());

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo("id");
        });
        verifyNoInteractions(suspendAccount, reactivateAccount);
    }

    @Test
    void returnsNotFoundWhenTheAccountToSuspendDoesNotExist() {
        doThrow(new AccountNotFoundException(99L)).when(suspendAccount).execute(99L);

        var response = mvc.post()
                .uri("/api/v1/accounts/99/suspend")
                .with(sessionOf("ADMIN", 1L))
                .with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("identity.not_found");
    }

    @Test
    void returnsNotFoundWhenTheAccountToReactivateDoesNotExist() {
        doThrow(new AccountNotFoundException(99L)).when(reactivateAccount).execute(99L);

        var response = mvc.post()
                .uri("/api/v1/accounts/99/reactivate")
                .with(sessionOf("ADMIN", 1L))
                .with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("identity.not_found");
    }

    @Test
    void refusesToSuspendAnAdmin() {
        doThrow(new DomainException("identity.admin_not_suspendable", "No se puede suspender"))
                .when(suspendAccount)
                .execute(1L);

        var response = mvc.post()
                .uri("/api/v1/accounts/1/suspend")
                .with(sessionOf("ADMIN", 1L))
                .with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.UNPROCESSABLE_CONTENT)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("identity.admin_not_suspendable");
    }

    private static Account account(Long id, String name, String email, Role role, boolean suspended) {
        return new Account(id, name, email, "hashed:secreta123", role, suspended, NOW);
    }
}
