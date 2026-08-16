import {
  Dim_Factory,
  Dim_Material,
  Fact_Forecast_Detail,
  Fact_Forecast_Header,
  Fact_Inventory_SOH,
  Fact_Production_Usage,
  Fact_PO_Detail,
  CalculatedMaterialMetric,
  AlertSeverity,
  InterFactoryTransferSuggestion,
  Formula_BOM
} from '../types';

export function calculateMetrics(
  factories: Dim_Factory[],
  materials: Dim_Material[],
  forecastHeader: Fact_Forecast_Header,
  forecastDetails: Fact_Forecast_Detail[],
  inventorySOH: Fact_Inventory_SOH[],
  poDetails: Fact_PO_Detail[],
  productionUsages: Fact_Production_Usage[],
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

      // 3. Open POs (Inbound / Remain)
      const poRecords = poDetails.filter(
        (p) => p.FactoryID === factory.FactoryID && p.MaterialID === material.MaterialID
      );
      const openPOQty = poRecords.reduce((sum, item) => sum + (item.RemainQty || 0), 0);

      const totalAvailable = sohQty + openPOQty;

      // 4. DOI calculations
      let doiSOH = 0;
      let doiTotal = 0;

      if (dailyUsage > 0) {
        doiSOH = sohQty / dailyUsage;
        doiTotal = totalAvailable / dailyUsage;
      } else if (sohQty > 0) {
        // Has stock but 0 forecast
        doiSOH = 999;
        doiTotal = 999;
      }

      // 5. Dates
      const coverageDate = new Date(today);
      coverageDate.setDate(coverageDate.getDate() + Math.min(Math.round(doiTotal), 365));
      const coverageTillDateStr = doiTotal >= 999 ? 'Không giới hạn (>1 năm)' : coverageDate.toISOString().split('T')[0];

      const stockoutDate = new Date(today);
      stockoutDate.setDate(stockoutDate.getDate() + Math.min(Math.round(doiSOH), 365));
      const stockoutDateStr = doiSOH >= 999 ? 'An toàn' : stockoutDate.toISOString().split('T')[0];

      // 6. MTD Actual Usage
      const usageRecords = productionUsages.filter(
        (u) => u.FactoryID === factory.FactoryID && u.MaterialID === material.MaterialID
      );
      const mtdActualUsage = usageRecords.reduce((sum, item) => sum + item.ActualQty, 0);
      const expectedMTD = dailyUsage * elapsedWorkingDays;
      const mtdPerformancePercent = expectedMTD > 0 ? (mtdActualUsage / expectedMTD) * 100 : 0;

      // 7. Replacement Material info
      let repMaterial: Dim_Material | undefined;
      if (material.ReplacementMaterialID) {
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
          ReplacementMaterialID: material.ReplacementMaterialID,
          ReplacementMaterialCode: repMaterial?.MaterialCode,
          ReplacementMaterialName: repMaterial?.Name_VN,
          Status: material.Status,
        });
      }
    });
  });

  return metrics;
}

// Distance matrix approximation between factory codes (km)
const factoryDistances: Record<string, Record<string, number>> = {
  DBD: { DDN: 35, DVL: 165, DTI: 110, DGL: 480, DHY: 1680, DBN: 1710, DHP: 1750 },
  DDN: { DBD: 35, DVL: 180, DTI: 125, DGL: 460, DHY: 1670, DBN: 1700, DHP: 1740 },
  DVL: { DBD: 165, DDN: 180, DTI: 65, DGL: 610, DHY: 1810, DBN: 1840, DHP: 1870 },
  DTI: { DBD: 110, DDN: 125, DVL: 65, DGL: 560, DHY: 1760, DBN: 1790, DHP: 1820 },
  DHY: { DBN: 45, DHP: 75, DGL: 1120, DBD: 1680, DDN: 1670, DVL: 1810, DTI: 1760 },
  DBN: { DHY: 45, DHP: 90, DGL: 1150, DBD: 1710, DDN: 1700, DVL: 1840, DTI: 1790 },
  DHP: { DHY: 75, DBN: 90, DGL: 1190, DBD: 1750, DDN: 1740, DVL: 1870, DTI: 1820 },
  DGL: { DBD: 480, DDN: 460, DTI: 560, DVL: 610, DHY: 1120, DBN: 1150, DHP: 1190 },
};

export function generateInterFactoryTransferSuggestions(
  metrics: CalculatedMaterialMetric[]
): InterFactoryTransferSuggestion[] {
  const suggestions: InterFactoryTransferSuggestion[] = [];

  // Group metrics by MaterialID
  const materialGroups: Record<string, CalculatedMaterialMetric[]> = {};
  metrics.forEach((m) => {
    if (!materialGroups[m.MaterialID]) {
      materialGroups[m.MaterialID] = [];
    }
    materialGroups[m.MaterialID].push(m);
  });

  Object.entries(materialGroups).forEach(([materialId, list]) => {
    // Find factories in CRITICAL or WARNING shortage
    const deficitFactories = list.filter((m) => m.DOI_Total < 10 && m.DailyUsage > 0);
    // Find factories with SURPLUS (DOI > 35 or SOH > 2.5x safety stock)
    const surplusFactories = list.filter(
      (m) => m.DOI_SOH > 30 && m.SOHQty > m.DailyUsage * (m.SafetyStockDays + 10)
    );

    deficitFactories.forEach((target) => {
      // Find best source factory (preferably close by)
      let bestSource: CalculatedMaterialMetric | null = null;
      let minDistance = 99999;

      surplusFactories.forEach((source) => {
        if (source.FactoryID === target.FactoryID) return;
        const dist = factoryDistances[source.FactoryCode]?.[target.FactoryCode] || 500;
        if (dist < minDistance) {
          minDistance = dist;
          bestSource = source;
        }
      });

      if (bestSource) {
        const targetDaily = target.DailyUsage;
        const targetNeededKg = Math.round(targetDaily * (target.SafetyStockDays - target.DOI_Total));
        const sourceSurplusKg = Math.round(
          bestSource.SOHQty - bestSource.DailyUsage * (bestSource.SafetyStockDays + 5)
        );

        const recommendedKg = Math.min(targetNeededKg, sourceSurplusKg);

        if (recommendedKg > 500) {
          const hours = Math.round(minDistance / 50) + 2; // Average truck speed 50km/h + 2h loading
          const urgency: 'URGENT' | 'HIGH' | 'MEDIUM' =
            target.DOI_Total < 5 ? 'URGENT' : target.DOI_Total < 8 ? 'HIGH' : 'MEDIUM';

          suggestions.push({
            id: `TRF-${bestSource.FactoryCode}-${target.FactoryCode}-${target.MaterialCode}`,
            MaterialID: materialId,
            MaterialCode: target.MaterialCode,
            MaterialName: target.MaterialName_VN,
            SourceFactoryID: bestSource.FactoryID,
            SourceFactoryCode: bestSource.FactoryCode,
            SourceDOI: Math.round(bestSource.DOI_SOH),
            SourceSurplusKg: sourceSurplusKg,
            TargetFactoryID: target.FactoryID,
            TargetFactoryCode: target.FactoryCode,
            TargetDOI: Math.round(target.DOI_Total),
            TargetDeficitKg: targetNeededKg,
            RecommendedTransferKg: recommendedKg,
            EstimatedDistanceKm: minDistance,
            EstimatedTransitHours: hours,
            Urgency: urgency,
            Reason: `Nhà máy ${target.FactoryCode} chỉ còn ${target.DOI_Total.toFixed(1)} ngày tồn kho (nguy cơ dừng máy). Nhà máy ${bestSource.FactoryCode} dư ${bestSource.DOI_SOH.toFixed(1)} ngày tồn.`,
            Status: 'Pending',
          });
        }
      }
    });
  });

  return suggestions;
}

export interface BOMExplosionResult {
  formula: Formula_BOM;
  finishedFeedTons: number;
  premixBatchKg: number;
  ingredients: {
    material: Dim_Material;
    requiredKg: number;
    sohKg: number;
    openPOKg: number;
    totalAvailableKg: number;
    isShortage: boolean;
    shortageKg: number;
    coverageBatches: number;
  }[];
  bottleneckMaterial?: Dim_Material;
  maxFeasibleBatches: number;
  totalCostUSD: number;
}

export function explodeBOM(
  formula: Formula_BOM,
  finishedFeedTons: number,
  selectedFactoryId: string,
  materials: Dim_Material[],
  inventorySOH: Fact_Inventory_SOH[],
  poDetails: Fact_PO_Detail[]
): BOMExplosionResult {
  // 1. Calculate Premix Batch size
  // e.g. 500 tons finished feed * 4% inclusion = 20 tons (20,000 kg) premix
  const premixBatchKg = (finishedFeedTons * 1000 * formula.PremixInclusionRateInFeed) / 100;

  let totalCostUSD = 0;
  let minBatchesPossible = 999999;
  let bottleneckMat: Dim_Material | undefined;

  const ingredients = formula.Items.map((item) => {
    const mat = materials.find((m) => m.MaterialID === item.MaterialID) || {
      MaterialID: item.MaterialID,
      MaterialCode: 'UNKNOWN',
      Name_VN: 'Nguyên liệu không xác định',
      Name_EN: 'Unknown Material',
      Category: 'Carriers_Minerals',
      Unit: 'kg',
      PIC_ID: 'PIC-01',
      SafetyStockDays: 14,
      UnitPriceUSD: 1.0,
      Status: 'Active',
    };

    // Calculate required kg: (item.QtyKgPerTonPremix / 1000) * premixBatchKg
    const requiredKg = (item.QtyKgPerTonPremix / 1000) * premixBatchKg;

    // Available inventory at factory
    const soh = inventorySOH
      .filter((s) => s.FactoryID === selectedFactoryId && s.MaterialID === mat.MaterialID)
      .reduce((sum, s) => sum + s.Quantity, 0);

    const openPO = poDetails
      .filter((p) => p.FactoryID === selectedFactoryId && p.MaterialID === mat.MaterialID)
      .reduce((sum, p) => sum + p.RemainQty, 0);

    const totalAvailable = soh + openPO;
    const isShortage = totalAvailable < requiredKg;
    const shortageKg = isShortage ? requiredKg - totalAvailable : 0;

    const batchesPossible = requiredKg > 0 ? totalAvailable / requiredKg : 999;
    if (batchesPossible < minBatchesPossible) {
      minBatchesPossible = batchesPossible;
      bottleneckMat = mat as Dim_Material;
    }

    totalCostUSD += requiredKg * (mat.UnitPriceUSD || 1.5);

    return {
      material: mat as Dim_Material,
      requiredKg: Math.round(requiredKg * 10) / 10,
      sohKg: soh,
      openPOKg: openPO,
      totalAvailableKg: totalAvailable,
      isShortage,
      shortageKg: Math.round(shortageKg * 10) / 10,
      coverageBatches: Math.round(batchesPossible * 10) / 10,
    };
  });

  return {
    formula,
    finishedFeedTons,
    premixBatchKg,
    ingredients,
    bottleneckMaterial: bottleneckMat,
    maxFeasibleBatches: Math.max(0, Math.floor(minBatchesPossible * 100) / 100),
    totalCostUSD: Math.round(totalCostUSD),
  };
}

export function calculateAllMetrics(
  factories: Dim_Factory[],
  materials: Dim_Material[],
  inventorySOH: Fact_Inventory_SOH[],
  forecastDetails: Fact_Forecast_Detail[],
  poDetails: Fact_PO_Detail[],
  usageLogs: Fact_Production_Usage[],
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
    currentDateStr
  );
}

export function generateTransferSuggestions(
  metrics: CalculatedMaterialMetric[],
  factories?: Dim_Factory[],
  materials?: Dim_Material[]
): InterFactoryTransferSuggestion[] {
  return generateInterFactoryTransferSuggestions(metrics);
}
