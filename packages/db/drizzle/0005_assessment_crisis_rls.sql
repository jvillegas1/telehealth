ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS assessment_sessions_patient ON assessment_sessions;
CREATE POLICY assessment_sessions_patient ON assessment_sessions
  FOR ALL
  USING (
    patient_profile_id IN (
      SELECT id FROM patient_profiles
      WHERE user_id = current_setting('app.user_id', true)::uuid
    )
  )
  WITH CHECK (
    patient_profile_id IN (
      SELECT id FROM patient_profiles
      WHERE user_id = current_setting('app.user_id', true)::uuid
    )
  );

DROP POLICY IF EXISTS crisis_resources_read ON crisis_resources;
CREATE POLICY crisis_resources_read ON crisis_resources
  FOR SELECT
  USING (
    active = true
    AND verified_at IS NOT NULL
    AND (
      country_id IN (SELECT country_id FROM users WHERE id = current_setting('app.user_id', true)::uuid)
      OR current_setting('app.role', true) = 'admin'
    )
  );

DROP POLICY IF EXISTS crisis_resources_admin ON crisis_resources;
CREATE POLICY crisis_resources_admin ON crisis_resources
  FOR ALL
  USING (current_setting('app.role', true) = 'admin')
  WITH CHECK (current_setting('app.role', true) = 'admin');