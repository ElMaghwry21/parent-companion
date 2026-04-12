import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { REWARDS, addRedemption, getChildPoints } from '@/lib/store';
import { toast } from 'sonner';

interface Props {
  childId: string;
  points: number;
  onRedeem: () => void;
}

const RewardsStore = ({ childId, points, onRedeem }: Props) => {
  const handleRedeem = (rewardId: string, cost: number, name: string) => {
    if (points < cost) {
      toast.error('Not enough points!');
      return;
    }
    addRedemption({
      id: crypto.randomUUID(),
      rewardId,
      childId,
      pointsSpent: cost,
      redeemedAt: new Date().toISOString(),
    });
    onRedeem();
    toast.success(`🎉 You redeemed "${name}"!`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">🏪 Rewards Store</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {REWARDS.map(reward => (
          <div key={reward.id} className="flex items-center justify-between border rounded-lg p-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{reward.icon}</span>
              <div>
                <p className="font-medium text-sm">{reward.name}</p>
                <p className="text-xs text-muted-foreground">{reward.cost} pts</p>
              </div>
            </div>
            <Button
              size="sm"
              variant={points >= reward.cost ? 'default' : 'outline'}
              disabled={points < reward.cost}
              onClick={() => handleRedeem(reward.id, reward.cost, reward.name)}
            >
              Redeem
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RewardsStore;
