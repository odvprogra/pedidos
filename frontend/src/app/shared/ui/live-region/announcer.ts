import { Injectable, computed, signal } from '@angular/core';

export interface Announcement {
  id: number;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class Announcer {
  private count = 0;
  private readonly current = signal<Announcement | null>(null);

  readonly shown = computed(() => {
    const announcement = this.current();
    return announcement ? [announcement] : [];
  });

  announce(message: string): number {
    this.count += 1;
    this.current.set({ id: this.count, message });
    return this.count;
  }

  clear(id: number): void {
    if (this.current()?.id === id) {
      this.current.set(null);
    }
  }
}
