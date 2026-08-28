import { Router } from 'express';
import { executeQuery } from '../db/queryHelper';

const router = Router();

// Purchase Orders: Pending Inbound Pipeline (fact_PO_Detail + fact_Purchase_Order + dim_Supplier)
router.get('/purchase-orders/pending', async (req, res) => {
  const query = `
    SELECT 
      d.PO_Detail_ID,
      h.PONumber,
      d.FactoryID,
      d.MaterialCode,
      m.Name_VN AS MaterialName,
      s.SupplierName,
      h.PurchaserName,
      h.OrderDate,
      h.PaymentTerms,
      d.Incoterm,
      d.OrderedQtyKg,
      d.ReceivedQtyKg,
      d.PendingQtyKg,
      d.UnitPriceVND,
      d.LineAmountVND,
      d.AmountRemainderVND,
      d.PromisedDeliveryDate,
      d.PAGNumber,
      d.LineStatus,
      d.CountryOfOrigin,
      d.Notes
    FROM dbo.fact_PO_Detail d
    LEFT JOIN dbo.fact_Purchase_Order h ON d.PO_Header_ID = h.PO_Header_ID
    LEFT JOIN dbo.dim_Supplier s ON h.SupplierCode = s.SupplierCode
    LEFT JOIN dbo.dim_Material m ON d.MaterialCode = m.MaterialCode
    ORDER BY d.PromisedDeliveryDate ASC, d.PendingQtyKg DESC
  `;
  const result = await executeQuery(query);
  if (result.success && result.data.length > 0) {
    return res.json({ success: true, source: 'MSSQL', data: result.data });
  }
  res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
});

export default router;
