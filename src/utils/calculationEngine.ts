import {
  Dim_Factory,
  Dim_Material,
  Dim_Material_Substitution,
  Fact_Forecast_Detail,
  Fact_Forecast_Header,
  Fact_Inventory_SOH,
  Fact_Production_Usage,
  Fact_PO_Detail,
  CalculatedMaterialMetric,
  AlertSeverity
} from '../types';

export function calculateMetrics(
  factories: Dim_Factory[],
  materials: Dim_Material[],
  forecastHeader: Fact_Forecast_Header,
  forecastDetails: Fact_Forecast_Detail[],
  inventorySOH: Fact_Inventory_SOH[],
  poDetails: Fact_PO_Detail[],
  productionUsages: Fact_Production_Usage[],
  substitutions: Dim_Material_Substitution[] = [],
  currentDateStr: string = '2026-08-15'
): CalculatedMaterialMetric[] {
  const workingDays = forecastHeader.WorkingDaysInMonth || 28;
  const today = new Date(currentDateStr);
  const currentDayOfMonth = today.getDate(); // e.g. 15
  const elapsedWorkingDays = Math.min(Math.round((currentDayOfMonth / 30) * workingDays), workingDays);

  const metrics: CalculatedMaterialMetric[] = [];

  factories.forEach((factory) => {
    materials.forEach((material) => {
      // 1. Forecast for this factory & material
      const fcDetail = forecastDetails.find(
        (f) => f.FactoryID === factory.FactoryID && f.MaterialID === material.MaterialID
      );
      const forecastQty = fcDetail ? fcDetail.ForecastQty : 0;
      const dailyUsage = forecastQty > 0 ? forecastQty / workingDays : 0;

      // 2. SOH on hand
      const sohRecords = inventorySOH.filter(
        (s) => s.FactoryID === factory.FactoryID && s.MaterialID === material.MaterialID
      );
      const sohQty = sohRecords.reduce((sum, item) => sum + item.Quantity, 0);

      // 3. Open POs
      const relatedPODetails = poDetails.filter(
        (p) => p.MaterialID === material.MaterialID
      );
      const openPOQty = relatedPODetails.reduce((sum, item) => sum + (item.RemainQty || 0), 0);

      // 4. Total Available
      const totalAvailable = sohQty + openPOQty;

      // 5. DOI calculations
      const doiSOH = dailyUsage > 0 ? Math.round((sohQty / dailyUsage) * 10) / 10 : 999;
      const doiTotal = dailyUsage > 0 ? Math.round((totalAvailable / dailyUsage) * 10) / 10 : 999;

      const coverageDays = doiTotal === 999 ? 90 : Math.min(doiTotal, 180);
      const coverageDate = new Date(today);
      coverageDate.setDate(today.getDate() + Math.round(coverageDays));
      const coverageTillDateStr = coverageDate.toISOString().split('T')[0];

      const stockoutDays = doiSOH === 999 ? 90 : Math.min(doiSOH, 180);
      const stockoutDate = new Date(today);
      stockoutDate.setDate(today.getDate() + Math.round(stockoutDays));
      const stockoutDateStr = stockoutDate.toISOString().split('T')[0];

      // 6. Actual MTD usage
      const usageRecords = productionUsages.filter(
        (u) => u.FactoryID === factory.FactoryID && u.MaterialID === material.MaterialID
      );
      const mtdActualUsage = usageRecords.reduce((sum, item) => sum + item.ActualQty, 0);
      const expectedMTD = dailyUsage * elapsedWorkingDays;
      const mtdPerformancePercent = expectedMTD > 0 ? (mtdActualUsage / expectedMTD) * 100 : 0;

      // 7. Multi-source Substitutions & Virtual Combined Stock computation
      const relevantSubstitutions = substitutions
        .filter(
          (sub) =>
            sub.Status === 'Active' &&
            (sub.OriginalMaterialCode === material.MaterialCode ||
              (sub.IsBiDirectional && sub.SubstituteMaterialCode === material.MaterialCode)) &&
            (sub.DivisionScope === 'ALL' || sub.DivisionScope === factory.Division)
        )
        .sort((a, b) => a.Priority - b.Priority);

      // Calculate Virtual Available Stock equivalent from substitute items in this factory
      let substituteEquivalentQty = 0;
      relevantSubstitutions.forEach((sub) => {
        const subMatCode =
          sub.OriginalMaterialCode === material.MaterialCode
            ? sub.SubstituteMaterialCode
            : sub.OriginalMaterialCode;
        const subRatio =
          sub.OriginalMaterialCode === material.MaterialCode
            ? sub.ConversionRatio
            : 1 / sub.ConversionRatio;

        const subMat = materials.find((m) => m.MaterialCode === subMatCode);
        if (subMat) {
          const subSOHRecords = inventorySOH.filter(
            (s) => s.FactoryID === factory.FactoryID && s.MaterialID === subMat.MaterialID
          );
          const subSOH = subSOHRecords.reduce((sum, item) => sum + item.Quantity, 0);
          if (subRatio > 0) {
            substituteEquivalentQty += subSOH / subRatio;
          }
        }
      });

      const virtualAvailableQty = Math.round(sohQty + substituteEquivalentQty);
      const virtualDOI =
        dailyUsage > 0 ? Math.round((virtualAvailableQty / dailyUsage) * 10) / 10 : 999;

      let repMaterial: Dim_Material | undefined;
      if (relevantSubstitutions.length > 0) {
        const topSub = relevantSubstitutions[0];
        const targetCode =
          topSub.OriginalMaterialCode === material.MaterialCode
            ? topSub.SubstituteMaterialCode
            : topSub.OriginalMaterialCode;
        repMaterial = materials.find((m) => m.MaterialCode === targetCode);
      } else if (material.ReplacementMaterialID) {
        repMaterial = materials.find((m) => m.MaterialID === material.ReplacementMaterialID);
      }

      // 8. Severity
      let severity: AlertSeverity = 'BALANCED';
      if (material.Status === 'Stop_Usage' || material.Status === 'Phase_Out') {
        severity = 'STOP_USAGE_WARNING';
      } else if (dailyUsage > 0) {
        if (doiTotal < 7 || (doiSOH < 5 && openPOQty === 0)) {
          severity = 'CRITICAL';
        } else if (doiTotal < material.SafetyStockDays) {
          severity = 'WARNING';
        } else if (doiTotal > material.SafetyStockDays * 2.8) {
          severity = 'OVERSTOCK';
        } else {
          severity = 'BALANCED';
        }
      } else if (sohQty > 0 && material.Status === 'Active') {
        severity = 'OVERSTOCK'; // Inactive demand but high stock
      }

      // 9. Reorder recommendation
      const targetDays = material.SafetyStockDays * 1.5; // Target 1.5x safety stock
      const targetStockKg = dailyUsage * targetDays;
      const suggestedReorderQty = Math.max(0, Math.round(targetStockKg - totalAvailable));

      // Include if there is forecast or stock or open PO
      if (forecastQty > 0 || sohQty > 0 || openPOQty > 0) {
        metrics.push({
          FactoryID: factory.FactoryID,
          FactoryCode: factory.InternalCode,
          FactoryName: factory.FactoryName_VN,
          MaterialID: material.MaterialID,
          MaterialCode: material.MaterialCode,
          MaterialName_VN: material.Name_VN,
          MaterialName_EN: material.Name_EN,
          Category: material.Category,
          Unit: material.Unit,
          SafetyStockDays: material.SafetyStockDays,
          ForecastQty: forecastQty,
          DailyUsage: dailyUsage,
          SOHQty: sohQty,
          OpenPOQty: openPOQty,
          TotalAvailable: totalAvailable,
          DOI_SOH: doiSOH,
          DOI_Total: doiTotal,
          CoverageTillDate: coverageTillDateStr,
          StockoutDate: stockoutDateStr,
          MTDActualUsage: mtdActualUsage,
          MTDPerformancePercent: Math.round(mtdPerformancePercent),
          Severity: severity,
          SuggestedReorderQty: suggestedReorderQty,
          ReplacementMaterialID: repMaterial?.MaterialID || material.ReplacementMaterialID,
          ReplacementMaterialCode: repMaterial?.MaterialCode,
          ReplacementMaterialName: repMaterial?.Name_VN,
          Substitutions: relevantSubstitutions,
          VirtualAvailableQty: virtualAvailableQty,
          VirtualDOI: virtualDOI,
          Status: material.Status,
        });
      }
    });
  });

  return metrics;
}

export function calculateAllMetrics(
  factories: Dim_Factory[],
  materials: Dim_Material[],
  inventorySOH: Fact_Inventory_SOH[],
  forecastDetails: Fact_Forecast_Detail[],
  poDetails: Fact_PO_Detail[],
  usageLogs: Fact_Production_Usage[],
  substitutions: Dim_Material_Substitution[] = [],
  currentDateStr: string = '2026-08-15'
): CalculatedMaterialMetric[] {
  const defaultHeader: Fact_Forecast_Header = {
    VersionID: 'FCST-LATEST',
    VersionName: 'Live D365 Forecast',
    ExportDate: currentDateStr,
    IsActive: true,
    WorkingDaysInMonth: 28,
  };
  return calculateMetrics(
    factories,
    materials,
    defaultHeader,
    forecastDetails,
    inventorySOH,
    poDetails,
    usageLogs,
    substitutions,
    currentDateStr
  );
}
