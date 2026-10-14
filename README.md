# Noon

A visual timezone planner for distributed teams. See who is awake, free or asleep, find the hour everyone shares, book it, and leave threads and reactions on any block of time.

- Paper-cut day/night sky sized to the real length of day and night where you are
- Team planner with sleep, free, busy and offline blocks, warnings near sleep and on heavy days
- Popover booking with custom time pickers, invites and Slack-style threads with @mentions
- Requests, threads and day management with missed-item reminders
- Guest mode, welcome tour, and local sign up / log in (preview build: accounts live in the browser)

## Run it

It is a single static file with no build step. Open `index.html`, or serve the folder:

```bash
npx http-server . -p 5177
```

Data is stored in the browser's localStorage.
