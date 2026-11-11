package com.nur.pedidos.identity.application;

import com.nur.pedidos.identity.domain.port.AccountSessions;
import java.util.HashMap;
import java.util.Map;

class InMemoryAccountSessions implements AccountSessions {

    private final Map<Long, Integer> openSessions = new HashMap<>();

    void open(Long accountId) {
        openSessions.merge(accountId, 1, Integer::sum);
    }

    int openSessionsOf(Long accountId) {
        return openSessions.getOrDefault(accountId, 0);
    }

    @Override
    public void revokeAll(Long accountId) {
        openSessions.remove(accountId);
    }
}
