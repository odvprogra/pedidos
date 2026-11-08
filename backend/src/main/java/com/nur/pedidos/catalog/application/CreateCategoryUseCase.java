package com.nur.pedidos.catalog.application;

import com.nur.pedidos.catalog.domain.exception.CategoryNameTakenException;
import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.catalog.domain.port.CategoryRepository;
import com.nur.pedidos.catalog.domain.port.RestaurantDirectory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreateCategoryUseCase {

    private final RestaurantDirectory restaurantDirectory;
    private final CategoryRepository categoryRepository;

    @Transactional
    public Category execute(CreateCategoryCommand command) {
        Long restaurantId = restaurantDirectory.restaurantIdOf(command.ownerId());
        Category category = Category.create(restaurantId, command.name());
        if (categoryRepository
                .findByRestaurantIdAndNameIgnoringCase(restaurantId, category.getName())
                .isPresent()) {
            throw new CategoryNameTakenException();
        }
        return categoryRepository.save(category);
    }
}
