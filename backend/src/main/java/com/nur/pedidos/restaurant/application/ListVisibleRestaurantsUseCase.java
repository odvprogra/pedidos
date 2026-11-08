package com.nur.pedidos.restaurant.application;

import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.port.RestaurantRepository;
import com.nur.pedidos.shared.domain.model.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ListVisibleRestaurantsUseCase {

    private final RestaurantRepository restaurantRepository;

    @Transactional(readOnly = true)
    public PageResult<Restaurant> execute(int page, int size) {
        return restaurantRepository.findVisibleOpenFirst(page, size);
    }
}
