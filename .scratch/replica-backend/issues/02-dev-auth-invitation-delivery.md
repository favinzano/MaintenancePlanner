# Verify development Auth invitation send path

Type: task
Status: resolved
Triage: ready-for-agent
Blocked by: none

## Request

Verify one invitation from the hosted development project to its Supabase organization owner and provision the matching PlannerMC profile. Keep this verification separate from production SMTP setup.

## Answer

- Sent one invitation from `plannermc-dev` using the existing `npm run invite-user` operator script.
- Supabase Auth logged `mail.send` with `mail_type: invite` and returned HTTP 200 for `POST /invite` at 2026-10-31 13:32:10 UTC.
- Read-only database verification confirmed the Auth user has an invitation record and that the PlannerMC user and preferences rows exist in the same workspace.
- The SMTP host is still unconfigured. This verifies the built-in development relay for an organization member; it does not verify delivery to arbitrary recipients or production readiness.
- Reading the connected Gmail mailbox was rejected by automatic review, so receipt in Inbox or Spam is unverified.
