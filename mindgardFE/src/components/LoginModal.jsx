import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { authService } from "../services/authService";

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "", firstName: "", lastName: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 backdrop-blur-md bg-black/70"
      onClick={onClose}
    >
      <div
        className="mindgard-login-modal relative w-full max-w-md rounded-2xl border border-white/15 bg-black/90 backdrop-blur-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-300 hover:text-white transition-colors z-10"
          aria-label="Close login modal"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="p-6 sm:p-7">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-white mb-1">
              {isRegisterMode ? "Đăng ký" : "Đăng nhập"}
            </h3>
            <p className="text-sm text-gray-400">
              {isRegisterMode 
                ? "Tạo tài khoản MindGard để bắt đầu sử dụng." 
                : "Sử dụng tài khoản MindGard để đồng bộ."}
            </p>
          </div>
          
          {isRegisterMode ? (
            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Tên đăng nhập *</label>
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, username: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-gray-500 focus:border-white/30 focus:outline-none"
                  placeholder="Username"
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-gray-500 focus:border-white/30 focus:outline-none"
                  placeholder="email@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Họ *</label>
                  <input
                    type="text"
                    value={registerForm.firstName}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-gray-500 focus:border-white/30 focus:outline-none"
                    placeholder="First name"
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Tên *</label>
                  <input
                    type="text"
                    value={registerForm.lastName}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-gray-500 focus:border-white/30 focus:outline-none"
                    placeholder="Last name"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Mật khẩu *</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-gray-500 focus:border-white/30 focus:outline-none"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-600 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isSubmitting ? "Đang đăng ký..." : "Đăng ký"}</span>
              </button>
              
              <div className="text-center text-sm text-gray-400">
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setError("");
                  }}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Đăng nhập
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Tài khoản</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-gray-500 focus:border-white/30 focus:outline-none"
                  placeholder="Username"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-gray-500 focus:border-white/30 focus:outline-none"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-600 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}</span>
              </button>
              
              <div className="text-center text-sm text-gray-400">
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setError("");
                  }}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Đăng ký
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
