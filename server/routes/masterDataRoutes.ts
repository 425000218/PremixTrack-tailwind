import { Router } from 'express';
import { executeQuery } from '../db/queryHelper';

const router = Router();

// Master Data: Materials (dim_Material)
router.get('/masterdata/materials', async (req, res) => {
  const result = await executeQuery('SELECT * FROM dbo.dim_Material ORDER BY MaterialCode');
  if (result.success && result.data.length > 0) {
    return res.json({ success: true, source: 'MSSQL', data: result.data });
  }
  res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
});

// Master Data: Factories (dim_Factory)
router.get('/masterdata/factories', async (req, res) => {
  const result = await executeQuery('SELECT * FROM dbo.dim_Factory ORDER BY FactoryID');
  if (result.success && result.data.length > 0) {
    return res.json({ success: true, source: 'MSSQL', data: result.data });
  }
  res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
});

export default router;
