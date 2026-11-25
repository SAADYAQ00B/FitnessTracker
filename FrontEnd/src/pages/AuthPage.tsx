import { useState, useEffect, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Sparkles, ArrowRight, ArrowLeft, KeyRound, Mail, CheckCircle2 } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { Logo } from "../components/common/Logo";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import {
  login,
  signup,
  verifyOTP,
  resendOTP,
  googleAuth,
  forgotPassword,
  resetPassword,
} from "../services/authService";

export function AuthPage({ register = false }: { register?: boolean }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Email Verification State (Sign Up & Unverified Login OTP flow)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyOtp, setVerifyOtp] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Scope AuthPage strictly to KINETIC brand theme (dark mode by default)
  useEffect(() => {
    const savedPreset = localStorage.getItem("forma-preset") || "fitness1";
    const savedMode = localStorage.getItem("kinetic-theme") || "dark";

    document.documentElement.dataset.preset = "fitness1";
    document.documentElement.dataset.theme = "dark";
    document.documentElement.classList.remove("dark");

    return () => {
      document.documentElement.dataset.preset = savedPreset;
      document.documentElement.dataset.theme = savedMode;
      document.documentElement.classList.toggle("dark", savedPreset === "fitness2" && savedMode === "dark");
    };
  }, []);

  // Google OAuth Handlers
  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) {
      setError("No Google credential received. Please try again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await googleAuth(credentialResponse.credential);
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      window.dispatchEvent(new Event("user-updated"));
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Google authentication error:", err);
      setError(err.response?.data?.msg || err.response?.data?.error || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in was cancelled or encountered an error.");
  };

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: (formData.get("email") as string)?.trim().toLowerCase(),
      password: formData.get("password") as string,
    };

    try {
      if (register) {
        const res = await signup(data.name, data.email, data.password);
        setVerifyEmail(data.email);
        setIsVerifyingEmail(true);
        setSuccessMsg(res.msg || "Verification code sent to your email!");
      } else {
        const res = await login(data.email, data.password);
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        window.dispatchEvent(new Event("user-updated"));
        navigate("/dashboard");
      }
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.needsVerification) {
        setVerifyEmail(err.response.data.email || data.email);
        setIsVerifyingEmail(true);
        setError("");
        setSuccessMsg(err.response.data.msg || "Please verify your email first. A new code has been sent.");
      } else {
        setError(err.response?.data?.msg || err.response?.data?.error || "Authentication failed. Please check credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!verifyOtp || verifyOtp.trim().length !== 6) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }
    setVerifyLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await verifyOTP({ email: verifyEmail, otp: verifyOtp.trim() });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      window.dispatchEvent(new Event("user-updated"));
      setSuccessMsg("Email verified successfully! Redirecting...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 800);
    } catch (err: any) {
      setError(err.response?.data?.msg || err.response?.data?.error || "Verification failed. Please check your code.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!verifyEmail || resending) return;
    setResending(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await resendOTP(verifyEmail);
      setSuccessMsg(res.msg || "A new verification code has been sent to your email.");
    } catch (err: any) {
      setError(err.response?.data?.msg || err.response?.data?.error || "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleForgotRequest = async (e: FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");
    setForgotSuccess("");
    try {
      const res = await forgotPassword(forgotEmail.trim().toLowerCase());
      setForgotStep(2);
      setForgotSuccess(res.msg || "Verification code sent to your email!");
    } catch (err: any) {
      setForgotError(err.response?.data?.msg || err.response?.data?.error || "Failed to send reset code.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");
    setForgotSuccess("");
    try {
      const res = await resetPassword({ email: forgotEmail.trim().toLowerCase(), code: forgotCode, newPassword: forgotNewPassword });
      setForgotSuccess(res.msg || "Password reset successfully!");
      setTimeout(() => {
        setForgotModalOpen(false);
        setSuccessMsg("Password reset successfully! Please log in with your new password.");
        setForgotStep(1);
        setForgotCode("");
        setForgotNewPassword("");
      }, 1500);
    } catch (err: any) {
      setForgotError(err.response?.data?.msg || err.response?.data?.error || "Failed to reset password.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-dvh min-h-screen grid lg:grid-cols-[46%_1fr]" style={{ background: "var(--surface)" }}>
      {/* LEFT SIDE: Background Image & Branding */}
      <div className="hidden lg:flex flex-col relative p-12 overflow-hidden" style={{ background: "#0b1110" }}>
        <img 
          src="https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1200&auto=format&fit=crop" 
          alt="Fitness Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="relative z-10 flex flex-col h-full">
          <Logo />
          
          <div className="my-auto max-w-[400px]">
            <span className="text-[9px] font-bold tracking-widest text-[#a3e635] flex items-center gap-2">
              <Sparkles size={18} /> MOVE WITH PURPOSE
            </span>
            <h1 className="text-5xl font-black my-6 leading-tight tracking-tighter text-white">
              Stronger habits.<br />Measurable progress.
            </h1>
            <p className="text-sm text-gray-300 leading-relaxed">
              Plan your training, understand your nutrition, and turn every effort into real momentum.
            </p>
          </div>
          
          <div className="text-[10px] text-gray-500">
            © 2026 FITNESSTRACKER. All Rights Reserved.
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="min-h-dvh lg:min-h-0 flex flex-col justify-center items-center py-4 px-5 sm:p-6">
        <div className="w-full max-w-sm flex flex-col justify-center my-auto">
          {/* Back to Home Link */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-[var(--color-lime)] mb-2 sm:mb-4 transition cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>

          {isVerifyingEmail ? (
            <div>
              <div className="lg:hidden mb-2 sm:mb-4"><Logo /></div>

              <span className="eyebrow text-[var(--color-lime)] text-[9px] sm:text-[10px]">
                EMAIL VERIFICATION
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 mb-1 sm:mb-2" style={{ color: "var(--color-white, white)" }}>
                Check your inbox
              </h2>
              <p className="text-xs text-muted mb-3 sm:mb-5 leading-relaxed">
                We sent a 6-digit verification code to <strong className="text-white font-semibold">{verifyEmail}</strong>. Please enter the code below to verify your account.
              </p>

              {/* Error Alert */}
              {error && (
                <div className="mb-3 p-2.5 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                  {error}
                </div>
              )}

              {/* Success Alert */}
              {successMsg && (
                <div className="mb-3 p-2.5 sm:p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleVerifyOtpSubmit}>
                <label className="field mb-3 sm:mb-4">
                  <span>6-Digit Verification Code</span>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={verifyOtp}
                    onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, ''))}
                    className="field-input font-mono text-center text-xl tracking-[0.5em] font-bold"
                    autoFocus
                  />
                </label>

                <Button type="submit" className="w-full mt-3 sm:mt-4" disabled={verifyLoading || verifyOtp.trim().length !== 6}>
                  {verifyLoading ? "Verifying..." : "Verify & Continue"}
                  {!verifyLoading && <ArrowRight size={17} />}
                </Button>

                <div className="mt-4 sm:mt-6 flex flex-col items-center gap-2 sm:gap-3 text-xs">
                  <div className="text-muted flex items-center gap-1.5">
                    Didn't receive the code?
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resending}
                      className="text-[var(--color-lime)] font-bold hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {resending ? "Sending..." : "Resend code"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsVerifyingEmail(false);
                      setVerifyOtp("");
                      setError("");
                      setSuccessMsg("");
                    }}
                    className="text-muted hover:text-white transition cursor-pointer mt-1"
                  >
                    ← Back to Sign In / Change Email
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="lg:hidden mb-2 sm:mb-4"><Logo /></div>
              
              <span className="eyebrow text-[var(--color-lime)] text-[9px] sm:text-[10px]">
                {register ? "START YOUR JOURNEY" : "WELCOME BACK"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 mb-1 sm:mb-2" style={{ color: "var(--color-white, white)" }}>
                {register ? "Create your account" : "Sign in to FITNESSTRACKER"}
              </h2>
              <p className="text-xs text-muted mb-3 sm:mb-5">
                {register ? "Your next chapter starts with one small step." : "Pick up where you left off and keep moving."}
              </p>

              {/* Error Alert */}
              {error && (
                <div className="mb-3 p-2.5 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                  {error}
                </div>
              )}

              {/* Success Alert */}
              {successMsg && (
                <div className="mb-3 p-2.5 sm:p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
                  {successMsg}
                </div>
              )}
              
              {register && (
                <label className="field mb-2 sm:mb-3">
                  <span>Full name</span>
                  <input name="name" required placeholder="Alex Morgan" className="field-input" />
                </label>
              )}
              
              <label className="field mb-2 sm:mb-3">
                <span>Email address</span>
                <input name="email" required type="email" placeholder="you@example.com" className="field-input" />
              </label>
              
              <label className="field mb-2 sm:mb-3">
                <span>Password</span>
                <div className="relative flex items-center w-full">
                  <input 
                    name="password" 
                    required 
                    type={visible ? "text" : "password"} 
                    placeholder="At least 6 characters" 
                    className="field-input pr-16" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setVisible(!visible)} 
                    className="absolute right-4 text-[11px] font-bold text-[var(--color-lime)] cursor-pointer"
                  >
                    {visible ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              {!register && (
                <div className="flex items-center justify-between text-xs mb-3 sm:mb-4">
                  <label className="flex items-center gap-2 text-muted cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[var(--color-lime)] w-4 h-4" /> Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotModalOpen(true);
                      setForgotStep(1);
                      setForgotError("");
                      setForgotSuccess("");
                    }}
                    className="text-[var(--color-lime)] hover:underline font-semibold cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button type="submit" className="w-full mt-1 sm:mt-2" disabled={loading}>
                {loading ? "Please wait..." : (register ? "Create account" : "Sign in")}
                {!loading && <ArrowRight size={17} />}
              </Button>

              {/* Divider */}
              <div className="flex items-center my-2.5 sm:my-4 gap-3">
                <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">or</span>
                <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
              </div>

              {/* Google OAuth Button */}
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                  text={register ? "signup_with" : "signin_with"}
                  width="340"
                />
              </div>
              
              <p className="text-center text-[11px] text-muted mt-3 sm:mt-5">
                {register ? "Already have an account?" : "New to FITNESSTRACKER?"}{" "}
                <Link to={register ? "/login" : "/register"} className="text-[var(--color-lime)] font-bold">
                  {register ? "Sign in" : "Create an account"}
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {forgotModalOpen && (
        <Modal title="Reset Your Password" onClose={() => setForgotModalOpen(false)}>
          {forgotStep === 1 ? (
            <form onSubmit={handleForgotRequest} className="space-y-4">
              <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/10 flex items-start gap-3">
                <KeyRound className="text-blue-400 shrink-0 mt-0.5" size={20} />
                <div className="text-xs text-blue-200 leading-relaxed">
                  Enter your registered account email. We will send you a 6-digit verification code to reset your password.
                </div>
              </div>

              {forgotError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                  {forgotError}
                </div>
              )}

              <label className="field">
                <span>Account Email</span>
                <input 
                  type="email" 
                  required 
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="field-input" 
                />
              </label>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="secondary" type="button" onClick={() => setForgotModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={forgotLoading || !forgotEmail}>
                  {forgotLoading ? "Sending Code..." : "Send Reset Code"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="p-3 rounded-xl border border-green-500/20 bg-green-500/10 flex items-start gap-3">
                <CheckCircle2 className="text-green-400 shrink-0 mt-0.5" size={20} />
                <div className="text-xs text-green-200 leading-relaxed">
                  A verification code has been sent to <strong>{forgotEmail}</strong>. Please check your email inbox and enter the code below.
                </div>
              </div>

              {forgotError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                  {forgotError}
                </div>
              )}

              {forgotSuccess && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
                  {forgotSuccess}
                </div>
              )}

              <label className="field">
                <span>6-Digit Verification Code</span>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. 123456"
                  maxLength={6}
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value.trim())}
                  className="field-input font-mono text-base tracking-widest" 
                />
              </label>

              <label className="field">
                <span>New Password</span>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="field-input" 
                />
              </label>

              <div className="flex gap-2 justify-between pt-2">
                <button 
                  type="button" 
                  className="text-xs text-muted hover:text-white"
                  onClick={() => setForgotStep(1)}
                >
                  ← Change Email
                </button>
                <div className="flex gap-2">
                  <Button variant="secondary" type="button" onClick={() => setForgotModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={forgotLoading || !forgotCode || !forgotNewPassword}>
                    {forgotLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}