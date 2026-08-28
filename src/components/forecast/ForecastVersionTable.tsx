import React, { useState, useRef } from 'react';
import {
  Clock,
  Search,
  Download,
  Upload,
  FileSpreadsheet,
  FileDown,
  Trash2,
  CheckCircle2,
  Calendar,
  Layers,
  Building,
  Check,
  X,
  Plus,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  ForecastRunVersion,
  Dim_Material,
  Dim_Factory,
  Language,
} from '../../types';
import { stickyThCls, FloatingHomeEndButtons } from './types';

export interface ForecastVersionTableProps {
  forecastVersions: ForecastRunVersion[];
  materials: Dim_Material[];
  factories: Dim_Factory[];
  onUpdateVersions: (versions: ForecastRunVersion[]) => void;
  language: Language;
}

export const ForecastVersionTable: React.FC<ForecastVersionTableProps> = ({
  forecastVersions,
  materials,
  factories,
  onUpdateVersions,
  language,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newRunDate, setNewRunDate] = useState(new Date().toISOString().split('T')[0]);
  const [newVersionName, setNewVersionName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const handleSetActive = (verId: string) => {
    const updated = forecastVersions.map((v) => ({
      ...v,
      IsActive: v.VersionID === verId,
    }));
    onUpdateVersions(updated);
  };

  const handleDeleteVersion = (verId: string) => {
    if (forecastVersions.length <= 1) {
      alert('Kh�ng th? x�a version duy nh?t c�n l?i trong h? th?ng.');
      return;
    }
    if (confirm('X�c nh?n x�a b?n ghi d?t ch?y Forecast n�y?')) {
      const updated = forecastVersions.filter((v) => v.VersionID !== verId);
      if (!updated.some((v) => v.IsActive) && updated.length > 0) {
        updated[0].IsActive = true;
      }
      onUpdateVersions(updated);
    }
  };

  const handleExportVersionsExcel = () => {
    const exportData = forecastVersions.map((v) => ({
      VersionID: v.VersionID,
      VersionName: v.VersionName,
      RunDate: v.RunDate,
      TotalSKUs: v.TotalSKUs,
      TotalVolumeTons: (v.TotalVolumeKg / 1000).toFixed(2),
      Status: v.Status,
      IsActive: v.IsActive ? 'ACTIVE' : '',
      Notes: v.Notes || '',
      CreatedAt: v.CreatedAt,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Versions');
    XLSX.writeFile(wb, `Danh_Sach_Dot_Chay_Forecast_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDownloadTemplate = () => {
    const rows: any[] = [];
    materials.slice(0, 10).forEach((mat) => {
      const sampleRow: any = {
        'M� Nguy�n Li?u': mat.MaterialCode,
        'T�n Nguy�n Li?u': mat.Name_VN,
        '�on V? T�nh': 'kg',
      };
      factories.forEach((fac) => {
        sampleRow[fac.InternalCode] = Math.floor(Math.random() * 5000) + 100;
      });
      rows.push(sampleRow);
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Forecast_Template');
    XLSX.writeFile(wb, 'Template_Forecast_Matrix.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        if (data.length === 0) {
          alert('File Excel rỗng, vui lòng kiểm tra lại.');
          return;
        }

        const newVer: ForecastRunVersion = {
          VersionID: `FC-VER-${Date.now()}`,
          VersionName: newVersionName || `Đợt chạy ${newRunDate}`,
          RunDate: newRunDate,
          TotalForecastQty: 100000,
          SKUCount: data.length,
          PlantCount: factories.length || 9,
          UploadedAt: new Date().toISOString(),
          UploadedBy: 'Planner',
          SourceFileName: file.name,
          Notes: newNotes || 'Imported via Excel',
        };

        const updated = forecastVersions.map((v) => ({ ...v }));
        onUpdateVersions([newVer, ...updated]);
        setIsUploadModalOpen(false);
        setUploadStatusMsg(`Đã import thành công ${data.length} dòng dữ liệu vào phiên bản mới!`);
        setTimeout(() => setUploadStatusMsg(null), 5000);
      } catch (err: any) {
        alert('Lỗi khi đọc file Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredVersions = forecastVersions.filter((v) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      v.VersionName.toLowerCase().includes(q) ||
      v.RunDate.includes(q) ||
      (v.Notes && v.Notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {uploadStatusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in font-medium">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{uploadStatusMsg}</span>
        </div>
      )}

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Danh Sách Các Đợt Upload Forecast Từ RD ({forecastVersions.length} Đợt)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Quản lý lịch sử nạp dữ liệu, chỉnh sửa thông tin hoặc xóa an toàn các đợt upload.
              </p>
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nạp Đợt Mới</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className={stickyThCls}>Ngày Chạy (Run Date)</th>
                  <th className={stickyThCls}>Tên Đợt / File Gốc</th>
                  <th className={`${stickyThCls} text-right`}>Tổng Nhu Cầu (kg)</th>
                  <th className={`${stickyThCls} text-center`}>Số SKUs</th>
                  <th className={`${stickyThCls} text-center`}>Số Nhà Máy</th>
                  <th className={stickyThCls}>Người Upload</th>
                  <th className={stickyThCls}>Thời Điểm Nạp</th>
                  <th className={stickyThCls}>Ghi Chú</th>
                  <th className={`${stickyThCls} text-center`}>Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {forecastVersions.map((ver) => (
                  <tr key={ver.VersionID} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                        {ver.RunDate}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{ver.VersionName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {ver.SourceFileName}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                      {ver.TotalForecastQty.toLocaleString()} kg
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                      {ver.SKUCount}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                      {ver.PlantCount}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {ver.UploadedBy}
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {ver.UploadedAt}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {ver.Notes || '-'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm(`Xác nhận xóa đợt Forecast ngày [${ver.RunDate}]?`)) {
                            onUpdateVersions(forecastVersions.filter((v) => v.VersionID !== ver.VersionID));
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Xóa đợt upload này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* ── 6. MODAL UPLOAD ĐỢT FORECAST MỚI ───────────────────────────────── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-3xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Upload Đợt Dữ Liệu Forecast Mới (RD Matrix)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tự động nhận diện định dạng ma trận tiêu hao nguyên liệu (22 nhà máy) hoặc bảng phẳng.
                </p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Ngày Chạy / Ngày Cập Nhật (DateUpdate) (*)
                </label>
                <input
                  type="date"
                  value={newRunDate}
                  onChange={(e) => setNewRunDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-700 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Tên Đợt / Phiên Bản
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: RD_FC_Matrix_20260826_V1.xlsx"
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Ghi Chú Đợt Chạy
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Điều chỉnh công thức thức ăn heo nái khu vực Miền Nam..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-4 border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50/40 text-center space-y-2">
                <FileSpreadsheet className="w-8 h-8 text-blue-600 mx-auto" />
                <div className="text-xs font-bold text-slate-800">
                  Chọn file Excel dữ liệu Forecast
                </div>
                <p className="text-[10px] text-slate-500">
                  Hỗ trợ các file .xlsx, .xls xuất từ RD hoặc D365 FO (định dạng Ma trận 22 Recipe site).
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Chọn File &amp; Bắt Đầu Nạp
                </button>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
