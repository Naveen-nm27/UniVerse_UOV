import { useState } from "react";
import { loginUser } from "../api/users";

const dashboardByRole = {
  student: "/student",
  lecturer: "/lecturer",
  administrator: "/admin",
  management_assistant: "/ma",
  hod: "/hod",
  dean: "/dean",
  ma: "/ma",
};

export default function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function updateField(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "Enter a valid email address";
    if (!form.password) nextErrors.password = "Enter your password";
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);

    setStatus("loading");
    try {
      const session = await loginUser(form);
      const destination = dashboardByRole[session.user.role];
      if (!destination) throw new Error("Your account role is not supported yet.");
      const storage = form.remember ? localStorage : sessionStorage;
      storage.setItem("universe_session", JSON.stringify(session));
      window.location.assign(destination);
    } catch (error) {
      setStatus("error");
      setMessage(error.message);
    }
  }

  return (
    <main className="login-page">
      <section className="login-showcase" aria-label="UniVerse introduction">
        <div className="brand"><span className="brand-icon">U</span><span>UniVerse</span></div>
        <div className="showcase-orbit" aria-hidden="true">
          <span className="orbit orbit-one" /><span className="orbit orbit-two" />
          <span className="spark spark-one">✦</span><span className="spark spark-two">✦</span>
          <div className="showcase-monogram">U</div>
        </div>
        <div className="showcase-copy">
          <p className="eyebrow">University of Vavuniya</p>
          <h1>Your university.<br />One connected space.</h1>
          <p>Access your academic services, campus resources, and everyday tools from one place.</p>
        </div>
        <p className="showcase-footer">Learn · Connect · Grow</p>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="mobile-brand brand"><span className="brand-icon">U</span><span>UniVerse</span></div>
        <div className="login-card">
          <header className="login-header">
            <p className="eyebrow">Welcome back</p>
            <h2 id="login-title">Sign in to UniVerse</h2>
            <p>Use the account details provided by your Management Assistant.</p>
          </header>
          <form onSubmit={handleSubmit} noValidate>
            <Field label="Email address" name="email" type="email" value={form.email} onChange={updateField} error={errors.email} placeholder="name@vau.ac.lk" autoComplete="email" />
            <Field label="Password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={updateField} error={errors.password} placeholder="Enter your password" autoComplete="current-password" action={<button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={`${showPassword ? "Hide" : "Show"} password`}>{showPassword ? "Hide" : "Show"}</button>} />
            <div className="form-options">
              <label className="remember-me"><input type="checkbox" name="remember" checked={form.remember} onChange={updateField} /><span>Keep me signed in</span></label>
              <a href="mailto:support@vau.ac.lk?subject=UniVerse password help">Forgot password?</a>
            </div>
            {message && <div className="form-message" role="alert">{message}</div>}
            <button className="login-button" type="submit" disabled={status === "loading"}><span>{status === "loading" ? "Signing you in..." : "Sign in"}</span><span aria-hidden="true">→</span></button>
          </form>
          <div className="account-note"><span aria-hidden="true">i</span><p>Accounts are created by the Management Assistant. If you need access, please contact your faculty office.</p></div>
        </div>
        <footer className="login-footer"><span>© 2026 University of Vavuniya</span><span>Privacy · Help centre</span></footer>
      </section>
    </main>
  );
}

function Field({ label, name, error, action, ...props }) {
  return <label className="field"><span className="field-label">{label}</span><span className="input-wrap"><input name={name} aria-invalid={Boolean(error)} {...props} />{action}</span>{error && <span className="field-error">{error}</span>}</label>;
}
