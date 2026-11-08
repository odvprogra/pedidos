import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Step {
  title: string;
  description: string;
}

@Component({
  selector: 'app-registration-steps',
  templateUrl: './registration-steps.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationSteps {
  protected readonly steps: Step[] = [
    {
      title: 'Regístralo',
      description: 'Con su nombre y la dirección donde tus clientes retiran los pedidos.',
    },
    {
      title: 'Empieza cerrado',
      description: 'Los clientes todavía no pueden pedir, así que puedes prepararte con calma.',
    },
    {
      title: 'Ábrelo',
      description:
        'Con un interruptor empiezas a recibir pedidos y dejas de hacerlo cuando quieras.',
    },
  ];
}
