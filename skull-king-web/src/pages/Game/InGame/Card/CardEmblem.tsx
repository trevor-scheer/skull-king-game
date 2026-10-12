import "./CardEmblem.scss";

export function CardEmblem({ id, number }: { id: string; number?: number }) {
  const numeral =
    id === "wild-15"
      ? "15"
      : id.includes("zero-fourteen")
        ? number === undefined
          ? "0↔14"
          : String(number)
        : id.includes("expansion-")
          ? String(number ?? id.slice(-1))
          : null;

  return (
    <svg
      className="CardEmblem"
      viewBox="0 0 80 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="CardEmblem-ring" cx="40" cy="40" r="35" />
      <path
        className="CardEmblem-ornament"
        d="M40 2v5M40 73v5M2 40h5M73 40h5"
      />
      {numeral !== null ? (
        <>
          <path
            className="CardEmblem-ornament"
            d="m26 18 14-6 14 6M26 62l14 6 14-6"
          />
          <text
            className={`CardEmblem-number${numeral.length > 2 ? " CardEmblem-number--wide" : ""}`}
            x="40"
            y="43"
            dominantBaseline="middle"
            textAnchor="middle"
            stroke="none"
            fill="currentColor"
          >
            {numeral}
          </text>
        </>
      ) : id === "stingray" ? (
        <>
          <path d="M40 22c-6 7-11 12-26 13l12 15 14-7 14 7 12-15c-15-1-20-6-26-13Z" />
          <path d="M40 43c-1 8 9 8 5 18M29 36l5 2m12 0 5-2" />
          <circle cx="37" cy="32" r="1" />
          <circle cx="43" cy="32" r="1" />
          <path className="CardEmblem-ornament" d="m24 41 3 3m26 0 3-3" />
        </>
      ) : id === "davyJones" || id === "loot" ? (
        <>
          <path d="M19 35v24h42V35M19 35h42v-5c0-8-42-8-42 0v5ZM18 38h44M28 26v33M52 26v33" />
          <path d="M36 35h8v10h-8z" />
          <circle cx="40" cy="40" r="1" />
          {id === "loot" ? (
            <>
              <circle cx="33" cy="18" r="4" />
              <circle cx="45" cy="15" r="4" />
              <path d="M33 16v4m12-7v4" />
            </>
          ) : (
            <>
              <path d="M16 64q6-5 12 0t12 0 12 0 12 0M33 18l7 6 7-6M40 12v11" />
            </>
          )}
        </>
      ) : id === "walkThePlank" ? (
        <>
          <path d="M18 25v31M24 25v31M15 29h45v8H24M29 33h26M52 37v9M44 37v7" />
          <path d="M16 57q6-6 12 0t12 0 12 0 12 0M22 64q6-5 12 0t12 0 12 0" />
          <path className="CardEmblem-ornament" d="m55 48-3 4-3-4" />
        </>
      ) : id === "lastVolley" || id === "cannonball" ? (
        <>
          <path d="m23 39 32-13 5 12-32 12zM53 27l-2-5 10-4 9 22-10 4-2-5M22 40l-5-3-4 10 7 2" />
          <circle cx="35" cy="54" r="10" />
          <circle cx="35" cy="54" r="3" />
          <path d="m44 52 10 10H20M23 56l-3 6M61 13l3-5m5 10 6-1M46 22l-2-5" />
        </>
      ) : id === "maryThorne" ? (
        <>
          <path d="m24 57 8-8M22 49l10 10M29 49c11-3 22-12 27-29 3 18-6 29-19 36M26 55l-7 7M17 60l4 4" />
          <path d="m27 23 2-6 2 6 6 2-6 2-2 6-2-6-6-2zM53 53l2-4 2 4 4 2-4 2-2 4-2-4-4-2z" />
        </>
      ) : (
        <>
          <path d="m40 15 6 17 18 8-18 7-6 18-7-18-18-7 18-8zM40 15v50M15 40h49M33 32l13 15m0-15L33 47" />
          {id === "firstMate" && (
            <>
              <path d="m24 18 4-6m28 6-4-6M22 61l5 5m31-5-5 5" />
              <circle cx="40" cy="40" r="4" />
            </>
          )}
        </>
      )}
    </svg>
  );
}
