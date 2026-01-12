# Skull King Rules Reference

This document serves as a comprehensive reference for the Skull King card game rules. It can be used by AI agents to understand game mechanics and help players.

## Overview

Skull King is a trick-taking card game for 2-6 players. Players bid on how many tricks they will win each round, then play cards to try to meet their bid exactly. The game consists of 10 rounds, with round N dealing N cards to each player.

## Card Types

### Colored Cards (Numbered 1-14)
Four suits with cards numbered 1 to 14:
- **Yellow** - Standard suit
- **Blue** - Standard suit
- **Red** - Standard suit
- **Black** - Trump suit (beats all other colors)

Higher numbers beat lower numbers within the same suit.

### Special Cards

| Card | Quantity | Effect |
|------|----------|--------|
| **Escape** | 5 | Always loses. Cannot win a trick unless all cards are Escapes. |
| **Pirate** | 5 | Beats all numbered cards (including Black). Loses to Skull King. |
| **Tigress** | 1 | Choose when playing: acts as either Escape OR Pirate. |
| **Skull King** | 1 | Beats everything including Pirates. Only loses if all other cards are Escapes. |
| **Mermaid** | 2 | Beats Skull King. Otherwise loses to Pirates and numbered cards. |

## Card Hierarchy (Highest to Lowest)

1. **Skull King** - Wins against everything (except when all others are Escapes)
2. **Mermaid** - Beats Skull King; loses to Pirates and numbered cards
3. **Pirates** (including Tigress as Pirate) - Beat all numbered cards
4. **Black suited cards** - Trump suit, beats other colors (highest number wins)
5. **Trick color cards** - First colored card played sets the trick color (highest number wins)
6. **Other colored cards** - Cannot win if they don't match trick color
7. **Escape** (including Tigress as Escape) - Always loses

### Special Interactions
- If **Skull King** and **Mermaid** are both in the same trick, **Mermaid wins**
- If multiple **Pirates** are played (no Skull King), the **first Pirate played wins**
- If only **Escapes** are played, the **first Escape wins**

## Game Flow

### Setup Phase
1. Players join the game (2-6 players required)
2. Host starts the game when ready

### Round Structure (10 Rounds Total)

Each round follows this sequence:

#### 1. Dealing
- Round 1: 1 card per player
- Round 2: 2 cards per player
- ...
- Round 10: 10 cards per player

#### 2. Bidding Phase
- Each player secretly chooses how many tricks they will win (0 to N, where N is the round number)
- All bids are revealed simultaneously
- Bidding 0 is risky but rewarding if successful

#### 3. Playing Phase
- The **leader** plays the first card of each trick
- Play proceeds clockwise
- Each player must **follow suit** if they have a card of the trick color
- Special cards can always be played
- If you don't have the trick color, you may play any card
- After all players have played, the trick winner is determined
- The trick winner becomes the leader for the next trick

#### 4. Scoring
After all tricks in a round are played, scores are calculated.

## Trick Color Rules

1. The **trick color** is determined by the first **colored card** played
2. Special cards do not set the trick color
3. If all cards played are special cards, there is no trick color
4. Players must follow the trick color if they have a matching card in hand

## Scoring

### Correct Bid (Tricks Won = Tricks Bid)
- **+20 points** per trick won
- Plus any bonus points (see below)

### Incorrect Bid (Tricks Won ≠ Tricks Bid)
- **-10 points** per trick off (difference between bid and actual)

### Zero Bid
- **Correct (won 0 tricks)**: +10 points × round number
- **Incorrect (won any tricks)**: -10 points × round number

### Bonus Points (Only awarded if bid is correct)

| Bonus | Points | Condition |
|-------|--------|-----------|
| Pirate Capture | +30 | Skull King captures a Pirate in the same trick |
| Black 14 | +20 | Win a trick containing the Black 14 |
| Color 14 | +10 | Win a trick containing any other 14 (Yellow, Blue, Red) |

## Strategy Tips

### Bidding
- Count your likely winners: Skull King, Pirates, high Black cards, high cards in your longest suit
- Bidding 0 in early rounds (1-3 cards) can be very profitable
- Be cautious with mid-range cards (7-10); they often lose to higher cards

### Playing
- **Lead with strength**: If you're the leader, play your winning cards early
- **Follow suit strategically**: Sometimes losing a trick on purpose helps meet your bid
- **Watch the escapes**: Escapes are powerful for avoiding unwanted tricks
- **Track the Skull King**: If it hasn't appeared, high Pirates may lose
- **Mermaid timing**: Save Mermaids to counter the Skull King

### Special Card Usage
- **Escape**: Use to duck out of tricks you don't want
- **Pirate**: Strong but vulnerable to Skull King
- **Tigress**: Flexible - can serve as escape or pirate based on situation
- **Skull King**: Guaranteed win (except all Escapes) plus pirate capture bonus
- **Mermaid**: Best used to counter Skull King; otherwise weak

## Card Counts

| Card Type | Count |
|-----------|-------|
| Numbered cards per suit | 14 |
| Total numbered cards | 56 (14 × 4 suits) |
| Escape | 5 |
| Pirate | 5 |
| Tigress | 1 |
| Skull King | 1 |
| Mermaid | 2 |
| **Total Deck** | **70 cards** |

## Winning the Game

After 10 rounds, the player with the highest total score wins. Ties are broken by:
1. Number of correct bids
2. If still tied, players share the victory

## Quick Reference

```
Trick Winner Priority:
1. Skull King (unless countered by Mermaid)
2. Mermaid (if Skull King is present)
3. First Pirate played
4. Highest Black card
5. Highest card matching trick color
6. First Escape (if all Escapes)

Scoring Quick Reference:
- Correct bid: +20 per trick
- Wrong bid: -10 per trick off
- Zero bid correct: +10 × round
- Zero bid wrong: -10 × round
- Pirate capture: +30 per pirate
- Black 14: +20
- Color 14: +10
```
