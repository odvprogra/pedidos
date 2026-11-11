import { DestroyRef, Injector, afterNextRender, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Page } from '@core/http/page';
import { ProblemDetails, toProblemDetails } from '@core/http/problem-details';
import { ConfirmationSlot } from '@shared/ui/confirm-panel/confirmation-slot';
import { NoticeSlot } from '@shared/ui/sticky-notice/notice-slot';
import { Observable } from 'rxjs';
import { ModerationAction, ModerationCopy } from '../models/moderation-action';

export const MODERATION_PAGE_SIZE = 20;

interface Focusable {
  focus(): void;
}

interface Moderated {
  id: number;
  name: string;
}

export interface ModerationConfig<T extends Moderated> {
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
  private readonly config: ModerationConfig<T>;
  private requestedPage = 0;
  private readonly shownPage = signal<Page<T> | null>(null);
  private readonly fetching = signal(true);
  private readonly failure = signal<string | null>(null);
  private readonly working = signal<number | null>(null);
  private readonly retryingLoad = signal(false);

  readonly result = this.shownPage.asReadonly();
  readonly loading = this.fetching.asReadonly();
  readonly problem = this.failure.asReadonly();
  readonly pendingId = this.working.asReadonly();
  readonly retrying = this.retryingLoad.asReadonly();
  readonly notice = new NoticeSlot();
  readonly confirmation = new ConfirmationSlot();
  readonly busy = computed(() => this.loading() || this.pendingId() !== null);

  constructor(config: ModerationConfig<T>) {
    this.config = config;
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
    if (this.busy()) {
      return;
    }
    this.load(this.requestedPage, true, true);
  }

  run(action: ModerationAction, item: T): void {
    if (this.busy()) {
      return;
    }
    this.working.set(item.id);
    this.notice.clear();
    this.config
      .apply(action, item)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.replace(updated);
          this.notice.show('success', this.config.copyFor(action, updated.name).done);
          this.working.set(null);
        },
        error: (error: unknown) => {
          this.notice.show('danger', this.config.describeError(toProblemDetails(error)));
          this.working.set(null);
        },
      });
  }

  private load(page: number, moveFocus: boolean, retrying = false): void {
    this.requestedPage = page;
    this.retryingLoad.set(retrying);
    this.fetching.set(true);
    if (!retrying) {
      this.failure.set(null);
    }
    this.confirmation.close();
    this.config
      .list(page, MODERATION_PAGE_SIZE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.shownPage.set(result);
          this.failure.set(null);
          this.fetching.set(false);
          this.retryingLoad.set(false);
          if (moveFocus) {
            this.focus(() => this.config.heading());
          }
        },
        error: (error: unknown) => {
          this.failure.set(this.config.describeError(toProblemDetails(error)));
          this.fetching.set(false);
          this.retryingLoad.set(false);
          if (moveFocus) {
            this.focus(() => this.config.loadError());
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
