import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import db from '../db.js';

const router = new Hono();

router.post('/', async (c) => {
  const { projectId, canAnnotate = false } = await c.req.json();

  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
  if (!project) return c.json({ error: 'Project not found' }, 404);

  const token = nanoid(8);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO share_tokens (token, project_id, can_annotate, created_at)
    VALUES (?, ?, ?, ?)
  `).run(token, projectId, canAnnotate ? 1 : 0, now);

  return c.json({ token }, 201);
});

router.get('/:token', (c) => {
  const row = db.prepare(`
    SELECT p.data, s.can_annotate
    FROM share_tokens s
    JOIN projects p ON p.id = s.project_id
    WHERE s.token = ?
  `).get(c.req.param('token')) as { data: string; can_annotate: number } | undefined;

  if (!row) return c.json({ error: 'Share link not found' }, 404);

  const project = JSON.parse(row.data);
  return c.json({ project, canAnnotate: row.can_annotate === 1 });
});

export default router;
