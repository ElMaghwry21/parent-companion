export interface Level {
  level: number;
  name: string;
  emoji: string;
  minPoints: number;
  maxPoints: number;
}

const LEVELS: Level[] = [
  { level: 1, name: 'Beginner', emoji: '🌱', minPoints: 0, maxPoints: 49 },
  { level: 2, name: 'Helper', emoji: '🌟', minPoints: 50, maxPoints: 149 },
  { level: 3, name: 'Star', emoji: '⭐', minPoints: 150, maxPoints: 299 },
  { level: 4, name: 'Superstar', emoji: '🌈', minPoints: 300, maxPoints: 499 },
  { level: 5, name: 'Champion', emoji: '🏆', minPoints: 500, maxPoints: 799 },
  { level: 6, name: 'Legend', emoji: '👑', minPoints: 800, maxPoints: 1199 },
  { level: 7, name: 'Master', emoji: '🔥', minPoints: 1200, maxPoints: Infinity },
];

export function getLevelInfo(points: number): { current: Level; next: Level | null; progress: number } {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (points >= lvl.minPoints) current = lvl;
  }

  const nextIdx = LEVELS.indexOf(current) + 1;
  const next = nextIdx < LEVELS.length ? LEVELS[nextIdx] : null;

  let progress = 100;
  if (next) {
    const rangeTotal = next.minPoints - current.minPoints;
    const rangeCurrent = points - current.minPoints;
    progress = Math.min(100, Math.round((rangeCurrent / rangeTotal) * 100));
  }

  return { current, next, progress };
}
