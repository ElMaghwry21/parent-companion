import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskRow, SubmissionRow, addSubmission, uploadProofImage, addNotification } from '@/lib/store';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Camera, Send, AlertCircle, Sparkles, Image as ImageIcon } from 'lucide-react';

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

  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const getSubmission = (task: TaskRow) => {
    if (task.is_routine) {
       return submissions.find(s => s.task_id === task.id && s.child_id === childId && isToday(s.submitted_at));
    }
    return submissions.find(s => s.task_id === task.id && s.child_id === childId);
  };

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

      if (task.created_by) {
        await addNotification(
          task.created_by,
          'Mission Awaiting Review ⏱️',
          `A child submitted proof for "${task.title}". Review it to award XP!`
        );
      }

      setProofFiles(prev => { const n = { ...prev }; delete n[task.id]; return n; });
      setProofPreviews(prev => { const n = { ...prev }; delete n[task.id]; return n; });
      onSubmit();
      toast.success('Mission report deployed! Waiting for approval. 🚀');
    } catch (err: any) {
      toast.error(err.message || 'Mission failed to deploy');
    } finally {
      setSubmitting(null);
    }
  };

  const hourOptions = ['0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5'];

  const routineTasks = tasks.filter(t => t.is_routine);
  
  // Variable tasks: Hide them if they are approved
  const variableTasks = tasks.filter(t => {
    if (t.is_routine) return false;
    const sub = submissions.find(s => s.task_id === t.id && s.child_id === childId);
    if (sub && sub.status === 'approved') return false; // Disappear if approved
    return true;
  });

  const renderTask = (task: TaskRow) => {
    const sub = getSubmission(task);
    const isDone = !!sub;
    const isApproved = sub?.status === 'approved';
    const isRejected = sub?.status === 'rejected';

    return (
      <div key={task.id} className={`glass-card p-6 rounded-3xl border-white/5 transition-all duration-300 group relative ${isDone ? 'opacity-70 grayscale-[0.3]' : 'hover:scale-[1.02] hover:bg-white/5'}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-4 items-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ring-4 ${isDone ? 'bg-muted ring-muted/10' : 'gradient-cyber ring-primary/10'}`}>
              {isDone ? (isApproved ? '💎' : isRejected ? '❌' : '⏳') : (task.is_routine ? '🔁' : (task.points > 50 ? '👑' : '⭐'))}
            </div>
            <div>
              <h4 className="font-black text-lg leading-tight uppercase tracking-tight italic">{task.title}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold italic">
                <span className={task.is_routine ? 'text-secondary' : 'text-primary'}>{task.type === 'time-based' ? `Up to ${task.points}` : task.points} XP AVAILABLE</span>
                {task.type === 'time-based' && <span>• {task.total_hours}h max effort</span>}
              </div>
            </div>
          </div>
          {sub && (
            <Badge className={`border-none font-black uppercase tracking-tighter text-[10px] shadow-lg ${
              isApproved ? 'bg-green-500 shadow-green-500/20' : isRejected ? 'bg-destructive' : 'gradient-cyber animate-pulse'
            }`}>
              {sub.status === 'pending' ? 'Reviewing' : sub.status}
            </Badge>
          )}
        </div>

        {!isDone && (
          <div className="space-y-4 pt-2">
            {task.type === 'time-based' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Time Invested</label>
                <Select value={selectedHours[task.id] || ''} onValueChange={v => setSelectedHours(prev => ({ ...prev, [task.id]: v }))}>
                  <SelectTrigger className="h-12 bg-white/5 dark:bg-black/20 border-white/10 rounded-xl focus:ring-primary/50">
                    <SelectValue placeholder="How long did it take?" />
                  </SelectTrigger>
                  <SelectContent className="glass-premium">
                    {hourOptions.filter(h => Number(h) <= (task.total_hours || 5)).map(h => (
                      <SelectItem key={h} value={h} className="font-bold">{h} hour{Number(h) !== 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {task.requires_proof && (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-1">
                  <Camera size={12} className={task.is_routine ? 'text-secondary' : 'text-primary'} /> Camera Proof Required
                </label>
                <div className="relative group/upload">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => handleProofUpload(task.id, e)} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  <div className={`h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${proofPreviews[task.id] ? (task.is_routine ? 'border-secondary/50 bg-secondary/10' : 'border-primary/50 bg-primary/10') : 'border-white/10 bg-white/5 group-hover/upload:bg-white/10'}`}>
                    {proofPreviews[task.id] ? (
                        <div className="flex items-center gap-4 px-4">
                            <div className="relative">
                              <img src={proofPreviews[task.id]} alt="Preview" className={`w-16 h-16 object-cover rounded-xl shadow-[0_0_15px_${task.is_routine ? 'rgba(236,72,153,0.4)' : 'rgba(168,85,247,0.4)'}]`} />
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                <CheckCircle2 size={10} className="text-white" />
                              </div>
                            </div>
                            <div className="text-left">
                                <p className={`text-xs font-black uppercase tracking-widest ${task.is_routine ? 'text-secondary' : 'text-primary'}`}>EVIDENCE READY!</p>
                                <p className="text-[10px] text-muted-foreground font-bold italic">Click to swap intel</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <ImageIcon className="text-muted-foreground w-6 h-6 animate-float-slow" />
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">Tap to capture proof</p>
                        </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button
              size="lg"
              className={`w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all border-none ${task.is_routine ? 'bg-gradient-to-r from-secondary to-accent' : 'gradient-cyber'}`}
              disabled={(task.type === 'time-based' && !selectedHours[task.id]) || submitting === task.id}
              onClick={() => handleComplete(task)}
            >
              {submitting === task.id ? 'UPLOADING DATA...' : (
                <div className="flex items-center gap-2">
                   <Send size={18} />
                   {task.type === 'simple' ? 'FINISH MISSION' : 'DEPLOY REPORT'}
                </div>
              )}
            </Button>
          </div>
        )}
        
        {isDone && !isApproved && !isRejected && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-accent/10 rounded-xl border border-accent/20 text-accent">
            <AlertCircle size={14} />
            <p className="text-[10px] font-bold uppercase tracking-wider">Awaiting Parent Approval to award XP</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="glass-card border-none shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 scale-150 pointer-events-none">
        <Sparkles size={120} />
      </div>
      <CardHeader className="border-b border-white/5 pb-6">
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl font-black tracking-tight underline decoration-primary/30 decoration-4 underline-offset-4 uppercase">Missions Control</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-8 space-y-12">
        {tasks.length === 0 && (
          <div className="text-center py-10 space-y-3 opacity-50">
            <div className="text-4xl">🏝️</div>
            <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">No active quests today!</p>
          </div>
        )}

        {/* Daily Routine Section */}
        {routineTasks.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                <span className="text-secondary">🔁</span>
              </div>
              <h3 className="font-black text-lg uppercase tracking-widest italic text-secondary">Daily Routine</h3>
            </div>
            <div className="grid gap-6">
              {routineTasks.map(task => renderTask(task))}
            </div>
          </div>
        )}

        {/* Variable Tasks Section */}
        {variableTasks.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-primary">🎯</span>
              </div>
              <h3 className="font-black text-lg uppercase tracking-widest italic text-primary">Active Missions</h3>
            </div>
            <div className="grid gap-6">
              {variableTasks.map(task => renderTask(task))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskList;
