import { Router } from 'express';
import { executeQuery } from '../db/queryHelper';
import { analyzeSupplyChainWithAI, generateFallbackAnalysis } from '../services/geminiService';

const router = Router();

// AI Advisor Endpoint with Thinking Mode & Model Fallbacks
router.post('/ai/advisor', async (req, res) => {
  try {
    const { prompt, contextData, mode, snapshotDate = '2026-08-25' } = req.body;

    // Query latest Position Matrix from MS SQL Server if available
    const posResult = await executeQuery(
      'SELECT Region, FactoryCode, MaterialCode, MaterialName, PIC, SOHQtyKg, DailyStandardUsageKg, DOI_Standard_Days, DOI_Actual_MTD_Days, StockoutDateSOH, EmergencyBufferQtyKg, PO_PendingInboundKg, TotalPipeline_DOI_Days, MaxProtectedDate FROM dbo.fact_Position_Snapshot WHERE SnapshotDate = @SnapshotDate ORDER BY MaterialCode, FactoryCode',
      { SnapshotDate: snapshotDate }
    );
    const positionSnapshotData = posResult.success && posResult.data.length > 0 ? posResult.data : null;

    try {
      const responseText = await analyzeSupplyChainWithAI(
        prompt,
        contextData,
        mode,
        snapshotDate,
        positionSnapshotData
      );
      res.json({ success: true, text: responseText });
    } catch (aiErr: any) {
      console.warn('[AI Advisor] Service error, returning fallback...', aiErr.message || aiErr);
      res.json({
        success: true,
        text: generateFallbackAnalysis(mode, contextData),
        isFallback: true,
        error: aiErr.message,
      });
    }
  } catch (error: any) {
    console.error('Error in /api/ai/advisor:', error);
    res.status(500).json({
      error: error.message || 'Lỗi xử lý Gemini AI',
      fallbackAnswer: generateFallbackAnalysis(req.body?.mode, req.body?.contextData),
    });
  }
});

export default router;
