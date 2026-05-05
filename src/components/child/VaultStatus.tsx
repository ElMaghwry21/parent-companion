import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Landmark, Lock, Unlock, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  points: number; // Current points (we'll use this for now as a proxy or calculate lifetime)
  vaultData: {
    vault_total_balance: number | null;
    vault_points_threshold: number | null;
    vault_payout_amount: number | null;
  } | null;
}

export default function VaultStatus({ points, vaultData }: Props) {
  if (!vaultData || !vaultData.vault_total_balance) return null;

  const total = vaultData.vault_total_balance;
  const threshold = vaultData.vault_points_threshold || 500;
  const payout = vaultData.vault_payout_amount || 100;

  // For simplicity, let's assume 'points' here is the lifetime XP for the vault calculation
  // In a real app, you'd fetch lifetime_xp specifically
  const numPayouts = Math.floor(points / threshold);
  const unlocked = Math.min(total, numPayouts * payout);
  const locked = total - unlocked;
  
  const progressToNext = ((points % threshold) / threshold) * 100;
  const pointsToNext = threshold - (points % threshold);

  return (
    <Card className="glass-premium border-none rounded-[2.5rem] overflow-hidden shadow-2xl group">
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-primary/10">
        <div className="flex items-center gap-3">
          <Landmark className="w-5 h-5 text-primary" />
          <h3 className="font-black text-sm uppercase tracking-widest italic">Family Vault</h3>
        </div>
        <Badge className="bg-white/10 text-white font-black text-[9px] uppercase">Secure Bank</Badge>
      </div>

      <CardContent className="p-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center">
            <Unlock className="w-4 h-4 text-secondary mb-2" />
            <p className="text-2xl font-black text-glow">{unlocked} <span className="text-[10px] text-muted-foreground">EGP</span></p>
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Unlocked</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center">
            <Lock className="w-4 h-4 text-muted-foreground mb-2" />
            <p className="text-2xl font-black opacity-40">{locked} <span className="text-[10px]">EGP</span></p>
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Locked</p>
          </div>
        </div>

        {unlocked < total ? (
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-primary animate-bounce" />
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Next Payout Progress</p>
              </div>
              <p className="text-[10px] font-black">{pointsToNext} XP LEFT</p>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <Progress value={progressToNext} className="h-full bg-gradient-to-r from-primary to-secondary" />
            </div>
            <p className="text-[9px] font-bold text-center text-muted-foreground opacity-60 uppercase italic">
              Reach the milestone to unlock {payout} EGP more!
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 text-center">
            <p className="text-xs font-black text-secondary uppercase tracking-widest">🏆 All Funds Unlocked!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
