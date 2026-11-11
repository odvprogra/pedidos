import { BadgeTone } from '@shared/ui/badge/badge';

export type ServiceState = 'ok' | 'error' | 'pending';

export const SERVICE_STATE_LABELS: Record<ServiceState, string> = {
  ok: 'Activo',
  error: 'Sin conexión',
  pending: 'Verificando',
};

export const SERVICE_STATE_TONES: Record<ServiceState, BadgeTone> = {
  ok: 'success',
  error: 'danger',
  pending: 'neutral',
};
