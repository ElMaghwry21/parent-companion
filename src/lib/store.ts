import { supabase } from '@/integrations/supabase/client';

export type TaskRow = {
  id: string;
  created_by: string;
  title: string;
  points: number;
  type: string;
  total_hours: number | null;
  requires_proof: boolean;
  is_routine: boolean; // New field
  created_at: string;
};

export type SubmissionRow = {
  id: string;
  task_id: string;
  child_id: string;
  status: string;
  hours_spent: number | null;
  earned_points: number;
  proof_image_url: string | null;
  submitted_at: string;
  task?: TaskRow;
};

export type BehaviorLogRow = {
  id: string;
  parent_id: string;
  child_id: string;
  points: number;
  reason: string;
  created_at: string;
};

export type RedemptionRow = {
  id: string;
  child_id: string;
  reward_id: string;
  points_spent: number;
  redeemed_at: string;
};

export interface Reward {
  id: string;
  name: string;
  cost: number;
  icon: string;
}

export const REWARDS: Reward[] = [
  { id: 'r1', name: 'Extra PlayStation Hour', cost: 100, icon: '🎮' },
  { id: 'r2', name: 'Family Outing', cost: 500, icon: '🏖️' },
  { id: 'r3', name: 'Movie Night Pick', cost: 75, icon: '🎬' },
  { id: 'r4', name: 'Stay Up Late (30m)', cost: 50, icon: '🌙' },
  { id: 'r5', name: 'Ice Cream Trip', cost: 60, icon: '🍦' },
  { id: 'r6', name: 'New Video Game', cost: 1000, icon: '🕹️' },
  { id: 'r7', name: 'Fast Food Dinner', cost: 150, icon: '🍔' },
  { id: 'r8', name: 'Sushi Night', cost: 300, icon: '🍣' },
  { id: 'r9', name: 'Skip Chores Day', cost: 200, icon: '🧹' },
  { id: 'r10', name: 'Choice of Music in Car', cost: 40, icon: '🎵' },
  { id: 'r11', name: 'Toy Store Visit ($10)', cost: 120, icon: '🧸' },
  { id: 'r12', name: 'Swimming Pool Day', cost: 180, icon: '🏊' },
];

// Local Storage Helpers
const getLocal = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(`pc_local_${key}`);
  return data ? JSON.parse(data) : defaultValue;
};

const setLocal = <T>(key: string, data: T) => {
  localStorage.setItem(`pc_local_${key}`, JSON.stringify(data));
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// Data Keys
const KEYS = {
  PROFILES: 'profiles',
  TASKS: 'tasks',
  SUBMISSIONS: 'submissions',
  BEHAVIOR: 'behavior',
  REDEMPTIONS: 'redemptions'
};

// Linking
export async function linkChild(childEmail: string, parentId: string) {
  try {
    const { data, error }: any = await supabase
      .from('profiles' as any)
      .select('id, name')
      .eq('role', 'child')
      .ilike('name', `%${childEmail}%`)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Child account not found.");

    const { error: updateError } = await supabase
      .from('profiles' as any)
      .update({ parent_id: parentId } as any)  
      .eq('id', data.id);

    if (updateError) throw updateError;
    return data.name;
  } catch (err) {
    console.warn("Using local linking");
    const profiles = getLocal<any[]>(KEYS.PROFILES, []);
    let child = profiles.find(p => p.role === 'child' && (p.name?.includes(childEmail) || p.email === childEmail));
    
    if (!child) {
      console.log("Auto-creating child for demo");
      child = { 
        id: 'child-' + generateId(), 
        name: childEmail.split('@')[0], 
        email: childEmail.includes('@') ? childEmail : undefined,
        role: 'child', 
        parent_id: parentId,
        is_routine: false 
      };
      profiles.push(child);
    } else {
      child.parent_id = parentId;
      if (childEmail.includes('@')) child.email = childEmail;
    }
    
    setLocal(KEYS.PROFILES, profiles);
    return child.name;
  }
}

export async function getLinkedChildren(parentId: string) {
  const isDemo = !!localStorage.getItem('pc-guest-user');
  if (isDemo) {
    const profiles = getLocal<any[]>(KEYS.PROFILES, []);
    return profiles.filter(p => p.parent_id === parentId && p.role === 'child');
  }

  try {
    const { data, error }: any = await supabase
      .from('profiles' as any)
      .select('*')
      .eq('parent_id' as any, parentId)
      .eq('role', 'child');
    if (error) throw error;
    return data || [];
  } catch (err) {
    const profiles = getLocal<any[]>(KEYS.PROFILES, []);
    return profiles.filter(p => p.parent_id === parentId && p.role === 'child');
  }
}

// Tasks
export async function getTasks(parentId?: string): Promise<TaskRow[]> {
  const isDemo = !!localStorage.getItem('pc-guest-user');
  
  if (isDemo) {
    const tasks = getLocal<TaskRow[]>(KEYS.TASKS, []);
    return parentId ? tasks.filter(t => t.created_by === parentId) : tasks;
  }

  try {
    let query = supabase.from('tasks' as any).select('*').order('created_at', { ascending: false });
    if (parentId) query = query.eq('created_by', parentId);
    const { data, error }: any = await query;
    if (error) throw error;
    return (data as TaskRow[]) || [];
  } catch (err) {
    const tasks = getLocal<TaskRow[]>(KEYS.TASKS, []);
    return parentId ? tasks.filter(t => t.created_by === parentId) : tasks;
  }
}

export async function addTask(task: Omit<TaskRow, 'id' | 'created_at'>) {
  const isDemo = !!localStorage.getItem('pc-guest-user');
  if (isDemo) {
    const tasks = getLocal<TaskRow[]>(KEYS.TASKS, []);
    const newTask = { ...task, id: generateId(), created_at: new Date().toISOString() };
    setLocal(KEYS.TASKS, [...tasks, newTask]);
    return;
  }

  try {
    const { error } = await supabase.from('tasks' as any).insert(task as any);
    if (error) throw error;
  } catch (err) {
    const tasks = getLocal<TaskRow[]>(KEYS.TASKS, []);
    const newTask = { ...task, id: generateId(), created_at: new Date().toISOString() };
    setLocal(KEYS.TASKS, [...tasks, newTask]);
  }
}

export async function deleteTask(id: string) {
  const isDemo = !!localStorage.getItem('pc-guest-user');
  if (isDemo) {
    const tasks = getLocal<TaskRow[]>(KEYS.TASKS, []);
    setLocal(KEYS.TASKS, tasks.filter(t => t.id !== id));
    return;
  }

  try {
    const { error } = await supabase.from('tasks' as any).delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    const tasks = getLocal<TaskRow[]>(KEYS.TASKS, []);
    setLocal(KEYS.TASKS, tasks.filter(t => t.id !== id));
  }
}

// Submissions
export async function getSubmissions(userId: string, role: 'parent' | 'child'): Promise<SubmissionRow[]> {
  const isDemo = !!localStorage.getItem('pc-guest-user');
  if (isDemo) {
    const subs = getLocal<SubmissionRow[]>(KEYS.SUBMISSIONS, []);
    const tasks = getLocal<TaskRow[]>(KEYS.TASKS, []);
    const userSubs = subs.filter(s => role === 'parent' ? true : s.child_id === userId);
    return userSubs.map(s => ({ ...s, task: tasks.find(t => t.id === s.task_id) }));
  }

  try {
    let query;
    if (role === 'parent') {
      query = supabase.from('task_submissions' as any).select('*, task:tasks!inner(*)').eq('task.created_by', userId);
    } else {
      query = supabase.from('task_submissions' as any).select('*, task:tasks(*)').eq('child_id', userId);
    }
    const { data, error }: any = await query.order('submitted_at', { ascending: false });
    if (error) throw error;
    return (data as any[]) || [];
  } catch (err) {
    const subs = getLocal<SubmissionRow[]>(KEYS.SUBMISSIONS, []);
    const tasks = getLocal<TaskRow[]>(KEYS.TASKS, []);
    const userSubs = subs.filter(s => role === 'parent' ? true : s.child_id === userId);
    return userSubs.map(s => ({ ...s, task: tasks.find(t => t.id === s.task_id) }));
  }
}

export async function addSubmission(sub: Omit<SubmissionRow, 'id' | 'submitted_at' | 'task'>) {
  const isDemo = !!localStorage.getItem('pc-guest-user');
  if (isDemo) {
    const subs = getLocal<SubmissionRow[]>(KEYS.SUBMISSIONS, []);
    const newSub = { ...sub, id: generateId(), submitted_at: new Date().toISOString() };
    setLocal(KEYS.SUBMISSIONS, [...subs, newSub]);
    return;
  }

  try {
    const { data: task }: any = await supabase.from('tasks' as any).select('*').eq('id', sub.task_id).single();
    let earnedPoints = sub.earned_points;
    if (task && task.type === 'time-based' && task.total_hours && sub.hours_spent) {
      earnedPoints = Math.round(task.points * Math.min(sub.hours_spent / task.total_hours, 1));
    }
    const { error } = await supabase.from('task_submissions' as any).insert({ ...sub, earned_points: earnedPoints } as any);
    if (error) throw error;
  } catch (err) {
    const subs = getLocal<SubmissionRow[]>(KEYS.SUBMISSIONS, []);
    const newSub = { ...sub, id: generateId(), submitted_at: new Date().toISOString() };
    setLocal(KEYS.SUBMISSIONS, [...subs, newSub]);
  }
}

export async function updateSubmissionStatus(id: string, status: 'approved' | 'rejected') {
  const isDemo = !!localStorage.getItem('pc-guest-user');
  if (isDemo) {
    const subs = getLocal<SubmissionRow[]>(KEYS.SUBMISSIONS, []);
    setLocal(KEYS.SUBMISSIONS, subs.map(s => s.id === id ? { ...s, status } : s));
    return;
  }

  try {
    const { error } = await supabase.from('task_submissions' as any).update({ status } as any).eq('id', id);
    if (error) throw error;
  } catch (err) {
    const subs = getLocal<SubmissionRow[]>(KEYS.SUBMISSIONS, []);
    setLocal(KEYS.SUBMISSIONS, subs.map(s => s.id === id ? { ...s, status } : s));
  }
}

// Behavior
export async function addBehaviorPoints(childId: string, parentId: string, points: number, reason: string) {
  const isDemo = !!localStorage.getItem('pc-guest-user');
  if (isDemo) {
    const logs = getLocal<BehaviorLogRow[]>(KEYS.BEHAVIOR, []);
    const newLog = { id: generateId(), child_id: childId, parent_id: parentId, points, reason, created_at: new Date().toISOString() };
    setLocal(KEYS.BEHAVIOR, [...logs, newLog]);
    return;
  }

  try {
    const { error } = await supabase.from('behavior_logs' as any).insert({ child_id: childId, parent_id: parentId, points, reason } as any);
    if (error) throw error;
  } catch (err) {
    const logs = getLocal<BehaviorLogRow[]>(KEYS.BEHAVIOR, []);
    const newLog = { id: generateId(), child_id: childId, parent_id: parentId, points, reason, created_at: new Date().toISOString() };
    setLocal(KEYS.BEHAVIOR, [...logs, newLog]);
  }
}

export async function getBehaviorLogs(userId: string, role: 'parent' | 'child') {
  const isDemo = !!localStorage.getItem('pc-guest-user');
  if (isDemo) {
    const logs = getLocal<BehaviorLogRow[]>(KEYS.BEHAVIOR, []);
    return logs.filter(l => role === 'parent' ? l.parent_id === userId : l.child_id === userId);
  }

  try {
    let query = supabase.from('behavior_logs' as any).select('*');
    if (role === 'parent') query = query.eq('parent_id', userId);
    else query = query.eq('child_id', userId);
    const { data, error }: any = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data as BehaviorLogRow[]) || [];
  } catch (err) {
    const logs = getLocal<BehaviorLogRow[]>(KEYS.BEHAVIOR, []);
    return logs.filter(l => role === 'parent' ? l.parent_id === userId : l.child_id === userId);
  }
}

// Points
export async function getChildPoints(childId: string): Promise<number> {
  try {
    const [subsRes, redemRes, behaviorRes]: any = await Promise.all([
      supabase.from('task_submissions' as any).select('earned_points').eq('child_id', childId).eq('status', 'approved'),
      supabase.from('redemptions' as any).select('points_spent').eq('child_id', childId),
      supabase.from('behavior_logs' as any).select('points').eq('child_id', childId),
    ]);
    if (subsRes.error) throw subsRes.error;
    const earnedTasks = (subsRes.data || []).reduce((sum: number, s: any) => sum + s.earned_points, 0);
    const earnedBehavior = (behaviorRes.data || []).reduce((sum: number, b: any) => sum + b.points, 0);
    const spent = (redemRes.data || []).reduce((sum: number, r: any) => sum + r.points_spent, 0);
    return (earnedTasks + earnedBehavior) - spent;
  } catch (err) {
    const subs = getLocal<SubmissionRow[]>(KEYS.SUBMISSIONS, []).filter(s => s.child_id === childId && s.status === 'approved');
    const logs = getLocal<BehaviorLogRow[]>(KEYS.BEHAVIOR, []).filter(l => l.child_id === childId);
    const redems = getLocal<RedemptionRow[]>(KEYS.REDEMPTIONS, []).filter(r => r.child_id === childId);
    const earned = subs.reduce((s, c) => s + c.earned_points, 0) + logs.reduce((s, c) => s + c.points, 0);
    const spent = redems.reduce((s, c) => s + c.points_spent, 0);
    return earned - spent;
  }
}

// Redemptions
export async function addRedemption(redemption: Omit<RedemptionRow, 'id' | 'redeemed_at'>) {
  const isDemo = !!localStorage.getItem('pc-guest-user');
  if (isDemo) {
    const redems = getLocal<RedemptionRow[]>(KEYS.REDEMPTIONS, []);
    const newRedem = { ...redemption, id: generateId(), redeemed_at: new Date().toISOString() };
    setLocal(KEYS.REDEMPTIONS, [...redems, newRedem]);
    return;
  }

  try {
    const { error } = await supabase.from('redemptions' as any).insert(redemption as any);
    if (error) throw error;
  } catch (err) {
    const redems = getLocal<RedemptionRow[]>(KEYS.REDEMPTIONS, []);
    const newRedem = { ...redemption, id: generateId(), redeemed_at: new Date().toISOString() };
    setLocal(KEYS.REDEMPTIONS, [...redems, newRedem]);
  }
}

// Storage
export async function uploadProofImage(file: File, userId: string): Promise<string> {
  try {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${generateId()}.${ext}`;
    const { error } = await supabase.storage.from('task-proofs').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('task-proofs').getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    return URL.createObjectURL(file);
  }
}
