import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addTask } from '@/lib/store';
import { toast } from 'sonner';
import { PlusCircle, Info } from 'lucide-react';

interface Props {
  onTaskAdded: () => void;
}

const AddTaskForm = ({ onTaskAdded }: Props) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState('');
  const [type, setType] = useState<'simple' | 'time-based'>('simple');
  const [totalHours, setTotalHours] = useState('');
  const [requiresProof, setRequiresProof] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !points || !user) return;

    setLoading(true);
    try {
      await addTask({
        created_by: user.id,
        title: title.trim(),
        points: Number(points),
        type,
        total_hours: type === 'time-based' ? Number(totalHours) : null,
        requires_proof: requiresProof,
      });

      setTitle('');
      setPoints('');
      setTotalHours('');
      setType('simple');
      setRequiresProof(false);
      onTaskAdded();
      toast.success('Task added successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card border-none shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 scale-150 pointer-events-none">
        <PlusCircle size={100} />
      </div>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-cyber flex items-center justify-center shadow-md">
            <PlusCircle className="w-5 h-5 text-white" />
          </div>
          <CardTitle className="text-xl font-black tracking-tight underline decoration-primary/30 decoration-4 underline-offset-4 italic uppercase">Deploy New Mission</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Mission Title</Label>
              <Input 
                placeholder="e.g. Study Math for 1 hour" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required 
                className="h-12 bg-white/5 dark:bg-black/20 border-white/10 rounded-xl focus:ring-primary/50 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Mission Type</Label>
              <Select value={type} onValueChange={v => setType(v as 'simple' | 'time-based')}>
                <SelectTrigger className="h-12 bg-white/5 dark:bg-black/20 border-white/10 rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-premium">
                  <SelectItem value="simple" className="font-bold">🎯 Simple Mission</SelectItem>
                  <SelectItem value="time-based" className="font-bold">⏳ Time-based Quest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                Reward Points {type === 'time-based' ? '(Full Completion)' : ''}
              </Label>
              <Input 
                type="number" 
                min={1} 
                placeholder="e.g. 50" 
                value={points} 
                onChange={e => setPoints(e.target.value)} 
                required 
                className="h-12 bg-white/5 dark:bg-black/20 border-white/10 rounded-xl focus:ring-primary/50 font-bold"
              />
            </div>
            {type === 'time-based' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-right-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Duration (Hours)</Label>
                <Input 
                  type="number" 
                  min={0.5} 
                  step={0.5} 
                  placeholder="e.g. 2.5" 
                  value={totalHours} 
                  onChange={e => setTotalHours(e.target.value)} 
                  required 
                  className="h-12 bg-white/5 dark:bg-black/20 border-white/10 rounded-xl focus:ring-primary/50 font-bold"
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-1">
            <div className="flex items-center justify-between p-4 glass-premium rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${requiresProof ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-muted text-muted-foreground'}`}>
                  {requiresProof ? '📸' : '🚫'}
                </div>
                <div className="space-y-0.5 text-left">
                  <Label className="font-black text-xs uppercase tracking-widest cursor-pointer">Photo Verification</Label>
                  <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter italic">Require visual evidence</p>
                </div>
              </div>
              <Switch checked={requiresProof} onCheckedChange={setRequiresProof} className="data-[state=checked]:bg-primary" />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-black gradient-cyber border-none shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.3em] rounded-2xl" 
            disabled={loading}
          >
            {loading ? 'DEPLOYING MISSION...' : 'AUTHORIZE MISSION 🚀'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddTaskForm;
