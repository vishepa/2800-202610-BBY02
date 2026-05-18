import { useState } from "react";
import { useAuth } from "../shared/authentication/AuthContext.jsx";

export default function LoginSignupPopup({ onClose }) {
  const { signIn, signUp } = useAuth();

  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reset = () => {
    setEmail("");
    setPassword("");
    setConfirm("");
    setError("");
    setSuccess("");
    setLoading(false);
  };

  const switchTab = (t) => {
    setTab(t);
    reset();
  };

  const handleLogin = async () => {
    if (!email || !password) return setError("Please fill in all fields.");
    setLoading(true);
    setError("");
    setSuccess("");
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) return setError(err.message);
    setSuccess("Signed in successfully!");
    setTimeout(onClose, 800);
  };

  const handleSignup = async () => {
    if (!email || !password || !confirm) return setError("Please fill in all fields.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    setError("");
    setSuccess("");
    const { error: err } = await signUp(email, password);
    setLoading(false);
    if (err) return setError(err.message);
    setSuccess("Account created! Check your email to confirm.");
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-[20px] border border-neutral-200 shadow-xl p-10 pt-9">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 text-xl leading-none transition-colors"
          aria-label="Close"
        >
          ×
        </button>

        {/* Header */}
        <p className="font-serif text-[22px] text-neutral-900 mb-0.5 tracking-tight">
          {tab === "login" ? "Welcome back" : "Get started"}
        </p>
        <p className="text-[13px] text-neutral-400 mb-6">
          {tab === "login" ? "Sign in to continue" : "Create your account"}
        </p>

        {/* Tab toggle */}
        <div className="flex gap-0 bg-neutral-100 rounded-xl p-1 mb-6">
          {["login", "signup"].map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`flex-1 py-1.5 text-[13.5px] font-medium rounded-[9px] transition-all duration-150 ${
                tab === t
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {t === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="space-y-3.5">
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="lsp-input"
              onKeyDown={(e) => e.key === "Enter" && (tab === "login" ? handleLogin() : handleSignup())}
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="lsp-input"
              onKeyDown={(e) => e.key === "Enter" && (tab === "login" ? handleLogin() : handleSignup())}
            />
          </Field>

          {tab === "signup" && (
            <Field label="Confirm password">
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                className="lsp-input"
                onKeyDown={(e) => e.key === "Enter" && handleSignup()}
              />
            </Field>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={tab === "login" ? handleLogin : handleSignup}
          disabled={loading}
          className="mt-5 w-full py-2.5 bg-neutral-900 text-white text-[14px] font-medium rounded-xl hover:bg-neutral-700 active:scale-[0.98] disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all duration-150"
        >
          {loading
            ? "Please wait…"
            : tab === "login"
            ? "Log in"
            : "Create account"}
        </button>

        {/* Feedback */}
        {error && (
          <p className="mt-3 text-[12.5px] text-[#993c1d] bg-[#faece7] rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-3 text-[12.5px] text-[#0f6e56] bg-[#e1f5ee] rounded-lg px-3 py-2">
            {success}
          </p>
        )}

        {/* Sign-up terms */}
        {tab === "signup" && (
          <p className="mt-4 text-[11.5px] text-neutral-400 text-center">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}