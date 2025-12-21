## Fantakings dashboard

Next.js App Router project that displays fixtures, standings and special awards for the Fantakings tournament. UI is Tailwind powered and uses Redis to store live match events.

## Local development

```bash
# install dependencies
bun install

# start dev server on http://localhost:3000
bun dev
```

## Environment variables

Create a `.env.local` with the following keys:

- `REDIS_URL` – connection string to the Redis instance that stores match events (e.g. `redis://localhost:6379`).
- `ADMIN_PASSWORD` – password required to unlock the admin console and to authorize match-event writes.

## Admin event console

- Visit `/admin` to access the control room UI.
- Enter the staff password to unlock the panel. The password stays only in the current browser session.
- Pick a match, choose the event type (goals, cards, hugs, etc.) and fill the contextual fields.
- Submit the form to append the event to Redis through `POST /api/events/[matchId]`. The timeline on the right refreshes automatically.

## API summary

- `GET /api/events/[matchId]` – fetch events for a match from Redis.
- `POST /api/events/[matchId]` – append a new event (requires `password` + `event` payload).
- `POST /api/admin/login` – server-side password validation for the admin console.

## Deployment tips

Deploy on any platform that supports Next.js (Vercel recommended). Remember to provide the same `REDIS_URL` and `ADMIN_PASSWORD` values as production environment variables.
