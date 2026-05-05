import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Landmark, Info, ShieldCheck, Wallet, ArrowUpRight } from 'lucide-react';
import { updateVaultSettings, getLinkedChildren } from '@/lib/store';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Props {
  parentId: string;
}

export default function VaultManager({ parentId }: Props) {
  const [childId, setChildId] = useState('');
  const [total, setTotal] = useState(1000);
  const [threshold, setThreshold] = useState(500);
  const [payout, setPayout] = useState(100);
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<any[]>([]);

  useEffect(() => {
    const fetchChildren = async () => {
      const kids = await getLinkedChildren(parentId);
      setChildren(kids);
      if (kids.length > 0) {
        setChildId(kids[0].id);
        setTotal(kids[0].vault_total_balance || 1000);
        setThreshold(kids[0].vault_points_threshold || 500);
        setPayout(kids[0].vault_payout_amount || 100);
      }
    };
    fetchChildren();
  }, [parentId]);

  const handleUpdate = async () => {
    if (!childId) return;
    setLoading(true);
    try {
      await updateVaultSettings(childId, { total, threshold, payout });
      toast.success("Family Bank rules updated!");
    } catch (err) {
      toast.error("Failed to update vault");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-premium border-none rounded-[2rem] overflow-hidden">
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <Landmark className="w-6 h-6 text-primary" />
          <h3 className="font-black text-xl uppercase tracking-tighter italic">Family Bank & Vault</h3>
        </div>
        <Badge className="bg-primary/20 text-primary border-none font-black text-[10px]">PARENTAL CONTROL</Badge>
      </div>
      
      <CardContent className="p-8 space-y-8">
        <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <Info className="w-5 h-5 text-primary mt-1 shrink-0" />
          <p className="text-xs font-bold leading-relaxed opacity-80">
            This vault allows you to deposit a large sum for your child. They only "unlock" specific amounts when they reach XP milestones that YOU define.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Total Vault Deposit (EGP)</Label>
              <div className="relative">
                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="number" 
                  value={total} 
                  onChange={e => setTotal(Number(e.target.value))}
                  className="h-14 bg-white/5 border-white/10 rounded-xl pl-12 font-black text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">XP Milestone Threshold</Label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="number" 
                  value={threshold} 
                  onChange={e => setThreshold(Number(e.target.value))}
                  className="h-14 bg-white/5 border-white/10 rounded-xl pl-12 font-black text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Payout Per Milestone (EGP)</Label>
              <div className="relative">
                <ArrowUpRight className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="number" 
                  value={payout} 
                  onChange={e => setPayout(Number(e.target.value))}
                  className="h-14 bg-white/5 border-white/10 rounded-xl pl-12 font-black text-lg"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-[2rem] p-8 flex flex-col justify-center border border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <Landmark size={120} />
             </div>
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Current Rule Preview</p>
             <div className="space-y-4 relative z-10">
                <p className="text-2xl font-black italic tracking-tighter">
                  Every <span className="text-primary">{threshold} XP</span> child earns,
                </p>
                <p className="text-2xl font-black italic tracking-tighter">
                  unlock <span className="text-secondary">{payout} EGP</span> from the
                </p>
                <p className="text-2xl font-black italic tracking-tighter">
                  <span className="text-glow">{total} EGP</span> total vault.
                </p>
             </div>
          </div>
        </div>

        <Button 
          onClick={handleUpdate} 
          className="w-full h-16 gradient-cyber rounded-2xl font-black text-lg uppercase tracking-widest shadow-2xl"
          disabled={loading}
        >
          {loading ? 'SYNCING VAULT...' : 'UPDATE BANK PROTOCOLS'}
        </Button>
      </CardContent>
    </Card>
  );
}
