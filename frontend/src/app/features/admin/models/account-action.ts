import { AccountSummary } from './account-summary';

export type AccountAction = 'suspend' | 'reactivate';

export interface AccountActionCopy {
  label: string;
  working: string;
  question: string;
  consequence: string;
  confirm: string;
  done: string;
}

export function actionFor(account: AccountSummary): AccountAction | null {
  if (account.role === 'ADMIN') {
    return null;
  }
  return account.suspended ? 'reactivate' : 'suspend';
}

export function copyFor(action: AccountAction, name: string): AccountActionCopy {
  if (action === 'suspend') {
    return {
      label: 'Suspender',
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
    working: 'Reactivando…',
    question: `¿Reactivar la cuenta de ${name}?`,
    consequence: 'Podrá volver a ingresar con su correo y su contraseña.',
    confirm: 'Sí, reactivar',
    done: `Reactivaste la cuenta de ${name}. Ya puede volver a ingresar.`,
  };
}
