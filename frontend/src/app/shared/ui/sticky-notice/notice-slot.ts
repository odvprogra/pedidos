import { computed, signal } from '@angular/core';
import { AlertTone } from '../alert/alert';

export interface Notice {
  id: number;
  tone: AlertTone;
  message: string;
}

export class NoticeSlot {
  private count = 0;
  private readonly current = signal<Notice | null>(null);

  readonly shown = computed(() => {
    const notice = this.current();
    return notice ? [notice] : [];
  });

  show(tone: AlertTone, message: string): void {
    this.count += 1;
    this.current.set({ id: this.count, tone, message });
  }

  clear(): void {
    this.current.set(null);
  }
}
