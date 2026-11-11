package com.nur.pedidos.identity.infrastructure.security;

import com.nur.pedidos.identity.domain.port.AccountSessions;
import com.nur.pedidos.shared.infrastructure.security.SessionRevoker;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class SpringSessionAccountSessions implements AccountSessions {

    private final SessionRevoker sessionRevoker;

    @Override
    public void revokeAll(Long accountId) {
        sessionRevoker.revokeAll(accountId);
    }
}
