-- Twice-daily Ticketmaster sync via pg_cron + pg_net.
-- Credentials are read from Vault at run time so no secret is stored in version control.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('sync-ticketmaster-events')
where exists (
        select 1
        from cron.job
        where jobname = 'sync-ticketmaster-events'
    );

select cron.schedule(
        'sync-ticketmaster-events',
        '15 6,18 * * *',
        $$
        select net.http_post(
            url := (
                select decrypted_secret
                from vault.decrypted_secrets
                where name = 'project_url'
            ) || '/functions/v1/sync-ticketmaster-events',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-qcs-sync-secret', (
                    select decrypted_secret
                    from vault.decrypted_secrets
                    where name = 'qcs_ticketmaster_sync_secret'
                )
            ),
            body := '{}'::jsonb,
            timeout_milliseconds := 120000
        ) as request_id;
        $$
    );
