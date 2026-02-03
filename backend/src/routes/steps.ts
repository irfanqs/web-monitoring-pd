import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all step configurations
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const steps = await prisma.stepConfiguration.findMany({
      orderBy: { stepNumber: 'asc' },
    });
    res.json(steps);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch steps' });
  }
});

// Get single step
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const step = await prisma.stepConfiguration.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }
    res.json(step);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch step' });
  }
});

// Create step (Admin only)
router.post('/', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { stepNumber, stepName, requiredEmployeeRole, description, isLsOnly, isNonLsOnly, isParallel, parallelGroup } = req.body;

    // Check if step number already exists
    const existing = await prisma.stepConfiguration.findUnique({
      where: { stepNumber },
    });
    if (existing) {
      return res.status(400).json({ error: 'Nomor step sudah ada' });
    }

    const step = await prisma.stepConfiguration.create({
      data: {
        stepNumber,
        stepName,
        requiredEmployeeRole,
        description,
        isLsOnly: isLsOnly || false,
        isNonLsOnly: isNonLsOnly || false,
        isParallel: isParallel || false,
        parallelGroup: parallelGroup || null,
      },
    });
    res.status(201).json(step);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal membuat step' });
  }
});

// Update step (Admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { stepNumber, stepName, requiredEmployeeRole, description, isLsOnly, isNonLsOnly, isParallel, parallelGroup } = req.body;

    const step = await prisma.stepConfiguration.update({
      where: { id: parseInt(req.params.id) },
      data: {
        stepNumber,
        stepName,
        requiredEmployeeRole,
        description,
        isLsOnly,
        isNonLsOnly,
        isParallel,
        parallelGroup: parallelGroup || null,
      },
    });
    res.json(step);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengupdate step' });
  }
});

// Delete step (Admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const stepToDelete = await prisma.stepConfiguration.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!stepToDelete) {
      return res.status(404).json({ error: 'Step not found' });
    }

    // Delete the step
    await prisma.stepConfiguration.delete({
      where: { id: parseInt(req.params.id) },
    });

    // Get all remaining steps ordered by stepNumber
    const remainingSteps = await prisma.stepConfiguration.findMany({
      orderBy: { stepNumber: 'asc' },
    });

    // Renumber all steps to be sequential (1, 2, 3, ...)
    // First set to negative to avoid unique constraint
    for (let i = 0; i < remainingSteps.length; i++) {
      await prisma.stepConfiguration.update({
        where: { id: remainingSteps[i].id },
        data: { stepNumber: -(i + 1) },
      });
    }

    // Then set to actual sequential values
    for (let i = 0; i < remainingSteps.length; i++) {
      await prisma.stepConfiguration.update({
        where: { id: remainingSteps[i].id },
        data: { stepNumber: i + 1 },
      });
    }

    res.json({ message: 'Step deleted and renumbered' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete step' });
  }
});

// Reorder steps (Admin only)
router.post('/reorder', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { steps } = req.body; // Array of { id, stepNumber }

    // Use transaction to swap step numbers safely
    // First, set all to negative (temporary) to avoid unique constraint
    for (const step of steps) {
      await prisma.stepConfiguration.update({
        where: { id: step.id },
        data: { stepNumber: -step.stepNumber },
      });
    }

    // Then set to actual values
    for (const step of steps) {
      await prisma.stepConfiguration.update({
        where: { id: step.id },
        data: { stepNumber: step.stepNumber },
      });
    }

    const updatedSteps = await prisma.stepConfiguration.findMany({
      orderBy: { stepNumber: 'asc' },
    });
    res.json(updatedSteps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reorder steps' });
  }
});

// Renumber all steps to be sequential (Admin only)
router.post('/renumber', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const allSteps = await prisma.stepConfiguration.findMany({
      orderBy: { stepNumber: 'asc' },
    });

    // First, set all to negative to avoid unique constraint
    for (let i = 0; i < allSteps.length; i++) {
      await prisma.stepConfiguration.update({
        where: { id: allSteps[i].id },
        data: { stepNumber: -(i + 1) },
      });
    }

    // Then set to actual sequential values
    for (let i = 0; i < allSteps.length; i++) {
      await prisma.stepConfiguration.update({
        where: { id: allSteps[i].id },
        data: { stepNumber: i + 1 },
      });
    }

    const updatedSteps = await prisma.stepConfiguration.findMany({
      orderBy: { stepNumber: 'asc' },
    });
    res.json(updatedSteps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to renumber steps' });
  }
});

export { router as stepsRouter };
