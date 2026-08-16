import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize Gemini AI Client Server-side
  let ai: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
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

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'PremixTrack Enterprise API',
      timestamp: new Date().toISOString(),
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // AI Advisor Endpoint with Thinking Mode
  app.post('/api/ai/advisor', async (req, res) => {
    try {
      const { prompt, contextData, mode } = req.body;
      const client = getGeminiClient();

      if (!client) {
        return res.status(503).json({
          error: 'Gemini API key is not configured in environment secrets.',
          isMock: true,
          fallbackAnswer: generateFallbackAnalysis(mode, contextData),
        });
      }

      const systemInstruction = `Bạn là Chuyên gia Tư vấn Chuỗi Cung Ứng & Điều Phối Nguyên Liệu Premix Thức Ăn Chăn Nuôi Cao Cấp (Premix & Feed Mill Supply Chain AI Specialist) của PremixTrack.
Nhiệm vụ của bạn là phân tích dữ liệu tồn kho thực tế, dự báo nhu cầu (Forecast D365 FO), đơn hàng đang về (Inbound PO), ngày che phủ (DOI - Days of Inventory), và quy trình chuyển đổi mã nguyên liệu (Planned Substitution).

Quy tắc phân tích:
1. Đánh giá tính cấp thiết dựa trên DOI (DOI < 7 ngày = CỰC KỲ NGUY CẤP, DOI < Safety Stock = CẢNH BÁO THIẾU, DOI > 35 ngày = DƯ THỪA TỒN KHO).
2. Khi đề xuất điều chuyển nội bộ giữa các nhà máy, ưu tiên khoảng cách địa lý ngắn (ví dụ: Bình Dương DBD <-> Đồng Nai DDN chỉ 35km; Vĩnh Long DVL <-> Tiền Giang DTI chỉ 65km; Miền Bắc Hưng Yên DHY <-> Bắc Ninh DBN chỉ 45km).
3. Đề xuất số lượng đặt hàng cụ thể (Reorder Qty) dựa trên Lead time nhà cung cấp và Safety Stock Days.
4. Hướng dẫn lộ trình xả tồn và chuyển đổi công thức đối với các mã "Stop_Usage" (Ví dụ: Vitamin AD3E mã cũ sang mã mới).
5. Trả lời bằng tiếng Việt chuyên nghiệp, súc tích, cấu trúc rõ ràng với các mục (Tình trạng báo động, Nguyên nhân gốc rễ, Giải pháp hành động ngay lập tức, Khuyến nghị dài hạn).`;

      const userContent = `Dữ liệu hệ thống PremixTrack hiện tại:
${JSON.stringify(contextData, null, 2)}

Yêu cầu phân tích:
Chế độ: ${mode || 'GENERAL_ANALYSIS'}
Câu hỏi / Yêu cầu cụ thể: ${prompt || 'Hãy thực hiện đánh giá toàn diện chuỗi cung ứng nguyên liệu premix cho các nhà máy.'}`;

      const response = await client.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: userContent,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const text = response.text || 'Không nhận được phản hồi từ mô hình AI.';
      res.json({ success: true, text });
    } catch (error: any) {
      console.error('Error in /api/ai/advisor:', error);
      res.status(500).json({
        error: error.message || 'Lỗi xử lý Gemini AI',
        fallbackAnswer: generateFallbackAnalysis(req.body?.mode, req.body?.contextData),
      });
    }
  });

  // Fallback analysis generator in case API key is absent during offline test
  function generateFallbackAnalysis(mode: string, contextData: any): string {
    return `### 🚨 BÁO CÁO PHÂN TÍCH CHUỖI CUNG ỨNG & ĐIỀU PHỐI PREMIX (PremixTrack Engine)

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

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PremixTrack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PremixTrack server:', err);
});
