import { OpenEventSource } from './live-connection';

type Listener = (event: MessageEvent<string>) => void;

export class FakeEventSource {
  readyState = 0;
  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  closed = false;
  private readonly listeners = new Map<string, Listener[]>();

  constructor(readonly url: string) {}

  addEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  close(): void {
    this.closed = true;
    this.readyState = 2;
  }

  connect(): void {
    this.readyState = 1;
    this.onopen?.(new Event('open'));
  }

  emit(type: string, data: unknown): void {
    const event = new MessageEvent<string>(type, { data: JSON.stringify(data) });
    this.listeners.get(type)?.forEach((listener) => listener(event));
  }

  drop(): void {
    this.readyState = 0;
    this.onerror?.(new Event('error'));
  }

  refuse(): void {
    this.readyState = 2;
    this.onerror?.(new Event('error'));
  }
}

export class FakeEventSources {
  readonly opened: FakeEventSource[] = [];

  readonly open: OpenEventSource = (url) => {
    const source = new FakeEventSource(url);
    this.opened.push(source);
    return source as unknown as EventSource;
  };

  latest(url: string): FakeEventSource {
    const found = this.opened.filter((source) => source.url === url).at(-1);
    if (!found) {
      throw new Error(`Nothing opened ${url}`);
    }
    return found;
  }
}
