import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Page } from '@core/http/page';
import { ProblemDetails } from '@core/http/problem-details';
import { Subject } from 'rxjs';
import { ModerationAction, ModerationCopy } from '../models/moderation-action';
import { MODERATION_PAGE_SIZE, ModerationList, ModerationSource } from './moderation-list';

interface Shop {
  id: number;
  name: string;
  suspended: boolean;
}

const LA_CASONA: Shop = { id: 4, name: 'La Casona', suspended: false };
const EL_FOGON: Shop = { id: 5, name: 'El Fogón', suspended: false };

function pageOf(items: Shop[], page = 0, totalItems = items.length): Page<Shop> {
  return {
    items,
    page,
    size: MODERATION_PAGE_SIZE,
    totalItems,
    totalPages: Math.ceil(totalItems / MODERATION_PAGE_SIZE),
  };
}

function failure(status: number, code?: string): HttpErrorResponse {
  return new HttpErrorResponse({
    status,
    error: { status, detail: 'Detalle del servidor', code },
  });
}

class FakeSource implements ModerationSource<Shop> {
  readonly requests: { page: number; size: number; reply: Subject<Page<Shop>> }[] = [];
  readonly actions: { action: ModerationAction; item: Shop; reply: Subject<Shop> }[] = [];
  readonly focused: string[] = [];

  list(page: number, size: number): Subject<Page<Shop>> {
    const reply = new Subject<Page<Shop>>();
    this.requests.push({ page, size, reply });
    return reply;
  }

  apply(action: ModerationAction, item: Shop): Subject<Shop> {
    const reply = new Subject<Shop>();
    this.actions.push({ action, item, reply });
    return reply;
  }

  copyFor(action: ModerationAction, name: string): ModerationCopy {
    return { done: `${action} ${name}` } as ModerationCopy;
  }

  describeError(problem: ProblemDetails): string {
    return problem.code ? `code ${problem.code}` : `status ${problem.status}`;
  }

  heading() {
    return { focus: () => this.focused.push('heading') };
  }

  loadError() {
    return { focus: () => this.focused.push('retry') };
  }
}

describe('ModerationList', () => {
  let source: FakeSource;
  let list: ModerationList<Shop>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    source = new FakeSource();
    list = TestBed.runInInjectionContext(() => new ModerationList(source));
  });

  function lastRequest() {
    return source.requests[source.requests.length - 1];
  }

  function lastAction() {
    return source.actions[source.actions.length - 1];
  }

  function respond(page: Page<Shop>): void {
    const { reply } = lastRequest();
    reply.next(page);
    reply.complete();
  }

  async function rendered(): Promise<void> {
    TestBed.tick();
    await Promise.resolve();
  }

  describe('loading', () => {
    it('asks for the first page of twenty and waits for it', () => {
      list.start();

      expect(source.requests.map(({ page, size }) => [page, size])).toEqual([[0, 20]]);
      expect(list.loading()).toBe(true);
      expect(list.busy()).toBe(true);
      expect(list.result()).toBeNull();
    });

    it('keeps the page that arrives', () => {
      list.start();
      respond(pageOf([LA_CASONA, EL_FOGON]));

      expect(list.loading()).toBe(false);
      expect(list.busy()).toBe(false);
      expect(list.result()?.items).toEqual([LA_CASONA, EL_FOGON]);
    });

    it('does not move the focus on the first load of a page opened directly', async () => {
      list.start();
      respond(pageOf([LA_CASONA]));
      await rendered();

      expect(source.focused).toEqual([]);
    });

    it('describes why the list did not load and takes the focus to "Reintentar"', async () => {
      list.start();
      respond(pageOf([LA_CASONA], 0, 45));
      list.goTo(1);
      lastRequest().reply.error(failure(503));
      await rendered();

      expect(list.problem()).toBe('status 503');
      expect(list.loading()).toBe(false);
      expect(source.focused).toEqual(['retry']);
    });

    it('asks again for the page that failed', () => {
      list.start();
      respond(pageOf([LA_CASONA], 0, 45));
      list.goTo(2);
      lastRequest().reply.error(failure(500));

      list.retry();

      expect(source.requests.map(({ page }) => page)).toEqual([0, 2, 2]);
      expect(list.problem()).toBeNull();
      expect(list.loading()).toBe(true);
    });
  });

  describe('changing the page', () => {
    beforeEach(() => {
      list.start();
      respond(pageOf([LA_CASONA], 0, 45));
    });

    it('keeps the current page while the next one loads and then focuses the title', async () => {
      list.goTo(1);

      expect(list.loading()).toBe(true);
      expect(list.result()?.page).toBe(0);

      respond(pageOf([EL_FOGON], 1, 45));
      await rendered();

      expect(list.result()?.page).toBe(1);
      expect(source.focused).toEqual(['heading']);
    });

    it('ignores another page while one is loading', () => {
      list.goTo(1);
      list.goTo(2);

      expect(source.requests.map(({ page }) => page)).toEqual([0, 1]);
    });

    it('clears the notice of the last action', () => {
      list.run('suspend', LA_CASONA);
      lastAction().reply.next({ ...LA_CASONA, suspended: true });

      list.goTo(1);

      expect(list.notice.shown()).toEqual([]);
    });
  });

  describe('moderating', () => {
    beforeEach(() => {
      list.start();
      respond(pageOf([LA_CASONA, EL_FOGON]));
    });

    it('marks the item it works on and keeps the others locked', () => {
      list.run('suspend', LA_CASONA);

      expect(lastAction()).toMatchObject({ action: 'suspend', item: LA_CASONA });
      expect(list.pendingId()).toBe(4);
      expect(list.busy()).toBe(true);
    });

    it('shows the item that comes back and announces it', () => {
      list.run('suspend', LA_CASONA);
      lastAction().reply.next({ ...LA_CASONA, suspended: true });

      expect(list.result()?.items).toEqual([{ ...LA_CASONA, suspended: true }, EL_FOGON]);
      expect(list.pendingId()).toBeNull();
      expect(list.notice.shown()).toMatchObject([
        { tone: 'success', message: 'suspend La Casona' },
      ]);
    });

    it('keeps the item as it was and describes the failure', () => {
      list.run('reactivate', EL_FOGON);
      lastAction().reply.error(failure(404, 'restaurant.not_found'));

      expect(list.result()?.items).toEqual([LA_CASONA, EL_FOGON]);
      expect(list.pendingId()).toBeNull();
      expect(list.notice.shown()).toMatchObject([
        { tone: 'danger', message: 'code restaurant.not_found' },
      ]);
    });

    it('ignores a second action while one is running', () => {
      list.run('suspend', LA_CASONA);
      list.run('suspend', EL_FOGON);

      expect(source.actions).toHaveLength(1);
    });

    it('ignores an action while a page is loading', () => {
      list.goTo(1);
      list.run('suspend', LA_CASONA);

      expect(source.actions).toHaveLength(0);
    });

    it('clears the last notice when another action starts', () => {
      list.run('suspend', LA_CASONA);
      lastAction().reply.error(failure(500));

      list.run('suspend', EL_FOGON);

      expect(list.notice.shown()).toEqual([]);
    });
  });

  describe('the question before an action', () => {
    beforeEach(() => {
      list.start();
      respond(pageOf([LA_CASONA, EL_FOGON], 0, 45));
    });

    it('keeps a single question open', () => {
      list.toggleConfirmation(4, true);
      list.toggleConfirmation(5, true);

      expect(list.confirmingId()).toBe(5);
    });

    it('ignores the closing of a question that is no longer open', () => {
      list.toggleConfirmation(4, true);
      list.toggleConfirmation(5, true);

      list.toggleConfirmation(4, false);
      expect(list.confirmingId()).toBe(5);

      list.toggleConfirmation(5, false);
      expect(list.confirmingId()).toBeNull();
    });

    it('closes the question when another page loads', () => {
      list.toggleConfirmation(4, true);

      list.goTo(1);

      expect(list.confirmingId()).toBeNull();
    });
  });
});
