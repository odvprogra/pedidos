package com.nur.pedidos.catalog.application;

import com.nur.pedidos.catalog.domain.exception.CatalogNotOwnerException;
import com.nur.pedidos.catalog.domain.exception.CategoryNameTakenException;
import com.nur.pedidos.catalog.domain.exception.CategoryNotFoundException;
import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.catalog.domain.port.CategoryRepository;
import com.nur.pedidos.catalog.domain.port.RestaurantDirectory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RenameCategoryUseCase {

    private final RestaurantDirectory restaurantDirectory;
    private final CategoryRepository categoryRepository;

    @Transactional
    public Category execute(RenameCategoryCommand command) {
        Long restaurantId = restaurantDirectory.restaurantIdOf(command.ownerId());
        Category category =
                categoryRepository.findById(command.categoryId()).orElseThrow(CategoryNotFoundException::new);
        if (!category.belongsTo(restaurantId)) {
            throw new CatalogNotOwnerException();
        }
        category.rename(command.name());
        boolean takenByAnother = categoryRepository
                .findByRestaurantIdAndNameIgnoringCase(restaurantId, category.getName())
                .filter(other -> !other.getId().equals(category.getId()))
                .isPresent();
        if (takenByAnother) {
            throw new CategoryNameTakenException();
        }
        return categoryRepository.save(category);
    }
}
