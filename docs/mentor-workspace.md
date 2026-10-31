# Mentor workspace

Mentors use **Cohort overview** to select a cohort, search learners by name/email, and filter for pending reviews, questions or revisions. Opening a profile preserves those filters in the URL, so Back to cohort overview returns to the same list.

Each learner profile has four views:

- **Progress:** week and lesson stages, lesson completion counts, and separate checkpoint sign-off counts.
- **Responses:** the published lesson prompt, exact initial prediction, and latest saved explained-back response. Responses stay available after checkpoint sign-off. Unsaved drafts and self-check option attempts are not recorded.
- **Checkpoints & feedback:** evidence, review criteria, feedback, request-changes and sign-off actions. New submissions and decisions retain an evidence/feedback history. Older records show their latest saved feedback; no earlier history is invented.
- **Questions:** all learner questions, including answered and closed questions. New questions opened from lessons record the lesson ID. Older questions without it say “No lesson context recorded.”

Original foundation sign-offs appear in an expandable archive on the learner profile. They keep their original week mapping and do not count as sign-offs for the current curriculum.

## People & access

This is a separate mentor-only destination:

- **People:** manage existing accounts' roles and cohort membership, or revoke access. Mentor roles include administration; this release does not introduce a separate administrator role.
- **Invitations:** grant registration access and copy the application link for manual sharing. The recipient chooses Create an account and registers with the approved email. No email is sent automatically, and access does not expire automatically. A pending registration becomes an active account after registration. Revoking access preserves learning records; inviting the same email restores access to the existing account.
- **Cohorts:** create named cohorts. Each learner has one cohort. Existing invited learners are initially assigned to Current cohort. All mentors can view all cohorts; cohorts are organizational groups, not separate security tenants.
- **Login activity:** latest 100 events, optionally filtered by registered person. Records successful sign-in, registration, failed sign-in for known accounts, and denial after access revocation. Times include the viewer's local timezone. Passwords, cookies and session tokens are never included. Prior activity is “Not recorded.”

Last saved learning activity is calculated from saved progress, predictions, explanations, learner questions and checkpoint submissions. It is separate from sign-in activity and does not measure study duration.

## Routes and data

Routes use the existing URL fragment router: `#mentor?cohort=1&filter=review&q=name`, `#mentor/<encoded-email>/progress/1`, `#mentor/<encoded-email>/responses/1/L01`, `#mentor/<encoded-email>/reviews/1`, `#mentor/<encoded-email>/questions`, and `#people/{people,invitations,cohorts,activity}`.

The SQLite upgrade is additive and runs at startup. It adds cohort membership, login events and review history tables, plus nullable lesson context on questions. Existing learning records are retained. New mentor detail and people endpoints use the existing server-side session, allowlist and mentor checks. Self-removal and last-mentor role protections remain in place.
