import { TestBed } from '@angular/core/testing';
import { CREATE_AUDIO_CONTEXT, NewOrderChime } from './new-order-chime';

class FakeParam {
  value = 0;
  setValueAtTime(): void {
    return;
  }
  exponentialRampToValueAtTime(): void {
    return;
  }
}

class FakeNode {
  readonly gain = new FakeParam();
  readonly frequency = new FakeParam();
  type = '';
  startedAt: number | null = null;
  connect<T>(target: T): T {
    return target;
  }
  start(at: number): void {
    this.startedAt = at;
  }
  stop(): void {
    return;
  }
}

class FakeAudioContext {
  state: AudioContextState = 'running';
  currentTime = 10;
  readonly destination = {};
  readonly oscillators: FakeNode[] = [];
  resumes = 0;

  constructor(private readonly unlocksOnResume: boolean) {}

  resume(): Promise<void> {
    this.resumes += 1;
    if (this.unlocksOnResume) {
      this.state = 'running';
      return Promise.resolve();
    }
    return Promise.reject(new DOMException('Blocked', 'NotAllowedError'));
  }

  createOscillator(): FakeNode {
    const oscillator = new FakeNode();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain(): FakeNode {
    return new FakeNode();
  }
}

describe('NewOrderChime', () => {
  function chimeWith(context: FakeAudioContext | null): NewOrderChime {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CREATE_AUDIO_CONTEXT,
          useValue: () => context as unknown as AudioContext | null,
        },
      ],
    });
    return TestBed.inject(NewOrderChime);
  }

  it('plays two notes one after the other', async () => {
    const context = new FakeAudioContext(true);

    expect(await chimeWith(context).play()).toBe(true);
    expect(context.oscillators.map((note) => note.frequency.value)).toEqual([880, 1318.5]);
    expect(context.oscillators.map((note) => note.startedAt)).toEqual([10, 10.16]);
  });

  it('wakes up a context the browser started suspended', async () => {
    const context = new FakeAudioContext(true);
    context.state = 'suspended';

    expect(await chimeWith(context).play()).toBe(true);
    expect(context.resumes).toBe(1);
  });

  it('says it could not play when the browser keeps the sound blocked', async () => {
    const context = new FakeAudioContext(false);
    context.state = 'suspended';

    expect(await chimeWith(context).play()).toBe(false);
    expect(context.oscillators).toEqual([]);
  });

  it('says it could not play when the browser has no sound', async () => {
    expect(await chimeWith(null).play()).toBe(false);
    expect(await TestBed.inject(NewOrderChime).unlock()).toBe(false);
  });
});
