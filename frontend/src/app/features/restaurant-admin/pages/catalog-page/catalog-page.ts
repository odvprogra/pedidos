import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FieldViolation, ProblemDetails, toProblemDetails } from '@core/http/problem-details';
import { Alert, AlertTone } from '@shared/ui/alert/alert';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Button } from '@shared/ui/button/button';
import { LoadError } from '@shared/ui/load-error/load-error';
import { Observable } from 'rxjs';
import { CategoryForm } from '../../components/category-form/category-form';
import { CategoryHeader } from '../../components/category-header/category-header';
import { ProductForm } from '../../components/product-form/product-form';
import { ProductRow, ProductTask } from '../../components/product-row/product-row';
import { CatalogApi } from '../../data-access/catalog-api';
import {
  Catalog,
  CatalogCategory,
  Category,
  Product,
  ProductDraft,
  addCategory,
  putProduct,
  removeCategory,
  removeProduct,
  renameCategory,
} from '../../models/catalog';
import { describeCatalogError, isMenuOutdated, isNameTaken } from '../../models/catalog-error';
import { isNotRegistered } from '../../models/restaurant-error';

type PageState =
  | { status: 'loading' }
  | { status: 'failed'; message: string }
  | { status: 'ready'; catalog: Catalog };

type Editing =
  | { kind: 'new-category' }
  | { kind: 'category'; id: number }
  | { kind: 'new-product'; categoryId: number }
  | { kind: 'product'; id: number };

type Working =
  { kind: 'category'; id: number } | { kind: 'product'; id: number; task: ProductTask };

interface Notice {
  id: number;
  tone: AlertTone;
  message: string;
}

@Component({
  selector: 'app-catalog-page',
  imports: [
    RouterLink,
    Alert,
    Button,
    CategoryForm,
    CategoryHeader,
    EmptyState,
    LoadError,
    ProductForm,
    ProductRow,
  ],
  templateUrl: './catalog-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPage implements OnInit {
  private readonly catalogApi = inject(CatalogApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly loadError = viewChild(LoadError);
  private readonly arrivedFromAnotherPage = Boolean(
    this.router.currentNavigation()?.previousNavigation,
  );
  private returnFocusTo: string | null = null;
  private noticeCount = 0;

  protected readonly placeholders = [1, 2];
  protected readonly state = signal<PageState>({ status: 'loading' });
  protected readonly editing = signal<Editing | null>(null);
  protected readonly saving = signal(false);
  protected readonly formErrors = signal<FieldViolation[]>([]);
  protected readonly formAlert = signal<string | null>(null);
  protected readonly working = signal<Working | null>(null);
  protected readonly notice = signal<Notice | null>(null);
  protected readonly notices = computed(() => {
    const current = this.notice();
    return current ? [current] : [];
  });
  protected readonly catalog = computed(() => {
    const current = this.state();
    return current.status === 'ready' ? current.catalog : null;
  });
  protected readonly categories = computed<Category[]>(
    () => this.catalog()?.categories.map(({ id, name }) => ({ id, name })) ?? [],
  );
  protected readonly busy = computed(() => this.saving() || this.working() !== null);

  ngOnInit(): void {
    this.load(this.arrivedFromAnotherPage);
  }

  protected retry(): void {
    this.load(true);
  }

  protected isAddingCategory(): boolean {
    return this.editing()?.kind === 'new-category';
  }

  protected isRenaming(category: CatalogCategory): boolean {
    const editing = this.editing();
    return editing?.kind === 'category' && editing.id === category.id;
  }

  protected isAddingProductTo(category: CatalogCategory): boolean {
    const editing = this.editing();
    return editing?.kind === 'new-product' && editing.categoryId === category.id;
  }

  protected isEditing(product: Product): boolean {
    const editing = this.editing();
    return editing?.kind === 'product' && editing.id === product.id;
  }

  protected isDeleting(category: CatalogCategory): boolean {
    const working = this.working();
    return working?.kind === 'category' && working.id === category.id;
  }

  protected taskOf(product: Product): ProductTask | null {
    const working = this.working();
    return working?.kind === 'product' && working.id === product.id ? working.task : null;
  }

  protected startNewCategory(): void {
    this.open({ kind: 'new-category' }, 'new-category');
  }

  protected startRename(category: CatalogCategory): void {
    this.open({ kind: 'category', id: category.id }, `rename-category-${category.id}`);
  }

  protected startNewProduct(category: CatalogCategory): void {
    this.open({ kind: 'new-product', categoryId: category.id }, `add-product-${category.id}`);
  }

  protected startEdit(product: Product): void {
    this.open({ kind: 'product', id: product.id }, `edit-product-${product.id}`);
  }

  protected closeForm(): void {
    if (this.saving()) {
      return;
    }
    this.editing.set(null);
    this.focusAfterRender(this.returnFocusTo);
  }

  protected saveCategory(name: string): void {
    const editing = this.editing();
    if (editing?.kind === 'category') {
      this.submit(this.catalogApi.renameCategory(editing.id, name), (category) => {
        this.updateCatalog((catalog) => renameCategory(catalog, category));
        this.announce(`Cambiaste el nombre de la categoría a ${category.name}.`);
        this.focusAfterRender(`rename-category-${category.id}`);
      });
    } else if (editing?.kind === 'new-category') {
      this.submit(this.catalogApi.createCategory(name), (category) => {
        this.updateCatalog((catalog) => addCategory(catalog, category));
        this.announce(`Creaste la categoría ${category.name}. Ahora agrégale productos.`);
        this.focusAfterRender(`add-product-${category.id}`);
      });
    }
  }

  protected saveProduct(draft: ProductDraft): void {
    const editing = this.editing();
    if (editing?.kind === 'product') {
      this.submit(this.catalogApi.editProduct(editing.id, draft), (product) => {
        this.updateCatalog((catalog) => putProduct(catalog, product));
        this.announce(`Guardaste los cambios de ${product.name}.`);
        this.focusAfterRender(`edit-product-${product.id}`);
      });
    } else if (editing?.kind === 'new-product') {
      this.submit(this.catalogApi.createProduct(draft), (product) => {
        this.updateCatalog((catalog) => putProduct(catalog, product));
        this.announce(`Agregaste ${product.name} a ${this.categoryName(product.categoryId)}.`);
        this.focusAfterRender(`add-product-${editing.categoryId}`);
      });
    }
  }

  protected changeAvailability(product: Product, available: boolean): void {
    if (this.busy()) {
      return;
    }
    this.working.set({ kind: 'product', id: product.id, task: 'availability' });
    const request = available
      ? this.catalogApi.markAvailable(product.id)
      : this.catalogApi.markSoldOut(product.id);
    this.act(request, () => {
      this.updateCatalog((catalog) => putProduct(catalog, { ...product, available }));
      this.announce(
        available
          ? `${product.name} vuelve a estar disponible.`
          : `Marcaste ${product.name} como agotado. Tus clientes lo ven, pero no lo pueden pedir.`,
      );
    });
  }

  protected deleteProduct(product: Product): void {
    if (this.busy()) {
      return;
    }
    this.working.set({ kind: 'product', id: product.id, task: 'deletion' });
    this.act(this.catalogApi.deleteProduct(product.id), () => {
      this.updateCatalog((catalog) => removeProduct(catalog, product.id));
      this.announce(`Borraste ${product.name} del menú.`);
      this.focusAfterRender(`add-product-${product.categoryId}`);
    });
  }

  protected deleteCategory(category: CatalogCategory): void {
    if (this.busy()) {
      return;
    }
    this.working.set({ kind: 'category', id: category.id });
    this.act(this.catalogApi.deleteCategory(category.id), () => {
      this.updateCatalog((catalog) => removeCategory(catalog, category.id));
      this.announce(`Borraste la categoría ${category.name}.`);
      this.focusAfterRender('new-category');
    });
  }

  private open(editing: Editing, trigger: string): void {
    if (this.busy()) {
      return;
    }
    this.editing.set(editing);
    this.returnFocusTo = trigger;
    this.formErrors.set([]);
    this.formAlert.set(null);
  }

  private submit<T>(request: Observable<T>, done: (result: T) => void): void {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    this.formErrors.set([]);
    this.formAlert.set(null);
    request.subscribe({
      next: (result) => {
        this.saving.set(false);
        this.editing.set(null);
        done(result);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.handleFormError(toProblemDetails(error));
      },
    });
  }

  private act(request: Observable<void>, done: () => void): void {
    request.subscribe({
      next: () => {
        this.working.set(null);
        done();
      },
      error: (error: unknown) => {
        this.working.set(null);
        this.handleActionError(toProblemDetails(error));
      },
    });
  }

  private handleFormError(problem: ProblemDetails): void {
    if (isNotRegistered(problem)) {
      this.leave();
    } else if (isMenuOutdated(problem)) {
      this.editing.set(null);
      this.reload(problem);
    } else if (isNameTaken(problem)) {
      this.formErrors.set([{ field: 'name', message: describeCatalogError(problem) }]);
    } else {
      this.formErrors.set(problem.errors ?? []);
      this.formAlert.set(describeCatalogError(problem));
    }
  }

  private handleActionError(problem: ProblemDetails): void {
    if (isNotRegistered(problem)) {
      this.leave();
    } else if (isMenuOutdated(problem)) {
      this.reload(problem);
    } else {
      this.notify('danger', describeCatalogError(problem));
    }
  }

  private reload(problem: ProblemDetails): void {
    this.notify('warning', describeCatalogError(problem));
    this.load(true);
  }

  private load(moveFocus: boolean): void {
    this.state.set({ status: 'loading' });
    this.catalogApi.mine().subscribe({
      next: (catalog) => {
        this.state.set({ status: 'ready', catalog });
        if (moveFocus) {
          this.focusAfterRender(null);
        }
      },
      error: (error: unknown) => {
        const problem = toProblemDetails(error);
        if (isNotRegistered(problem)) {
          this.leave();
          return;
        }
        this.state.set({ status: 'failed', message: describeCatalogError(problem) });
        this.notice.set(null);
        if (moveFocus) {
          afterNextRender(() => this.loadError()?.focus(), { injector: this.injector });
        }
      },
    });
  }

  private leave(): void {
    this.router.navigate(['..'], { relativeTo: this.route, replaceUrl: true });
  }

  private updateCatalog(change: (catalog: Catalog) => Catalog): void {
    const catalog = this.catalog();
    if (catalog) {
      this.state.set({ status: 'ready', catalog: change(catalog) });
    }
  }

  private announce(message: string): void {
    this.notify('success', message);
  }

  private notify(tone: AlertTone, message: string): void {
    this.noticeCount += 1;
    this.notice.set({ id: this.noticeCount, tone, message });
  }

  private categoryName(categoryId: number): string {
    return this.categories().find((category) => category.id === categoryId)?.name ?? '';
  }

  private focusAfterRender(targetId: string | null): void {
    afterNextRender(
      () => {
        const target = targetId
          ? this.host.nativeElement.querySelector<HTMLElement>(`#${targetId}`)
          : null;
        (target ?? this.heading()?.nativeElement)?.focus();
      },
      { injector: this.injector },
    );
  }
}
