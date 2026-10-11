# Run Skull King

The server serves the built web app and API from one origin. Use Node 24 and the
Yarn version pinned in `package.json`.

## Docker

Copy `.env.example` to `.env`, set `ALLOWED_ORIGINS` to the public origin players
will use, and start the app:

```sh
docker compose up --build -d
```

Open `http://localhost:4000` for a local game. For public hosting, put an HTTPS
reverse proxy in front of port 4000. Allow long-lived responses and disable
proxy buffering for `/events/` so room updates arrive promptly. Set `TRUST_PROXY`
to the exact proxy IP addresses or subnets that may supply forwarded headers;
leave it empty for direct connections. The proxy must overwrite forwarded
address/protocol headers. Production account endpoints require HTTPS, while
local HTTP guest games remain available. Keep the API,
event stream, and web app on the same origin.

Compose stores rooms in the `game-data` volume. Normal restarts and image
rebuilds retain it; `docker compose down --volumes` deletes it. Back up the volume
before upgrades. Checkpoints include private hands and player credentials, so
restrict access to the data directory and its backups. Browser room identities
are stored locally; use the same browser profile to resume a seat.

Run one server process per data directory. Room ownership and update delivery
are process-local: multiple replicas behind a load balancer are not supported.
The health probe at `/health` confirms the HTTP server responds; it does not
certify external storage or game correctness.

## Without Docker

```sh
corepack enable
corepack yarn install --immutable
corepack yarn build
corepack yarn build:web
DATA_DIR=./data ALLOWED_ORIGINS=http://localhost:4000 node skull-king-server/dist/index.js
```

`PORT` defaults to 4000 and `DATA_DIR` defaults to `./data`. `ALLOWED_ORIGINS` is a
comma-separated list of browser origins. Export environment values before
starting Node; the native server does not automatically read `.env`.

For local development, run `yarn watch`, `yarn dev`, and `yarn dev:web` in
separate terminals. Vite proxies API and event requests to port 4000. If the web
app is hosted separately, set `VITE_API_URL` to the full GraphQL URL at web build
time, configure that web origin in `ALLOWED_ORIGINS`, and provide an SPA route
fallback. The same-origin deployment is the simplest supported setup.

## Validation

```sh
corepack yarn test --runInBand
corepack yarn build
corepack yarn codegen
corepack yarn build:web
corepack yarn playwright install chromium
corepack yarn test:e2e
```

Code generation reads the local schema and needs no running server. Commit the
regenerated web types with schema or operation changes. CI checks generation is
current, runs tests and both builds, plays a browser match, and builds the image.

The browser test creates three isolated player sessions. Players follow an
invite link, join, bid, play, and see results through the UI. During bidding it
disconnects a player, restarts the real server with the same checkpoint directory,
and reloads that player's page before finishing the match. It uses a one-card
round with shared victory enabled so completion does not depend on random ties.
The test owns its random-port server and temporary data directory; it does not
need an existing development server. Failure traces and screenshots are written
to `test-results/` and uploaded by CI.

Server boundaries allow at most ten read queries in a batch and one game action
per request. Query depth, expanded fields, event-stream connections, and password
work are bounded. Rate limits use the verified client address and allow multiple
players sharing one household address. Proxy trust follows the
[Express deployment guidance](https://expressjs.com/en/guide/behind-proxies.html).

Room files carry versioned activity metadata, so maintenance saves and restarts
do not extend inactive-room expiry. Older raw checkpoints remain readable. Each
write flushes the file, renames it atomically, and flushes its directory. Failed
pre-commit writes roll actions back; an uncertain directory-flush result removes
the room from service until restart and storage recovery. Account history is
derived from durable checkpoints and can be replayed on restart.
