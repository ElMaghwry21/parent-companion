import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import TaskList from '@/components/child/TaskList';
import RewardsStore from '@/components/child/RewardsStore';
import ThemeToggle from '@/components/ThemeToggle';
import { getTasks, getSubmissions, getChildPoints, getBehaviorLogs, getVaultData, TaskRow, SubmissionRow, BehaviorLogRow } from '@/lib/store';
import { getLevelInfo } from '@/lib/levels';
import VaultStatus from '@/components/child/VaultStatus';
import BackgroundLayout from '@/components/layout/BackgroundLayout';
import NotificationsMenu from '@/components/shared/NotificationsMenu';
import { Trophy, Star, Store, ListChecks, LogOut, Shield, Target, Zap, ArrowUpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import ScrollReveal from '@/components/animation/ScrollReveal';

interface VaultData {
  vault_total_balance: number | null;
  vault_unlocked_balance: number | null;
  vault_points_threshold: number | null;
  vault_payout_amount: number | null;
  points: { earned_points: number }[];
  behavior_points: { points: number }[];
}

type ActivityLog = (BehaviorLogRow & { type: 'behavior' }) | (SubmissionRow & { type: 'mission' });

const ChildDashboard = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [points, setPoints] = useState(0);
  const [behaviorLogs, setBehaviorLogs] = useState<BehaviorLogRow[]>([]);
  const [vaultData, setVaultData] = useState<VaultData | null>(null);

  const childId = user?.id || '';

  const refresh = useCallback(async () => {
    if (!childId) return;
    try {
      // Always fetch latest profile to ensure we have the current parent_id (in case of new linking)
      const { data: profile } = await supabase.from('profiles').select('parent_id').eq('id', childId).maybeSingle();
      const effectiveParentId = profile?.parent_id || user?.parent_id;

      const [t, s, p, b, v] = await Promise.all([
        getTasks(effectiveParentId || undefined), 
        getSubmissions(childId, 'child'), 
        getChildPoints(childId),
        getBehaviorLogs(childId, 'child'),
        getVaultData(childId)
      ]);
      setTasks(t);
      setSubmissions(s);
      setPoints(p);
      setBehaviorLogs(b);
      setVaultData(v);
    } catch (err) {
      console.error("Child refresh failed:", err);
    }
  }, [childId, user?.parent_id]);

  useEffect(() => { 
    if (childId) {
      refresh(); 

      const channel = supabase
        .channel('child-dashboard-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks' },
          () => refresh()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'task_submissions', filter: `child_id=eq.${childId}` },
          () => refresh()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'behavior_logs', filter: `child_id=eq.${childId}` },
          () => refresh()
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${childId}` },
          () => refresh()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } 
  }, [childId, refresh]);

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
            <div className="flex flex-col text-left">
              <h1 className="font-black text-xl tracking-tighter text-glow uppercase italic">Hero <span className="text-primary">{user?.name}</span></h1>
              <span className="text-[10px] font-black tracking-widest text-secondary uppercase opacity-80">Legend Level {current.level}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center px-4 py-2 bg-white/5 rounded-xl border border-white/5 mr-2">
               <Zap className="w-4 h-4 text-yellow-400 mr-2 animate-pulse" fill="currentColor" />
               <span className="font-black text-sm tracking-tighter">{points} XP</span>
            </div>
            {user && <NotificationsMenu userId={user.id} />}
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

      <main className="max-w-4xl mx-auto pt-28 pb-20 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-7 space-y-10">
            {/* Hero Card */}
            <ScrollReveal>
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-secondary rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative glass-premium rounded-[2.5rem] overflow-hidden shadow-2xl border-white/10">
                  <div className="gradient-cyber p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 p-4 opacity-10 animate-float-slow transform -rotate-12">
                      <Shield size={80} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 text-white/70">Adventure Treasure</p>
                    <div className="flex items-center justify-center gap-4">
                      <Star className="text-yellow-300 w-10 h-10 animate-pulse" fill="currentColor" />
                      <p className="text-7xl font-black drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] tracking-tighter">{points}</p>
                    </div>
                  </div>
                  
                  <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition duration-500">
                          {current.emoji}
                        </div>
                        <div className="text-left">
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
                      <div className="text-center py-6 bg-primary/10 rounded-2xl border border-primary/20 italic font-black text-xl uppercase">👑 Legendary Hero 👑</div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Dashboard Sections */}
            <ScrollReveal stagger={2}>
              <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="w-full h-16 p-2 glass-premium rounded-[1.5rem] border border-white/10 shadow-2xl mb-10">
                  <TabsTrigger value="tasks" className="flex-1 h-full rounded-xl font-black text-xs uppercase tracking-widest transition-all data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary group">
                    <ListChecks className="w-4 h-4 mr-2 group-data-[state=active]:animate-bounce" />
                    Quests
                  </TabsTrigger>
                  <TabsTrigger value="store" className="flex-1 h-full rounded-xl font-black text-xs uppercase tracking-widest transition-all data-[state=active]:bg-accent/20 data-[state=active]:text-accent group">
                    <Store className="w-4 h-4 mr-2 group-data-[state=active]:animate-bounce" />
                    Rewards
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="mt-4">
                  <TaskList tasks={tasks} submissions={submissions} childId={childId} onSubmit={refresh} />
                </TabsContent>

                <TabsContent value="store" className="mt-4">
                  <RewardsStore childId={childId} points={points} onRedeem={refresh} />
                </TabsContent>
              </Tabs>
            </ScrollReveal>
          </div>

          {/* Sidebar: Activity Logs & Vault */}
          <div className="lg:col-span-5 space-y-8">
            <ScrollReveal>
              <VaultStatus points={points} vaultData={vaultData} />
            </ScrollReveal>

            <ScrollReveal>
              <Card className="glass-premium border-none rounded-[2.5rem] p-8 min-h-[400px]">
                <div className="flex items-center gap-3 mb-8">
                  <Trophy className="text-yellow-400 w-6 h-6" />
                  <h3 className="font-black text-2xl uppercase tracking-tighter italic">Hero History</h3>
                </div>
                
                <div className="space-y-6">
                  {[
                    ...behaviorLogs.map(b => ({ ...b, type: 'behavior' as const })),
                    ...submissions.filter(s => s.status === 'approved').map(s => ({ ...s, type: 'mission' as const }))
                  ]
                  .sort((a, b) => {
                    const dateA = new Date((a as { created_at?: string; submitted_at?: string }).created_at || (a as { created_at?: string; submitted_at?: string }).submitted_at || 0).getTime();
                    const dateB = new Date((b as { created_at?: string; submitted_at?: string }).created_at || (b as { created_at?: string; submitted_at?: string }).submitted_at || 0).getTime();
                    return dateB - dateA;
                  })
                  .slice(0, 10)
                  .map((log: ActivityLog, idx: number) => (
                    <div key={idx} className="flex gap-4 items-start border-l-2 border-white/10 pl-4 py-2 relative group hover:border-primary/50 transition-colors">
                      <div className="absolute -left-[5px] top-4 w-2 h-2 rounded-full bg-white/20 group-hover:bg-primary" />
                      <div className="flex-1 text-left">
                        <p className="text-[9px] font-black text-muted-foreground uppercase opacity-50 mb-1">
                          {new Date((log as { created_at?: string; submitted_at?: string }).created_at || (log as { created_at?: string; submitted_at?: string }).submitted_at || 0).toLocaleDateString()}
                        </p>
                        <p className="text-xs font-black uppercase tracking-tight leading-none mb-1">
                          {log.type === 'behavior' ? 'Life Mission: ' + (log as BehaviorLogRow).reason : 'Mission Accomplished'}
                        </p>
                        <p className={`text-[10px] font-bold italic ${log.type === 'behavior' ? 'text-accent' : 'text-primary'}`}>
                          +{(log as BehaviorLogRow).points || (log as SubmissionRow).earned_points} XP EARNED
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {behaviorLogs.length === 0 && submissions.length === 0 && (
                    <p className="text-center py-20 text-xs font-black text-muted-foreground opacity-30 italic">No legends recorded yet. Start your first quest!</p>
                  )}
                </div>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </main>
    </BackgroundLayout>
  );
};

export default ChildDashboard;
