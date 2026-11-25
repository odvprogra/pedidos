package com.nur.pedidos.order.application;

import com.nur.pedidos.order.domain.port.RestaurantDirectory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetOwnRestaurantIdUseCase {

    private final RestaurantDirectory restaurantDirectory;

    @Transactional(readOnly = true)
    public Long execute(Long ownerId) {
        return restaurantDirectory.restaurantIdOf(ownerId);
    }
}
