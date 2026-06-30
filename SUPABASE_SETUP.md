# Supabase setup for the Share feature

`standalone.html` talks directly to Supabase (REST + Storage) with plain `fetch`.
This file records everything needed to reproduce the backend. The config lives at
the top of `standalone.html`:

```js
var SUPA_URL    = 'https://<project>.supabase.co';
var SUPA_KEY    = '<anon public key>';   // safe to be public; RLS is the guard
var SUPA_BUCKET = 'shots';
```

The **anon** key is meant to be public. Never put the `service_role` / `secret`
key in the client or the repo — it bypasses Row Level Security.

---

## 1. Storage bucket

Create a bucket named exactly **`shots`** with **Public** turned on
(Storage → New bucket → Public bucket ON).

## 2. Database schema, policies, and write-back RPC

Run once in the SQL Editor:

```sql
create table sessions (
  id text primary key,
  annotations jsonb not null,
  image_path text not null,        -- original image (v1)
  image_v2_path text,              -- photographer's new version (v2), nullable
  created_at timestamptz default now()
);
alter table sessions enable row level security;

-- Link-as-secret model: anyone with the app can create a share and read one by id.
create policy "anon insert" on sessions for insert to anon with check (true);
create policy "anon select" on sessions for select to anon using (true);

-- Column-scoped write-back: a viewer can set ONLY image_v2_path, nothing else.
-- Hardened: pinned search_path, schema-qualified, executable by anon only.
create function add_version(sid text, path text) returns void
language sql security definer
set search_path = ''
as $$
  update public.sessions set image_v2_path = path where id = sid;
$$;
revoke execute on function add_version(text, text) from public;
grant execute on function add_version(text, text) to anon;

-- Storage: a public bucket serves reads via the public object URL WITHOUT a
-- SELECT policy. Do NOT add a broad SELECT policy — it would let clients list
-- (enumerate) every file and defeat the unguessable-path model. Only uploads
-- need a policy:
create policy "anon upload shots" on storage.objects
  for insert to anon with check (bucket_id = 'shots');
```

### Security-advisor notes (expected)
After the above, two advisor warnings remain and are **by design** for a
no-login share tool:
- `anon insert` "always true" — anyone with the app can create a share.
- `anon` can execute `add_version` — that's the photographer round-trip.

---

## 3. Auto-expiry: delete shares + files after 8 hours

Storage rows can't be deleted from SQL (`storage.protect_delete()` blocks it), so
file cleanup runs through the Storage API in a scheduled **Edge Function**.

### a. Deploy the function
The code is `supabase/functions/cleanup-shares/index.ts` (in this repo). In the
current Supabase project it was deployed under the dashboard's default function
name **`smart-handler`** — the deployed name is cosmetic, so the steps below use
`smart-handler`. Deploy it either way:

- **Dashboard:** Edge Functions → Deploy a new function (default name
  `smart-handler` is fine) → paste the file contents → Deploy. (`SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — no secrets to add.)
- **CLI:** `supabase functions deploy smart-handler`

Verify with the function's **Send test request** — it should return
`{"ok":true,"deleted":0,"files":0}`.

### b. Schedule it hourly
- **Dashboard (preferred):** Integrations → Cron (or Database → Cron Jobs) →
  Create job → schedule `15 * * * *` → type **Supabase Edge Function** →
  pick `smart-handler`. Auth is wired for you.

- **SQL fallback** (needs `pg_cron` + `pg_net` enabled in Database → Extensions).
  The anon key is public, so it's fine in the cron body; it only authorizes the
  *invoke* — the function uses the service role internally.
  ```sql
  select cron.schedule(
    'cleanup-shares',
    '15 * * * *',
    $$
    select net.http_post(
      url     := 'https://<project>.supabase.co/functions/v1/smart-handler',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <anon public key>'
      ),
      body    := '{}'::jsonb
    );
    $$
  );
  ```

### c. Remove any rows-only cron
If you previously scheduled a SQL-only job, unschedule it so it can't delete a
session row before the function reads that row's file paths:
```sql
select cron.unschedule('expire-old-shares');
```

### Useful checks
```sql
select * from cron.job;                                   -- scheduled jobs
select * from cron.job_run_details order by start_time desc limit 10;  -- run history
```
An expired link then shows **"That share link wasn't found or has expired."**
in the viewer.
