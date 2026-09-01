import { Router } from 'express';
import { executeQuery } from '../db/queryHelper';

const router = Router();

// ============================================================================
// 1. FORECAST: ALL DATA (GET /api/forecast/all)
// ============================================================================
router.get('/forecast/all', async (req, res) => {
  try {
    const [versRes, detsRes] = await Promise.all([
      executeQuery('SELECT * FROM dbo.fact_Forecast_Version ORDER BY RunDate DESC'),
      executeQuery('SELECT * FROM dbo.fact_Forecast_Detail ORDER BY RunDate DESC, SiteCode, MaterialCode'),
    ]);

    return res.json({
      success: true,
      source: versRes.success ? 'MSSQL' : 'FALLBACK_LOCAL',
      data: {
        versions: (versRes.data || []).map((v: any) => ({
          VersionID: v.VersionID,
          VersionName: v.VersionName,
          RunDate: v.RunDate ? v.RunDate.toISOString().split('T')[0] : '',
          TotalSKUs: v.SKUCount || 0,
          TotalVolumeKg: v.TotalForecastQty || 0,
          Status: 'Active',
          IsActive: true,
          Notes: v.Notes || '',
          CreatedAt: v.UploadedAt ? v.UploadedAt.toISOString() : new Date().toISOString(),
        })),
        details: (detsRes.data || []).map((d: any) => ({
          DetailID: d.DetailID,
          VersionID: d.VersionID,
          RunDate: d.RunDate ? d.RunDate.toISOString().split('T')[0] : '',
          SiteCode: d.SiteCode,
          FactoryCode: d.FactoryCode || d.SiteCode,
          PlantName: d.PlantName,
          MaterialCode: d.MaterialCode,
          MaterialName: d.MaterialName,
          Division: d.Division || 'Livestock',
          ForecastQtyKg: d.ForecastQtyKg || 0,
        })),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// 2. FORECAST: VERSIONS (fact_Forecast_Version)
// ============================================================================
router.get('/forecast/versions', async (req, res) => {
  const result = await executeQuery('SELECT * FROM dbo.fact_Forecast_Version ORDER BY RunDate DESC');
  return res.json({
    success: true,
    source: result.success ? 'MSSQL' : 'FALLBACK_LOCAL',
    data: result.data || [],
  });
});

// ============================================================================
// 3. FORECAST: DETAILS (fact_Forecast_Detail)
// ============================================================================
router.get('/forecast/details', async (req, res) => {
  const { versionId } = req.query;
  let query = 'SELECT * FROM dbo.fact_Forecast_Detail';
  const params: Record<string, any> = {};

  if (versionId) {
    query += ' WHERE VersionID = @versionId';
    params.versionId = versionId;
  }
  query += ' ORDER BY RunDate DESC, SiteCode, MaterialCode';

  const result = await executeQuery(query, params);
  return res.json({
    success: true,
    source: result.success ? 'MSSQL' : 'FALLBACK_LOCAL',
    data: result.data || [],
  });
});

// ============================================================================
// 4. FORECAST: BULK INSERT / STAGING COMMIT
// ============================================================================
router.post('/forecast/bulk', async (req, res) => {
  try {
    const { versions, details } = req.body;

    if (!Array.isArray(details) || details.length === 0) {
      return res.status(400).json({ success: false, message: 'Dữ liệu details trống.' });
    }

    // Save versions
    if (Array.isArray(versions)) {
      for (const v of versions) {
        await executeQuery(`
          MERGE INTO dbo.fact_Forecast_Version AS Target
          USING (VALUES (@VersionID, @RunDate, @VersionName, @TotalForecastQty, @SKUCount, @PlantCount, @UploadedBy, @Notes))
          AS Source (VersionID, RunDate, VersionName, TotalForecastQty, SKUCount, PlantCount, UploadedBy, Notes)
          ON Target.VersionID = Source.VersionID
          WHEN MATCHED THEN
            UPDATE SET 
              VersionName = Source.VersionName,
              TotalForecastQty = Source.TotalForecastQty,
              SKUCount = Source.SKUCount,
              PlantCount = Source.PlantCount,
              UploadedAt = SYSDATETIME(),
              Notes = Source.Notes
          WHEN NOT MATCHED THEN
            INSERT (VersionID, RunDate, VersionName, TotalForecastQty, SKUCount, PlantCount, UploadedAt, UploadedBy, Notes)
            VALUES (Source.VersionID, Source.RunDate, Source.VersionName, Source.TotalForecastQty, Source.SKUCount, Source.PlantCount, SYSDATETIME(), Source.UploadedBy, Source.Notes);
        `, {
          VersionID: v.VersionID || `FC-${v.RunDate}`,
          RunDate: v.RunDate,
          VersionName: v.VersionName || `Đợt Forecast ${v.RunDate}`,
          TotalForecastQty: v.TotalVolumeKg || v.TotalForecastQty || 0,
          SKUCount: v.TotalSKUs || v.SKUCount || 0,
          PlantCount: v.PlantCount || 22,
          UploadedBy: 'User',
          Notes: v.Notes || '',
        });
      }
    }

    // Delete existing details for these versions and re-insert
    const versionIds = [...new Set(details.map((d: any) => d.VersionID || `FC-${d.RunDate}`))];
    for (const vId of versionIds) {
      await executeQuery('DELETE FROM dbo.fact_Forecast_Detail WHERE VersionID = @vId', { vId });
    }

    // Batch insert details (in chunks of 100)
    const chunkSize = 100;
    for (let i = 0; i < details.length; i += chunkSize) {
      const chunk = details.slice(i, i + chunkSize);
      let valuesSql = '';
      const params: Record<string, any> = {};

      chunk.forEach((d: any, idx: number) => {
        const vId = `v_${idx}`;
        const rDate = `rd_${idx}`;
        const sCode = `sc_${idx}`;
        const fCode = `fc_${idx}`;
        const pName = `pn_${idx}`;
        const mCode = `mc_${idx}`;
        const mName = `mn_${idx}`;
        const div = `div_${idx}`;
        const qty = `qty_${idx}`;

        params[vId] = d.VersionID || `FC-${d.RunDate}`;
        params[rDate] = d.RunDate;
        params[sCode] = d.SiteCode || d.FactoryCode || 'DBD';
        params[fCode] = d.FactoryCode || d.SiteCode || 'DBD';
        params[pName] = d.PlantName || d.FactoryName || d.SiteCode;
        params[mCode] = d.MaterialCode;
        params[mName] = d.MaterialName || d.MaterialCode;
        params[div] = d.Division || 'Livestock';
        params[qty] = d.ForecastQtyKg || 0;

        valuesSql += (idx > 0 ? ',' : '') + `(@${vId}, @${rDate}, @${sCode}, @${fCode}, @${pName}, @${mCode}, @${mName}, @${div}, @${qty})`;
      });

      const insertSql = `
        INSERT INTO dbo.fact_Forecast_Detail (VersionID, RunDate, SiteCode, FactoryCode, PlantName, MaterialCode, MaterialName, Division, ForecastQtyKg)
        VALUES ${valuesSql};
      `;
      await executeQuery(insertSql, params);
    }

    return res.json({ success: true, message: `Đã lưu thành công ${details.length} dòng Forecast vào SQL Server.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// 5. FORECAST: DELETE VERSION
// ============================================================================
router.delete('/forecast/versions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM dbo.fact_Forecast_Detail WHERE VersionID = @id', { id });
    const result = await executeQuery('DELETE FROM dbo.fact_Forecast_Version WHERE VersionID = @id', { id });
    return res.json({ success: result.success, message: result.success ? 'Đã xóa đợt Forecast.' : result.error });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// 6. FORECAST: VOLATILITY COMPARISON (sp_Calculate_Forecast_Volatility)
// ============================================================================
router.get('/forecast/compare', async (req, res) => {
  try {
    const { targetDate, baseDate, division, pic, siteCode } = req.query;
    if (!targetDate || !baseDate) {
      return res.status(400).json({ success: false, message: 'targetDate và baseDate là bắt buộc.' });
    }

    const query = `
      EXEC dbo.sp_Calculate_Forecast_Volatility 
        @TargetDate = @targetDate, 
        @BaseDate = @baseDate, 
        @Division = @division, 
        @PIC = @pic, 
        @SiteCode = @siteCode;
    `;

    const result = await executeQuery(query, {
      targetDate,
      baseDate,
      division: division && division !== 'ALL' ? division : null,
      pic: pic && pic !== 'ALL' ? pic : null,
      siteCode: siteCode && siteCode !== 'ALL' ? siteCode : null,
    });

    return res.json({
      success: true,
      source: result.success ? 'MSSQL' : 'FALLBACK_LOCAL',
      data: result.data || [],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
