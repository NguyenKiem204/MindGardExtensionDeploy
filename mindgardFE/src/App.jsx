import { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import FocusView from "./components/FocusView.jsx";
import StudyFocusUI from "./components/StudyFocusUI.jsx";
import { authService } from "./services/authService";

export default function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      setIsChecking(false);
    };
    
    checkAuth();
    // Listen for auth changes
    const onAuthChanged = () => checkAuth();
    window.addEventListener("mindgard_auth_cleared", onAuthChanged);
    window.addEventListener("mindgard_auth_expired", onAuthChanged);
    window.addEventListener("mindgard_auth_changed", onAuthChanged);
    
    return () => {
      window.removeEventListener("mindgard_auth_cleared", onAuthChanged);
      window.removeEventListener("mindgard_auth_expired", onAuthChanged);
      window.removeEventListener("mindgard_auth_changed", onAuthChanged);
    };
  }, []);

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Require authentication to use the extension
  if (!isAuthenticated) {
    // Force open login modal by triggering it through StudyFocusUI
    return <StudyFocusUI forceShowLogin={true} />;
  }

  if (hash === "#dashboard") return <Dashboard />;
  if (hash === "#focus") return <FocusView />;
  return <StudyFocusUI />;
}
