import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { addRedemption, getRewards, Reward, addNotification } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Store, ShoppingCart, Sparkles, Lock, Loader2 } from 'lucide-react';

interface Props {
  childId: string;
  points: number;
  onRedeem: () => void;
}

const RewardsStore = ({ childId, points, onRedeem }: Props) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRewards = useCallback(async () => {
    if (!childId) return;
    try {
      setLoading(true);
      const data = await getRewards(childId, 'child');
      setRewards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const handleRedeem = async (rewardId: string, cost: number, name: string) => {
    if (points < cost) {
      toast.error('Not enough treasure! Complete more quests. 🛡️');
      return;
    }
    try {
      await addRedemption({ child_id: childId, reward_id: rewardId, points_spent: cost });
      
      const { data } = await supabase.from('profiles').select('parent_id').eq('id', childId).maybeSingle();
      const parentId = data?.parent_id;

      if (parentId) {
        await addNotification(
          parentId,
          'New Reward Redeemed! 🎁',
          `A child just redeemed "${name}" for ${cost} XP.`
        );
      }

      onRedeem();
      toast.success(`🎊 EPIC LOOT: You redeemed "${name}"! Check your inventory. 🥳`);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Failed to redeem loot');
    }
  };

  return (
    <Card className="glass-card border-none shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 scale-150 pointer-events-none">
        <Store size={120} />
      </div>
      <CardHeader className="border-b border-white/5 pb-6">
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-cyber flex items-center justify-center shadow-lg">
                <Store className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl font-black tracking-tight underline decoration-accent/30 decoration-4 underline-offset-4 italic uppercase">Elite Loot Store</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-8 space-y-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : rewards.map(reward => {
          const canAfford = points >= reward.cost;
          return (
            <div 
                key={reward.id} 
                className={`flex items-center justify-between rounded-3xl p-5 border transition-all duration-300 group relative overflow-hidden ${
                    canAfford 
                    ? 'glass-premium border-accent/20 hover:border-accent/50 hover:scale-[1.02] shadow-xl' 
                    : 'border-white/5 bg-white/5 opacity-50 grayscale-[0.5]'
                }`}
            >
              {canAfford && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              )}
              
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg ring-4 transition-transform group-hover:scale-110 ${canAfford ? 'bg-white/10 ring-accent/20' : 'bg-muted ring-white/5'}`}>
                    {reward.icon}
                </div>
                <div>
                  <p className="font-black text-base leading-tight uppercase tracking-tight italic">{reward.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Sparkles size={12} className={canAfford ? 'text-accent animate-pulse' : 'text-muted-foreground'} />
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${canAfford ? 'text-accent-foreground drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]' : 'text-muted-foreground'}`}>{reward.cost} XP REQUIRED</p>
                  </div>
                </div>
              </div>

              <Button 
                size="lg" 
                disabled={!canAfford} 
                onClick={() => handleRedeem(reward.id, reward.cost, reward.name)} 
                className={`h-12 rounded-xl border-none shadow-2xl px-6 font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${
                    canAfford 
                    ? 'gradient-cyber hover:opacity-90 shadow-accent/25' 
                    : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                }`}
              >
                {canAfford ? (
                    <div className="flex items-center gap-2">
                        <ShoppingCart size={16} />
                        BUY
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Lock size={16} />
                        LOCK
                    </div>
                )}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default RewardsStore;
