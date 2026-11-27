# Washim Lab Supabase setup

1. Supabase-e ekta project create korun.
2. SQL Editor-e `supabase/schema.sql` purota run korun. Shesher
   `YOUR_ADMIN_EMAIL` nijer admin email diye replace korun.
3. Authentication > Users theke oi email-er user create korun. SQL-er shesher
   `insert into public.admin_users...` statement-ta abar run korun.
4. Project Settings > API theke Project URL ar Publishable key copy kore
   `supabase-config.js`-e boshan. Service-role key browser code-e diben na.
5. GitHub-e commit ar push korun. Cloudflare-er Git integration deploy shesh korle
   `/admin/` theke login kore upload kora jabe.

Visitor-ra published post login charai dekhte parbe. Draft shudhu admin dekhbe.
Purono static guide-gulo fallback hisebe thakbe.
