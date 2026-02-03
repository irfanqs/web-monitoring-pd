import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [total, pending, inProgress, completed] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'pending' } }),
      prisma.ticket.count({ where: { status: 'in_progress' } }),
      prisma.ticket.count({ where: { status: 'completed' } }),
    ]);

    const recentTickets = await prisma.ticket.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { name: true } } },
    });

    res.json({
      total,
      pending,
      inProgress,
      completed,
      recentTickets,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get step configurations
router.get('/steps', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const steps = await prisma.stepConfiguration.findMany({
      orderBy: { stepNumber: 'asc' },
    });
    res.json(steps);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch steps' });
  }
});

export { router as dashboardRouter };
