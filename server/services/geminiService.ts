import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return ai;
}

export function generateFallbackAnalysis(mode: string, contextData: any): string {
  return `### 📊 BÁO CÁO PHÂN TÍCH CHUỖI CUNG ỨNG & ĐIỀU PHỐI PREMIX (PremixTrack Engine)

#### 1. Các điểm nóng thiếu hụt khẩn cấp (Critical Shortages):
- **Nhà máy Đồng Nai (DDN)**:
  - **L-Threonine 98.5% (Mã 2580003)**: Tồn kho chỉ còn **4.2 ngày** (Tồn 4,200 kg / Dùng 1,000 kg/ngày).
    * *Đơn hàng đang về*: PO-D365-88903 (10,000 kg) dự kiến về ngày **17/08** (Xe 51D-894.22).
    * *Hành động*: Cần bám sát lộ trình xe tải và xem xét điều chuyển gấp **3,000 kg** từ **Nhà máy Bình Dương (DBD)** (nơi đang dư DOI 47.3 ngày, cự ly chỉ 35km).
  - **Phytase 5000 FTU (Mã 2580008)**: Tồn kho nguy cấp **5.0 ngày**. Xe tải 60C-672.15 đang trên đường về cảng Cái Mép.

- **Nhà máy Vĩnh Long (DVL)**:
  - **Vitamin C Phosphate 35% (Mã 2580007)**: Tồn kho chỉ còn **5.6 ngày** do đang vào vụ nuôi thủy sản cao điểm.
    * *Đơn hàng Inbound*: 8,000 kg (PO-D365-88905) cập cảng Cát Lái ngày 19/08.

#### 2. Cơ hội tối ưu điều chuyển nội bộ (Inter-Factory Balancing):
- **L-Threonine**: DBD thừa 26,000 kg -> Điều chuyển 3,000 kg sang DDN (Thời gian vận chuyển ~ 1.5 giờ).
- **Monocalcium Phosphate (MCP)**: DDN dư 185 tấn (DOI 34.5 ngày) -> Hỗ trợ DBD đang thiếu hụt chỉ còn 14.3 ngày tồn kho.

#### 3. Kế hoạch chuyển đổi công thức (Planned Substitution):
- **Vitamin AD3E (Mã cũ 2580005)**: Tồn kho tại DBD còn 1,200 kg. Dự kiến xả hết trong 4 ngày tới và tự động kích hoạt chuyển giao 100% sang mã thế hệ mới **2580006 (Bio-Stab)**.`;
}

export async function analyzeSupplyChainWithAI(
  prompt: string,
  contextData: any,
  mode: string,
  snapshotDate: string = '2026-08-25',
  positionSnapshotData: any = null
): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('GEMINI_NOT_CONFIGURED');
  }

  const systemInstruction = `Bạn là Chuyên gia Cố vấn Chuỗi Cung Ứng Cao Cấp (Senior SCM & Premix AI Advisor) của PremixTrack.

QUY TẮC TRÌNH BÀY HIỆN ĐẠI (MODERN BENTO CARD PRESENTATION):
1. TRỰC DIỆN, NGẮN GỌN & KHÔNG VÒNG VO: Đi thẳng vào câu hỏi của người dùng ngay từ dòng đầu tiên. Không viết văn mở bài dài dòng.
2. CẤU TRÚC PHẢN HỒI THÀNH 3 KHỐI BENTO TRỰC QUAN:

### 🚨 1. ĐIỂM NÓNG CẦN XỬ LÝ NGAY
(Chỉ liệt kê các SKU thực sự nguy cấp DOI < 7 ngày dưới dạng thẻ súc tích, ví dụ:
• [DBD] Bắp 2579: Tồn 12.9 tấn | Tiêu hao: 25.2 T/ngày | DOI: 0.5 ngày (Cạn ngày mai 26/08) | PO: 0 tấn
• [DDN] Bắp 2579: Tồn 10.7 tấn | Tiêu hao: 4.8 T/ngày | DOI: 2.2 ngày (Cạn ngày 27/08) | PO: 0 tấn)

### 🔄 2. SƠ ĐỒ ĐIỀU CHUYỂN NỘI BỘ TỐI ƯU CỰ LY
(Trình bày dạng sơ đồ luồng mũi tên rõ ràng, kèm lý do và số ngày cứu nguy:
• [ DBQ (Tồn 38.4T) ] --( Chuyển 15,000 kg / Cự ly 35km )--> [ DBD ] ➔ Cứu DBD thêm 0.6 ngày, chờ PO
• [ DBQ (Tồn 38.4T) ] --( Chuyển 5,000 kg / Cự ly 35km )--> [ DDN ] ➔ Kéo dài DOI DDN lên 3.2 ngày
• [ HPG2 (Tồn 66.4T) ] --( Chuyển 20,000 kg / Cự ly 45km )--> [ DVP ] ➔ Kéo dài DOI DVP lên 4.5 ngày)

### 📦 3. HÀNH ĐỘNG MUA HÀNG & TỐI ƯU VỐN
• [ Mua Gấp / Expedite ]: Đôn đốc NCC giao trước 30-50T trong PO 95.8T của DBQ về thẳng DBD; phát hành Spot PO mới cho DBD.
• [ Tạm Hoãn / Xả Tồn ]: Tạm dừng PO Barley tại Miền Nam (DHG đang dư 73T, DOI 232 ngày); hoãn PO DCP/Muối tồn > 75 ngày.

3. KHI NGƯỜI DÙNG HỎI CÂU HỎI TÌNH HUỐNG CỤ THỂ (VD: Chi phí vận chuyển, trễ PO, xả tồn AD3E):
- Trả lời ngay phép tính toán và kết quả tài chính/số liệu ở đầu phản hồi.
- Bảng dự toán chi phí ngắn gọn, rõ ràng.`;

  const userContent = `Dữ liệu Ma Trận Vị Thế Cung Ứng Thực Tế (Position Matrix Cut-off: ${snapshotDate}):
${positionSnapshotData ? JSON.stringify(positionSnapshotData, null, 2) : '(Sử dụng dữ liệu contextData)'}

Dữ liệu bổ sung khác:
${JSON.stringify(contextData || {}, null, 2)}

Yêu cầu phân tích:
Chế độ: ${mode || 'POSITION_SCM_ANALYSIS'}
Câu hỏi / Yêu cầu cụ thể: ${prompt || 'Hãy phân tích chi tiết Ma trận Vị thế Cung ứng (Position Matrix) ngày 25/08/2026, chỉ rõ các nhà máy đang có nguy cơ cạn hàng khẩn cấp và đề xuất kế hoạch điều phối nội bộ cũng như xả tồn kho hiệu quả nhất.'}`;

  const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastErr: any = null;

  for (const m of candidateModels) {
    try {
      const response = await client.models.generateContent({
        model: m,
        contents: userContent,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastErr = err;
      console.warn(`Model ${m} failed, trying next candidate...`, err.message || err);
    }
  }

  throw lastErr || new Error('Không nhận được phản hồi từ mô hình AI.');
}
