import { supabase } from '@/integrations/supabase/client';

export type TaskRow = {
  id: string;
  created_by: string;
  title: string;
  points: number;
  type: string;
  total_hours: number | null;
  requires_proof: boolean;
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

// Linking
export async function linkChild(childEmail: string, parentId: string) {
  // Find child profile by email
  // Note: We search in profiles where role is child
  // In a real app, we might check auth.users first if email indexing is available
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('role', 'child')
    .ilike('name', `%${childEmail}%`) // Fallback search if email is actually in name or metadata
    .maybeSingle();

  // Since we don't have email in profiles, we assume name might contain it for now
  // OR we rely on a proper Supabase function. 
  // For this project, let's assume we match by NAME or a specific field.
  // UPDATE: Let's assume we add a search for user_id via a dedicated RPC or metadata.
  
  if (error) throw error;
  if (!data) throw new Error("Child account not found. Make sure the child has signed up.");

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ parent_id: parentId })
    .eq('id', data.id);

  if (updateError) throw updateError;
  return data.name;
}

export async function getLinkedChildren(parentId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('parent_id', parentId)
    .eq('role', 'child');
  
  if (error) throw error;
  return data || [];
}

// Tasks
export async function getTasks(parentId?: string): Promise<TaskRow[]> {
  let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
  
  if (parentId) {
    query = query.eq('created_by', parentId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as TaskRow[]) || [];
}

export async function addTask(task: Omit<TaskRow, 'id' | 'created_at'>) {
  const { error } = await supabase.from('tasks').insert(task);
  if (error) throw error;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

// Submissions
export async function getSubmissions(userId: string, role: 'parent' | 'child'): Promise<SubmissionRow[]> {
  let query;
  
  if (role === 'parent') {
    query = supabase.from('task_submissions')
      .select('*, task:tasks!inner(*)')
      .eq('task.created_by', userId);
  } else {
    query = supabase.from('task_submissions')
      .select('*, task:tasks(*)')
      .eq('child_id', userId);
  }

  const { data, error } = await query.order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data as any[]) || [];
}

export async function addSubmission(sub: Omit<SubmissionRow, 'id' | 'submitted_at' | 'task'>) {
  // Proportional Points Logic
  // We need to fetch the task to see if it's time-based
  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', sub.task_id)
    .single();

  let earnedPoints = sub.earned_points;
  if (task && task.type === 'time-based' && task.total_hours && sub.hours_spent) {
    const ratio = sub.hours_spent / task.total_hours;
    earnedPoints = Math.round(task.points * Math.min(ratio, 1));
  }

  const { error } = await supabase.from('task_submissions').insert({
    ...sub,
    earned_points: earnedPoints
  });
  if (error) throw error;
}

export async function updateSubmissionStatus(id: string, status: 'approved' | 'rejected') {
  const { error } = await supabase.from('task_submissions').update({ status }).eq('id', id);
  if (error) throw error;
}

// Behavior
export async function addBehaviorPoints(childId: string, parentId: string, points: number, reason: string) {
  const { error } = await supabase.from('behavior_logs').insert({
    child_id: childId,
    parent_id: parentId,
    points,
    reason
  });
  if (error) throw error;
}

export async function getBehaviorLogs(userId: string, role: 'parent' | 'child') {
  let query = supabase.from('behavior_logs').select('*');
  if (role === 'parent') {
    query = query.eq('parent_id', userId);
  } else {
    query = query.eq('child_id', userId);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as BehaviorLogRow[]) || [];
}

// Points
export async function getChildPoints(childId: string): Promise<number> {
  const [subsRes, redemRes, behaviorRes] = await Promise.all([
    supabase.from('task_submissions').select('earned_points').eq('child_id', childId).eq('status', 'approved'),
    supabase.from('redemptions').select('points_spent').eq('child_id', childId),
    supabase.from('behavior_logs').select('points').eq('child_id', childId),
  ]);

  if (subsRes.error) throw subsRes.error;
  if (redemRes.error) throw redemRes.error;
  if (behaviorRes.error) throw behaviorRes.error;

  const earnedTasks = (subsRes.data || []).reduce((sum, s) => sum + s.earned_points, 0);
  const earnedBehavior = (behaviorRes.data || []).reduce((sum, b) => sum + b.points, 0);
  const spent = (redemRes.data || []).reduce((sum, r) => sum + r.points_spent, 0);
  
  return (earnedTasks + earnedBehavior) - spent;
}

// Redemptions
export async function addRedemption(redemption: Omit<RedemptionRow, 'id' | 'redeemed_at'>) {
  const { error } = await supabase.from('redemptions').insert(redemption);
  if (error) throw error;
}

// Storage
export async function uploadProofImage(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('task-proofs').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('task-proofs').getPublicUrl(path);
  return data.publicUrl;
}
