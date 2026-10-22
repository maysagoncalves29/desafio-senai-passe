import { cn } from '@/lib/utils';

const AVATAR_STYLES = [
  'bg-avatar-violet text-avatar-violet-foreground',
  'bg-avatar-pink text-avatar-pink-foreground',
  'bg-avatar-cyan text-avatar-cyan-foreground',
  'bg-avatar-teal text-avatar-teal-foreground',
  'bg-avatar-zinc text-avatar-zinc-foreground',
];

interface ClubAvatarProps {
  id: number;
  name: string;
  className?: string;
}

export function ClubAvatar({ id, name, className }: ClubAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold',
        AVATAR_STYLES[id % AVATAR_STYLES.length],
        className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
