export function Crest({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M24 2 43 13v22L24 46 5 35V13Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="m14 15 5 4 5-8 5 8 5-4-3 12H17Z" fill="currentColor" />
      <path
        d="M17 31h14M20 35h8M24 39v3M9 24h3m24 0h3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
