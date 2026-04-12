import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/parenting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ThemeToggle from '@/components/ThemeToggle';

const Login = () => {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);

  const handleLogin = () => {
    if (name.trim() && role) login(name.trim(), role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-primary relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-2xl border-0 theme-transition">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto w-20 h-20 rounded-2xl gradient-accent flex items-center justify-center shadow-lg">
            <span className="text-4xl">👨‍👩‍👧‍👦</span>
          </div>
          <CardTitle className="text-2xl font-bold">Smart Parenting</CardTitle>
          <CardDescription className="text-base">Motivate, track & reward your kids</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-2">
          <Input
            placeholder="Enter your name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="h-12 text-base theme-transition"
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setRole('parent')}
              className={`h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all theme-transition ${
                role === 'parent'
                  ? 'border-primary bg-primary/10 shadow-md scale-[1.02]'
                  : 'border-border hover:border-primary/40 hover:bg-muted'
              }`}
            >
              <span className="text-3xl">👨‍👩‍👧</span>
              <span className="font-semibold text-sm">Parent</span>
            </button>
            <button
              onClick={() => setRole('child')}
              className={`h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all theme-transition ${
                role === 'child'
                  ? 'border-secondary bg-secondary/10 shadow-md scale-[1.02]'
                  : 'border-border hover:border-secondary/40 hover:bg-muted'
              }`}
            >
              <span className="text-3xl">🧒</span>
              <span className="font-semibold text-sm">Child</span>
            </button>
          </div>
          <Button
            className="w-full h-12 text-base font-semibold gradient-primary border-0 text-primary-foreground"
            disabled={!name.trim() || !role}
            onClick={handleLogin}
          >
            Let's Go! 🚀
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
