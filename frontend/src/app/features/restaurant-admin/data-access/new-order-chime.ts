import { Injectable, InjectionToken, inject } from '@angular/core';

export const CREATE_AUDIO_CONTEXT = new InjectionToken<() => AudioContext | null>(
  'CREATE_AUDIO_CONTEXT',
  {
    providedIn: 'root',
    factory: () => () => (typeof AudioContext === 'undefined' ? null : new AudioContext()),
  },
);

const NOTES = [
  { frequency: 880, start: 0 },
  { frequency: 1318.5, start: 0.16 },
];
const NOTE_SECONDS = 0.35;
const RESUME_TIMEOUT_MS = 300;

@Injectable({ providedIn: 'root' })
export class NewOrderChime {
  private readonly createAudioContext = inject(CREATE_AUDIO_CONTEXT);
  private context: AudioContext | null = null;

  async unlock(): Promise<boolean> {
    return (await this.runningContext()) !== null;
  }

  async play(): Promise<boolean> {
    const context = await this.runningContext();
    if (!context) {
      return false;
    }
    for (const note of NOTES) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const at = context.currentTime + note.start;
      oscillator.type = 'sine';
      oscillator.frequency.value = note.frequency;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.3, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + NOTE_SECONDS);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(at);
      oscillator.stop(at + NOTE_SECONDS);
    }
    return true;
  }

  private async runningContext(): Promise<AudioContext | null> {
    this.context ??= this.createAudioContext();
    const context = this.context;
    if (!context) {
      return null;
    }
    if (context.state !== 'running') {
      try {
        await Promise.race([
          context.resume(),
          new Promise((resolve) => setTimeout(resolve, RESUME_TIMEOUT_MS)),
        ]);
      } catch {
        return null;
      }
    }
    return context.state === 'running' ? context : null;
  }
}
