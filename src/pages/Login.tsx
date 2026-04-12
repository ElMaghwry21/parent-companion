import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/parenting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const Login = () => {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);

  const handleLogin = () => {
    if (name.trim() && role) login(name.trim(), role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="text-5xl mb-2">👨‍👩‍👧‍👦</div>
          <CardTitle className="text-2xl">Smart Parenting</CardTitle>
          <CardDescription>Motivate, track & reward</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Enter your name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={role === 'parent' ? 'default' : 'outline'}
              className="h-20 flex-col gap-1 text-base"
              onClick={() => setRole('parent')}
            >
              <span className="text-2xl">👨‍👩‍👧</span>
              Parent
            </Button>
            <Button
              variant={role === 'child' ? 'default' : 'outline'}
              className="h-20 flex-col gap-1 text-base"
              onClick={() => setRole('child')}
            >
              <span className="text-2xl">🧒</span>
              Child
            </Button>
          </div>
          <Button
            className="w-full h-12 text-base"
            disabled={!name.trim() || !role}
            onClick={handleLogin}
          >
            Log In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
