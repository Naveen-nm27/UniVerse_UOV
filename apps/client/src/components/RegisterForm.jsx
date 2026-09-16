import { useMemo, useState } from "react";
import { registerUser } from "../api/users";

const programmes = [
  { id: "11111111-1111-4111-8111-111111111111", label: "BSc (Hons) Information and Communication Technology" },
  { id: "22222222-2222-4222-8222-222222222222", label: "BSc (Hons) Computer Science" },
  { id: "33333333-3333-4333-8333-333333333333", label: "BSc (Hons) Software Engineering" },
];

const batches = [
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", label: "2026 / 2027" },
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", label: "2025 / 2026" },
  { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", label: "2024 / 2025" },
];

const initialForm = {
  fullName: "",
  email: "",
  studentNumber: "",
  programmeId: "",
  batchId: "",
  password: "",
  confirmPassword: "",
  terms: false,
};

export default function RegisterForm() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordChecks = useMemo(() => [
    ["8 characters", form.password.length >= 8],
    ["One uppercase letter", /[A-Z]/.test(form.password)],
    ["One number", /\d/.test(form.password)],
  ], [form.password]);

  const passwordScore = passwordChecks.filter(([, passes]) => passes).length;

  function updateField(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setMessage("");
  }

  function validate() {
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "Enter a valid university email";
    if (!form.studentNumber.trim()) nextErrors.studentNumber = "Enter your student number";
    if (!form.programmeId) nextErrors.programmeId = "Choose your programme";
    if (!form.batchId) nextErrors.batchId = "Choose your batch";
    if (passwordScore < 3) nextErrors.password = "Use all three password requirements";
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
    if (!form.terms) nextErrors.terms = "Please accept the terms to continue";
    return nextErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setMessage("Please review the highlighted fields.");
      return;
    }

    setStatus("loading");
    setErrors({});
    try {
      const user = await registerUser(form);
      setStatus("success");
      setMessage(`Welcome to UniVerse, ${user.fullName}. Your account is ready.`);
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  }

  if (status === "success") {
    return (
      <main className="register-page">
        <section className="success-panel" aria-live="polite">
          <div className="success-mark" aria-hidden="true">OK</div>
          <p className="eyebrow">Registration complete</p>
          <h1>Your UniVerse starts here.</h1>
          <p>{message}</p>
          <button className="text-button" type="button" onClick={() => { setForm(initialForm); setStatus("idle"); setMessage(""); }}>
            Register another account
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="register-page">
      <div className="register-shell">
        <aside className="register-aside">
          <div className="brand-mark"><span>U</span> UniVerse</div>
          <div className="aside-copy">
            <p className="eyebrow">Student services, connected</p>
            <h1>Make campus feel a little closer.</h1>
            <p>One account for your academic life at the University of Vavuniya.</p>
          </div>
          <div className="aside-note"><span>01</span><p>Secure access to the services you use every day.</p></div>
        </aside>

        <section className="register-card" aria-labelledby="register-title">
          <div className="progress-row"><span>Student registration</span><span>Step 1 of 1</span></div>
          <div className="progress-track"><span /></div>
          <header className="form-header">
            <p className="eyebrow">Create your account</p>
            <h2 id="register-title">Welcome to UniVerse</h2>
            <p>Set up your student profile to get started.</p>
          </header>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-section">
              <div className="section-heading"><span>01</span><div><h3>Your details</h3><p>Tell us who you are.</p></div></div>
              <div className="field-grid">
                <Field label="Full name" name="fullName" value={form.fullName} onChange={updateField} error={errors.fullName} placeholder="e.g. Kavindi Perera" autoComplete="name" />
                <Field label="University email" name="email" type="email" value={form.email} onChange={updateField} error={errors.email} placeholder="you@uov.lk" autoComplete="email" />
                <Field label="Student number" name="studentNumber" value={form.studentNumber} onChange={updateField} error={errors.studentNumber} placeholder="e.g. ICT/2024/001" autoComplete="off" />
                <SelectField label="Programme" name="programmeId" value={form.programmeId} onChange={updateField} error={errors.programmeId} options={programmes} placeholder="Select your programme" />
                <SelectField label="Batch" name="batchId" value={form.batchId} onChange={updateField} error={errors.batchId} options={batches} placeholder="Select your batch" />
              </div>
            </div>

            <div className="form-section password-section">
              <div className="section-heading"><span>02</span><div><h3>Secure your account</h3><p>Choose a password only you know.</p></div></div>
              <div className="field-grid password-grid">
                <Field label="Password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={updateField} error={errors.password} placeholder="Create a strong password" autoComplete="new-password" action={<button type="button" className="field-action" onClick={() => setShowPassword((current) => !current)}>{showPassword ? "Hide" : "Show"}</button>} />
                <Field label="Confirm password" name="confirmPassword" type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={updateField} error={errors.confirmPassword} placeholder="Repeat your password" autoComplete="new-password" />
              </div>
              <div className="password-meter" aria-label={`Password strength ${passwordScore} of 3`}><span className={`meter-fill score-${passwordScore}`} /></div>
              <div className="password-rules">{passwordChecks.map(([label, passes]) => <span className={passes ? "rule pass" : "rule"} key={label}><i>{passes ? "OK" : "-"}</i>{label}</span>)}</div>
            </div>

            <label className={`terms ${errors.terms ? "has-error" : ""}`}>
              <input type="checkbox" name="terms" checked={form.terms} onChange={updateField} />
              <span>I agree to the UniVerse terms of service and privacy policy.</span>
            </label>
            {errors.terms && <p className="field-error terms-error">{errors.terms}</p>}
            {message && <div className={`form-message ${status === "error" ? "error" : ""}`} role="alert">{message}</div>}
            <button className="submit-button" type="submit" disabled={status === "loading"}>{status === "loading" ? "Creating your account..." : "Create student account"}<span aria-hidden="true">-&gt;</span></button>
            <p className="sign-in-note">Already have an account? <button type="button" className="text-button">Sign in</button></p>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({ label, name, error, action, ...props }) {
  return <label className="field"><span className="field-label">{label}</span><span className="input-wrap"><input name={name} aria-invalid={Boolean(error)} {...props} />{action}</span>{error && <span className="field-error">{error}</span>}</label>;
}

function SelectField({ label, name, options, placeholder, error, ...props }) {
  return <label className="field"><span className="field-label">{label}</span><span className="input-wrap select-wrap"><select name={name} aria-invalid={Boolean(error)} {...props}><option value="">{placeholder}</option>{options.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select><span className="select-arrow" aria-hidden="true">v</span></span>{error && <span className="field-error">{error}</span>}</label>;
}