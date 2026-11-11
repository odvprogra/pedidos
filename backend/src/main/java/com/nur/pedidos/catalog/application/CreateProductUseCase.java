package com.nur.pedidos.catalog.application;

import com.nur.pedidos.catalog.domain.exception.CatalogNotOwnerException;
import com.nur.pedidos.catalog.domain.exception.CategoryNotFoundException;
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
public class CreateProductUseCase {

    private final RestaurantDirectory restaurantDirectory;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional
    public Product execute(CreateProductCommand command) {
        Long restaurantId = restaurantDirectory.restaurantIdOf(command.ownerId());
        Category category =
                categoryRepository.findById(command.categoryId()).orElseThrow(CategoryNotFoundException::new);
        if (!category.belongsTo(restaurantId)) {
            throw new CatalogNotOwnerException();
        }
        Product product = Product.create(category, command.name(), command.description(), command.price());
        return productRepository.save(product);
    }
}
