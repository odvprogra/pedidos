package com.nur.pedidos.identity.infrastructure.web;

import static com.nur.pedidos.shared.infrastructure.security.TestSessions.sessionOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import com.nur.pedidos.identity.application.ReactivateAccountUseCase;
import com.nur.pedidos.identity.application.SuspendAccountUseCase;
import com.nur.pedidos.identity.domain.exception.AccountNotFoundException;
import com.nur.pedidos.shared.domain.exception.DomainException;
import com.nur.pedidos.shared.infrastructure.security.SecurityConfig;
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

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private SuspendAccountUseCase suspendAccount;

    @MockitoBean
    private ReactivateAccountUseCase reactivateAccount;

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
}
