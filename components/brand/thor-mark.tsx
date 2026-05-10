export default function ThorMark() {
  return (
    <div className="relative size-10 rounded-xl shadow-soft overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(14px_14px_at_30%_25%,hsl(var(--accent)/0.95),transparent_55%),linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary)/0.75))]" />

      <svg
        className="relative z-10 size-10 p-2 text-white/95"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 4.5a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
        />
        <rect x="10.5" y="14" width="3" height="6" rx="1" />
        <circle cx="12" cy="11.5" r="1.4" />
      </svg>
    </div>
  );
}
