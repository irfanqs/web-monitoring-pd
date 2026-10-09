// Duration of each step = time the step was finished - time the step became active.
// A step becomes active when the ticket is created (first step / first parallel group),
// when the step before it is finished, or when the ticket is returned to it.
// Calendar time is used (nights and weekends are counted).

export interface DurationStepConfig {
  stepNumber: number;
  isLsOnly: boolean;
  isNonLsOnly: boolean;
  isParallel: boolean;
  parallelGroup: string | null;
}

export interface DurationHistory {
  stepNumber: number;
  processorName: string;
  processedAt: Date;
  createdAt: Date;
}

export interface DurationTicket {
  id: string;
  isLs: boolean;
  status: string;
  createdAt: Date;
  histories: DurationHistory[]; // all rows, including voided ones
}

export interface StepDuration {
  ticketId: string;
  isLs: boolean;
  stepNumber: number;
  processorName: string;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
}

export interface TicketDuration {
  ticketId: string;
  isLs: boolean;
  completedAt: Date;
  durationMs: number;
}

const RETURN_MARKER = '[DIKEMBALIKAN]';
const ADMIN_SKIP_MARKER = '[DEBUG]';

function getApplicableSteps(configs: DurationStepConfig[], isLs: boolean) {
  return configs
    .filter((s) => (isLs ? !s.isNonLsOnly : !s.isLsOnly))
    .sort((a, b) => a.stepNumber - b.stepNumber);
}

export function computeStepDurations(ticket: DurationTicket, configs: DurationStepConfig[]): StepDuration[] {
  const applicable = getApplicableSteps(configs, ticket.isLs);
  if (applicable.length === 0) return [];

  const byNumber = new Map(applicable.map((s) => [s.stepNumber, s]));
  const groupSteps = (group: string) =>
    applicable.filter((s) => s.isParallel && s.parallelGroup === group).map((s) => s.stepNumber);

  const activeSince = new Map<number, Date>();
  const done = new Set<number>();

  const activate = (step: DurationStepConfig | undefined, at: Date) => {
    if (!step) return;
    if (step.isParallel && step.parallelGroup) {
      for (const s of groupSteps(step.parallelGroup)) {
        if (!done.has(s)) activeSince.set(s, at);
      }
    } else {
      activeSince.set(step.stepNumber, at);
    }
  };
  const nextAfter = (stepNumber: number) => applicable.find((s) => s.stepNumber > stepNumber);

  activate(applicable[0], ticket.createdAt);

  const events = [...ticket.histories].sort(
    (a, b) => a.processedAt.getTime() - b.processedAt.getTime() || a.createdAt.getTime() - b.createdAt.getTime()
  );

  const result: StepDuration[] = [];

  for (const event of events) {
    const at = event.processedAt;

    if (event.processorName.startsWith(RETURN_MARKER)) {
      // Returned to this step: everything from here on has to be redone
      for (const s of [...done]) if (s >= event.stepNumber) done.delete(s);
      activeSince.clear();
      activeSince.set(event.stepNumber, at);
      continue;
    }

    const config = byNumber.get(event.stepNumber);
    if (!config) continue; // step no longer applies to this ticket type

    const startedAt = activeSince.get(event.stepNumber);
    const isAdminSkip = event.processorName.startsWith(ADMIN_SKIP_MARKER);
    if (startedAt && at.getTime() >= startedAt.getTime() && !isAdminSkip) {
      result.push({
        ticketId: ticket.id,
        isLs: ticket.isLs,
        stepNumber: event.stepNumber,
        processorName: event.processorName,
        startedAt,
        completedAt: at,
        durationMs: at.getTime() - startedAt.getTime(),
      });
    }

    activeSince.delete(event.stepNumber);
    done.add(event.stepNumber);

    if (config.isParallel && config.parallelGroup) {
      const group = groupSteps(config.parallelGroup);
      if (group.every((s) => done.has(s))) activate(nextAfter(Math.max(...group)), at);
    } else {
      activate(nextAfter(event.stepNumber), at);
    }
  }

  return result;
}

// Total time from ticket creation until the last step was finished (completed tickets only)
export function computeTicketDuration(ticket: DurationTicket): TicketDuration | null {
  if (ticket.status !== 'completed') return null;
  const finished = ticket.histories.filter((h) => !h.processorName.startsWith(RETURN_MARKER));
  if (finished.length === 0) return null;
  const completedAt = new Date(Math.max(...finished.map((h) => h.processedAt.getTime())));
  const durationMs = completedAt.getTime() - ticket.createdAt.getTime();
  if (durationMs < 0) return null;
  return { ticketId: ticket.id, isLs: ticket.isLs, completedAt, durationMs };
}
