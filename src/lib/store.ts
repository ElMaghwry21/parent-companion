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
  { id: 'r2', name: 'Family Outing', cost: 250, icon: '🏖️' },
  { id: 'r3', name: 'Movie Night Pick', cost: 75, icon: '🎬' },
  { id: 'r4', name: 'Stay Up Late', cost: 50, icon: '🌙' },
  { id: 'r5', name: 'Ice Cream Trip', cost: 60, icon: '🍦' },
];

// Tasks
export async function getTasks(parentId?: string): Promise<TaskRow[]> {
  let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
  
  if (parentId) {
    query = query.eq('created_by', parentId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
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
  let query = supabase.from('task_submissions').select('*, task:tasks(*)');
  
  if (role === 'parent') {
    // Parent sees submissions for tasks THEY created
    // Note: We use !inner to filter by the related table
    query = supabase.from('task_submissions')
      .select('*, task:tasks!inner(*)')
      .eq('task.created_by', userId);
  } else {
    // Child sees ONLY their own submissions
    query = query.eq('child_id', userId);
  }

  const { data, error } = await query.order('submitted_at', { ascending: false });
  if (error) {
    console.error("Error fetching submissions:", error);
    throw error;
  }
  return (data as any[]) || [];
}

export async function addSubmission(sub: Omit<SubmissionRow, 'id' | 'submitted_at' | 'task'>) {
  const { error } = await supabase.from('task_submissions').insert(sub);
  if (error) throw error;
}

export async function updateSubmissionStatus(id: string, status: 'approved' | 'rejected') {
  const { error } = await supabase.from('task_submissions').update({ status }).eq('id', id);
  if (error) throw error;
}

// Points
export async function getChildPoints(childId: string): Promise<number> {
  const [subsRes, redemRes] = await Promise.all([
    supabase.from('task_submissions').select('earned_points').eq('child_id', childId).eq('status', 'approved'),
    supabase.from('redemptions').select('points_spent').eq('child_id', childId),
  ]);

  if (subsRes.error) throw subsRes.error;
  if (redemRes.error) throw redemRes.error;

  const earned = (subsRes.data || []).reduce((sum, s) => sum + s.earned_points, 0);
  const spent = (redemRes.data || []).reduce((sum, r) => sum + r.points_spent, 0);
  return earned - spent;
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
