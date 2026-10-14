# Noon

A visual timezone planner for distributed teams. See who is awake, free or asleep, find the hour everyone shares, book it, and leave threads and reactions on any block of time.

- Paper-cut day/night sky sized to the real length of day and night where you are
- Team planner with sleep, free, busy and offline blocks, warnings near sleep and on heavy days
- Popover booking with custom time pickers, invites and Slack-style threads with @mentions
- Requests, threads and day management with missed-item reminders
- Welcome tour and guest mode: every timezone tool works without an account
- Accounts and sync on Supabase: signed-in teams, invites, threads and reactions update live for everyone

## Run it

It is a single static file with no build step. Open `index.html`, or serve the folder:

```bash
npx http-server . -p 5177
```

Guests keep their data in the browser's localStorage. Signed-in teams live in Supabase.

## Database

`supabase/schema.sql` is the full schema (tables, row level security, functions, realtime). Run it once in a fresh Supabase project, then put the project URL and publishable key in `index.html` (`SB_URL`, `SB_KEY`). In the Supabase dashboard, add the site's address to Authentication → URL Configuration so confirmation and sign-in links come back to the app.
