import { useState } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { LogIn, UserPlus, Sparkles, ShieldCheck, User as UserIcon } from 'lucide-react';
import BackgroundLayout from '@/components/layout/BackgroundLayout';
import ScrollReveal from '@/components/animation/ScrollReveal';
import ThemeToggle from '@/components/ThemeToggle';

const Login = () => {
  const { signIn, signUp, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('parent');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    // Safety Timeout: 10 seconds max to prevent infinite "SYNCING" state
    const loginTimeout = setTimeout(() => {
      setLoading(false);
      toast.error('Connection timed out. Please try the Repair button below.');
    }, 10000);

    try {
      // Step 1: Nuclear Option - Manually clear Supabase tokens from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      });
      
      // Step 2: Attempt fresh sign in
      const error = await signIn(email, password);
      if (error) {
        toast.error(error);
        setLoading(false);
        clearTimeout(loginTimeout);
      } else {
        // Check if we entered via Demo Mode
        if (localStorage.getItem('pc-guest-user')) {
          toast.success('Entering Demo Mode (Offline)');
        }
      }
      // If success, AuthContext listener will pick it up
      clearTimeout(loginTimeout);
    } catch (err: any) {
      toast.error('An unexpected error occurred. Try hitting Repair.');
      setLoading(false);
      clearTimeout(loginTimeout);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const error = await signUp(email, password, name, role);
    if (error) toast.error(error);
    else toast.success('Account created! Please sign in.');
    setLoading(false);
  };

  return (
    <BackgroundLayout variant="primary">
      {/* Theme Toggle Positioned at Top Right */}
      <div className="fixed top-6 right-6 z-[100]">
        <ThemeToggle />
      </div>

      <div className="min-h-screen flex items-center justify-center p-4">
        <ScrollReveal className="w-full max-w-md">
          <div className="text-center mb-8 animate-float-slow">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-cyber shadow-[0_0_50px_rgba(147,51,234,0.5)] mb-4">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-glow mb-2">
              PARENT<span className="text-primary italic">COMPANION</span>
            </h1>
            <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-xs">The ultimate family adventure</p>
          </div>

          <Card className="glass-premium border-none overflow-hidden hover-grow">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-transparent p-1 border-b border-white/5 rounded-none h-14">
                <TabsTrigger value="login" className="data-[state=active]:bg-white/10 data-[state=active]:text-primary font-bold text-sm transition-all rounded-xl">
                  <LogIn className="w-4 h-4 mr-2" />
                  LOGIN
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-white/10 data-[state=active]:text-primary font-bold text-sm transition-all rounded-xl">
                  <UserPlus className="w-4 h-4 mr-2" />
                  JOIN SQUAD
                </TabsTrigger>
              </TabsList>
              
              <div className="p-6">
                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">Email Address</Label>
                      <Input 
                        type="email" 
                        placeholder="hero@adventure.com" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">Secret Key</Label>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/50"
                      />
                    </div>
                    <Button type="submit" className="w-full h-14 text-md font-black gradient-cyber border-none shadow-xl hover:opacity-90 transition-all uppercase tracking-widest rounded-xl mt-4" disabled={loading}>
                      {loading ? 'SYNCING...' : 'INITIATE LOGIN'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">Full Name</Label>
                      <Input 
                        placeholder="Major Tom" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                        className="h-12 bg-white/5 border-white/10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">Email</Label>
                      <Input 
                        type="email" 
                        placeholder="hero@adventure.com" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        className="h-12 bg-white/5 border-white/10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">Passphrase</Label>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        className="h-12 bg-white/5 border-white/10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">Role</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRole('parent')}
                          className={`flex items-center justify-center p-3 rounded-xl border transition-all ${role === 'parent' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-muted-foreground'}`}
                        >
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          <span className="text-xs font-black">PARENT</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('child')}
                          className={`flex items-center justify-center p-3 rounded-xl border transition-all ${role === 'child' ? 'bg-secondary/20 border-secondary text-secondary' : 'bg-white/5 border-white/10 text-muted-foreground'}`}
                        >
                          <UserIcon className="w-4 h-4 mr-2" />
                          <span className="text-xs font-black">CHILD</span>
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-14 text-md font-black gradient-cyber border-none shadow-xl hover:opacity-90 transition-all uppercase tracking-widest rounded-xl mt-4" disabled={loading}>
                      {loading ? 'CREATING...' : 'JOIN THE SQUAD'}
                    </Button>
                  </form>
                </TabsContent>
              </div>
            </Tabs>
          </Card>
          
          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors py-2 px-4 rounded-lg border border-white/5 hover:border-primary/20 backdrop-blur-sm"
            >
              ⚠ Stuck? Click to Repair App & Reset Session
            </button>
          </div>
        </ScrollReveal>
      </div>
    </BackgroundLayout>
  );
};

export default Login;
