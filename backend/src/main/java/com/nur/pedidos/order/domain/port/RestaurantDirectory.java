package com.nur.pedidos.order.domain.port;

import com.nur.pedidos.order.domain.model.RestaurantSnapshot;

public interface RestaurantDirectory {

    RestaurantSnapshot restaurantTakingOrders(Long restaurantId);
}
