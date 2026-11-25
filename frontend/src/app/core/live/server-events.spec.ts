import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FakeEventSources } from './fake-event-sources';
import { INTERRUPTION_GRACE_MS, LiveConnection, REOPEN_DELAYS_MS } from './live-connection';
import { OPEN_EVENT_SOURCE, ServerEvents } from './server-events';

const URL = '/api/v1/orders/events';

interface Change {
  orderId: number;
  status: string;
}

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class Follower {
  readonly connection = inject(ServerEvents).follow<Change>(URL, 'order');
}

describe('ServerEvents', () => {
  let sources: FakeEventSources;
  let connection: LiveConnection<Change>;
  let received: Change[];
  let reconnections: boolean[];

  beforeEach(() => {
    vi.useFakeTimers();
    sources = new FakeEventSources();
    TestBed.configureTestingModule({
      providers: [{ provide: OPEN_EVENT_SOURCE, useValue: sources.open }],
    });
    connection = TestBed.createComponent(Follower).componentInstance.connection;
    received = [];
    reconnections = [];
    connection.messages$.subscribe((change) => received.push(change));
    connection.reconnected$.subscribe((wasInterrupted) => reconnections.push(wasInterrupted));
  });

  afterEach(() => vi.useRealTimers());

  it('connects to the url and turns live once the server answers', () => {
    expect(sources.latest(URL)).toBeTruthy();
    expect(connection.state()).toBe('connecting');

    sources.latest(URL).connect();

    expect(connection.state()).toBe('live');
    expect(reconnections).toEqual([]);
  });

  it('passes on every message of the event it follows and ignores the others', () => {
    sources.latest(URL).connect();

    sources.latest(URL).emit('order', { orderId: 42, status: 'ACCEPTED' });
    sources.latest(URL).emit('ready', '');
    sources.latest(URL).emit('order', { orderId: 43, status: 'PLACED' });

    expect(received).toEqual([
      { orderId: 42, status: 'ACCEPTED' },
      { orderId: 43, status: 'PLACED' },
    ]);
  });

  it('says it is interrupted only after a few seconds without connection', () => {
    sources.latest(URL).connect();

    sources.latest(URL).drop();
    vi.advanceTimersByTime(INTERRUPTION_GRACE_MS - 1);
    expect(connection.state()).toBe('connecting');

    vi.advanceTimersByTime(1);
    expect(connection.state()).toBe('interrupted');
  });

  it('tells that it reconnected after a short cut without showing it', () => {
    sources.latest(URL).connect();
    sources.latest(URL).drop();

    vi.advanceTimersByTime(INTERRUPTION_GRACE_MS - 1);
    sources.latest(URL).connect();
    vi.advanceTimersByTime(INTERRUPTION_GRACE_MS);

    expect(connection.state()).toBe('live');
    expect(reconnections).toEqual([false]);
  });

  it('tells that it reconnected after an interruption it showed', () => {
    sources.latest(URL).connect();
    sources.latest(URL).drop();
    vi.advanceTimersByTime(INTERRUPTION_GRACE_MS);

    sources.latest(URL).connect();

    expect(connection.state()).toBe('live');
    expect(reconnections).toEqual([true]);
  });

  it('opens a new connection when the server refuses one, waiting longer each time', () => {
    sources.latest(URL).refuse();
    expect(sources.opened).toHaveLength(1);
    expect(sources.opened[0].closed).toBe(true);

    vi.advanceTimersByTime(REOPEN_DELAYS_MS[0]);
    expect(sources.opened).toHaveLength(2);

    sources.latest(URL).refuse();
    vi.advanceTimersByTime(REOPEN_DELAYS_MS[0]);
    expect(sources.opened).toHaveLength(2);
    vi.advanceTimersByTime(REOPEN_DELAYS_MS[1] - REOPEN_DELAYS_MS[0]);
    expect(sources.opened).toHaveLength(3);

    sources.latest(URL).connect();
    expect(connection.state()).toBe('live');
  });

  it('closes the connection when the page that follows it goes away', () => {
    TestBed.resetTestingModule();

    expect(sources.latest(URL).closed).toBe(true);
    sources.latest(URL).refuse();
    vi.advanceTimersByTime(REOPEN_DELAYS_MS.at(-1) ?? 0);
    expect(sources.opened).toHaveLength(1);
  });
});
