-- REQ-MOD-02 / REQ-MOD-03: directorio público acotado y datos de verificación
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS professional_profiles_public_read ON professional_profiles;
CREATE POLICY professional_profiles_public_read ON professional_profiles
  FOR SELECT
  USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1 FROM credentials c
      WHERE c.professional_profile_id = professional_profiles.id
        AND c.status = 'verified'
    )
    AND current_setting('app.role', true) IN ('patient', 'professional', 'admin')
  );

DROP POLICY IF EXISTS professional_profiles_admin ON professional_profiles;
CREATE POLICY professional_profiles_admin ON professional_profiles
  FOR ALL
  USING (current_setting('app.role', true) = 'admin')
  WITH CHECK (current_setting('app.role', true) = 'admin');

DROP POLICY IF EXISTS credentials_self ON credentials;
CREATE POLICY credentials_self ON credentials
  FOR ALL
  USING (
    professional_profile_id IN (
      SELECT id FROM professional_profiles
      WHERE user_id = current_setting('app.user_id', true)::uuid
    )
  )
  WITH CHECK (
    professional_profile_id IN (
      SELECT id FROM professional_profiles
      WHERE user_id = current_setting('app.user_id', true)::uuid
    )
  );

DROP POLICY IF EXISTS credentials_admin ON credentials;
CREATE POLICY credentials_admin ON credentials
  FOR ALL
  USING (current_setting('app.role', true) = 'admin')
  WITH CHECK (current_setting('app.role', true) = 'admin');

DROP POLICY IF EXISTS credential_documents_self ON credential_documents;
CREATE POLICY credential_documents_self ON credential_documents
  FOR ALL
  USING (
    credential_id IN (
      SELECT c.id FROM credentials c
      INNER JOIN professional_profiles pp ON pp.id = c.professional_profile_id
      WHERE pp.user_id = current_setting('app.user_id', true)::uuid
    )
  )
  WITH CHECK (
    credential_id IN (
      SELECT c.id FROM credentials c
      INNER JOIN professional_profiles pp ON pp.id = c.professional_profile_id
      WHERE pp.user_id = current_setting('app.user_id', true)::uuid
    )
  );

DROP POLICY IF EXISTS credential_documents_admin ON credential_documents;
CREATE POLICY credential_documents_admin ON credential_documents
  FOR ALL
  USING (current_setting('app.role', true) = 'admin')
  WITH CHECK (current_setting('app.role', true) = 'admin');

DROP POLICY IF EXISTS availability_public_read ON availability;
CREATE POLICY availability_public_read ON availability
  FOR SELECT
  USING (
 professional_profile_id IN (
      SELECT id FROM professional_profiles
      WHERE status = 'approved'
    )
    AND current_setting('app.role', true) IN ('patient', 'professional', 'admin')
  );

DROP POLICY IF EXISTS availability_self ON availability;
CREATE POLICY availability_self ON availability
  FOR ALL
  USING (
    professional_profile_id IN (
      SELECT id FROM professional_profiles
      WHERE user_id = current_setting('app.user_id', true)::uuid
    )
  )
  WITH CHECK (
    professional_profile_id IN (
      SELECT id FROM professional_profiles
      WHERE user_id = current_setting('app.user_id', true)::uuid
    )
  );

DROP POLICY IF EXISTS professional_reviews_read_visible ON professional_reviews;
CREATE POLICY professional_reviews_read_visible ON professional_reviews
  FOR SELECT
  USING (
    moderation_status = 'visible'
    AND professional_profile_id IN (
      SELECT id FROM professional_profiles WHERE status = 'approved'
    )
  );

DROP POLICY IF EXISTS professional_reviews_patient_write ON professional_reviews;
CREATE POLICY professional_reviews_patient_write ON professional_reviews
  FOR INSERT
  WITH CHECK (
    patient_profile_id IN (
      SELECT id FROM patient_profiles
      WHERE user_id = current_setting('app.user_id', true)::uuid
    )
  );

DROP POLICY IF EXISTS professional_reviews_admin ON professional_reviews;
CREATE POLICY professional_reviews_admin ON professional_reviews
  FOR ALL
  USING (current_setting('app.role', true) = 'admin')
  WITH CHECK (current_setting('app.role', true) = 'admin');