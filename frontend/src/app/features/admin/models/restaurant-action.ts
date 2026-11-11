import { ModerationAction, ModerationCopy } from './moderation-action';
import { RestaurantSummary } from './restaurant-summary';

export function actionFor(restaurant: RestaurantSummary): ModerationAction {
  return restaurant.suspended ? 'reactivate' : 'suspend';
}

export function copyFor(action: ModerationAction, name: string): ModerationCopy {
  if (action === 'suspend') {
    return {
      label: 'Suspender',
      target: name,
      working: 'Suspendiendo…',
      question: `¿Suspender ${name}?`,
      consequence:
        'Deja de aparecer para los clientes y no recibe pedidos nuevos. Su dueño puede terminar los pedidos en curso. Puedes reactivar el restaurante cuando quieras.',
      confirm: 'Sí, suspender',
      done: `Suspendiste ${name}. Ya no aparece para los clientes.`,
    };
  }
  return {
    label: 'Reactivar',
    target: name,
    working: 'Reactivando…',
    question: `¿Reactivar ${name}?`,
    consequence:
      'El restaurante vuelve a aparecer para los clientes, pero queda cerrado hasta que su dueño lo abra.',
    confirm: 'Sí, reactivar',
    done: `Reactivaste ${name}. El restaurante queda cerrado hasta que su dueño lo abra.`,
  };
}
