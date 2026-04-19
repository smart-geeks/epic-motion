export const TIER_LABELS: Record<string, string> = {
  BASE: 'BASE', T1: 'T1', T2: 'T2', T3: 'T3', T4: 'T4', FULL: 'FULL',
};

export const TIER_COLORS: Record<string, string> = {
  BASE: 'bg-gray-500/15 text-gray-400',
  T1:   'bg-blue-500/15 text-blue-400',
  T2:   'bg-purple-500/15 text-purple-400',
  T3:   'bg-orange-500/15 text-orange-400',
  T4:   'bg-pink-500/15 text-pink-400',
  FULL: 'bg-epic-gold text-black',
};

interface TierBadgeProps {
  tier: string;
}

export default function TierBadge({ tier }: TierBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${TIER_COLORS[tier] ?? TIER_COLORS.T1}`}>
      {TIER_LABELS[tier] ?? tier}
    </span>
  );
}
