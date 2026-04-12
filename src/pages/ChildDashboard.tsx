import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import TaskList from '@/components/child/TaskList';
import RewardsStore from '@/components/child/RewardsStore';
import { getTasks, getSubmissions, getChildPoints } from '@/lib/store';
import { getLevelInfo } from '@/lib/levels';

const ChildDashboard = () => {
  const { user, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const childId = user?.id || 'child-1';
  const tasks = getTasks();
  const submissions = getSubmissions();
  const points = getChildPoints(childId);
  const { current, next, progress } = getLevelInfo(points);

  return (
    <div className="min-h-screen bg-muted/30" key={refreshKey}>
      <header className="gradient-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">{current.emoji}</span>
          <h1 className="font-bold text-lg">My Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-90">Hi, {user?.name}</span>
          <Button variant="outline" size="sm" onClick={logout} className="bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/30">
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4">
        {/* Points & Level Card */}
        <div className="rounded-2xl overflow-hidden shadow-xl">
          <div className="gradient-accent text-primary-foreground p-5 text-center">
            <p className="text-sm opacity-90 font-medium">My Points</p>
            <p className="text-5xl font-extrabold mt-1">⭐ {points}</p>
          </div>
          <div className="bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{current.emoji}</span>
                <div>
                  <p className="font-bold text-sm">Level {current.level} — {current.name}</p>
                  {next && (
                    <p className="text-xs text-muted-foreground">
                      {next.minPoints - points} pts to {next.emoji} {next.name}
                    </p>
                  )}
                </div>
              </div>
              {next && (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {progress}%
                </span>
              )}
            </div>
            {next ? (
              <div className="space-y-1">
                <Progress value={progress} className="h-3 bg-muted" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{current.minPoints} pts</span>
                  <span>{next.minPoints} pts</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-sm font-semibold text-primary">
                🎉 MAX LEVEL REACHED!
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="tasks">
          <TabsList className="w-full h-12 p-1 bg-muted">
            <TabsTrigger value="tasks" className="flex-1 h-full font-semibold data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              📝 Tasks
            </TabsTrigger>
            <TabsTrigger value="store" className="flex-1 h-full font-semibold data-[state=active]:gradient-accent data-[state=active]:text-primary-foreground">
              🏪 Store
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-4">
            <TaskList tasks={tasks} submissions={submissions} childId={childId} onSubmit={refresh} />
          </TabsContent>

          <TabsContent value="store" className="mt-4">
            <RewardsStore childId={childId} points={points} onRedeem={refresh} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ChildDashboard;
