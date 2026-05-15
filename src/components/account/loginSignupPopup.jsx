import { useState } from "react";
import { useAuth } from "../shared/authentication/AuthContext.jsx";

export default function LoginSignupPopup({ onClose }) {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setEmail("");
    setPassword("");
    setError("");
    setSuccess("");
  };

  const switchTab = (t) => {
    setTab(t);
    reset();
  };

  const handleLogin = async () => {
    if (!email || !password) return setError("Please fill in all fields.");
    setLoading(true);
    setError("");
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) return setError(err.message);
    onClose();
  };

  const handleSignup = async () => {
    if (!email || !password) return setError("Please fill in all fields.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true);
    setError("");
    const { error: err } = await signUp(email, password);
    setLoading(false);
    if (err) return setError(err.message);
    setSuccess("Account created! Check your email to verify.");
    setEmail("");
    setPassword("");
  };

  const strengthScore = (val) => {
    let s = 0;
    if (val.length >= 8) s++;
    if (/[A-Z]/.test(val)) s++;
    if (/[0-9]/.test(val)) s++;
    if (/[^a-zA-Z0-9]/.test(val)) s++;
    return s;
  };

  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#4ade80"];
  const strengthWidth = [0, 30, 55, 80, 100];
  const score = tab === "signup" ? strengthScore(password) : 0;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-grey-100 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl border p-8"
        style={{
          background: "#1a1a1a",
          borderColor: "#2a2a2a",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-200 transition-colors text-xl leading-none px-2 py-1 rounded"
        >
          ×
        </button>

        {/* Logo */}
        <div className="text-2xl" style={{fontFamily: "'monoton', cursive"}}>
          ONION
        </div>

        {/* Tabs */}
        <div
          className="flex rounded-lg p-0.5 mb-6"
          style={{ background: "#111" }}
        >
          {["login", "signup"].map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className="flex-1 py-1.5 text-sm font-medium rounded-md transition-all"
              style={{
                background: tab === t ? "#1a1a1a" : "transparent",
                color: tab === t ? "#f5f5f0" : "#888",
              }}
            >
              {t === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {/* Heading */}
        <h2
          className="text-xl mb-1"
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            color: "#f5f5f0",
          }}
        >
          {tab === "login" ? "Welcome back" : "Get started"}
        </h2>
        <p className="text-sm mb-5" style={{ color: "#888" }}>
          {tab === "login"
            ? "Sign in to continue to your account."
            : "Create your account in seconds."}
        </p>

        {/* Feedback */}
        {error && (
          <div
            className="text-xs px-3 py-2 rounded-md mb-4"
            style={{
              background: "#2a1010",
              border: "0.5px solid #5a2020",
              color: "#f08080",
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            className="text-xs px-3 py-2 rounded-md mb-4"
            style={{
              background: "#0a1a12",
              border: "0.5px solid #1d5c34",
              color: "#4ade80",
            }}
          >
            {success}
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <label
            className="block text-xs mb-1.5 tracking-wide uppercase"
            style={{ color: "#888" }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (tab === "login" ? handleLogin() : handleSignup())}
            placeholder="you@example.com"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
            style={{
              background: "#111",
              border: "0.5px solid #2a2a2a",
              color: "#f5f5f0",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#4ade80")}
            onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
          />
        </div>

        {/* Password */}
        <div className="mb-5">
          <label
            className="block text-xs mb-1.5 tracking-wide uppercase"
            style={{ color: "#888" }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (tab === "login" ? handleLogin() : handleSignup())}
            placeholder={tab === "signup" ? "Min. 8 characters" : "••••••••"}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
            style={{
              background: "#111",
              border: "0.5px solid #2a2a2a",
              color: "#f5f5f0",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#4ade80")}
            onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
          />
          {tab === "signup" && password.length > 0 && (
            <div
              className="mt-1.5 h-0.5 rounded-full overflow-hidden"
              style={{ background: "#2a2a2a" }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${strengthWidth[score]}%`,
                  background: strengthColor[score],
                }}
              />
            </div>
          )}
        </div>

        {tab === "login" && (
          <p
            className="text-xs text-right -mt-3 mb-4 cursor-pointer transition-colors"
            style={{ color: "#888" }}
            onMouseEnter={(e) => (e.target.style.color = "#4ade80")}
            onMouseLeave={(e) => (e.target.style.color = "#888")}
          >
            Forgot password?
          </p>
        )}

        {/* Submit */}
        <button
          onClick={tab === "login" ? handleLogin : handleSignup}
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{
            background: loading ? "#16a34a" : "#4ade80",
            color: "#0f0f0f",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? "Please wait…"
            : tab === "login"
            ? "Sign in"
            : "Create account"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-2 my-4" style={{ color: "#555" }}>
          <div className="flex-1 h-px" style={{ background: "#2a2a2a" }} />
          <span className="text-xs">or</span>
          <div className="flex-1 h-px" style={{ background: "#2a2a2a" }} />
        </div>

      </div>
    </div>
  );
}