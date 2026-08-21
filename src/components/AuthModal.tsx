"use client";

import { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { useCartStore } from "@/lib/store";

type Tab = "login" | "signup";
type Step = "form" | "verify";

const C = {
  bg: "#e2e7d3",
  dark: "#182320",
  red: "#e8452c",
  muted: "#5a6a61",
  border: "#c3ccb2",
  darkMuted: "#87998d",
};

export function AuthModal() {
  const { authOpen, authMode, closeAuth, openLogin, openSignup } = useCartStore();

  const [tab, setTab] = useState<Tab>(authMode);
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { signIn, setActive: siSetActive, isLoaded: siLoaded } = useSignIn() as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { signUp, setActive: suSetActive, isLoaded: suLoaded } = useSignUp() as any;

  // Sync tab when authMode changes externally
  const activeTab = authOpen ? tab : authMode;

  if (!authOpen) return null;

  const reset = () => { setError(""); setStep("form"); setCode(""); };

  const switchTab = (t: Tab) => { setTab(t); reset(); };

  const handleGoogle = async () => {
    if (!siLoaded || !signIn) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/`,
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.message ?? "Google sign-in failed.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siLoaded || !signIn) return;
    setError(""); setLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password: pass });
      if (result.status === "complete") {
        await siSetActive!({ session: result.createdSessionId });
        closeAuth();
        setEmail(""); setPass("");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage ?? err.errors?.[0]?.message ?? "Sign in failed. Check your details.");
    } finally { setLoading(false); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suLoaded || !signUp) return;
    setError(""); setLoading(true);
    try {
      const parts = name.trim().split(" ");
      await signUp.create({
        firstName: parts[0],
        lastName: parts.slice(1).join(" ") || undefined,
        emailAddress: email,
        password: pass,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage ?? err.errors?.[0]?.message ?? "Sign up failed. Try again.");
    } finally { setLoading(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suLoaded || !signUp) return;
    setError(""); setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await suSetActive!({ session: result.createdSessionId });
        closeAuth();
        setEmail(""); setPass(""); setName(""); setCode("");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage ?? err.errors?.[0]?.message ?? "Wrong code. Try again.");
    } finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    background: "transparent",
    border: `1.5px solid ${C.border}`,
    borderRadius: 2,
    padding: "12px 13px",
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    fontSize: 14.5,
    color: C.dark,
    outline: "none",
  };

  const isLogin = activeTab === "login";

  return (
    <div
      onClick={closeAuth}
      style={{
        position: "fixed", inset: 0, zIndex: 120,
        background: "rgba(24,35,32,.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 380,
          background: C.bg,
          border: `1.5px solid ${C.dark}`,
          borderRadius: 2,
          padding: "30px 28px 26px",
          position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={closeAuth}
          style={{
            position: "absolute", right: 14, top: 10,
            fontFamily: "ui-monospace, Menlo, monospace", fontSize: 14,
            color: C.muted, background: "transparent", border: "none", cursor: "pointer",
          }}
        >
          ✕
        </button>

        {/* Bottle cap logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <span
            style={{
              width: 56, height: 56, flexShrink: 0, borderRadius: "50%",
              background: "repeating-conic-gradient(from 0deg,#e8452c 0 4.2deg,#a82d19 4.2deg 8.4deg)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <span
              style={{
                width: "76%", height: "76%", borderRadius: "50%",
                background: C.red,
                display: "flex", alignItems: "center", justifyContent: "center",
                textAlign: "center",
                fontFamily: "var(--font-anek), sans-serif", fontWeight: 700,
                lineHeight: 1.05, color: C.bg, fontSize: 11,
              }}
            >
              பாட்டில்<br />மூடி
            </span>
          </span>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex", gap: 1,
            background: C.dark, border: `1.5px solid ${C.dark}`,
            borderRadius: 2, marginBottom: 20,
          }}
        >
          {(["login", "signup"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              style={{
                cursor: "pointer", flex: 1, border: "none",
                background: activeTab === t ? C.bg : C.dark,
                color: activeTab === t ? C.dark : C.darkMuted,
                fontFamily: "var(--font-bakbak), sans-serif",
                fontSize: 13, padding: "10px 0", letterSpacing: ".06em",
              }}
            >
              {t === "login" ? "LOGIN" : "SIGN UP"}
            </button>
          ))}
        </div>

        {/* Google OAuth button */}
        {step === "form" && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                width: "100%", padding: "11px 13px",
                background: "#fff", border: `1.5px solid ${C.border}`,
                borderRadius: 2, cursor: "pointer",
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontSize: 14, fontWeight: 500, color: C.dark,
              }}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: C.muted }}>or</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>
          </>
        )}

        {/* Verification step */}
        {step === "verify" ? (
          <form onSubmit={handleVerify} style={{ display: "grid", gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13.5, color: C.muted, lineHeight: 1.5 }}>
              We sent a code to <strong style={{ color: C.dark }}>{email}</strong>. Enter it below.
            </p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              maxLength={6}
              required
              style={{ ...inputStyle, letterSpacing: ".2em", textAlign: "center", fontSize: 18 }}
            />
            {error && <p style={{ margin: 0, fontSize: 12.5, color: C.red }}>{error}</p>}
            <button type="submit" disabled={loading} style={submitStyle(loading)}>
              {loading ? "VERIFYING…" : "VERIFY EMAIL"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("form"); setError(""); }}
              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 12.5, color: C.muted, textAlign: "center" }}
            >
              ← Back
            </button>
          </form>
        ) : (
          /* Main form */
          <form onSubmit={isLogin ? handleLogin : handleSignUp} style={{ display: "grid", gap: 12 }}>
            {!isLogin && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                required
                style={inputStyle}
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              style={inputStyle}
            />
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Password"
              required
              minLength={8}
              style={inputStyle}
            />
            {error && <p style={{ margin: 0, fontSize: 12.5, color: C.red }}>{error}</p>}
            <button type="submit" disabled={loading} style={submitStyle(loading)}>
              {loading ? (isLogin ? "SIGNING IN…" : "CREATING…") : (isLogin ? "LOGIN" : "CREATE ACCOUNT")}
            </button>
          </form>
        )}

        {/* Footer */}
        {step === "form" && (
          <div
            style={{
              marginTop: 16, textAlign: "center",
              fontFamily: "var(--font-anek), sans-serif",
              fontWeight: 500, fontSize: 13, color: C.muted,
            }}
          >
            {isLogin ? "மறுபடி வருவீங்க தானே?" : "ஒரு முறை பதிவு. அப்புறம் எல்லாம் சுலபம்."}
          </div>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z" />
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" />
    </svg>
  );
}

function submitStyle(loading: boolean): React.CSSProperties {
  return {
    cursor: loading ? "not-allowed" : "pointer",
    border: "none",
    background: "#e8452c",
    color: "#e2e7d3",
    fontFamily: "var(--font-bakbak), sans-serif",
    fontSize: 15,
    padding: 14,
    borderRadius: 2,
    letterSpacing: ".05em",
    marginTop: 4,
    opacity: loading ? 0.7 : 1,
  };
}
