package com.nur.pedidos.shared.infrastructure.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;

class SecuritySessionsTest {

    private final SecuritySessions sessions = new SecuritySessions();
    private final MockHttpServletRequest request = new MockHttpServletRequest();
    private final MockHttpServletResponse response = new MockHttpServletResponse();

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void keepsTheUserInTheSessionAfterSigningIn() {
        CurrentUser user = new CurrentUser(7L, "CUSTOMER");

        sessions.signIn(user, request, response);

        SecurityContext context = (SecurityContext)
                request.getSession().getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
        assertThat(context.getAuthentication().getPrincipal()).isEqualTo(user);
        assertThat(context.getAuthentication().getName()).isEqualTo("7");
        assertThat(context.getAuthentication().getAuthorities())
                .extracting(Object::toString)
                .containsExactly("ROLE_CUSTOMER");
    }

    @Test
    void changesTheIdOfAnExistingSessionWhenSigningIn() {
        MockHttpSession session = new MockHttpSession();
        request.setSession(session);
        String previousId = session.getId();

        sessions.signIn(new CurrentUser(7L, "CUSTOMER"), request, response);

        assertThat(request.getSession().getId()).isNotEqualTo(previousId);
    }

    @Test
    void invalidatesTheSessionWhenSigningOut() {
        sessions.signIn(new CurrentUser(7L, "CUSTOMER"), request, response);
        MockHttpSession session = (MockHttpSession) request.getSession();

        sessions.signOut(request, response);

        assertThat(session.isInvalid()).isTrue();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
}
