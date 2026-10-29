-- Defense in depth on top of RLS: anon never touches outbound_clicks directly; authenticated may only read (admin policy).
revoke all on table public.outbound_clicks from anon;
revoke insert, update, delete, truncate on table public.outbound_clicks from authenticated;
