import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import TaskList from '@/components/child/TaskList';
import RewardsStore from '@/components/child/RewardsStore';
import ThemeToggle from '@/components/ThemeToggle';
import { getTasks, getSubmissions, getChildPoints, TaskRow, SubmissionRow } from '@/lib/store';
import { getLevelInfo } from '@/lib/levels';
import BackgroundLayout from '@/components/layout/BackgroundLayout';
import { Trophy, Star, Store, ListChecks, LogOut, ArrowUpCircle, Zap, Shield, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ScrollReveal from '@/components/animation/ScrollReveal';

const ChildDashboard = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [points, setPoints] = useState(0);

  const childId = user?.id || '';

  const refresh = useCallback(async () => {
    if (!childId) return;
    try {
      const [t, s, p] = await Promise.all([
        getTasks(), 
        getSubmissions(childId, 'child'), 
        getChildPoints(childId)
      ]);
      setTasks(t);
      setSubmissions(s);
      setPoints(p);
    } catch (err) {
      console.error("Child refresh failed:", err);
    }
  }, [childId]);

  useEffect(() => { if (childId) refresh(); }, [childId, refresh]);

  const { current, next, progress } = getLevelInfo(points);

  return (
    <BackgroundLayout variant="secondary">
      {/* Premium Child Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass-premium rounded-2xl px-6 py-3 border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-cyber flex items-center justify-center shadow-lg animate-float-slow">
              <span className="text-2xl">{current.emoji}</span>
            </div>
            <div className="flex flex-col">
              <h1 className="font-black text-xl tracking-tighter text-glow uppercase italic">Hero <span className="text-primary">{user?.name}</span></h1>
              <span className="text-[10px] font-black tracking-widest text-secondary uppercase opacity-80">Legend Level {current.level}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center px-4 py-2 bg-white/5 rounded-xl border border-white/5 mr-2">
               <Zap className="w-4 h-4 text-yellow-400 mr-2 animate-pulse" fill="currentColor" />
               <span className="font-black text-sm tracking-tighter">{points} XP</span>
            </div>
            <ThemeToggle />
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

      <main className="max-w-2xl mx-auto pt-28 pb-20 px-6 space-y-10">
        {/* Hero Card */}
        <ScrollReveal>
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-secondary rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative glass-premium rounded-[2.5rem] overflow-hidden shadow-2xl border-white/10">
              <div className="gradient-cyber p-8 text-center relative overflow-hidden group">
                {/* Floating Icons Background */}
                <div className="absolute top-0 left-0 p-4 opacity-10 animate-float-slow transform -rotate-12">
                   <Shield size={80} />
                </div>
                <div className="absolute bottom-4 right-4 p-4 opacity-10 animate-float-slow animation-delay-2000 transform rotate-12">
                   <Target size={80} />
                </div>
                
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 text-white/70">Adventure Treasure</p>
                <div className="flex items-center justify-center gap-4">
                  <Star className="text-yellow-300 w-10 h-10 animate-pulse" fill="currentColor" />
                  <p className="text-7xl font-black drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] tracking-tighter">{points}</p>
                </div>
                <p className="mt-2 font-black text-xs uppercase tracking-widest text-white/80">Experience Points</p>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                      {current.emoji}
                    </div>
                    <div>
                      <h3 className="font-black text-2xl leading-tight uppercase tracking-tighter text-glow italic">{current.name}</h3>
                      <Badge className="bg-primary/20 text-primary border-none text-[10px] h-5 font-black uppercase tracking-widest">Rank {current.level}</Badge>
                    </div>
                  </div>
                  {next && (
                    <div className="text-right flex flex-col items-end">
                      <p className="text-[10px] font-black text-muted-foreground uppercase mb-1 tracking-widest">Next Evolution</p>
                      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                         <span className="text-lg">{next.emoji}</span>
                         <span className="text-xs font-black uppercase">{next.name}</span>
                      </div>
                    </div>
                  )}
                </div>

                {next ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>Sync Progress</span>
                      <span className="text-primary">{progress}%</span>
                    </div>
                    <div className="relative h-4 bg-muted/40 rounded-full border border-white/5 overflow-hidden">
                      <Progress value={progress} className="h-full bg-gradient-to-r from-primary via-accent to-secondary transition-all duration-1000" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none" style={{ backgroundSize: '200% 100%' }} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle size={14} className="text-primary" />
                        <span className="text-primary">{next.minPoints - points} XP NEEDED</span>
                      </div>
                      <span className="opacity-50">{points} / {next.minPoints}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-primary/10 rounded-2xl border border-primary/20 relative overflow-hidden group/legend text-glow">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                    <p className="font-black text-xl uppercase tracking-tighter leading-none italic">👑 Legendary status active 👑</p>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-70">Maximum Rank Achieved</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Dashboard Sections */}
        <ScrollReveal stagger={2}>
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="w-full h-16 p-2 glass-premium rounded-[1.5rem] border border-white/10 shadow-2xl mb-10">
              <TabsTrigger value="tasks" className="flex-1 h-full rounded-xl font-black text-xs uppercase tracking-widest transition-all data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary data-[state=active]:shadow-xl group">
                <ListChecks className="w-4 h-4 mr-2 group-data-[state=active]:animate-bounce" />
                Quests
              </TabsTrigger>
              <TabsTrigger value="store" className="flex-1 h-full rounded-xl font-black text-xs uppercase tracking-widest transition-all data-[state=active]:bg-accent/20 data-[state=active]:text-accent data-[state=active]:shadow-xl group">
                <Store className="w-4 h-4 mr-2 group-data-[state=active]:animate-bounce" />
                Rewards
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-4">
              <ScrollReveal>
                <TaskList tasks={tasks} submissions={submissions} childId={childId} onSubmit={refresh} />
              </ScrollReveal>
            </TabsContent>

            <TabsContent value="store" className="mt-4">
              <ScrollReveal>
                <RewardsStore childId={childId} points={points} onRedeem={refresh} />
              </ScrollReveal>
            </TabsContent>
          </Tabs>
        </ScrollReveal>
      </main>
    </BackgroundLayout>
  );
};

export default ChildDashboard;
