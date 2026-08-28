import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Download,
  Layers,
  Sparkles,
  Info,
  Check,
  Calendar
} from 'lucide-react';
import {
  Dim_Factory,
  Dim_Material,
  Sys_Import_Mapping,
  ValidationErrorItem,
  Language
} from '../types';
import {
  autoMapHeaders,
  validateImportData,
  systemFieldsByType,
  generateSampleExcel
} from '../utils/excelParser';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  factories: Dim_Factory[];
  materials: Dim_Material[];
  learnedMappings: Sys_Import_Mapping[];
  onSaveNewMappings: (newMappings: Sys_Import_Mapping[]) => void;
  onCommitImport: (
    importType: 'Forecast' | 'SOH' | 'Usage' | 'PO_Inbound',
    validData: any[],
    snapshotDate?: string
  ) => void;
  language: Language;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  factories,
  materials,
  learnedMappings,
  onSaveNewMappings,
  onCommitImport,
  language,
}) => {
  const [importType, setImportType] = useState<'Forecast' | 'SOH' | 'Usage' | 'PO_Inbound'>('Forecast');
  const [snapshotDate, setSnapshotDate] = useState<string>('2026-08-25');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [fileName, setFileName] = useState<string>('');
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [rawExcelRows, setRawExcelRows] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [rememberMapping, setRememberMapping] = useState<boolean>(true);

  // Validation results
  const [validationResult, setValidationResult] = useState<{
    parsedData: any[];
    errors: ValidationErrorItem[];
    validRowsCount: number;
    errorRowsCount: number;
    warningRowsCount: number;
  } | null>(null);

  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'VALID' | 'ERROR'>('ALL');
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFile(files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];

        // Parse to JSON array of objects
        const jsonData: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (jsonData.length === 0) {
          alert('File Excel không có dữ liệu.');
          setIsProcessing(false);
          return;
        }

        // Extract headers from the first object keys
        const headers = Object.keys(jsonData[0]);
        setFileHeaders(headers);
        setRawExcelRows(jsonData);

        // Auto map headers using fuzzy & learned mappings
        const { mapped } = autoMapHeaders(headers, importType, learnedMappings);
        setColumnMapping(mapped);

        setIsProcessing(false);
        setStep(2);
      } catch (err: any) {
        console.error('Failed to read Excel file:', err);
        alert('Lỗi khi đọc file Excel: ' + err.message);
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleRunDryValidation = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const result = validateImportData(
        rawExcelRows,
        columnMapping,
        importType,
        factories,
        materials
      );
      setValidationResult(result);
      setIsProcessing(false);
      setStep(3);
    }, 250);
  };

  const handleConfirmImport = () => {
    if (!validationResult) return;

    // Save learned mappings if requested
    if (rememberMapping) {
      const newMappings: Sys_Import_Mapping[] = [];
      Object.entries(columnMapping).forEach(([excelH, sysFVal]) => {
        const sysF = sysFVal as string;
        if (sysF && sysF !== '__IGNORE__') {
          const exists = learnedMappings.some(
            (m) =>
              m.ImportType === importType &&
              m.ExcelHeaderName.toLowerCase() === excelH.toLowerCase() &&
              m.SystemFieldName === sysF
          );
          if (!exists) {
            newMappings.push({
              MappingID: `MAP-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              ImportType: importType,
              ExcelHeaderName: excelH,
              SystemFieldName: sysF,
              Description: `Auto-saved from file ${fileName}`,
              CreatedAt: new Date().toISOString().split('T')[0],
            });
          }
        }
      });
      if (newMappings.length > 0) {
        onSaveNewMappings(newMappings);
      }
    }

    // Filter valid rows and pass to parent
    const validRows = validationResult.parsedData.filter(
      (r) => r._status === 'Valid' || r._status === 'Warning'
    );
    onCommitImport(importType, validRows, snapshotDate);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    setStep(4);
  };

  const resetModal = () => {
    setStep(1);
    setFileName('');
    setFileHeaders([]);
    setRawExcelRows([]);
    setColumnMapping({});
    setValidationResult(null);
    setPreviewFilter('ALL');
  };

  const systemFields = systemFieldsByType[importType] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>D365 FO Smart Excel Importer</span>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  Dynamic Header Mapping
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Nhập liệu thông minh &amp; Ánh xạ cột tự động không phụ thuộc vị trí cột Excel
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              resetModal();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between text-xs">
          {[
            { num: 1, title: '1. Chọn file & Loại dữ liệu' },
            { num: 2, title: '2. Ánh xạ Header (Mapping)' },
            { num: 3, title: '3. Kiểm thử 3 Lớp & Dry-Run' },
            { num: 4, title: '4. Hoàn tất & Đồng bộ' },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 ${
                step === s.num
                  ? 'text-blue-600 font-bold'
                  : step > s.num
                  ? 'text-slate-700 font-medium'
                  : 'text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s.num
                    ? 'bg-blue-600 text-white shadow-xs'
                    : step > s.num
                    ? 'bg-green-100 text-green-700 font-bold'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span className="hidden sm:inline">{s.title}</span>
            </div>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800">
          {/* STEP 1: Upload & Select Type */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  1. Chọn định dạng dữ liệu D365 cần Import
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {
                      type: 'Forecast' as const,
                      title: 'Dự báo Nhu cầu (Forecast)',
                      desc: 'File dự báo tháng xuất từ D365 / S&OP',
                      color: 'border-blue-300 bg-blue-50/50 text-blue-700',
                    },
                    {
                      type: 'SOH' as const,
                      title: 'Tồn Kho (SOH Open Balance)',
                      desc: 'Báo cáo tồn kho vật lý tại các nhà máy',
                      color: 'border-indigo-300 bg-indigo-50/50 text-indigo-700',
                    },
                    {
                      type: 'Usage' as const,
                      title: 'Tiêu Hao Thực Tế (Usage)',
                      desc: 'Xuất kho sản xuất (Log MTD)',
                      color: 'border-purple-300 bg-purple-50/50 text-purple-700',
                    },
                    {
                      type: 'PO_Inbound' as const,
                      title: 'Đơn Mua & Inbound (PO)',
                      desc: 'Hàng đang trên đường về cảng / nhà máy',
                      color: 'border-amber-300 bg-amber-50/50 text-amber-700',
                    },
                  ].map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setImportType(t.type)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        importType === t.type
                          ? `${t.color} ring-2 ring-blue-500/30 shadow-sm`
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold text-sm text-slate-900 mb-1">{t.title}</div>
                      <div className="text-[11px] text-slate-500 leading-relaxed">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Snapshot / Cut-off Date Confirmation */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>2. Ngày Xác Nhận Chốt Số Liệu (Snapshot / Cut-off Date):</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={snapshotDate}
                      onChange={(e) => setSnapshotDate(e.target.value)}
                      className="bg-white border border-indigo-300 rounded-xl px-3 py-1.5 font-mono font-bold text-slate-800 text-xs shadow-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none cursor-pointer"
                    />
                    <span className="text-[10px] font-bold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                      Đồng bộ Position Matrix
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600">
                  Mốc thời gian này dùng để chốt tồn kho <strong>SOH Cut-off</strong>, đồng bộ trực tiếp với <strong>Ma Trận Vị Thế Cung Ứng (Position Matrix Cut-off: {snapshotDate})</strong> và tính toán chính xác chỉ số DOI/ngày cạn hàng.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    3. Chọn hoặc Kéo thả file Excel (.xlsx, .xls, .csv)
                  </label>
                  <button
                    type="button"
                    onClick={() => generateSampleExcel(importType)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải file mẫu D365 ({importType}.xlsx)</span>
                  </button>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-200">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Kéo thả file Excel vào đây hoặc <span className="text-blue-600 underline">chọn từ máy tính</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Hỗ trợ mọi định dạng header từ D365 FO (Site, InventLocationId, Item Number, SOH, Forecast...)
                    </p>
                  </div>
                </div>
              </div>

              {/* Argumentative Defense Proof Note */}
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-blue-900">Tính năng linh hoạt giải quyết bài toán thực tế:</p>
                  <p className="text-blue-700">
                    File export từ D365 FO giữa các nhà máy (DBD, DDN, DVL...) thường xuyên bị đổi tên cột hoặc chèn cột ghi chú. Thuật toán Dynamic Mapping tự động nhận diện tên cột thay vì số cột tĩnh, đảm bảo dữ liệu luôn được nạp chính xác.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Header Mapping UI */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-700">File đang xử lý:</span>
                  <span className="text-xs font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {fileName}
                  </span>
                  <span className="text-xs text-slate-500">({rawExcelRows.length} dòng dữ liệu)</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-remember"
                    checked={rememberMapping}
                    onChange={(e) => setRememberMapping(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                  <label htmlFor="chk-remember" className="text-xs text-slate-700 font-medium cursor-pointer select-none">
                    Ghi nhớ ánh xạ (Sys_Import_Mappings)
                  </label>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Khớp nối tên cột Excel với trường dữ liệu hệ thống PremixTrack:
                </p>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Cột trong File Excel của bạn</th>
                        <th className="py-3 px-4">Ánh xạ sang Trường Hệ Thống</th>
                        <th className="py-3 px-4 text-center">Trạng Thái Khớp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fileHeaders.map((header) => {
                        const currentSysField = columnMapping[header] || '';
                        const isMapped = currentSysField && currentSysField !== '__IGNORE__';

                        return (
                          <tr key={header} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                              {header}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={currentSysField}
                                onChange={(e) =>
                                  setColumnMapping({ ...columnMapping, [header]: e.target.value })
                                }
                                className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                              >
                                <option value="__IGNORE__">-- Bỏ qua cột này (Ignore) --</option>
                                {systemFields.map((f) => (
                                  <option key={f.field} value={f.field}>
                                    {f.label_VN} {f.required ? '(* Bắt buộc)' : ''}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isMapped ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Đã khớp</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                  <span>Bỏ qua</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Unmapped required fields check */}
              {(() => {
                const mappedFields = Object.values(columnMapping);
                const missingRequired = systemFields.filter(
                  (f) => f.required && !mappedFields.includes(f.field)
                );

                if (missingRequired.length > 0) {
                  return (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Chưa ánh xạ các trường bắt buộc:{' '}
                        <strong>{missingRequired.map((m) => m.label_VN).join(', ')}</strong>. Vui lòng chọn cột tương ứng từ dropdown phía trên.
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* STEP 3: Dry-Run & 3-Layer Validation */}
          {step === 3 && validationResult && (
            <div className="space-y-4">
              {/* Metric summary banner */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Tổng số dòng quét</div>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                    {validationResult.parsedData.length}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded-2xl">
                  <div className="text-[11px] text-green-700 font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Dòng hợp lệ (Sẵn sàng)</span>
                  </div>
                  <div className="text-2xl font-black text-green-700 mt-1 font-mono">
                    {validationResult.validRowsCount}
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl">
                  <div className="text-[11px] text-red-700 font-bold uppercase tracking-wider flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Dòng bị lỗi (Bỏ qua)</span>
                  </div>
                  <div className="text-2xl font-black text-red-600 mt-1 font-mono">
                    {validationResult.errorRowsCount}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                  <div className="text-[11px] text-amber-800 font-bold uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Cảnh báo Nghiệp vụ</span>
                  </div>
                  <div className="text-2xl font-black text-amber-700 mt-1 font-mono">
                    {validationResult.warningRowsCount}
                  </div>
                </div>
              </div>

              {/* Error Detail Log List if errors exist */}
              {validationResult.errors.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 max-h-36 overflow-y-auto">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
                    <span>Chi tiết lỗi phát hiện qua 3 Lớp Kiểm Soát (Type, MasterData, BusinessLogic):</span>
                  </div>
                  <div className="space-y-1.5">
                    {validationResult.errors.map((err, i) => (
                      <div
                        key={i}
                        className={`text-xs px-3 py-1.5 rounded-xl flex items-center justify-between gap-2 ${
                          err.severity === 'Error'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <span className="font-mono font-bold">Dòng {err.rowNumber} [{err.column}]:</span>
                        <span className="flex-1">{err.message}</span>
                        <span className="text-[10px] uppercase px-2 py-0.5 bg-white rounded font-bold text-slate-600">
                          {err.layer}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Table Preview Controls */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-600 font-bold">Xem trước bảng dữ liệu (Preview &amp; Error Highlight):</span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setPreviewFilter('ALL')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                      previewFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tất cả ({validationResult.parsedData.length})
                  </button>
                  <button
                    onClick={() => setPreviewFilter('VALID')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                      previewFilter === 'VALID' ? 'bg-white text-green-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hợp lệ ({validationResult.validRowsCount})
                  </button>
                  <button
                    onClick={() => setPreviewFilter('ERROR')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                      previewFilter === 'ERROR' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Có lỗi ({validationResult.errorRowsCount})
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Dòng</th>
                      <th className="py-2.5 px-3">Nhà Máy (Site)</th>
                      <th className="py-2.5 px-3">Mã SKU</th>
                      <th className="py-2.5 px-3">Tên Nguyên Liệu Khớp Được</th>
                      <th className="py-2.5 px-3 text-right">Số Lượng (Kg)</th>
                      <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {validationResult.parsedData
                      .filter((row) => {
                        if (previewFilter === 'VALID') return row._status === 'Valid' || row._status === 'Warning';
                        if (previewFilter === 'ERROR') return row._status === 'Error';
                        return true;
                      })
                      .map((row, idx) => (
                        <tr
                          key={idx}
                          className={`transition-colors hover:bg-slate-50 ${
                            row._status === 'Error'
                              ? 'bg-red-50/50 text-red-900'
                              : row._status === 'Warning'
                              ? 'bg-amber-50/40 text-amber-900'
                              : 'text-slate-700'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono text-slate-400">{row._rowNumber}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {row.ResolvedFactoryCode || row.FactoryCode || '-'}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                            {row.ResolvedMaterialCode || row.MaterialCode || '-'}
                          </td>
                          <td className="py-2.5 px-3 truncate max-w-xs text-slate-800">
                            {row.ResolvedMaterialName || '---'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {row.ForecastQty !== undefined
                              ? Number(row.ForecastQty).toLocaleString()
                              : row.Quantity !== undefined
                              ? Number(row.Quantity).toLocaleString()
                              : row.ActualQty !== undefined
                              ? Number(row.ActualQty).toLocaleString()
                              : row.OrderQty !== undefined
                              ? Number(row.OrderQty).toLocaleString()
                              : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {row._status === 'Error' ? (
                              <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                Lỗi
                              </span>
                            ) : row._status === 'Warning' ? (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                                Cảnh báo
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                Hợp lệ
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: Success View */}
          {step === 4 && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200 shadow-sm animate-bounce">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Import Dữ Liệu Thành Công!</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  Đã cập nhật dữ liệu <strong>{importType}</strong> vào hệ thống PremixTrack. Toàn bộ chỉ số DOI, ngày che phủ và cảnh báo thiếu hụt đã được tự động tính toán lại.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetModal();
                    onClose();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer text-sm"
                >
                  Xem Bảng Tổng Quan Ngay
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {step < 4 && (
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (step === 1) onClose();
                else setStep((step - 1) as any);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
            >
              {step === 1 ? 'Hủy Bỏ' : 'Quay Lại Bước Trước'}
            </button>

            <div className="flex items-center gap-3">
              {step === 2 && (
                <button
                  type="button"
                  onClick={handleRunDryValidation}
                  disabled={isProcessing}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>Đang kiểm tra...</span>
                  ) : (
                    <>
                      <span>Chạy Kiểm Thử Dry-Run</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={!validationResult || validationResult.validRowsCount === 0}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận Nạp {validationResult?.validRowsCount} Dòng Vào Hệ Thống</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
