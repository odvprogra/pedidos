package com.nur.pedidos.catalog.infrastructure.web;

import com.nur.pedidos.catalog.application.CreateCategoryUseCase;
import com.nur.pedidos.catalog.application.DeleteCategoryUseCase;
import com.nur.pedidos.catalog.application.RenameCategoryUseCase;
import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.shared.infrastructure.security.CurrentUser;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(CategoryController.CATEGORIES)
@RequiredArgsConstructor
class CategoryController {

    static final String CATEGORIES = "/api/v1/restaurants/mine/categories";

    private final CreateCategoryUseCase createCategory;
    private final RenameCategoryUseCase renameCategory;
    private final DeleteCategoryUseCase deleteCategory;

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    ResponseEntity<CategoryResponse> create(
            @AuthenticationPrincipal CurrentUser owner, @Valid @RequestBody CategoryRequest request) {
        Category category = createCategory.execute(request.toCreateCommand(owner.id()));
        return ResponseEntity.created(URI.create(CATEGORIES + "/" + category.getId()))
                .body(CategoryResponse.from(category));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    CategoryResponse rename(
            @AuthenticationPrincipal CurrentUser owner,
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        return CategoryResponse.from(renameCategory.execute(request.toRenameCommand(owner.id(), id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@AuthenticationPrincipal CurrentUser owner, @PathVariable Long id) {
        deleteCategory.execute(owner.id(), id);
    }
}
