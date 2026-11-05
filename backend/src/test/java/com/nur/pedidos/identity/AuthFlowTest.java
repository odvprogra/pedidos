package com.nur.pedidos.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.nur.pedidos.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.client.EntityExchangeResult;
import org.springframework.test.web.servlet.client.RestTestClient;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {"ADMIN_EMAIL=admin@pedidos.com", "ADMIN_PASSWORD=admin-secreta"})
@AutoConfigureRestTestClient
@Import(TestcontainersConfiguration.class)
class AuthFlowTest {

    private static final String PASSWORD = "secreta123";
    private static final String ADMIN_EMAIL = "admin@pedidos.com";
    private static final String ADMIN_PASSWORD = "admin-secreta";

    @Autowired
    private RestTestClient client;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void handsOutAReadableCsrfCookieWithoutOpeningASession() {
        client.get()
                .uri("/api/v1/auth/me")
                .exchange()
                .expectStatus()
                .isUnauthorized()
                .expectCookie()
                .exists("XSRF-TOKEN")
                .expectCookie()
                .httpOnly("XSRF-TOKEN", false)
                .expectCookie()
                .doesNotExist("SESSION");
    }

    @Test
    void registersReadsTheCurrentAccountAndLogsOut() {
        String csrfToken = fetchCsrfToken();

        EntityExchangeResult<AccountBody> registration = client.post()
                .uri("/api/v1/auth/register")
                .cookie("XSRF-TOKEN", csrfToken)
                .header("X-XSRF-TOKEN", csrfToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body("""
                        {"name": "Ana Rojas", "email": " Ana@Correo.com ", "password": "secreta123", "role": "CUSTOMER"}
                        """)
                .exchange()
                .expectStatus()
                .isCreated()
                .expectCookie()
                .httpOnly("SESSION", true)
                .expectCookie()
                .sameSite("SESSION", "Lax")
                .expectBody(AccountBody.class)
                .returnResult();
        String session = sessionOf(registration);
        Long accountId = registration.getResponseBody().id();

        assertThat(openSessionsOf(accountId)).isOne();
        client.get()
                .uri("/api/v1/auth/me")
                .cookie("SESSION", session)
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(AccountBody.class)
                .isEqualTo(new AccountBody(accountId, "Ana Rojas", "ana@correo.com", "CUSTOMER"));

        client.post()
                .uri("/api/v1/auth/logout")
                .cookie("SESSION", session)
                .cookie("XSRF-TOKEN", csrfToken)
                .header("X-XSRF-TOKEN", csrfToken)
                .exchange()
                .expectStatus()
                .isNoContent();

        assertThat(openSessionsOf(accountId)).isZero();
        client.get()
                .uri("/api/v1/auth/me")
                .cookie("SESSION", session)
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }

    @Test
    void replacesTheOpenSessionWhenLoggingInAgain() {
        String csrfToken = fetchCsrfToken();
        EntityExchangeResult<AccountBody> registration = register("luis@correo.com", csrfToken);
        String firstSession = sessionOf(registration);
        Long accountId = registration.getResponseBody().id();

        EntityExchangeResult<AccountBody> login = client.post()
                .uri("/api/v1/auth/login")
                .cookie("SESSION", firstSession)
                .cookie("XSRF-TOKEN", csrfToken)
                .header("X-XSRF-TOKEN", csrfToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body("""
                        {"email": "LUIS@correo.com", "password": "secreta123"}
                        """)
                .exchange()
                .expectStatus()
                .isOk()
                .expectCookie()
                .exists("SESSION")
                .expectBody(AccountBody.class)
                .returnResult();
        String secondSession = sessionOf(login);

        assertThat(secondSession).isNotEqualTo(firstSession);
        assertThat(openSessionsOf(accountId)).isOne();
        client.get()
                .uri("/api/v1/auth/me")
                .cookie("SESSION", firstSession)
                .exchange()
                .expectStatus()
                .isUnauthorized();
        client.get()
                .uri("/api/v1/auth/me")
                .cookie("SESSION", secondSession)
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(AccountBody.class)
                .value(account -> assertThat(account.email()).isEqualTo("luis@correo.com"));
    }

    @Test
    void logsInAsTheAdminCreatedAtStartup() {
        String csrfToken = fetchCsrfToken();

        EntityExchangeResult<AccountBody> login = logIn(ADMIN_EMAIL, ADMIN_PASSWORD, csrfToken);

        assertThat(login.getResponseBody())
                .extracting(AccountBody::name, AccountBody::email, AccountBody::role)
                .containsExactly("Administrador", ADMIN_EMAIL, "ADMIN");
        assertThat(jdbcTemplate.queryForObject("select count(*) from accounts where role = 'ADMIN'", Integer.class))
                .isOne();
    }

    @Test
    void rejectsARegistrationWithoutTheCsrfHeader() {
        String csrfToken = fetchCsrfToken();

        client.post()
                .uri("/api/v1/auth/register")
                .cookie("XSRF-TOKEN", csrfToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body("""
                        {"name": "Eva", "email": "eva@correo.com", "password": "secreta123", "role": "OWNER"}
                        """)
                .exchange()
                .expectStatus()
                .isForbidden()
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("csrf_invalid");

        assertThat(jdbcTemplate.queryForObject(
                        "select count(*) from accounts where email = 'eva@correo.com'", Integer.class))
                .isZero();
    }

    private String fetchCsrfToken() {
        return client.get()
                .uri("/api/health")
                .exchange()
                .expectStatus()
                .isOk()
                .returnResult()
                .getResponseCookies()
                .getFirst("XSRF-TOKEN")
                .getValue();
    }

    private EntityExchangeResult<AccountBody> register(String email, String csrfToken) {
        return client.post()
                .uri("/api/v1/auth/register")
                .cookie("XSRF-TOKEN", csrfToken)
                .header("X-XSRF-TOKEN", csrfToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new RegistrationBody("Luis Vaca", email, PASSWORD, "OWNER"))
                .exchange()
                .expectStatus()
                .isCreated()
                .expectBody(AccountBody.class)
                .returnResult();
    }

    private EntityExchangeResult<AccountBody> logIn(String email, String password, String csrfToken) {
        return client.post()
                .uri("/api/v1/auth/login")
                .cookie("XSRF-TOKEN", csrfToken)
                .header("X-XSRF-TOKEN", csrfToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new CredentialsBody(email, password))
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(AccountBody.class)
                .returnResult();
    }

    private static String sessionOf(EntityExchangeResult<?> result) {
        return result.getResponseCookies().getFirst("SESSION").getValue();
    }

    private Integer openSessionsOf(Long accountId) {
        return jdbcTemplate.queryForObject(
                "select count(*) from spring_session where principal_name = ?", Integer.class, accountId.toString());
    }

    private record RegistrationBody(String name, String email, String password, String role) {}

    private record CredentialsBody(String email, String password) {}

    private record AccountBody(Long id, String name, String email, String role) {}
}
