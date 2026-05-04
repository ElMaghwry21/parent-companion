import { supabase } from '@/integrations/supabase/client';

export type TaskRow = {
  id: string;
  created_by: string;
  title: string;
  points: number;
  type: string;
  total_hours: number | null;
  requires_proof: boolean;
  is_routine: boolean;
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
  status: 'pending' | 'fulfilled';
  reward?: Reward;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export interface Reward {
  id: string;
  name: string;
  cost: number;
  icon: string;
  created_by: string;
}

export const DEFAULT_REWARDS: Reward[] = [
  { id: 'r1', name: 'Extra PlayStation Hour', cost: 100, icon: '🎮', created_by: 'system' },
  { id: 'r2', name: 'Family Outing', cost: 500, icon: '🏖️', created_by: 'system' },
  { id: 'r3', name: 'Movie Night Pick', cost: 75, icon: '🎬', created_by: 'system' },
  { id: 'r4', name: 'Stay Up Late (30m)', cost: 50, icon: '🌙', created_by: 'system' },
  { id: 'r5', name: 'Ice Cream Trip', cost: 60, icon: '🍦', created_by: 'system' },
  { id: 'r6', name: 'New Video Game', cost: 1000, icon: '🕹️', created_by: 'system' },
  { id: 'r7', name: 'Fast Food Dinner', cost: 150, icon: '🍔', created_by: 'system' },
  { id: 'r8', name: 'Sushi Night', cost: 300, icon: '🍣', created_by: 'system' },
  { id: 'r9', name: 'Skip Chores Day', cost: 200, icon: '🧹', created_by: 'system' },
  { id: 'r10', name: 'Choice of Music in Car', cost: 40, icon: '🎵', created_by: 'system' },
  { id: 'r11', name: 'Toy Store Visit ($10)', cost: 120, icon: '🧸', created_by: 'system' },
  { id: 'r12', name: 'Swimming Pool Day', cost: 180, icon: '🏊', created_by: 'system' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

// Linking
export async function linkChild(childEmail: string, parentId: string) {
  // Search by email (assuming we'll add it) or exact name for now
  const { data, error }: any = await supabase
    .from('profiles' as any)
    .select('id, name')
    .eq('role', 'child')
    .or(`email.eq.${childEmail},name.eq.${childEmail}`)
    .maybeSingle();
  
  if (error) throw error;
  if (!data) throw new Error("Child account not found. Make sure the email/name is correct.");

  const { error: updateError } = await supabase
    .from('profiles' as any)
    .update({ parent_id: parentId } as any)  
    .eq('id', data.id);

  if (updateError) throw updateError;
  return data.name;
}

export async function getLinkedChildren(parentId: string) {
  const { data, error }: any = await supabase
    .from('profiles' as any)
    .select('*')
    .eq('parent_id' as any, parentId)
    .eq('role', 'child');
  if (error) throw error;
  return data || [];
}

// Tasks
export async function getTasks(parentId?: string): Promise<TaskRow[]> {
  if (!parentId) {
    console.warn("getTasks called without parentId, returning empty array to prevent leaks");
    return [];
  }
  const { data, error }: any = await supabase
    .from('tasks' as any)
    .select('*')
    .eq('created_by', parentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as TaskRow[]) || [];
}

export async function addTask(task: Omit<TaskRow, 'id' | 'created_at'>) {
  const { error } = await supabase.from('tasks' as any).insert(task as any);
  if (error) throw error;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks' as any).delete().eq('id', id);
  if (error) throw error;
}

// Submissions
export async function getSubmissions(userId: string, role: 'parent' | 'child'): Promise<SubmissionRow[]> {
  let query;
  if (role === 'parent') {
    query = supabase.from('task_submissions' as any)
      .select('*, task:tasks!inner(*)')
      .eq('task.created_by', userId);
  } else {
    query = supabase.from('task_submissions' as any)
      .select('*, task:tasks(*)')
      .eq('child_id', userId);
  }
  const { data, error }: any = await query.order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data as any[]) || [];
}

export async function addSubmission(sub: Omit<SubmissionRow, 'id' | 'submitted_at' | 'task'>) {
  const { data: task, error: taskError }: any = await supabase.from('tasks' as any).select('*').eq('id', sub.task_id).single();
  if (taskError) throw taskError;

  let earnedPoints = sub.earned_points;
  if (task && task.type === 'time-based' && task.total_hours && sub.hours_spent) {
    earnedPoints = Math.round(task.points * Math.min(sub.hours_spent / task.total_hours, 1));
  }
  const { error } = await supabase.from('task_submissions' as any).insert({ ...sub, earned_points: earnedPoints } as any);
  if (error) throw error;
}

export async function updateSubmissionStatus(id: string, status: 'approved' | 'rejected') {
  const { error } = await supabase.from('task_submissions' as any).update({ status } as any).eq('id', id);
  if (error) throw error;
}

// Behavior
export async function addBehaviorPoints(childId: string, parentId: string, points: number, reason: string) {
  const { error } = await supabase.from('behavior_logs' as any).insert({ child_id: childId, parent_id: parentId, points, reason } as any);
  if (error) throw error;
}

export async function getBehaviorLogs(userId: string, role: 'parent' | 'child') {
  let query = supabase.from('behavior_logs' as any).select('*');
  if (role === 'parent') query = query.eq('parent_id', userId);
  else query = query.eq('child_id', userId);
  const { data, error }: any = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as BehaviorLogRow[]) || [];
}

// Points
export async function getChildPoints(childId: string): Promise<number> {
  const [subsRes, redemRes, behaviorRes]: any = await Promise.all([
    supabase.from('task_submissions' as any).select('earned_points').eq('child_id', childId).eq('status', 'approved'),
    supabase.from('redemptions' as any).select('points_spent').eq('child_id', childId),
    supabase.from('behavior_logs' as any).select('points').eq('child_id', childId),
  ]);
  if (subsRes.error) throw subsRes.error;
  if (redemRes.error) throw redemRes.error;
  if (behaviorRes.error) throw behaviorRes.error;

  const earnedTasks = (subsRes.data || []).reduce((sum: number, s: any) => sum + s.earned_points, 0);
  const earnedBehavior = (behaviorRes.data || []).reduce((sum: number, b: any) => sum + b.points, 0);
  const spent = (redemRes.data || []).reduce((sum: number, r: any) => sum + r.points_spent, 0);
  return (earnedTasks + earnedBehavior) - spent;
}

// Redemptions
export async function getRedemptions(parentId: string): Promise<RedemptionRow[]> {
  const children = await getLinkedChildren(parentId);
  const childIds = children.map((c: any) => c.id);
  if (childIds.length === 0) return [];

  const { data, error }: any = await supabase
    .from('redemptions' as any)
    .select('*, reward:rewards(*)')
    .in('child_id', childIds)
    .order('redeemed_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addRedemption(redemption: Omit<RedemptionRow, 'id' | 'redeemed_at' | 'status'>) {
  const { error } = await supabase.from('redemptions' as any).insert({ ...redemption, status: 'pending' } as any);
  if (error) throw error;
}

export async function updateRedemptionStatus(id: string, status: 'pending' | 'fulfilled') {
  const { error } = await supabase.from('redemptions' as any).update({ status } as any).eq('id', id);
  if (error) throw error;
}

// Rewards
export async function getRewards(userId: string, role: 'parent' | 'child' = 'parent'): Promise<Reward[]> {
  let parentId = userId;
  
  if (role === 'child') {
    const { data } = await supabase.from('profiles').select('parent_id').eq('user_id', userId).maybeSingle();
    parentId = data?.parent_id || userId;
  }

  const { data, error }: any = await supabase
    .from('rewards' as any)
    .select('*')
    .or(`created_by.eq.system,created_by.eq.${parentId}`);
  
  if (error) throw error;
  if (!data || data.length === 0) return DEFAULT_REWARDS;
  return data;
}

export async function addReward(reward: Omit<Reward, 'id'>) {
  const { error } = await supabase.from('rewards' as any).insert(reward as any);
  if (error) throw error;
}

export async function deleteReward(id: string) {
  const { error } = await supabase.from('rewards' as any).delete().eq('id', id);
  if (error) throw error;
}

// Notifications
export async function getNotifications(userId: string): Promise<NotificationRow[]> {
  const { data, error }: any = await supabase
    .from('notifications' as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function addNotification(userId: string, title: string, message: string) {
  const { error } = await supabase.from('notifications' as any).insert({
    user_id: userId,
    title,
    message,
    is_read: false
  } as any);
  if (error) throw error;
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('notifications' as any).update({ is_read: true } as any).eq('id', id);
  if (error) throw error;
}

// Storage
export async function uploadProofImage(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${generateId()}.${ext}`;
  const { error } = await supabase.storage.from('task-proofs').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('task-proofs').getPublicUrl(path);
  return data.publicUrl;
}
