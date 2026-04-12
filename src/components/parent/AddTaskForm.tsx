import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addTask } from '@/lib/store';
import { TaskType } from '@/types/parenting';
import { toast } from 'sonner';

interface Props {
  onTaskAdded: () => void;
}

const AddTaskForm = ({ onTaskAdded }: Props) => {
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState('');
  const [type, setType] = useState<TaskType>('simple');
  const [totalHours, setTotalHours] = useState('');
  const [requiresProof, setRequiresProof] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !points) return;

    addTask({
      id: crypto.randomUUID(),
      title: title.trim(),
      points: Number(points),
      type,
      totalHours: type === 'time-based' ? Number(totalHours) : undefined,
      requiresProof,
      createdAt: new Date().toISOString(),
    });

    setTitle('');
    setPoints('');
    setTotalHours('');
    setType('simple');
    setRequiresProof(false);
    onTaskAdded();
    toast.success('Task added!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">➕ Add New Task</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Task Title</Label>
            <Input placeholder="e.g. Clean your room" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label>Task Type</Label>
            <Select value={type} onValueChange={v => setType(v as TaskType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple Task</SelectItem>
                <SelectItem value="time-based">Time-based Task</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Points {type === 'time-based' ? '(total for full hours)' : ''}</Label>
            <Input type="number" min={1} placeholder="e.g. 50" value={points} onChange={e => setPoints(e.target.value)} required />
          </div>

          {type === 'time-based' && (
            <div className="space-y-1.5">
              <Label>Total Hours Required</Label>
              <Input type="number" min={0.5} step={0.5} placeholder="e.g. 3" value={totalHours} onChange={e => setTotalHours(e.target.value)} required />
            </div>
          )}

          <div className="flex items-center gap-3">
            <Switch checked={requiresProof} onCheckedChange={setRequiresProof} />
            <Label>Requires photo proof</Label>
          </div>

          <Button type="submit" className="w-full">Add Task</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddTaskForm;
