package com.nur.pedidos.shared.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.shared.domain.exception.DomainException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class ImageUrlsTest {

    private static final String CODE = "catalog.invalid_image_url";

    @ParameterizedTest
    @ValueSource(
            strings = {
                "https://fotos.pedidos.test/silpancho.jpg",
                "http://localhost:8080/logo.png",
                "HTTPS://Fotos.Pedidos.Test/casona.webp?size=400"
            })
    void keepsAWebAddressAsItIs(String url) {
        assertThat(ImageUrls.normalize(url, CODE)).isEqualTo(url);
    }

    @Test
    void trimsTheSpacesAroundTheAddress() {
        assertThat(ImageUrls.normalize("  https://fotos.pedidos.test/logo.png  ", CODE))
                .isEqualTo("https://fotos.pedidos.test/logo.png");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void treatsABlankAddressAsNoImage(String url) {
        assertThat(ImageUrls.normalize(url, CODE)).isNull();
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "foto.jpg",
                "fotos.pedidos.test/logo.png",
                "ftp://fotos.pedidos.test/logo.png",
                "javascript:alert(1)",
                "https://",
                "https://fotos pedidos.test/logo.png"
            })
    void rejectsAnythingThatIsNotAWebAddressWithTheGivenCode(String url) {
        assertThatThrownBy(() -> ImageUrls.normalize(url, CODE))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo(CODE);
    }

    @Test
    void acceptsAnAddressUpToItsLimitAndRejectsALongerOne() {
        String prefix = "https://fotos.pedidos.test/";
        String atLimit = prefix + "a".repeat(ImageUrls.MAX_LENGTH - prefix.length());

        assertThat(ImageUrls.normalize(atLimit, CODE)).isEqualTo(atLimit);
        assertThatThrownBy(() -> ImageUrls.normalize(atLimit + "a", CODE))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo(CODE);
    }
}
