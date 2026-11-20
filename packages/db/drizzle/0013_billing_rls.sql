ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_payout_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS commission_rules_read ON commission_rules;
CREATE POLICY commission_rules_read ON commission_rules
  FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS settlement_batches_professional ON settlement_batches;
CREATE POLICY settlement_batches_professional ON settlement_batches
  FOR ALL
  USING (
    professional_profile_id IN (
      SELECT id FROM professional_profiles WHERE user_id = current_setting('app.user_id', true)::uuid
    )
  );

DROP POLICY IF EXISTS settlement_items_professional ON settlement_items;
CREATE POLICY settlement_items_professional ON settlement_items
  FOR SELECT
  USING (
    settlement_batch_id IN (
      SELECT sb.id
      FROM settlement_batches sb
      INNER JOIN professional_profiles pp ON pp.id = sb.professional_profile_id
      WHERE pp.user_id = current_setting('app.user_id', true)::uuid
    )
  );

DROP POLICY IF EXISTS payout_credentials_self ON professional_payout_credentials;
CREATE POLICY payout_credentials_self ON professional_payout_credentials
  FOR ALL
  USING (
    professional_profile_id IN (
      SELECT id FROM professional_profiles WHERE user_id = current_setting('app.user_id', true)::uuid
    )
  )
  WITH CHECK (
    professional_profile_id IN (
      SELECT id FROM professional_profiles WHERE user_id = current_setting('app.user_id', true)::uuid
    )
  );