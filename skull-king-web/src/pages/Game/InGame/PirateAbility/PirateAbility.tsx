import { useEffect, useRef, useState } from "react";
import { useGameId } from "../../../../hooks/useGameId";
import { usePlayerToken } from "../../../../hooks/PlayerTokenContext";
import { PIRATE_NAMES } from "../../../../utils/pirateNames";
import {
  PirateAbilityAction,
  PirateAbilityInput,
  PirateAbilityStateQuery,
  usePirateAbilityStateQuery,
  useResolvePirateAbilityMutation,
} from "../../../../types/graphqlTypes";
import "./PirateAbility.scss";

type State = NonNullable<PirateAbilityStateQuery["state"]>;
type Ability = NonNullable<NonNullable<State["currentRound"]>["pirateAbility"]>;
type AbilityCard = Ability["privateCards"][number];

function cardName(card: AbilityCard) {
  if (card.__typename === "ColoredCard") return `${card.color} ${card.number}`;
  if (card.type === "pirate") return PIRATE_NAMES[card.id] ?? "Pirate";
  const names: Record<string, string> = {
    escape: "Escape",
    tigress: "Tigress",
    skullKing: "Skull King",
    mermaid: "Mermaid",
    kraken: "Kraken",
    whiteWhale: "White Whale",
    loot: "Loot",
  };
  return names[card.type] ?? card.type;
}

export function PirateAbility() {
  const gameId = useGameId();
  const [playerToken] = usePlayerToken();
  const { data, error, refetch } = usePirateAbilityStateQuery({
    variables: { gameId: gameId ?? "", playerToken: playerToken ?? "" },
    skip: !gameId || !playerToken,
    pollInterval: 1000,
  });
  const state = data?.state;
  const ability = state?.currentRound?.pirateAbility;
  if (!gameId || !playerToken) return null;
  if (!ability || !state) {
    return error ? (
      <p role="alert">Couldn’t load the pirate ability. Reconnecting...</p>
    ) : null;
  }
  if (ability.playerId !== state.me?.id) {
    return (
      <p className="PirateAbility-waiting" role="status">
        Waiting for {ability.playerId} to use {ability.name}’s ability.
      </p>
    );
  }
  return (
    <AbilityChoice
      key={ability.id}
      gameId={gameId}
      playerToken={playerToken}
      state={state}
      ability={ability}
      refresh={refetch}
    />
  );
}

function AbilityChoice({
  gameId,
  playerToken,
  state,
  ability,
  refresh,
}: {
  gameId: string;
  playerToken: string;
  state: State;
  ability: Ability;
  refresh: () => Promise<unknown>;
}) {
  const [resolve] = useResolvePirateAbilityMutation();
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  async function choose(input: PirateAbilityInput) {
    if (pending.current) return;
    pending.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await resolve({
        variables: {
          gameId,
          playerToken,
          expectedAbilityId: ability.id,
          input,
        },
      });
      await refresh();
    } catch {
      if (active.current)
        setError("Couldn’t save that choice. Please try again.");
    } finally {
      pending.current = false;
      if (active.current) setSubmitting(false);
    }
  }

  const bid = state.currentRound?.myBid ?? 0;
  const roundNumber = state.currentRound?.roundNumber ?? 0;
  const hand = state.me?.hand ?? [];
  return (
    <section
      className="PirateAbility"
      aria-label={`${ability.name} ability`}
      aria-busy={submitting}
    >
      <h2>{ability.name}</h2>
      {error && <p role="alert">{error}</p>}
      <fieldset disabled={submitting}>
        <legend>Choose your pirate ability</legend>
        {ability.kind === "rosie" && (
          <>
            <p>Choose who leads the next trick, including yourself.</p>
            <div className="PirateAbility-actions">
              {state.players.map((player) => (
                <button
                  key={player.id}
                  onClick={() =>
                    void choose({
                      action: PirateAbilityAction.ChooseLeader,
                      playerId: player.id,
                    })
                  }
                >
                  {player.name}
                </button>
              ))}
            </div>
          </>
        )}
        {ability.kind === "rascal" && (
          <>
            <p>
              Wager on making your bid exactly. Win those points if you do; lose
              them if you miss, under either scoring method.
            </p>
            <div className="PirateAbility-actions">
              {[0, 10, 20].map((amount) => (
                <button
                  key={amount}
                  onClick={() =>
                    void choose({ action: PirateAbilityAction.Wager, amount })
                  }
                >
                  {amount === 0 ? "No wager" : `Wager ${amount} points`}
                </button>
              ))}
            </div>
          </>
        )}
        {ability.kind === "harry" && (
          <>
            <p>
              Your bid is {bid}. Raise it by one, lower it by one, or keep it.
            </p>
            <div className="PirateAbility-actions">
              {[-1, 0, 1].map((amount) => (
                <button
                  key={amount}
                  disabled={bid + amount < 0 || bid + amount > roundNumber}
                  onClick={() =>
                    void choose({
                      action: PirateAbilityAction.AdjustBid,
                      amount,
                    })
                  }
                >
                  {amount === 0 ? `Keep ${bid}` : `Bid ${bid + amount}`}
                </button>
              ))}
            </div>
          </>
        )}
        {ability.kind === "bendt" && ability.stage === "choose" && (
          <>
            <p>Draw two cards, then discard any two from your hand.</p>
            <button
              onClick={() => void choose({ action: PirateAbilityAction.Draw })}
            >
              Draw two cards
            </button>
          </>
        )}
        {ability.kind === "bendt" && ability.stage === "discard" && (
          <>
            <p>
              Choose exactly two cards to discard. These cards stay private.
            </p>
            <div className="PirateAbility-cards">
              {hand.map((card) => (
                <label key={card.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(card.id)}
                    disabled={
                      !selected.includes(card.id) && selected.length === 2
                    }
                    onChange={() =>
                      setSelected((ids) =>
                        ids.includes(card.id)
                          ? ids.filter((id) => id !== card.id)
                          : [...ids, card.id],
                      )
                    }
                  />
                  <span>{cardName(card)}</span>
                </label>
              ))}
            </div>
            <button
              disabled={selected.length !== 2}
              onClick={() =>
                void choose({
                  action: PirateAbilityAction.Discard,
                  cardIds: selected,
                })
              }
            >
              Discard selected cards
            </button>
          </>
        )}
        {ability.kind === "juanita" && ability.stage === "choose" && (
          <>
            <p>
              Privately inspect the undealt cards. The table waits until you
              finish.
            </p>
            <button
              onClick={() =>
                void choose({ action: PirateAbilityAction.Reveal })
              }
            >
              View undealt cards
            </button>
          </>
        )}
        {ability.kind === "juanita" && ability.stage === "view" && (
          <>
            <p>
              Only you can see these {ability.privateCards.length} undealt
              cards.
            </p>
            <ul className="PirateAbility-cards">
              {ability.privateCards.map((card) => (
                <li key={card.id}>{cardName(card)}</li>
              ))}
            </ul>
            <button
              onClick={() =>
                void choose({ action: PirateAbilityAction.Finish })
              }
            >
              Done looking
            </button>
          </>
        )}
        {ability.stage === "choose" &&
          !["rascal", "harry"].includes(ability.kind) && (
            <button
              className="PirateAbility-decline"
              onClick={() =>
                void choose({ action: PirateAbilityAction.Decline })
              }
            >
              Skip ability
            </button>
          )}
      </fieldset>
      {submitting && <p role="status">Saving choice...</p>}
    </section>
  );
}
