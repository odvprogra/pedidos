package com.nur.pedidos.order.infrastructure.web;

import static com.nur.pedidos.shared.infrastructure.security.TestSessions.sessionOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nur.pedidos.order.application.AcceptOrderUseCase;
import com.nur.pedidos.order.application.CancelOrderUseCase;
import com.nur.pedidos.order.application.GetCustomerOrderUseCase;
import com.nur.pedidos.order.application.GetOwnRestaurantIdUseCase;
import com.nur.pedidos.order.application.ListCustomerOrdersUseCase;
import com.nur.pedidos.order.application.ListRestaurantOrdersUseCase;
import com.nur.pedidos.order.application.MarkOrderPickedUpUseCase;
import com.nur.pedidos.order.application.MarkOrderReadyUseCase;
import com.nur.pedidos.order.application.PlaceOrderUseCase;
import com.nur.pedidos.order.application.RejectOrderUseCase;
import com.nur.pedidos.order.application.StartPreparingOrderUseCase;
import com.nur.pedidos.order.domain.model.OrderChange;
import com.nur.pedidos.order.domain.model.OrderStatus;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.shared.infrastructure.security.SecurityConfig;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@WebMvcTest({OrderController.class, RestaurantOrderController.class})
@Import({SecurityConfig.class, OrderChangeStreams.class})
class OrderEventsControllerTest {

    private static final String RESTAURANT_EVENTS = "/api/v1/restaurants/mine/orders/events";
    private static final String CUSTOMER_EVENTS = "/api/v1/orders/events";
    private static final Long OWNER = 9L;
    private static final Long LA_CASONA = 4L;
    private static final Long EL_FOGON = 5L;
    private static final Long CUSTOMER = 7L;
    private static final Long OTHER_CUSTOMER = 8L;
    private static final String READY = """
            event:ready
            retry:3000
            data:

            """;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private OrderChangeStreams streams;

    @MockitoBean
    private GetOwnRestaurantIdUseCase getOwnRestaurantId;

    @MockitoBean
    private PlaceOrderUseCase placeOrder;

    @MockitoBean
    private ListCustomerOrdersUseCase listCustomerOrders;

    @MockitoBean
    private GetCustomerOrderUseCase getCustomerOrder;

    @MockitoBean
    private CancelOrderUseCase cancelOrder;

    @MockitoBean
    private ListRestaurantOrdersUseCase listRestaurantOrders;

    @MockitoBean
    private AcceptOrderUseCase acceptOrder;

    @MockitoBean
    private RejectOrderUseCase rejectOrder;

    @MockitoBean
    private StartPreparingOrderUseCase startPreparingOrder;

    @MockitoBean
    private MarkOrderReadyUseCase markOrderReady;

    @MockitoBean
    private MarkOrderPickedUpUseCase markOrderPickedUp;

    @Test
    void theOwnerHearsOnlyAboutTheOrdersOfTheirRestaurant() throws Exception {
        when(getOwnRestaurantId.execute(OWNER)).thenReturn(LA_CASONA);
        MvcResult stream = open(RESTAURANT_EVENTS, "OWNER", OWNER);

        streams.deliver(new OrderChange(42L, LA_CASONA, CUSTOMER, OrderStatus.PLACED));
        streams.deliver(new OrderChange(43L, EL_FOGON, OTHER_CUSTOMER, OrderStatus.PLACED));
        streams.deliver(new OrderChange(42L, LA_CASONA, CUSTOMER, OrderStatus.CANCELLED));

        assertThat(stream.getResponse().getContentAsString()).isEqualTo(READY + """
                event:order
                data:{"orderId":42,"status":"PLACED"}

                event:order
                data:{"orderId":42,"status":"CANCELLED"}

                """);
    }

    @Test
    void theCustomerHearsOnlyAboutTheirOwnOrders() throws Exception {
        MvcResult stream = open(CUSTOMER_EVENTS, "CUSTOMER", CUSTOMER);

        streams.deliver(new OrderChange(42L, LA_CASONA, CUSTOMER, OrderStatus.ACCEPTED));
        streams.deliver(new OrderChange(43L, LA_CASONA, OTHER_CUSTOMER, OrderStatus.ACCEPTED));

        assertThat(stream.getResponse().getContentAsString()).isEqualTo(READY + """
                event:order
                data:{"orderId":42,"status":"ACCEPTED"}

                """);
    }

    @Test
    void everyOpenTabOfTheSameCustomerHearsTheChange() throws Exception {
        MvcResult firstTab = open(CUSTOMER_EVENTS, "CUSTOMER", CUSTOMER);
        MvcResult secondTab = open(CUSTOMER_EVENTS, "CUSTOMER", CUSTOMER);

        streams.deliver(new OrderChange(42L, LA_CASONA, CUSTOMER, OrderStatus.READY));

        String ready = READY + """
                event:order
                data:{"orderId":42,"status":"READY"}

                """;
        assertThat(firstTab.getResponse().getContentAsString()).isEqualTo(ready);
        assertThat(secondTab.getResponse().getContentAsString()).isEqualTo(ready);
    }

    @Test
    void keepsTheConnectionAliveWithAComment() throws Exception {
        MvcResult stream = open(CUSTOMER_EVENTS, "CUSTOMER", CUSTOMER);

        streams.keepAlive();

        assertThat(stream.getResponse().getContentAsString()).isEqualTo(READY + ":keep-alive\n\n");
    }

    @Test
    void anOwnerWithoutARestaurantGetsNotFound() throws Exception {
        when(getOwnRestaurantId.execute(OWNER)).thenThrow(new RestaurantNotFoundException());

        mvc.perform(get(RESTAURANT_EVENTS).accept(MediaType.TEXT_EVENT_STREAM).with(sessionOf("OWNER", OWNER)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("restaurant.not_found"));
    }

    @ParameterizedTest
    @ValueSource(strings = {RESTAURANT_EVENTS, CUSTOMER_EVENTS})
    void rejectsAVisitorWithoutASession(String uri) throws Exception {
        mvc.perform(get(uri).accept(MediaType.TEXT_EVENT_STREAM))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("unauthenticated"));
    }

    @ParameterizedTest
    @MethodSource("wrongRoles")
    void rejectsAnAccountWithAnotherRole(String uri, String role) throws Exception {
        mvc.perform(get(uri).accept(MediaType.TEXT_EVENT_STREAM).with(sessionOf(role, 1L)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("access_denied"));
    }

    static Stream<Arguments> wrongRoles() {
        return Stream.of(
                Arguments.of(RESTAURANT_EVENTS, "CUSTOMER"),
                Arguments.of(RESTAURANT_EVENTS, "ADMIN"),
                Arguments.of(CUSTOMER_EVENTS, "OWNER"),
                Arguments.of(CUSTOMER_EVENTS, "ADMIN"));
    }

    private MvcResult open(String uri, String role, Long accountId) throws Exception {
        return mvc.perform(get(uri).accept(MediaType.TEXT_EVENT_STREAM).with(sessionOf(role, accountId)))
                .andExpect(request().asyncStarted())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM))
                .andReturn();
    }
}
