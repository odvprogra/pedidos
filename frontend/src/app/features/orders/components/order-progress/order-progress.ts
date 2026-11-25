import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { OrderStatus } from '@shared/utils/order-status';
import { ProgressStep, progressOf } from '../../models/order';

@Component({
  selector: 'app-order-progress',
  templateUrl: './order-progress.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderProgress {
  readonly status = input.required<OrderStatus>();

  protected readonly steps = computed<ProgressStep[]>(() => progressOf(this.status()) ?? []);
  protected readonly position = computed(() => {
    const steps = this.steps();
    const current = steps.findIndex((step) => step.current);
    return current < 0 ? steps.length : current + 1;
  });
  protected readonly currentLabel = computed(() => this.steps()[this.position() - 1]?.label ?? '');

  protected stateOf(step: ProgressStep): string {
    if (step.current) {
      return 'paso actual';
    }
    return step.done ? 'hecho' : 'pendiente';
  }
}
