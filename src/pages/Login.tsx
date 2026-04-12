import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ThemeToggle from '@/components/ThemeToggle';
import { toast } from 'sonner';

const Login = () => {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'parent' | 'child' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const err = await signIn(email, password);
    setLoading(false);
    if (err) toast.error(err);
  };

  const handleSignup = async () => {
    if (!email || !password || !name.trim() || !role) return;
    setLoading(true);
    const err = await signUp(email, password, name.trim(), role);
    setLoading(false);
    if (err) toast.error(err);
    else toast.success('Account created! You are now logged in.');
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
        <CardContent className="pt-2">
          <Tabs value={tab} onValueChange={v => setTab(v as 'login' | 'signup')}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="login" className="flex-1">Log In</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <Input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-12" />
              <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-12" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              <Button className="w-full h-12 text-base font-semibold gradient-primary border-0 text-primary-foreground" disabled={loading || !email || !password} onClick={handleLogin}>
                {loading ? 'Logging in...' : 'Log In 🚀'}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <Input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} className="h-12" />
              <Input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-12" />
              <Input placeholder="Password (min 6 chars)" type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-12" />
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRole('parent')}
                  className={`h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all theme-transition ${
                    role === 'parent' ? 'border-primary bg-primary/10 shadow-md scale-[1.02]' : 'border-border hover:border-primary/40 hover:bg-muted'
                  }`}
                >
                  <span className="text-3xl">👨‍👩‍👧</span>
                  <span className="font-semibold text-sm">Parent</span>
                </button>
                <button
                  onClick={() => setRole('child')}
                  className={`h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all theme-transition ${
                    role === 'child' ? 'border-secondary bg-secondary/10 shadow-md scale-[1.02]' : 'border-border hover:border-secondary/40 hover:bg-muted'
                  }`}
                >
                  <span className="text-3xl">🧒</span>
                  <span className="font-semibold text-sm">Child</span>
                </button>
              </div>
              <Button className="w-full h-12 text-base font-semibold gradient-primary border-0 text-primary-foreground" disabled={loading || !email || !password || !name.trim() || !role} onClick={handleSignup}>
                {loading ? 'Creating...' : 'Create Account 🎉'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
