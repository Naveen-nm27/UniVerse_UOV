import { clearStoredSession } from "../../auth/session";
import RequestState from "./components/RequestState";

export default function LecturerProfile({ profile }) {
  if (!profile) return <RequestState status="loading" message="Loading lecturer profile…" />;

  const signOut = () => {
    clearStoredSession();
    window.location.assign("/");
  };

  return (
    <>
      <section className="lecturer-panel lecturer-intro">
        <div>
          <p className="eyebrow">Profile</p>
          <h2>{profile.fullName}</h2>
          <p>{profile.title} · {profile.department}</p>
        </div>
        <div className="lecturer-actions">
          <button type="button" className="primary-button" onClick={signOut}>Sign out</button>
        </div>
      </section>

      <section className="lecturer-grid">
        <article className="lecturer-panel">
          <div className="lecturer-panel-header">
            <h3>Account</h3>
          </div>
          <ul className="lecturer-list">
            <li><strong>Email</strong><span>{profile.email}</span></li>
            <li><strong>Role</strong><span>{profile.role}</span></li>
            <li><strong>Office</strong><span>{profile.office}</span></li>
            <li><strong>Status</strong><span>{profile.status}</span></li>
          </ul>
        </article>

        <article className="lecturer-panel">
          <div className="lecturer-panel-header">
            <h3>Access summary</h3>
          </div>
          <ul className="lecturer-list">
            <li><strong>Read-only assessment access</strong><span>Allowed</span></li>
            <li><strong>Session attendance access</strong><span>Allowed</span></li>
            <li><strong>Grade editing</strong><span>Not available</span></li>
            <li><strong>Result status changes</strong><span>Managed by MA</span></li>
          </ul>
        </article>
      </section>
    </>
  );
}
