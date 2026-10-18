# Visual design

Skull King uses an ink, ivory, and brass palette. The card illustrations carry the
pirate theme; navigation and game controls use clear, restrained typography.

## Audit and changes

The October 2026 audit found low-contrast gold text on parchment, decorative type
in navigation and forms, conflicting table layouts, and settings that pushed the
first action below the fold. The redesign replaces those patterns:

- The welcome screen introduces the game with existing card artwork and a clear
  path to setup. Deck presets come before individual card and scoring options.
- The lobby prioritizes joining, crew members, invitations, and starting. Detailed
  rules remain available in a disclosure.
- The active table fills the viewport. Scores open from the Scorecard button;
  rules, sound, autoplay, and seat recovery live in Table options. Dialogs keep
  focus inside, close with Escape, and return focus to their opener. Special
  card choices stay available in focused dialogs.
- The table uses perimeter seats and visible opponent card fans; large crews
  use a row of seats. On phones the opponent row scrolls and follows the active
  seat. Only public hand counts determine the backs. The ink, ivory, and brass
  theme also applies to the table rail.
- Larger hand cards lift, tilt with the pointer, and spread adjacent cards on
  hover or keyboard focus. Phones use tap-to-inspect in a modal followed by an
  explicit play or special-card choice. Wide hands, table content, and scorecards
  scroll within their containers instead of expanding the page.
- Accepted plays travel from the player's seat or selected card to a persistent
  trick area over 720ms. Opponent cards turn from back to face during flight.
  Each bot, delegated seat, and Graybeard decision gets a fresh 1.4-second pause
  (roughly 1.5–2 seconds including the server tick), so consecutive cards remain
  distinct and human turns are immediately available. The final card lands before the winner is highlighted; completed
  tricks gather toward the winner as play advances. Rejected actions keep the
  player's card in hand. Initial loads do not replay historical card motion.
- New games share a 4.5-second visual count-in after the last secret bid is locked.
  The server holds play until the deadline, then reveals bids together; Cannonball
  games proceed to loading. This deadline persists across restarts. Card and turn sounds are
  optional and off by default, controlled in Sound and vibration. The bidding
  ritual is silent.
- Account, recovery, and autoplay tools sit below play. Tutorials, accounts,
  rankings, and results use the same type, spacing, and control treatments.

## Maintain the design

Use DM Sans for controls and body text. Reserve Cinzel for short display headings
and the wordmark. Both fonts are served locally; their OFL licenses live beside
them in `skull-king-web/public/fonts/`.

Use these core colors:

| Purpose         | Color     |
| --------------- | --------- |
| Page background | `#0b1720` |
| Panel surface   | `#142731` |
| Main text       | `#f4efdf` |
| Secondary text  | `#a5b5ba` |
| Brass accent    | `#d9b876` |

Shared Sass constants live in `styles/_variables.scss`. Runtime properties are
emitted once by `styles/_tokens.scss`; global elements live in `index.css` and
page styles stay scoped to their component. Replace obsolete rules instead of
adding another overriding stylesheet.

Keep primary actions distinct, controls at least 44 pixels tall, and keyboard
focus visible. Preserve written status alongside color. Honor reduced motion.
Decorative illustrations must not duplicate accessible text. Never hide game
rules, legal-card guidance, or score explanations to simplify a screen.

## Review a change

Check the welcome screen, setup disclosures, empty and populated lobby, bidding,
a playable turn, trick result, special-card choices, results, tutorial, and
account forms. Include a narrow phone viewport and a typical 1280 × 720 desktop.
Check long player names, a full hand, and the largest supported crew. Inspect
horizontal scrolling and keyboard navigation, then run the existing browser
flows for joins, reconnects, accounts, and rematches.
