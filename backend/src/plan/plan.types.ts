export interface BusySlot {
  label: string;
  allDay?: boolean;
  start?: string;
  end?: string;
}

export interface PlanTaskInput {
  id: string;
  title: string;
  minutes: number;
  time?: string;
}

export interface PlanDayInput {
  key: string;
  short: string;
  full: string;
  busy: BusySlot[];
  tasks: PlanTaskInput[];
}

export interface RuleCheck {
  id: string;
  ok: boolean;
  blocking: boolean;
  label: string;
  detail?: string;
}

export interface ValidationReport {
  checks: RuleCheck[];
  canConfirm: boolean;
  totalMinutes: number;
}
