import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import db from '../db.js';

const router = new Hono();

router.post('/', async (c) => {
  const body = await c.req.json();
  const id = nanoid(10);
  const now = new Date().toISOString();

  const project = {
    ...body,
    id,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(`
    INSERT INTO projects (id, title, media_url, data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, project.title, project.media?.url ?? '', JSON.stringify(project), now, now);

  return c.json(project, 201);
});

router.get('/:id', (c) => {
  const row = db.prepare('SELECT data FROM projects WHERE id = ?').get(c.req.param('id')) as { data: string } | undefined;
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json(JSON.parse(row.data));
});

router.put('/:id', async (c) => {
  const body = await c.req.json();
  const now = new Date().toISOString();
  const updated = { ...body, updatedAt: now };

  const result = db.prepare(`
    UPDATE projects SET title = ?, media_url = ?, data = ?, updated_at = ? WHERE id = ?
  `).run(updated.title, updated.media?.url ?? '', JSON.stringify(updated), now, c.req.param('id'));

  if (result.changes === 0) return c.json({ error: 'Not found' }, 404);
  return c.json(updated);
});

export default router;
