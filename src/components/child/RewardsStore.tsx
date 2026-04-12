import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { REWARDS, addRedemption } from '@/lib/store';
import { toast } from 'sonner';

interface Props {
  childId: string;
  points: number;
  onRedeem: () => void;
}

const RewardsStore = ({ childId, points, onRedeem }: Props) => {
  const handleRedeem = async (rewardId: string, cost: number, name: string) => {
    if (points < cost) {
      toast.error('Not enough points!');
      return;
    }
    try {
      await addRedemption({ child_id: childId, reward_id: rewardId, points_spent: cost });
      onRedeem();
      toast.success(`🎉 You redeemed "${name}"!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to redeem');
    }
  };

  return (
    <Card className="shadow-md theme-transition">
      <CardHeader>
        <CardTitle className="text-lg">🏪 Rewards Store</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {REWARDS.map(reward => {
          const canAfford = points >= reward.cost;
          return (
            <div key={reward.id} className={`flex items-center justify-between rounded-xl p-4 border-2 transition-all ${canAfford ? 'border-primary/20 hover:border-primary/40 bg-primary/5' : 'border-border opacity-70'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">{reward.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{reward.name}</p>
                  <p className="text-xs font-bold text-primary">{reward.cost} pts</p>
                </div>
              </div>
              <Button size="sm" disabled={!canAfford} onClick={() => handleRedeem(reward.id, reward.cost, reward.name)} className={canAfford ? 'gradient-primary border-0 text-primary-foreground shadow-md' : ''}>
                Redeem
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default RewardsStore;
