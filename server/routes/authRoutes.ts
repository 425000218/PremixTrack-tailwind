import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { executeQuery } from '../db/queryHelper';
import { authenticateJWT, requireAdmin } from '../middleware/authMiddleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_super_secret_key_123';

// -- USER AUTHENTICATION & LOGIN GATE (dbo.sys_User_Account) ------------------
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui l�ng nh?p d?y d? T�n dang nh?p v� M?t kh?u.' });
    }

    const result = await executeQuery(
      'SELECT UserID, Username, PasswordHash, PlainPasswordPreview, FullName, Email, Phone, Department, Role, FactoryAccess, IsActive FROM dbo.sys_User_Account WHERE LOWER(Username) = LOWER(@Username)',
      { Username: username.trim().toLowerCase() }
    );

    if (!result.success || result.data.length === 0) {
      return res.status(401).json({ success: false, message: 'T�n dang nh?p ho?c m?t kh?u kh�ng ch�nh x�c.' });
    }

    const dbUser = result.data[0];

    if (!dbUser.IsActive) {
      return res.status(403).json({ success: false, message: 'Ti kho?n ny dang b? kha. Vui lng lin h? Qu?n tr? vin (Admin).' });
    }

    let isMatch = false;
    if (dbUser.PasswordHash) {
      isMatch = await bcrypt.compare(password, dbUser.PasswordHash);
    }
    // Fallback logic for legacy unhashed passwords or admin backdoor during dev
    if (!isMatch) {
      isMatch = (dbUser.PlainPasswordPreview && dbUser.PlainPasswordPreview === password) ||
                (password === 'admin@123' && dbUser.Username === 'admin');
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác. Vui lòng thử lại.' });
    }

    const roleMap: Record<string, { role: string; roleNameVN: string; avatarBg: string }> = {
      admin: { role: 'System_Admin', roleNameVN: 'Quản Trị Viên Hệ Thống', avatarBg: 'bg-rose-600' },
      planner: { role: 'Supply_Chain_Manager', roleNameVN: 'Trưởng Phòng Chuỗi Cung Ứng (S&OP)', avatarBg: 'bg-blue-600' },
      factory_manager: { role: 'Factory_Planner', roleNameVN: 'Kỹ Sư Điều Phối Nhà Máy', avatarBg: 'bg-amber-600' },
      buyer: { role: 'Logistics_Officer', roleNameVN: 'Trưởng Bộ Phận Inbound & Mua Hàng', avatarBg: 'bg-emerald-600' },
      viewer: { role: 'Viewer', roleNameVN: 'Kiểm Toán Viên & Xem Báo Cáo', avatarBg: 'bg-slate-600' },
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

    const payload = {
      id: dbUser.UserID,
      username: dbUser.Username,
      role: mapped.role,
      assignedFactoryId
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

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
      token,
      lastLogin: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' hôm nay',
    };

    res.json({ success: true, source: 'MSSQL', user: userPayload });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Lỗi hệ thống xác thực.' });
  }
});

// -- USER MANAGEMENT & PERMISSIONS APIS (dbo.sys_User_Account) ----------------
router.get('/users', authenticateJWT, requireAdmin, async (req, res) => {
  const result = await executeQuery(
    'SELECT UserID, Username, FullName, Email, Phone, Department, Role, PlainPasswordPreview, FactoryAccess, IsActive, CreatedAt, UpdatedAt FROM dbo.sys_User_Account ORDER BY UserID'
  );
  if (result.success && result.data.length > 0) {
    return res.json({ success: true, source: 'MSSQL', data: result.data });
  }
  res.json({ success: true, source: 'FALLBACK_LOCAL', data: [] });
});

router.post('/users', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { UserID, Username, Password, FullName, Email, Phone, Department, Role, FactoryAccess, IsActive } = req.body;
    const newId = UserID || `USR-${Date.now().toString().slice(-4)}`;
    
    const plainPass = Password || '123456';
    const hashedPass = await bcrypt.hash(plainPass, 10);

    const result = await executeQuery(
      `INSERT INTO dbo.sys_User_Account (UserID, Username, PasswordHash, PlainPasswordPreview, FullName, Email, Phone, Department, Role, FactoryAccess, IsActive, CreatedAt, UpdatedAt)
       VALUES (@UserID, @Username, @PasswordHash, @PlainPasswordPreview, @FullName, @Email, @Phone, @Department, @Role, @FactoryAccess, @IsActive, SYSDATETIME(), SYSDATETIME())`,
      {
        UserID: newId,
        Username: Username.trim().toLowerCase(),
        PasswordHash: hashedPass,
        PlainPasswordPreview: plainPass,
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

router.put('/users/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { Password, FullName, Email, Phone, Department, Role, FactoryAccess, IsActive } = req.body;
    
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
      params.PasswordHash = await bcrypt.hash(Password, 10);
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

router.delete('/users/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await executeQuery('DELETE FROM dbo.sys_User_Account WHERE UserID = @UserID', { UserID: userId });
    res.json({ success: result.success, error: result.error });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
