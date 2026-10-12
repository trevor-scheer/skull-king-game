# Implemented game roadmap

The game-night roadmap is implemented across the engine, server, and browser.
This replaces the old brainstorming list, which contained stale rules and claims
about missing code. Use tests and the rules documents to assess behavior.

| Area | Delivered |
| --- | --- |
| Rules | Configurable base cards and powers, all expansion cards, Graybeard, Classic/Rascal, Cannonball, schedules, tiebreakers |
| Reliability | Authorized actions, stale-request protection, retry feedback, durable rooms, preserved random state, automatic trick transitions |
| Recovery | Saved guest seats, portable recovery codes, account-linked seats, restart recovery, leave/autoplay and absent-player handling |
| Table | Legal-card guidance, visible bid/trick counts, suit cues, result explanations, scores, public spectators, invites, rematches |
| Learning | Interactive tutorial, in-room rules reference, private-information practice bots |
| Accessibility | Keyboard/touch controls, readable suit labels, responsive table, reduced motion, optional audio and haptics |
| Accounts | Optional credentials, recovery codes, device/session controls, data export/deletion, match history, casual leaderboard |
| Operations | Same-origin serving, bounded HTTP/SSE work, durable storage, Docker, health check, CI, real multi-browser restart test |

## Product and architecture decisions

Guest play remains the default. Accounts add continuity and recorded results;
they are not required to join. Practice and autoplay matches stay out of casual
rankings. There is no competitive rating or claim of cheat-proof play.

The deployment target is one persistent server process. SSE invalidation plus
bounded polling supplies live updates and recovery. Redis, multiple replicas,
and a second subscription transport are unnecessary for that target; adding
replicas requires a separate ownership and transaction design.

Room results and account match history are available. A downloadable replay of
every historical card is not implemented. Offline multiplayer, public chat,
ratings, achievements, and custom artwork were speculative additions in the old
brainstorm, not requirements for the rules-complete game. They are not represented
as delivered features.

## Release checks

Run the commands in [AGENTS.md](AGENTS.md). Verify the browser match across a real
server restart, account seat recovery from another browser, practice exclusion
from rankings, tutorial use on a narrow viewport, and rematch seat continuity.
Use [DEPLOYMENT.md](DEPLOYMENT.md) to configure HTTPS, trusted proxies, persistent
storage, and backups before public hosting. A successful local build does not
publish the game or provision a production host.
