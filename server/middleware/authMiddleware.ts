import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_super_secret_key_123';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ success: false, message: 'Token đã hết hạn hoặc không hợp lệ.' });
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ success: false, message: 'Yêu cầu xác thực. Vui lòng đăng nhập.' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'System_Admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Truy cập bị từ chối. Cần quyền Quản trị viên hệ thống (System_Admin).' });
  }
};
