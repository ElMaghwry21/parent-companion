import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AddTaskForm from '@/components/parent/AddTaskForm';
import TaskReview from '@/components/parent/TaskReview';
import { getTasks, getSubmissions, deleteTask } from '@/lib/store';
import { toast } from 'sonner';

const ParentDashboard = () => {
  const { user, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const tasks = getTasks();
  const submissions = getSubmissions();
  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">👨‍👩‍👧</span>
          <h1 className="font-semibold text-lg">Parent Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Hi, {user?.name}</span>
          <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4" key={refreshKey}>
        <Tabs defaultValue="tasks">
          <TabsList className="w-full">
            <TabsTrigger value="tasks" className="flex-1">Tasks</TabsTrigger>
            <TabsTrigger value="review" className="flex-1 gap-1">
              Review
              {pendingCount > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{pendingCount}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4 mt-4">
            <AddTaskForm onTaskAdded={refresh} />
            <Card>
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground mb-3">Active Tasks ({tasks.length})</h3>
                {tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet. Add one above!</p>}
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.points} pts • {task.type}{task.requiresProof ? ' • 📸' : ''}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { deleteTask(task.id); refresh(); toast.success('Task deleted'); }}
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
