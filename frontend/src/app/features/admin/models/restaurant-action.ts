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
        'Los clientes dejan de verlo y no recibe pedidos nuevos. Su dueño puede terminar los pedidos en curso. Puedes reactivarlo cuando quieras.',
      confirm: 'Sí, suspender',
      done: `Suspendiste ${name}. Los clientes ya no lo ven.`,
    };
  }
  return {
    label: 'Reactivar',
    target: name,
    working: 'Reactivando…',
    question: `¿Reactivar ${name}?`,
    consequence: 'Los clientes vuelven a verlo, cerrado hasta que su dueño lo abra.',
    confirm: 'Sí, reactivar',
    done: `Reactivaste ${name}. Vuelve a aparecer, cerrado hasta que su dueño lo abra.`,
  };
}
