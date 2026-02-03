import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all users (Admin only)
router.get('/', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        systemRole: true,
        employeeRole: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user (Admin only)
router.post('/', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { email, username, password, name, systemRole, employeeRole } = req.body;
    
    // Support both 'email' and 'username' fields for backward compatibility
    const usernameValue = username || email;
    
    if (!usernameValue || !password || !name) {
      return res.status(400).json({ error: 'Username, password, dan name harus diisi' });
    }

    const existingUser = await prisma.user.findUnique({ where: { username: usernameValue } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: usernameValue,
        password: hashedPassword,
        name,
        systemRole,
        employeeRole: systemRole === 'employee' ? employeeRole : null,
      },
      select: {
        id: true,
        username: true,
        name: true,
        systemRole: true,
        employeeRole: true,
        createdAt: true,
      },
    });
    res.status(201).json(user);
  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(500).json({ error: error.message || 'Failed to create user' });
  }
});

// Update user (Admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { email, username, password, name, systemRole, employeeRole } = req.body;
    
    // Support both 'email' and 'username' fields for backward compatibility
    const usernameValue = username || email;

    const updateData: any = { username: usernameValue, name, systemRole };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    updateData.employeeRole = systemRole === 'employee' ? employeeRole : null;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        systemRole: true,
        employeeRole: true,
        createdAt: true,
      },
    });
    res.json(user);
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export { router as userRouter };
