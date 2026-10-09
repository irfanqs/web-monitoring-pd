import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { computeStepDurations, computeTicketDuration, DurationTicket } from '../lib/stepDurations';

const router = Router();

const summarize = (values: number[]) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return {
    count: sorted.length,
    averageMs: Math.round(sorted.reduce((sum, v) => sum + v, 0) / sorted.length),
    medianMs: sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2),
    minMs: sorted[0],
    maxMs: sorted[sorted.length - 1],
  };
};

// Average working time per step (Supervisor only)
// Query: year (e.g. 2026, by completion date), type = all | ls | nonls
router.get('/step-durations', authenticate, requireRole('supervisor'), async (req: AuthRequest, res: Response) => {
  try {
    const year = req.query.year ? parseInt(String(req.query.year), 10) : new Date().getFullYear();
    const type = String(req.query.type || 'all');
    if (isNaN(year)) {
      return res.status(400).json({ error: 'Tahun tidak valid' });
    }

    const [stepConfigs, tickets] = await Promise.all([
      prisma.stepConfiguration.findMany({ orderBy: { stepNumber: 'asc' } }),
      prisma.ticket.findMany({
        where: type === 'ls' ? { isLs: true } : type === 'nonls' ? { isLs: false } : {},
        select: {
          id: true,
          isLs: true,
          status: true,
          createdAt: true,
          histories: {
            select: { stepNumber: true, processorName: true, processedAt: true, createdAt: true },
          },
        },
      }),
    ]);

    const inYear = (d: Date) => d.getFullYear() === year;
    const years = new Set<number>([new Date().getFullYear()]);
    const perStep = new Map<number, number[]>();
    const totals: number[] = [];

    for (const ticket of tickets as DurationTicket[]) {
      for (const d of computeStepDurations(ticket, stepConfigs)) {
        years.add(d.completedAt.getFullYear());
        if (!inYear(d.completedAt)) continue;
        if (!perStep.has(d.stepNumber)) perStep.set(d.stepNumber, []);
        perStep.get(d.stepNumber)!.push(d.durationMs);
      }
      const total = computeTicketDuration(ticket);
      if (total && inYear(total.completedAt)) totals.push(total.durationMs);
    }

    const steps = stepConfigs
      .filter((s) => (type === 'ls' ? !s.isNonLsOnly : type === 'nonls' ? !s.isLsOnly : true))
      .map((s) => ({
        stepNumber: s.stepNumber,
        stepName: s.stepName,
        requiredEmployeeRole: s.requiredEmployeeRole,
        isLsOnly: s.isLsOnly,
        isNonLsOnly: s.isNonLsOnly,
        isParallel: s.isParallel,
        summary: summarize(perStep.get(s.stepNumber) || []),
      }));

    res.json({
      year,
      type,
      availableYears: [...years].sort((a, b) => b - a),
      steps,
      total: summarize(totals),
    });
  } catch (error) {
    console.error('Step duration stats error:', error);
    res.status(500).json({ error: 'Failed to compute step durations' });
  }
});

export { router as statsRouter };
