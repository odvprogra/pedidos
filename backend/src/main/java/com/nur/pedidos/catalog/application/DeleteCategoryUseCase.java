package com.nur.pedidos.catalog.application;

import com.nur.pedidos.catalog.domain.exception.CatalogNotOwnerException;
import com.nur.pedidos.catalog.domain.exception.CategoryNotEmptyException;
import com.nur.pedidos.catalog.domain.exception.CategoryNotFoundException;
import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.catalog.domain.port.CategoryRepository;
import com.nur.pedidos.catalog.domain.port.ProductRepository;
import com.nur.pedidos.catalog.domain.port.RestaurantDirectory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DeleteCategoryUseCase {

    private final RestaurantDirectory restaurantDirectory;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional
    public void execute(Long ownerId, Long categoryId) {
        Long restaurantId = restaurantDirectory.restaurantIdOf(ownerId);
        Category category = categoryRepository.findById(categoryId).orElseThrow(CategoryNotFoundException::new);
        if (!category.belongsTo(restaurantId)) {
            throw new CatalogNotOwnerException();
        }
        if (productRepository.existsByCategoryId(categoryId)) {
            throw new CategoryNotEmptyException();
        }
        categoryRepository.deleteById(categoryId);
    }
}
