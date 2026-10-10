import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import apiRouter from './server/api.ts';
import { getDatabase } from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Body and cookie parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Initialize SQLite database
  await getDatabase();
  console.log('[Pabna Bus Guide] SQLite Database initialized successfully.');

  // Mount API router
  app.use('/api', apiRouter);

  if (!isProduction) {
    // Development mode: mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Pabna Bus Guide] Vite middleware mounted in dev mode.');
  } else {
    // Production mode: serve static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Pabna Bus Guide] Serving static assets from dist/.');
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Pabna Bus Guide] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Pabna Bus Guide] Failed to start server:', err);
  process.exit(1);
});
