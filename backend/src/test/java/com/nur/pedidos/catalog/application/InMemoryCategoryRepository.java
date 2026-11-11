package com.nur.pedidos.catalog.application;

import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.catalog.domain.port.CategoryRepository;
import java.util.List;
import java.util.Optional;
import java.util.TreeMap;

class InMemoryCategoryRepository implements CategoryRepository {

    private final TreeMap<Long, Category> categories = new TreeMap<>();
    private long sequence;

    @Override
    public Category save(Category category) {
        Long id = category.getId() != null ? category.getId() : ++sequence;
        categories.put(id, copyOf(category, id));
        return copyOf(category, id);
    }

    @Override
    public Optional<Category> findById(Long id) {
        return Optional.ofNullable(categories.get(id)).map(category -> copyOf(category, id));
    }

    @Override
    public Optional<Category> findByRestaurantIdAndNameIgnoringCase(Long restaurantId, String name) {
        return categories.values().stream()
                .filter(category -> category.belongsTo(restaurantId))
                .filter(category -> category.getName().equalsIgnoreCase(name))
                .findFirst()
                .map(category -> copyOf(category, category.getId()));
    }

    @Override
    public List<Category> findAllByRestaurantId(Long restaurantId) {
        return categories.values().stream()
                .filter(category -> category.belongsTo(restaurantId))
                .map(category -> copyOf(category, category.getId()))
                .toList();
    }

    @Override
    public void deleteById(Long id) {
        categories.remove(id);
    }

    String nameOf(Long id) {
        return categories.get(id).getName();
    }

    boolean contains(Long id) {
        return categories.containsKey(id);
    }

    int count() {
        return categories.size();
    }

    private static Category copyOf(Category category, Long id) {
        return new Category(id, category.getRestaurantId(), category.getName());
    }
}
