import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import uploadRouter from './routes/upload.js';
import projectsRouter from './routes/projects.js';
import shareRouter from './routes/share.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
const isProd = existsSync(path.join(clientDist, 'index.html'));

const app = new Hono();

app.use('*', cors({ origin: '*' }));

app.get('/api/health', (c) => c.json({ ok: true }));

// Serve uploaded media files
app.use(
  '/media/*',
  serveStatic({
    root: path.join(__dirname, '..', 'uploads'),
    rewriteRequestPath: (p) => p.replace('/media/', '/'),
  })
);

app.route('/api/upload', uploadRouter);
app.route('/api/projects', projectsRouter);
app.route('/api/share', shareRouter);

// In production serve the built React app and handle SPA routing
if (isProd) {
  app.use('/*', serveStatic({ root: clientDist }));

  app.notFound((c) => {
    return c.html(readFileSync(path.join(clientDist, 'index.html'), 'utf-8'));
  });
}

const PORT = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
