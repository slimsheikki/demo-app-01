# Project State — demo-app-01 (Photo Annotation Tool)

## What this is
A single-file browser photo annotation tool. No build step. Deployed on GitHub Pages from `main`.
- **Live app:** https://slimsheikki.github.io/demo-app-01/standalone.html
- **Repo:** https://github.com/slimsheikki/demo-app-01
- **Main file:** `standalone.html` (~4100 lines, Konva.js 9.3.16 inlined, zero dependencies)
- **Backend:** Supabase (direct browser fetch, no SDK)
- **Dev branch:** `claude/browser-annotation-tool-plan-5g309m` → fast-forwarded to `main` after each phase

## Features — all shipped

| Feature | Status |
|---|---|
| Zoom / pan (trackpad + mouse) | ✅ |
| Freehand draw tool | ✅ |
| Commit stroke → named annotation with comment | ✅ |
| Layers panel (eye toggle, rename, delete) | ✅ |
| Undo / redo (per-frame) | ✅ |
| Color picker | ✅ |
| Brush width slider | ✅ |
| Draggable annotation groups | ✅ |
| Before/after compare slider (v1 vs v2) | ✅ |
| Share link (Supabase, read-only viewer) | ✅ |
| Multi-image project (artboard canvas, per-frame everything) | ✅ |
| Artboard canvas: drag, edge-snap, delete a frame | ✅ |
| Hold-Z zoom tool (click to step, drag to scrub, Alt inverts) | ✅ |
| Light / dark theme with a top-right switch | ✅ |
| Idle-fade: chrome recedes when you stop interacting | ✅ |
| Keyboard shortcut overlay (`?`) | ✅ |
| Share expiry surfaced (countdown + expired state) | ✅ |

## Architecture — key decisions

**Active-frame-as-live-globals:** `imageNode`, `imgW/imgH`, `annotations[]`, `history[]`, `histIndex`, `sourceBlob` always mirror the *active* frame. Other frames hold serialized `snapshot` + decoded `image` only. `switchFrame(i)` serializes outgoing frame and rebuilds from incoming.

**Share format:** `sessions.annotations` is a JSON array (one element per frame):
```json
[{ "frameId": "f0", "imagePath": "shots/<sid>/f0/v1.jpg",
   "imageV2Path": null, "annotations": <snapshotState() output> }]
```
Legacy single-image links store an object (not array) — dual-read in `bootstrapSharedLink`.

**Storage paths:** `shots/<sid>/<frameId>/v1.<ext>` and `/v2-<stamp>.<ext>`. Stamp prevents re-upload collisions.

**No x-upsert:** `supaUpload` uses plain POST (not upsert). Upsert needs UPDATE+SELECT RLS; we only grant INSERT. Paths are unique by construction so upsert is never needed.

**Read-only viewer:** `body.read-only` CSS class hides `#toolbar #colorPicker #newBtn #compareBtn #shareBtn #commitBar #commentBox`. `readOnly` flag gates `setTool` (forces pan), `renderLayersPanel` (skips delete/name-edit), drag handlers, drop/picker.

**Artboard canvas:** replaced the filmstrip in `cfdf0bf`. Artboard chrome (label bar, outline, delete control) exists only when `frames.length > 1`; it is mounted retroactively on frame 0 when a second image arrives and unmounted when dropping back to one. The label bar doubles as the drag handle and carries the delete control (authors only).

**Theming:** `data-theme` on `<html>`, resolved by an inline `<head>` script before the stylesheet so the first paint is correct. Follows `prefers-color-scheme` until the user picks explicitly; only an explicit click writes `localStorage`, so persisting on load can't pin the theme. Colour lives in ~75 role-named tokens; the Konva-drawn artboard chrome reads the same tokens via `getComputedStyle` in `applyThemeToCanvas()`.

**Two constants worth knowing:** `--rail-w` (220px, the shared width of the colour picker + layers panel rail — CLAUDE.md forbids changing it) and `--util-h` (40px, the space the top-right utility bar reserves; everything anchored to that corner offsets by it).

## Supabase config

```js
var SUPA_URL    = 'https://miatkgoiipofazpjdlgz.supabase.co';
var SUPA_KEY    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // anon key — intentionally public
var SUPA_BUCKET = 'shots';
var MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
```

- Bucket: `shots` (public reads ON, no broad SELECT policy to prevent enumeration)
- Table: `sessions` (id, annotations jsonb, image_path text, image_v2_path text, created_at)
- RLS: anon INSERT + anon SELECT
- RPCs: `add_version(sid, path)` (legacy v2), `set_frame_version(sid, frame_id, path)` (per-frame v2)
- Cleanup: Edge Function deployed as `smart-handler`, scheduled hourly at `15 * * * *`
- **Security model:** "anyone with the link" — 32-hex unguessable ID is the gate. Anon key in public repo is expected for Supabase.

## Files

| File | Purpose |
|---|---|
| `standalone.html` | Entire app |
| `supabase/functions/cleanup-shares/index.ts` | Edge Function (deployed as `smart-handler`) |
| `SUPABASE_SETUP.md` | Reproducible backend setup steps |
| `CLAUDE.md` | Standing rules for Claude |
| `PROJECT_STATE.md` | This file |

## CLAUDE.md rules (summary)

- **Always ask for confirmation before starting any work** — no exceptions
- Add clickable live-app link at end of every response where changes were made
- Plan before implementing; one feature at a time
- Do not change layers box width (220px)
- Only check deploy status when explicitly asked
- Anon key is intentionally public; never use service_role key in client/repo

## Known gaps

- The `760px` mobile breakpoint is still duplicated in CSS and twice in JS (`isMobileLayout`).
- Deleting a frame is not undoable (it asks for confirmation when there are annotations to lose).
- No per-frame indicator of which frames have a v2; `body.has-v2` is a single global class driven by the active frame.

## Next feature candidate (discussed, not started)

**Auth + email notifications:**
- Supabase Auth (email/password or magic link)
- `sessions` gets a `user_id` column
- Database webhook on v2 upload → Edge Function → email via Resend (free tier: 3k/month)
- Art director gets an email with the share link when photographer uploads v2
- Significant architectural addition — needs explicit go-ahead before any work starts
