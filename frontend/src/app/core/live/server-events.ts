import {
  DestroyRef,
  Injectable,
  InjectionToken,
  assertInInjectionContext,
  inject,
} from '@angular/core';
import { LiveConnection, OpenEventSource } from './live-connection';

export const OPEN_EVENT_SOURCE = new InjectionToken<OpenEventSource>('OPEN_EVENT_SOURCE', {
  providedIn: 'root',
  factory: () => (url) => (typeof EventSource === 'undefined' ? null : new EventSource(url)),
});

@Injectable({ providedIn: 'root' })
export class ServerEvents {
  private readonly openEventSource = inject(OPEN_EVENT_SOURCE);

  follow<T>(url: string, eventName: string): LiveConnection<T> {
    assertInInjectionContext(this.follow);
    const connection = new LiveConnection<T>(this.openEventSource, url, eventName);
    inject(DestroyRef).onDestroy(() => connection.close());
    return connection;
  }
}
