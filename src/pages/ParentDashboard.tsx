import { useState, useCallback, useEffect } from 'react';
import { useAuth, AppUser } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AddTaskForm from '@/components/parent/AddTaskForm';
import TaskReview from '@/components/parent/TaskReview';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationsMenu from '@/components/shared/NotificationsMenu';
import RewardsManager from '@/components/parent/RewardsManager';
import VaultManager from '@/components/parent/VaultManager';
import { getTasks, getSubmissions, deleteTask, getChildPoints, getLinkedChildren, linkChild, addBehaviorPoints, addNotification, getRedemptions, TaskRow, SubmissionRow, RedemptionRow } from '@/lib/store';
import { getLevelInfo } from '@/lib/levels';
import { toast } from 'sonner';
import BackgroundLayout from '@/components/layout/BackgroundLayout';
import { LogOut, ClipboardList, Trash2, PlusCircle, LayoutDashboard, Activity, Settings, ShoppingBag, Landmark } from 'lucide-react';
import ScrollReveal from '@/components/animation/ScrollReveal';

const ParentDashboard = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [childPoints, setChildPoints] = useState(0);
  const [linkedChildren, setLinkedChildren] = useState<AppUser[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([]);
  const [childEmail, setChildEmail] = useState('');
  const [linking, setLinking] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [t, s, kids, redems] = await Promise.all([
        getTasks(user.id), 
        getSubmissions(user.id, 'parent'),
        getLinkedChildren(user.id),
        getRedemptions(user.id)
      ]);
      setTasks(t);
      setSubmissions(s);
      setLinkedChildren(kids as AppUser[]);
      setRedemptions(redems);
      
      if (kids.length > 0) {
        const pts = await getChildPoints(kids[0].id);
        setChildPoints(pts);
      } else if (s.length > 0) {
        const pts = await getChildPoints(s[0].child_id);
        setChildPoints(pts);
      }
    } catch (err) {
      console.error("Refresh failed:", err);
      toast.error("Failed to sync data");
    }
  }, [user]);

  useEffect(() => { 
    if (user) refresh(); 
  }, [user, refresh]);

  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !childEmail) return;
    setLinking(true);
    try {
      const name = await linkChild(childEmail, user.id);
      toast.success(`Successfully linked with ${name}!`);
      setChildEmail('');
      refresh();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to link child");
    } finally {
      setLinking(false);
    }
  };

  const handleAwardBehavior = async (childId: string, pts: number, reason: string) => {
    if (!user) return;
    try {
      await addBehaviorPoints(childId, user.id, pts, reason);
      
      await addNotification(
        childId,
        'Special Bonus! ⭐',
        `You just earned ${pts} XP for: ${reason}. Keep it up!`
      );
      
      toast.success(`Awarded ${pts} XP for ${reason}!`);
      refresh();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Limit exceeded or failed to award");
    }
  };

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const pendingRedemptionsCount = redemptions.filter(r => r.status === 'pending').length;
  const { current } = getLevelInfo(childPoints);

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      await refresh();
      toast.success('Task deleted');
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to delete task");
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
              <h1 className="font-black text-xl tracking-tighter text-glow uppercase text-left">Commander <span className="text-secondary">{user?.name}</span></h1>
              <span className="text-[10px] text-left font-black tracking-widest text-muted-foreground uppercase opacity-70">Squad Admin</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {user && <NotificationsMenu userId={user.id} />}
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

      <main className="max-w-7xl mx-auto pt-32 pb-20 px-6 space-y-12">
        {/* Dynamic Header Information */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Summary Cards */}
           <div className="lg:col-span-8 space-y-8">
              <ScrollReveal>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-premium p-8 rounded-[2rem] flex items-center gap-6 group hover-glow relative overflow-hidden">
                    <div className="relative z-10 flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-primary/20 flex items-center justify-center text-4xl shadow-inner border border-white/5">
                        {current.emoji}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black tracking-tighter uppercase mb-0">Squad XP</h2>
                        <Badge className="gradient-cyber border-none font-black text-[14px] tracking-tight">{childPoints} PTS</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="glass-premium p-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover-glow group transition-all">
                    <LayoutDashboard className="text-secondary w-8 h-8 mb-1" />
                    <p className="text-3xl font-black text-glow">{tasks.length}</p>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Quests</p>
                  </div>

                  <div className="glass-premium p-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover-glow group transition-all relative">
                    <ClipboardList className="text-accent w-8 h-8 mb-1" />
                    <p className="text-3xl font-black text-glow">{pendingCount}</p>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pending Missions</p>
                    {pendingCount > 0 && <span className="absolute top-4 right-4 h-3 w-3 rounded-full bg-accent animate-ping" />}
                  </div>

                  <div className="glass-premium p-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover-glow group transition-all relative">
                    <ShoppingBag className="text-secondary w-8 h-8 mb-1" />
                    <p className="text-3xl font-black text-glow">{pendingRedemptionsCount}</p>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">New Orders</p>
                    {pendingRedemptionsCount > 0 && <span className="absolute top-4 right-4 h-3 w-3 rounded-full bg-secondary animate-bounce" />}
                  </div>
                </div>
              </ScrollReveal>

              {/* Linking and Behavior Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Linking Widget */}
                <ScrollReveal>
                  <Card className="glass-premium border-none rounded-[2rem] p-6 h-full">
                    <div className="flex items-center gap-3 mb-6">
                       <PlusCircle className="text-primary w-5 h-5" />
                       <h3 className="font-black text-lg uppercase tracking-tight italic">Link Child Squad</h3>
                    </div>
                    <form onSubmit={handleLinkChild} className="flex gap-2">
                       <Input 
                        placeholder="Child Email or Name" 
                        value={childEmail}
                        onChange={e => setChildEmail(e.target.value)}
                        className="bg-white/5 border-white/10 rounded-xl font-bold h-12"
                       />
                       <Button type="submit" className="gradient-cyber h-12 rounded-xl font-black px-6" disabled={linking}>
                          {linking ? '...' : 'LINK'}
                       </Button>
                    </form>
                    <div className="mt-4 flex flex-wrap gap-2">
                       {linkedChildren.map(child => (
                         <Badge 
                           key={child.id} 
                           variant="secondary" 
                           className="bg-white/5 border-white/10 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase italic"
                         >
                           {child.name}
                         </Badge>
                       ))}
                    </div>
                  </Card>
                </ScrollReveal>

                {/* Life Missions Widget */}
                <ScrollReveal>
                  <Card className="glass-premium border-none rounded-[2rem] p-6 h-full">
                    <div className="flex items-center justify-between mb-6">
                       <div className="flex items-center gap-3">
                        <Activity className="text-accent w-5 h-5" />
                        <h3 className="font-black text-lg uppercase tracking-tight italic">Direct XP (Limit 150/d)</h3>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <Button 
                        variant="outline" 
                        onClick={() => linkedChildren[0] && handleAwardBehavior(linkedChildren[0].id, 20, "Listening to Parents")}
                        className="bg-white/5 border-white/10 hover:bg-primary/20 hover:text-primary h-12 rounded-xl text-[10px] font-black uppercase"
                        disabled={linkedChildren.length === 0}
                       >
                         👍 Listening (+20)
                       </Button>
                       <Button 
                        variant="outline" 
                        onClick={() => linkedChildren[0] && handleAwardBehavior(linkedChildren[0].id, 50, "Cleaning Room")}
                        className="bg-white/5 border-white/10 hover:bg-secondary/20 hover:text-secondary h-12 rounded-xl text-[10px] font-black uppercase"
                        disabled={linkedChildren.length === 0}
                       >
                         🧹 Cleaning (+50)
                       </Button>
                    </div>
                  </Card>
                </ScrollReveal>
              </div>

              {/* Main Tabs Content */}
              <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="w-full h-14 p-1.5 glass-premium rounded-2xl border border-white/10 shadow-xl mb-8 flex">
                  <TabsTrigger value="tasks" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Missions</TabsTrigger>
                  <TabsTrigger value="review" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-accent/20 data-[state=active]:text-accent relative">
                    Review
                    {pendingCount > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-accent text-[8px]">{pendingCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="rewards" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary relative">
                    Store & Rewards
                    {pendingRedemptionsCount > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-secondary text-[8px]">{pendingRedemptionsCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="bank" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Family Bank</TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AddTaskForm onTaskAdded={refresh} />
                    <div className="glass-premium rounded-[2rem] p-8 space-y-4">
                      <h3 className="font-black text-xl uppercase tracking-tighter mb-6">Active Missions</h3>
                      <div className="space-y-3">
                         {tasks.map(task => (
                           <div key={task.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-primary/30 transition-all">
                              <div className="flex items-center gap-3 text-left">
                                 <span className="text-xl">{task.points > 100 ? '🛸' : '💎'}</span>
                                 <div>
                                    <p className="font-black text-xs uppercase tracking-tight">{task.title}</p>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase">{task.points} XP • {task.type}</p>
                                 </div>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)} className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="review" className="mt-0">
                   <TaskReview submissions={submissions} onUpdate={refresh} />
                </TabsContent>

                <TabsContent value="rewards" className="mt-0">
                   {user && <RewardsManager parentId={user.id} />}
                </TabsContent>

                <TabsContent value="bank" className="mt-0">
                   {user && <VaultManager parentId={user.id} />}
                </TabsContent>
              </Tabs>
           </div>
           
           {/* Sidebar: Activity Log */}
           <div className="lg:col-span-4">
              <ScrollReveal>
                 <Card className="glass-premium border-none rounded-[2.5rem] p-8 h-full sticky top-32">
                    <div className="flex items-center gap-3 mb-8">
                       <Activity className="text-primary w-6 h-6" />
                       <h3 className="font-black text-2xl uppercase tracking-tighter italic">Combat Log</h3>
                    </div>
                    
                    <div className="space-y-6">
                       {submissions.slice(0, 5).map(sub => (
                         <div key={sub.id} className="flex gap-4 items-start border-l-2 border-white/10 pl-4 py-2">
                            <div className="flex-1 text-left">
                               <p className="text-[9px] font-black text-muted-foreground uppercase opacity-50 mb-1">{new Date(sub.submitted_at).toLocaleTimeString()}</p>
                               <p className="text-xs font-black uppercase tracking-tight leading-none mb-1">Mission Completed</p>
                               <p className="text-[10px] font-bold text-primary italic">Received {sub.earned_points} XP</p>
                            </div>
                         </div>
                       ))}
                       {submissions.length === 0 && <p className="text-center py-10 text-xs font-black text-muted-foreground opacity-30">Waiting for first transmission...</p>}
                    </div>
                 </Card>
              </ScrollReveal>
           </div>
        </div>
      </main>
    </BackgroundLayout>
  );
};

export default ParentDashboard;
