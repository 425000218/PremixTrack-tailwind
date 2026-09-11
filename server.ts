import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './server/routes/index';
import swaggerRoutes from './server/routes/swaggerRoutes';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cookieParser());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Mount API Routers
  app.use('/api', apiRoutes);

  // Mount Swagger UI (Hỗ trợ cả 2 link: /swagger và /api/swagger)
  app.use(swaggerRoutes);
  app.use('/api', swaggerRoutes);

  // Vite development vs production static serve
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
    console.log(`🚀 [PremixTrack] Server is running on http://0.0.0.0:${PORT}`);
    console.log(`📖 [PremixTrack] Swagger API Explorer: http://0.0.0.0:${PORT}/swagger`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PremixTrack server:', err);
});
