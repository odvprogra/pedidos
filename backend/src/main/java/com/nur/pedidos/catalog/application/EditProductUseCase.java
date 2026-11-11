package com.nur.pedidos.catalog.application;

import com.nur.pedidos.catalog.domain.exception.CatalogNotOwnerException;
import com.nur.pedidos.catalog.domain.exception.CategoryNotFoundException;
import com.nur.pedidos.catalog.domain.exception.ProductNotFoundException;
import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.catalog.domain.model.Product;
import com.nur.pedidos.catalog.domain.port.CategoryRepository;
import com.nur.pedidos.catalog.domain.port.ProductRepository;
import com.nur.pedidos.catalog.domain.port.RestaurantDirectory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EditProductUseCase {

    private final RestaurantDirectory restaurantDirectory;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional
    public Product execute(EditProductCommand command) {
        Long restaurantId = restaurantDirectory.restaurantIdOf(command.ownerId());
        Product product = productRepository.findById(command.productId()).orElseThrow(ProductNotFoundException::new);
        if (!product.belongsTo(restaurantId)) {
            throw new CatalogNotOwnerException();
        }
        Category category =
                categoryRepository.findById(command.categoryId()).orElseThrow(CategoryNotFoundException::new);
        if (!category.belongsTo(restaurantId)) {
            throw new CatalogNotOwnerException();
        }
        product.edit(category, command.name(), command.description(), command.price(), command.imageUrl());
        return productRepository.save(product);
    }
}
