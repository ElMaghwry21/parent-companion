import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SubmissionRow, TaskRow, updateSubmissionStatus, getTasks, addNotification } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, History, Camera, Award } from 'lucide-react';

interface Props {
  submissions: SubmissionRow[];
  onUpdate: () => void;
}

const TaskReview = ({ submissions, onUpdate }: Props) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskRow[]>([]);

  useEffect(() => { 
    if (user) {
      getTasks(user.id).then(setTasks);
    }
  }, [submissions, user]);

  const pending = submissions.filter(s => s.status === 'pending');
  const reviewed = submissions.filter(s => s.status !== 'pending');

  const getTask = (taskId: string) => tasks.find(t => t.id === taskId);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const sub = pending.find(s => s.id === id);
      const task = sub ? getTask(sub.task_id) : null;
      await updateSubmissionStatus(id, status);
      
      if (sub && task) {
        await addNotification(
          sub.child_id, 
          status === 'approved' ? 'Mission Approved! 🌟' : 'Mission Rejected ❌',
          status === 'approved' 
            ? `Epic! You earned ${sub.earned_points} XP for "${task.title}".` 
            : `Your mission "${task.title}" needs more work.`
        );
      }
      
      onUpdate();
      toast.success(status === 'approved' ? 'Task approved! Points awarded 🎉' : 'Task rejected');
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Failed to update');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="glass-card border-none shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 scale-150 pointer-events-none">
          <Clock size={120} />
        </div>
        <CardHeader className="border-b border-white/5 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl gradient-cyber flex items-center justify-center shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl font-black tracking-tight underline decoration-primary/30 decoration-4 underline-offset-4 italic uppercase">Pending Intelligence</CardTitle>
            </div>
            <Badge variant="outline" className="h-7 px-3 border-primary/30 text-primary font-black shadow-[0_0_10px_rgba(168,85,247,0.2)]">{pending.length} Waiting</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
          {pending.length === 0 ? (
            <div className="text-center py-10 space-y-3 opacity-50">
                <div className="text-4xl animate-bounce">✨</div>
                <p className="font-bold text-muted-foreground uppercase tracking-[0.2em] text-[10px]">Command Center Clear</p>
            </div>
          ) : (
            <div className="grid gap-6">
                {pending.map(sub => {
                    const task = getTask(sub.task_id);
                    return (
                        <div key={sub.id} className="glass-premium p-6 rounded-3xl border-white/5 hover:border-primary/30 transition-all duration-300 group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 rounded-2xl gradient-cyber flex items-center justify-center text-xl shadow-lg ring-4 ring-primary/20">
                                        <Award className="text-white w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-black text-lg leading-tight uppercase tracking-tight italic">{task?.title || 'Unknown Mission'}</h4>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold italic">
                                            <span className="text-secondary">{sub.earned_points} XP REWARD</span>
                                            {sub.hours_spent && <span>• {sub.hours_spent}h effort</span>}
                                        </div>
                                    </div>
                                </div>
                                <Badge className="gradient-cyber border-none font-black uppercase tracking-tighter text-[10px] animate-pulse">Awaiting Judge</Badge>
                            </div>
                            
                            {sub.proof_image_url && (
                                <div className="relative rounded-2xl overflow-hidden mb-6 border border-white/10 shadow-2xl group/img">
                                    <img src={sub.proof_image_url} alt="Proof" className="w-full h-56 object-cover transform group-hover/img:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-5 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center">
                                          <Camera className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Evidence Intel Captured</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button 
                                    size="lg" 
                                    onClick={() => handleAction(sub.id, 'approved')} 
                                    className="flex-1 h-14 rounded-2xl gradient-cyber hover:opacity-90 font-black uppercase tracking-[0.2em] shadow-xl border-none active:scale-95 transition-all"
                                >
                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                    APPROVE
                                </Button>
                                <Button 
                                    size="lg" 
                                    variant="ghost" 
                                    onClick={() => handleAction(sub.id, 'rejected')} 
                                    className="flex-1 h-14 rounded-2xl border border-destructive/20 text-destructive hover:bg-destructive/10 font-black uppercase tracking-[0.2em] active:scale-95 transition-all"
                                >
                                    <XCircle className="w-5 h-5 mr-2" />
                                    REJECT
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {reviewed.length > 0 && (
        <Card className="glass-card border-none shadow-2xl relative overflow-hidden">
          <CardHeader className="border-b border-white/5">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                    <History className="w-6 h-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl font-black tracking-tight italic uppercase">Mission History</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {reviewed.map(sub => {
              const task = getTask(sub.task_id);
              const isApproved = sub.status === 'approved';
              return (
                <div key={sub.id} className="flex items-center justify-between p-4 rounded-2xl border border-white/5 glass-premium hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isApproved ? 'bg-green-500/20 text-green-500' : 'bg-destructive/20 text-destructive'}`}>
                        {isApproved ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    </div>
                    <span className="font-bold text-sm tracking-tight italic">{task?.title || 'Unknown Mission'}</span>
                  </div>
                  <Badge className={`${isApproved ? 'bg-green-500 shadow-green-500/20' : 'bg-destructive shadow-destructive/20'} border-none font-black uppercase tracking-tighter text-[10px] shadow-lg`}>
                    {sub.status}
                  </Badge>
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
