import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TaskList from '@/components/child/TaskList';
import RewardsStore from '@/components/child/RewardsStore';
import { getTasks, getSubmissions, getChildPoints } from '@/lib/store';

const ChildDashboard = () => {
  const { user, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const childId = user?.id || 'child-1';
  const tasks = getTasks();
  const submissions = getSubmissions();
  const points = getChildPoints(childId);

  return (
    <div className="min-h-screen bg-muted/30" key={refreshKey}>
      <header className="border-b bg-background px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧒</span>
          <h1 className="font-semibold text-lg">My Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Hi, {user?.name}</span>
          <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4">
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl p-5 text-center shadow">
          <p className="text-sm opacity-90">My Points</p>
          <p className="text-4xl font-bold mt-1">⭐ {points}</p>
        </div>

        <Tabs defaultValue="tasks">
          <TabsList className="w-full">
            <TabsTrigger value="tasks" className="flex-1">Tasks</TabsTrigger>
            <TabsTrigger value="store" className="flex-1">Store 🏪</TabsTrigger>
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
