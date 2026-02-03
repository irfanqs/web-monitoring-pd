import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import path from 'path';

const router = Router();

// Helper function to get step configurations
async function getStepConfigs(isLs: boolean) {
  const allSteps = await prisma.stepConfiguration.findMany({
    orderBy: { stepNumber: 'asc' },
  });
  
  // Filter steps based on LS/Non-LS
  return allSteps.filter(step => {
    if (isLs) {
      return !step.isNonLsOnly; // Include all except Non-LS only
    } else {
      return !step.isLsOnly; // Include all except LS only
    }
  });
}

// Helper to get parallel steps from config
async function getParallelSteps(parallelGroup: string) {
  const steps = await prisma.stepConfiguration.findMany({
    where: { parallelGroup, isParallel: true },
    orderBy: { stepNumber: 'asc' },
  });
  return steps.map(s => s.stepNumber);
}

// Helper to get max step number
async function getMaxStep(isLs: boolean) {
  const steps = await getStepConfigs(isLs);
  return Math.max(...steps.map(s => s.stepNumber));
}

// Get all tickets
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        createdBy: { select: { id: true, name: true } },
        assignedPpdUser1: { select: { id: true, name: true } },
        assignedPpdUser2: { select: { id: true, name: true } },
        histories: {
          include: { processedBy: { select: { id: true, name: true } } },
          orderBy: { stepNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get my tasks (for employees)
router.get('/my-tasks', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.systemRole !== 'employee' || !req.user.employeeRole) {
      return res.status(403).json({ error: 'Only employees can access this' });
    }

    const stepConfigs = await prisma.stepConfiguration.findMany({
      where: { requiredEmployeeRole: req.user.employeeRole as any },
    });
    const stepNumbers = stepConfigs.map((s: { stepNumber: number }) => s.stepNumber);

    // Get parallel groups that user's steps belong to
    const userParallelGroups = stepConfigs
      .filter(s => s.isParallel && s.parallelGroup)
      .map(s => s.parallelGroup);

    // Get all tickets where user can work on their assigned steps
    const allTickets = await prisma.ticket.findMany({
      where: {
        status: { not: 'completed' },
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignedPpdUser1: { select: { id: true, name: true } },
        assignedPpdUser2: { select: { id: true, name: true } },
        histories: {
          include: { processedBy: { select: { id: true, name: true } } },
          orderBy: { stepNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter tickets based on workflow logic
    const filteredTickets = await Promise.all(allTickets.map(async ticket => {
      // Get applicable steps for this ticket
      const applicableSteps = await getStepConfigs(ticket.isLs);
      const applicableStepNumbers = applicableSteps.map(s => s.stepNumber);
      
      // Get current step config
      const currentStepConfig = applicableSteps.find(s => s.stepNumber === ticket.currentStep);
      
      // Check if current step is parallel
      if (currentStepConfig?.isParallel && currentStepConfig.parallelGroup) {
        // Get all parallel steps in this group
        const parallelSteps = await getParallelSteps(currentStepConfig.parallelGroup);
        const completedSteps = ticket.histories.map(h => h.stepNumber);
        
        // Check if any of user's steps in this parallel group are not yet completed
        const userParallelSteps = stepNumbers.filter(s => parallelSteps.includes(s));
        if (userParallelSteps.some(s => !completedSteps.includes(s))) {
          return ticket;
        }
      }
      
      // Normal sequential flow - check if user's step matches current step
      if (stepNumbers.includes(ticket.currentStep) && applicableStepNumbers.includes(ticket.currentStep)) {
        // Special check for step 12 (PPD) - only show to assigned users
        if (ticket.currentStep === 12 && (ticket.assignedPpdUserId1 || ticket.assignedPpdUserId2)) {
          if (ticket.assignedPpdUserId1 === req.user!.id || ticket.assignedPpdUserId2 === req.user!.id) {
            return ticket;
          }
          // If step 12 is assigned to specific users, don't show to other PPD users
          return null;
        }
        
        return ticket;
      }
      
      return null;
    }));

    res.json(filteredTickets.filter(t => t !== null));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get my history (for employees) - tickets where user has processed at least one step
router.get('/my-history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.systemRole !== 'employee') {
      return res.status(403).json({ error: 'Only employees can access this' });
    }

    // Get all tickets where the user has processed at least one step
    const tickets = await prisma.ticket.findMany({
      where: {
        histories: {
          some: {
            processedById: req.user.id
          }
        }
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignedPpdUser1: { select: { id: true, name: true } },
        assignedPpdUser2: { select: { id: true, name: true } },
        histories: {
          include: { processedBy: { select: { id: true, name: true } } },
          orderBy: { stepNumber: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(tickets);
  } catch (error) {
    console.error('Failed to fetch history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});


// Get single ticket
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignedPpdUser1: { select: { id: true, name: true } },
        assignedPpdUser2: { select: { id: true, name: true } },
        histories: {
          include: { processedBy: { select: { id: true, name: true } } },
          orderBy: { stepNumber: 'asc' },
        },
      },
    });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Create ticket (Admin only)
router.post('/', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { activityName, assignmentLetterNumber, uraian, isLs, startDate, assignedPpdUserId1, assignedPpdUserId2 } = req.body;

    // Use startDate year for ticket number, default to current date if not provided
    const ticketStartDate = startDate ? new Date(startDate) : new Date();
    const year = ticketStartDate.getFullYear();
    
    // Get the highest ticket number for that year
    const latestTicket = await prisma.ticket.findFirst({
      where: {
        ticketNumber: {
          startsWith: `PD-${year}`,
        },
      },
      orderBy: { ticketNumber: 'desc' },
    });
    
    let nextNumber = 1;
    if (latestTicket) {
      // Extract number from ticket like "PD-202611" -> 11
      const match = latestTicket.ticketNumber.match(/PD-\d{4}(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    const ticketNumber = `PD-${year}${String(nextNumber).padStart(2, '0')}`;

    // Get first step based on LS/Non-LS from step configuration
    const applicableSteps = await getStepConfigs(isLs || false);
    const startStep = applicableSteps.length > 0 ? applicableSteps[0].stepNumber : 1;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        activityName,
        assignmentLetterNumber,
        uraian: uraian || null,
        startDate: ticketStartDate,
        isLs: isLs || false,
        currentStep: startStep,
        assignedPpdUserId1: assignedPpdUserId1 || null,
        assignedPpdUserId2: assignedPpdUserId2 || null,
        createdById: req.user!.id,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Process ticket (upload file and move to next step)
router.post('/:id/process', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: { histories: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status === 'completed') {
      return res.status(400).json({ error: 'Ticket already completed' });
    }

    const { notes, stepNumber: requestedStep } = req.body;
    const stepToProcess = requestedStep ? parseInt(requestedStep) : ticket.currentStep;

    // Check if user has permission for this step
    const stepConfig = await prisma.stepConfiguration.findUnique({
      where: { stepNumber: stepToProcess },
    });

    if (!stepConfig || stepConfig.requiredEmployeeRole !== req.user?.employeeRole) {
      return res.status(403).json({ error: 'You are not authorized for this step' });
    }

    // Special check for step 12 (PPD) - only assigned user can process
    if (stepToProcess === 12 && ((ticket as any).assignedPpdUserId1 || (ticket as any).assignedPpdUserId2)) {
      if ((ticket as any).assignedPpdUserId1 !== req.user!.id && (ticket as any).assignedPpdUserId2 !== req.user!.id) {
        return res.status(403).json({ error: 'This ticket is assigned to another PPD user' });
      }
    }

    // Check if this is a parallel step
    const isParallelStep = stepConfig.isParallel && stepConfig.parallelGroup;
    let parallelStepNumbers: number[] = [];
    
    if (isParallelStep && stepConfig.parallelGroup) {
      parallelStepNumbers = await getParallelSteps(stepConfig.parallelGroup);
    }

    // Check if step was already processed
    const existingHistory = ticket.histories.find(h => h.stepNumber === stepToProcess);
    if (existingHistory) {
      return res.status(400).json({ error: 'This step has already been processed' });
    }

    // File is optional for parallel steps
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const fileName = req.file ? req.file.originalname : null;

    // Create history
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        stepNumber: stepToProcess,
        processedById: req.user!.id,
        processorName: req.user!.name,
        fileUrl,
        fileName,
        notes,
        processedAt: new Date(),
      },
    });

    // Determine next step
    let nextStep = ticket.currentStep;
    let newStatus: 'pending' | 'in_progress' | 'completed' = ticket.status as any;

    // Get applicable steps for this ticket type
    const applicableSteps = await getStepConfigs(ticket.isLs);
    const maxStep = await getMaxStep(ticket.isLs);

    if (isParallelStep && parallelStepNumbers.length > 0) {
      // For parallel steps, check if all parallel steps in the group are completed
      const completedParallelSteps = await prisma.ticketHistory.count({
        where: {
          ticketId: ticket.id,
          stepNumber: { in: parallelStepNumbers },
        },
      });

      // If all parallel steps are done, move to next non-parallel step
      if (completedParallelSteps >= parallelStepNumbers.length) {
        const maxParallelStep = Math.max(...parallelStepNumbers);
        // Find next step after parallel group
        const nextStepConfig = applicableSteps.find(s => s.stepNumber > maxParallelStep);
        nextStep = nextStepConfig ? nextStepConfig.stepNumber : maxStep + 1;
        newStatus = 'in_progress';
      }
    } else {
      // Normal sequential flow - find next applicable step
      const currentIndex = applicableSteps.findIndex(s => s.stepNumber === stepToProcess);
      if (currentIndex >= 0 && currentIndex < applicableSteps.length - 1) {
        nextStep = applicableSteps[currentIndex + 1].stepNumber;
        newStatus = 'in_progress';
      } else {
        // No more steps
        nextStep = maxStep + 1;
        newStatus = 'completed';
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        currentStep: nextStep,
        status: newStatus,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        histories: {
          include: { processedBy: { select: { id: true, name: true } } },
          orderBy: { stepNumber: 'asc' },
        },
      },
    });

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process ticket' });
  }
});

// Get files for a ticket
router.get('/:id/files', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const histories = await prisma.ticketHistory.findMany({
      where: { ticketId: req.params.id },
      select: {
        id: true,
        stepNumber: true,
        fileUrl: true,
        fileName: true,
        processorName: true,
        processedAt: true,
      },
      orderBy: { stepNumber: 'asc' },
    });
    res.json(histories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Download file
router.get('/:id/files/:historyId/download', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const history = await prisma.ticketHistory.findUnique({
      where: { id: req.params.historyId },
    });

    if (!history || !history.fileUrl) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(process.cwd(), history.fileUrl);
    res.download(filePath, history.fileName || 'file');
  } catch (error) {
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Delete ticket (Admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Delete ticket (histories will be cascade deleted due to schema)
    await prisma.ticket.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

// Admin skip step (for debugging)
router.post('/:id/admin-skip', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: { histories: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status === 'completed') {
      return res.status(400).json({ error: 'Ticket already completed' });
    }

    const { stepNumber } = req.body;
    const stepToProcess = stepNumber ? parseInt(stepNumber) : ticket.currentStep;

    // Check if step already processed
    const existingHistory = ticket.histories.find(h => h.stepNumber === stepToProcess);
    if (existingHistory) {
      return res.status(400).json({ error: 'This step has already been processed' });
    }

    // Get step config
    const stepConfig = await prisma.stepConfiguration.findUnique({
      where: { stepNumber: stepToProcess },
    });

    // Create history with admin as processor
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        stepNumber: stepToProcess,
        processedById: req.user!.id,
        processorName: `[DEBUG] ${req.user!.name}`,
        fileUrl: null,
        fileName: null,
        notes: '[Admin Skip]',
        processedAt: new Date(),
      },
    });

    // Determine next step using dynamic config
    let nextStep = ticket.currentStep;
    let newStatus: 'pending' | 'in_progress' | 'completed' = ticket.status as any;

    const applicableSteps = await getStepConfigs(ticket.isLs);
    const maxStep = await getMaxStep(ticket.isLs);

    const isParallelStep = stepConfig?.isParallel && stepConfig.parallelGroup;
    let parallelStepNumbers: number[] = [];
    
    if (isParallelStep && stepConfig?.parallelGroup) {
      parallelStepNumbers = await getParallelSteps(stepConfig.parallelGroup);
    }

    if (isParallelStep && parallelStepNumbers.length > 0) {
      const completedParallelSteps = await prisma.ticketHistory.count({
        where: {
          ticketId: ticket.id,
          stepNumber: { in: parallelStepNumbers },
        },
      });

      if (completedParallelSteps >= parallelStepNumbers.length) {
        const maxParallelStep = Math.max(...parallelStepNumbers);
        const nextStepConfig = applicableSteps.find(s => s.stepNumber > maxParallelStep);
        nextStep = nextStepConfig ? nextStepConfig.stepNumber : maxStep + 1;
        newStatus = 'in_progress';
      }
    } else {
      // Normal sequential flow
      const currentIndex = applicableSteps.findIndex(s => s.stepNumber === stepToProcess);
      if (currentIndex >= 0 && currentIndex < applicableSteps.length - 1) {
        nextStep = applicableSteps[currentIndex + 1].stepNumber;
        newStatus = 'in_progress';
      } else {
        nextStep = maxStep + 1;
        newStatus = 'completed';
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        currentStep: nextStep,
        status: newStatus,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        histories: {
          include: { processedBy: { select: { id: true, name: true } } },
          orderBy: { stepNumber: 'asc' },
        },
      },
    });

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to skip step' });
  }
});

// Return ticket to previous step (untuk koreksi)
router.post('/:id/return-to-previous', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: { 
        histories: {
          orderBy: { stepNumber: 'desc' },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.currentStep === 1) {
      return res.status(400).json({ error: 'Cannot return from step 1' });
    }

    const { returnNotes } = req.body;
    
    if (!returnNotes || returnNotes.trim() === '') {
      return res.status(400).json({ error: 'Catatan alasan pengembalian wajib diisi' });
    }

    // Get applicable steps for this ticket type
    const applicableSteps = await getStepConfigs(ticket.isLs);

    // Find previous step in the applicable steps
    const currentIndex = applicableSteps.findIndex(s => s.stepNumber === ticket.currentStep);
    let previousStep = 1;

    if (currentIndex > 0) {
      previousStep = applicableSteps[currentIndex - 1].stepNumber;
    }

    // Delete the most recent history entry (the one being returned)
    const lastHistory = ticket.histories[0]; // Already sorted desc
    if (lastHistory) {
      await prisma.ticketHistory.delete({
        where: { id: lastHistory.id },
      });
    }

    // Create return history entry with note at the PREVIOUS step
    // So the person who will redo the step can see the return reason
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        stepNumber: previousStep, // Save at previous step, not current step
        processedById: req.user!.id,
        processorName: req.user!.name,
        notes: `[DIKEMBALIKAN DARI STEP ${ticket.currentStep}] ${returnNotes}`,
        processedAt: new Date(),
      },
    });

    // Update ticket to previous step
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        currentStep: previousStep,
        status: 'in_progress',
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignedPpdUser1: { select: { id: true, name: true } },
        assignedPpdUser2: { select: { id: true, name: true } },
        histories: {
          include: { processedBy: { select: { id: true, name: true } } },
          orderBy: { stepNumber: 'asc' },
        },
      },
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error('Return to previous error:', error);
    res.status(500).json({ error: 'Failed to return ticket to previous step' });
  }
});

export { router as ticketRouter };
