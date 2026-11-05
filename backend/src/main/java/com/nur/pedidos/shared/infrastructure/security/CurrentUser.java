package com.nur.pedidos.shared.infrastructure.security;

import java.io.Serializable;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticatedPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

public record CurrentUser(Long id, String role) implements AuthenticatedPrincipal, Serializable {

    @Override
    public String getName() {
        return String.valueOf(id);
    }

    Authentication toAuthentication() {
        return UsernamePasswordAuthenticationToken.authenticated(
                this, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }
}
