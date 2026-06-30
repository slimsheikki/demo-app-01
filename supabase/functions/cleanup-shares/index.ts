// Supabase Edge Function: cleanup-shares  (deployed as "smart-handler")
//
// Deletes share sessions — and ALL their stored images — once they pass an
// 8-hour TTL. Storage rows can't be deleted via SQL (storage.protect_delete()
// blocks it), so file removal goes through the Storage API.
//
// Files for a session live under "<sessionId>/" — either directly
// (legacy single-image: <sid>/v1.jpg) or one folder per frame
// (projects: <sid>/<frameId>/v1.jpg, /v2.jpg). We list everything under the
// session prefix (recursing one level) so both layouts, plus any orphans, go.
//
// Run it on a schedule (hourly) — see SUPABASE_SETUP.md.

import { createClient } from "jsr:@supabase/supabase-js@2";

const MAX_AGE_HOURS = 8;
const BUCKET = "shots";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 3600_000).toISOString();

  const { data: expired, error } = await supabase
    .from("sessions")
    .select("id")
    .lt("created_at", cutoff);

  if (error) return json({ ok: false, where: "select", error: error.message }, 500);
  if (!expired || expired.length === 0) return json({ ok: true, sessions: 0, files: 0 });

  // Gather every stored file under each expired session's prefix.
  let paths: string[] = [];
  for (const s of expired) {
    paths = paths.concat(await listAllUnder(supabase, s.id + "/"));
  }

  // Delete files via the Storage API (the only allowed path), in chunks.
  for (let i = 0; i < paths.length; i += 100) {
    const { error: delErr } = await supabase.storage.from(BUCKET).remove(paths.slice(i, i + 100));
    if (delErr) return json({ ok: false, where: "storage", error: delErr.message }, 500);
  }

  // Only after the files are gone, remove the session rows.
  const ids = expired.map((s: { id: string }) => s.id);
  const { error: rowErr } = await supabase.from("sessions").delete().in("id", ids);
  if (rowErr) return json({ ok: false, where: "rows", error: rowErr.message }, 500);

  return json({ ok: true, sessions: ids.length, files: paths.length });
});

// List all object paths under a prefix. Storage list() is NOT recursive: folder
// entries come back with id === null, so we descend one level (enough for the
// <sid>/<frameId>/file layout).
async function listAllUnder(supabase: any, prefix: string): Promise<string[]> {
  const out: string[] = [];
  const { data: level1 } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  for (const entry of (level1 || [])) {
    if (entry.id === null) {
      const sub = prefix + entry.name + "/";
      const { data: level2 } = await supabase.storage.from(BUCKET).list(sub, { limit: 1000 });
      for (const file of (level2 || [])) {
        if (file.id !== null) out.push(sub + file.name);
      }
    } else {
      out.push(prefix + entry.name);
    }
  }
  return out;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
