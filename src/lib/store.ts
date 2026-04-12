import { Task, TaskSubmission, Redemption, Reward } from '@/types/parenting';

const TASKS_KEY = 'sp_tasks';
const SUBMISSIONS_KEY = 'sp_submissions';
const REDEMPTIONS_KEY = 'sp_redemptions';

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Tasks
export function getTasks(): Task[] {
  return get<Task[]>(TASKS_KEY, []);
}

export function addTask(task: Task) {
  const tasks = getTasks();
  tasks.push(task);
  set(TASKS_KEY, tasks);
}

export function deleteTask(id: string) {
  set(TASKS_KEY, getTasks().filter(t => t.id !== id));
}

// Submissions
export function getSubmissions(): TaskSubmission[] {
  return get<TaskSubmission[]>(SUBMISSIONS_KEY, []);
}

export function addSubmission(sub: TaskSubmission) {
  const subs = getSubmissions();
  subs.push(sub);
  set(SUBMISSIONS_KEY, subs);
}

export function updateSubmission(id: string, updates: Partial<TaskSubmission>) {
  const subs = getSubmissions().map(s => s.id === id ? { ...s, ...updates } : s);
  set(SUBMISSIONS_KEY, subs);
}

// Points
export function getChildPoints(childId: string): number {
  const approved = getSubmissions().filter(s => s.childId === childId && s.status === 'approved');
  const earned = approved.reduce((sum, s) => sum + s.earnedPoints, 0);
  const spent = getRedemptions().filter(r => r.childId === childId).reduce((sum, r) => sum + r.pointsSpent, 0);
  return earned - spent;
}

// Rewards
export const REWARDS: Reward[] = [
  { id: 'r1', name: 'Extra PlayStation Hour', cost: 100, icon: '🎮' },
  { id: 'r2', name: 'Family Outing', cost: 250, icon: '🏖️' },
  { id: 'r3', name: 'Movie Night Pick', cost: 75, icon: '🎬' },
  { id: 'r4', name: 'Stay Up Late', cost: 50, icon: '🌙' },
  { id: 'r5', name: 'Ice Cream Trip', cost: 60, icon: '🍦' },
];

// Redemptions
export function getRedemptions(): Redemption[] {
  return get<Redemption[]>(REDEMPTIONS_KEY, []);
}

export function addRedemption(redemption: Redemption) {
  const list = getRedemptions();
  list.push(redemption);
  set(REDEMPTIONS_KEY, list);
}
