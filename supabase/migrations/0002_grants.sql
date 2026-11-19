-- Newer Supabase projects no longer grant table privileges to the API roles
-- automatically for tables created in the SQL editor. Without this the site
-- fails with "permission denied for table site_settings" (code 42501).
-- The website reads and writes only on the server, with the secret
-- (service_role) key, so that is the only role that needs access.
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.pages, public.site_settings to service_role;
