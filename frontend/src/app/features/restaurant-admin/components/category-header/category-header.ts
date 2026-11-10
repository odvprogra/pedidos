import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { SecondaryButton } from '@shared/ui/button/secondary-button';
import { ConfirmPanel } from '@shared/ui/confirm-panel/confirm-panel';
import { Spinner } from '@shared/ui/spinner/spinner';
import { Category, countProducts } from '../../models/catalog';

@Component({
  selector: 'app-category-header',
  imports: [ConfirmPanel, SecondaryButton, Spinner],
  templateUrl: './category-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryHeader {
  private readonly injector = inject(Injector);
  private readonly deleteButton = viewChild<ElementRef<HTMLButtonElement>>('deleteButton');

  readonly category = input.required<Category>();
  readonly productCount = input.required<number>();
  readonly deleting = input(false);
  readonly locked = input(false);
  readonly confirming = model(false);
  readonly rename = output();
  readonly deleteConfirmed = output();

  protected readonly unavailable = computed(() => this.deleting() || this.locked());
  protected readonly countLabel = computed(() => countProducts(this.productCount()));
  protected readonly idPrefix = computed(() => `category-${this.category().id}`);
  protected readonly empty = computed(() => this.productCount() === 0);
  protected readonly notEmptyConsequence = computed(() =>
    this.productCount() === 1
      ? 'Tiene 1 producto. Muévelo a otra categoría o bórralo primero.'
      : `Tiene ${this.countLabel()}. Muévelos a otra categoría o bórralos primero.`,
  );

  protected requestRename(): void {
    if (!this.unavailable()) {
      this.rename.emit();
    }
  }

  protected toggleConfirmation(): void {
    if (this.confirming()) {
      this.closeConfirmation();
    } else if (!this.unavailable()) {
      this.confirming.set(true);
    }
  }

  protected dismiss(): void {
    if (this.confirming()) {
      this.closeConfirmation();
    }
  }

  protected closeConfirmation(): void {
    this.confirming.set(false);
    this.focusDeleteButton();
  }

  protected confirmDeletion(): void {
    if (this.unavailable() || !this.empty()) {
      return;
    }
    this.confirming.set(false);
    this.deleteConfirmed.emit();
    this.focusDeleteButton();
  }

  private focusDeleteButton(): void {
    afterNextRender(() => this.deleteButton()?.nativeElement.focus(), { injector: this.injector });
  }
}
