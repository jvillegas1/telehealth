DROP POLICY IF EXISTS therapy_sessions_participant ON therapy_sessions;
CREATE POLICY therapy_sessions_participant ON therapy_sessions
  FOR ALL
  USING (
  EXISTS (
    SELECT 1
    FROM appointments a
    WHERE a.id = therapy_sessions.appointment_id
      AND (
        a.patient_profile_id IN (
          SELECT id FROM patient_profiles
          WHERE user_id = current_setting('app.user_id', true)::uuid
        )
        OR a.professional_profile_id IN (
          SELECT id FROM professional_profiles
          WHERE user_id = current_setting('app.user_id', true)::uuid
        )
      )
  )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM appointments a
      WHERE a.id = therapy_sessions.appointment_id
        AND a.professional_profile_id IN (
          SELECT id FROM professional_profiles
          WHERE user_id = current_setting('app.user_id', true)::uuid
        )
    )
  );

DROP POLICY IF EXISTS consents_recording ON consents;
CREATE POLICY consents_recording ON consents
  FOR SELECT
  USING (
    scope = 'session_recording'
    AND (
      patient_profile_id IN (
        SELECT id FROM patient_profiles WHERE user_id = current_setting('app.user_id', true)::uuid
      )
      OR professional_profile_id IN (
        SELECT id FROM professional_profiles WHERE user_id = current_setting('app.user_id', true)::uuid
      )
    )
  );