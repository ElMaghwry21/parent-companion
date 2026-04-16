import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AddTaskForm from '@/components/parent/AddTaskForm';
import TaskReview from '@/components/parent/TaskReview';
import ThemeToggle from '@/components/ThemeToggle';
import { getTasks, getSubmissions, deleteTask, getChildPoints, TaskRow, SubmissionRow } from '@/lib/store';
import { getLevelInfo } from '@/lib/levels';
import { toast } from 'sonner';
import BackgroundLayout from '@/components/layout/BackgroundLayout';
import { LogOut, Home, ClipboardList, Trash2, PlusCircle, LayoutDashboard, Settings, Activity } from 'lucide-react';
import ScrollReveal from '@/components/animation/ScrollReveal';

const ParentDashboard = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [childPoints, setChildPoints] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [t, s] = await Promise.all([
        getTasks(user.id), 
        getSubmissions(user.id, 'parent')
      ]);
      setTasks(t);
      setSubmissions(s);
      
      // Calculate total points across all seen children (or first one found)
      if (s.length > 0) {
        // Collect unique child IDs from submissions
        const childIds = Array.from(new Set(s.map(sub => sub.child_id)));
        if (childIds.length > 0) {
          // For now, we fetch points for the first child found, 
          // but we do it safely.
          const pts = await getChildPoints(childIds[0]);
          setChildPoints(pts);
        }
      }
    } catch (err) {
      console.error("Refresh failed:", err);
      toast.error("Failed to sync data");
    }
  }, [user]);

  useEffect(() => { 
    if (user) refresh(); 
  }, [user, refresh]);

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const { current } = getLevelInfo(childPoints);

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      await refresh();
      toast.success('Task deleted');
    } catch (err: any) {
      toast.error(err.message || "Failed to delete task");
    }
  };

  return (
    <BackgroundLayout variant="primary">
      {/* Premium Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass-premium rounded-2xl px-6 py-3 border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-cyber flex items-center justify-center shadow-lg animate-pulse">
              <span className="text-2xl">⚡</span>
            </div>
            <div className="flex flex-col">
              <h1 className="font-black text-xl tracking-tighter text-glow uppercase">Commander <span className="text-secondary">{user?.name}</span></h1>
              <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-70">Squad Admin</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="h-8 w-[1px] bg-white/10 mx-1" />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={logout} 
              className="w-10 h-10 rounded-xl hover:bg-destructive/20 hover:text-destructive group transition-all"
            >
              <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto pt-32 pb-20 px-6 space-y-12">
        {/* Hero Section */}
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 glass-premium p-8 rounded-[2rem] flex items-center gap-6 group hover-glow relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 scale-150 pointer-events-none group-hover:rotate-45 transition-transform duration-700">
                  <Activity size={100} className="text-primary" />
               </div>
               <div className="relative z-10 flex items-center gap-6">
                 <div className="w-20 h-20 rounded-[1.5rem] bg-primary/20 flex items-center justify-center text-4xl shadow-inner border border-white/5">
                   {current.emoji}
                 </div>
                 <div>
                   <h2 className="text-3xl font-black tracking-tighter uppercase mb-1">Squad Level {current.level}</h2>
                   <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">{current.name}</p>
                   <div className="mt-3 flex items-center gap-2">
                     <Badge className="gradient-cyber border-none font-black text-[10px] tracking-widest">{childPoints} TOTAL XP</Badge>
                   </div>
                 </div>
               </div>
            </div>

            <div className="glass-premium p-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover-glow group stagger-1 transition-all">
               <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                 <LayoutDashboard className="text-secondary w-6 h-6" />
               </div>
               <p className="text-4xl font-black text-glow">{tasks.length}</p>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Quests</p>
            </div>

            <div className="glass-premium p-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover-glow group stagger-2 transition-all">
               <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                 <ClipboardList className="text-accent w-6 h-6" />
               </div>
               <p className="text-4xl font-black text-glow">{pendingCount}</p>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Awaiting Intel</p>
               {pendingCount > 0 && <Badge className="mt-1 gradient-cyber animate-pulse border-0">ACTION REQ</Badge>}
            </div>
          </div>
        </ScrollReveal>

        {/* Action Center */}
        <ScrollReveal stagger={2}>
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="w-full max-w-sm mx-auto h-16 p-2 glass-premium rounded-[1.5rem] border border-white/10 shadow-2xl mb-12">
              <TabsTrigger value="tasks" className="flex-1 h-full rounded-xl font-black text-xs uppercase tracking-widest transition-all data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-xl">
                <PlusCircle className="w-4 h-4 mr-2" />
                Missions
              </TabsTrigger>
              <TabsTrigger value="review" className="flex-1 h-full rounded-xl font-black text-xs uppercase tracking-widest transition-all data-[state=active]:bg-accent/20 data-[state=active]:text-accent data-[state=active]:shadow-xl relative">
                <ClipboardList className="w-4 h-4 mr-2" />
                Review
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-accent flex items-center justify-center text-[8px] font-black text-white">{pendingCount}</span>
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="space-y-8 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2">
                  <ScrollReveal className="h-full">
                    <AddTaskForm onTaskAdded={refresh} />
                  </ScrollReveal>
                </div>
                
                <div className="lg:col-span-3">
                  <ScrollReveal stagger={1} className="h-full">
                    <div className="glass-premium rounded-[2rem] p-8 shadow-2xl relative overflow-hidden h-full">
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                              <Settings className="w-4 h-4 text-primary" />
                            </div>
                            <h3 className="font-black text-xl tracking-tighter uppercase">Quest Log</h3>
                          </div>
                          <Badge variant="outline" className="border-white/10 text-muted-foreground font-black text-[10px] tracking-widest">{tasks.length} DEPLOYED</Badge>
                        </div>
                        
                        {tasks.length === 0 ? (
                          <div className="text-center py-20 space-y-4 opacity-30">
                            <div className="text-6xl text-glow animate-float-slow">🛰️</div>
                            <p className="font-black text-xs uppercase tracking-widest">No active transmissions. Ready to deploy.</p>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {tasks.map((task, idx) => (
                              <ScrollReveal key={task.id} stagger={(Math.min(idx + 1, 4) as any)}>
                                <div className="group flex items-center justify-between glass-premium p-5 rounded-2xl border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all duration-500">
                                  <div className="flex gap-4 items-center">
                                    <div className="w-14 h-14 rounded-2xl gradient-cyber flex items-center justify-center text-2xl shadow-lg ring-4 ring-primary/10 transform group-hover:rotate-12 transition-transform">
                                      {task.points > 100 ? '🛸' : task.points > 50 ? '💎' : '⭐'}
                                    </div>
                                    <div>
                                        <p className="font-black text-md leading-none mb-2 uppercase tracking-tight">{task.title}</p>
                                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                            <span className="text-secondary">{task.points} XP</span>
                                            <span className="w-1 h-1 rounded-full bg-white/20" />
                                            <span>{task.type}</span>
                                            {task.requires_proof && <Badge className="bg-accent/20 text-accent border-none text-[8px] h-4">PHOTO PROOF</Badge>}
                                        </div>
                                    </div>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDelete(task.id)} 
                                    className="w-10 h-10 rounded-xl hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </ScrollReveal>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollReveal>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="review" className="mt-4">
              <ScrollReveal>
                <div className="max-w-3xl mx-auto">
                  <TaskReview submissions={submissions} onUpdate={refresh} />
                </div>
              </ScrollReveal>
            </TabsContent>
          </Tabs>
        </ScrollReveal>
      </main>
    </BackgroundLayout>
  );
};

export default ParentDashboard;
