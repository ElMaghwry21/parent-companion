import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SubmissionRow, TaskRow, updateSubmissionStatus, getTasks } from '@/lib/store';
import { toast } from 'sonner';

interface Props {
  submissions: SubmissionRow[];
  onUpdate: () => void;
}

const TaskReview = ({ submissions, onUpdate }: Props) => {
  const [tasks, setTasks] = useState<TaskRow[]>([]);

  useEffect(() => { getTasks().then(setTasks); }, [submissions]);

  const pending = submissions.filter(s => s.status === 'pending');
  const reviewed = submissions.filter(s => s.status !== 'pending');

  const getTask = (taskId: string) => tasks.find(t => t.id === taskId);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateSubmissionStatus(id, status);
      onUpdate();
      toast.success(status === 'approved' ? 'Task approved! Points awarded 🎉' : 'Task rejected');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-md theme-transition">
        <CardHeader>
          <CardTitle className="text-lg">📋 Pending Review ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 && <p className="text-muted-foreground text-sm">No pending submissions</p>}
          {pending.map(sub => {
            const task = getTask(sub.task_id);
            return (
              <div key={sub.id} className="border rounded-lg p-4 space-y-3 theme-transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{task?.title || 'Unknown Task'}</h4>
                    <p className="text-sm text-muted-foreground">
                      {sub.earned_points} pts{sub.hours_spent ? ` • ${sub.hours_spent}h spent` : ''}
                    </p>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
                {sub.proof_image_url && (
                  <img src={sub.proof_image_url} alt="Proof" className="w-full max-h-48 object-cover rounded-md border" />
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAction(sub.id, 'approved')} className="flex-1">✅ Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleAction(sub.id, 'rejected')} className="flex-1">❌ Reject</Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {reviewed.length > 0 && (
        <Card className="shadow-md theme-transition">
          <CardHeader>
            <CardTitle className="text-lg">📜 Review History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reviewed.map(sub => {
              const task = getTask(sub.task_id);
              return (
                <div key={sub.id} className="flex items-center justify-between border rounded-lg p-3 theme-transition">
                  <span className="text-sm">{task?.title || 'Unknown'}</span>
                  <Badge variant={sub.status === 'approved' ? 'default' : 'destructive'}>{sub.status}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskReview;
