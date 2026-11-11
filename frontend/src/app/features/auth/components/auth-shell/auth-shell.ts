import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-auth-shell',
  templateUrl: './auth-shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthShell {
  protected readonly benefits = [
    'Los menús de los restaurantes de tu ciudad',
    'Arma tu pedido en un par de minutos',
    'Sigue el estado de cada pedido',
  ];
}
