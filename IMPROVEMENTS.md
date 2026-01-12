# Skull King Game - Improvement Roadmap

A comprehensive list of improvements organized by category, from critical fixes to polish items.

---

## Critical Issues

### Missing Game Rules

**Mermaid Cards Not Implemented**
The Skull King rules specify 2 Mermaid cards with unique mechanics:
- Mermaids beat Skull King (captures him for bonus points)
- Mermaids lose to Pirates and all numbered cards
- Mermaids lose to Escapes (both have no value)

This affects:
- `skull-king-core/src/cards.ts` - Add Mermaid card type
- `skull-king-core/src/deck.ts` - Include 2 Mermaids in deck (68→70 cards)
- `skull-king-core/src/game.ts` - Update `determineWinningCard()` logic
- `skull-king-server/src/typeDefs.ts` - Add Mermaid to GraphQL schema
- `skull-king-web/` - Add Mermaid card rendering and assets

### Security Vulnerabilities

**Card Data Privacy**
Currently, the server sends complete hand data for all players in the game state response. Opponents should not be able to see each other's cards.

Fix: Filter hand data in resolvers to only return the requesting player's cards.

**Deck Shuffle Bug**
In `deck.ts`, the seeded shuffle uses a decimal seed (0.3, 0.4) with `Math.floor()`, which always produces 0 for small seeds, resulting in predictable shuffles.

---

## Architecture Improvements

### Real-time Updates
**Replace Polling with GraphQL Subscriptions**
Currently 10+ components poll at 2000ms intervals. This creates unnecessary server load and latency in updates.

Implement:
- WebSocket transport via `graphql-ws`
- Subscription resolvers for game state changes
- PubSub mechanism for broadcasting updates
- Client subscription hooks replacing polling

### API Hardening
- Add input validation layer (before hitting game logic)
- Implement rate limiting
- Add request logging and monitoring
- Disable GraphQL introspection in production
- Add proper authentication/authorization flow

### Code Organization
- Extract inline GraphQL queries to `.graphql` files
- Add GraphQL schema documentation with descriptions
- Create shared types package for server/web GraphQL types
- Consider tRPC for end-to-end type safety (alternative to codegen)

---

## Code Quality

### Developer Tooling
- Configure ESLint with TypeScript rules
- Set up Prettier with consistent formatting
- Add pre-commit hooks (husky + lint-staged)
- CI pipeline for lint/test/build

### Refactoring Needed
- **DRY up `determineWinningCard()`** - Two TODO comments note duplicated logic (lines 279 & 297 in game.ts)
- Remove stale TODO comments (line 408 says "implement endGame" but it's implemented)
- Address all `useGameId() ?? ""` fallback patterns with proper null handling
- Extract card type guards to shared utilities

### Type Safety
- Use GraphQL enums instead of strings for phases, card types
- Stricter typing for player tokens
- Remove `any` types from codebase

---

## Testing

### Current State
- Core logic: ~60% coverage (good)
- Server: 0% coverage
- Web: 0% coverage
- E2E: None

### Improvements Needed
- Add server resolver unit tests
- Add React component tests (React Testing Library)
- Add E2E tests (Playwright or Cypress)
- Integration tests for core + server interaction
- Add negative path / edge case testing
- Set up test coverage reporting

---

## Error Handling

### Current Problems
- 10+ `// TODO: error handling` comments in web components
- Most errors just `console.error()` with no UI feedback
- No React error boundaries
- Network errors cause infinite "Loading..." states
- Invalid tokens fail silently

### Improvements
- Add global error boundary component
- Create error UI components (toast notifications, error states)
- Implement retry logic for transient failures
- Add offline detection and messaging
- Structured error responses from server
- Client-side error tracking (Sentry or similar)

---

## UX / Gameplay

### Game Flow
- **Reconnection handling** - Allow players to rejoin if they refresh or lose connection
- **Spectator mode** - Watch games without playing
- **Game history** - Review previous rounds/tricks
- **Undo/replay** - See animation of what just happened
- **Turn timer** - Optional time limit per turn
- **Game settings** - Configurable options (deck variants, scoring rules)

### Player Experience
- **Better onboarding** - Tutorial or rule explanations
- **Card tooltips** - Explain what each special card does
- **Sound effects** - Card plays, trick wins, round transitions
- **Animations** - Card dealing, playing, trick collection
- **Mobile optimization** - Touch-friendly card selection
- **Keyboard shortcuts** - Quick card play for power users

### Multiplayer
- **Player avatars** - Visual distinction between players
- **In-game chat** - Communication between players
- **Emotes/reactions** - Quick non-verbal communication
- **Private games** - Password-protected rooms
- **Game invites** - Shareable links with player names

### Feedback & Information
- **Bid summary** - Show all bids during play phase
- **Trick count** - Running count of tricks won per player
- **Round summary** - Animated scoring at round end
- **Game log** - Scrollable history of plays
- **Win probability** - Optional stats/analytics

---

## Appearance / UI

### Visual Polish
- **Card artwork** - Custom illustrated cards vs. text-based
- **Card animations** - Smooth transitions for play/collect
- **Table felt texture** - More realistic game surface
- **Player positions** - Better visual arrangement for 2-6 players
- **Responsive cards** - Scale appropriately on all screen sizes

### Theme & Branding
- **Logo/branding** - Custom Skull King logo
- **Loading states** - Themed spinners/skeletons
- **Empty states** - Illustrated empty game list, waiting room
- **Favicon** - Custom icon
- **Dark/light mode** - Theme toggle (foundation exists in CSS vars)

### Accessibility
- **Color blind mode** - Alternative color indicators
- **Screen reader support** - ARIA labels for game state
- **Keyboard navigation** - Full keyboard accessibility
- **Font size options** - Scalable text
- **High contrast mode** - For visibility

### Mobile
- **Touch gestures** - Swipe to play cards
- **Portrait layout** - Optimized for phone orientation
- **PWA support** - Installable web app
- **Offline mode** - At least view past games

---

## Infrastructure

### Deployment
- **Environment configs** - Dev/staging/production
- **Docker setup** - Containerized deployment
- **CI/CD pipeline** - Automated testing and deployment
- **Health checks** - Server monitoring endpoints

### Persistence
- **Database integration** - Replace in-memory storage
- **Game persistence** - Resume games after server restart
- **Player accounts** - Optional registration for stats
- **Leaderboards** - Track win rates and achievements

### Scalability
- **Horizontal scaling** - Multiple server instances
- **Redis for pub/sub** - Distributed game state updates
- **CDN for static assets** - Faster load times
- **Connection pooling** - Efficient resource usage

---

## Documentation

- **API documentation** - GraphQL schema docs
- **Contributing guide** - How to set up and contribute
- **Architecture decision records** - Document key choices
- **Deployment guide** - How to deploy to production
- **Game rules reference** - In-app rules documentation

---

## Improvement Checklist

Track progress by checking items as completed.

### Critical (P0)
- [ ] Implement Mermaid cards (deck, game logic, UI)
- [ ] Fix card data privacy (don't expose opponent hands)
- [ ] Fix deck shuffle seed bug

### High Priority (P1)
- [ ] Add React error boundaries
- [ ] Create error UI components (toasts, error states)
- [ ] Set up ESLint + Prettier
- [ ] Add server resolver tests
- [ ] Implement GraphQL subscriptions (replace polling)
- [ ] Add input validation to server

### Medium Priority (P2)
- [ ] Add E2E tests (Playwright)
- [ ] Add React component tests
- [ ] Refactor `determineWinningCard()` (DRY)
- [ ] Clean up stale TODO comments
- [ ] Add pre-commit hooks (husky)
- [ ] Use GraphQL enums for string fields
- [ ] Add reconnection handling
- [ ] Improve mobile responsiveness

### Lower Priority (P3)
- [ ] Add card tooltips
- [ ] Implement sound effects
- [ ] Add card animations
- [ ] Create spectator mode
- [ ] Add in-game chat
- [ ] Implement game history view
- [ ] Add player avatars
- [ ] Create dark/light theme toggle
- [ ] Add keyboard shortcuts

### Future Enhancements (P4)
- [ ] Database persistence (replace in-memory)
- [ ] Player accounts and authentication
- [ ] Leaderboards and statistics
- [ ] PWA support
- [ ] Tutorial/onboarding flow
- [ ] Custom card artwork
- [ ] Private games with passwords
- [ ] Turn timer option
- [ ] Accessibility improvements (a11y audit)
- [ ] Docker deployment setup
- [ ] CI/CD pipeline

---

*Last updated: January 2026*
