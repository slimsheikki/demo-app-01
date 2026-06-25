import { Hono } from 'hono';
import busboy from 'busboy';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

const ACCEPTED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/bmp',
  'image/svg+xml',
  'image/tiff',
  'image/heic',
  'image/heif',
]);

const MAX_BYTES = 200 * 1024 * 1024; // 200 MB

const router = new Hono();

router.post('/', async (c) => {
  const req = c.req.raw;
  const contentType = req.headers.get('content-type') ?? '';

  if (!contentType.includes('multipart/form-data')) {
    return c.json({ error: 'Expected multipart/form-data' }, 400);
  }

  return new Promise<Response>((resolve) => {
    const bb = busboy({ headers: { 'content-type': contentType }, limits: { fileSize: MAX_BYTES } });

    let saved = false;

    bb.on('file', (_fieldname, fileStream, info) => {
      const { mimeType, filename } = info;

      if (!ACCEPTED_TYPES.has(mimeType)) {
        fileStream.resume();
        resolve(c.json({ error: `Unsupported file type: ${mimeType}` }, 415));
        return;
      }

      const ext = path.extname(filename) || '.bin';
      const id = nanoid(12);
      const saveName = `${id}${ext}`;
      const savePath = path.join(UPLOADS_DIR, saveName);
      const writer = createWriteStream(savePath);

      fileStream.pipe(writer);

      writer.on('finish', () => {
        if (!saved) {
          saved = true;
          resolve(c.json({ url: `/media/${saveName}`, filename: saveName }));
        }
      });

      writer.on('error', (err) => {
        resolve(c.json({ error: String(err) }, 500));
      });

      fileStream.on('limit', () => {
        writer.destroy();
        resolve(c.json({ error: 'File exceeds 200 MB limit' }, 413));
      });
    });

    bb.on('error', (err) => {
      resolve(c.json({ error: String(err) }, 500));
    });

    // Pipe the raw request body into busboy
    req.body?.pipeTo(
      new WritableStream({
        write(chunk) { bb.write(chunk); },
        close() { bb.end(); },
        abort(err) { bb.destroy(err); },
      })
    );
  });
});

export default router;
