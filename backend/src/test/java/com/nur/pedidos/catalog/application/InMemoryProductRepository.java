package com.nur.pedidos.catalog.application;

import com.nur.pedidos.catalog.domain.model.Product;
import com.nur.pedidos.catalog.domain.port.ProductRepository;
import java.util.List;
import java.util.Optional;
import java.util.TreeMap;

class InMemoryProductRepository implements ProductRepository {

    private final TreeMap<Long, Product> products = new TreeMap<>();
    private long sequence;

    @Override
    public Product save(Product product) {
        Long id = product.getId() != null ? product.getId() : ++sequence;
        products.put(id, copyOf(product, id));
        return copyOf(product, id);
    }

    @Override
    public Optional<Product> findById(Long id) {
        return Optional.ofNullable(products.get(id)).map(product -> copyOf(product, id));
    }

    @Override
    public List<Product> findAllByRestaurantId(Long restaurantId) {
        return products.values().stream()
                .filter(product -> product.belongsTo(restaurantId))
                .map(product -> copyOf(product, product.getId()))
                .toList();
    }

    @Override
    public boolean existsByCategoryId(Long categoryId) {
        return products.values().stream()
                .anyMatch(product -> product.getCategoryId().equals(categoryId));
    }

    @Override
    public void deleteById(Long id) {
        products.remove(id);
    }

    Product get(Long id) {
        return copyOf(products.get(id), id);
    }

    boolean contains(Long id) {
        return products.containsKey(id);
    }

    int count() {
        return products.size();
    }

    private static Product copyOf(Product product, Long id) {
        return new Product(
                id,
                product.getRestaurantId(),
                product.getCategoryId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.isAvailable());
    }
}
