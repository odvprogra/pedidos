package com.nur.pedidos.shared.infrastructure.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import com.nur.pedidos.TestcontainersConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.JdbcTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.session.Session;
import org.springframework.session.jdbc.JdbcIndexedSessionRepository;
import org.springframework.transaction.support.TransactionOperations;

@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestcontainersConfiguration.class)
class SessionRevokerTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private FindByIndexNameSessionRepository<? extends Session> sessionRepository;
    private SessionRevoker sessionRevoker;

    @BeforeEach
    void createRepository() {
        sessionRepository = new JdbcIndexedSessionRepository(jdbcTemplate, TransactionOperations.withoutTransaction());
        sessionRevoker = new SessionRevoker(sessionRepository);
    }

    @Test
    void indexesTheSessionByTheIdOfTheUser() {
        signIn(new CurrentUser(7L, "CUSTOMER"));

        assertThat(jdbcTemplate.queryForList("select principal_name from spring_session", String.class))
                .containsExactly("7");
    }

    @Test
    void deletesEverySessionOfTheUser() {
        String first = signIn(new CurrentUser(7L, "CUSTOMER"));
        String second = signIn(new CurrentUser(7L, "CUSTOMER"));

        sessionRevoker.revokeAll(7L);

        assertThat(sessionRepository.findById(first)).isNull();
        assertThat(sessionRepository.findById(second)).isNull();
    }

    @Test
    void keepsTheSessionsOfOtherUsers() {
        signIn(new CurrentUser(7L, "CUSTOMER"));
        String other = signIn(new CurrentUser(17L, "OWNER"));

        sessionRevoker.revokeAll(7L);

        assertThat(sessionRepository.findById(other)).isNotNull();
    }

    @Test
    void doesNothingWhenTheUserHasNoSessions() {
        assertThatCode(() -> sessionRevoker.revokeAll(7L)).doesNotThrowAnyException();
    }

    private String signIn(CurrentUser user) {
        return openSession(sessionRepository, user);
    }

    private static <S extends Session> String openSession(
            FindByIndexNameSessionRepository<S> repository, CurrentUser user) {
        S session = repository.createSession();
        session.setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                new SecurityContextImpl(user.toAuthentication()));
        repository.save(session);
        return session.getId();
    }
}
