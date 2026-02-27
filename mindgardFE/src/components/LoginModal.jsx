import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Mail, Lock, User as UserIcon, LogIn, Facebook, ShieldCheck } from "lucide-react";
import { authService } from "../services/authService";

const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || "123456789";

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "", firstName: "", lastName: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setIsSubmitting(true);
      await authService.oauth2Google();
      if (onLoginSuccess) onLoginSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err?.message || err?.response?.data?.message || "Không thể đăng nhập bằng Google.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setError("");
      setIsSubmitting(true);
      await authService.oauth2Facebook();
      if (onLoginSuccess) onLoginSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err?.message || err?.response?.data?.message || "Không thể đăng nhập bằng Facebook.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      setError("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await authService.login({
        username: loginForm.username.trim(),
        password: loginForm.password,
      });
      setLoginForm({ username: "", password: "" });
      if (onLoginSuccess) onLoginSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Không thể đăng nhập.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerForm.username.trim() || !registerForm.email.trim() || !registerForm.password.trim()) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    if (registerForm.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await authService.register({
        username: registerForm.username.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
        firstName: registerForm.firstName.trim() || "",
        lastName: registerForm.lastName.trim() || "",
      });
      setRegisterForm({ username: "", email: "", password: "", firstName: "", lastName: "" });
      if (onLoginSuccess) onLoginSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Không thể đăng ký.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 md:px-0 backdrop-blur-xl bg-[#030712]/80 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-[#111827] to-[#0B0F19] shadow-[0_0_80px_rgba(59,130,246,0.1)] ring-1 ring-white/5 transition-all duration-300 transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all z-10"
          aria-label="Close login modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative p-8 px-8 sm:px-10 z-10">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold tracking-tight text-white mb-2">
              {isRegisterMode ? "Tạo tài khoản" : "Đăng nhập"}
            </h3>
            <p className="text-sm text-gray-400 font-medium">
              {isRegisterMode
                ? "Bắt đầu hành trình tập trung cùng MindGard."
                : "Đăng nhập để xem tiến độ và đồng bộ dữ liệu."}
            </p>
          </div>

          <div className="flex flex-row gap-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="group relative flex items-center justify-center gap-2 flex-1 rounded-[4px] bg-white hover:bg-gray-50 h-10 font-medium text-gray-800 transition-all duration-200 disabled:opacity-60 text-[14px] overflow-hidden"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              <span>Google</span>
            </button>

            {FACEBOOK_APP_ID && (
              <button
                type="button"
                onClick={handleFacebookLogin}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 flex-1 rounded-[4px] bg-[#1877F2] hover:bg-[#1864D9] h-10 font-medium text-white transition-colors duration-200 disabled:opacity-60 text-[14px]"
              >
                <Facebook className="w-[18px] h-[18px] fill-current" />
                <span>Facebook</span>
              </button>
            )}
          </div>

          <div className="relative flex items-center mb-6">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-500 uppercase tracking-widest">
              hoặc
            </span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          {isRegisterMode ? (
            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              <div className="space-y-4">
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, username: e.target.value }))}
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:bg-white/10 focus:outline-none transition-all"
                    placeholder="Tên đăng nhập"
                    required
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:bg-white/10 focus:outline-none transition-all"
                    placeholder="Địa chỉ Email"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={registerForm.firstName}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:bg-white/10 focus:outline-none transition-all"
                    placeholder="Họ"
                    required
                  />
                  <input
                    type="text"
                    value={registerForm.lastName}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:bg-white/10 focus:outline-none transition-all"
                    placeholder="Tên"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:bg-white/10 focus:outline-none transition-all"
                    placeholder="Mật khẩu (ít nhất 6 ký tự)"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 flex items-start gap-2 text-sm text-red-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative flex w-full h-11 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-medium text-white shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>Đăng ký tham gia</span>
                    <LogIn className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-sm text-gray-400">Đã có tài khoản? </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setError("");
                  }}
                  className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Đăng nhập ngay
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div className="space-y-4">
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:bg-white/10 focus:outline-none transition-all"
                    placeholder="Tên đăng nhập"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:bg-white/10 focus:outline-none transition-all"
                    placeholder="Mật khẩu"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 flex items-start gap-2 text-sm text-red-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative flex w-full h-11 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-medium text-white shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <LogIn className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-sm text-gray-400">Chưa có hệ sinh thái? </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setError("");
                  }}
                  className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
