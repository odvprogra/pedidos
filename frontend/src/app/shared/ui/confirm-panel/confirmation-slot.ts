import { signal } from '@angular/core';

export class ConfirmationSlot<Key = number> {
  private readonly current = signal<Key | null>(null);

  readonly openKey = this.current.asReadonly();

  isOpen(key: Key): boolean {
    return this.current() === key;
  }

  set(key: Key, open: boolean): void {
    if (open) {
      this.current.set(key);
    } else if (this.current() === key) {
      this.current.set(null);
    }
  }

  close(): void {
    this.current.set(null);
  }
}
