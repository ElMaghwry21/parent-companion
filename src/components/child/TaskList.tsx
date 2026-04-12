import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task, TaskSubmission } from '@/types/parenting';
import { addSubmission } from '@/lib/store';
import { toast } from 'sonner';

interface Props {
  tasks: Task[];
  submissions: TaskSubmission[];
  childId: string;
  onSubmit: () => void;
}

const TaskList = ({ tasks, submissions, childId, onSubmit }: Props) => {
  const [selectedHours, setSelectedHours] = useState<Record<string, string>>({});
  const [proofImages, setProofImages] = useState<Record<string, string>>({});

  const getSubmission = (taskId: string) => submissions.find(s => s.taskId === taskId && s.childId === childId);

  const handleProofUpload = (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProofImages(prev => ({ ...prev, [taskId]: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleComplete = (task: Task) => {
    const hours = task.type === 'time-based' ? Number(selectedHours[task.id] || 0) : undefined;
    let earned = task.points;

    if (task.type === 'time-based' && task.totalHours && hours) {
      earned = Math.round((hours / task.totalHours) * task.points);
    }

    if (task.requiresProof && !proofImages[task.id]) {
      toast.error('Please upload photo proof first');
      return;
    }

    addSubmission({
      id: crypto.randomUUID(),
      taskId: task.id,
      childId,
      status: 'pending',
      hoursSpent: hours,
      earnedPoints: earned,
      proofImage: proofImages[task.id],
      submittedAt: new Date().toISOString(),
    });

    setProofImages(prev => { const n = { ...prev }; delete n[task.id]; return n; });
    onSubmit();
    toast.success('Task submitted for review!');
  };

  const hourOptions = ['0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">📝 My Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 && <p className="text-muted-foreground text-sm">No tasks yet — ask your parent to add some!</p>}
        {tasks.map(task => {
          const sub = getSubmission(task.id);
          const isDone = !!sub;

          return (
            <div key={task.id} className={`border rounded-lg p-4 space-y-3 ${isDone ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{task.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {task.type === 'time-based'
                      ? `Up to ${task.points} pts • ${task.totalHours}h total`
                      : `${task.points} pts`}
                    {task.requiresProof && ' • 📸 Proof needed'}
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
                        {hourOptions.filter(h => Number(h) <= (task.totalHours || 5)).map(h => (
                          <SelectItem key={h} value={h}>{h} hour{Number(h) !== 1 ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {task.requiresProof && (
                    <div>
                      <input type="file" accept="image/*" onChange={e => handleProofUpload(task.id, e)} className="text-sm file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:text-primary-foreground file:cursor-pointer" />
                      {proofImages[task.id] && <img src={proofImages[task.id]} alt="Preview" className="mt-2 w-full max-h-32 object-cover rounded-md border" />}
                    </div>
                  )}

                  <Button
                    size="sm"
                    className="w-full"
                    disabled={task.type === 'time-based' && !selectedHours[task.id]}
                    onClick={() => handleComplete(task)}
                  >
                    {task.type === 'simple' ? '✅ Mark as Done' : '📤 Submit'}
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
