import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import path from 'path';
import { fileURLToPath } from 'url';
import uploadRouter from './routes/upload.js';
import projectsRouter from './routes/projects.js';
import shareRouter from './routes/share.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = new Hono();

app.use('*', cors({ origin: '*' }));

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

const PORT = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
