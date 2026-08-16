import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  X,
  FileText,
  MapPin,
  Calendar,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import {
  Dim_Factory,
  Dim_Material,
  InterFactoryTransferSuggestion,
  Language
} from '../types';

interface InterFactoryTransfersProps {
  suggestions: InterFactoryTransferSuggestion[];
  factories: Dim_Factory[];
  materials: Dim_Material[];
  language: Language;
  onExecuteTransfer?: (transfer: any) => void;
}

export const InterFactoryTransfers: React.FC<InterFactoryTransfersProps> = ({
  suggestions,
  factories,
  materials,
  language,
  onExecuteTransfer,
}) => {
  const [createdTransfers, setCreatedTransfers] = useState<any[]>([
    {
      transferId: 'TRF-20260815-001',
      fromFactoryCode: 'DBD',
      fromFactoryName: 'Nhà máy Bình Dương',
      toFactoryCode: 'DDN',
      toFactoryName: 'Nhà máy Đồng Nai',
      materialCode: '2580003',
      materialName: 'L-Threonine 98.5%',
      quantityKg: 3000,
      truckPlate: '61C-458.92',
      driverName: 'Nguyễn Văn Hùng',
      status: 'In_Transit',
      createdAt: '2026-08-15 08:30',
      eta: '2026-08-15 10:15',
    },
  ]);

  const [activeTransferModal, setActiveTransferModal] = useState<InterFactoryTransferSuggestion | null>(null);
  const [truckPlateInput, setTruckPlateInput] = useState('60C-892.31');
  const [driverNameInput, setDriverNameInput] = useState('Trần Văn Bình');
  const [customQty, setCustomQty] = useState<number>(0);
  const [showSlipModal, setShowSlipModal] = useState<any | null>(null);

  const handleOpenTransferModal = (sug: InterFactoryTransferSuggestion) => {
    setActiveTransferModal(sug);
    setCustomQty(sug.RecommendedTransferKg);
  };

  const handleConfirmCreateTransfer = () => {
    if (!activeTransferModal) return;

    const sourceFac = factories.find((f) => f.FactoryID === activeTransferModal.SourceFactoryID);
    const targetFac = factories.find((f) => f.FactoryID === activeTransferModal.TargetFactoryID);

    const newTransfer = {
      transferId: `TRF-${Date.now().toString().substr(6, 6)}`,
      fromFactoryCode: activeTransferModal.SourceFactoryCode,
      fromFactoryName: sourceFac?.FactoryName_VN || activeTransferModal.SourceFactoryCode,
      toFactoryCode: activeTransferModal.TargetFactoryCode,
      toFactoryName: targetFac?.FactoryName_VN || activeTransferModal.TargetFactoryCode,
      materialCode: activeTransferModal.MaterialCode,
      materialName: activeTransferModal.MaterialName,
      quantityKg: customQty,
      truckPlate: truckPlateInput,
      driverName: driverNameInput,
      status: 'Scheduled',
      createdAt: new Date().toISOString().replace('T', ' ').substr(0, 16),
      eta: `Sau ~ ${activeTransferModal.EstimatedTransitHours} giờ`,
    };

    setCreatedTransfers([newTransfer, ...createdTransfers]);
    if (onExecuteTransfer) onExecuteTransfer(newTransfer);

    setActiveTransferModal(null);
    setShowSlipModal(newTransfer);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            <span>Trung Tâm Điều Phối &amp; Cân Bằng Tồn Kho Liên Nhà Máy (Inter-Factory Balancing)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tự động tìm kiếm nhà máy có lượng tồn dư thừa (DOI &gt; 35 ngày) để điều chuyển cứu viện cho nhà máy đang cạn kiệt (DOI &lt; 7 ngày), ưu tiên tối ưu hóa cung đường vận chuyển ngắn nhất.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Cơ hội điều chuyển tức thì:</span>
          <span className="px-3 py-1 text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-xl">
            {suggestions.length} đề xuất khả thi
          </span>
        </div>
      </div>

      {/* Suggested Transfer Opportunities Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          1. Danh sách Đề Xuất Điều Chuyển Tự Động (Auto-Suggested Opportunities)
        </h3>

        {suggestions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
            <p className="font-bold text-slate-900">Không có xung đột tồn kho nào cần điều chuyển!</p>
            <p className="text-xs text-slate-500 mt-1">
              Tất cả các nhà máy đều đang ở mức tồn an toàn hoặc các điểm thiếu hụt đã có lịch PO Inbound bù đắp.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((sug) => (
              <div
                key={sug.id}
                className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                        SKU: {sug.MaterialCode}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{sug.MaterialName}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{sug.Reason}</p>
                  </div>

                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full shrink-0">
                    {sug.Urgency === 'URGENT' ? 'Khẩn cấp' : 'Cần xử lý'}
                  </span>
                </div>

                {/* Transfer Route Visual */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs">
                  {/* Sender */}
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Nhà máy Xuất (Dư)</div>
                    <div className="font-bold text-green-700 font-mono text-sm">
                      {sug.SourceFactoryCode}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Dư thừa: ~{Number(sug.SourceSurplusKg).toLocaleString()} kg ({sug.SourceDOI}d)
                    </div>
                  </div>

                  {/* Route arrow */}
                  <div className="flex flex-col items-center px-2">
                    <span className="text-[10px] text-blue-600 font-mono font-bold">
                      {Number(sug.RecommendedTransferKg).toLocaleString()} kg
                    </span>
                    <div className="flex items-center gap-1 my-1 text-slate-400">
                      <div className="w-6 h-0.5 bg-slate-300"></div>
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <div className="w-6 h-0.5 bg-slate-300"></div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {sug.EstimatedDistanceKm} km • ~{sug.EstimatedTransitHours}h
                    </span>
                  </div>

                  {/* Recipient */}
                  <div className="space-y-0.5 text-right">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Nhà máy Nhận (Thiếu)</div>
                    <div className="font-bold text-red-600 font-mono text-sm">
                      {sug.TargetFactoryCode}
                    </div>
                    <div className="text-[10px] text-red-600 font-mono font-bold">
                      Thiếu hụt: {Number(sug.TargetDeficitKg).toLocaleString()} kg ({sug.TargetDOI}d)
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-500">
                    Ước tính thời gian đến: <strong className="text-green-700 font-bold">~{sug.EstimatedTransitHours} giờ</strong>
                  </div>

                  <button
                    onClick={() => handleOpenTransferModal(sug)}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <span>Lập Phiếu Điều Chuyển</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Created Transfers Log */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
          <span>2. Nhật Ký Các Lệnh Điều Chuyển Đang Thực Hiện (Transfer Orders Status)</span>
          <span className="text-slate-400 font-mono">{createdTransfers.length} phiếu</span>
        </h3>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Mã Phiếu</th>
                <th className="py-3 px-4">Tuyến Điều Chuyển</th>
                <th className="py-3 px-4">Nguyên Liệu</th>
                <th className="py-3 px-4 text-right">Khối Lượng</th>
                <th className="py-3 px-4">Xe Vận Tải &amp; Tài Xế</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-center">In Phiếu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {createdTransfers.map((trf) => (
                <tr key={trf.transferId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">{trf.transferId}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-green-700">{trf.fromFactoryCode}</span>
                    <span className="mx-1.5 text-slate-400">➔</span>
                    <span className="font-bold text-red-600">{trf.toFactoryCode}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {trf.materialName} ({trf.materialCode})
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {Number(trf.quantityKg).toLocaleString()} kg
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    <div>{trf.truckPlate}</div>
                    <div className="text-[10px] text-slate-400">{trf.driverName}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        trf.status === 'In_Transit'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {trf.status === 'In_Transit' ? 'Đang trên đường' : 'Đã lập lệnh'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setShowSlipModal(trf)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                      title="In phiếu điều chuyển"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Transfer Order */}
      {activeTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Lập Lệnh Điều Chuyển Nguyên Liệu Nội Bộ</span>
              </h3>
              <button
                onClick={() => setActiveTransferModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-500 font-medium">Nguyên liệu điều chuyển:</div>
                <div className="font-bold text-slate-900 text-sm">
                  {activeTransferModal.MaterialName} (Mã: {activeTransferModal.MaterialCode})
                </div>
                <div className="text-slate-500 flex items-center gap-2 pt-1 font-semibold">
                  <span>Xuất: <strong className="text-green-700">{activeTransferModal.SourceFactoryCode}</strong></span>
                  <span>➔</span>
                  <span>Nhập: <strong className="text-red-600">{activeTransferModal.TargetFactoryCode}</strong></span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số lượng điều chuyển (Kg):
                </label>
                <input
                  type="number"
                  value={customQty}
                  onChange={(e) => setCustomQty(Number(e.target.value))}
                  className="w-full bg-slate-50 text-slate-900 font-mono font-bold border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Biển số xe:</label>
                  <input
                    type="text"
                    value={truckPlateInput}
                    onChange={(e) => setTruckPlateInput(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 font-mono border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tài xế phụ trách:</label>
                  <input
                    type="text"
                    value={driverNameInput}
                    onChange={(e) => setDriverNameInput(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setActiveTransferModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>

              <button
                onClick={handleConfirmCreateTransfer}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
              >
                Phát Lệnh &amp; Xuất Phiếu Vận Chuyển
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Printable Transfer Slip */}
      {showSlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-base uppercase tracking-tight text-slate-900">
                  PHIẾU ĐIỀU CHUYỂN NGUYÊN LIỆU NỘI BỘ
                </h3>
                <p className="text-xs text-slate-500 font-mono">Mã: {showSlipModal.transferId}</p>
              </div>
              <button
                onClick={() => setShowSlipModal(null)}
                className="text-slate-400 hover:text-slate-800 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Đơn vị xuất:</span>
                  <div className="font-bold text-slate-900">{showSlipModal.fromFactoryName} ({showSlipModal.fromFactoryCode})</div>
                </div>
                <div>
                  <span className="text-slate-500">Đơn vị nhận:</span>
                  <div className="font-bold text-slate-900">{showSlipModal.toFactoryName} ({showSlipModal.toFactoryCode})</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nguyên liệu:</span>
                  <span className="font-bold text-slate-900">{showSlipModal.materialName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã SKU:</span>
                  <span className="font-mono font-bold text-slate-900">{showSlipModal.materialCode}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-slate-100">
                  <span className="font-bold text-slate-900">Khối lượng thực xuất:</span>
                  <span className="font-mono font-black text-blue-600">
                    {Number(showSlipModal.quantityKg).toLocaleString()} kg
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>Xe vận chuyển: <strong>{showSlipModal.truckPlate}</strong></div>
                <div>Tài xế: <strong>{showSlipModal.driverName}</strong></div>
                <div>Thời gian lập: {showSlipModal.createdAt}</div>
                <div>Dự kiến đến: {showSlipModal.eta}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Phiếu (Print)</span>
              </button>

              <button
                onClick={() => setShowSlipModal(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
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
