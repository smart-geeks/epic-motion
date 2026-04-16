interface BadgeProps {
  label: string;
  color?: string | null; // hex, ej "#F8BBD0"
  className?: string;
}

export default function Badge({ label, color, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 text-xs font-inter font-medium rounded-full',
        !color ? 'bg-epic-gold/15 text-epic-gold' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        color
          ? {
              backgroundColor: `${color}25`, // ~15% opacidad
              color,
              border: `1px solid ${color}50`,
            }
          : undefined
      }
    >
      {label}
    </span>
  );
}
