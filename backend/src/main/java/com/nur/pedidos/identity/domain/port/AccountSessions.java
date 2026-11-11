package com.nur.pedidos.identity.domain.port;

public interface AccountSessions {

    void revokeAll(Long accountId);
}
