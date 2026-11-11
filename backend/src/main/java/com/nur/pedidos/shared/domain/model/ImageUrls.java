package com.nur.pedidos.shared.domain.model;

import com.nur.pedidos.shared.domain.exception.DomainException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Set;

public final class ImageUrls {

    public static final int MAX_LENGTH = 500;

    private static final Set<String> WEB_SCHEMES = Set.of("http", "https");

    private ImageUrls() {}

    public static String normalize(String text, String code) {
        if (text == null || text.isBlank()) {
            return null;
        }
        String url = text.strip();
        if (url.length() > MAX_LENGTH || !isWebAddress(url)) {
            throw new DomainException(
                    code, "La imagen tiene que ser una dirección web que empiece con http:// o https://");
        }
        return url;
    }

    private static boolean isWebAddress(String url) {
        try {
            URI uri = new URI(url);
            return uri.getScheme() != null
                    && WEB_SCHEMES.contains(uri.getScheme().toLowerCase())
                    && uri.getHost() != null;
        } catch (URISyntaxException e) {
            return false;
        }
    }
}
