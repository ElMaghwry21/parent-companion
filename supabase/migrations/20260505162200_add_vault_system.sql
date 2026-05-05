ALTER TABLE profiles 
ADD COLUMN vault_total_balance DECIMAL DEFAULT 0,
ADD COLUMN vault_unlocked_balance DECIMAL DEFAULT 0,
ADD COLUMN vault_points_threshold INTEGER DEFAULT 500,
ADD COLUMN vault_payout_amount DECIMAL DEFAULT 100;

COMMENT ON COLUMN profiles.vault_total_balance IS 'The total amount of money the parent has put in the vault.';
COMMENT ON COLUMN profiles.vault_unlocked_balance IS 'The amount of money the child has actually earned/unlocked.';
COMMENT ON COLUMN profiles.vault_points_threshold IS 'How many points are needed to unlock one payout.';
COMMENT ON COLUMN profiles.vault_payout_amount IS 'How much money is unlocked per threshold.';
