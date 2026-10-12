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
- The table prioritizes round status, opponents, the current action, and the hand.
  During mobile bidding, the hand appears before the bid controls. Wide hands and
  scorecards scroll within their own containers.
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
