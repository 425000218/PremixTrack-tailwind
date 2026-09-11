import { Router } from 'express';
import { getDbStatus, getDbPool } from '../db/connection';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
  });
});

router.get('/db/status', async (req, res) => {
  try {
    await getDbPool();
    res.json(getDbStatus());
  } catch (err: any) {
    res.status(500).json({ isOnline: false });
  }
});

export default router;
