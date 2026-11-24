import path from 'node:path';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { handleConfirmRebeca, handleGetBundle, handleScores } from './api/_lib/rebecaCore.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = process.cwd();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.post('/api/auth/confirm-rebeca', (req: Request, res: Response) => {
    void handleConfirmRebeca(req, res);
  });

  app.get('/api/game/bundle', (req: Request, res: Response) => {
    void handleGetBundle(req, res);
  });

  app.all('/api/scores', (req: Request, res: Response) => {
    void handleScores(req, res);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
