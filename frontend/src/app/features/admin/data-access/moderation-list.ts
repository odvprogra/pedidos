import { DestroyRef, Injector, afterNextRender, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Page } from '@core/http/page';
import { ProblemDetails, toProblemDetails } from '@core/http/problem-details';
import { NoticeSlot } from '@shared/ui/sticky-notice/notice-slot';
import { Observable } from 'rxjs';
import { ModerationAction, ModerationCopy } from '../models/moderation-action';

export const MODERATION_PAGE_SIZE = 20;

interface Focusable {
  focus(): void;
}

export interface Moderated {
  id: number;
  name: string;
}

export interface ModerationSource<T extends Moderated> {
  list(page: number, size: number): Observable<Page<T>>;
  apply(action: ModerationAction, item: T): Observable<T>;
  copyFor(action: ModerationAction, name: string): ModerationCopy;
  describeError(problem: ProblemDetails): string;
  heading(): Focusable | undefined;
  loadError(): Focusable | undefined;
}

export class ModerationList<T extends Moderated> {
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly arrivedFromAnotherPage = Boolean(
    inject(Router).currentNavigation()?.previousNavigation,
  );
  private readonly source: ModerationSource<T>;
  private requestedPage = 0;
  private readonly shownPage = signal<Page<T> | null>(null);
  private readonly fetching = signal(true);
  private readonly failure = signal<string | null>(null);
  private readonly working = signal<number | null>(null);
  private readonly asking = signal<number | null>(null);

  readonly result = this.shownPage.asReadonly();
  readonly loading = this.fetching.asReadonly();
  readonly problem = this.failure.asReadonly();
  readonly pendingId = this.working.asReadonly();
  readonly confirmingId = this.asking.asReadonly();
  readonly notice = new NoticeSlot();
  readonly busy = computed(() => this.loading() || this.pendingId() !== null);

  constructor(source: ModerationSource<T>) {
    this.source = source;
  }

  start(): void {
    this.load(0, this.arrivedFromAnotherPage);
  }

  goTo(page: number): void {
    if (this.busy()) {
      return;
    }
    this.notice.clear();
    this.load(page, true);
  }

  retry(): void {
    this.load(this.requestedPage, true);
  }

  toggleConfirmation(id: number, open: boolean): void {
    if (open) {
      this.asking.set(id);
    } else if (this.confirmingId() === id) {
      this.asking.set(null);
    }
  }

  run(action: ModerationAction, item: T): void {
    if (this.busy()) {
      return;
    }
    this.working.set(item.id);
    this.notice.clear();
    this.source
      .apply(action, item)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.replace(updated);
          this.notice.show('success', this.source.copyFor(action, updated.name).done);
          this.working.set(null);
        },
        error: (error: unknown) => {
          this.notice.show('danger', this.source.describeError(toProblemDetails(error)));
          this.working.set(null);
        },
      });
  }

  private load(page: number, moveFocus: boolean): void {
    this.requestedPage = page;
    this.fetching.set(true);
    this.failure.set(null);
    this.asking.set(null);
    this.source
      .list(page, MODERATION_PAGE_SIZE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.shownPage.set(result);
          this.fetching.set(false);
          if (moveFocus) {
            this.focus(() => this.source.heading());
          }
        },
        error: (error: unknown) => {
          this.failure.set(this.source.describeError(toProblemDetails(error)));
          this.fetching.set(false);
          if (moveFocus) {
            this.focus(() => this.source.loadError());
          }
        },
      });
  }

  private replace(updated: T): void {
    this.shownPage.update(
      (result) =>
        result && {
          ...result,
          items: result.items.map((item) => (item.id === updated.id ? updated : item)),
        },
    );
  }

  private focus(target: () => Focusable | undefined): void {
    afterNextRender(() => target()?.focus(), { injector: this.injector });
  }
}
