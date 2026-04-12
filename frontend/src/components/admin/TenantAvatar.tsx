const AVATAR_COLORS = [
  'bg-primary-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-600', 'bg-indigo-500',
];

export function TenantAvatar({ name }: { name: string }) {
  const words = name.trim().split(/\s+/);
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm select-none`}>
      {initials}
    </div>
  );
}
