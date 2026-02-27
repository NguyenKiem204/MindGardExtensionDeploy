import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Gift, User, Search, Settings, Users, ExternalLink, Grid3x3, Brain, LogIn, LogOut, Loader2 } from "lucide-react";
import { authService } from "../services/authService";
import PublicProfileModal from "./PublicProfileModal";
import FriendsModal from "./FriendsModal";
export default function UserProfileModal({ isOpen, onClose, userName = "kiem", accountType = "Guest Account", onOpenFocusMode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [displayName, setDisplayName] = useState(userName);
  const [displayAccountType, setDisplayAccountType] = useState(accountType);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "", firstName: "", lastName: "" });
  const [loginError, setLoginError] = useState("");
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [showPublicProfileModal, setShowPublicProfileModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [isPlusUser, setIsPlusUser] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (showLoginModal) {
          setShowLoginModal(false);
        } else if (showPublicProfileModal) {
          setShowPublicProfileModal(false);
        } else if (showFriendsModal) {
          setShowFriendsModal(false);
        } else {
          onClose();
        }
      }
    };

    const handleClickOutside = (e) => {
      if (showLoginModal) {
        if (!e.target.closest('.mindgard-login-modal')) {
          setShowLoginModal(false);
        }
        return;
      }

      if (isOpen && !e.target.closest('.user-profile-modal')) {
        onClose();
      }
    };

    if (isOpen || showLoginModal || showPublicProfileModal || showFriendsModal) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, showLoginModal, showPublicProfileModal, showFriendsModal]);

  useEffect(() => {
    if (!isAuthenticated) {
      setDisplayName(userName);
      setDisplayAccountType(accountType);
    }
  }, [userName, accountType, isAuthenticated]);

  useEffect(() => {
    const checkAuth = () => {
      const cached = authService.getCachedAuth();
      if (cached?.accessToken && authService.isAuthenticated()) {
        const info = authService.getDisplayInfo(userName, accountType);
        setIsAuthenticated(true);
        setDisplayName(info.name);
        setDisplayAccountType(info.type);
        setIsPlusUser(cached?.user?.roles?.includes("ROLE_PLUS") || false);
        if (cached?.user?.id) {
          setUserId(cached.user.id);
        }
      } else {
        setIsAuthenticated(false);
        setDisplayName(userName);
        setDisplayAccountType(accountType);
        setIsPlusUser(false);
        setUserId(null);
      }
    };
    checkAuth();
    // Listen for auth cleared/expired/changed events
    const onAuthChanged = () => checkAuth();
    window.addEventListener("mindgard_auth_cleared", onAuthChanged);
    window.addEventListener("mindgard_auth_expired", onAuthChanged);
    window.addEventListener("mindgard_auth_changed", onAuthChanged);
    return () => {
      window.removeEventListener("mindgard_auth_cleared", onAuthChanged);
      window.removeEventListener("mindgard_auth_expired", onAuthChanged);
      window.removeEventListener("mindgard_auth_changed", onAuthChanged);
    };
  }, [userName, accountType]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      setLoginError("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
      return;
    }
    setLoginError("");
    setIsSubmittingLogin(true);
    try {
      const authData = await authService.login({
        username: loginForm.username.trim(),
        password: loginForm.password,
      });
      setIsAuthenticated(true);
      if (authData?.user?.id) setUserId(authData.user.id);
      const info = authService.getDisplayInfo(
        authData?.user?.username || loginForm.username,
        authData?.user?.roles?.join(", ") || "Member"
      );
      setDisplayName(info.name);
      setDisplayAccountType(info.type);
      setShowLoginModal(false);
      setLoginForm({ username: "", password: "" });
    } catch (err) {
      setLoginError(err?.response?.data?.message || err?.message || "Không thể đăng nhập.");
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerForm.username.trim() || !registerForm.email.trim() || !registerForm.password.trim()) {
      setLoginError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    if (registerForm.password.length < 6) {
      setLoginError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    setLoginError("");
    setIsSubmittingLogin(true);
    try {
      const authData = await authService.register({
        username: registerForm.username.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
        firstName: registerForm.firstName.trim() || "",
        lastName: registerForm.lastName.trim() || "",
      });
      setIsAuthenticated(true);
      if (authData?.user?.id) setUserId(authData.user.id);
      const info = authService.getDisplayInfo(
        authData?.user?.username || registerForm.username,
        authData?.user?.roles?.join(", ") || "Member"
      );
      setDisplayName(info.name);
      setDisplayAccountType(info.type);
      setShowLoginModal(false);
      setIsRegisterMode(false);
      setRegisterForm({ username: "", email: "", password: "", firstName: "", lastName: "" });
    } catch (err) {
      setLoginError(err?.response?.data?.message || err?.message || "Không thể đăng ký.");
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setDisplayName(userName);
    setDisplayAccountType(accountType);
  };

  // Keep component mounted while any portal modal is open,
  // otherwise opening PublicProfile/Friends would immediately unmount.
  const hasAnyOverlayOpen = showLoginModal || showPublicProfileModal || showFriendsModal;
  if (!isOpen && !hasAnyOverlayOpen) return null;

  const authMenuItem = isAuthenticated
    ? { icon: LogOut, label: "Logout", action: handleLogout }
    : { icon: LogIn, label: "Login", action: () => setShowLoginModal(true) };

  const menuItems = [
    {
      icon: Gift,
      label: isPlusUser ? "Quản lý gói Plus" : "Nâng cấp lên Plus",
      hasChevron: true,
      action: () => {
        if (isAuthenticated) {
          window.dispatchEvent(new CustomEvent('mindgard_open_subscription'));
          onClose(); // Optional: close profile menu when opening sub modal
        } else {
          setShowLoginModal(true);
        }
      }
    },
    {
      icon: User,
      label: "Public profile",
      hasChevron: true,
      action: () => {
        if (isAuthenticated && userId) {
          setShowPublicProfileModal(true);
          onClose();
        } else {
          setShowLoginModal(true);
        }
      },
      disabled: !isAuthenticated
    },
    { icon: Brain, label: "Focus mode", hasChevron: false },
    { icon: Search, label: "Find study room", hasChevron: true },
    { icon: Settings, label: "App settings", hasChevron: true },
    {
      icon: Users,
      label: "Manage friends",
      hasChevron: true,
      action: () => {
        if (isAuthenticated) {
          setShowFriendsModal(true);
          onClose();
        } else {
          setShowLoginModal(true);
        }
      },
      disabled: !isAuthenticated
    },
    { icon: null, label: "Discord", hasExternalLink: true, customIcon: "discord", dividerBefore: true },
    { icon: null, label: "Chrome extension", hasExternalLink: true, customIcon: "puzzle" },
    { icon: Grid3x3, label: "Our apps", hasChevron: true },
    { ...authMenuItem, dividerBefore: true, hasChevron: false },
  ];

  const handleItemClick = (item) => {
    console.log(`Clicked: ${item.label}`);
    if (item.action) {
      item.action();
      return;
    }
    if (item.label === 'Focus mode' && onOpenFocusMode) { onClose(); onOpenFocusMode(); }
  };

  return (
    <>
      {isOpen && (
        <div
          className={`
        absolute top-full right-0 mt-2 w-[340px] max-h-[70vh]
        bg-black/30 backdrop-blur-2xl
        rounded-xl shadow-2xl z-50
        overflow-hidden border border-white/20
        user-profile-modal
        transform transition-all duration-200 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
      `}>
          {/* Header */}
          <div className="flex items-start justify-between p-5 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-white max-w-[200px] truncate" title={displayName}>{displayName}</h2>
                {isPlusUser && (
                  <span className="bg-gradient-to-r from-orange-400 to-amber-400 text-black text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(251,146,60,0.4)]">
                    👑 PLUS
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                {displayAccountType}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors p-1"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="py-2 overflow-y-auto max-h-[calc(70vh-100px)]">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const showSeparator = item.dividerBefore;

              return (
                <div key={item.label}>
                  {showSeparator && (
                    <div className="h-px bg-white/10 mx-6 my-2" />
                  )}
                  <button
                    onClick={() => handleItemClick(item)}
                    disabled={item.disabled}
                    className={`w-full flex items-center gap-4 px-6 py-3 text-white transition-colors ${item.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-white/5"
                      }`}
                  >
                    {/* Icon */}
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {item.customIcon === "discord" ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                      ) : item.customIcon === "puzzle" ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                        </svg>
                      ) : IconComponent ? (
                        <IconComponent className="w-5 h-5" />
                      ) : null}
                    </div>

                    {/* Label */}
                    <span className="flex-1 text-left text-base">{item.label}</span>

                    {/* Action indicator */}
                    <div className="flex-shrink-0">
                      {item.hasExternalLink ? (
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      ) : item.hasChevron ? (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      ) : null}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {showLoginModal &&
            createPortal(
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center px-4 backdrop-blur-md bg-black/70"
                onClick={() => setShowLoginModal(false)}
              >
                <div
                  className="mindgard-login-modal relative w-full max-w-md rounded-2xl border border-white/15 bg-black/90 backdrop-blur-xl shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setShowLoginModal(false)}
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
                            <label className="block text-sm text-gray-300 mb-1">Họ</label>
                            <input
                              type="text"
                              value={registerForm.firstName}
                              onChange={(e) => setRegisterForm((prev) => ({ ...prev, firstName: e.target.value }))}
                              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-gray-500 focus:border-white/30 focus:outline-none"
                              placeholder="First name"
                              autoComplete="given-name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">Tên</label>
                            <input
                              type="text"
                              value={registerForm.lastName}
                              onChange={(e) => setRegisterForm((prev) => ({ ...prev, lastName: e.target.value }))}
                              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-gray-500 focus:border-white/30 focus:outline-none"
                              placeholder="Last name"
                              autoComplete="family-name"
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

                        {loginError && (
                          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                            {loginError}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmittingLogin}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-600 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmittingLogin && <Loader2 className="h-4 w-4 animate-spin" />}
                          <span>{isSubmittingLogin ? "Đang đăng ký..." : "Đăng ký"}</span>
                        </button>

                        <div className="text-center text-sm text-gray-400">
                          Đã có tài khoản?{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setIsRegisterMode(false);
                              setLoginError("");
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

                        {loginError && (
                          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                            {loginError}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmittingLogin}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-600 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmittingLogin && <Loader2 className="h-4 w-4 animate-spin" />}
                          <span>{isSubmittingLogin ? "Đang đăng nhập..." : "Đăng nhập"}</span>
                        </button>

                        <div className="text-center text-sm text-gray-400">
                          Chưa có tài khoản?{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setIsRegisterMode(true);
                              setLoginError("");
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
            )}

          <PublicProfileModal
            isOpen={showPublicProfileModal}
            onClose={() => setShowPublicProfileModal(false)}
            userId={userId}
          />

          <FriendsModal
            isOpen={showFriendsModal}
            onClose={() => setShowFriendsModal(false)}
          />

        </div>
      )}

      <PublicProfileModal
        isOpen={showPublicProfileModal}
        onClose={() => setShowPublicProfileModal(false)}
        userId={userId}
      />

      <FriendsModal
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
      />
    </>
  );
}
