import { Router } from 'express';
import { executeQuery } from '../db/queryHelper';

const router = Router();

// ============================================================================
// 1. PURCHASE ORDERS: ALL DATA (GET /api/purchase-orders/all)
// ============================================================================
router.get('/purchase-orders/all', async (req, res) => {
  try {
    const [headersRes, detailsRes] = await Promise.all([
      executeQuery('SELECT * FROM dbo.fact_Purchase_Order ORDER BY OrderDate DESC'),
      executeQuery('SELECT * FROM dbo.fact_PO_Detail ORDER BY PromisedDeliveryDate ASC'),
    ]);

    return res.json({
      success: true,
      source: headersRes.success ? 'MSSQL' : 'FALLBACK_LOCAL',
      data: {
        headers: (headersRes.data || []).map((h: any) => ({
          PO_Header_ID: h.PO_Header_ID,
          PONumber: h.PONumber,
          SupplierID: h.SupplierID,
          SupplierCode: h.SupplierCode,
          SupplierName: h.SupplierName,
          OrderDate: h.OrderDate ? h.OrderDate.toISOString().split('T')[0] : '',
          TotalAmountUSD: h.TotalAmountUSD || 0,
          TotalAmountVND: h.TotalAmountVND || 0,
          PaymentTerms: h.PaymentTerms || 'Net 30',
          Incoterm: h.Incoterm || 'DDP',
          PurchaserName: h.PurchaserName || 'Purchaser',
          ContractNumber: h.ContractNumber || '',
          Status: h.Status || 'Open',
        })),
        details: (detailsRes.data || []).map((d: any) => ({
          PO_Detail_ID: d.PO_Detail_ID,
          PO_Header_ID: d.PO_Header_ID,
          PONumber: d.PONumber,
          FactoryID: d.FactoryID,
          FactoryCode: d.FactoryCode || d.FactoryID,
          MaterialID: d.MaterialID,
          MaterialCode: d.MaterialCode,
          MaterialName: d.MaterialName,
          OrderedQtyKg: d.OrderedQtyKg || 0,
          ReceivedQtyKg: d.ReceivedQtyKg || 0,
          PendingQtyKg: d.PendingQtyKg || 0,
          UnitPriceUSD: d.UnitPriceUSD || 0,
          UnitPriceVND: d.UnitPriceVND || 0,
          LineAmountVND: d.LineAmountVND || 0,
          AmountRemainderVND: d.AmountRemainderVND || 0,
          DeliveryDate: d.DeliveryDate ? d.DeliveryDate.toISOString().split('T')[0] : '',
          PromisedDeliveryDate: d.PromisedDeliveryDate ? d.PromisedDeliveryDate.toISOString().split('T')[0] : '',
          LineStatus: d.LineStatus || 'Open',
          TaxGroup: d.TaxGroup || 'NonVAT',
          Incoterm: d.Incoterm || 'DDP',
          CountryOfOrigin: d.CountryOfOrigin || 'Vietnam',
          Notes: d.Notes || '',
          PAGNumber: d.PAGNumber || '',
          SupplierName: d.SupplierName || '',
        })),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// 2. PURCHASE ORDERS: PENDING INBOUND PIPELINE
// ============================================================================
router.get('/purchase-orders/pending', async (req, res) => {
  const query = `
    SELECT 
      d.PO_Detail_ID,
      d.PO_Header_ID,
      d.PONumber,
      d.FactoryID,
      d.MaterialCode,
      d.MaterialName,
      d.SupplierName,
      d.OrderedQtyKg,
      d.ReceivedQtyKg,
      d.PendingQtyKg,
      d.UnitPriceVND,
      d.LineAmountVND,
      d.AmountRemainderVND,
      d.PromisedDeliveryDate,
      d.PAGNumber,
      d.LineStatus,
      d.Incoterm,
      d.CountryOfOrigin,
      d.Notes
    FROM dbo.fact_PO_Detail d
    WHERE d.PendingQtyKg > 0
    ORDER BY d.PromisedDeliveryDate ASC, d.PendingQtyKg DESC
  `;
  const result = await executeQuery(query);
  return res.json({
    success: true,
    source: result.success ? 'MSSQL' : 'FALLBACK_LOCAL',
    data: result.data || [],
  });
});

// ============================================================================
// 3. PURCHASE ORDERS: BULK INSERT (fact_Purchase_Order + fact_PO_Detail)
// ============================================================================
router.post('/purchase-orders/bulk', async (req, res) => {
  try {
    const { headers, details } = req.body;

    if (!Array.isArray(details) || details.length === 0) {
      return res.status(400).json({ success: false, message: 'Dữ liệu đơn hàng trống.' });
    }

    if (Array.isArray(headers)) {
      for (const h of headers) {
        await executeQuery(`
          MERGE INTO dbo.fact_Purchase_Order AS Target
          USING (VALUES (@PO_Header_ID, @PONumber, @SupplierID, @SupplierCode, @OrderDate, @TotalAmountUSD, @TotalAmountVND, @PaymentTerms, @Incoterm, @PurchaserName, @ContractNumber, @Status))
          AS Source (PO_Header_ID, PONumber, SupplierID, SupplierCode, OrderDate, TotalAmountUSD, TotalAmountVND, PaymentTerms, Incoterm, PurchaserName, ContractNumber, Status)
          ON Target.PONumber = Source.PONumber
          WHEN MATCHED THEN
            UPDATE SET 
              OrderDate = Source.OrderDate,
              TotalAmountUSD = Source.TotalAmountUSD,
              TotalAmountVND = Source.TotalAmountVND,
              PaymentTerms = Source.PaymentTerms,
              Incoterm = Source.Incoterm,
              PurchaserName = Source.PurchaserName,
              Status = Source.Status
          WHEN NOT MATCHED THEN
            INSERT (PO_Header_ID, PONumber, SupplierID, SupplierCode, OrderDate, TotalAmountUSD, TotalAmountVND, PaymentTerms, Incoterm, PurchaserName, ContractNumber, Status)
            VALUES (Source.PO_Header_ID, Source.PONumber, Source.SupplierID, Source.SupplierCode, Source.OrderDate, Source.TotalAmountUSD, Source.TotalAmountVND, Source.PaymentTerms, Source.Incoterm, Source.PurchaserName, Source.ContractNumber, Source.Status);
        `, {
          PO_Header_ID: h.PO_Header_ID || `POH-${h.PONumber}`,
          PONumber: h.PONumber,
          SupplierID: h.SupplierID || `SUP-${h.SupplierCode || '01'}`,
          SupplierCode: h.SupplierCode || 'SUP-01',
          OrderDate: h.OrderDate || new Date().toISOString().split('T')[0],
          TotalAmountUSD: h.TotalAmountUSD || 0,
          TotalAmountVND: h.TotalAmountVND || 0,
          PaymentTerms: h.PaymentTerms || 'Net 30',
          Incoterm: h.Incoterm || 'DDP',
          PurchaserName: h.PurchaserName || 'Purchaser',
          ContractNumber: h.ContractNumber || '',
          Status: h.Status || 'Open',
        });
      }
    }

    // Insert PO Details
    const chunkSize = 100;
    for (let i = 0; i < details.length; i += chunkSize) {
      const chunk = details.slice(i, i + chunkSize);
      let valuesSql = '';
      const params: Record<string, any> = {};

      chunk.forEach((d: any, idx: number) => {
        const idKey = `id_${idx}`;
        const hidKey = `hid_${idx}`;
        const poKey = `po_${idx}`;
        const facKey = `fac_${idx}`;
        const matKey = `mat_${idx}`;
        const matcKey = `matc_${idx}`;
        const oqtyKey = `oqty_${idx}`;
        const rqtyKey = `rqty_${idx}`;
        const pqtyKey = `pqty_${idx}`;
        const pdateKey = `pdate_${idx}`;
        const pagKey = `pag_${idx}`;
        const statKey = `stat_${idx}`;
        const supKey = `sup_${idx}`;

        params[idKey] = d.PO_Detail_ID || `POD-${d.PONumber}-${d.MaterialCode}-${idx}`;
        params[hidKey] = d.PO_Header_ID || `POH-${d.PONumber}`;
        params[poKey] = d.PONumber;
        params[facKey] = d.FactoryID || d.FactoryCode || 'DBD';
        params[matKey] = d.MaterialID || `MAT-${d.MaterialCode}`;
        params[matcKey] = d.MaterialCode;
        params[oqtyKey] = d.OrderedQtyKg || 0;
        params[rqtyKey] = d.ReceivedQtyKg || 0;
        params[pqtyKey] = d.PendingQtyKg || 0;
        params[pdateKey] = d.PromisedDeliveryDate || d.DeliveryDate || new Date().toISOString().split('T')[0];
        params[pagKey] = d.PAGNumber || '';
        params[statKey] = d.LineStatus || 'Open';
        params[supKey] = d.SupplierName || '';

        valuesSql += (idx > 0 ? ',' : '') + `(@${idKey}, @${hidKey}, @${poKey}, @${facKey}, @${matKey}, @${matcKey}, @${oqtyKey}, @${rqtyKey}, @${pqtyKey}, @${pdateKey}, @${pagKey}, @${statKey}, @${supKey})`;
      });

      const insertSql = `
        INSERT INTO dbo.fact_PO_Detail (PO_Detail_ID, PO_Header_ID, PONumber, FactoryID, MaterialID, MaterialCode, OrderedQtyKg, ReceivedQtyKg, PendingQtyKg, PromisedDeliveryDate, PAGNumber, LineStatus, SupplierName)
        VALUES ${valuesSql};
      `;
      await executeQuery(insertSql, params);
    }

    return res.json({ success: true, message: `Đã nạp thành công ${details.length} dòng đơn hàng PO.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
