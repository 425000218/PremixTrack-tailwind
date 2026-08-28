import { Router } from 'express';
import { getDbStatus, getDbPool } from '../db/connection';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PremixTrack Enterprise API',
    timestamp: new Date().toISOString(),
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
});

router.get('/db/status', async (req, res) => {
  try {
    await getDbPool();
    res.json(getDbStatus());
  } catch (err: any) {
    res.status(500).json({ success: false, connected: false, error: err.message });
  }
});

export default router;
