import { computed, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type LiveState = 'connecting' | 'live' | 'interrupted';

export type OpenEventSource = (url: string) => EventSource | null;

export const INTERRUPTION_GRACE_MS = 5000;
export const REOPEN_DELAYS_MS = [3000, 6000, 12000, 30000];

const CLOSED = 2;

export class LiveConnection<T> {
  private readonly messages = new Subject<T>();
  private readonly reopenings = new Subject<boolean>();
  private readonly connected = signal(false);
  private readonly interrupted = signal(false);
  private source: EventSource | null = null;
  private hasOpened = false;
  private failures = 0;
  private graceTimer: ReturnType<typeof setTimeout> | null = null;
  private reopenTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;

  readonly messages$: Observable<T> = this.messages.asObservable();
  readonly reconnected$: Observable<boolean> = this.reopenings.asObservable();
  readonly state = computed<LiveState>(() => {
    if (this.connected()) {
      return 'live';
    }
    return this.interrupted() ? 'interrupted' : 'connecting';
  });

  constructor(
    private readonly openEventSource: OpenEventSource,
    private readonly url: string,
    private readonly eventName: string,
  ) {
    this.open();
  }

  close(): void {
    this.closed = true;
    this.stopTimers();
    this.source?.close();
    this.source = null;
    this.messages.complete();
    this.reopenings.complete();
  }

  private open(): void {
    const source = this.openEventSource(this.url);
    this.source = source;
    if (!source) {
      return;
    }
    source.onopen = () => this.opened();
    source.onerror = () => this.failed(source);
    source.addEventListener(this.eventName, (event) =>
      this.messages.next(JSON.parse((event as MessageEvent<string>).data) as T),
    );
  }

  private opened(): void {
    const wasInterrupted = this.interrupted();
    this.stopTimers();
    this.failures = 0;
    this.connected.set(true);
    this.interrupted.set(false);
    if (this.hasOpened) {
      this.reopenings.next(wasInterrupted);
    }
    this.hasOpened = true;
  }

  private failed(source: EventSource): void {
    if (this.closed) {
      return;
    }
    this.connected.set(false);
    this.graceTimer ??= setTimeout(() => this.interrupted.set(true), INTERRUPTION_GRACE_MS);
    if (source.readyState === CLOSED) {
      source.close();
      const delay = REOPEN_DELAYS_MS[Math.min(this.failures, REOPEN_DELAYS_MS.length - 1)];
      this.failures += 1;
      this.reopenTimer = setTimeout(() => {
        this.reopenTimer = null;
        this.open();
      }, delay);
    }
  }

  private stopTimers(): void {
    if (this.graceTimer !== null) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }
    if (this.reopenTimer !== null) {
      clearTimeout(this.reopenTimer);
      this.reopenTimer = null;
    }
  }
}
