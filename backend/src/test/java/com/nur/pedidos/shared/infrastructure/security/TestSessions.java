package com.nur.pedidos.shared.infrastructure.security;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;

import org.springframework.test.web.servlet.request.RequestPostProcessor;

public final class TestSessions {

    private TestSessions() {}

    public static RequestPostProcessor sessionOf(String role, Long id) {
        return authentication(new CurrentUser(id, role).toAuthentication());
    }
}
