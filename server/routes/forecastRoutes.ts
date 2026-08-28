import { Router } from 'express';
import { executeQuery } from '../db/queryHelper';

const router = Router();

// Forecast: Versions (fact_Forecast_Version)
router.get('/forecast/versions', async (req, res) => {
  const result = await executeQuery('SELECT * FROM dbo.fact_Forecast_Version ORDER BY RunDate DESC');
  if (result.success && result.data.length > 0) {
    return res.json({ success: true, source: 'MSSQL', data: result.data });
  }
  res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
});

export default router;
