import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskRow, SubmissionRow, addSubmission, uploadProofImage } from '@/lib/store';
import { toast } from 'sonner';

interface Props {
  tasks: TaskRow[];
  submissions: SubmissionRow[];
  childId: string;
  onSubmit: () => void;
}

const TaskList = ({ tasks, submissions, childId, onSubmit }: Props) => {
  const [selectedHours, setSelectedHours] = useState<Record<string, string>>({});
  const [proofFiles, setProofFiles] = useState<Record<string, File>>({});
  const [proofPreviews, setProofPreviews] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const getSubmission = (taskId: string) => submissions.find(s => s.task_id === taskId && s.child_id === childId);

  const handleProofUpload = (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFiles(prev => ({ ...prev, [taskId]: file }));
    const reader = new FileReader();
    reader.onload = () => setProofPreviews(prev => ({ ...prev, [taskId]: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleComplete = async (task: TaskRow) => {
    const hours = task.type === 'time-based' ? Number(selectedHours[task.id] || 0) : undefined;
    let earned = task.points;

    if (task.type === 'time-based' && task.total_hours && hours) {
      earned = Math.round((hours / task.total_hours) * task.points);
    }

    if (task.requires_proof && !proofFiles[task.id]) {
      toast.error('Please upload photo proof first');
      return;
    }

    setSubmitting(task.id);
    try {
      let proofUrl: string | null = null;
      if (proofFiles[task.id]) {
        proofUrl = await uploadProofImage(proofFiles[task.id], childId);
      }

      await addSubmission({
        task_id: task.id,
        child_id: childId,
        status: 'pending',
        hours_spent: hours || null,
        earned_points: earned,
        proof_image_url: proofUrl,
      });

      setProofFiles(prev => { const n = { ...prev }; delete n[task.id]; return n; });
      setProofPreviews(prev => { const n = { ...prev }; delete n[task.id]; return n; });
      onSubmit();
      toast.success('Task submitted for review!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit');
    } finally {
      setSubmitting(null);
    }
  };

  const hourOptions = ['0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5'];

  return (
    <Card className="shadow-md theme-transition">
      <CardHeader>
        <CardTitle className="text-lg">📝 My Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 && <p className="text-muted-foreground text-sm">No tasks yet — ask your parent to add some!</p>}
        {tasks.map(task => {
          const sub = getSubmission(task.id);
          const isDone = !!sub;

          return (
            <div key={task.id} className={`border rounded-lg p-4 space-y-3 theme-transition ${isDone ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{task.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {task.type === 'time-based'
                      ? `Up to ${task.points} pts • ${task.total_hours}h total`
                      : `${task.points} pts`}
                    {task.requires_proof && ' • 📸 Proof needed'}
                  </p>
                </div>
                {sub && (
                  <Badge variant={sub.status === 'approved' ? 'default' : sub.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {sub.status}
                  </Badge>
                )}
              </div>

              {!isDone && (
                <div className="space-y-2">
                  {task.type === 'time-based' && (
                    <Select value={selectedHours[task.id] || ''} onValueChange={v => setSelectedHours(prev => ({ ...prev, [task.id]: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select hours spent" /></SelectTrigger>
                      <SelectContent>
                        {hourOptions.filter(h => Number(h) <= (task.total_hours || 5)).map(h => (
                          <SelectItem key={h} value={h}>{h} hour{Number(h) !== 1 ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {task.requires_proof && (
                    <div>
                      <input type="file" accept="image/*" onChange={e => handleProofUpload(task.id, e)} className="text-sm file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:text-primary-foreground file:cursor-pointer" />
                      {proofPreviews[task.id] && <img src={proofPreviews[task.id]} alt="Preview" className="mt-2 w-full max-h-32 object-cover rounded-md border" />}
                    </div>
                  )}

                  <Button
                    size="sm"
                    className="w-full"
                    disabled={(task.type === 'time-based' && !selectedHours[task.id]) || submitting === task.id}
                    onClick={() => handleComplete(task)}
                  >
                    {submitting === task.id ? 'Submitting...' : task.type === 'simple' ? '✅ Mark as Done' : '📤 Submit'}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default TaskList;
