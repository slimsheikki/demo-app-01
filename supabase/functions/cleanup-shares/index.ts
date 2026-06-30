// Supabase Edge Function: cleanup-shares
//
// Deletes share sessions — and their stored images — once they are older than
// MAX_AGE_HOURS. Storage rows cannot be deleted via SQL (Supabase's
// storage.protect_delete() blocks it), so file removal must go through the
// Storage API, which is what this function does with the service-role client.
//
// Run it on a schedule (hourly) — see SUPABASE_SETUP.md for how to wire the cron.

import { createClient } from "jsr:@supabase/supabase-js@2";

const MAX_AGE_HOURS = 8;
const BUCKET = "shots";

Deno.serve(async () => {
  const supabase = createClient(
    // These are injected into every Edge Function automatically.
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 3600_000).toISOString();

  // 1) Find expired sessions and the exact files they own (v1 + optional v2).
  const { data: expired, error } = await supabase
    .from("sessions")
    .select("id, image_path, image_v2_path")
    .lt("created_at", cutoff);

  if (error) {
    return json({ ok: false, where: "select", error: error.message }, 500);
  }
  if (!expired || expired.length === 0) {
    return json({ ok: true, deleted: 0, files: 0 });
  }

  const paths: string[] = [];
  for (const s of expired) {
    if (s.image_path) paths.push(s.image_path);
    if (s.image_v2_path) paths.push(s.image_v2_path);
  }

  // 2) Delete the files via the Storage API (the only allowed path), in chunks.
  for (let i = 0; i < paths.length; i += 100) {
    const { error: delErr } = await supabase.storage
      .from(BUCKET)
      .remove(paths.slice(i, i + 100));
    if (delErr) return json({ ok: false, where: "storage", error: delErr.message }, 500);
  }

  // 3) Only after the files are gone, remove the session rows.
  const ids = expired.map((s) => s.id);
  const { error: rowErr } = await supabase.from("sessions").delete().in("id", ids);
  if (rowErr) return json({ ok: false, where: "rows", error: rowErr.message }, 500);

  return json({ ok: true, deleted: ids.length, files: paths.length });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
