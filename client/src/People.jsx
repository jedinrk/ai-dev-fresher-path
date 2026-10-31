import { useEffect, useState } from "react"
import { api } from "./api"
import { PageHeading } from "./ui"
import { formatDate } from "./mentorUtils"
import { Stats } from "./MentorStats"

export default function People({ user, tab = "people" }) {
  const [people, setPeople] = useState(null)
  const [cohorts, setCohorts] = useState([])
  const [events, setEvents] = useState(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [reload, setReload] = useState(0)
  const [search, setSearch] = useState("")
  const [activityEmail, setActivityEmail] = useState("")
  const [edit, setEdit] = useState(null)
  const [cohortName, setCohortName] = useState("")
  useEffect(() => {
    let active = true
    Promise.all([api.listPeople(), api.listCohorts()])
      .then(([p, c]) => {
        if (active) {
          setPeople(p)
          setCohorts(c)
          setError("")
        }
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [reload])
  useEffect(() => {
    if (tab !== "activity") return
    let active = true
    api
      .loginActivity(activityEmail)
      .then((data) => {
        if (active) {
          setEvents(data)
          setError("")
        }
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [tab, activityEmail, reload])
  async function action(fn, success) {
    setBusy(true)
    setError("")
    setMessage("")
    try {
      await fn()
      setMessage(success)
      setEdit(null)
      try {
        const [p, c] = await Promise.all([api.listPeople(), api.listCohorts()])
        setPeople(p)
        setCohorts(c)
      } catch {
        setError(
          "Saved, but the list could not refresh. Refresh to see the latest details.",
        )
      }
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }
  const registered = (people || []).filter((p) => p.registeredAt)
  const invited = (people || []).filter((p) => !p.registeredAt)
  const visible = (tab === "invitations" ? invited : registered).filter((p) =>
    `${p.name || ""} ${p.email} ${p.cohortName || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )
  return (
    <>
      <PageHeading
        eyebrow="ADMINISTRATION"
        title="People & access"
        description="Manage membership, registration access and account activity in one place."
      >
        <button
          className="button primary"
          disabled={busy}
          onClick={() =>
            setEdit({
              email: "",
              role: "intern",
              cohortId: cohorts[0]?.id || 1,
              isNew: true,
            })
          }
        >
          Invite people +
        </button>
      </PageHeading>
      {error && (
        <p role="alert" className="error-banner">
          {error}{" "}
          <button disabled={busy} onClick={() => setReload((v) => v + 1)}>
            Refresh
          </button>
        </p>
      )}
      {message && (
        <p role="status" className="success-line">
          {message}
        </p>
      )}
      <Stats
        items={[
          [people ? registered.length : "—", "Registered accounts with access"],
          [people ? invited.length : "—", "Awaiting registration"],
          [
            people ? registered.filter((p) => p.role === "intern").length : "—",
            "Learners",
          ],
          [cohorts.length, "Cohorts"],
        ]}
      />
      <nav className="mentor-tabs" aria-label="People and access">
        {[
          ["people", "People"],
          ["invitations", `Invitations${people ? ` · ${invited.length}` : ""}`],
          ["cohorts", "Cohorts"],
          ["activity", "Login activity"],
        ].map(([key, label]) => (
          <a
            key={key}
            href={`#people/${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={tab === key ? "active" : ""}
          >
            {label}
          </a>
        ))}
      </nav>
      {edit && (
        <section
          className="panel"
          aria-label={edit.isNew ? "Invite a person" : "Manage account"}
        >
          <div className="section-heading">
            <h2>
              {edit.isNew
                ? "Invite a person"
                : `Manage ${edit.name || edit.email}`}
            </h2>
            <button disabled={busy} onClick={() => setEdit(null)}>
              Cancel
            </button>
          </div>
          <p className="muted">
            This grants access to register. Share the registration link
            yourself; no email is sent. Access remains valid until revoked.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (
                edit.isNew &&
                people?.some((p) => p.email === edit.email.trim().toLowerCase())
              ) {
                setError(
                  "This email already has access. Use Manage to change their role or cohort.",
                )
                return
              }
              if (
                !edit.isNew &&
                edit.role !== edit.originalRole &&
                !window.confirm(
                  `Change ${edit.email} to ${edit.role === "mentor" ? "Mentor (including account administration)" : "Learner"}?`,
                )
              )
                return
              await action(
                () =>
                  api.addAllowlistEntry(
                    edit.email.trim(),
                    edit.role,
                    edit.role === "intern" ? Number(edit.cohortId) : undefined,
                  ),
                edit.isNew
                  ? "Registration access granted. Share the registration link with this person."
                  : "Account updated.",
              )
            }}
          >
            <div className="people-form-grid">
              <div>
                <label htmlFor="person-email">Email</label>
                <input
                  id="person-email"
                  type="email"
                  required
                  maxLength={254}
                  disabled={busy || !edit.isNew}
                  value={edit.email}
                  onChange={(e) => setEdit({ ...edit, email: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="person-role">Role</label>
                <select
                  id="person-role"
                  value={edit.role}
                  disabled={busy || edit.email === user.email}
                  onChange={(e) => setEdit({ ...edit, role: e.target.value })}
                >
                  <option value="intern">Learner</option>
                  <option value="mentor">
                    Mentor (includes administration)
                  </option>
                </select>
              </div>
              {edit.role === "intern" && (
                <div>
                  <label htmlFor="person-cohort">Cohort</label>
                  <select
                    id="person-cohort"
                    value={edit.cohortId || 1}
                    disabled={busy}
                    onChange={(e) =>
                      setEdit({ ...edit, cohortId: Number(e.target.value) })
                    }
                  >
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <button className="button primary" disabled={busy}>
              {busy
                ? "Saving…"
                : edit.isNew
                  ? "Grant registration access"
                  : "Save changes"}
            </button>
          </form>
          {!edit.isNew && edit.email !== user.email && (
            <div className="people-access-actions">
              <p>
                Revoking access blocks sign-in immediately. Learning records are
                preserved; you can restore access by inviting the same email
                again.
              </p>
              <button
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      `Revoke access for ${edit.email}? They will lose access immediately. Their learning records will be kept.`,
                    )
                  )
                    action(
                      () => api.removeAllowlistEntry(edit.email),
                      "Access revoked. Learning records have been preserved.",
                    )
                }}
              >
                Revoke access
              </button>
            </div>
          )}
        </section>
      )}
      {["people", "invitations"].includes(tab) && (
        <section className="panel">
          <div className="section-heading">
            <h2>
              {tab === "invitations"
                ? "Awaiting registration"
                : "People with access"}
            </h2>
            <div>
              <label htmlFor="people-search">Search people</label>
              <input
                id="people-search"
                type="search"
                value={search}
                placeholder="Name, email or cohort"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          {tab === "invitations" && (
            <div className="mentor-invite-link">
              <p>
                Invited people can register using their approved email. No email
                is sent automatically.
              </p>
              <label htmlFor="registration-link">
                Registration link to share
              </label>
              <input
                id="registration-link"
                readOnly
                value={`${window.location.origin}/`}
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `${window.location.origin}/`,
                    )
                    setMessage(
                      "Registration link copied. Ask the recipient to choose Create account.",
                    )
                  } catch {
                    setError(
                      "Could not copy the link. Select and copy it from the field above.",
                    )
                  }
                }}
              >
                Copy registration link
              </button>
              <p className="small muted">
                Ask the recipient to choose Create account. Invitations do not
                expire automatically.
              </p>
            </div>
          )}
          {!people && !error && <p role="status">Loading people…</p>}
          {people && !visible.length && (
            <div className="empty-state">
              <h3>
                {search
                  ? "No people match your search."
                  : tab === "invitations"
                    ? "No pending registrations."
                    : "No registered accounts."}
              </h3>
              <p>
                {search
                  ? "Try a different name, email or cohort."
                  : "Use Invite people to grant registration access."}
              </p>
            </div>
          )}
          {!!visible.length && (
            <div
              className="mentor-table-wrap"
              role="region"
              aria-label="Account details table"
              tabIndex={0}
            >
              <table className="mentor-table">
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Role / cohort</th>
                    <th>
                      {tab === "invitations"
                        ? "Access granted"
                        : "Last successful sign-in"}
                    </th>
                    <th>Status</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => (
                    <tr key={p.email}>
                      <td>
                        <strong>{p.name || p.email}</strong>
                        {p.name && <small>{p.email}</small>}
                      </td>
                      <td>
                        {p.role === "intern" ? "Learner" : "Mentor"}
                        <small>
                          {p.role === "intern"
                            ? p.cohortName || "Unassigned"
                            : "Includes administration"}
                        </small>
                      </td>
                      <td>
                        {formatDate(
                          tab === "invitations" ? p.invitedAt : p.lastLogin,
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${p.registeredAt ? "badge-green" : "badge-gold"}`}
                        >
                          {p.registeredAt ? "Active" : "Awaiting registration"}
                        </span>
                      </td>
                      <td>
                        <button
                          disabled={busy}
                          aria-label={`Manage ${p.email}`}
                          onClick={() =>
                            setEdit({
                              ...p,
                              originalRole: p.role,
                              isNew: false,
                            })
                          }
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
      {tab === "cohorts" && (
        <section className="panel">
          <h2>Cohorts</h2>
          <p className="muted">
            Create groups here, then use Manage on a learner or invitation to
            assign their cohort. A learner belongs to one cohort; mentors can
            view all cohorts.
          </p>
          <form
            className="mentor-toolbar"
            onSubmit={async (e) => {
              e.preventDefault()
              if (
                await action(
                  () => api.createCohort(cohortName),
                  "Cohort created. Assign learners from the People tab.",
                )
              )
                setCohortName("")
            }}
          >
            <div>
              <label htmlFor="cohort-name">New cohort name</label>
              <input
                id="cohort-name"
                required
                maxLength={100}
                value={cohortName}
                disabled={busy}
                onChange={(e) => setCohortName(e.target.value)}
                placeholder="e.g. November 2026"
              />
            </div>
            <button
              className="button primary"
              disabled={busy || !cohortName.trim()}
            >
              Create cohort
            </button>
          </form>
          {cohorts.map((c) => (
            <div key={c.id} className="mentor-lesson-row">
              <div>
                <strong>{c.name}</strong>
                <span className="muted small">
                  {
                    (people || []).filter(
                      (p) =>
                        p.role === "intern" &&
                        p.cohortId === c.id &&
                        p.registeredAt,
                    ).length
                  }{" "}
                  registered learners ·{" "}
                  {
                    (people || []).filter(
                      (p) =>
                        p.role === "intern" &&
                        p.cohortId === c.id &&
                        !p.registeredAt,
                    ).length
                  }{" "}
                  awaiting registration
                </span>
              </div>
              <a className="text-link" href={`#mentor?cohort=${c.id}`}>
                View progress →
              </a>
            </div>
          ))}
        </section>
      )}
      {tab === "activity" && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Login activity</h2>
              <p className="muted">
                Latest 100 events. Tracking begins with this update; earlier
                activity is not recorded.
              </p>
            </div>
            <button onClick={() => setReload((v) => v + 1)}>
              Refresh activity
            </button>
          </div>
          <label htmlFor="activity-person">Person</label>
          <select
            id="activity-person"
            value={activityEmail}
            onChange={(e) => {
              setEvents(null)
              setActivityEmail(e.target.value)
            }}
          >
            <option value="">All people (including revoked access)</option>
            {registered.map((p) => (
              <option key={p.email} value={p.email}>
                {p.name} · {p.email}
              </option>
            ))}
          </select>
          {!events && !error && <p role="status">Loading login activity…</p>}
          {events?.length === 0 && (
            <p className="empty-state">
              No recorded login events for this selection.
            </p>
          )}
          {!!events?.length && (
            <div
              className="mentor-table-wrap"
              role="region"
              aria-label="Account details table"
              tabIndex={0}
            >
              <table className="mentor-table">
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Event</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id}>
                      <td>{e.email}</td>
                      <td>
                        {
                          {
                            success: "Signed in",
                            registered: "Registered and signed in",
                            failed: "Failed sign-in attempt",
                            denied: "Sign-in denied: access revoked",
                          }[e.outcome]
                        }
                      </td>
                      <td>{formatDate(e.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="muted small">
            Failed events are recorded for known accounts only. Sign-ins do not
            measure learning progress or time spent studying.
          </p>
        </section>
      )}
    </>
  )
}
