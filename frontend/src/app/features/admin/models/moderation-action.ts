export type ModerationAction = 'suspend' | 'reactivate';

export interface ModerationCopy {
  label: string;
  target: string;
  working: string;
  question: string;
  consequence: string;
  confirm: string;
  done: string;
}
