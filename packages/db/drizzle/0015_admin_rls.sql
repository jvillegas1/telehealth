ALTER TABLE admin_staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensitive_access_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_staff_self ON admin_staff_assignments;
CREATE POLICY admin_staff_self ON admin_staff_assignments
  FOR SELECT
  USING (user_id = current_setting('app.user_id', true)::uuid);

DROP POLICY IF EXISTS sensitive_access_requester ON sensitive_access_grants;
CREATE POLICY sensitive_access_requester ON sensitive_access_grants
  FOR ALL
  USING (requester_user_id = current_setting('app.user_id', true)::uuid)
  WITH CHECK (requester_user_id = current_setting('app.user_id', true)::uuid);