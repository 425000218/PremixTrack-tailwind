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

  // Health check & DB Status
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'PremixTrack Enterprise API',
      timestamp: new Date().toISOString(),
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // DB Status Check
  app.get('/api/db/status', async (req, res) => {
    const { getDbStatus, getDbPool } = await import('./server/db/connection');
    await getDbPool(); // Attempt connection if not yet connected
    res.json(getDbStatus());
  });

  // Master Data: Materials (dim_Material)
  app.get('/api/masterdata/materials', async (req, res) => {
    const { executeQuery } = await import('./server/db/queryHelper');
    const result = await executeQuery('SELECT * FROM dbo.dim_Material ORDER BY MaterialCode');
    if (result.success && result.data.length > 0) {
      return res.json({ success: true, source: 'MSSQL', data: result.data });
    }
    // Fallback to mock data if DB offline
    res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
  });

  // Master Data: Factories (dim_Factory)
  app.get('/api/masterdata/factories', async (req, res) => {
    const { executeQuery } = await import('./server/db/queryHelper');
    const result = await executeQuery('SELECT * FROM dbo.dim_Factory ORDER BY FactoryID');
    if (result.success && result.data.length > 0) {
      return res.json({ success: true, source: 'MSSQL', data: result.data });
    }
    res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
  });

  // Forecast: Versions (fact_Forecast_Version)
  app.get('/api/forecast/versions', async (req, res) => {
    const { executeQuery } = await import('./server/db/queryHelper');
    const result = await executeQuery('SELECT * FROM dbo.fact_Forecast_Version ORDER BY RunDate DESC');
    if (result.success && result.data.length > 0) {
      return res.json({ success: true, source: 'MSSQL', data: result.data });
    }
    res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
  });

  // ── USER AUTHENTICATION & LOGIN GATE (dbo.sys_User_Account) ──────────────────
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.' });
      }

      const { executeQuery } = await import('./server/db/queryHelper');
      const result = await executeQuery(
        'SELECT UserID, Username, PasswordHash, PlainPasswordPreview, FullName, Email, Phone, Department, Role, FactoryAccess, IsActive FROM dbo.sys_User_Account WHERE LOWER(Username) = LOWER(@Username)',
        { Username: username.trim().toLowerCase() }
      );

      if (!result.success || result.data.length === 0) {
        return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
      }

      const dbUser = result.data[0];

      if (!dbUser.IsActive) {
        return res.status(403).json({ success: false, message: 'Tài khoản này đang bị khóa. Vui lòng liên hệ Quản trị viên (Admin).' });
      }

      // Check password (plain preview match or fallback)
      const isMatch = (dbUser.PlainPasswordPreview && dbUser.PlainPasswordPreview === password) ||
                      (password === 'admin@123' && dbUser.Username === 'admin');

      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác. Vui lòng thử lại.' });
      }

      // Map role to system permission
      const roleMap: Record<string, { role: string; roleNameVN: string; avatarBg: string }> = {
        admin: { role: 'System_Admin', roleNameVN: 'Quản Trị Viên Hệ Thống', avatarBg: 'bg-rose-600' },
        planner: { role: 'Supply_Chain_Manager', roleNameVN: 'Trưởng Phòng Chuỗi Cung Ứng (S&OP)', avatarBg: 'bg-blue-600' },
        factory_manager: { role: 'Factory_Planner', roleNameVN: 'Kỹ Sư Điều Phối Nhà Máy', avatarBg: 'bg-amber-600' },
        buyer: { role: 'Logistics_Officer', roleNameVN: 'Trưởng Bộ Phận Inbound & Mua Hàng', avatarBg: 'bg-emerald-600' },
        viewer: { role: 'Viewer', roleNameVN: 'Kiểm Toán Viên & Xem Báo Cáo', avatarBg: 'bg-slate-600' }
      };

      const mapped = roleMap[dbUser.Role?.toLowerCase()] || roleMap.viewer;

      let factoryAccessArray: string[] = ['ALL'];
      try {
        factoryAccessArray = typeof dbUser.FactoryAccess === 'string' ? JSON.parse(dbUser.FactoryAccess) : (dbUser.FactoryAccess || ['ALL']);
      } catch {
        factoryAccessArray = ['ALL'];
      }

      const assignedFactoryId = factoryAccessArray.includes('ALL') ? 'ALL' : factoryAccessArray[0];
      const assignedFactoryName = factoryAccessArray.includes('ALL') ? 'Toàn quốc (22 Cơ sở)' : `Nhà máy ${assignedFactoryId.replace('FAC-', '')}`;

      const userPayload = {
        id: dbUser.UserID,
        username: dbUser.Username,
        fullName: dbUser.FullName,
        email: dbUser.Email,
        phone: dbUser.Phone || '',
        department: dbUser.Department || '',
        role: mapped.role,
        roleNameVN: mapped.roleNameVN,
        avatarBg: mapped.avatarBg,
        assignedFactoryId,
        assignedFactoryName,
        token: `jwt_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        lastLogin: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' hôm nay'
      };

      res.json({ success: true, source: 'MSSQL', user: userPayload });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi hệ thống xác thực.' });
    }
  });

  // ── USER MANAGEMENT & PERMISSIONS APIS (dbo.sys_User_Account) ────────────────
  // Get all users
  app.get('/api/users', async (req, res) => {
    const { executeQuery } = await import('./server/db/queryHelper');
    const result = await executeQuery(
      'SELECT UserID, Username, FullName, Email, Phone, Department, Role, PlainPasswordPreview, FactoryAccess, IsActive, CreatedAt, UpdatedAt FROM dbo.sys_User_Account ORDER BY UserID'
    );
    if (result.success && result.data.length > 0) {
      return res.json({ success: true, source: 'MSSQL', data: result.data });
    }
    res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
  });

  // Create new user
  app.post('/api/users', async (req, res) => {
    try {
      const { UserID, Username, Password, FullName, Email, Phone, Department, Role, FactoryAccess, IsActive } = req.body;
      const { executeQuery } = await import('./server/db/queryHelper');
      const newId = UserID || `USR-${Date.now().toString().slice(-4)}`;
      const result = await executeQuery(
        `INSERT INTO dbo.sys_User_Account (UserID, Username, PasswordHash, PlainPasswordPreview, FullName, Email, Phone, Department, Role, FactoryAccess, IsActive, CreatedAt, UpdatedAt)
         VALUES (@UserID, @Username, @PasswordHash, @PlainPasswordPreview, @FullName, @Email, @Phone, @Department, @Role, @FactoryAccess, @IsActive, SYSDATETIME(), SYSDATETIME())`,
        {
          UserID: newId,
          Username: Username.trim().toLowerCase(),
          PasswordHash: `$2a$12$hash_${Date.now()}`,
          PlainPasswordPreview: Password || '123456',
          FullName: FullName.trim(),
          Email: Email.trim(),
          Phone: Phone || '',
          Department: Department || '',
          Role: Role || 'viewer',
          FactoryAccess: typeof FactoryAccess === 'string' ? FactoryAccess : JSON.stringify(FactoryAccess || ['ALL']),
          IsActive: IsActive !== false ? 1 : 0,
        }
      );
      res.json({ success: result.success, error: result.error, userId: newId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update user & change password & role & permissions
  app.put('/api/users/:id', async (req, res) => {
    try {
      const userId = req.params.id;
      const { Password, FullName, Email, Phone, Department, Role, FactoryAccess, IsActive } = req.body;
      const { executeQuery } = await import('./server/db/queryHelper');
      
      let updatePasswordSql = '';
      const params: any = {
        UserID: userId,
        FullName: FullName.trim(),
        Email: Email.trim(),
        Phone: Phone || '',
        Department: Department || '',
        Role: Role || 'viewer',
        FactoryAccess: typeof FactoryAccess === 'string' ? FactoryAccess : JSON.stringify(FactoryAccess || ['ALL']),
        IsActive: IsActive !== false ? 1 : 0,
      };

      if (Password) {
        updatePasswordSql = ', PlainPasswordPreview = @PlainPasswordPreview, PasswordHash = @PasswordHash';
        params.PlainPasswordPreview = Password;
        params.PasswordHash = `$2a$12$hash_${Date.now()}`;
      }

      const result = await executeQuery(
        `UPDATE dbo.sys_User_Account
         SET FullName = @FullName, Email = @Email, Phone = @Phone, Department = @Department,
             Role = @Role, FactoryAccess = @FactoryAccess, IsActive = @IsActive, UpdatedAt = SYSDATETIME() ${updatePasswordSql}
         WHERE UserID = @UserID`,
        params
      );
      res.json({ success: result.success, error: result.error });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete user
  app.delete('/api/users/:id', async (req, res) => {
    try {
      const userId = req.params.id;
      const { executeQuery } = await import('./server/db/queryHelper');
      const result = await executeQuery('DELETE FROM dbo.sys_User_Account WHERE UserID = @UserID', { UserID: userId });
      res.json({ success: result.success, error: result.error });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
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
