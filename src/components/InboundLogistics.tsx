import React, { useState } from 'react';
import {
  Truck,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Search,
  Plus
} from 'lucide-react';
import {
  Dim_Factory,
  Dim_Material,
  Dim_Supplier,
  Fact_Inbound_Schedule,
  Fact_PO_Detail,
  Fact_PurchaseOrder,
  Language
} from '../types';

interface InboundLogisticsProps {
  inboundSchedules: Fact_Inbound_Schedule[];
  poHeaders: Fact_PurchaseOrder[];
  poDetails: Fact_PO_Detail[];
  factories: Dim_Factory[];
  materials: Dim_Material[];
  suppliers: Dim_Supplier[];
  onReceiveShipment: (scheduleId: string, receivedQty: number) => void;
  language: Language;
}

export const InboundLogistics: React.FC<InboundLogisticsProps> = ({
  inboundSchedules,
  poHeaders,
  poDetails,
  factories,
  materials,
  suppliers,
  onReceiveShipment,
  language,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [receivingModal, setReceivingModal] = useState<Fact_Inbound_Schedule | null>(null);
  const [actualReceivedQty, setActualReceivedQty] = useState<number>(0);
  const [batchNumberInput, setBatchNumberInput] = useState<string>('');

  const handleOpenReceive = (schedule: Fact_Inbound_Schedule) => {
    setReceivingModal(schedule);
    setActualReceivedQty(schedule.PlannedQty);
    setBatchNumberInput(`LOT-${Date.now().toString().substr(6, 6)}`);
  };

  const handleConfirmReceive = () => {
    if (!receivingModal) return;
    onReceiveShipment(receivingModal.ScheduleID, actualReceivedQty);
    setReceivingModal(null);
  };

  const filteredSchedules = inboundSchedules.filter((item) => {
    if (filterStatus === 'IN_TRANSIT' && item.Status !== 'In_Transit') return false;
    if (filterStatus === 'SCHEDULED' && item.Status !== 'Scheduled') return false;
    if (filterStatus === 'RECEIVED' && item.Status !== 'Received' && item.Status !== 'Unloaded') return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        item.TruckPlate.toLowerCase().includes(q) ||
        item.DriverName.toLowerCase().includes(q) ||
        item.ContainerNo.toLowerCase().includes(q) ||
        item.POID.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <span>Theo Dõi Đơn Mua Hàng &amp; Đội Xe Vận Tải Đang Về (Inbound PO &amp; Logistics Hub)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Giám sát thời gian cập cảng, lịch giao xe tải đến từng nhà máy, đồng bộ dữ liệu Inbound PO từ D365 FO để bù đắp chỉ số DOI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700">
            Tổng PO đang mở: <strong className="text-blue-600 font-mono font-bold">{poHeaders.length} đơn</strong>
          </div>
        </div>
      </div>

      {/* Supplier Performance & Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Supplier Network */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
            <span>Nhà Cung Cấp Chiến Lược</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="space-y-2">
            {suppliers.slice(0, 3).map((sup) => (
              <div
                key={sup.SupplierID}
                className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200"
              >
                <div>
                  <div className="font-bold text-slate-900">{sup.SupplierName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {sup.Country} • Lead-time: {sup.LeadTimeDays} ngày
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">
                  {sup.Incoterm}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* In-Transit Deliveries */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
            <span>Tiến Độ Xe Đang Trên Đường</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>Đang lăn bánh trên đường:</span>
              <strong className="text-blue-600 font-mono font-bold">
                {inboundSchedules.filter((s) => s.Status === 'In_Transit').length} chuyến xe
              </strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>Đã lên lịch bốc hàng:</span>
              <strong className="text-amber-600 font-mono font-bold">
                {inboundSchedules.filter((s) => s.Status === 'Scheduled').length} chuyến
              </strong>
            </div>
            <div className="flex justify-between py-1 text-slate-600">
              <span>Đã nhập kho hôm nay:</span>
              <strong className="text-green-600 font-mono font-bold">
                {inboundSchedules.filter((s) => s.Status === 'Received' || s.Status === 'Unloaded').length} chuyến
              </strong>
            </div>
          </div>
        </div>

        {/* Lead-Time Protection */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
            <span>Bảo Hiểm Lead-Time Nhập Khẩu</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Các nguyên liệu Amino Acid và Vitamin nhập khẩu từ Châu Âu &amp; Nhật Bản có lead time từ <strong>25 - 45 ngày</strong>. Hệ thống tự động kích hoạt cảnh báo tái đặt hàng (Reorder Alarm) khi DOI chạm ngưỡng Safety Stock + Lead Time.
          </p>
        </div>
      </div>

      {/* Inbound Schedule Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900">
              Lịch Trình Xe Tải Giao Hàng Chi Tiết (Inbound Fleet Schedule)
            </h3>
            <span className="text-xs font-mono text-slate-400">({filteredSchedules.length} chuyến)</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm biển số xe, tài xế, mã PO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white text-xs text-slate-800 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 w-56 transition-colors"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              {['ALL', 'IN_TRANSIT', 'SCHEDULED', 'RECEIVED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                    filterStatus === st ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL'
                    ? 'Tất cả'
                    : st === 'IN_TRANSIT'
                    ? 'Đang về'
                    : st === 'SCHEDULED'
                    ? 'Đã lên lịch'
                    : 'Đã nhập'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mã Đơn PO</th>
                <th className="py-3 px-4">Nhà Máy Đích</th>
                <th className="py-3 px-4">Biển Số Xe &amp; Container</th>
                <th className="py-3 px-4">Tài Xế Phụ Trách</th>
                <th className="py-3 px-4 text-right">Khối Lượng</th>
                <th className="py-3 px-4 text-center">Ngày Dự Kiến (ETA)</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-center">Thao Tác Nhập Kho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredSchedules.map((sch) => {
                const poDetail = poDetails.find((p) => p.POID === sch.POID);
                const mat = materials.find((m) => m.MaterialID === poDetail?.MaterialID);
                const fac = factories.find((f) => f.FactoryID === poDetail?.FactoryID);
                const isReceivedOrUnloaded = sch.Status === 'Received' || sch.Status === 'Unloaded';

                return (
                  <tr key={sch.ScheduleID} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      <div>{sch.POID}</div>
                      <div className="text-[10px] text-slate-400 font-normal truncate max-w-[140px]">
                        {mat?.Name_VN || 'Nguyên liệu Premix'}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {fac?.InternalCode || 'D365'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-900">{sch.TruckPlate}</div>
                      <div className="text-[10px] text-slate-400">{sch.ContainerNo}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{sch.DriverName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{sch.DriverPhone}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {Number(sch.PlannedQty).toLocaleString()} kg
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-blue-600 font-semibold">
                      {sch.ExpectedDate}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          sch.Status === 'In_Transit'
                            ? 'bg-blue-100 text-blue-700'
                            : sch.Status === 'Scheduled'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {sch.Status === 'In_Transit'
                          ? 'Đang vận chuyển'
                          : sch.Status === 'Scheduled'
                          ? 'Đã lên lịch'
                          : 'Đã nhập kho'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {!isReceivedOrUnloaded ? (
                        <button
                          onClick={() => handleOpenReceive(sch)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded-xl text-[10px] shadow-sm transition-colors cursor-pointer"
                        >
                          Nhập Kho Ngay
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px] font-mono font-semibold">Đã ghi nhận</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Confirm Physical Receiving */}
      {receivingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Ghi Nhận Thực Tế Nhập Kho (Receive Shipment)</span>
              </h3>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-500">Đơn hàng PO:</div>
                <div className="font-bold text-blue-600 text-sm font-mono">{receivingModal.POID}</div>
                <div className="text-slate-600">
                  Xe: {receivingModal.TruckPlate} • Container: {receivingModal.ContainerNo}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số lượng thực nhận tại cân (Kg):
                </label>
                <input
                  type="number"
                  value={actualReceivedQty}
                  onChange={(e) => setActualReceivedQty(Number(e.target.value))}
                  className="w-full bg-slate-50 text-slate-900 font-mono font-bold border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số lô sản xuất của nhà cung cấp (Batch Number):
                </label>
                <input
                  type="text"
                  value={batchNumberInput}
                  onChange={(e) => setBatchNumberInput(e.target.value)}
                  className="w-full bg-slate-50 text-blue-600 font-mono font-bold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setReceivingModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>

              <button
                onClick={handleConfirmReceive}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
              >
                Xác Nhận &amp; Cập Nhật Tồn Kho SOH
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
