package com.nur.pedidos.shared.infrastructure.security;

import static com.nur.pedidos.shared.infrastructure.security.TestSessions.sessionOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import com.nur.pedidos.shared.infrastructure.web.HealthController;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@WebMvcTest(HealthController.class)
@Import({SecurityConfig.class, SecurityConfigTest.AdminOnlyController.class})
class SecurityConfigTest {

    private static final String ADMIN_ONLY = "/api/v1/admin-only";

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private JdbcTemplate jdbcTemplate;

    @Test
    void letsAnyoneCheckTheHealth() {
        when(jdbcTemplate.queryForObject("show server_version", String.class)).thenReturn("17.6");

        assertThat(mvc.get().uri("/api/health")).hasStatusOk();
    }

    @Test
    void rejectsARequestWithoutSessionWithProblemDetails() {
        assertThat(mvc.get().uri(ADMIN_ONLY))
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
                .bodyJson()
                .satisfies(json -> {
                    assertThat(json).extractingPath("$.code").isEqualTo("unauthenticated");
                    assertThat(json).extractingPath("$.status").isEqualTo(401);
                    assertThat(json).extractingPath("$.instance").isEqualTo(ADMIN_ONLY);
                });
    }

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "OWNER"})
    void rejectsTheWrongRoleWithProblemDetails(String role) {
        assertThat(mvc.get().uri(ADMIN_ONLY).with(sessionOf(role, 7L)))
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("access_denied");
    }

    @Test
    void letsTheRightRoleIn() {
        assertThat(mvc.get().uri(ADMIN_ONLY).with(sessionOf("ADMIN", 1L))).hasStatusOk();
    }

    @Test
    void rejectsAModifyingRequestWithoutCsrfToken() {
        assertThat(mvc.post().uri(ADMIN_ONLY).with(sessionOf("ADMIN", 1L)))
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("csrf_invalid");
    }

    @Test
    void acceptsAModifyingRequestWithCsrfToken() {
        assertThat(mvc.post().uri(ADMIN_ONLY).with(sessionOf("ADMIN", 1L)).with(csrf()))
                .hasStatusOk();
    }

    @RestController
    static class AdminOnlyController {

        @GetMapping(ADMIN_ONLY)
        @PreAuthorize("hasRole('ADMIN')")
        String read() {
            return "ok";
        }

        @PostMapping(ADMIN_ONLY)
        @PreAuthorize("hasRole('ADMIN')")
        String change() {
            return "ok";
        }
    }
}
