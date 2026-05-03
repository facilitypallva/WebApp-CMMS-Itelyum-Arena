import { cn } from '@/lib/utils';

type ArenaOsLogoProps = {
  className?: string;
  variant?: 'dark' | 'light';
};

export function ArenaOsLogo({ className, variant = 'dark' }: ArenaOsLogoProps) {
  const textFill = variant === 'light' ? '#FFFFFF' : '#0F172A';

  return (
    <svg
      viewBox="22 0 478 141"
      preserveAspectRatio="xMinYMid meet"
      role="img"
      aria-label="ArenaOS"
      className={cn('block', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M28 96C58 40 88 40 118 96"
        stroke="#2ECC71"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="150"
        y="99"
        fill={textFill}
        fontFamily="Geomanist, Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="72"
        fontWeight="500"
      >
        arenaOS
      </text>
    </svg>
  );
}
