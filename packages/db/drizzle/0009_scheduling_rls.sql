ALTER TABLE professional_availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS availability_rules_self ON professional_availability_rules;
CREATE POLICY availability_rules_self ON professional_availability_rules
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

DROP POLICY IF EXISTS availability_rules_patient_read ON professional_availability_rules;
CREATE POLICY availability_rules_patient_read ON professional_availability_rules
  FOR SELECT
  USING (
    current_setting('app.role', true) IN ('patient', 'admin')
    AND professional_profile_id IN (SELECT id FROM professional_profiles WHERE status = 'approved')
  );

DROP POLICY IF EXISTS availability_exceptions_self ON professional_availability_exceptions;
CREATE POLICY availability_exceptions_self ON professional_availability_exceptions
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

DROP POLICY IF EXISTS cancellation_policies_read ON cancellation_policies;
CREATE POLICY cancellation_policies_read ON cancellation_policies
  FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS appointments_patient ON appointments;
CREATE POLICY appointments_patient ON appointments
  FOR ALL
  USING (
    patient_profile_id IN (
      SELECT id FROM patient_profiles WHERE user_id = current_setting('app.user_id', true)::uuid
    )
  )
  WITH CHECK (
    patient_profile_id IN (
      SELECT id FROM patient_profiles WHERE user_id = current_setting('app.user_id', true)::uuid
    )
  );

DROP POLICY IF EXISTS appointments_professional ON appointments;
CREATE POLICY appointments_professional ON appointments
  FOR SELECT
  USING (
    professional_profile_id IN (
      SELECT id FROM professional_profiles WHERE user_id = current_setting('app.user_id', true)::uuid
    )
  );

DROP POLICY IF EXISTS notification_jobs_self ON notification_jobs;
CREATE POLICY notification_jobs_self ON notification_jobs
  FOR SELECT
  USING (user_id = current_setting('app.user_id', true)::uuid);