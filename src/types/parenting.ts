export type UserRole = 'parent' | 'child';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export type TaskType = 'simple' | 'time-based';

export interface Task {
  id: string;
  title: string;
  points: number;
  type: TaskType;
  totalHours?: number; // for time-based tasks
  requiresProof: boolean;
  createdAt: string;
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface TaskSubmission {
  id: string;
  taskId: string;
  childId: string;
  status: SubmissionStatus;
  hoursSpent?: number; // for time-based tasks
  earnedPoints: number;
  proofImage?: string; // base64 data URL
  submittedAt: string;
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  icon: string;
}

export interface Redemption {
  id: string;
  rewardId: string;
  childId: string;
  pointsSpent: number;
  redeemedAt: string;
}
