import { AccountSummary } from './account-summary';
import { ModerationAction, ModerationCopy } from './moderation-action';

export function actionFor(account: AccountSummary): ModerationAction | null {
  if (account.role === 'ADMIN') {
    return null;
  }
  return account.suspended ? 'reactivate' : 'suspend';
}

export function copyFor(action: ModerationAction, name: string): ModerationCopy {
  if (action === 'suspend') {
    return {
      label: 'Suspender',
      target: `la cuenta de ${name}`,
      working: 'Suspendiendo…',
      question: `¿Suspender la cuenta de ${name}?`,
      consequence:
        'No podrá ingresar y se cerrarán sus sesiones abiertas. Puedes reactivarla cuando quieras.',
      confirm: 'Sí, suspender',
      done: `Suspendiste la cuenta de ${name}. Ya no puede ingresar.`,
    };
  }
  return {
    label: 'Reactivar',
    target: `la cuenta de ${name}`,
    working: 'Reactivando…',
    question: `¿Reactivar la cuenta de ${name}?`,
    consequence: 'Podrá volver a ingresar con su correo y su contraseña.',
    confirm: 'Sí, reactivar',
    done: `Reactivaste la cuenta de ${name}. Ya puede volver a ingresar.`,
  };
}
