import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Page } from '@core/http/page';
import { ProblemDetails } from '@core/http/problem-details';
import { Subject } from 'rxjs';
import { ModerationAction, ModerationCopy } from '../models/moderation-action';
import { MODERATION_PAGE_SIZE, ModerationList, ModerationConfig } from './moderation-list';

interface Item {
  id: number;
  name: string;
  suspended: boolean;
}

const LA_CASONA: Item = { id: 4, name: 'La Casona', suspended: false };
const EL_FOGON: Item = { id: 5, name: 'El Fogón', suspended: false };

function pageOf(items: Item[], page = 0, totalItems = items.length): Page<Item> {
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

class FakeConfig implements ModerationConfig<Item> {
  readonly requests: { page: number; size: number; reply: Subject<Page<Item>> }[] = [];
  readonly actions: { action: ModerationAction; item: Item; reply: Subject<Item> }[] = [];
  readonly focused: string[] = [];

  list(page: number, size: number): Subject<Page<Item>> {
    const reply = new Subject<Page<Item>>();
    this.requests.push({ page, size, reply });
    return reply;
  }

  apply(action: ModerationAction, item: Item): Subject<Item> {
    const reply = new Subject<Item>();
    this.actions.push({ action, item, reply });
    return reply;
  }

  copyFor(action: ModerationAction, name: string): ModerationCopy {
    return {
      label: 'Acción',
      target: name,
      working: 'Trabajando…',
      question: `¿${action} ${name}?`,
      consequence: 'Cambia el estado.',
      confirm: 'Sí',
      done: `${action} ${name}`,
    };
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
  let config: FakeConfig;
  let list: ModerationList<Item>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    config = new FakeConfig();
    list = TestBed.runInInjectionContext(() => new ModerationList(config));
  });

  function lastRequest() {
    return config.requests[config.requests.length - 1];
  }

  function lastAction() {
    return config.actions[config.actions.length - 1];
  }

  function respond(page: Page<Item>): void {
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

      expect(config.requests.map(({ page, size }) => [page, size])).toEqual([[0, 20]]);
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

      expect(config.focused).toEqual([]);
    });

    it('describes why the list did not load and takes the focus to "Reintentar"', async () => {
      list.start();
      respond(pageOf([LA_CASONA], 0, 45));
      list.goTo(1);
      lastRequest().reply.error(failure(503));
      await rendered();

      expect(list.problem()).toBe('status 503');
      expect(list.loading()).toBe(false);
      expect(config.focused).toEqual(['retry']);
    });

    it('asks again for the page that failed', () => {
      list.start();
      respond(pageOf([LA_CASONA], 0, 45));
      list.goTo(2);
      lastRequest().reply.error(failure(500));

      list.retry();

      expect(config.requests.map(({ page }) => page)).toEqual([0, 2, 2]);
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
      expect(config.focused).toEqual(['heading']);
    });

    it('ignores another page while one is loading', () => {
      list.goTo(1);
      list.goTo(2);

      expect(config.requests.map(({ page }) => page)).toEqual([0, 1]);
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

      expect(config.actions).toHaveLength(1);
    });

    it('ignores an action while a page is loading', () => {
      list.goTo(1);
      list.run('suspend', LA_CASONA);

      expect(config.actions).toHaveLength(0);
    });

    it('clears the last notice when another action starts', () => {
      list.run('suspend', LA_CASONA);
      lastAction().reply.error(failure(500));

      list.run('suspend', EL_FOGON);

      expect(list.notice.shown()).toEqual([]);
    });
  });

  describe('the question before an action', () => {
    it('closes the open question when another page loads', () => {
      list.start();
      respond(pageOf([LA_CASONA, EL_FOGON], 0, 45));
      list.confirmation.set(4, true);

      list.goTo(1);

      expect(list.confirmation.openKey()).toBeNull();
    });
  });
});
