import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AddTaskForm from '@/components/parent/AddTaskForm';
import TaskReview from '@/components/parent/TaskReview';
import ThemeToggle from '@/components/ThemeToggle';
import { getTasks, getSubmissions, deleteTask, getChildPoints } from '@/lib/store';
import { getLevelInfo } from '@/lib/levels';
import { toast } from 'sonner';

const ParentDashboard = () => {
  const { user, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const tasks = getTasks();
  const submissions = getSubmissions();
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const childPoints = getChildPoints('child-1');
  const { current } = getLevelInfo(childPoints);

  return (
    <div className="min-h-screen bg-background theme-transition">
      <header className="gradient-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">👨‍👩‍👧</span>
          <h1 className="font-bold text-lg">Parent Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-90 hidden sm:inline">Hi, {user?.name}</span>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={logout} className="bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/30">
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4" key={refreshKey}>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl gradient-primary text-primary-foreground p-3 text-center shadow-md">
            <p className="text-2xl font-bold">{tasks.length}</p>
            <p className="text-xs opacity-80">Tasks</p>
          </div>
          <div className="rounded-xl gradient-accent text-primary-foreground p-3 text-center shadow-md">
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-xs opacity-80">Pending</p>
          </div>
          <div className="rounded-xl gradient-success text-primary-foreground p-3 text-center shadow-md">
            <p className="text-2xl font-bold">{current.emoji} {current.level}</p>
            <p className="text-xs opacity-80">Child Level</p>
          </div>
        </div>

        <Tabs defaultValue="tasks">
          <TabsList className="w-full h-12 p-1 bg-muted theme-transition">
            <TabsTrigger value="tasks" className="flex-1 h-full font-semibold data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              ➕ Tasks
            </TabsTrigger>
            <TabsTrigger value="review" className="flex-1 h-full font-semibold gap-1 data-[state=active]:gradient-accent data-[state=active]:text-primary-foreground">
              📋 Review
              {pendingCount > 0 && <Badge className="ml-1 h-5 px-1.5 text-xs gradient-warning border-0">{pendingCount}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4 mt-4">
            <AddTaskForm onTaskAdded={refresh} />
            <Card className="shadow-md theme-transition">
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">Active Tasks ({tasks.length})</h3>
                {tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet. Add one above!</p>}
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between border rounded-xl p-3 hover:bg-muted/50 transition-colors theme-transition">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-primary">{task.points} pts</span> • {task.type}{task.requiresProof ? ' • 📸' : ''}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { deleteTask(task.id); refresh(); toast.success('Task deleted'); }}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      🗑️
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review" className="mt-4">
            <TaskReview submissions={submissions} onUpdate={refresh} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ParentDashboard;
