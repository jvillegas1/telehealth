-- REQ-SEC-03: Row Level Security por rol
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;

ALTER TABLE patient_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE intake_forms FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS patient_profiles_self ON patient_profiles;
CREATE POLICY patient_profiles_self ON patient_profiles
  FOR ALL
  USING (user_id = current_setting('app.user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.user_id', true)::uuid);

DROP POLICY IF EXISTS professional_profiles_self ON professional_profiles;
CREATE POLICY professional_profiles_self ON professional_profiles
  FOR ALL
  USING (user_id = current_setting('app.user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.user_id', true)::uuid);

DROP POLICY IF EXISTS intake_forms_patient ON intake_forms;
CREATE POLICY intake_forms_patient ON intake_forms
  FOR SELECT
  USING (
    patient_profile_id IN (
      SELECT id FROM patient_profiles
      WHERE user_id = current_setting('app.user_id', true)::uuid
    )
  );

DROP POLICY IF EXISTS intake_forms_patient_write ON intake_forms;
CREATE POLICY intake_forms_patient_write ON intake_forms
  FOR INSERT
  WITH CHECK (
    patient_profile_id IN (
      SELECT id FROM patient_profiles
      WHERE user_id = current_setting('app.user_id', true)::uuid
    )
  );

DROP POLICY IF EXISTS intake_forms_professional ON intake_forms;
CREATE POLICY intake_forms_professional ON intake_forms
  FOR SELECT
  USING (
    current_setting('app.role', true) = 'professional'
    AND EXISTS (
      SELECT 1
      FROM consents c
      INNER JOIN professional_profiles pp ON pp.id = c.professional_profile_id
      WHERE c.intake_form_id = intake_forms.id
        AND pp.user_id = current_setting('app.user_id', true)::uuid
        AND c.revoked_at IS NULL
    )
  );

DROP POLICY IF EXISTS intake_forms_admin ON intake_forms;
CREATE POLICY intake_forms_admin ON intake_forms
  FOR SELECT
  USING (current_setting('app.role', true) = 'admin');

DROP POLICY IF EXISTS consents_patient ON consents;
CREATE POLICY consents_patient ON consents
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