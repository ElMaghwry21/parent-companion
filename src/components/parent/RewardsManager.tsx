import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getRewards, addReward, deleteReward, getRedemptions, updateRedemptionStatus, addNotification, Reward, RedemptionRow } from '@/lib/store';
import { toast } from 'sonner';
import { Store, Plus, Trash2, CheckCircle, Package } from 'lucide-react';

interface Props {
  parentId: string;
}

export default function RewardsManager({ parentId }: Props) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([]);
  
  // New Reward Form
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [icon, setIcon] = useState('🎁');

  const fetchData = async () => {
    if (!parentId) return;
    try {
      const [r, redems] = await Promise.all([
        getRewards(parentId),
        getRedemptions(parentId)
      ]);
      setRewards(r);
      setRedemptions(redems);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [parentId]);

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cost) return;
    try {
      await addReward({
        name,
        cost: parseInt(cost),
        icon,
        created_by: parentId
      });
      setName('');
      setCost('');
      toast.success("New reward added to the store!");
      fetchData();
    } catch (err) {
      toast.error("Failed to add reward");
    }
  };

  const handleDeleteReward = async (id: string) => {
    try {
      await deleteReward(id);
      toast.success("Reward deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete reward");
    }
  };

  const handleFulfillRedemption = async (id: string) => {
    try {
      const redem = redemptions.find(r => r.id === id);
      await updateRedemptionStatus(id, 'fulfilled');
      
      if (redem) {
        await addNotification(
          redem.child_id,
          'Reward Fulfilled! 🎁',
          `Your reward "${redem.reward?.name || 'Item'}" is ready! Enjoy!`
        );
      }
      
      toast.success("Reward marked as fulfilled!");
      fetchData();
    } catch (err) {
      toast.error("Failed to fulfill reward");
    }
  };

  return (
    <div className="space-y-8">
      {/* Redemptions / Fulfillment Orders */}
      <Card className="glass-premium border-none rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center gap-3 bg-white/5">
          <Package className="w-5 h-5 text-accent" />
          <h3 className="font-black text-lg uppercase tracking-tight italic">Pending Orders</h3>
        </div>
        <CardContent className="p-6">
          {redemptions.filter(r => r.status === 'pending').length === 0 ? (
            <p className="text-center py-6 text-sm font-black text-muted-foreground uppercase opacity-50">No pending orders to fulfill.</p>
          ) : (
            <div className="space-y-4">
              {redemptions.filter(r => r.status === 'pending').map(redem => (
                <div key={redem.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-accent/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-2xl">
                      {redem.reward?.icon || '🎁'}
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight">{redem.reward?.name || 'Unknown Reward'}</p>
                      <p className="text-[10px] font-black text-muted-foreground uppercase mt-1">Purchased by Child • {redem.points_spent} XP</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleFulfillRedemption(redem.id)}
                    className="gradient-cyber rounded-xl font-black uppercase text-[10px] tracking-widest px-6"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Fulfill
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rewards Management */}
      <Card className="glass-premium border-none rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-secondary" />
            <h3 className="font-black text-lg uppercase tracking-tight italic">Store Inventory</h3>
          </div>
        </div>
        <CardContent className="p-6 space-y-6">
          {/* Add New Reward Form */}
          <form onSubmit={handleAddReward} className="flex gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
            <Input 
              placeholder="Icon (e.g. 🍕)" 
              value={icon} 
              onChange={e => setIcon(e.target.value)} 
              className="w-20 bg-white/5 border-white/10 font-bold h-12 text-center"
            />
            <Input 
              placeholder="Reward Name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="flex-1 bg-white/5 border-white/10 font-bold h-12"
            />
            <Input 
              type="number"
              placeholder="XP Cost" 
              value={cost} 
              onChange={e => setCost(e.target.value)} 
              className="w-28 bg-white/5 border-white/10 font-bold h-12"
            />
            <Button type="submit" className="bg-secondary/80 hover:bg-secondary text-white h-12 rounded-xl font-black px-6">
              <Plus className="w-5 h-5" />
            </Button>
          </form>

          {/* Current Rewards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map(reward => (
              <div key={reward.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{reward.icon}</span>
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{reward.name}</p>
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest mt-1 border-white/10">
                      {reward.cost} XP
                    </Badge>
                  </div>
                </div>
                {reward.created_by !== 'system' ? (
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteReward(reward.id)} className="hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                ) : (
                  <Badge className="bg-white/10 text-white/50 border-none text-[8px] uppercase font-black">System</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
