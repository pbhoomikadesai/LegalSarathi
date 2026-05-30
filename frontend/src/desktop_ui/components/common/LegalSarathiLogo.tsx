interface Props {
  size?: number;
  className?: string;
}

export const LegalSarathiLogo = ({ size = 64, className }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    className={className}
    role="img"
    aria-label="LegalSarathi logo"
  >
    {/* Pillar base */}
    <rect x="14" y="50" width="36" height="6" rx="1.5" fill="currentColor" />
    {/* Pillar shaft */}
    <rect x="20" y="22" width="6" height="28" fill="currentColor" />
    <rect x="38" y="22" width="6" height="28" fill="currentColor" />
    {/* Capital */}
    <rect x="16" y="18" width="32" height="5" rx="1" fill="currentColor" />
    {/* Pediment / scales */}
    <path d="M14 18 L32 6 L50 18 Z" fill="currentColor" opacity="0.85" />
    {/* Scale beam */}
    <rect x="30" y="8" width="4" height="2" rx="1" fill="hsl(var(--accent))" />
    {/* Scale pans */}
    <circle cx="22" cy="14" r="2.5" fill="hsl(var(--accent))" />
    <circle cx="42" cy="14" r="2.5" fill="hsl(var(--accent))" />
  </svg>
);
