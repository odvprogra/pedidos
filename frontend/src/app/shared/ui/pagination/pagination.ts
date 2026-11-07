import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly disabled = input(false);
  readonly pageChange = output<number>();

  protected readonly cannotGoBack = computed(() => this.disabled() || this.page() <= 0);
  protected readonly cannotGoForward = computed(
    () => this.disabled() || this.page() >= this.totalPages() - 1,
  );

  protected previous(): void {
    if (!this.cannotGoBack()) {
      this.pageChange.emit(this.page() - 1);
    }
  }

  protected next(): void {
    if (!this.cannotGoForward()) {
      this.pageChange.emit(this.page() + 1);
    }
  }
}
