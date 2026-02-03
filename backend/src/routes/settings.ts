import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { Response } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Get all settings
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.appSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    res.json(settingsMap);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get single setting
router.get('/:key', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: req.params.key }
    });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Update or create setting (admin only)
router.put('/:key', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { value } = req.body;
    const setting = await prisma.appSetting.upsert({
      where: { key: req.params.key },
      update: { value },
      create: { key: req.params.key, value }
    });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Bulk update settings (admin only)
router.post('/bulk', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const settings = req.body as Record<string, string>;
    const results = await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.appSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        })
      )
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
