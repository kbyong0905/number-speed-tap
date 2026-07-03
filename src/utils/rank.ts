export interface RankTier {
  name: string;
  maxSeconds: number;
  color: string; // Tailwind text color class
  bg: string;    // Tailwind background class
  border: string; // Tailwind border class
}

export const RANK_TIERS: RankTier[] = [
  { name: 'Challenger 🏆', maxSeconds: 10.0, color: 'text-rose-400 font-black tracking-tight', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  { name: 'Immortal 🌌', maxSeconds: 13.0, color: 'text-purple-400 font-black tracking-tight', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { name: 'Radiant ✨', maxSeconds: 16.0, color: 'text-amber-300 font-extrabold', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  { name: 'Diamond 💎', maxSeconds: 19.0, color: 'text-cyan-400 font-extrabold', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { name: 'Platinum 🛡️', maxSeconds: 23.0, color: 'text-teal-400 font-bold', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
  { name: 'Gold 🟡', maxSeconds: 27.0, color: 'text-yellow-500 font-bold', bg: 'bg-yellow-500/5', border: 'border-yellow-500/20' },
  { name: 'Silver ⚪', maxSeconds: 31.0, color: 'text-slate-300 font-semibold', bg: 'bg-slate-500/5', border: 'border-slate-500/15' },
  { name: 'Bronze 🟫', maxSeconds: 35.0, color: 'text-amber-700 font-medium', bg: 'bg-amber-800/5', border: 'border-amber-800/15' },
  { name: 'Iron 🧱', maxSeconds: Infinity, color: 'text-stone-500 font-medium', bg: 'bg-stone-500/5', border: 'border-stone-500/15' },
];

export function getRankByTime(seconds: number): RankTier {
  return RANK_TIERS.find((tier) => seconds <= tier.maxSeconds) || RANK_TIERS[RANK_TIERS.length - 1];
}
